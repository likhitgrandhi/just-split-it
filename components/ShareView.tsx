import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ArrowLeft, Copy, Loader2, CheckCircle2, Share2, Home } from 'lucide-react';
import html2canvas from 'html2canvas';
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
  const { items, users, pin, createSplit, isLiveMode } = useSplit();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [isCreatingPin, setIsCreatingPin] = useState(false);
  const { toasts, hideToast, success, error: showError } = useToast();

  // Note: We no longer auto-generate PIN for manual mode
  // PINs are only created in live mode when the host explicitly creates a room

  // Calculate data per user
  const userSplits = useMemo(() => {
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

  const handleCopyImage = async (userId: string, userName: string) => {
    const element = cardRefs.current[userId];
    if (!element) return;

    setCopyingId(userId);

    // 1. Create a deep clone of the card to manipulate for the screenshot
    const clone = element.cloneNode(true) as HTMLElement;

    // 2. Style the clone
    Object.assign(clone.style, {
      position: 'fixed',
      top: '-10000px',
      left: '-10000px',
      width: '375px',
      height: 'auto',
      maxHeight: 'none',
      transform: 'none',
      zIndex: '-1',
      borderRadius: '24px',
    });

    // 3. Fix internal layout
    const scrollContainer = clone.querySelector('.overflow-y-auto');
    if (scrollContainer) {
      const el = scrollContainer as HTMLElement;
      el.style.overflow = 'visible';
      el.style.height = 'auto';
      el.style.maxHeight = 'none';
      el.classList.remove('pb-24');
      el.style.paddingBottom = '2rem';
    }

    // Remove buttons
    const actionContainer = clone.querySelector('.ignore-in-capture');
    if (actionContainer) {
      actionContainer.remove();
    }

    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, {
        backgroundColor: '#1C1C1E',
        scale: 3,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      canvas.toBlob(async (blob) => {
        document.body.removeChild(clone);

        if (!blob) {
          showError("Failed to generate image.");
          setCopyingId(null);
          return;
        }

        try {
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
            setTimeout(() => setCopyingId(null), 1500);
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
          setTimeout(() => setCopyingId(null), 1500);

        } catch (err) {
          console.error("Share failed", err);
          showError("Could not share image. Please try again.");
          setCopyingId(null);
        }
      }, 'image/png');

    } catch (error) {
      console.error("Error generating image:", error);
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
      setCopyingId(null);
    }
  };

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
    <div className="flex flex-col h-full animate-fade-in bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:px-6 md:py-4 border-b border-gray-100 md:border-none">
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

      {/* Carousel Container */}
      <div className="flex-1 flex items-center justify-start overflow-hidden relative">
        <div
          ref={scrollContainerRef}
          className="w-full h-full overflow-x-auto flex gap-3 md:gap-6 snap-x snap-mandatory no-scrollbar px-4 md:px-8 items-center py-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {userSplits.map((data) => {
            const isCopying = copyingId === data.user.id;
            const isHex = data.user.color.startsWith('#');

            return (
              <div
                key={data.user.id}
                ref={(el) => { cardRefs.current[data.user.id] = el; }}
                className="snap-center shrink-0 w-[85vw] max-w-xs md:max-w-sm bg-white border border-black/5 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex flex-col shadow-xl relative group"
                style={{ height: 'min(500px, 70dvh)' }}
              >
                {/* Card Header */}
                <div className="p-6 md:p-8 pb-3 md:pb-4 flex flex-col items-center">
                  <div
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-full mb-3 md:mb-4 flex items-center justify-center shadow-md border-4 border-white ${!isHex ? data.user.color : ''}`}
                    style={isHex ? { backgroundColor: data.user.color } : {}}
                  >
                    <span className="text-2xl md:text-3xl font-black text-white">{data.user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-black mb-1 text-center">
                    {data.user.name}
                  </h3>
                  <div className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                    Total Share
                  </div>
                </div>

                {/* Amount */}
                <div className="flex justify-center py-3 md:py-4">
                  <span className="text-3xl md:text-4xl font-black text-black bg-pastel-yellow px-5 md:px-6 py-2 rounded-xl md:rounded-2xl transform -rotate-2 shadow-sm border border-black/5">
                    {currency}{data.total.toFixed(2)}
                  </span>
                </div>

                {/* Item List */}
                <div className="flex-1 overflow-y-auto px-5 md:px-6 pb-20 no-scrollbar space-y-1.5 md:space-y-2 mt-1 md:mt-2">
                  {data.items.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8 font-medium">
                      No items assigned
                    </div>
                  ) : (
                    data.items.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="flex justify-between items-center text-xs md:text-sm group/item p-1.5 md:p-2 active:bg-gray-50 md:hover:bg-gray-50 rounded-lg md:rounded-xl transition-colors">
                        <span className="text-gray-600 font-bold truncate max-w-[150px] md:max-w-[180px] flex items-center gap-1.5 md:gap-2">
                          <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-gray-300"></div>
                          {item.name}
                        </span>
                        <span className="font-bold text-black bg-gray-100 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md md:rounded-lg text-[10px] md:text-xs">
                          {currency}{item.splitPrice.toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}

                  {/* Branding Footer */}
                  <div className="pt-6 md:pt-8 pb-2 md:pb-4 flex justify-center opacity-30">
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">splitto</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-white via-white to-transparent ignore-in-capture pt-10 md:pt-12">
                  <button
                    onClick={() => handleCopyImage(data.user.id, data.user.name)}
                    disabled={isCopying}
                    className={`
                        w-full py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all flex items-center justify-center gap-2 touch-manipulation shadow-lg
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

      {/* Scroll Indicators / Hint */}
      <div className="flex justify-center gap-1.5 md:gap-2 pb-4 md:pb-6">
        {userSplits.map((_, idx) => (
          <div
            key={idx}
            className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gray-200"
          />
        ))}
      </div>
      <div className="text-center text-cloud-subtext text-[10px] uppercase tracking-widest pb-3 md:hidden">
        ← Swipe for more →
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
