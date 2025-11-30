import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';

interface AddUserModalProps {
    onClose: () => void;
    onAdd: (name: string) => void;
}

const AVATAR_COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#6366F1', '#F97316',
    '#14B8A6', '#CBF300',
];

export const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Please enter a name');
            return;
        }
        onAdd(name.trim());
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-nike-card rounded-3xl max-w-md w-full p-8 relative shadow-2xl border border-white/10 animate-fade-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                >
                    <X className="w-5 h-5 text-white" />
                </button>

                <div className="mb-6">
                    <div className="w-16 h-16 bg-nike-volt rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus size={32} className="text-black" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold italic uppercase tracking-tighter text-nike-volt text-center">
                        Add User
                    </h2>
                    <p className="text-nike-subtext text-sm text-center mt-2">
                        They'll be added to all items
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                            placeholder="Enter name"
                            className="w-full bg-nike-gray text-white px-4 py-4 rounded-xl border border-white/10 focus:border-nike-volt focus:outline-none transition-colors text-lg placeholder-gray-600"
                            autoFocus
                        />
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full bg-nike-volt hover:bg-nike-volt/80 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl transition-all duration-200 text-lg uppercase tracking-wider"
                    >
                        Add User
                    </button>
                </form>
            </div>
        </div>
    );
};
