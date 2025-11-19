import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ArrowLeft, Copy, Loader2, CheckCircle2, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useSplit } from '../contexts/SplitContext';
import { useToast } from '../hooks/useToast';
import { Toast } from './Toast';

interface ShareViewProps {
  currency: string;
  onBack: () => void;
  // Optional props for backward compatibility
  items?: any;
  users?: any;
}

export const ShareView: React.FC<ShareViewProps> = ({ currency, onBack }) => {
  const { items, users, pin, createSplit } = useSplit();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [isCreatingPin, setIsCreatingPin] = useState(false);
  const { toasts, hideToast, success, error: showError } = useToast();

  // Auto-generate PIN if not exists
  useEffect(() => {
    if (!pin && !isCreatingPin) {
      const initSplit = async () => {
        setIsCreatingPin(true);
        try {
          await createSplit();
        } catch (err) {
          console.error("Failed to create split", err);
        } finally {
          setIsCreatingPin(false);
        }
      };
      initSplit();
    }
  }, [pin, createSplit, isCreatingPin]);

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
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6 px-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 md:gap-2 text-nike-subtext active:text-white md:hover:text-white transition-colors group touch-manipulation"
        >
          <ArrowLeft size={18} className="md:group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold uppercase tracking-wider text-xs md:text-sm">Back</span>
        </button>

        <div className="flex flex-col items-end">
          <h2 className="text-base md:text-xl font-extrabold italic uppercase tracking-tighter text-nike-volt">
            Share Results
          </h2>
          {pin ? (
            <button onClick={handleSharePin} className="flex items-center gap-1 text-xs font-mono text-white/70 hover:text-white transition-colors">
              PIN: <span className="font-bold text-white">{pin}</span> <Copy size={10} />
            </button>
          ) : (
            <span className="text-xs text-white/50 animate-pulse">Generating PIN...</span>
          )}
        </div>
      </div>

      {/* Carousel Container */}
      <div className="flex-1 flex items-center justify-start overflow-hidden relative">
        <div
          ref={scrollContainerRef}
          className="w-full h-full overflow-x-auto flex gap-4 md:gap-6 snap-x snap-mandatory no-scrollbar px-4 md:px-8 items-center pb-8"
          style={{ scrollBehavior: 'smooth' }}
        >
          {userSplits.map((data) => {
            const isCopying = copyingId === data.user.id;

            return (
              <div
                key={data.user.id}
                ref={(el) => { cardRefs.current[data.user.id] = el; }}
                className="snap-center shrink-0 w-full max-w-xs md:max-w-sm bg-nike-card border border-white/10 rounded-2xl md:rounded-3xl overflow-hidden flex flex-col shadow-2xl relative group"
                style={{ height: 'min(550px, 80vh)' }}
              >
                {/* Card Header */}
                <div className="p-6 md:p-8 flex flex-col items-center bg-gradient-to-b from-white/5 to-transparent">
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full ${data.user.color} mb-3 md:mb-4 flex items-center justify-center shadow-lg`}>
                    <span className="text-xl md:text-2xl">👤</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-extrabold italic uppercase tracking-tighter text-center text-white">
                    {data.user.name}
                  </h3>
                  <div className="text-nike-subtext text-xs font-bold uppercase tracking-widest mt-1">
                    Owes
                  </div>
                </div>

                {/* Dashed Separator */}
                <div className="w-full px-4 md:px-6">
                  <div className="border-t-2 border-dashed border-white/10 h-px w-full"></div>
                </div>

                {/* Amount */}
                <div className="text-center py-5 md:py-6">
                  <span className="text-4xl md:text-6xl font-condensed font-bold text-nike-volt tracking-tighter drop-shadow-[0_0_15px_rgba(203,243,0,0.3)]">
                    {currency}{data.total.toFixed(2)}
                  </span>
                </div>

                {/* Item List */}
                <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-20 md:pb-24 no-scrollbar space-y-2 md:space-y-3 border-t border-white/5 pt-3 md:pt-4">
                  {data.items.length === 0 ? (
                    <div className="text-center text-nike-subtext text-sm py-4 italic">
                      No items assigned
                    </div>
                  ) : (
                    data.items.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="flex justify-between items-start gap-3 text-sm group/item">
                        <span className="text-nike-subtext font-medium break-words flex-1 group-hover/item:text-white transition-colors">
                          {item.name}
                        </span>
                        <span className="font-mono font-bold text-white whitespace-nowrap">
                          {currency}{item.splitPrice.toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}

                  {/* Branding Footer */}
                  <div className="pt-4 pb-2 flex justify-center opacity-30">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Just Split It</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-nike-card via-nike-card to-transparent ignore-in-capture">
                  <button
                    onClick={() => handleCopyImage(data.user.id, data.user.name)}
                    disabled={isCopying}
                    className={`
                        w-full py-3 rounded-xl font-extrabold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 touch-manipulation
                        ${isCopying ? 'bg-white text-black cursor-wait' : 'bg-white text-black active:bg-nike-volt md:hover:bg-nike-volt'}
                    `}
                  >
                    {isCopying ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy as Image
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
      <div className="flex justify-center gap-2 pb-6">
        {userSplits.map((_, idx) => (
          <div
            key={idx}
            className="w-2 h-2 rounded-full bg-white/20"
          />
        ))}
      </div>
      <div className="text-center text-nike-subtext text-[10px] uppercase tracking-widest pb-4 md:hidden">
        Swipe for more
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
