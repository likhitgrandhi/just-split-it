import React, { useState } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';
import { ReceiptItem } from '../types';

interface AddItemModalProps {
    onClose: () => void;
    onAdd: (items: ReceiptItem[]) => void;
    currency: string;
}

const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const AddItemModal: React.FC<AddItemModalProps> = ({ onClose, onAdd, currency }) => {
    const [items, setItems] = useState<{ id: string; name: string; price: string; quantity: number }[]>([
        { id: generateId(), name: '', price: '', quantity: 1 }
    ]);

    const handleItemChange = (id: string, field: 'name' | 'price' | 'quantity', value: string | number) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const addNewRow = () => {
        setItems(prev => [...prev, { id: generateId(), name: '', price: '', quantity: 1 }]);
    };

    const removeRow = (id: string) => {
        if (items.length === 1) return;
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSave = () => {
        // Filter out empty items
        const validItems = items.filter(item => item.name.trim() && item.price);

        if (validItems.length === 0) {
            onClose();
            return;
        }

        const newReceiptItems: ReceiptItem[] = validItems.map(item => ({
            id: generateId(),
            name: item.name,
            price: parseFloat(item.price.toString()) * item.quantity, // Store total price
            quantity: item.quantity,
            assignedTo: []
        }));

        onAdd(newReceiptItems);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-soft border border-white/50 flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-black tracking-tight">Add Items</h2>
                        <p className="text-gray-500 font-medium">Manually add items to the split</p>
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
                    {items.map((item, index) => (
                        <div key={item.id} className="flex gap-3 items-start animate-fade-in">
                            <div className="flex-1 space-y-3">
                                <input
                                    type="text"
                                    placeholder="Item Name (e.g. Pizza)"
                                    value={item.name}
                                    onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-black/10 rounded-xl px-4 py-3 font-bold text-black placeholder:text-gray-300 focus:outline-none transition-all"
                                    autoFocus={index === items.length - 1 && index > 0}
                                />
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{currency}</span>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={item.price}
                                            onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-black/10 rounded-xl pl-8 pr-4 py-3 font-bold text-black placeholder:text-gray-300 focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="w-24 flex items-center bg-gray-50 rounded-xl px-2 border-2 border-transparent">
                                        <button
                                            onClick={() => handleItemChange(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                                            className="p-1 text-gray-400 hover:text-black"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                            className="w-full bg-transparent text-center font-bold text-black focus:outline-none"
                                        />
                                        <button
                                            onClick={() => handleItemChange(item.id, 'quantity', item.quantity + 1)}
                                            className="p-1 text-gray-400 hover:text-black"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {items.length > 1 && (
                                <button
                                    onClick={() => removeRow(item.id)}
                                    className="p-3 mt-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
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
                        Add Another Item
                    </button>
                </div>

                {/* Footer */}
                <div className="p-6 md:p-8 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={handleSave}
                        disabled={!items.some(i => i.name.trim() && i.price)}
                        className="w-full bg-black text-white font-bold text-xl py-5 rounded-2xl shadow-lg hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Check size={24} />
                        Add {items.filter(i => i.name.trim() && i.price).length} Items
                    </button>
                </div>
            </div>
        </div>
    );
};
