import express from 'express';
import { downloadController } from '../controllers/download.controller';

const router = express.Router();

// Download processed image route (forces download)
router.get('/:id', downloadController.downloadImage);

// View processed image route (for display in browser)
router.get('/view/:id', downloadController.viewImage);

export default router;