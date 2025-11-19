import React, { useState } from 'react';
import { User } from '../types';
import { Plus, X } from 'lucide-react';

interface UserSetupProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onContinue: () => void;
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

export const UserSetup: React.FC<UserSetupProps> = ({ users, setUsers, onContinue }) => {
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
    <div className="w-full flex flex-col h-full">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold italic uppercase tracking-tighter mb-2 text-nike-volt">
          Who's Paying?
        </h2>
        <p className="text-nike-subtext text-sm md:text-base">Add your crew. Separate names with commas.</p>
      </div>

      <div className="relative mb-4 md:mb-6">
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="E.g. Mike, Sarah, John"
          className="w-full bg-nike-card text-white border-none rounded-xl p-3 md:p-4 pl-3 md:pl-4 pr-11 md:pr-12 focus:ring-2 focus:ring-nike-volt focus:outline-none placeholder-nike-subtext/50 text-base md:text-lg font-medium"
          autoFocus
        />
        <button
          onClick={addUser}
          disabled={!nameInput.trim()}
          className="absolute right-2 top-2 bottom-2 bg-nike-gray active:bg-nike-volt md:hover:bg-nike-volt active:text-black md:hover:text-black text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar mb-6">
        {users.length === 0 ? (
          <div className="text-center py-10 opacity-30">
            <div className="text-6xl mb-4">🏃</div>
            <p className="uppercase font-bold tracking-widest">No friends added yet</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {users.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-2 bg-nike-card border border-nike-gray pl-3 pr-2 py-2 rounded-full animate-fade-in"
              >
                <div className={`w-2 h-2 rounded-full ${user.color}`}></div>
                <span className="font-bold text-sm uppercase tracking-wide">{user.name}</span>
                <button
                  onClick={() => removeUser(user.id)}
                  className="ml-1 p-1 hover:bg-white/10 rounded-full text-nike-subtext hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onContinue}
        disabled={users.length === 0}
        className="w-full bg-nike-volt text-black font-extrabold uppercase tracking-widest py-4 md:py-5 rounded-full active:bg-white md:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-auto touch-manipulation text-sm md:text-base"
      >
        Start Splitting
      </button>
    </div>
  );
};