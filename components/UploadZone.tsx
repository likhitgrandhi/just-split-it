import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isProcessing }) => {
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onClick={isProcessing ? undefined : handleClick}
      onDragOver={isProcessing ? undefined : handleDragOver}
      onDragLeave={isProcessing ? undefined : handleDragLeave}
      onDrop={isProcessing ? undefined : handleDrop}
      className={`
        relative group cursor-pointer w-full flex-1 min-h-[280px] md:min-h-[320px] rounded-[2rem] md:rounded-[3rem] border-2 border-transparent transition-all duration-300 flex flex-col items-center justify-center overflow-hidden
        ${isDragging ? 'bg-pastel-blue/80 scale-[1.02]' : 'bg-pastel-blue active:bg-pastel-blue/80'}
        ${isProcessing ? 'opacity-80 pointer-events-none' : ''}
        shadow-sm
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {isProcessing ? (
        <div className="flex flex-col items-center animate-pulse">
          <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-black animate-spin mb-4 md:mb-6" />
          <h3 className="text-xl md:text-2xl font-bold text-black tracking-wide">Analyzing</h3>
          <p className="text-gray-600 text-sm md:text-base mt-2 font-medium">Extracting receipt data...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center p-6 md:p-8 transition-transform duration-300">
          <div className="w-20 h-20 md:w-32 md:h-32 rounded-full flex items-center justify-center mb-5 md:mb-8 shadow-sm transition-all duration-300 bg-white text-black">
            <Upload className="w-9 h-9 md:w-14 md:h-14" strokeWidth={2} />
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-black mb-2 md:mb-3 tracking-tight">
            Upload Receipt
          </h3>
          <p className="text-gray-600 text-sm md:text-lg font-bold max-w-xs leading-relaxed opacity-80">
            Tap to take a photo or browse.
            <br className="hidden md:block" />
            <span className="md:hidden"> </span>We'll handle the math.
          </p>
        </div>
      )}
    </div>
  );
};