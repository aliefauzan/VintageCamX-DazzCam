// @ts-nocheck
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-amber-800 to-amber-900 py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-2">
              <span className="vintage-heading text-2xl text-amber-100">VintageCamX</span>
              <span className="ml-2 text-amber-300 font-vintage italic">DazzCam Studio</span>
            </div>
            <p className="text-sm text-amber-200 font-vintage italic">
              "Capturing memories with the soul of analog photography"
            </p>
            <p className="text-xs text-amber-300 mt-1">
              &copy; {new Date().getFullYear()} VintageCamX. Handcrafted with passion.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">            <div className="flex space-x-6">
              <button
                className="text-sm text-amber-200 hover:text-amber-100 font-vintage transition-colors"
                aria-label="About Our Process"
              >
                Our Process
              </button>
              <button
                className="text-sm text-amber-200 hover:text-amber-100 font-vintage transition-colors"
                aria-label="Film Stocks"
              >
                Film Stocks
              </button>
              <button
                className="text-sm text-amber-200 hover:text-amber-100 font-vintage transition-colors"
                aria-label="Contact Studio"
              >
                Contact Studio
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-xs text-amber-300 font-vintage">Powered by:</span>
              <div className="flex space-x-2 text-xs text-amber-200">
                <span>📷 Sharp</span>
                <span>•</span>
                <span>🎞️ Film Emulation</span>
                <span>•</span>
                <span>⚡ Local Storage</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-amber-700 mt-6 pt-4">
          <p className="text-center text-xs text-amber-300 font-vintage italic">
            "Every photograph is a self-portrait. Every image tells your story." - Ansel Adams
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;