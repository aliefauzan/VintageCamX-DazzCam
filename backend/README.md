# VintageCamX-DazzCam Backend

A professional vintage photo processing backend built with Node.js, TypeScript, and Sharp.

## Features

- **Image Upload & Processing**: Multi-format image upload with EXIF stripping
- **Vintage Film Emulation**: 4 authentic film stock effects (Classic Chrome, Pro Neg Hi, Velvia, Classic Neg)
- **Smart Cropping**: Multiple aspect ratios and custom crop support
- **Local Storage**: File-based storage with Redis fallback for metadata
- **Image Optimization**: Sharp-based processing for high-quality results

## Core Architecture

### Essential Files

```
backend/
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Environment variables template
├── src/
│   └── index.ts          # Main application entry point
├── controllers/          # Request handlers
│   ├── upload.controller.ts
│   ├── process.controller.ts
│   └── download.controller.ts
├── routes/              # API route definitions
│   ├── upload.routes.ts
│   ├── process.routes.ts
│   └── download.routes.ts
└── services/            # Business logic
    └── image.service.ts
```

## API Endpoints

### Upload
- `POST /api/upload` - Upload image file
- `GET /api/upload/preview/:id` - Get original image preview

### Processing
- `POST /api/process` - Process with aspect ratio cropping
- `POST /api/process/custom` - Process with custom crop coordinates

### Download
- `GET /api/download/:id` - Download processed image (forces download)
- `GET /api/download/view/:id` - View processed image (browser display)

## Film Stocks

1. **Classic Chrome** - Muted, sophisticated tones with lifted shadows
2. **Pro Neg Hi** - Creamy skin tones with lifted blacks  
3. **Velvia** - Punchy, vibrant colors with deep shadows
4. **Classic Neg** - Faded, nostalgic aesthetic

## Storage System

- **Local Files**: Images stored in `uploads/` and `processed/` directories
- **Metadata**: JSON metadata stored in Redis with file-based fallback
- **Automatic Cleanup**: 24-hour expiration for processed images

## Installation

```bash
npm install
npm run build
npm start
```

## Environment Variables

Create `.env` file:
```
PORT=8090
REDIS_URL=redis://localhost:6379
NODE_ENV=production
```

## Production Ready

- TypeScript compilation
- Error handling and logging
- File validation and size limits
- Memory-efficient image processing
- Graceful Redis connection fallback

## Dependencies

- **Express**: Web framework
- **Sharp**: High-performance image processing
- **Redis**: Metadata caching
- **Multer**: File upload handling
- **UUID**: Unique identifier generation

---

**Note**: This backend is optimized for production use with local storage. Currently No external dependencies on cloud services required.
