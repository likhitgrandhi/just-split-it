import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { UploadZone } from './UploadZone';

interface AddReceiptModalProps {
    onClose: () => void;
    onUpload: (files: File[]) => void;
}

export const AddReceiptModal: React.FC<AddReceiptModalProps> = ({ onClose, onUpload }) => {
    const handleFileSelect = (files: File[]) => {
        onUpload(files);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-nike-card rounded-3xl max-w-2xl w-full p-8 relative shadow-2xl border border-white/10 animate-fade-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                >
                    <X className="w-5 h-5 text-white" />
                </button>

                <div className="mb-6">
                    <div className="w-16 h-16 bg-nike-volt rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload size={32} className="text-black" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold italic uppercase tracking-tighter text-nike-volt text-center">
                        Add Receipt
                    </h2>
                    <p className="text-nike-subtext text-sm text-center mt-2">
                        Upload more bills to add to this split
                    </p>
                </div>

                <UploadZone onFileSelect={handleFileSelect} isUploading={false} />
            </div>
        </div>
    );
};
