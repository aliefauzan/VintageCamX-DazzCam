// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowPathIcon, CheckIcon, CameraIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { processImage, processCustomCrop, CropData, getImagePreviewUrl, FilterOptions } from '../services/api';

interface AspectRatio {
  label: string;
  value: string;
  icon: string;
}

interface FilmStock {
  id: 'classic_chrome' | 'pro_neg_hi' | 'velvia' | 'classic_neg';
  name: string;
  description: string;
  preview: string;
}

const ASPECT_RATIOS: AspectRatio[] = [
  { label: 'Square', value: '1:1', icon: '⬜' },
  { label: 'Classic', value: '4:3', icon: '📷' },
  { label: 'Widescreen', value: '16:9', icon: '🎬' },
];

const FILM_STOCKS: FilmStock[] = [
  {
    id: 'classic_chrome',
    name: 'Classic Chrome',
    description: 'Muted, sophisticated tones with lifted shadows',
    preview: '🎞️'
  },
  {
    id: 'pro_neg_hi',
    name: 'Pro Neg Hi',
    description: 'Creamy skin tones with lifted blacks',
    preview: '📸'
  },
  {
    id: 'velvia',
    name: 'Velvia',
    description: 'Punchy, vibrant colors with deep shadows',
    preview: '🌈'
  },
  {
    id: 'classic_neg',
    name: 'Classic Neg',
    description: 'Faded, nostalgic aesthetic',
    preview: '📜'
  }
];

