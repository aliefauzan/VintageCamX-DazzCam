// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';
import { processImage, processCustomCrop, CropData } from '../services/api';

interface AspectRatio {
  label: string;
  value: string;
}

const ASPECT_RATIOS: AspectRatio[] = [
  { label: 'Square (1:1)', value: '1:1' },
  { label: 'Classic (4:3)', value: '4:3' },
  { label: 'Widescreen (16:9)', value: '16:9' },
];

const ImageEditor: React.FC = () => {
  const { imageId } = useParams<{ imageId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedRatio, setSelectedRatio] = useState<string>('1:1');
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
      // In a real app, we would fetch the image from the server
      // For now, we'll just use a placeholder
      setImageUrl(`https://source.unsplash.com/random/800x600?vintage&sig=${imageId}`);
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
      
      // Get container position relative to the viewport
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Calculate mouse position relative to the image container
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
      
      // Calculate mouse position relative to the image container
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      
      // Calculate new position
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
      
      let response;
      
      if (customCropMode) {
        response = await processCustomCrop(imageId, cropData);
      } else {
        response = await processImage(imageId, selectedRatio);
      }
      
      navigate(`/download/${response.id}`);
    } catch (err) {
      console.error('Processing error:', err);
      setError('Failed to process image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Edit Your Image
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Choose an aspect ratio or customize the crop area
        </p>
      </div>

      <div className="card mb-6">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.value}
                onClick={() => handleRatioChange(ratio.value)}
                className={`px-3 py-1 rounded-md text-sm ${
                  selectedRatio === ratio.value && !customCropMode
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {ratio.label}
              </button>
            ))}
            <button
              onClick={toggleCustomCropMode}
              className={`px-3 py-1 rounded-md text-sm ${
                customCropMode
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Custom Crop
            </button>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="relative overflow-hidden bg-gray-100 dark:bg-gray-900"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {imageUrl ? (
            <>
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Preview"
                className="max-w-full"
                onLoad={handleImageLoad}
              />
              <div
                ref={cropBoxRef}
                className={`absolute border-2 ${
                  customCropMode ? 'border-yellow-500 cursor-move' : 'border-indigo-500'
                }`}
                style={{
                  left: `${cropData.x}px`,
                  top: `${cropData.y}px`,
                  width: `${cropData.width}px`,
                  height: `${cropData.height}px`,
                }}
                onMouseDown={handleMouseDown}
              >
                {customCropMode && (
                  <>
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-gray-400 rounded-sm"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-gray-400 rounded-sm"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-gray-400 rounded-sm"></div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-gray-400 rounded-sm"></div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleProcess}
          disabled={loading || !imageUrl}
          className="btn btn-primary flex items-center"
        >
          {loading ? (
            <>
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckIcon className="h-5 w-5 mr-2" />
              Apply Vintage Filter
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ImageEditor;