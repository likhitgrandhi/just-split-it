import React, { useState } from 'react';
import { User } from '../types';
import { Plus, X } from 'lucide-react';

interface UserSetupProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onContinue: () => void;
  onClose?: () => void;
  onBack?: () => void;
}

const AVATAR_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#6366F1', // indigo
  '#F97316', // orange
  '#14B8A6', // teal
  '#CBF300', // nike volt
];

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const UserSetup: React.FC<UserSetupProps> = ({ users, setUsers, onContinue, onClose, onBack }) => {
  const [nameInput, setNameInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const addUser = () => {
    if (!nameInput.trim()) return;

    // First split by commas, then split each part by "and"
    const names = nameInput
      .split(',')
      .flatMap(part =>
        part.split(/\s+and\s+/i) // Split by " and " (case insensitive)
      )
      .map(n => n.trim())
      .filter(n => n.length > 0);

    // Check for duplicates within the input itself
    const nameLower = names.map(n => n.toLowerCase());
    const duplicatesInInput = names.filter((name, index) =>
      nameLower.indexOf(name.toLowerCase()) !== index
    );

    // Check for duplicates with existing users
    const existingNamesLower = users.map(u => u.name.toLowerCase());
    const duplicatesWithExisting = names.filter(name =>
      existingNamesLower.includes(name.toLowerCase())
    );

    // Show appropriate error message
    if (duplicatesInInput.length > 0) {
      const uniqueDuplicates = [...new Set(duplicatesInInput)];
      setErrorMessage(`Duplicate name(s): ${uniqueDuplicates.join(', ')}`);
      return;
    }

    if (duplicatesWithExisting.length > 0) {
      setErrorMessage(`Name(s) already added: ${duplicatesWithExisting.join(', ')}`);
      return;
    }

    // Clear error if successful
    setErrorMessage('');

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
    <div className="w-full flex flex-col h-full relative">
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="mb-6 text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}

      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold italic uppercase tracking-tighter mb-2 text-nike-volt text-center">
          Who's Paying?
        </h2>
        <p className="text-nike-subtext text-sm md:text-base text-center">Add your crew. Separate names with commas.</p>
      </div>

      <div className="relative mb-2">
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="E.g. Mike, Sarah, John"
          className="w-full bg-[#2C2C2E] text-white px-4 py-4 rounded-xl border border-white/10 focus:border-[#CBF300] focus:outline-none transition-colors text-lg text-center placeholder-gray-600"
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

      {/* Error message */}
      {errorMessage && (
        <div className="mb-4 text-left">
          <p className="text-red-500 text-sm">{errorMessage}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar mb-6">
        {users.length === 0 ? (
          <div className="flex items-center justify-center gap-4 py-10 opacity-30">
            <div className="text-6xl">🏃</div>
            <p className="uppercase font-bold tracking-widest text-left">No friends added yet</p>
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
        className="w-full bg-[#CBF300] hover:bg-[#b5d900] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl transition-all duration-200 text-lg shadow-lg shadow-[#CBF300]/20 uppercase tracking-wider"
      >
        Start Splitting
      </button>
    </div>
  );
};