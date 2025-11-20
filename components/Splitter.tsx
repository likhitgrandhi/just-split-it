import React, { useMemo, useState } from 'react';
import { Share2, Lock, Check, Plus, ArrowRight, ArrowLeft, Copy, CreditCard } from 'lucide-react';
import { useSplit } from '../contexts/SplitContext';

interface SplitterProps {
  onReset: () => void;
  onShare: () => void;
  onBack: () => void;
  currency: string;
  // Keeping these optional for backward compatibility if needed, but we'll use context
  items?: any;
  users?: any;
  setItems?: any;
}

export const Splitter: React.FC<SplitterProps> = ({ onReset, onShare, onBack, currency }) => {
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

  const [mobileTab, setMobileTab] = useState<'items' | 'total'>('items');

  return (
    <div className="w-full h-full relative animate-fade-in">
      {/* Back Button */}
      {/* Back Button */}
      <div className="pb-4 z-10">
        <button
          onClick={onBack}
          className="text-nike-subtext hover:text-nike-forest font-bold text-sm uppercase tracking-wider flex items-center gap-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full hover:bg-white/80 transition-all w-fit"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
        {/* Left Column: Items List (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col min-h-0 bg-white rounded-[2rem] shadow-xl overflow-hidden relative">
          <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 z-10">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-nike-forest">
                Split Bill
                {splitStatus === 'locked' && <span className="ml-2 text-sm not-italic font-normal text-nike-subtext bg-gray-100 px-2 py-1 rounded-md">🔒 Locked</span>}
              </h2>
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

              {isHost && pin && splitStatus !== 'waiting' && (
                <div className="flex gap-2">
                  <button
                    onClick={toggleLock}
                    className={`px-3 py-2 rounded-lg font-bold uppercase tracking-wider text-xs transition-colors border ${splitStatus === 'locked'
                      ? 'bg-nike-forest text-white border-nike-forest'
                      : 'bg-transparent text-nike-forest border-nike-forest/20 hover:bg-nike-forest/5'
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
                    className="px-3 py-2 rounded-lg font-bold uppercase tracking-wider text-xs bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-colors"
                  >
                    End
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
            {items.map(item => {
              const isUnassigned = item.assignedTo.length === 0;

              return (
                <div key={item.id} className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 transition-all hover:shadow-md group">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h3 className="font-bold text-nike-forest text-lg group-hover:text-nike-volt-dark transition-colors flex-1 break-words">{item.name}</h3>
                    <div className="font-mono font-bold text-nike-forest text-base whitespace-nowrap tracking-tight">
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
                            px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all touch-manipulation
                            ${isSelected
                              ? 'bg-nike-forest text-white shadow-md scale-105'
                              : 'bg-white text-nike-subtext border border-gray-200'}
                            ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 hover:border-nike-forest/30'}
                          `}
                        >
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${user.color}`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          {user.name}
                          {isSelected && <Check size={12} className="text-white" />}
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

        {/* Right Column: Share & Breakdown (1/3 width) */}
        <div className="lg:col-span-1 flex flex-col gap-4 h-full">

          {/* Tile 2: Share Tile */}
          <div className="bg-nike-volt rounded-[2rem] shadow-xl p-6 flex flex-col justify-between relative overflow-hidden min-h-[160px] cursor-pointer group" onClick={onShare}>
            <div className="z-10">
              <span className="text-nike-forest/60 text-xs font-bold uppercase tracking-widest">
                {pin ? 'Share Pin' : 'View Cards'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-4xl md:text-5xl font-black text-nike-forest tracking-tighter">
                  {pin ? pin : 'Bill Cards'}
                </h2>
              </div>
            </div>

            <div className="self-end bg-nike-forest text-white p-3 rounded-full group-hover:bg-black transition-colors shadow-lg z-10">
              {pin ? <Share2 size={20} /> : <CreditCard size={20} />}
            </div>

            <div className="absolute -bottom-4 -right-4 text-nike-forest/10 transform -rotate-12">
              {pin ? <Share2 size={100} /> : <CreditCard size={100} />}
            </div>
          </div>

          {/* Tile 3: Total Breakdown */}
          <div className="bg-white rounded-[2rem] shadow-xl flex-1 overflow-hidden flex flex-col border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-nike-forest">
                Breakdown
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {users.map(user => {
                const userTotal = items
                  .filter(item => item.assignedTo.includes(user.id))
                  .reduce((sum, item) => sum + (item.price / item.assignedTo.length), 0);

                const isMe = currentUser?.id === user.id;

                return (
                  <div
                    key={user.id}
                    className={`
                      p-4 rounded-xl border transition-all shadow-sm
                      ${isMe
                        ? 'bg-nike-volt/10 border-nike-volt'
                        : 'bg-white border-gray-100'}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${user.color}`}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-nike-forest flex items-center gap-2 text-lg">
                            {user.name}
                            {isMe && <span className="text-[10px] bg-nike-volt px-1.5 py-0.5 rounded text-nike-forest uppercase tracking-wider font-bold">Me</span>}
                          </div>
                          <div className="text-[10px] text-nike-subtext">
                            {items.filter(i => i.assignedTo.includes(user.id)).length} items
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-mono font-bold text-nike-forest tracking-tight">
                        {currency}{userTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="flex justify-between items-end">
                <div className="text-nike-subtext text-xs font-bold uppercase tracking-widest">Grand Total</div>
                <div className="text-3xl font-mono font-bold text-nike-forest leading-none tracking-tight">
                  {currency}{items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};