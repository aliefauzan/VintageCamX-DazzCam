// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowDownTrayIcon, ArrowLeftIcon, ExclamationCircleIcon, CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { getDownloadUrl, getProcessedImageViewUrl } from '../services/api';

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
    }    // Load the actual processed image from the backend
    const loadProcessedImage = async () => {
      try {
        // Use the view URL for displaying the image (not forcing download)
        const viewImageUrl = getProcessedImageViewUrl(processedId);
        
        // Test if the image exists by making a HEAD request
        const response = await fetch(viewImageUrl, { method: 'HEAD' });
        
        if (!response.ok) {
          throw new Error(`Image not found (${response.status})`);
        }
        
        // If successful, set the image URL for display
        setImageUrl(viewImageUrl);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load processed image:', err);
        setError('Failed to load the processed image. It may have expired or been deleted.');
        setLoading(false);
      }
    };

    // Add a small delay to show the loading state
    const timer = setTimeout(loadProcessedImage, 1000);
    return () => clearTimeout(timer);
  }, [processedId]);
  const handleDownload = () => {
    if (!processedId) {
      setError('Cannot download image. Please try again.');
      return;
    }
    
    // Use the backend download URL to trigger file download
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = `vintagecam-${processedId}.jpg`;
    downloadLink.click();
  };

  // Handle image loading error
  const handleImageError = () => {
    setError('Failed to load the processed image. It may have expired or been deleted.');
    setImageUrl('');
  };
  return (
    <div className="max-w-4xl mx-auto">
      {/* Vintage Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center mb-4">
          <CheckCircleIcon className="h-16 w-16 text-green-600 mr-3" />
          <div>
            <h1 className="vintage-heading text-4xl text-amber-900 mb-2">
              Development Complete!
            </h1>
            <p className="text-xl text-amber-800 font-vintage italic">
              Your film has been expertly processed
            </p>
          </div>
        </div>
        <div className="flex justify-center items-center mt-4 space-x-2">
          <SparklesIcon className="h-5 w-5 text-amber-600" />
          <span className="text-amber-700 font-medium">Professional Quality • Vintage Authentic</span>
          <SparklesIcon className="h-5 w-5 text-amber-600" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Image Display */}
        <div className="lg:col-span-2">
          <div className="card-vintage p-6">
            <h3 className="vintage-heading text-xl mb-4 flex items-center">
              <span className="mr-2">🖼️</span>
              Your Masterpiece
            </h3>
            
            {loading ? (
              <div className="h-96 flex flex-col items-center justify-center">
                <div className="film-spinner mb-6"></div>
                <div className="text-center">
                  <p className="text-xl font-vintage text-amber-800 mb-2">
                    Final development in progress...
                  </p>
                  <p className="text-amber-600">
                    Applying finishing touches with vintage precision
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="h-96 flex flex-col items-center justify-center text-center">
                <ExclamationCircleIcon className="h-16 w-16 text-red-500 mb-4" />
                <h4 className="text-xl font-vintage text-red-800 mb-2">Development Failed</h4>
                <p className="text-red-600 mb-6">{error}</p>
                <Link to="/" className="btn-vintage">
                  Return to Studio
                </Link>
              </div>
            ) : (              <div className="relative film-border">
                <img 
                  src={imageUrl} 
                  alt="Processed with vintage film effect" 
                  className="w-full h-auto rounded"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/60 flex items-end justify-center p-6 opacity-0 hover:opacity-100 transition-opacity rounded">
                  <div className="text-center">
                    <p className="text-white font-vintage mb-3">Ready for Download</p>
                    <button
                      onClick={handleDownload}
                      className="btn-vintage bg-white text-amber-900 hover:bg-amber-50"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5 mr-2 inline" />
                      Download High Quality
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Download Options */}
        <div className="space-y-6">
          <div className="card-vintage p-6">
            <h3 className="vintage-heading text-xl mb-4 flex items-center">
              <span className="mr-2">⬇️</span>
              Download Options
            </h3>
            
            {!loading && !error && imageUrl && (
              <div className="space-y-4">
                <button
                  onClick={handleDownload}
                  className="btn-vintage w-full py-4 text-lg"
                >
                  <ArrowDownTrayIcon className="h-6 w-6 mr-2 inline" />
                  Download Original Quality
                </button>
                
                <div className="p-4 bg-amber-100 rounded-lg border border-amber-300">
                  <h4 className="font-vintage font-semibold text-amber-900 mb-2">
                    📋 Photo Details
                  </h4>
                  <div className="text-sm text-amber-800 space-y-1">
                    <p><strong>Format:</strong> High Resolution JPEG</p>
                    <p><strong>Process:</strong> Vintage Film Emulation</p>
                    <p><strong>Quality:</strong> Professional Grade</p>
                    <p><strong>File ID:</strong> {processedId}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center mb-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-vintage font-semibold text-green-800">Processing Complete</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Your image has been enhanced with professional-grade vintage film characteristics.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="card-vintage p-6">
            <h3 className="vintage-heading text-xl mb-4 flex items-center">
              <span className="mr-2">🎬</span>
              Next Steps
            </h3>
            
            <div className="space-y-3">
              <Link to="/" className="btn-vintage w-full py-3 text-center block">
                <ArrowLeftIcon className="h-5 w-5 mr-2 inline" />
                Process Another Photo
              </Link>
              
              <div className="text-center">
                <p className="text-sm text-amber-700 font-vintage italic">
                  Create your vintage collection
                </p>
              </div>
            </div>
          </div>

          <div className="card-vintage p-6">
            <h3 className="vintage-heading text-xl mb-4 flex items-center">
              <span className="mr-2">⚠️</span>
              Important Notice
            </h3>
            
            <div className="space-y-3 text-sm text-amber-800">
              <p className="font-vintage">
                <strong>🕒 Storage Policy:</strong> Your processed image will be automatically removed after 24 hours for privacy and security.
              </p>
              
              <p className="font-vintage">
                <strong>💾 Recommendation:</strong> Download your image now to ensure you don't lose your work.
              </p>
              
              <p className="font-vintage">
                <strong>🔒 Privacy:</strong> We don't store or share your images beyond the processing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;