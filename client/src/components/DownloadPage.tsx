// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowDownTrayIcon, ArrowLeftIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { getDownloadUrl } from '../services/api';

const DownloadPage: React.FC = () => {
  const { processedId } = useParams<{ processedId: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const downloadUrl = processedId ? getDownloadUrl(processedId) : '';

  useEffect(() => {
    if (!processedId) {
      setError('No image ID provided');
      setLoading(false);
      return;
    }

    // In a real app, we would fetch the image from the server
    // For now, we'll just use a placeholder with a delay to simulate loading
    const timer = setTimeout(() => {
      try {
        // Simulate a potential error for invalid IDs (e.g., if ID is 'error')
        if (processedId === 'error') {
          throw new Error('Image not found');
        }
        
        setImageUrl(`https://source.unsplash.com/random/800x600?vintage&sig=${processedId}`);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load image:', err);
        setError('Failed to load the processed image. It may have expired or been deleted.');
        setLoading(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [processedId]);

  const handleDownload = () => {
    if (!imageUrl) {
      setError('Cannot download image. Please try again.');
      return;
    }
    
    // In a real app, this would trigger the download from the server
    window.open(downloadUrl, '_blank');
  };

  // Handle image loading error
  const handleImageError = () => {
    setError('Failed to load the processed image. It may have expired or been deleted.');
    setImageUrl('');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Your Vintage Photo is Ready!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Download your image or create a new one
        </p>
      </div>

      <div className="card mb-6">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center p-6">
            <div className="film-spinner mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Finalizing your vintage image...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <Link to="/" className="btn btn-primary">
              Try Again
            </Link>
          </div>
        ) : (
          <div className="relative">
            <img 
              src={imageUrl} 
              alt="Processed photo with vintage effect" 
              className="w-full h-auto"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/50 flex items-end justify-center p-6 opacity-0 hover:opacity-100 transition-opacity">
              <button
                onClick={handleDownload}
                className="btn btn-primary flex items-center"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Download
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link to="/" className="btn btn-secondary flex items-center">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Upload New Image
        </Link>
        
        {!loading && !error && imageUrl && (
          <button
            onClick={handleDownload}
            className="btn btn-primary flex items-center"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Download Image
          </button>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Note
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Your processed image will be automatically deleted after 24 hours for privacy reasons.
          Please download your image if you wish to keep it.
        </p>
      </div>
    </div>
  );
};

export default DownloadPage;