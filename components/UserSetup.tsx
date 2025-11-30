import React, { useState } from 'react';
import { User } from '../types';
import { Plus, X } from 'lucide-react';

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

  return (
    <div className="w-full flex flex-col h-full bg-pastel-purple rounded-[3rem] p-8 md:p-10 shadow-sm border border-black/5 relative">
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
  );
};