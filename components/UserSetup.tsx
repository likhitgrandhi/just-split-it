import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Plus, X, ArrowLeft } from 'lucide-react';

interface UserSetupProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onContinue: () => void;
  onClose: () => void;
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500',
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
];

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const UserSetup: React.FC<UserSetupProps> = ({ users, setUsers, onContinue, onClose }) => {
  const [nameInput, setNameInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const addUser = () => {
    if (!nameInput.trim()) return;

    const names = nameInput.split(',').map(n => n.trim()).filter(n => n.length > 0);

    const newUsers: User[] = names.map(name => ({
      id: generateId(),
      name,
      color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    }));

    setUsers(prev => [...prev, ...newUsers]);
    setNameInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addUser();
    }
  };

  const removeUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Mobile: Full-screen view
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col animate-fade-in overflow-y-auto">
        <div className="flex-1 flex flex-col p-6 pt-4 pb-6 min-h-min">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-full active:bg-gray-100 text-gray-400 active:text-black transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-black tracking-tighter text-cloud-logo lowercase select-none relative inline-block drop-shadow-md mb-3">
              <span className="absolute inset-0 text-stroke-4 text-white z-0" aria-hidden="true">splitto</span>
              <span className="relative z-10">splitto</span>
            </h1>
            <h2 className="text-2xl font-bold text-black mb-1">Who's Paying?</h2>
            <p className="text-cloud-subtext text-sm">Add your crew. Separate names with commas.</p>
          </div>

          {/* Input */}
          <div className="relative mb-6">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="E.g. Mike, Sarah, John"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-black/10 rounded-2xl p-5 pr-16 text-black placeholder:text-black/20 text-lg font-bold focus:outline-none transition-all"
              autoFocus
            />
            <button
              onClick={addUser}
              disabled={!nameInput.trim()}
              className="absolute right-2 top-2 bottom-2 bg-black text-white p-3 rounded-xl active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center aspect-square"
            >
              <Plus size={22} strokeWidth={3} />
            </button>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto no-scrollbar min-h-[120px] -mx-2 px-2">
            {users.length === 0 ? (
              <div className="text-center py-12 opacity-40">
                <div className="text-5xl mb-4 grayscale">🏃</div>
                <p className="uppercase font-bold tracking-widest text-black text-xs">No friends added yet</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {users.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 bg-pastel-purple pl-4 pr-2 py-2.5 rounded-full animate-fade-in"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${user.color}`}></div>
                    <span className="font-bold text-sm text-black">{user.name}</span>
                    <button
                      onClick={() => removeUser(user.id)}
                      className="p-1 active:bg-black/5 rounded-full text-gray-400 active:text-black transition-colors"
                    >
                      <X size={16} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Continue Button - Fixed at bottom */}
          <div className="pt-4 mt-auto">
            <button
              onClick={onContinue}
              disabled={users.length === 0}
              className="w-full bg-black text-white font-bold text-lg py-5 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
            >
              Start Splitting
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: Card view with wrapper
  return (
    <div className="flex justify-center flex-1 items-center animate-fade-in p-4">
      <div className="w-full max-w-lg flex flex-col bg-pastel-purple rounded-[3rem] p-8 md:p-10 shadow-sm border border-black/5 relative">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 p-2 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors"
        >
          <X size={24} />
        </button>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl font-black tracking-tighter text-cloud-logo lowercase select-none relative inline-block drop-shadow-md">
              <span className="absolute inset-0 text-stroke-4 text-white z-0" aria-hidden="true">splitto</span>
              <span className="relative z-10">splitto</span>
            </h1>
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3 text-black">
            Who's Paying?
          </h2>
          <p className="text-gray-600 text-lg font-medium">Add your crew. Separate names with commas.</p>
        </div>

        <div className="relative mb-8">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="E.g. Mike, Sarah, John"
            className="w-full bg-white border-2 border-transparent focus:border-black/10 rounded-[2rem] p-6 pr-16 text-black placeholder:text-black/30 text-xl font-bold focus:outline-none shadow-sm transition-all"
            autoFocus
          />
          <button
            onClick={addUser}
            disabled={!nameInput.trim()}
            className="absolute right-3 top-3 bottom-3 bg-black text-white p-3 rounded-2xl hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center aspect-square"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar mb-8 min-h-[100px]">
          {users.length === 0 ? (
            <div className="text-center py-8 opacity-40">
              <div className="text-5xl mb-4 grayscale">🏃</div>
              <p className="uppercase font-bold tracking-widest text-black text-sm">No friends added yet</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {users.map(user => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 bg-white pl-4 pr-3 py-3 rounded-full animate-fade-in shadow-sm border border-black/5"
                >
                  <div className={`w-3 h-3 rounded-full ${user.color}`}></div>
                  <span className="font-bold text-base text-black">{user.name}</span>
                  <button
                    onClick={() => removeUser(user.id)}
                    className="ml-1 p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-colors"
                  >
                    <X size={16} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onContinue}
          disabled={users.length === 0}
          className="w-full bg-black text-white font-black text-xl py-6 rounded-[2rem] hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-auto shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
          Start Splitting
        </button>
      </div>
    </div>
  );
};