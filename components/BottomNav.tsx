import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  Home01Icon, 
  Invoice01Icon, 
  GitForkIcon, 
  Backpack01Icon, 
  Clock01Icon 
} from '@hugeicons/core-free-icons';

interface BottomNavProps {
  activeTab: 'home' | 'bill' | 'split' | 'trips' | 'history';
  onTabChange: (tab: 'home' | 'bill' | 'split' | 'trips' | 'history') => void;
  isAuthenticated?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, isAuthenticated }) => {
  if (!isAuthenticated) return null;

  const navItems = [
    { id: 'home', label: 'Home', icon: Home01Icon },
    { id: 'bill', label: 'Bill Split', icon: Invoice01Icon },
    { id: 'split', label: 'Split', icon: GitForkIcon },
    { id: 'trips', label: 'Trips', icon: Backpack01Icon },
    { id: 'history', label: 'History', icon: Clock01Icon },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 md:h-20 max-w-lg mx-auto px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors duration-200 ${
              activeTab === item.id 
                ? 'text-[#00B743]' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <HugeiconsIcon 
              icon={item.icon} 
              size={24} 
              strokeWidth={3}
              color="currentColor"
            />
            <span className="text-[10px] md:text-xs font-bold tracking-wide uppercase truncate w-full text-center">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
