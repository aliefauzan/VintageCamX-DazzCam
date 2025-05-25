import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AspectRatioMap {
  [key: string]: number;
}

interface VintageSettings {
  brightness: number;
  saturation: number;
  hue: number;
  gamma: number;
  contrast: { lower: number; upper: number };
  warmth?: { r: number; g: number; b: number };
  channelMix?: [number, number, number][];
  blur?: number;
  sharpen?: { sigma: number; m1: number; m2: number };
}

export const imageService = {
  /**
   * Strip EXIF metadata from an image while preserving color profiles
   */
  stripExifMetadata: async (imagePath: string): Promise<void> => {
    try {
      const buffer = fs.readFileSync(imagePath);
      const imageWithoutExif = await sharp(buffer)
        .withMetadata({})
        .toBuffer();
      fs.writeFileSync(imagePath, imageWithoutExif);
      console.log(`EXIF metadata stripped from ${imagePath}`);
    } catch (err) {
      console.error(`Error stripping EXIF metadata: ${err}`);
    }
  },

  /**
   * Enhanced Fujifilm vintage filter with authentic film characteristics
   */
  applyFujifilmVintageFilter: (
    image: sharp.Sharp,
    filmStock: 'classic_chrome' | 'pro_neg_hi' | 'velvia' | 'classic_neg' | 'portra_400' | 'kodachrome' = 'classic_chrome'
  ): sharp.Sharp => {
    const filmSettings: Record<string, VintageSettings> = {      classic_chrome: {
        brightness: 1.02,
        saturation: 0.75,
        hue: 3,
        gamma: 1.25,
        contrast: { lower: 8, upper: 94 },
        warmth: { r: 252, g: 248, b: 245 },
        channelMix: [
          [1.02, 0.03, -0.02],
          [-0.02, 1.0, 0.02],
          [0.01, -0.01, 0.98]
        ] as [number, number, number][],
        blur: 0.3,
        sharpen: { sigma: 0.4, m1: 0.5, m2: 1.8 }
      },      pro_neg_hi: {
        brightness: 1.05,
        saturation: 0.88,
        hue: 5,
        gamma: 1.2,
        contrast: { lower: 12, upper: 92 },
        warmth: { r: 255, g: 251, b: 247 },
        channelMix: [
          [1.0, 0.02, -0.01],
          [-0.01, 1.01, 0.01],
          [0.02, -0.02, 1.0]
        ] as [number, number, number][],
        blur: 0.3,
        sharpen: { sigma: 0.3, m1: 0.8, m2: 1.5 }
      },      velvia: {
        brightness: 0.98,
        saturation: 1.35,
        hue: -2,
        gamma: 1.1,
        contrast: { lower: 2, upper: 98 },
        warmth: { r: 255, g: 252, b: 248 },
        channelMix: [
          [1.0, 0.0, 0.02],
          [0.0, 1.05, 0.0],
          [0.02, 0.0, 1.08]
        ] as [number, number, number][],
        blur: 0.3,
        sharpen: { sigma: 0.6, m1: 0.9, m2: 2.2 }
      },
      classic_neg: {
        brightness: 1.08,
        saturation: 0.65,
        hue: 12,
        gamma: 1.4,
        contrast: { lower: 18, upper: 88 },
        warmth: { r: 255, g: 248, b: 235 },
        channelMix: [
          [1.0, -0.05, 0.08],
          [0.05, 1.0, -0.03],
          [-0.02, 0.08, 1.0]
        ] as [number, number, number][],
        blur: 0.35,
        sharpen: { sigma: 0.3, m1: 0.4, m2: 1.2 }
      },      portra_400: {
        brightness: 1.03,
        saturation: 0.92,
        hue: 8,
        gamma: 1.15,
        contrast: { lower: 6, upper: 96 },
        warmth: { r: 255, g: 250, b: 242 },
        channelMix: [
          [1.0, 0.02, 0.01],
          [0.01, 1.0, 0.0],
          [0.02, 0.01, 0.98]
        ] as [number, number, number][],
        blur: 0.3,
        sharpen: { sigma: 0.4, m1: 0.6, m2: 1.6 }
      },
      kodachrome: {
        brightness: 1.0,
        saturation: 1.2,
        hue: -5,
        gamma: 1.05,
        contrast: { lower: 3, upper: 97 },
        warmth: { r: 255, g: 248, b: 240 },
        channelMix: [
          [1.05, 0.0, -0.02],
          [0.0, 1.02, 0.02],
          [0.05, 0.0, 1.08]
        ] as [number, number, number][],
        blur: 0.15,
        sharpen: { sigma: 0.5, m1: 0.8, m2: 2.0 }
      }
    };

    const settings = filmSettings[filmStock];
    let processedImage = image;

    // Apply modulation (brightness, saturation, hue)
    processedImage = processedImage.modulate({
      brightness: settings.brightness,
      saturation: settings.saturation,
      hue: settings.hue
    });

    // Apply gamma correction
    processedImage = processedImage.gamma(settings.gamma);

    // Apply color warmth/tint using linear transformation
    if (settings.warmth) {
      const { r, g, b } = settings.warmth;
      processedImage = processedImage.linear(
        [r/255, g/255, b/255],
        [0, 0, 0]
      );
    }

    // Apply channel mixing for color character
    if (settings.channelMix && settings.channelMix.length === 3 && settings.channelMix.every(row => row.length === 3)) {
      processedImage = processedImage.recomb(settings.channelMix as [ [number, number, number], [number, number, number], [number, number, number] ]);
    }

    // Apply contrast normalization
    processedImage = processedImage.normalise(settings.contrast);

    // Apply sharpening
    if (settings.sharpen) {
      processedImage = processedImage.sharpen(settings.sharpen);
    }

    // Apply subtle blur for vintage softness
    if (settings.blur) {
      processedImage = processedImage.blur(settings.blur);
    }

    return processedImage;
  },

  /**
   * Add authentic film grain texture
   */
  addFilmGrain: async (
    image: sharp.Sharp, 
    intensity: number = 0.15,
    size: 'fine' | 'medium' | 'coarse' = 'fine'
  ): Promise<sharp.Sharp> => {
    try {
      const metadata = await image.metadata();
      const width = metadata.width;
      const height = metadata.height;

      if (!width || !height) return image;

      const grainSettings = {
        fine: { sigma: 8, mean: 0 },
        medium: { sigma: 12, mean: 0 },
        coarse: { sigma: 18, mean: 0 }
      };

      const settings = grainSettings[size];

      // Create film grain noise
      const grainBuffer = await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: { r: 128, g: 128, b: 128 },
          noise: {
            type: 'gaussian',
            mean: settings.mean,
            sigma: settings.sigma
          }
        }
      })
      .grayscale()
      .linear(intensity, 128 * (1 - intensity)) // Adjust grain intensity
      .raw()
      .toBuffer();

      return image.composite([{
        input: grainBuffer,
        blend: 'overlay',
        raw: { width, height, channels: 1 }
      }]);

    } catch (error) {
      console.log('Film grain effect failed, continuing without it:', error);
      return image;
    }
  },

  /**
   * Add vintage vignette effect
   */
  addVignette: async (
    image: sharp.Sharp,
    intensity: number = 0.3,
    radius: number = 0.8
  ): Promise<sharp.Sharp> => {
    try {
      const metadata = await image.metadata();
      const width = metadata.width;
      const height = metadata.height;

      if (!width || !height) return image;

      // Create radial gradient for vignette
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY) * radius;

      const vignetteBuffer = Buffer.alloc(width * height);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          const factor = Math.max(0, 1 - (distance / maxRadius) * intensity);
          vignetteBuffer[y * width + x] = Math.floor(255 * factor);
        }
      }

      const vignette = sharp(vignetteBuffer, {
        raw: { width, height, channels: 1 }
      }).png();

      return image.composite([{
        input: await vignette.toBuffer(),
        blend: 'multiply'
      }]);

    } catch (error) {
      console.log('Vignette effect failed, continuing without it:', error);
      return image;
    }
  },

  /**
   * Main image processing function with enhanced vintage effects
   */
  processImage: async (
    inputPath: string,
    outputPath: string,
    options: {
      aspectRatio?: string;
      filmStock?: 'classic_chrome' | 'pro_neg_hi' | 'velvia' | 'classic_neg' | 'portra_400' | 'kodachrome';
      addGrain?: boolean;
      grainIntensity?: number;
      grainSize?: 'fine' | 'medium' | 'coarse';
      addVignette?: boolean;
      vignetteIntensity?: number;
    } = {}
  ): Promise<void> => {
    const {
      aspectRatio = '1:1',
      filmStock = 'classic_chrome',
      addGrain = false,
      grainIntensity = 0.15,
      grainSize = 'fine',
      addVignette = false,
      vignetteIntensity = 0.3
    } = options;

    try {
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
      }

      const aspectRatioMap: AspectRatioMap = { 
        '1:1': 1, 
        '4:3': 4 / 3, 
        '16:9': 16 / 9,
        '3:2': 3 / 2,
        '4:5': 4 / 5
      };
      
      const ratio = aspectRatioMap[aspectRatio] || 1;
      const inputBuffer = fs.readFileSync(inputPath);
      const metadata = await sharp(inputBuffer).metadata();
      
      const imageWidth = metadata.width || 800;
      const imageHeight = metadata.height || 600;
      
      let cropWidth: number, cropHeight: number;
      if (imageWidth / imageHeight > ratio) {
        cropHeight = imageHeight;
        cropWidth = cropHeight * ratio;
      } else {
        cropWidth = imageWidth;
        cropHeight = cropWidth / ratio;
      }
      
      const x = Math.floor((imageWidth - cropWidth) / 2);
      const y = Math.floor((imageHeight - cropHeight) / 2);

      // Start processing pipeline
      let processedImage = sharp(inputBuffer).extract({
        left: x, 
        top: y, 
        width: Math.floor(cropWidth), 
        height: Math.floor(cropHeight)
      });

      // Apply film stock filter
      processedImage = imageService.applyFujifilmVintageFilter(processedImage, filmStock);

      // Add film grain if requested
      if (addGrain) {
        processedImage = await imageService.addFilmGrain(processedImage, grainIntensity, grainSize);
      }

      // Add vignette if requested
      if (addVignette) {
        processedImage = await imageService.addVignette(processedImage, vignetteIntensity);
      }

      await processedImage.toFile(outputPath);
      console.log(`✅ Vintage image processed successfully: ${outputPath}`);
      console.log(`📸 Film stock: ${filmStock.toUpperCase()}`);
      console.log(`🎞️ Effects: ${addGrain ? 'Grain ✓' : 'No grain'} | ${addVignette ? 'Vignette ✓' : 'No vignette'}`);

    } catch (error) {
      console.error(`❌ Error in processImage: ${error}`);
      throw error;
    }
  },

  /**
   * Process image with custom crop and vintage effects
   */
  processImageWithCustomCrop: async (
    inputPath: string,
    outputPath: string,
    cropData: CropData,
    options: {
      filmStock?: 'classic_chrome' | 'pro_neg_hi' | 'velvia' | 'classic_neg' | 'portra_400' | 'kodachrome';
      addGrain?: boolean;
      grainIntensity?: number;
      addVignette?: boolean;
    } = {}
  ): Promise<void> => {
    const {
      filmStock = 'classic_chrome',
      addGrain = false,
      grainIntensity = 0.15,
      addVignette = false
    } = options;

    try {
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
      }

      const inputBuffer = fs.readFileSync(inputPath);
      const metadata = await sharp(inputBuffer).metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;

      const validX = Math.max(0, Math.min(cropData.x, width - 1));
      const validY = Math.max(0, Math.min(cropData.y, height - 1));
      const validWidth = Math.min(cropData.width, width - validX);
      const validHeight = Math.min(cropData.height, height - validY);

      if (validWidth < 10 || validHeight < 10) {
        throw new Error(`Crop dimensions too small: ${validWidth}x${validHeight}`);
      }

      let processedImage = sharp(inputBuffer).extract({
        left: validX,
        top: validY,
        width: validWidth,
        height: validHeight
      });

      // Apply vintage film processing
      processedImage = imageService.applyFujifilmVintageFilter(processedImage, filmStock);

      if (addGrain) {
        processedImage = await imageService.addFilmGrain(processedImage, grainIntensity);
      }

      if (addVignette) {
        processedImage = await imageService.addVignette(processedImage);
      }

      await processedImage.toFile(outputPath);
      console.log(`✅ Custom crop vintage image processed: ${outputPath}`);

    } catch (error) {
      console.error(`❌ Error in processImageWithCustomCrop: ${error}`);
      throw error;
    }
  },

  /**
   * Batch process multiple images with vintage effects
   */
  batchProcessImages: async (
    inputDir: string,
    outputDir: string,
    options: {
      filmStock?: 'classic_chrome' | 'pro_neg_hi' | 'velvia' | 'classic_neg' | 'portra_400' | 'kodachrome';
      aspectRatio?: string;
      addGrain?: boolean;
      addVignette?: boolean;
    } = {}
  ): Promise<void> => {
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const files = fs.readdirSync(inputDir).filter(file => 
        /\.(jpg|jpeg|png|tiff|webp)$/i.test(file)
      );

      console.log(`🔄 Processing ${files.length} images...`);

      for (const file of files) {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, `vintage_${file}`);
        
        try {
          await imageService.processImage(inputPath, outputPath, options);
        } catch (error) {
          console.error(`❌ Failed to process ${file}: ${error}`);
        }
      }

      console.log(`✅ Batch processing complete!`);
    } catch (error) {
      console.error(`❌ Batch processing error: ${error}`);
      throw error;
    }
  }
};

// Usage examples:
/*
// Basic vintage processing
await imageService.processImage(
  'input.jpg', 
  'output_vintage.jpg', 
  {
    filmStock: 'classic_chrome',
    aspectRatio: '4:3',
    addGrain: true,
    addVignette: true
  }
);

// Velvia style with heavy grain
await imageService.processImage(
  'landscape.jpg', 
  'landscape_velvia.jpg', 
  {
    filmStock: 'velvia',
    addGrain: true,
    grainIntensity: 0.25,
    grainSize: 'medium'
  }
);

// Batch process a folder
await imageService.batchProcessImages(
  './input_photos/',
  './vintage_output/',
  {
    filmStock: 'portra_400',
    addGrain: true,
    addVignette: true
  }
);
*/