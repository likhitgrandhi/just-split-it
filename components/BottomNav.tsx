import React from 'react';
import { Receipt, Plane } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'bill' | 'trips';
  onTabChange: (tab: 'bill' | 'trips') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 md:h-20 max-w-lg mx-auto">
        <button
          onClick={() => onTabChange('bill')}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors duration-200 ${
            activeTab === 'bill' 
              ? 'text-cloud-primary' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Receipt size={24} strokeWidth={activeTab === 'bill' ? 2.5 : 2} />
          <span className="text-[10px] md:text-xs font-bold tracking-wide uppercase">Bill</span>
        </button>

        <button
          onClick={() => onTabChange('trips')}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors duration-200 ${
            activeTab === 'trips' 
              ? 'text-cloud-primary' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Plane size={24} strokeWidth={activeTab === 'trips' ? 2.5 : 2} />
          <span className="text-[10px] md:text-xs font-bold tracking-wide uppercase">Trips</span>
        </button>
      </div>
    </div>
  );
};

