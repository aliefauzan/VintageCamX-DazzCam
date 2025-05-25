import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import Jimp from 'jimp';

// Import local file storage alternative
import { FileStorage, StorageClient } from '../services/file-storage';

// Define processing directories
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const PROCESSED_DIR = path.join(__dirname, '../processed');

// Attempt to fix Sharp loading issues on Windows
try {
  const sharp = require('sharp');
  console.log('Sharp loaded successfully:', sharp.versions);
} catch (err) {
  console.error('Error loading Sharp library:', err);
  
  // Try to set the libvips directory for Windows
  try {
    process.env.SHARP_IGNORE_GLOBAL_LIBVIPS = '1';
    process.env.PATH = `${process.env.PATH};${path.join(__dirname, '../node_modules/sharp/vendor')}`;
    console.log('Applied Sharp Windows fix');
  } catch (fixErr) {
    console.error('Failed to apply Sharp fix:', fixErr);
  }
}

// Import routes
import uploadRoutes from '../routes/upload.routes';
import processRoutes from '../routes/process.routes';
import downloadRoutes from '../routes/download.routes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = parseInt(process.env.PORT || '8090', 10);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' } // Allow images to be served cross-origin
})); 

// Configure CORS properly
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // Cache preflight requests for 24 hours
}));
app.use(express.json());
app.use(morgan('dev')); // Logging

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX || '10'), // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});

// Apply rate limiting to all API routes
app.use('/api', limiter);

// Set memory usage threshold for monitoring (80% of available memory)
const MEMORY_THRESHOLD = 0.95;

// Memory usage monitoring function
const checkMemoryUsage = (): boolean => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemoryPercentage = (totalMemory - freeMemory) / totalMemory;
  
  console.log(`Memory usage check: ${(usedMemoryPercentage * 100).toFixed(1)}% used`);
  
  // Use a higher threshold to avoid false positives
  return usedMemoryPercentage < MEMORY_THRESHOLD;
};

// Try to use Redis if available, otherwise use file storage
let redisClient: StorageClient;
let useFileStorage = false;

// Start with file storage as default to avoid timing issues
redisClient = new FileStorage();
useFileStorage = true;

// Try to initialize Redis if it's available
const initRedis = async (): Promise<boolean> => {
  try {
    console.log('Attempting to connect to Redis...');
    
    // Create Redis client
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000, // 5 second timeout
        reconnectStrategy: false // Don't auto-reconnect if fails
      }
    });
    
    // Set up error handler
    client.on('error', (err: Error) => {
      console.error('Redis error:', err);
      if (!useFileStorage) {
        console.log('Redis error occurred. Falling back to file storage...');
        redisClient = new FileStorage();
        useFileStorage = true;
        app.locals.redis = redisClient;
      }
    });
    
    // Try to connect with timeout
    const connectPromise = client.connect();
    
    // Add timeout to avoid blocking the app
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redis connection timeout')), 5000);
    });
    
    // Wait for connection or timeout
    await Promise.race([connectPromise, timeoutPromise]);
    
    console.log('Redis client connected successfully');
    redisClient = client;
    useFileStorage = false;
    app.locals.redis = redisClient;
    
    // Test connection by setting a test key
    await redisClient.set('test:connection', 'ok');
    console.log('Redis connection verified');
    
    return true;
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Could not connect to Redis:', err.message);
    console.log('Using file storage as fallback...');
    redisClient = new FileStorage();
    useFileStorage = true;
    app.locals.redis = redisClient;
    
    return false;
  }
};

// Initialize Redis in the background
initRedis().catch((error: unknown) => {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error('Redis initialization error:', err);
});

// Make storage client and utility functions available to routes
app.locals.redis = redisClient;
app.locals.redisAvailable = true; // Always available (through FileStorage if Redis fails)
app.locals.useFileStorage = useFileStorage;
app.locals.checkMemoryUsage = checkMemoryUsage;

