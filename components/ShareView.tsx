import React, { useMemo, useRef, useState } from 'react';
import { ReceiptItem, User } from '../types';
import { ArrowLeft, Copy, Loader2, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ShareViewProps {
  items: ReceiptItem[];
  users: User[];
  currency: string;
  onBack: () => void;
}

export const ShareView: React.FC<ShareViewProps> = ({ items, users, currency, onBack }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // We use a ref map to access individual card DOM elements
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const [copyingId, setCopyingId] = useState<string | null>(null);

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
    // This avoids messing up the UI and allows us to expand the card to full height
    const clone = element.cloneNode(true) as HTMLElement;

    // 2. Style the clone to be off-screen but fully rendered
    Object.assign(clone.style, {
        position: 'fixed',
        top: '-10000px',
        left: '-10000px',
        width: '375px', // Standard mobile width for consistent nice look
        height: 'auto', // Allow it to grow naturally
        maxHeight: 'none',
        transform: 'none', // Remove any carousel scaling/transforms
        zIndex: '-1',
        borderRadius: '24px', // Ensure border radius is captured
    });

    // 3. Fix internal layout for the snapshot
    // Find the scrollable list container and unconstrain it
    const scrollContainer = clone.querySelector('.overflow-y-auto');
    if (scrollContainer) {
        const el = scrollContainer as HTMLElement;
        el.style.overflow = 'visible';
        el.style.height = 'auto';
        el.style.maxHeight = 'none';
        el.classList.remove('pb-24'); // Remove the large padding meant for the button
        el.style.paddingBottom = '2rem'; // Add reasonable padding
    }

    // Remove the 'Copy' button container completely from the clone
    // (We don't want the button in the image)
    const actionContainer = clone.querySelector('.ignore-in-capture');
    if (actionContainer) {
        actionContainer.remove();
    }

    // Append to body so html2canvas can render it
    document.body.appendChild(clone);

    try {
      // Generate canvas from the cloned element
      const canvas = await html2canvas(clone, {
        backgroundColor: '#1C1C1E', // Explicitly set background color
        scale: 3, // 3x scale for high resolution (crisp text)
        logging: false,
        useCORS: true,
        allowTaint: true,
        onclone: (doc) => {
            // Optional: Perform any other DOM manipulations inside the cloned doc if needed
        }
      });

      canvas.toBlob(async (blob) => {
        // Clean up the clone immediately
        document.body.removeChild(clone);

        if (!blob) {
            alert("Failed to generate image.");
            setCopyingId(null);
            return;
        }

        try {
          // Use the Clipboard API to write the image
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          
          // Show success state briefly then reset
          setTimeout(() => setCopyingId(null), 1500);
        } catch (err) {
          console.error("Clipboard write failed", err);
          alert("Could not copy image. Please try in a secure context (HTTPS).");
          setCopyingId(null);
        }
      }, 'image/png');

    } catch (error) {
      console.error("Error generating image:", error);
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
      alert("Failed to generate receipt image.");
      setCopyingId(null);
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
        <h2 className="text-base md:text-xl font-extrabold italic uppercase tracking-tighter text-nike-volt">
          Share Results
        </h2>
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
                <div className="text-center py-3 md:py-4">
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
                      <div key={`${item.id}-${idx}`} className="flex justify-between items-center text-sm group/item">
                        <span className="text-nike-subtext font-medium truncate pr-4 group-hover/item:text-white transition-colors">
                          {item.name}
                        </span>
                        <span className="font-mono font-bold text-white">
                          {currency}{item.splitPrice.toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                  
                  {/* Branding Footer for the Image (Visible only in screenshot mostly, but helps branding) */}
                  <div className="pt-4 pb-2 flex justify-center opacity-30">
                     <span className="text-[10px] font-bold uppercase tracking-widest">Just Split It</span>
                  </div>
                </div>

                {/* Card Actions (Ignored in Screenshot via logic) */}
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
    </div>
  );
};