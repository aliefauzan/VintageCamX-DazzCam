# VintageCamX-DazzCam 📸

A professional vintage photo processing web application with authentic film stock emulation. Transform your digital photos into stunning vintage masterpieces with our advanced film studio interface.

## ✨ Features

### 🎞️ Authentic Film Emulation
- **4 Professional Film Stocks**: Classic Chrome, Pro Neg Hi, Velvia, Classic Neg
- **Film Grain Simulation**: Optional authentic texture overlay
- **Professional Color Grading**: Accurate vintage film reproduction

### 🖼️ Advanced Image Processing
- **Smart Cropping**: Multiple aspect ratios (Square, Classic 4:3, Widescreen 16:9)
- **Custom Crop Tool**: Draggable crop box with visual feedback
- **High-Quality Processing**: Sharp-based image optimization
- **Format Support**: JPEG, PNG, WebP (up to 10MB)

### 🎨 Vintage Studio Interface
- **Film Studio Aesthetic**: Authentic vintage camera-inspired design
- **Real-Time Preview**: Live crop visualization with darkroom effects
- **Professional Controls**: Film stock selection with detailed descriptions
- **Mobile-First Design**: Responsive interface for all devices

### 🚀 Modern Architecture
- **Local Storage**: No cloud dependencies, privacy-focused
- **Redis Fallback**: Automatic file-based storage when Redis unavailable
- **Real Image Display**: Actual processed images (not placeholders)
- **Production Ready**: Comprehensive error handling and logging

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Heroicons
- **Backend**: Node.js, Express, TypeScript
- **Image Processing**: Sharp (replaced OpenCV for Windows compatibility)
- **Storage**: Local file system with Redis metadata caching
- **Development**: Vite, ESLint, Hot reload

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **Redis** (optional - automatic fallback to file storage)

### 🏃‍♂️ Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/VintageCamX-DazzCam.git
   cd VintageCamX-DazzCam
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npm run dev
   # Server runs on http://localhost:8090
   ```

3. **Setup Frontend** (in new terminal):
   ```bash
   cd frontend
   npm install
   npm start
   # Client runs on http://localhost:3000
   ```

4. **Access the Application**:
   - 🌐 **Frontend**: http://localhost:3000
   - 🔧 **Backend API**: http://localhost:8090/api

### 🐳 Docker Development (Alternative)

```bash
# Start both services with Docker Compose
docker-compose -f docker-compose.dev.yml up

# Or for production
docker-compose -f docker-compose.prod.yml up -d
```

## 📁 Project Structure

```
VintageCamX-DazzCam/
├── 📂 frontend/              # React TypeScript client
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── UploadForm.tsx     # File upload interface
│   │   │   ├── ImageEditor.tsx    # Film studio interface
│   │   │   └── DownloadPage.tsx   # Results display
│   │   ├── services/         # API integration
│   │   └── styles/          # Tailwind CSS styling
│   └── package.json
├── 📂 backend/              # Node.js Express API
│   ├── controllers/         # Request handlers
│   ├── routes/             # API endpoints
│   ├── services/           # Business logic
│   │   └── image.service.ts      # Film processing engine
│   ├── uploads/            # Original images
│   ├── processed/          # Vintage processed images
│   └── metadata/           # Image metadata (JSON)
├── 📂 infra/               # Infrastructure configs
└── 📂 tests/               # Test suites
```

## 🎨 Film Stocks Available

| Film Stock | Description | Characteristics |
|------------|-------------|-----------------|
| **🎞️ Classic Chrome** | Muted, sophisticated tones | Lifted shadows, reduced contrast |
| **📸 Pro Neg Hi** | Professional portrait film | Creamy skin tones, lifted blacks |
| **🌈 Velvia** | Landscape photography film | Punchy, vibrant colors, deep shadows |
| **📜 Classic Neg** | Nostalgic vintage aesthetic | Faded colors, film-like grain |

## 🔧 API Endpoints

### Upload
- `POST /api/upload` - Upload image file (multipart/form-data)
- `GET /api/upload/preview/:id` - Get original image preview

### Processing
- `POST /api/process` - Process with aspect ratio + film stock
- `POST /api/process/custom` - Process with custom crop coordinates

### Download
- `GET /api/download/:id` - Download processed image (forces download)
- `GET /api/download/view/:id` - View processed image in browser

### Request/Response Examples

**Upload Request:**
```bash
curl -X POST http://localhost:8090/api/upload \
  -F "image=@photo.jpg"
