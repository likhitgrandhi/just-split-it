import React, { useMemo } from 'react';
import { Check, Share2, Lock } from 'lucide-react';
import { useSplit } from '../contexts/SplitContext';

interface SplitterProps {
  onReset: () => void;
  onShare: () => void;
  currency: string;
  // Keeping these optional for backward compatibility if needed, but we'll use context
  items?: any;
  users?: any;
  setItems?: any;
}

export const Splitter: React.FC<SplitterProps> = ({ onReset, onShare, currency }) => {
  const {
    items, setItems,
    users,
    currentUser,
    updateItemAssignment,
    pin,
    createSplit,
    splitStatus,
    startRoom,
    isHost,
    toggleLock,
    endSplit
  } = useSplit();

  const toggleAssignment = (itemId: string, userId: string) => {
    // If we are in a split (pin exists) and we are not the user being toggled, prevent it
    if (pin && currentUser && userId !== currentUser.id) {
      return;
    }

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const isAssigned = item.assignedTo.includes(userId);
    updateItemAssignment(itemId, userId, isAssigned ? 'remove' : 'add');
  };

  const totals = useMemo(() => {
    const userTotals: Record<string, number> = {};
    let grandTotal = 0;

    // Initialize 0
    users.forEach(u => userTotals[u.id] = 0);

    items.forEach(item => {
      grandTotal += item.price;
      if (item.assignedTo.length > 0) {
        const splitPrice = item.price / item.assignedTo.length;
        item.assignedTo.forEach(uid => {
          if (userTotals[uid] !== undefined) {
            userTotals[uid] += splitPrice;
          }
        });
      }
    });

    return { userTotals, grandTotal };
  }, [items, users]);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 md:gap-6 overflow-hidden">
      {/* Left Column: Items List */}
      <div className="flex-1 flex flex-col min-h-0 bg-nike-card rounded-2xl md:rounded-3xl overflow-hidden border border-white/5">
        <div className="bg-nike-card border-b border-white/10 p-4 md:p-6 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold italic uppercase tracking-tighter">
              Split Bill
              {splitStatus === 'locked' && <span className="ml-2 text-sm not-italic font-normal text-nike-subtext bg-white/10 px-2 py-1 rounded-md">🔒 Locked</span>}
            </h2>
            {pin && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-nike-subtext text-sm font-mono tracking-widest">PIN: <span className="text-white font-bold">{pin}</span></span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {isHost && splitStatus === 'waiting' && (
              <button
                onClick={startRoom}
                className="bg-nike-volt text-black px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-sm hover:bg-nike-volt-hover transition-colors"
              >
                Start Splitting
              </button>
            )}

            {isHost && splitStatus !== 'waiting' && (
              <div className="flex gap-2">
                <button
                  onClick={toggleLock}
                  className={`px-3 py-2 rounded-lg font-bold uppercase tracking-wider text-xs transition-colors border ${splitStatus === 'locked'
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-white border-white/20 hover:bg-white/10'
                    }`}
                >
                  {splitStatus === 'locked' ? 'Unlock' : 'Lock'}
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to end this split? This cannot be undone.')) {
                      endSplit();
                    }
                  }}
                  className="px-3 py-2 rounded-lg font-bold uppercase tracking-wider text-xs bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30 transition-colors"
                >
                  End
                </button>
              </div>
            )}

            <button
              onClick={onShare}
              className="p-2 rounded-full bg-nike-gray text-white hover:bg-white/10 transition-colors"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 md:p-4 space-y-3">
          {items.map(item => {
            const isUnassigned = item.assignedTo.length === 0;

            return (
              <div key={item.id} className="bg-black/40 rounded-xl p-3 md:p-4 transition-colors active:bg-black/70 md:hover:bg-black/60 group">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h3 className="font-bold text-white text-base md:text-lg group-hover:text-nike-volt transition-colors flex-1 break-words">{item.name}</h3>
                  <div className="font-mono font-bold text-nike-volt text-sm md:text-base whitespace-nowrap">
                    {currency}{item.price.toFixed(2)}
                  </div>
                </div>

                {/* User Chips */}
                <div className="flex flex-wrap gap-2">
                  {users.map(user => {
                    const isSelected = item.assignedTo.includes(user.id);
                    // Lock if in a split (pin set) AND user is not me
                    const isLocked = pin && currentUser && user.id !== currentUser.id;

                    return (
                      <button
                        key={user.id}
                        onClick={() => toggleAssignment(item.id, user.id)}
                        disabled={!!isLocked}
                        className={`
                          px-3 py-2 md:py-1.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 transition-all touch-manipulation
                          ${isSelected
                            ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.3)] scale-105'
                            : 'bg-nike-gray text-nike-subtext border border-white/10'}
                          ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:border-white/50 md:hover:border-white/50'}
                        `}
                      >
                        {isSelected && <Check size={12} className="text-black" />}
                        {user.name}
                        {isLocked && <Lock size={10} className="ml-1 opacity-50" />}
                      </button>
                    );
                  })}
                </div>
                {isUnassigned && (
                  <div className="mt-2 text-[10px] text-red-500 font-bold uppercase tracking-widest text-right">
                    Unassigned
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Summary */}
      <div className="lg:w-96 flex flex-col bg-nike-card rounded-2xl md:rounded-3xl overflow-hidden border border-white/5 max-h-[60vh] lg:max-h-none">
        <div className="p-4 md:p-6 bg-nike-volt relative overflow-hidden">
          {/* Abstract pattern overlay */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 -translate-y-8 translate-x-8 rotate-45"></div>

          <h2 className="text-black text-3xl md:text-4xl font-extrabold italic uppercase tracking-tighter leading-none mb-1 relative z-10">
            Total
          </h2>
          <div className="flex items-start text-black relative z-10">
            <span className="text-3xl md:text-4xl mr-1 mt-1 md:mt-2 font-condensed font-bold opacity-60">{currency}</span>
            <span className="text-5xl md:text-6xl font-condensed font-bold tracking-tighter">
              {totals.grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6">
          <h3 className="text-nike-subtext text-xs font-bold uppercase tracking-widest mb-4">
            Member Splits
          </h3>
          <div className="space-y-3 md:space-y-4">
            {users.map(user => {
              const amount = totals.userTotals[user.id] || 0;
              return (
                <div key={user.id} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={`w-3 h-3 rounded-full ${user.color}`} />
                    <span className="font-bold text-white uppercase tracking-wide text-sm">
                      {user.name}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-lg md:text-xl text-white">
                    {currency}{amount.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-3 md:p-4 border-t border-white/10 flex flex-col gap-2 md:gap-3">
          <button
            onClick={onShare}
            className="w-full py-3 md:py-4 bg-white text-black font-extrabold uppercase tracking-widest text-xs md:text-sm rounded-xl active:bg-gray-200 md:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-lg touch-manipulation"
          >
            <Share2 size={18} />
            Share Breakdown
          </button>

          <button
            onClick={onReset}
            className="w-full py-2 md:py-3 text-nike-subtext active:text-red-500 md:hover:text-red-500 font-bold uppercase tracking-widest text-xs transition-colors touch-manipulation"
          >
            Start New Split
          </button>
        </div>
      </div>
    </div>
  );
};