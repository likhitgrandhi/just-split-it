import React, { useMemo, useState } from 'react';
import { Share2, Lock, Check, Plus, ArrowRight, X, Scissors, Merge, Loader2 } from 'lucide-react';
import { useSplit } from '../contexts/SplitContext';
import { AddUserModal } from './AddUserModal';

interface SplitterProps {
  onReset: () => void;
  onShare: () => void;
  currency: string;
  items?: any;
  users?: any;
  setItems?: any;
  onClose: () => void;
}

export const Splitter: React.FC<SplitterProps> = ({ onReset, onShare, currency, onClose }) => {
  const itemListRef = React.useRef<HTMLDivElement>(null);

  // Scroll to top on mount
  React.useEffect(() => {
    if (itemListRef.current) {
      itemListRef.current.scrollTop = 0;
    }
  }, []);

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
    endSplit,
    leaveSplit,
    isLiveMode,
    splitItem,
    mergeItems,
    addUser
  } = useSplit();

  const toggleAssignment = (itemId: string, userId: string) => {
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
  const [isEnding, setIsEnding] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const handleAddUser = async (name: string) => {
    await addUser(name);
  };

  const handleEndSplit = async () => {
    if (confirm('Are you sure you want to end this split? This cannot be undone.')) {
      setIsEnding(true);
      try {
        await endSplit();
      } finally {
        setIsEnding(false);
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 lg:gap-6 overflow-hidden relative">
      {/* Left Column: Items List */}
      <div className="flex-1 flex flex-col min-h-0 bg-pastel-blue rounded-[2rem] lg:rounded-[3rem] overflow-hidden border border-black/5 shadow-sm transition-all duration-300 pb-28 lg:pb-0">
        {/* Mobile Header - Apple HIG compliant */}
        <div className="lg:hidden bg-white/80 backdrop-blur-sm border-b border-black/5 px-4 py-2 flex justify-between items-center sticky top-0 z-50 min-h-[44px]">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-11 h-11 -ml-2 rounded-full active:bg-black/5 text-black/40 active:text-black transition-colors flex items-center justify-center"
            >
              <X size={22} />
            </button>
            <h1 className="text-2xl font-black tracking-tighter text-cloud-logo lowercase select-none relative inline-block">
              <span className="absolute inset-0 text-stroke-2 text-white z-0" aria-hidden="true">splitto</span>
              <span className="relative z-10">splitto</span>
            </h1>
            {splitStatus === 'locked' && <span className="text-[11px] font-bold text-white bg-black px-2 py-0.5 rounded-full">🔒</span>}
          </div>

          <div className="flex items-center gap-1">
            {/* Live mode: Host waiting to start */}
            {isHost && isLiveMode && splitStatus === 'waiting' && (
              <button
                onClick={startRoom}
                className="bg-black text-white px-4 h-11 rounded-xl font-bold uppercase tracking-wider text-[11px] active:bg-gray-800 transition-all shadow-md flex items-center justify-center"
              >
                Start
              </button>
            )}

            {/* Live mode: Host controls */}
            {isHost && isLiveMode && splitStatus !== 'waiting' && (
              <>
                <button
                  onClick={toggleLock}
                  className={`w-11 h-11 rounded-xl transition-colors flex items-center justify-center ${splitStatus === 'locked'
                    ? 'bg-black text-white'
                    : 'bg-white text-black border border-black/10'
                    }`}
                >
                  <Lock size={18} />
                </button>
                <button
                  onClick={handleEndSplit}
                  disabled={isEnding}
                  className="w-11 h-11 rounded-xl bg-red-100 text-red-600 active:bg-red-200 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isEnding ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                </button>
              </>
            )}

            {/* Live mode: Non-host leave */}
            {!isHost && isLiveMode && (
              <button
                onClick={() => {
                  if (confirm('Leave this split?')) {
                    leaveSplit();
                  }
                }}
                className="px-3 h-11 rounded-xl font-bold uppercase tracking-wider text-[11px] bg-gray-100 text-gray-600 active:bg-gray-200 transition-colors flex items-center justify-center"
              >
                Leave
              </button>
            )}

            <button
              onClick={onShare}
              className="w-11 h-11 rounded-full bg-white text-black border border-black/5 active:bg-gray-50 transition-all shadow-sm flex items-center justify-center"
            >
              <Share2 size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex bg-white/50 backdrop-blur-sm border-b border-black/5 p-6 justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors"
            >
              <X size={24} />
            </button>
            <h1 className="text-4xl font-black tracking-tighter text-cloud-logo lowercase select-none relative inline-block drop-shadow-md">
              <span className="absolute inset-0 text-stroke-4 text-white z-0" aria-hidden="true">splitto</span>
              <span className="relative z-10">splitto</span>
            </h1>
            {splitStatus === 'locked' && <span className="text-xs font-bold text-white bg-black px-3 py-1 rounded-full">Locked 🔒</span>}
          </div>

          <div className="flex gap-3">
            {/* Live mode: Host waiting to start */}
            {isHost && isLiveMode && splitStatus === 'waiting' && (
              <button
                onClick={startRoom}
                className="bg-black text-white px-6 py-3 rounded-2xl font-bold uppercase tracking-wider text-sm hover:bg-gray-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Start Splitting
              </button>
            )}

            {/* Live mode: Host controls (Lock/End) */}
            {isHost && isLiveMode && splitStatus !== 'waiting' && (
              <div className="flex gap-2">
                <button
                  onClick={toggleLock}
                  className={`px-4 py-2 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors border-2 ${splitStatus === 'locked'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black/10 hover:border-black'
                    }`}
                >
                  {splitStatus === 'locked' ? 'Unlock' : 'Lock'}
                </button>
                <button
                  onClick={handleEndSplit}
                  disabled={isEnding}
                  className="px-4 py-2 rounded-xl font-bold uppercase tracking-wider text-xs bg-red-100 text-red-600 border-2 border-red-200 hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isEnding ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Ending...
                    </>
                  ) : (
                    'End'
                  )}
                </button>
              </div>
            )}

            {/* Live mode: Non-host leave button */}
            {!isHost && isLiveMode && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to leave this split?')) {
                    leaveSplit();
                  }
                }}
                className="px-4 py-2 rounded-xl font-bold uppercase tracking-wider text-xs bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200 transition-colors"
              >
                Leave
              </button>
            )}

            <button
              onClick={onShare}
              className="p-3 rounded-full bg-white text-black border-2 border-black/5 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
            >
              <Share2 size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div ref={itemListRef} className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
          {items.map(item => {
            const isUnassigned = item.assignedTo.length === 0;
            const canSplit = (item.quantity || 1) > 1;
            const isSplitItem = !!item.splitGroupId;
            const siblingCount = isSplitItem ? items.filter(i => i.splitGroupId === item.splitGroupId).length : 0;
            const canMerge = isSplitItem && siblingCount > 1;

            return (
              <div key={item.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-black/5 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h3 className="font-bold text-black text-xl leading-tight truncate">{item.name}</h3>
                    {/* Split button - show for items with quantity > 1 */}
                    {canSplit && (
                      <button
                        onClick={() => splitItem(item.id)}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors"
                        title="Split into individual items"
                      >
                        <Scissors size={14} className="text-gray-600" />
                      </button>
                    )}
                    {/* Merge button - show for split items */}
                    {canMerge && (
                      <button
                        onClick={() => mergeItems(item.splitGroupId!)}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 active:bg-blue-300 flex items-center justify-center transition-colors"
                        title="Merge back together"
                      >
                        <Merge size={14} className="text-blue-600" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Quantity badge */}
                    {(item.quantity || 1) > 1 && (
                      <div className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                        ×{item.quantity}
                      </div>
                    )}
                    <div className="font-black text-black text-xl bg-pastel-yellow px-3 py-1 rounded-lg transform -rotate-2 shadow-sm border border-black/5">
                      {currency}{item.price.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* User Chips - 44pt touch targets */}
                <div className="flex flex-wrap gap-2">
                  {users.map(user => {
                    const isSelected = item.assignedTo.includes(user.id);
                    const isLocked = pin && currentUser && user.id !== currentUser.id;
                    const isHex = user.color.startsWith('#');

                    return (
                      <button
                        key={user.id}
                        onClick={() => toggleAssignment(item.id, user.id)}
                        disabled={!!isLocked}
                        className={`
                          pl-1.5 pr-3.5 py-2 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-all touch-manipulation border-2
                          ${isSelected
                            ? 'bg-black text-white border-black scale-105 shadow-md'
                            : 'bg-gray-50 text-gray-500 border-transparent hover:border-gray-200'}
                          ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                        `}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-black border border-black/10 ${!isHex ? user.color : ''}`}
                          style={isHex ? { backgroundColor: user.color } : {}}
                        >
                          {isSelected ? (
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        {user.name}
                        {isLocked && <Lock size={12} className="ml-1 opacity-50" />}
                      </button>
                    );
                  })}
                </div>
                {isUnassigned && (
                  <div className="mt-3 text-[11px] text-red-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    Unassigned
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Total Breakdown Overlay - with safe area */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pointer-events-none">
          <div className="pointer-events-auto bg-white rounded-[2rem] shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.15)] border border-black/5 overflow-hidden transition-all duration-500 ease-spring"
            style={{
              maxHeight: mobileTab === 'total' ? '60vh' : '88px',
            }}
          >
            <button
              onClick={() => setMobileTab(mobileTab === 'items' ? 'total' : 'items')}
              className="w-full p-4 min-h-[56px] flex items-center justify-between bg-white active:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-black text-white w-11 h-11 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-lg">Σ</span>
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    {isLiveMode ? 'Your Total' : 'Grand Total'}
                  </div>
                  <div className="text-xl font-black text-black">
                    {currency}{isLiveMode
                      ? (totals.userTotals[currentUser?.id || ''] || 0).toFixed(2)
                      : totals.grandTotal.toFixed(2)
                    }
                  </div>
                </div>
              </div>
              <div className={`w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-300 ${mobileTab === 'total' ? 'rotate-180' : ''}`}>
                <ArrowRight className="-rotate-90" size={18} />
              </div>
            </button>

            {/* Mobile Add User Button (in drawer header) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAddUserModal(true);
              }}
              className="absolute top-4 right-16 w-11 h-11 rounded-full bg-gray-100 active:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <Plus size={20} />
            </button>

            <div className="px-4 pb-4 overflow-y-auto max-h-[calc(70vh-88px)]">
              {mobileTab === 'total' && (
                <div className="space-y-2 pt-1">
                  {users.map(user => {
                    const userTotal = items
                      .filter(item => item.assignedTo.includes(user.id))
                      .reduce((sum, item) => sum + (item.price / item.assignedTo.length), 0);

                    const isMe = currentUser?.id === user.id;
                    const isHex = user.color.startsWith('#');

                    return (
                      <div
                        key={user.id}
                        className="bg-gray-50 rounded-2xl p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shadow-sm ${!isHex ? user.color : ''}`}
                              style={isHex ? { backgroundColor: user.color } : {}}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-black text-base flex items-center gap-1.5">
                                {user.name}
                                {isMe && <span className="text-[11px] bg-black text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider font-black">Me</span>}
                              </div>
                              <div className="text-[11px] text-gray-500 font-bold">
                                {items.filter(i => i.assignedTo.includes(user.id)).length} items
                              </div>
                            </div>
                          </div>
                          <div className="text-lg font-black text-black bg-pastel-yellow px-2.5 py-1 rounded-lg">
                            {currency}{userTotal.toFixed(2)}
                          </div>
                        </div>

                        <div className="space-y-1.5 pl-3 border-l-2 border-gray-200 ml-5">
                          {items
                            .filter(item => item.assignedTo.includes(user.id))
                            .map(item => (
                              <div key={item.id} className="flex justify-between items-center text-xs">
                                <span className="font-medium text-gray-600 truncate max-w-[140px]">{item.name}</span>
                                <span className="font-bold text-black bg-white px-1.5 py-0.5 rounded">{currency}{(item.price / item.assignedTo.length).toFixed(2)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}

                  <div className="p-4 bg-black rounded-2xl text-white shadow-lg mt-2">
                    <div className="flex justify-between items-center">
                      <div className="text-white/60 text-xs font-bold uppercase tracking-widest">Grand Total</div>
                      <div className="text-2xl font-black">
                        {currency}{items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Users & Totals - Desktop Only */}
      <div className="hidden lg:flex w-96 bg-pastel-pink rounded-[3rem] overflow-hidden border border-black/5 shadow-sm flex-col">
        <div className="p-8 border-b border-black/5 flex justify-between items-center bg-white/30 backdrop-blur-sm">
          <h2 className="text-2xl font-black tracking-tight text-black">
            Total Breakdown
          </h2>
          <div className="flex -space-x-3">
            {users.slice(0, 3).map(user => {
              const isHex = user.color.startsWith('#');
              return (
                <div
                  key={user.id}
                  className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center text-xs font-black text-white shadow-sm ${!isHex ? user.color : ''}`}
                  style={isHex ? { backgroundColor: user.color } : {}}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              );
            })}
            {users.length > 3 && (
              <div className="w-10 h-10 rounded-full border-4 border-white bg-black flex items-center justify-center text-xs font-bold text-white shadow-sm">
                +{users.length - 3}
              </div>
            )}

            {/* Desktop Add User Button */}
            <button
              onClick={() => setShowAddUserModal(true)}
              className="w-10 h-10 rounded-full border-4 border-white bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors shadow-sm"
              title="Add User"
            >
              <Plus size={16} strokeWidth={3} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {users.map(user => {
            const userTotal = items
              .filter(item => item.assignedTo.includes(user.id))
              .reduce((sum, item) => sum + (item.price / item.assignedTo.length), 0);

            const isMe = currentUser?.id === user.id;
            const isHex = user.color.startsWith('#');

            return (
              <div
                key={user.id}
                className={`
                  p-6 rounded-[2.5rem] border-2 transition-all shadow-sm hover:shadow-md bg-white
                  ${isMe ? 'border-black scale-[1.02]' : 'border-transparent hover:border-black/10'}
                `}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-black text-white border-4 border-white shadow-md ${!isHex ? user.color : ''}`}
                      style={isHex ? { backgroundColor: user.color } : {}}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-black text-xl flex items-center gap-2">
                        {user.name}
                        {isMe && <span className="text-[11px] bg-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-black">Me</span>}
                      </div>
                      <div className="text-xs text-gray-500 font-bold mt-0.5">
                        {items.filter(i => i.assignedTo.includes(user.id)).length} items
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="text-3xl font-black text-black bg-pastel-yellow px-6 py-2 rounded-2xl transform -rotate-1 shadow-sm border border-black/5 inline-block">
                    {currency}{userTotal.toFixed(2)}
                  </div>
                </div>

                {/* Mini breakdown of items */}
                <div className="space-y-2 bg-gray-50 rounded-2xl p-4">
                  {items
                    .filter(item => item.assignedTo.includes(user.id))
                    .map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm font-medium text-gray-600 group hover:bg-white p-1 rounded-lg transition-colors">
                        <span className="truncate max-w-[140px] flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-black transition-colors"></div>
                          {item.name}
                        </span>
                        <span className="text-black font-bold bg-white px-2 py-0.5 rounded-md shadow-sm text-xs">{(item.price / item.assignedTo.length).toFixed(2)}</span>
                      </div>
                    ))}
                  {items.filter(item => item.assignedTo.includes(user.id)).length === 0 && (
                    <div className="text-center text-gray-400 text-xs font-bold py-2">No items assigned</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-8 bg-black text-white">
          <div className="flex justify-between items-end">
            <div className="text-white/60 text-sm font-bold uppercase tracking-widest mb-1">Grand Total</div>
            <div className="text-4xl font-black leading-none">
              {currency}{items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {showAddUserModal && (
        <AddUserModal
          users={users}
          onAdd={handleAddUser}
          onClose={() => setShowAddUserModal(false)}
        />
      )}
    </div>
  );
};