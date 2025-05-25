import express from 'express';
import { processController } from '../controllers/process.controller';

const router = express.Router();

// Process image route
router.post('/', processController.processImage);

// Process with custom crop parameters
router.post('/custom', processController.processCustomCrop);

export default router; 