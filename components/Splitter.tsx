import React, { useMemo, useState } from 'react';
import { Share2, Lock, Check, Plus, ArrowRight, X } from 'lucide-react';
import { useSplit } from '../contexts/SplitContext';

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
    isLiveMode
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

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 overflow-hidden relative">
      {/* Left Column: Items List */}
      <div className="flex-1 flex flex-col min-h-0 bg-pastel-blue rounded-[3rem] overflow-hidden border border-black/5 shadow-sm transition-all duration-300 pb-24 lg:pb-0">
        <div className="bg-white/50 backdrop-blur-sm border-b border-black/5 p-6 flex justify-between items-center sticky top-0 z-10">
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
                  onClick={() => {
                    if (confirm('Are you sure you want to end this split? This cannot be undone.')) {
                      endSplit();
                    }
                  }}
                  className="px-4 py-2 rounded-xl font-bold uppercase tracking-wider text-xs bg-red-100 text-red-600 border-2 border-red-200 hover:bg-red-200 transition-colors"
                >
                  End
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

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
          {items.map(item => {
            const isUnassigned = item.assignedTo.length === 0;

            return (
              <div key={item.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-black/5 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4 gap-4">
                  <h3 className="font-bold text-black text-xl leading-tight flex-1">{item.name}</h3>
                  <div className="font-black text-black text-xl bg-pastel-yellow px-3 py-1 rounded-lg transform -rotate-2 shadow-sm border border-black/5">
                    {currency}{item.price.toFixed(2)}
                  </div>
                </div>

                {/* User Chips */}
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
                          pl-1 pr-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-all touch-manipulation border-2
                          ${isSelected
                            ? 'bg-black text-white border-black scale-105 shadow-md'
                            : 'bg-gray-50 text-gray-500 border-transparent hover:border-gray-200'}
                          ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                        `}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-black border border-black/10 ${!isHex ? user.color : ''}`}
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
                        {isLocked && <Lock size={10} className="ml-1 opacity-50" />}
                      </button>
                    );
                  })}
                </div>
                {isUnassigned && (
                  <div className="mt-3 text-xs text-red-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    Unassigned
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Total Breakdown Overlay */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
          <div className="pointer-events-auto bg-white rounded-[2.5rem] shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] border border-black/5 overflow-hidden transition-all duration-500 ease-spring"
            style={{
              maxHeight: mobileTab === 'total' ? '80vh' : '100px',
            }}
          >
            <button
              onClick={() => setMobileTab(mobileTab === 'items' ? 'total' : 'items')}
              className="w-full p-6 flex items-center justify-between bg-white active:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="bg-black text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xl">Σ</span>
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Your Total</div>
                  <div className="text-2xl font-black text-black">
                    {currency}{(totals.userTotals[currentUser?.id || ''] || 0).toFixed(2)}
                  </div>
                </div>
              </div>
              <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-300 ${mobileTab === 'total' ? 'rotate-180' : ''}`}>
                <ArrowRight className="-rotate-90" size={20} />
              </div>
            </button>

            <div className="px-6 pb-6 overflow-y-auto max-h-[calc(80vh-100px)]">

              {mobileTab === 'total' && (
                <div className="space-y-3 pt-2">
                  {users.map(user => {
                    const userTotal = items
                      .filter(item => item.assignedTo.includes(user.id))
                      .reduce((sum, item) => sum + (item.price / item.assignedTo.length), 0);

                    const isMe = currentUser?.id === user.id;
                    const isHex = user.color.startsWith('#');

                    return (
                      <div
                        key={user.id}
                        className="bg-white rounded-[2rem] p-5 shadow-sm border border-black/5"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-black text-white border-2 border-white shadow-sm ${!isHex ? user.color : ''}`}
                              style={isHex ? { backgroundColor: user.color } : {}}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-black text-lg flex items-center gap-2">
                                {user.name}
                                {isMe && <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-black">Me</span>}
                              </div>
                              <div className="text-xs text-gray-500 font-bold">
                                {items.filter(i => i.assignedTo.includes(user.id)).length} items
                              </div>
                            </div>
                          </div>
                          <div className="text-2xl font-black text-black bg-pastel-yellow px-3 py-1 rounded-xl transform rotate-2">
                            {currency}{userTotal.toFixed(2)}
                          </div>
                        </div>

                        <div className="space-y-2 pl-4 border-l-2 border-gray-100 ml-6">
                          {items
                            .filter(item => item.assignedTo.includes(user.id))
                            .map(item => (
                              <div key={item.id} className="flex justify-between items-center text-sm group">
                                <span className="font-medium text-gray-600 truncate max-w-[140px]">{item.name}</span>
                                <span className="font-bold text-black bg-gray-50 px-2 py-0.5 rounded-md">{(item.price / item.assignedTo.length).toFixed(2)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}

                  <div className="p-6 bg-black rounded-[2rem] text-white shadow-lg mt-4">
                    <div className="flex justify-between items-center">
                      <div className="text-white/60 text-sm font-bold uppercase tracking-widest">Grand Total</div>
                      <div className="text-4xl font-black">
                        {currency}{items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                            {isMe && <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-black">Me</span>}
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
        </div>
      </div>
    </div>
  );
};