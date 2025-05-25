import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { imageService } from '../services/image.service';

// Define storage paths
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const PROCESSED_DIR = path.join(__dirname, '../processed');

// Ensure directories exist
[UPLOADS_DIR, PROCESSED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export const processController = {  processImage: async (req: Request, res: Response) => {
    try {      const { imageId, aspectRatio = '1:1', filmStock = 'classic_chrome', filterOptions } = req.body;

      if (!imageId) {
        return res.status(400).json({ error: 'Image ID is required' });
      }

      // Use filmStock from request body directly, with filterOptions as fallback
      const selectedFilmStock = filmStock || filterOptions?.filmStock || 'classic_chrome';
      console.log(`Processing image ${imageId} with film stock: ${selectedFilmStock}`);
      
      // Check memory usage before processing
      if (typeof req.app.locals.checkMemoryUsage === 'function' && !req.app.locals.checkMemoryUsage()) {
        return res.status(503).json({ 
          error: 'Server is currently under high load. Please try again later.',
          retryAfter: 30 // Suggest retry after 30 seconds
        });
      }

      // Get image metadata from Redis
      const redis = req.app.locals.redis;
      let imageData;
      
      try {
        imageData = await redis.get(`image:${imageId}`);
        
        if (!imageData) {
          console.log(`Image metadata not found in storage for ID: ${imageId}`);
          
          // Check if the file exists directly in uploads directory as fallback
          const possibleFiles = fs.readdirSync(UPLOADS_DIR)
            .filter(filename => filename.startsWith(imageId));
          
          if (possibleFiles.length > 0) {
            console.log(`Found file in uploads directory: ${possibleFiles[0]}`);
            
            const originalPath = path.join(UPLOADS_DIR, possibleFiles[0]);
            const fileExt = path.extname(possibleFiles[0]);
            
            // Create metadata on the fly
            imageData = JSON.stringify({
              id: imageId,
              originalName: possibleFiles[0],
              path: originalPath,
              localPath: true,
              uploadTime: new Date().toISOString(),
            });
            
            // Store for future use
            await redis.set(`image:${imageId}`, imageData, {
              EX: 24 * 60 * 60 // 24 hours
            });
          } else {
            return res.status(404).json({ error: 'Image not found' });
          }
        }
      } catch (storageError) {
        console.error('Error retrieving image metadata:', storageError);
        return res.status(500).json({ error: 'Failed to retrieve image metadata' });
      }

      const imageInfo = JSON.parse(imageData);
      const originalPath = imageInfo.path;
      const fileExt = path.extname(originalPath);
      
      // Create temp directory for processing
      const tempDir = path.join(os.tmpdir(), uuidv4());
      fs.mkdirSync(tempDir, { recursive: true });
      
      const tempInputPath = path.join(tempDir, `input${fileExt}`);
      const tempOutputPath = path.join(tempDir, `output${fileExt}`);
        // Copy image for processing
      fs.copyFileSync(originalPath, tempInputPath);
        // Process image with smart crop and vintage filter
      await imageService.processImage(tempInputPath, tempOutputPath, { aspectRatio, filmStock: selectedFilmStock });
      
      // Generate ID for processed image
      const processedId = uuidv4();
      const processedPath = path.join(PROCESSED_DIR, `${processedId}${fileExt}`);
      
      // Save to processed directory
      fs.copyFileSync(tempOutputPath, processedPath);
      
      // Store processed image metadata in Redis
      try {
        await redis.set(`processed:${processedId}`, JSON.stringify({
          id: processedId,
          originalId: imageId,
          path: processedPath,
          localPath: true,
          aspectRatio,
          filter: 'vintage',
          processedTime: new Date().toISOString(),
          expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }), {
          EX: 24 * 60 * 60 // 24 hours expiry
        });
        
        console.log(`Processed image metadata stored for ID: ${processedId}`);
      } catch (storageError) {
        console.error('Error storing processed image metadata:', storageError);
        // Continue anyway - we still have the file on disk
      }
      
      // Clean up temp files
      fs.unlinkSync(tempInputPath);
      fs.unlinkSync(tempOutputPath);
      fs.rmdirSync(tempDir);
      
      return res.status(200).json({
        id: processedId,
        message: 'Image processed successfully',
      });
    } catch (error) {
      console.error('Processing error:', error);
      return res.status(500).json({ error: 'Failed to process image' });
    }
  },
  processCustomCrop: async (req: Request, res: Response) => {
    try {
      const { imageId, cropData, filmStock = 'classic_chrome', filterOptions } = req.body;
      
      if (!imageId || !cropData) {
        return res.status(400).json({ error: 'Image ID and crop data are required' });
      }

      // Use filmStock from request body directly, with filterOptions as fallback
      const selectedFilmStock = filmStock || filterOptions?.filmStock || 'classic_chrome';
      console.log(`Processing custom crop for image ${imageId} with film stock: ${selectedFilmStock}`);
      
      // Validate crop data
      if (typeof cropData !== 'object' || 
          !('x' in cropData) || !('y' in cropData) || 
          !('width' in cropData) || !('height' in cropData) ||
          typeof cropData.x !== 'number' || typeof cropData.y !== 'number' ||
          typeof cropData.width !== 'number' || typeof cropData.height !== 'number' ||
          cropData.width <= 0 || cropData.height <= 0) {
        return res.status(400).json({ 
          error: 'Invalid crop data. Must include x, y, width, and height as positive numbers' 
        });
      }
      
      // Check memory usage before processing
      if (typeof req.app.locals.checkMemoryUsage === 'function' && !req.app.locals.checkMemoryUsage()) {
        return res.status(503).json({ 
          error: 'Server is currently under high load. Please try again later.',
          retryAfter: 30 // Suggest retry after 30 seconds
        });
      }
      
      // Get image metadata from Redis
      const redis = req.app.locals.redis;
      let imageData;
      
      try {
        imageData = await redis.get(`image:${imageId}`);
        
        if (!imageData) {
          console.log(`Image metadata not found in storage for ID: ${imageId}`);
          
          // Check if the file exists directly in uploads directory as fallback
          const possibleFiles = fs.readdirSync(UPLOADS_DIR)
            .filter(filename => filename.startsWith(imageId));
          
          if (possibleFiles.length > 0) {
            console.log(`Found file in uploads directory: ${possibleFiles[0]}`);
            
            const originalPath = path.join(UPLOADS_DIR, possibleFiles[0]);
            const fileExt = path.extname(possibleFiles[0]);
            
            // Create metadata on the fly
            imageData = JSON.stringify({
              id: imageId,
              originalName: possibleFiles[0],
              path: originalPath,
              localPath: true,
              uploadTime: new Date().toISOString(),
            });
            
            // Store for future use
            await redis.set(`image:${imageId}`, imageData, {
              EX: 24 * 60 * 60 // 24 hours
            });
          } else {
            return res.status(404).json({ error: 'Image not found' });
          }
        }
      } catch (storageError) {
        console.error('Error retrieving image metadata:', storageError);
        return res.status(500).json({ error: 'Failed to retrieve image metadata' });
      }

      const imageInfo = JSON.parse(imageData);
      const originalPath = imageInfo.path;
      const fileExt = path.extname(originalPath);
      
      // Create temp directory for processing
      const tempDir = path.join(os.tmpdir(), uuidv4());
      fs.mkdirSync(tempDir, { recursive: true });
      
      const tempInputPath = path.join(tempDir, `input${fileExt}`);
      const tempOutputPath = path.join(tempDir, `output${fileExt}`);
      
      // Copy image for processing
      fs.copyFileSync(originalPath, tempInputPath);      // Process image with custom crop and vintage filter
      await imageService.processImageWithCustomCrop(tempInputPath, tempOutputPath, cropData, selectedFilmStock);
      
      // Generate ID for processed image
      const processedId = uuidv4();
      const processedPath = path.join(PROCESSED_DIR, `${processedId}${fileExt}`);
      
      // Save to processed directory
      fs.copyFileSync(tempOutputPath, processedPath);
      
      // Store processed image metadata in Redis
      try {
        await redis.set(`processed:${processedId}`, JSON.stringify({
          id: processedId,
          originalId: imageId,
          path: processedPath,
          localPath: true,
          cropData,
          filter: 'vintage',
          processedTime: new Date().toISOString(),
          expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }), {
          EX: 24 * 60 * 60 // 24 hours expiry
        });
      } catch (storageError) {
        console.error('Error storing processed image metadata:', storageError);
        return res.status(500).json({ error: 'Failed to store processed image metadata' });
      }
      
      // Clean up temp files
      fs.unlinkSync(tempInputPath);
      fs.unlinkSync(tempOutputPath);
      fs.rmdirSync(tempDir);
      
      return res.status(200).json({
        id: processedId,
        message: 'Image processed successfully with custom crop',
      });
    } catch (error) {
      console.error('Custom processing error:', error);
      return res.status(500).json({ error: 'Failed to process image with custom crop' });
    }
  },
};