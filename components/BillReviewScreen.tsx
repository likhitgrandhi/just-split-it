import React from 'react';
import { ArrowRight } from 'lucide-react';
import { UploadedBill } from '../types';
import { BillCard } from './BillCard';
import { UploadZone } from './UploadZone';

interface BillReviewScreenProps {
    uploadedBills: UploadedBill[];
    onRemoveBill: (billId: string) => void;
    onAddBill: (file: File) => void;
    onProceed: () => void;
    isProcessing: boolean;
}

export const BillReviewScreen: React.FC<BillReviewScreenProps> = ({
    uploadedBills,
    onRemoveBill,
    onAddBill,
    onProceed,
    isProcessing
}) => {
    const totalItems = uploadedBills.reduce((sum, bill) => sum + bill.items.length, 0);
    const totalAmount = uploadedBills.reduce(
        (sum, bill) => sum + bill.items.reduce((itemSum, item) => itemSum + item.price, 0),
        0
    );

    const hasBills = uploadedBills.length > 0;

    return (
        <div className="flex flex-col w-full">
            {/* Upload Zone at Top - Compact when bills exist */}
            <div className="mb-4">
                <UploadZone
                    onFileSelect={onAddBill}
                    isProcessing={isProcessing}
                    compact={hasBills}
                />
            </div>

            {/* Review Bills Section */}
            {hasBills && (
                <>
                    <div>
                        <div className="mb-4">
                            <h2 className="text-2xl md:text-3xl font-extrabold italic uppercase tracking-tighter mb-2">
                                Review Bills
                            </h2>
                            <p className="text-nike-subtext text-sm">
                                {uploadedBills.length} bill{uploadedBills.length !== 1 ? 's' : ''} uploaded · {totalItems} item{totalItems !== 1 ? 's' : ''} · ₹{totalAmount.toFixed(2)} total
                            </p>
                        </div>

                        {/* Uploaded Bills List */}
                        <div className="space-y-3 mb-6">
                            {uploadedBills.map(bill => (
                                <BillCard
                                    key={bill.id}
                                    bill={bill}
                                    onRemove={onRemoveBill}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Footer with Proceed Button - Natural flow */}
                    <div className="border-t border-white/10 pt-4">
                        <button
                            onClick={onProceed}
                            disabled={uploadedBills.length === 0 || isProcessing}
                            className="w-full py-4 bg-nike-volt text-black rounded-xl font-bold uppercase tracking-wider hover:bg-nike-volt-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                        >
                            <span>Proceed to Split</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