// Routes - no need for requireRedis middleware now
app.use('/api/upload', uploadRoutes);
app.use('/api/process', processRoutes);
app.use('/api/download', downloadRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemoryPercentage = ((totalMemory - freeMemory) / totalMemory) * 100;
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      storage: {
        type: useFileStorage ? 'file-storage' : 'redis',
        status: 'ok',
        fallback: useFileStorage ? 'active' : 'standby'
      },
      memory: {
        total: Math.round(totalMemory / (1024 * 1024)) + 'MB',
        free: Math.round(freeMemory / (1024 * 1024)) + 'MB',
        used: usedMemoryPercentage.toFixed(1) + '%',
        status: usedMemoryPercentage < (MEMORY_THRESHOLD * 100) ? 'ok' : 'high'
      }
    }
  };
  
  res.status(200).json(health);
});

// Storage status endpoint - specifically for client configuration
app.get('/api/storage-status', (req, res) => {
  res.status(200).json({
    is_enabled_storage: useFileStorage ? 'file' : 'redis',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// Test storage endpoint for debugging
app.get('/api/test-storage', async (req, res) => {
  try {
    const testKey = `test:${Date.now()}`;
    const testValue = JSON.stringify({
      test: true,
      timestamp: new Date().toISOString(),
      random: Math.random().toString(36).substring(2)
    });

    // Set value in storage
    await redisClient.set(testKey, testValue, { EX: 60 }); // 1 minute expiry
    
    // Retrieve value
    const retrieved = await redisClient.get(testKey);
    
    res.status(200).json({
      success: true,
      storageType: useFileStorage ? 'file-storage' : 'redis',
      testKey,
      stored: testValue,
      retrieved,
      match: testValue === retrieved
    });
  } catch (error) {
    console.error('Storage test error:', error);
    res.status(500).json({
      success: false,
      storageType: useFileStorage ? 'file-storage' : 'redis',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Special middleware for handling 503 Service Unavailable errors
app.use('/api/process', (req, res, next) => {
  // Simple check to ensure directories exist
  try {
    // Create directories if they don't exist
    [UPLOADS_DIR, PROCESSED_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Memory check but with a higher threshold to prevent unnecessary 503s
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemoryPercentage = (totalMemory - freeMemory) / totalMemory;
    
    // Only block if memory usage is extremely high (using the same threshold)
    if (usedMemoryPercentage >= MEMORY_THRESHOLD) {
      console.error(`Extreme memory usage (${(usedMemoryPercentage * 100).toFixed(1)}%). Request rejected.`);
      return res.status(503).json({ 
        error: 'Server is under extreme memory pressure. Please try again later.',
        retryAfter: 30
      });
    }
    
    // Continue with the request
    next();
  } catch (err) {
    // Log the error but let the request through anyway
    console.error('Warning in process middleware:', err);
    next();
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Start server with automatic port fallback
const startServer = (initialPort: number, maxAttempts = 5) => {
  let currentAttempt = 0;
  let currentPort = initialPort;
  
  const attemptListen = () => {
    const server = app.listen(currentPort)
      .on('listening', () => {
        console.log(`Server running on port ${currentPort}`);
        console.log(`Using ${useFileStorage ? 'file storage' : 'Redis'} for metadata`);
        console.log(`API available at http://localhost:${currentPort}/api`);
        console.log(`Health check at http://localhost:${currentPort}/health`);
      })
      .on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' && currentAttempt < maxAttempts) {
          console.warn(`Port ${currentPort} is already in use, trying next port...`);
          server.close();
          currentPort++;
          currentAttempt++;
          attemptListen();
        } else {
          console.error(`Failed to start server after ${currentAttempt} attempts:`, err);
          process.exit(1);
        }
      });
  };
  
  attemptListen();
};

// Start server with the configured port and up to 5 attempts
startServer(port, 5);

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (redisClient && typeof redisClient.disconnect === 'function') {
    await redisClient.disconnect();
  }
  process.exit(0);
});

// Create temporary directories if they don't exist
const tempDirs = [
  path.join(__dirname, '../uploads'),
  path.join(__dirname, '../temp'),
  path.join(__dirname, '../processed'),
  path.join(__dirname, '../metadata')
];

tempDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export default app;