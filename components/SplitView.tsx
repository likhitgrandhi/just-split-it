import React from 'react';
import { Settings } from 'lucide-react';

export const SplitView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in bg-gray-50 rounded-3xl m-4">
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
        <Settings className="text-gray-400 animate-spin-slow" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">Coming Soon</h3>
      <p className="text-gray-500">
        The Split feature is currently under development.
      </p>
    </div>
  );
};

