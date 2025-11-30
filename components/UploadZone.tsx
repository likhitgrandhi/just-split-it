import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (files: File[]) => void; // Changed to accept array of files
  isProcessing: boolean;
  compact?: boolean; // New prop for compact horizontal layout
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isProcessing, compact = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFileSelect(filesArray);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFileSelect(filesArray);
      // Reset the input value to allow selecting the same file again or uploading more files
      e.target.value = '';
    }
  };

  return (
    <div
      onClick={isProcessing ? undefined : handleClick}
      onDragOver={isProcessing ? undefined : handleDragOver}
      onDragLeave={isProcessing ? undefined : handleDragLeave}
      onDrop={isProcessing ? undefined : handleDrop}
      className={`
        relative group cursor-pointer w-full rounded-3xl border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden
        ${compact ? 'p-4' : 'aspect-[4/5] md:aspect-[3/2] flex-col'}
        ${isDragging ? 'border-nike-volt bg-nike-gray' : 'border-nike-subtext/30 hover:border-nike-white bg-nike-card'}
        ${isProcessing ? 'opacity-80 pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/*"
        multiple
        className="hidden"
      />

      {isProcessing ? (
        compact ? (
          // Compact horizontal analyzing layout
          <div className="flex items-center gap-4 w-full">
            <Loader2 className="w-12 h-12 text-nike-volt animate-spin flex-shrink-0" />
            <div className="flex-1 text-left">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Analyzing</h3>
              <p className="text-nike-subtext text-sm">Extracting receipt data...</p>
            </div>
          </div>
        ) : (
          // Default vertical analyzing layout
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className="w-12 h-12 text-nike-volt animate-spin mb-4" />
            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Analyzing</h3>
            <p className="text-nike-subtext text-sm mt-2">Extracting receipt data...</p>
          </div>
        )
      ) : compact ? (
        // Compact horizontal layout
        <div className="flex items-center gap-4 w-full">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isDragging ? 'bg-nike-volt text-black' : 'bg-nike-gray text-nike-volt'}`}>
            <Upload className="w-6 h-6" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-lg font-extrabold text-white uppercase italic tracking-tighter">
              Upload Receipt
            </h3>
            <p className="text-nike-subtext text-sm font-medium">
              Drop or tap to add more bills
            </p>
          </div>
        </div>
      ) : (
        // Default vertical layout
        <div className="flex flex-col items-center text-center p-6 transition-transform duration-300 group-hover:scale-105">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isDragging ? 'bg-nike-volt text-black' : 'bg-nike-gray text-nike-volt'}`}>
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-extrabold text-white uppercase italic tracking-tighter mb-2">
            Upload Receipts
          </h3>
          <p className="text-nike-subtext font-medium max-w-xs">
            Drop your bills here or tap to browse.
            <br />Select multiple receipts at once!
          </p>
        </div>
      )}
    </div>
  );
};