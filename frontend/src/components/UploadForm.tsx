// @ts-nocheck
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
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
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          VintageCamX
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Upload your photo to add a vintage filter and smart crop
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
            : selectedFile 
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
              : 'border-gray-300 hover:border-indigo-400 dark:border-gray-600 dark:hover:border-indigo-500'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <PhotoIcon className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500" />
          {isDragActive ? (
            <p className="text-lg font-medium text-indigo-600 dark:text-indigo-400">
              Drop your image here...
            </p>
          ) : selectedFile ? (
            <div>
              <p className="text-lg font-medium text-green-600 dark:text-green-400">
                File selected: {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Click or drag to replace
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Drag & drop your image here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                or click to browse (JPEG, PNG up to 10MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center dark:bg-red-900/20 dark:border-red-800">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      {isUploading && (
        <div className="mt-8 flex justify-center">
          <div className="film-spinner" aria-label="Uploading..."></div>
          <span className="sr-only">Uploading...</span>
        </div>
      )}

      {/* Storage Status Indicator */}
      {storageStatus && (
        <div className={`mt-4 p-3 rounded-md flex items-center ${
          storageStatus.status === 'active' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className={`h-3 w-3 rounded-full mr-2 ${
            storageStatus.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
          }`}></div>
          <span className={`${
            storageStatus.status === 'active' 
              ? 'text-green-700 dark:text-green-400' 
              : 'text-yellow-700 dark:text-yellow-400'
          }`}>
            Storage: {storageStatus.is_enabled_storage === 'disabled' 
              ? 'Disabled' 
              : `${storageStatus.is_enabled_storage.charAt(0).toUpperCase() + storageStatus.is_enabled_storage.slice(1)} (${storageStatus.status})`}
          </span>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Features
        </h2>
        <ul className="space-y-2 text-gray-600 dark:text-gray-300">
          <li className="flex items-center">
            <span className="mr-2">•</span>
            <span>Automatic vintage filter with light leaks and film grain</span>
          </li>
          <li className="flex items-center">
            <span className="mr-2">•</span>
            <span>Smart cropping that detects faces and important objects</span>
          </li>
          <li className="flex items-center">
            <span className="mr-2">•</span>
            <span>Multiple aspect ratio options (1:1, 4:3, 16:9)</span>
          </li>
          <li className="flex items-center">
            <span className="mr-2">•</span>
            <span>Custom cropping with draggable handles</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UploadForm;