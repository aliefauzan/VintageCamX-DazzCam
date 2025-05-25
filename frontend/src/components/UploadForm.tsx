// @ts-nocheck
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon, ExclamationCircleIcon, CameraIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { uploadImage, getStorageStatus } from '../services/api';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png'];

const UploadForm: React.FC = () => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [storageStatus, setStorageStatus] = useState<{is_enabled_storage: string, status: string} | null>(null);
  const navigate = useNavigate();

  // Fetch storage status on component mount
  useEffect(() => {
    const checkStorageStatus = async () => {
      try {
        const status = await getStorageStatus();
        setStorageStatus(status);
      } catch (err) {
        console.error('Failed to fetch storage status:', err);
        setStorageStatus({ is_enabled_storage: 'unknown', status: 'error' });
      }
    };
    
    checkStorageStatus();
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Reset error state
    setError(null);

    // Check if storage is available
    if (storageStatus && storageStatus.status !== 'active') {
      setError('Storage service is currently unavailable. Please try again later.');
      return;
    }

    // Validate file
    const file = acceptedFiles[0];
    if (!file) {
      setError('No file selected. Please select an image file.');
      return;
    }

    // Check file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setError('Only JPEG and PNG images are allowed.');
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    // Store the selected file
    setSelectedFile(file);

    try {
      setIsUploading(true);
      const response = await uploadImage(file);
      navigate(`/edit/${response.id}`);
    } catch (err) {
      console.error('Upload error:', err);
      if (err.response && err.response.status === 413) {
        setError('File size too large for server. Please use a smaller image.');
      } else if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to upload image. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  }, [navigate, storageStatus]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: false,
    maxSize: MAX_FILE_SIZE
  });

  // Display rejection errors
  React.useEffect(() => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      
      if (rejection.errors[0].code === 'file-too-large') {
        setError(`File size exceeds 10MB limit.`);
      } else if (rejection.errors[0].code === 'file-invalid-type') {
        setError(`Only JPEG and PNG images are allowed.`);
      } else {
        setError(`File error: ${rejection.errors[0].message}`);
      }
    }
  }, [fileRejections]);
  return (
    <div className="max-w-4xl mx-auto">
      {/* Vintage Camera Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center items-center mb-6">
          <div className="relative">
            <CameraIcon className="h-16 w-16 text-amber-700" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h1 className="vintage-heading text-5xl mb-3">
          VintageCamX DazzCam
        </h1>
        <p className="text-xl text-amber-800 font-vintage italic">
          Transform your photos with authentic film aesthetics
        </p>
        <div className="flex justify-center items-center mt-4 space-x-2">
          <SparklesIcon className="h-5 w-5 text-amber-600" />
          <span className="text-amber-700 font-medium">Professional Film Emulation</span>
          <SparklesIcon className="h-5 w-5 text-amber-600" />
        </div>
      </div>

      {/* Enhanced Upload Area */}
      <div className="card-vintage p-8 mb-8">
        <div
          {...getRootProps()}
          className={`border-3 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all duration-300
            ${isDragActive 
              ? 'border-amber-500 bg-amber-100 scale-102' 
              : selectedFile 
                ? 'border-green-600 bg-green-50' 
                : 'border-amber-400 hover:border-amber-500 hover:bg-amber-100/50'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-6">
            <div className="relative">
              <PhotoIcon className="h-20 w-20 mx-auto text-amber-600" />
              {selectedFile && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}
            </div>
            
            {isDragActive ? (
              <div className="space-y-3">
                <p className="text-2xl font-vintage font-semibold text-amber-700">
                  Drop your masterpiece here...
                </p>
                <p className="text-amber-600">Release to begin the transformation</p>
              </div>
            ) : selectedFile ? (
              <div className="space-y-3">
                <p className="text-2xl font-vintage font-semibold text-green-700">
                  📸 {selectedFile.name}
                </p>
                <p className="text-green-600 font-medium">
                  Ready for vintage processing
                </p>
                <p className="text-sm text-amber-600">
                  Click or drag to replace with another image
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-2xl font-vintage font-semibold text-amber-800">
                  Drop your photo here
                </p>
                <p className="text-lg text-amber-700">
                  or click to browse your collection
                </p>
                <div className="text-sm text-amber-600 space-y-1">
                  <p>📷 JPEG, PNG formats supported</p>
                  <p>📏 Maximum size: 10MB</p>
                  <p>🎨 Professional film emulation included</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>      {error && (
        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-400 rounded-md flex items-center shadow-md">
          <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-red-800">Upload Error</h4>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="mb-8 flex flex-col items-center justify-center py-8">
          <div className="film-spinner mb-4" aria-label="Uploading..."></div>
          <div className="text-center">
            <p className="text-xl font-vintage text-amber-800 mb-2">
              Preparing your photo...
            </p>
            <p className="text-amber-600">
              Getting ready for vintage transformation
            </p>
          </div>
        </div>
      )}

      {/* Storage Status with Vintage Styling */}
      {storageStatus && (
        <div className={`mb-8 p-4 rounded-lg flex items-center shadow-md ${
          storageStatus.status === 'active' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className={`h-4 w-4 rounded-full mr-3 ${
            storageStatus.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
          }`}></div>
          <div>
            <span className="font-medium text-gray-800">Studio Status:</span>
            <span className={`ml-2 ${
              storageStatus.status === 'active' 
                ? 'text-green-700' 
                : 'text-yellow-700'
            }`}>
              {storageStatus.is_enabled_storage === 'disabled' 
                ? 'Offline Mode' 
                : `${storageStatus.is_enabled_storage.charAt(0).toUpperCase() + storageStatus.is_enabled_storage.slice(1)} (${storageStatus.status})`}
            </span>
          </div>
        </div>
      )}

      {/* Enhanced Features Section */}
      <div className="card-vintage p-8">
        <h2 className="vintage-heading text-2xl mb-6 text-center">
          🎬 Professional Film Features
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-vintage text-lg text-amber-800 mb-3">📸 Film Emulation</h3>
            <ul className="space-y-3 text-amber-700">
              <li className="flex items-start">
                <span className="mr-3 text-amber-600">•</span>
                <div>
                  <strong>Classic Chrome:</strong> Muted, sophisticated tones
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-amber-600">•</span>
                <div>
                  <strong>Pro Neg Hi:</strong> Creamy skin tones, lifted blacks
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-amber-600">•</span>
                <div>
                  <strong>Velvia:</strong> Punchy, vibrant colors
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-amber-600">•</span>
                <div>
                  <strong>Classic Neg:</strong> Faded, nostalgic aesthetic
                </div>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-vintage text-lg text-amber-800 mb-3">✂️ Smart Cropping</h3>
            <ul className="space-y-3 text-amber-700">
              <li className="flex items-start">
                <span className="mr-3 text-amber-600">•</span>
                <div>
                  <strong>AI Detection:</strong> Automatic face and object recognition
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-amber-600">•</span>
                <div>
                  <strong>Multiple Ratios:</strong> Square, 4:3, 16:9 formats
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-amber-600">•</span>
                <div>
                  <strong>Custom Crop:</strong> Precision control with visual overlay
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-amber-600">•</span>
                <div>
                  <strong>Film Grain:</strong> Optional authentic texture overlay
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-amber-100 rounded-lg border border-amber-300">
          <p className="text-center text-amber-800 font-vintage italic">
            "Every photo tells a story. Let us help you tell it with the timeless beauty of film."
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadForm;