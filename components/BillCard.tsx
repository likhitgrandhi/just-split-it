import React from 'react';
import { X } from 'lucide-react';
import { UploadedBill } from '../types';

interface BillCardProps {
    bill: UploadedBill;
    onRemove: (billId: string) => void;
}

export const BillCard: React.FC<BillCardProps> = ({ bill, onRemove }) => {
    const totalAmount = bill.items.reduce((sum, item) => sum + item.price, 0);
    const itemCount = bill.items.length;

    return (
        <div className="bg-nike-card border border-white/10 rounded-2xl p-4 hover:border-nike-volt/50 transition-all group">
            <div className="flex items-center justify-between gap-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-nike-gray border border-white/10">
                        <img
                            src={bill.imagePreview}
                            alt={bill.fileName}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Bill Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm truncate mb-1">
                        {bill.fileName}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-nike-subtext">
                        <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                        <span className="text-nike-volt font-bold">₹{totalAmount.toFixed(2)}</span>
                    </div>
                </div>

                {/* Delete button on right side */}
                <button
                    onClick={() => onRemove(bill.id)}
                    className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                    aria-label="Remove bill"
                >
                    <X size={14} className="text-white" strokeWidth={3} />
                </button>
            </div>
        </div>
    );
};
