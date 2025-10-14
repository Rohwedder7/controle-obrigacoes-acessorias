import React from 'react';

const Logo = ({ size = 'medium', className = '' }) => {
  const sizes = {
    small: 'h-8',
    medium: 'h-10',
    large: 'h-12',
    xlarge: 'h-16'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${sizes[size]} flex items-center`}>
        {/* Logo Icon */}
        <div className="relative mr-3">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-2 shadow-lg">
            <svg 
              className="w-6 h-6 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
          </div>
          {/* Badge pequeno com "i" */}
          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
            <span className="text-white text-xs font-bold">i</span>
          </div>
        </div>
        
        {/* Logo Text */}
        <div className="flex flex-col">
          <div className="flex items-baseline">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              i
            </span>
            <span className="text-2xl font-bold text-gray-900">
              Tax
            </span>
          </div>
          <span className="text-xs text-gray-500 -mt-1 tracking-wide">
            CONTROLE TRIBUTÁRIO
          </span>
        </div>
      </div>
    </div>
  );
};

export default Logo;
