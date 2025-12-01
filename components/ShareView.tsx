import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, Copy, Loader2, Share2, Home } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { useSplit } from '../contexts/SplitContext';
import { useToast } from '../hooks/useToast';
import { Toast } from './Toast';

interface ShareViewProps {
  currency: string;
  onBack: () => void;
  onHome: () => void;
  // Optional props for backward compatibility
  items?: any;
  users?: any;
}

export const ShareView: React.FC<ShareViewProps> = ({ currency, onBack, onHome }) => {
  const { items, users, pin, isLiveMode } = useSplit();
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const exportRef = useRef<HTMLDivElement>(null);

  const [copyingId, setCopyingId] = useState<string | null>(null);
  const { toasts, hideToast, success, error: showError } = useToast();

  // Calculate data per user
  const userSplits = useMemo(() => {
    if (!users || !Array.isArray(users) || !items || !Array.isArray(items)) {
      return [];
    }
    return users.map(user => {
      const userItems = items
        .filter(item => item.assignedTo.includes(user.id))
        .map(item => ({
          ...item,
          splitPrice: item.price / item.assignedTo.length
        }));

      const total = userItems.reduce((sum, item) => sum + item.splitPrice, 0);

      return {
        user,
        items: userItems,
        total
      };
    });
  }, [items, users]);

  // Get the data for the user currently being copied
  const exportData = useMemo(() => {
    if (!copyingId) return null;
    return userSplits.find(u => u.user.id === copyingId);
  }, [copyingId, userSplits]);

  const handleCopyImage = (userId: string) => {
    setCopyingId(userId);
    // The actual capture happens in useEffect when exportData is ready
  };

  // Effect to capture image when exportData is ready
  React.useEffect(() => {
    if (!copyingId || !exportData || !exportRef.current) return;

    const captureImage = async () => {
      // Double-check the ref exists after a frame to ensure DOM is painted
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      if (!exportRef.current) {
        setCopyingId(null);
        return;
      }

      try {
        const blob = await htmlToImage.toBlob(exportRef.current, {
          cacheBust: true,
          backgroundColor: '#ffffff',
          width: 1080,
          style: {
            transform: 'scale(1)',
          }
        });

        if (!blob) {
          showError("Failed to generate image.");
          setCopyingId(null);
          return;
        }

        const userName = exportData.user.name;

        // Try Web Share API first (works on mobile)
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], `${userName}-split.png`, { type: 'image/png' });
          const shareData = {
            files: [file],
            title: `${userName}'s Split`,
            text: `Here's your split breakdown for ${userName}`
          };

          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            setCopyingId(null);
            return;
          }
        }

        // Fallback 1: Try clipboard
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          success("Image copied to clipboard!");
          setCopyingId(null);
          return;
        } catch (clipErr) {
          console.log("Clipboard failed, trying download...", clipErr);
        }

        // Fallback 2: Download image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${userName}-split.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setCopyingId(null);

      } catch (err) {
        console.error("Share failed", err);
        showError("Could not share image. Please try again.");
        setCopyingId(null);
      }
    };

    captureImage();
  }, [copyingId, exportData, success, showError]);

  const handleSharePin = async () => {
    if (!pin) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?join=${pin}`;
    const shareText = `Join my split! Use PIN: ${pin}\n\nOr click: ${shareUrl}`;

    try {
      // Try Web Share API first
      if (navigator.share) {
        await navigator.share({
          title: 'Join Split',
          text: shareText,
        });
        return;
      }
    } catch (err) {
      console.log("Web Share failed, trying clipboard...", err);
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      success("Link copied! Share it with your friends.");
    } catch (err) {
      // Last resort: Show the text
      showError("Could not copy link. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in bg-white overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:px-6 md:py-4 border-b border-gray-100 md:border-none flex-shrink-0">
        <div className="flex gap-3 md:gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1 md:gap-2 text-cloud-subtext active:text-black md:hover:text-black transition-colors group touch-manipulation"
          >
            <ArrowLeft size={18} className="md:group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold uppercase tracking-wider text-xs md:text-sm">Back</span>
          </button>
          <button
            onClick={onHome}
            className="flex items-center gap-1 md:gap-2 text-cloud-subtext active:text-black md:hover:text-black transition-colors group touch-manipulation"
          >
            <Home size={18} />
            <span className="font-bold uppercase tracking-wider text-xs md:text-sm hidden md:inline">Home</span>
          </button>
        </div>

        <div className="flex flex-col items-end">
          <h1 className="text-xl md:text-3xl font-black tracking-tighter text-cloud-logo lowercase select-none relative inline-block">
            <span className="absolute inset-0 text-stroke-2 md:text-stroke-4 text-white z-0" aria-hidden="true">splitto</span>
            <span className="relative z-10">splitto</span>
          </h1>
          {isLiveMode && pin && (
            <button onClick={handleSharePin} className="flex items-center gap-1 text-[10px] md:text-xs font-mono text-cloud-subtext active:text-black transition-colors">
              PIN: <span className="font-bold text-black">{pin}</span> <Copy size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Vertical Stack Container */}
      <div className="flex-1 overflow-y-auto relative min-h-0 w-full bg-gray-50/50">
        <div className="w-full min-h-full flex flex-col gap-6 items-center py-8 px-4">
          {userSplits.map((data) => {
            const isCopying = copyingId === data.user.id;
            const isHex = data.user.color.startsWith('#');

            return (
              <div
                key={data.user.id}
                ref={(el) => { cardRefs.current[data.user.id] = el; }}
                className="w-full max-w-md bg-white border border-black/5 rounded-[2rem] overflow-hidden flex flex-col shadow-xl relative group transition-transform hover:scale-[1.01] duration-300"
                style={{ height: 'auto' }}
              >
                {/* Card Header */}
                <div className="p-6 pb-3 flex flex-col items-center">
                  <div
                    className={`w-16 h-16 rounded-full mb-3 flex items-center justify-center shadow-md border-4 border-white ${!isHex ? data.user.color : ''}`}
                    style={isHex ? { backgroundColor: data.user.color } : {}}
                  >
                    <span className="text-2xl font-black text-white">{data.user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <h3 className="text-xl font-black text-black mb-1 text-center tracking-tight">
                    {data.user.name}
                  </h3>
                  <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                    Total Share
                  </div>
                </div>

                {/* Amount */}
                <div className="flex justify-center py-3">
                  <span className="text-4xl font-black text-black bg-pastel-yellow px-6 py-2 rounded-2xl transform -rotate-2 shadow-sm border border-black/5">
                    {currency}{data.total.toFixed(2)}
                  </span>
                </div>

                {/* Item List */}
                <div className="flex-1 overflow-y-auto px-6 pb-20 no-scrollbar space-y-2 mt-2">
                  {data.items.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8 font-medium">
                      No items assigned
                    </div>
                  ) : (
                    data.items.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="flex justify-between items-center text-sm group/item p-2 active:bg-gray-50 rounded-xl transition-colors">
                        <span className="text-gray-600 font-bold truncate max-w-[180px] flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0"></div>
                          {item.name}
                        </span>
                        <span className="font-bold text-black bg-gray-100 px-2 py-1 rounded-lg text-xs flex-shrink-0">
                          {currency}{item.splitPrice.toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}

                  {/* Branding Footer */}
                  <div className="pt-6 pb-2 flex justify-center opacity-30">
                    <span className="text-[10px] font-bold uppercase tracking-widest">splitto</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pt-12">
                  <button
                    onClick={() => handleCopyImage(data.user.id)}
                    disabled={isCopying}
                    className={`
                        w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 touch-manipulation shadow-lg
                        ${isCopying ? 'bg-gray-100 text-gray-400 cursor-wait' : 'bg-black text-white active:bg-gray-800 active:scale-[0.98]'}
                    `}
                  >
                    {isCopying ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Share2 size={14} />
                        Share
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hidden Export View - High Resolution */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
        {exportData && (
          <div
            ref={exportRef}
            id="export-container"
            className="bg-white p-12 flex flex-col items-center relative"
            style={{ width: '1080px', minHeight: '1920px' }} // Instagram Story dimensions
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gray-50/50 z-0"></div>

            {/* Content Container */}
            <div className="relative z-10 w-full flex flex-col items-center flex-1">

              {/* Logo */}
              <div className="mb-12 mt-8">
                <h1 className="text-7xl font-black tracking-tighter text-cloud-logo lowercase select-none relative inline-block">
                  <span className="absolute inset-0 text-stroke-4 text-white z-0" aria-hidden="true">splitto</span>
                  <span className="relative z-10">splitto</span>
                </h1>
              </div>

              {/* User Avatar */}
              <div
                className={`w-40 h-40 rounded-full mb-8 flex items-center justify-center shadow-lg border-8 border-white ${!exportData.user.color.startsWith('#') ? exportData.user.color : ''}`}
                style={exportData.user.color.startsWith('#') ? { backgroundColor: exportData.user.color } : {}}
              >
                <span className="text-7xl font-black text-white">{exportData.user.name.charAt(0).toUpperCase()}</span>
              </div>

              {/* User Name */}
              <h2 className="text-5xl font-black text-black mb-4 text-center tracking-tight">
                {exportData.user.name}
              </h2>
              <div className="text-gray-400 text-xl font-bold uppercase tracking-widest mb-12">
                Total Share
              </div>

              {/* Total Amount */}
              <div className="mb-16">
                <span className="text-8xl font-black text-black bg-pastel-yellow px-12 py-6 rounded-[3rem] transform -rotate-2 shadow-md border-2 border-black/5 inline-block">
                  {currency}{exportData.total.toFixed(2)}
                </span>
              </div>

              {/* Items List */}
              <div className="w-full max-w-3xl bg-white rounded-[3rem] p-10 shadow-xl border border-black/5 flex-1 mb-12">
                <h3 className="text-2xl font-bold text-gray-400 uppercase tracking-widest mb-8 text-center">Breakdown</h3>
                <div className="space-y-6">
                  {exportData.items.length === 0 ? (
                    <div className="text-center text-gray-400 text-2xl py-12 font-medium">
                      No items assigned
                    </div>
                  ) : (
                    exportData.items.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="flex justify-between items-start text-3xl p-4 border-b border-gray-100 last:border-0">
                        <span className="text-gray-700 font-bold flex items-start gap-4 flex-1 mr-8">
                          <div className="w-3 h-3 rounded-full bg-gray-300 flex-shrink-0 mt-4"></div>
                          <span className="leading-tight">{item.name}</span>
                        </span>
                        <span className="font-black text-black bg-gray-100 px-4 py-2 rounded-xl flex-shrink-0">
                          {currency}{item.splitPrice.toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto mb-8 text-center">
                <p className="text-gray-400 text-xl font-medium">Split with style on Splitto</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </div>
  );
};
