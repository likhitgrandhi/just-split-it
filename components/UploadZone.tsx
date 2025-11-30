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
        relative group cursor-pointer w-full aspect-[4/5] md:aspect-[3/2] rounded-[3rem] border-2 border-transparent transition-all duration-300 flex flex-col items-center justify-center overflow-hidden
        ${isDragging ? 'bg-pastel-blue/80 scale-[1.02]' : 'bg-pastel-blue hover:bg-pastel-blue/80 hover:scale-[1.02]'}
        ${isProcessing ? 'opacity-80 pointer-events-none' : ''}
        shadow-sm
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/*"
        className="hidden"
      />

      {isProcessing ? (
        <div className="flex flex-col items-center animate-pulse">
          <Loader2 className="w-16 h-16 text-black animate-spin mb-6" />
          <h3 className="text-2xl font-bold text-black tracking-wide">Analyzing</h3>
          <p className="text-gray-600 text-base mt-2 font-medium">Extracting receipt data...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center p-8 transition-transform duration-300 group-hover:scale-105">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-sm transition-all duration-300 bg-white text-black group-hover:scale-110 group-hover:rotate-6`}>
            <Upload className="w-14 h-14" strokeWidth={2} />
          </div>
          <h3 className="text-3xl font-black text-black mb-3 tracking-tight">
            Upload Receipt
          </h3>
          <p className="text-gray-600 text-lg font-bold max-w-xs leading-relaxed opacity-80">
            Drop your bill here or tap to browse.
            <br />We'll handle the math.
          </p>
        </div>
      )}
    </div>
  );
};