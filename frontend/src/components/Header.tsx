// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { SunIcon, MoonIcon, CameraIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode }) => {
  return (
    <header className="bg-gradient-to-r from-amber-50 to-amber-100 shadow-lg border-b-4 border-amber-200">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="relative">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
              <CameraIcon className="h-7 w-7 text-amber-100" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <span className="vintage-heading text-2xl text-amber-900">VintageCamX</span>
            <p className="text-xs text-amber-700 font-vintage italic">DazzCam Studio</p>
          </div>
        </Link>
        
        <div className="flex items-center space-x-6">
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-amber-800 hover:text-amber-900 font-vintage font-medium transition-colors">
              Upload
            </Link>
            <span className="text-amber-600">•</span>
            <span className="text-amber-700 font-vintage">Studio</span>
            <span className="text-amber-600">•</span>
            <span className="text-amber-700 font-vintage">Gallery</span>
          </nav>
          
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-amber-200 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <SunIcon className="h-5 w-5 text-amber-800" />
            ) : (
              <MoonIcon className="h-5 w-5 text-amber-800" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;