const ImageEditor: React.FC = () => {
  const { imageId } = useParams<{ imageId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedRatio, setSelectedRatio] = useState<string>('1:1');
  const [selectedFilmStock, setSelectedFilmStock] = useState<'classic_chrome' | 'pro_neg_hi' | 'velvia' | 'classic_neg'>('classic_chrome');
  const [addGrain, setAddGrain] = useState<boolean>(false);
  const [customCropMode, setCustomCropMode] = useState<boolean>(false);
  const [cropData, setCropData] = useState<CropData>({ x: 0, y: 0, width: 0, height: 0 });
  
  const imageRef = useRef<HTMLImageElement>(null);
  const cropBoxRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Load image preview
  useEffect(() => {
    if (imageId) {
      setImageUrl(getImagePreviewUrl(imageId));
    }
  }, [imageId]);

  // Initialize crop box when image loads
  const handleImageLoad = () => {
    if (imageRef.current && cropBoxRef.current) {
      const img = imageRef.current;
      const aspectRatio = selectedRatio === '1:1' ? 1 : 
                         selectedRatio === '4:3' ? 4/3 : 
                         16/9;
      
      let cropWidth, cropHeight;
      
      if (img.width / img.height > aspectRatio) {
        cropHeight = img.height;
        cropWidth = cropHeight * aspectRatio;
      } else {
        cropWidth = img.width;
        cropHeight = cropWidth / aspectRatio;
      }
      
      const x = (img.width - cropWidth) / 2;
      const y = (img.height - cropHeight) / 2;
      
      setCropData({
        x,
        y,
        width: cropWidth,
        height: cropHeight
      });
    }
  };

  // Handle aspect ratio change
  const handleRatioChange = (ratio: string) => {
    setSelectedRatio(ratio);
    setCustomCropMode(false);
    
    if (imageRef.current) {
      const img = imageRef.current;
      const aspectRatio = ratio === '1:1' ? 1 : 
                         ratio === '4:3' ? 4/3 : 
                         16/9;
      
      let cropWidth, cropHeight;
      
      if (img.width / img.height > aspectRatio) {
        cropHeight = img.height;
        cropWidth = cropHeight * aspectRatio;
      } else {
        cropWidth = img.width;
        cropHeight = cropWidth / aspectRatio;
      }
      
      const x = (img.width - cropWidth) / 2;
      const y = (img.height - cropHeight) / 2;
      
      setCropData({
        x,
        y,
        width: cropWidth,
        height: cropHeight
      });
    }
  };

  // Handle custom crop mode toggle
  const toggleCustomCropMode = () => {
    setCustomCropMode(!customCropMode);
  };

  // Handle crop box drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (customCropMode && cropBoxRef.current && containerRef.current && imageRef.current) {
      isDraggingRef.current = true;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      
      startPosRef.current = {
        x: mouseX - cropData.x,
        y: mouseY - cropData.y
      };
    }
  };

  // Handle crop box dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (customCropMode && isDraggingRef.current && imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const containerRect = containerRef.current.getBoundingClientRect();
      
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      
      const newX = Math.max(0, Math.min(mouseX - startPosRef.current.x, img.width - cropData.width));
      const newY = Math.max(0, Math.min(mouseY - startPosRef.current.y, img.height - cropData.height));
      
      setCropData(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    }
  };

  // Handle crop box drag end
  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Handle process button click
  const handleProcess = async () => {
    if (!imageId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const filterOptions: FilterOptions = {
        filmStock: selectedFilmStock,
        addGrain: addGrain
      };
      
      let response;
      if (customCropMode) {
        response = await processCustomCrop(imageId, cropData, filterOptions);
      } else {
        response = await processImage(imageId, selectedRatio, filterOptions);
      }
      
      navigate(`/download/${response.id}`);
    } catch (err) {
      console.error('Processing error:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to process image. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Vintage Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center mb-4">
          <CameraIcon className="h-12 w-12 text-amber-700 mr-3" />
          <h1 className="vintage-heading text-4xl">
            Film Studio
          </h1>
        </div>
        <p className="text-xl text-amber-800 font-vintage italic">
          Craft your masterpiece with authentic film techniques
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Film Stock Selection */}
        <div className="card-vintage p-6">
          <h3 className="vintage-heading text-xl mb-4 flex items-center">
            <span className="mr-2">🎞️</span>
            Film Stock
          </h3>
          <div className="space-y-3">
            {FILM_STOCKS.map((stock) => (
              <button
                key={stock.id}
                onClick={() => setSelectedFilmStock(stock.id)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  selectedFilmStock === stock.id
                    ? 'border-amber-500 bg-amber-100'
                    : 'border-amber-200 bg-white hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-vintage font-semibold text-amber-900">
                    {stock.preview} {stock.name}
                  </span>
                  {selectedFilmStock === stock.id && (
                    <span className="text-amber-600">✓</span>
                  )}
                </div>
                <p className="text-sm text-amber-700">{stock.description}</p>
              </button>
            ))}
          </div>
          
          {/* Film Grain Option */}
          <div className="mt-6 p-4 border-2 border-amber-200 rounded-lg">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={addGrain}
                onChange={(e) => setAddGrain(e.target.checked)}
                className="mr-3 h-4 w-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
              />
              <span className="font-vintage text-amber-900">
                Add Film Grain
              </span>
            </label>
            <p className="text-xs text-amber-600 mt-1 ml-7">
              Authentic texture overlay for extra realism
            </p>
          </div>
        </div>

        {/* Image Preview */}
        <div className="lg:col-span-2">
          <div className="card-vintage p-6">
            <h3 className="vintage-heading text-xl mb-4 flex items-center">
              <span className="mr-2">🖼️</span>
              Preview
            </h3>
            
            <div 
              ref={containerRef}
              className="film-border relative overflow-hidden bg-gray-900"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ minHeight: '400px' }}
            >
              {imageUrl ? (
                <>
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Preview"
                    className="max-w-full max-h-96 mx-auto block"
                    onLoad={handleImageLoad}
                  />
                  <div
                    ref={cropBoxRef}
                    className={`absolute border-4 ${
                      customCropMode ? 'border-yellow-400 cursor-move shadow-lg' : 'border-amber-400 shadow-md'
                    }`}
                    style={{
                      left: `${cropData.x}px`,
                      top: `${cropData.y}px`,
                      width: `${cropData.width}px`,
                      height: `${cropData.height}px`,
                      boxShadow: customCropMode ? '0 0 0 9999px rgba(0,0,0,0.5)' : '0 0 20px rgba(217, 119, 6, 0.5)'
                    }}
                    onMouseDown={handleMouseDown}
                  >
                    {customCropMode && (
                      <>
                        <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 border-2 border-yellow-600 rounded-full cursor-nw-resize"></div>
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 border-2 border-yellow-600 rounded-full cursor-ne-resize"></div>
                        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-yellow-400 border-2 border-yellow-600 rounded-full cursor-sw-resize"></div>
                        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-yellow-400 border-2 border-yellow-600 rounded-full cursor-se-resize"></div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center text-amber-600">
                    <ArrowPathIcon className="h-12 w-12 mx-auto animate-spin mb-4" />
                    <p className="font-vintage">Loading your photo...</p>
                  </div>
                </div>
              )}
            </div>
            
            {customCropMode && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-vintage">
                  <strong>Custom Mode:</strong> Drag the crop frame to reposition. The darkened area will be removed.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          {/* Cropping Controls */}
          <div className="card-vintage p-6">
            <h3 className="vintage-heading text-xl mb-4 flex items-center">
              <span className="mr-2">✂️</span>
              Composition
            </h3>
            
            <div className="mb-6">
              <h4 className="font-vintage text-amber-800 mb-3">Aspect Ratio</h4>
              <div className="space-y-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => handleRatioChange(ratio.value)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedRatio === ratio.value && !customCropMode
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                  >
                    <span className="mr-2">{ratio.icon}</span>
                    {ratio.label} ({ratio.value})
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={toggleCustomCropMode}
              className={`w-full p-3 rounded-lg font-vintage font-semibold transition-all ${
                customCropMode
                  ? 'bg-yellow-500 text-white'
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
              }`}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 inline mr-2" />
              {customCropMode ? 'Exit Custom' : 'Custom Crop'}
            </button>
          </div>

          {/* Process Controls */}
          <div className="card-vintage p-6">
            <h3 className="vintage-heading text-xl mb-4 flex items-center">
              <span className="mr-2">⚡</span>
              Development
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-amber-100 rounded-lg border border-amber-300">
                <h4 className="font-vintage font-semibold text-amber-900 mb-2">
                  Current Settings
                </h4>
                <div className="text-sm text-amber-800 space-y-1">
                  <p><strong>Film:</strong> {FILM_STOCKS.find(s => s.id === selectedFilmStock)?.name}</p>
                  <p><strong>Format:</strong> {customCropMode ? 'Custom' : selectedRatio}</p>
                  <p><strong>Grain:</strong> {addGrain ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              
              <button
                onClick={handleProcess}
                disabled={loading || !imageUrl}
                className="btn-vintage w-full py-4 text-lg"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-6 w-6 mr-2 animate-spin inline" />
                    Developing Film...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-6 w-6 mr-2 inline" />
                    Develop Photo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
