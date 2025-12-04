import React, { useState } from 'react';
import { X } from 'lucide-react';
import { User } from '../types';

interface AddUserModalProps {
    users: User[];
    onAdd: (name: string) => void;
    onClose: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ users, onAdd, onClose }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        // Check for duplicates
        const existingUser = users.find(u => u.name.toLowerCase() === name.trim().toLowerCase());
        if (existingUser) {
            setError(`User "${name}" already exists`);
            return;
        }

        onAdd(name.trim());
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-xl border border-black/5 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-black text-black mb-1">Add User</h2>
                <p className="text-gray-500 text-sm font-bold mb-6">Who else is splitting?</p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="Enter name"
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-black/10 rounded-xl p-4 text-black placeholder:text-black/20 text-lg font-bold focus:outline-none transition-all"
                            autoFocus
                        />
                        {error && (
                            <p className="text-red-500 text-xs font-bold mt-2 ml-1 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-red-500"></span>
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-100 text-black font-bold py-4 rounded-xl active:scale-95 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="flex-1 bg-black text-white font-bold py-4 rounded-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            Add
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
