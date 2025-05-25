import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
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

export const uploadController = {
  uploadImage: async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Generate unique ID for the image
      const imageId = uuidv4();
      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname);
      
      // The final path where we'll store the uploaded file
      const storagePath = path.join(UPLOADS_DIR, `${imageId}${fileExt}`);

      // Strip EXIF metadata
      await imageService.stripExifMetadata(filePath);
      
      // If the file wasn't uploaded directly to the final location, move it
      if (filePath !== storagePath) {
        fs.copyFileSync(filePath, storagePath);
        fs.unlinkSync(filePath);
      }      // Store metadata in Redis for quick access
      const redis = req.app.locals.redis;
      const imageData = {
        id: imageId,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: storagePath,
        localPath: true,
        uploadTime: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      
      try {
        await redis.set(`image:${imageId}`, JSON.stringify(imageData), {
          EX: 24 * 60 * 60 // 24 hours expiry in Redis
        });
        
        console.log(`Metadata stored for image ${imageId} using ${req.app.locals.useFileStorage ? 'file storage' : 'Redis'}`);
      } catch (storageError) {
        console.error('Error storing metadata:', storageError);
        // Continue anyway - we still have the file on disk
      }

      return res.status(201).json({
        id: imageId,
        message: 'Image uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: 'Failed to upload image' });
    }
  },
  
  getImagePreview: async (req: Request, res: Response) => {
    try {
      const imageId = req.params.id;
      
      if (!imageId) {
        return res.status(400).json({ error: 'Image ID is required' });
      }
      
      // Try to get image metadata from Redis
      const redis = req.app.locals.redis;
      let imageData;
      
      try {
        imageData = await redis.get(`image:${imageId}`);
        
        if (!imageData) {
          console.log(`Image metadata not found for ID: ${imageId}`);
          
          // Try to find the image file directly
          const files = fs.readdirSync(UPLOADS_DIR);
          const imageFile = files.find(file => file.startsWith(imageId));
          
          if (!imageFile) {
            return res.status(404).json({ error: 'Image not found' });
          }
          
          const filePath = path.join(UPLOADS_DIR, imageFile);
          
          // Send the file directly
          return res.sendFile(filePath);
        }
      } catch (error) {
        console.error('Error retrieving image metadata:', error);
      }
      
      // If metadata was found, parse it and send the file
      if (imageData) {
        const parsedData = JSON.parse(imageData);
        const filePath = parsedData.path;
        
        if (fs.existsSync(filePath)) {
          return res.sendFile(filePath);
        }
      }
      
      // If we got here, we couldn't find the image
      return res.status(404).json({ error: 'Image not found' });
    } catch (error) {
      console.error('Error serving image preview:', error);
      return res.status(500).json({ error: 'Failed to retrieve image' });
    }
  },
};