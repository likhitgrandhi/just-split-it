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
        relative group cursor-pointer w-full aspect-[4/5] md:aspect-[3/2] rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden
        ${isDragging ? 'border-nike-volt bg-nike-gray' : 'border-nike-subtext/30 hover:border-nike-white bg-nike-card'}
        ${isProcessing ? 'opacity-80 pointer-events-none' : ''}
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
          <Loader2 className="w-12 h-12 text-nike-volt animate-spin mb-4" />
          <h3 className="text-xl font-bold text-white uppercase tracking-wider">Analyzing</h3>
          <p className="text-nike-subtext text-sm mt-2">Extracting receipt data...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center p-6 transition-transform duration-300 group-hover:scale-105">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isDragging ? 'bg-nike-volt text-black' : 'bg-nike-gray text-nike-volt'}`}>
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-extrabold text-white uppercase italic tracking-tighter mb-2">
            Upload Receipt
          </h3>
          <p className="text-nike-subtext font-medium max-w-xs">
            Drop your bill here or tap to browse. 
            <br/>We'll handle the math.
          </p>
        </div>
      )}
    </div>
  );
};