```

**Process Request:**
```bash
curl -X POST http://localhost:8090/api/process \
  -H "Content-Type: application/json" \
  -d '{
    "imageId": "123e4567-e89b-12d3-a456-426614174000",
    "aspectRatio": "1:1",
    "filmStock": "classic_chrome",
    "addGrain": true
  }'
```

## ⚙️ Environment Configuration

### Backend (.env)
```env
PORT=8090
REDIS_URL=redis://localhost:6379
NODE_ENV=development
MAX_FILE_SIZE=10485760
CLEANUP_INTERVAL=86400000
```

### Frontend
- Automatically connects to backend on `localhost:8090`
- No additional configuration required for development

## 🏗️ Production Deployment

### Build for Production

```bash
# Build frontend
cd frontend && npm run build

# Build backend
cd backend && npm run build && npm start
```

### Docker Production

```bash
# Production deployment with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Scale backend instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Kubernetes Deployment

```bash
# Deploy to Kubernetes cluster
kubectl apply -f infra/k8s/

# Check deployment status
kubectl get pods -l app=vintagecam
```

## 🧪 Testing

```bash
# Frontend tests
cd frontend && npm test

# Backend tests  
cd backend && npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## 🔒 Security & Privacy

- **🛡️ File Validation**: Strict image format and size validation
- **🗑️ Auto Cleanup**: Images automatically deleted after 24 hours
- **🔐 EXIF Stripping**: All metadata removed from uploaded images
- **⚡ Rate Limiting**: 10 requests per minute per IP address
- **🏠 Local Storage**: No external cloud dependencies
- **🔍 Input Sanitization**: All user inputs validated and sanitized

## 🚨 Recent Major Fixes

✅ **Dependency Issues Resolved**
- Migrated from `opencv4nodejs` to `Sharp` for Windows compatibility
- Fixed face-api.js canvas dependencies
- Resolved Redis connection errors with file-based fallback

✅ **Film Stock Parameter Bug Fixed**
- **Critical**: Fixed why every image had same output
- Backend now properly receives and applies film stock parameters
- Frontend correctly sends `FilterOptions` to processing API

✅ **Image Display Enhancement**
- Added `/api/download/view/:id` endpoint for browser display
- Download page now shows actual processed images (not placeholders)
- Improved download functionality with proper file naming

✅ **Production Ready Setup**
- Comprehensive `.gitignore` for backend
- Local storage instead of Google Cloud dependency
- Professional documentation and deployment guides

## 📋 Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check if port 8090 is available
netstat -an | findstr :8090

# Kill process using port
npx kill-port 8090
```

**Images not processing:**
```bash
# Check backend logs
cd backend && npm run dev

# Verify uploads directory exists
mkdir -p uploads processed metadata
```

**Frontend can't connect to backend:**
- Ensure backend is running on port 8090
- Check API_URL in `frontend/src/services/api.ts`
- Verify CORS settings in backend

## 🔮 Future Improvements

### 🎯 Short-term Enhancements (Next 3-6 months)

#### 🎞️ **Extended Film Stock Library**
- **Additional Vintage Films**: Kodak Portra, Fuji 400H, Ilford HP5 (B&W)
- **Instant Film Emulation**: Polaroid SX-70, Instax styles with border effects
- **Custom Film Profiles**: User-uploadable LUT (Look-Up Table) support
- **Film Degradation Effects**: Scratches, dust, light leaks, expired film looks

#### 🎨 **Advanced Processing Features**
- **AI-Powered Auto-Crop**: Intelligent subject detection and composition
- **Batch Processing**: Multiple image upload and processing queue
- **Real-time Filter Preview**: Live preview while adjusting film stock settings
- **Advanced Grain Control**: Adjustable grain intensity, size, and pattern
- **Color Temperature Adjustment**: Warm/cool tone fine-tuning per film stock

#### 🖥️ **User Experience Improvements**
- **Drag & Drop Enhancement**: Multi-file drag and drop with progress indicators
- **Processing History**: Save and revisit previous edits and settings
- **Preset Management**: Save custom filter combinations as user presets
- **Keyboard Shortcuts**: Professional workflow hotkeys for power users
- **Progress Indicators**: Real-time processing status with estimated completion

#### 📱 **Mobile & PWA Features**
- **Progressive Web App**: Offline capability and app-like mobile experience
- **Camera Integration**: Direct photo capture from mobile devices
- **Touch Optimizations**: Improved touch controls for crop and adjustment tools
- **Mobile-Specific Layouts**: Optimized interface for small screens

