import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
      const file = e.dataTransfer.files[0];
      setPreviewUrl(URL.createObjectURL(file));
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreviewUrl(URL.createObjectURL(file));
      onFileSelect(file);
    }
  };

  return (
    <div
      onClick={isProcessing ? undefined : handleClick}
      onDragOver={isProcessing ? undefined : handleDragOver}
      onDragLeave={isProcessing ? undefined : handleDragLeave}
      onDrop={isProcessing ? undefined : handleDrop}
      className={`
        relative group cursor-pointer w-full h-full min-h-[400px] transition-all duration-500 flex flex-col items-center justify-center overflow-hidden
        ${isDragging ? 'bg-nike-forest/5 scale-[1.02]' : ''}
        ${!isProcessing && !isDragging ? 'bg-transparent hover:bg-nike-forest/5' : ''}
        ${isProcessing ? 'bg-white/80 scale-100 pointer-events-none' : ''}
      `}
      style={{
        backgroundImage: !previewUrl ? 'radial-gradient(rgba(22, 51, 0, 0.1) 1px, transparent 1px)' : 'none',
        backgroundSize: '40px 40px'
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/*"
        className="hidden"
      />

      {/* Image Preview */}
      {previewUrl && isProcessing && (
        <div className="absolute inset-0 z-0">
          <img src={previewUrl} alt="Receipt Preview" className="w-full h-full object-cover opacity-50 blur-sm" />
          <div className="absolute inset-0 bg-white/30"></div>
        </div>
      )}

      {/* Jagged Edges Removed for Clean Look */}

      {isProcessing ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          {/* Scanning Line */}
          <div className="absolute left-0 right-0 h-1 bg-nike-volt shadow-[0_0_20px_rgba(203,243,0,0.8)] animate-scan z-10"></div>

          {/* Sparkles - Dotted */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-nike-volt rounded-full animate-sparkle shadow-[0_0_5px_rgba(203,243,0,0.8)]"
              style={{
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 80 + 10}%`,
                animationDelay: `${Math.random() * 1.5}s`
              }}
            />
          ))}

          <div className="z-20 bg-black/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-white/10 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-nike-volt animate-spin" />
            <span className="font-bold text-sm uppercase tracking-wider text-white">Scanning...</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center p-6 transition-transform duration-500 group-hover:scale-105 z-10">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 transition-all duration-500 ${isDragging ? 'bg-nike-volt text-nike-forest scale-110' : 'bg-nike-forest/5 text-nike-forest group-hover:bg-nike-volt group-hover:text-nike-forest'}`}>
            <Upload className="w-10 h-10" strokeWidth={2.5} />
          </div>
          <h3 className="text-5xl font-bold text-nike-forest tracking-tighter mb-4">
            Upload
          </h3>
          <p className="text-nike-subtext font-medium text-lg max-w-[250px] leading-relaxed">
            Drop receipt or click to browse
          </p>
        </div>
      )}
    </div>
  );
};