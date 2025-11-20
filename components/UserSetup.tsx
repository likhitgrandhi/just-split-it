import React, { useState } from 'react';
import { User } from '../types';
import { Plus, X, ArrowLeft, User as UserIcon } from 'lucide-react';

interface UserSetupProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onContinue: () => void;
  onBack: () => void;
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

export const UserSetup: React.FC<UserSetupProps> = ({ users, setUsers, onContinue, onBack }) => {
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
    <div className="w-full flex flex-col gap-4 h-full relative animate-fade-in">
      {/* Back Button */}
      <div className="absolute -top-12 left-0 z-10">
        <button
          onClick={onBack}
          className="text-nike-subtext hover:text-nike-forest font-bold text-sm uppercase tracking-wider flex items-center gap-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full hover:bg-white/80 transition-all"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Tile 1: Input Area */}
      <div className="bg-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden flex flex-col justify-center min-h-[200px]">
        <div className="mb-4">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-nike-forest mb-1">
            Who's Paying?
          </h2>
          <p className="text-nike-subtext font-medium">Add your crew. Separate names with commas.</p>
        </div>

        <div className="relative">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="E.g. Mike, Sarah, John"
            className="w-full bg-transparent text-nike-forest border-none p-0 pr-12 focus:ring-0 focus:outline-none placeholder-nike-subtext/30 text-3xl md:text-4xl font-black tracking-tight"
            autoFocus
          />
          <button
            onClick={addUser}
            disabled={!nameInput.trim()}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-nike-forest active:bg-nike-volt md:hover:bg-nike-volt active:text-nike-forest md:hover:text-nike-forest text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Tile 2: User List */}
      <div className="bg-white rounded-[2rem] p-8 shadow-xl flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
          {users.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 text-nike-subtext">
              <UserIcon size={64} strokeWidth={1} className="mb-4" />
              <p className="uppercase font-bold tracking-widest text-sm">No friends added yet</p>
            </div>
          ) : (
            users.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-xl animate-fade-in group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full ${user.color} flex items-center justify-center text-white font-bold shadow-sm`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-nike-forest text-2xl">{user.name}</span>
                </div>
                <button
                  onClick={() => removeUser(user.id)}
                  className="p-2 rounded-full text-nike-subtext hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Start Button (Outside Tile) */}
      <button
        onClick={onContinue}
        disabled={users.length === 0}
        className="w-full bg-nike-volt text-nike-forest text-4xl md:text-4xl font-black  uppercase tracking-tighter py-5 rounded-[2rem] hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl mb-4"
      >
        Start Splitting
      </button>
    </div>
  );
};