### 🚀 Medium-term Goals (6-12 months)

#### 👤 **User Accounts & Personalization**
- **User Registration**: Account creation with email verification
- **Personal Galleries**: Private image collections and albums
- **Social Features**: Share processed images with community
- **Subscription Tiers**: Premium features (additional film stocks, batch processing)
- **Usage Analytics**: Personal processing statistics and history

#### 🤖 **AI & Machine Learning**
- **Intelligent Film Selection**: AI suggests best film stock based on image content
- **Auto-Enhancement**: Smart exposure and color correction before vintage processing
- **Face Detection Optimization**: Better portrait-specific film stock recommendations
- **Content-Aware Cropping**: AI-powered composition suggestions

#### 🎛️ **Professional Tools**
- **Advanced Color Grading**: Professional-grade HSL adjustments per film stock
- **Curve Adjustments**: Custom tone curves for each film emulation
- **Masking Tools**: Selective adjustments to specific image areas
- **RAW File Support**: Process CR2, NEF, ARW, and other RAW formats
- **Watermark System**: Custom watermarks for professional photographers

#### 🔗 **Integrations & APIs**
- **Cloud Storage Integration**: Google Drive, Dropbox, OneDrive sync
- **Social Media Auto-Share**: Direct posting to Instagram, Facebook, Twitter
- **Photography Platform APIs**: Integration with Flickr, 500px, SmugMug
- **Adobe Lightroom Plugin**: Direct export from Lightroom to VintageCamX
- **Mobile SDK**: API for third-party mobile app integration

### 🌟 Long-term Vision (12+ months)

#### 🎬 **Video Processing**
- **Vintage Video Filters**: Apply film stock emulation to video files
- **Cine Film Emulation**: 16mm, 35mm film characteristics for video
- **Batch Video Processing**: Multiple video file processing queue
- **Video Export Options**: Various formats and quality settings

#### 🌐 **Enterprise & Professional Features**
- **White-label Solution**: Customizable branding for photography studios
- **API Marketplace**: Public API for developers and photography apps
- **Bulk Licensing**: Enterprise pricing for high-volume usage
- **Professional Dashboard**: Advanced analytics and usage reporting
- **Custom Film Stock Creation**: Tools for photographers to create signature looks

#### 🔬 **Research & Development**
- **Film Chemistry Simulation**: Physics-based film grain and color reproduction
- **Machine Learning Training**: Custom models trained on actual film scans
- **Real Film Scanning Integration**: Partnership with film labs for authentic references
- **AR/VR Integration**: Virtual darkroom experience with VR headsets

#### 🌍 **Global & Accessibility**
- **Multi-language Support**: Interface translation for global audience
- **Accessibility Compliance**: WCAG 2.1 AA compliance for all users
- **Offline Desktop App**: Electron-based desktop application
- **Educational Partnerships**: Integration with photography schools and courses

### 🛠️ **Technical Roadmap**

#### 🔧 **Performance & Scalability**
- **WebAssembly Integration**: Faster client-side image processing
- **CDN Implementation**: Global content delivery for faster load times
- **Microservices Architecture**: Separate services for different processing types
- **Kubernetes Orchestration**: Auto-scaling based on processing demand
- **GPU Acceleration**: Hardware-accelerated image processing

#### 🔐 **Security & Compliance**
- **GDPR Compliance**: Enhanced data protection and user rights
- **SOC 2 Certification**: Enterprise-grade security compliance
- **End-to-End Encryption**: Client-side encryption for sensitive images
- **Advanced Rate Limiting**: DDoS protection and abuse prevention
- **Audit Logging**: Comprehensive security and access logging

#### 📊 **Analytics & Monitoring**
- **Real-time Metrics**: Processing performance and user behavior analytics
- **A/B Testing Framework**: Continuous UX improvement through testing
- **Error Tracking**: Advanced error reporting and performance monitoring
- **Business Intelligence**: User engagement and feature usage insights

---

*This roadmap is subject to change based on user feedback, market demands, and technical feasibility. Priority will be given to features most requested by our community.*

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 🙏 Acknowledgments

- Sharp.js team for excellent image processing library
- React team for the robust frontend framework  
- Tailwind CSS for beautiful utility-first styling
- Film photography community for color grading inspiration

---

## 🔗 Links

- **Demo**: [Live Application](https://vintagecam.example.com) // not yet, soon
- **Documentation**: [Full API Docs](./backend/README.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/VintageCamX-DazzCam/issues)

**Built with ❤️ for photography enthusiasts**