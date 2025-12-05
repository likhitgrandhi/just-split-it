import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AddItemModalProps {
    onAdd: (name: string, price: number) => void;
    onClose: () => void;
    currency: string;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ onAdd, onClose, currency }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const priceValue = parseFloat(price);
        if (isNaN(priceValue) || priceValue <= 0) {
            setError('Please enter a valid price');
            return;
        }

        onAdd(name.trim(), priceValue);
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

                <h2 className="text-2xl font-black text-black mb-1">Add Item</h2>
                <p className="text-gray-500 text-sm font-bold mb-6">Add a new item to the list</p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Item Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="e.g. Water Bottle"
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-black/10 rounded-xl p-4 text-black placeholder:text-black/20 text-lg font-bold focus:outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Price</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">{currency}</span>
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                value={price}
                                onChange={(e) => {
                                    setPrice(e.target.value);
                                    if (error) setError(null);
                                }}
                                placeholder="0.00"
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-black/10 rounded-xl p-4 pl-10 text-black placeholder:text-black/20 text-lg font-bold focus:outline-none transition-all"
                            />
                        </div>
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
                            disabled={!name.trim() || !price}
                            className="flex-1 bg-black text-white font-bold py-4 rounded-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            Add Item
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
