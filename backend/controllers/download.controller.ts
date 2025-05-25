import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

// Define storage paths
const PROCESSED_DIR = path.join(__dirname, '../processed');

// Ensure directory exists
if (!fs.existsSync(PROCESSED_DIR)) {
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}

export const downloadController = {
  downloadImage: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Image ID is required' });
      }

      // Get processed image metadata from Redis
      const redis = req.app.locals.redis;
      let imageData;
      
      try {
        imageData = await redis.get(`processed:${id}`);
        
        if (!imageData) {
          console.log(`Processed image metadata not found in storage for ID: ${id}`);
          
          // Check if the file exists directly in processed directory as fallback
          const possibleFiles = fs.readdirSync(PROCESSED_DIR)
            .filter(filename => filename.startsWith(id));
          
          if (possibleFiles.length > 0) {
            console.log(`Found file in processed directory: ${possibleFiles[0]}`);
            
            const filePath = path.join(PROCESSED_DIR, possibleFiles[0]);
            
            // Create metadata on the fly
            imageData = JSON.stringify({
              id,
              path: filePath,
              processedTime: new Date().toISOString(),
            });
            
            // Store for future use
            await redis.set(`processed:${id}`, imageData, {
              EX: 24 * 60 * 60 // 24 hours
            });
          } else {
            return res.status(404).json({ error: 'Processed image not found' });
          }
        }
      } catch (storageError) {
        console.error('Error retrieving processed image metadata:', storageError);
        return res.status(500).json({ error: 'Failed to retrieve processed image metadata' });
      }

      const imageInfo = JSON.parse(imageData);
      const filePath = imageInfo.path;
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Image file not found' });
      }
      
      // Set appropriate headers for download
      res.setHeader('Content-Disposition', `attachment; filename="vintagecam-${id}${path.extname(filePath)}"`);
      res.setHeader('Content-Type', path.extname(filePath) === '.png' ? 'image/png' : 'image/jpeg');
      
      // Stream the file to response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (err: NodeJS.ErrnoException) => {
        console.error('File stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming file' });
        }
      });
    } catch (error) {
      console.error('Download error:', error);
      return res.status(500).json({ error: 'Failed to download image' });
    }
  },

  viewImage: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Image ID is required' });
      }

      // Get processed image metadata from Redis
      const redis = req.app.locals.redis;
      let imageData;
      
      try {
        imageData = await redis.get(`processed:${id}`);
        
        if (!imageData) {
          console.log(`Processed image metadata not found in storage for ID: ${id}`);
          
          // Check if the file exists directly in processed directory as fallback
          const possibleFiles = fs.readdirSync(PROCESSED_DIR)
            .filter(filename => filename.startsWith(id));
          
          if (possibleFiles.length > 0) {
            console.log(`Found file in processed directory: ${possibleFiles[0]}`);
            
            const filePath = path.join(PROCESSED_DIR, possibleFiles[0]);
            
            // Create metadata on the fly
            imageData = JSON.stringify({
              id,
              path: filePath,
              processedTime: new Date().toISOString(),
            });
            
            // Store for future use
            await redis.set(`processed:${id}`, imageData, {
              EX: 24 * 60 * 60 // 24 hours
            });
          } else {
            return res.status(404).json({ error: 'Processed image not found' });
          }
        }
      } catch (storageError) {
        console.error('Error retrieving processed image metadata:', storageError);
        return res.status(500).json({ error: 'Failed to retrieve processed image metadata' });
      }

      const imageInfo = JSON.parse(imageData);
      const filePath = imageInfo.path;
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Image file not found' });
      }
      
      // Set appropriate headers for display (not download)
      res.setHeader('Content-Type', path.extname(filePath) === '.png' ? 'image/png' : 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      // Send the file directly (without forcing download)
      res.sendFile(path.resolve(filePath));
      
    } catch (error) {
      console.error('View image error:', error);
      return res.status(500).json({ error: 'Failed to serve image' });
    }
  },
};