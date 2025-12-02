import React, { useState } from 'react';
import { X, Plus, Trash2, Check, UserPlus } from 'lucide-react';
import { User } from '../types';

interface AddUserModalProps {
    onClose: () => void;
    onAdd: (users: User[]) => void;
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

export const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onAdd }) => {
    const [names, setNames] = useState<{ id: string; name: string }[]>([
        { id: generateId(), name: '' }
    ]);

    const handleNameChange = (id: string, value: string) => {
        setNames(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, name: value };
            }
            return item;
        }));
    };

    const addNewRow = () => {
        setNames(prev => [...prev, { id: generateId(), name: '' }]);
    };

    const removeRow = (id: string) => {
        if (names.length === 1) return;
        setNames(prev => prev.filter(item => item.id !== id));
    };

    const handleSave = () => {
        const validNames = names.filter(n => n.name.trim());

        if (validNames.length === 0) {
            onClose();
            return;
        }

        const newUsers: User[] = validNames.map(n => ({
            id: generateId(),
            name: n.name.trim(),
            color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
        }));

        onAdd(newUsers);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (index === names.length - 1) {
                addNewRow();
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-soft border border-white/50 flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-black tracking-tight">Add People</h2>
                        <p className="text-gray-500 font-medium">Add more friends to the split</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
                    {names.map((item, index) => (
                        <div key={item.id} className="flex gap-3 items-center animate-fade-in">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                <UserPlus size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Name (e.g. Sarah)"
                                value={item.name}
                                onChange={(e) => handleNameChange(item.id, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className="flex-1 bg-gray-50 border-2 border-transparent focus:border-black/10 rounded-xl px-4 py-3 font-bold text-black placeholder:text-gray-300 focus:outline-none transition-all"
                                autoFocus={index === names.length - 1}
                            />

                            {names.length > 1 && (
                                <button
                                    onClick={() => removeRow(item.id)}
                                    className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>
                    ))}

                    <button
                        onClick={addNewRow}
                        className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold hover:border-cloud-primary hover:text-cloud-primary hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        Add Another Person
                    </button>
                </div>

                {/* Footer */}
                <div className="p-6 md:p-8 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={handleSave}
                        disabled={!names.some(n => n.name.trim())}
                        className="w-full bg-black text-white font-bold text-xl py-5 rounded-2xl shadow-lg hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Check size={24} />
                        Add {names.filter(n => n.name.trim()).length} People
                    </button>
                </div>
            </div>
        </div>
    );
};
