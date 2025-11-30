import React, { useMemo, useState } from 'react';
import { Share2, Lock, Check, Plus, ArrowRight, Link, Upload, UserPlus } from 'lucide-react';
import { useSplit } from '../contexts/SplitContext';
import { useToast } from '../hooks/useToast';
import { Toast } from './Toast';
import { AddUserModal } from './AddUserModal';
import { AddReceiptModal } from './AddReceiptModal';
import { parseReceiptImage, fileToGenerativePart } from '../services/geminiService';

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
    endSplit,
    addUser,
    addItems
  } = useSplit();

  const { toasts, hideToast, success, error: showError } = useToast();

  // State for modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddReceiptModal, setShowAddReceiptModal] = useState(false);

  const handleShareLink = async () => {
    if (!pin) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?join=${pin}`;
    const shareText = `Join my split! PIN: ${pin}\n\nClick here: ${shareUrl}`;

    try {
      // Try Web Share API first (works on mobile)
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
      await navigator.clipboard.writeText(shareUrl);
      success("Link copied! Share it with your friends.");
    } catch (err) {
      showError("Could not copy link. Please try again.");
    }
  };

  const handleAddReceipt = () => {
    setShowAddReceiptModal(true);
  };

  const handleAddUser = () => {
    setShowAddUserModal(true);
  };

  const AVATAR_COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#6366F1', '#F97316',
    '#14B8A6', '#CBF300',
  ];

  const handleAddUserSubmit = (name: string) => {
    // Check for duplicate user name
    const isDuplicate = users.some(u => u.name.toLowerCase() === name.toLowerCase());
    if (isDuplicate) {
      showError(`User "${name}" already exists!`);
      return;
    }

    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    addUser(name, color);
    success(`${name} added to the split!`);
  };

  const [isProcessingReceipts, setIsProcessingReceipts] = useState(false);

  const handleReceiptUpload = async (files: File[]) => {
    setIsProcessingReceipts(true);
    try {
      const newItems: any[] = [];
      let processedCount = 0;

      for (const file of files) {
        // Check for duplicate receipt
        const isDuplicate = items.some(item => item.billName === file.name);
        if (isDuplicate) {
          showError(`Receipt "${file.name}" already exists!`);
          continue;
        }

        processedCount++;
        try {
          const imagePart = await fileToGenerativePart(file);
          const extractedItems = await parseReceiptImage(imagePart, file.type);

          if (extractedItems && extractedItems.length > 0) {
            const itemsWithBillName = extractedItems.map((item: any) => ({
              ...item,
              billName: file.name
            }));
            newItems.push(...itemsWithBillName);
          }
        } catch (err) {
          console.error(`Failed to process ${file.name}:`, err);
          showError(`Failed to process ${file.name}`);
        }
      }

      if (newItems.length > 0) {
        addItems(newItems);
        success(`Added ${newItems.length} items from ${files.length} receipt(s)!`);
      } else if (processedCount > 0) {
        showError('No items found in the uploaded receipts');
      }
    } catch (err) {
      console.error('Failed to process receipts:', err);
      showError('Failed to process receipts');
    } finally {
      setIsProcessingReceipts(false);
    }
  };

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
    <div className="flex flex-col lg:flex-row h-full gap-4 md:gap-6 overflow-hidden relative">
      {/* Left Column: Items List */}
      <div className="flex-1 flex flex-col min-h-0 bg-nike-card rounded-2xl md:rounded-3xl overflow-hidden border border-white/5 transition-all duration-300">
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

            {isHost && pin && splitStatus !== 'waiting' && (
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

            {pin && (
              <button
                onClick={handleShareLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold uppercase tracking-wider text-xs bg-nike-volt text-black hover:bg-nike-volt/80 transition-colors"
                title="Copy invite link"
              >
                <Link size={14} />
                <span className="hidden md:inline">Share Link</span>
              </button>
            )}

            <button
              onClick={handleAddReceipt}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold uppercase tracking-wider text-xs bg-nike-volt text-black hover:bg-nike-volt/80 transition-colors"
              title="Add more receipts"
            >
              <Upload size={14} />
              <span className="hidden md:inline">Add Receipt</span>
            </button>

            <button
              onClick={onShare}
              className="p-2 rounded-full bg-nike-gray text-white hover:bg-white/10 transition-colors"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 md:p-4 space-y-6">
          {(() => {
            console.log('🎨 SPLITTER: Rendering items', items.map(i => ({ name: i.name, billName: i.billName })));
            const grouped = items.reduce((acc: any, item: any) => {
              const billName = item.billName || 'General';
              if (!acc[billName]) acc[billName] = [];
              acc[billName].push(item);
              return acc;
            }, {});
            console.log('📊 SPLITTER: Grouped items', Object.keys(grouped).map(k => ({ billName: k, count: grouped[k].length })));
            return Object.entries(grouped);
          })().map(([billName, billItems]: [string, any[]]) => (
            <div key={billName} className="space-y-3">
              {/* Bill Header */}
              <div className="flex items-center gap-4 px-1 py-2">
                <div className="h-px bg-white/20 flex-1"></div>
                <h3 className="text-nike-volt text-xs md:text-sm font-bold uppercase tracking-widest whitespace-nowrap">
                  {billName}
                </h3>
                <div className="h-px bg-white/20 flex-1"></div>
              </div>

              {/* Items for this bill */}
              {billItems.map(item => {
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
                      {users.map((user: any) => {
                        const isSelected = item.assignedTo.includes(user.id);
                        // Lock if in a split (pin set) AND user is not me
                        const isLocked = pin && currentUser && user.id !== currentUser.id;

                        return (
                          <button
                            key={user.id}
                            onClick={() => toggleAssignment(item.id, user.id)}
                            disabled={!!isLocked}
                            className={`
                              px-3 py-2 md:py-1.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all touch-manipulation
                              ${isSelected
                                ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.3)] scale-105'
                                : 'bg-nike-gray text-nike-subtext border border-white/10'}
                              ${isLocked ? 'opacity-50 cursor-not-allowed' : 'active:border-white/50 md:hover:border-white/50'}
                            `}
                          >
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-black"
                              style={{ backgroundColor: user.color }}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            {user.name}
                            {isSelected && <Check size={12} className="text-black" />}
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
          ))}
        </div>

        {/* Mobile Total Summary - Accordion Style */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileTab(mobileTab === 'items' ? 'total' : 'items')}
            className="w-full p-4 bg-nike-volt text-black font-bold uppercase tracking-wider flex justify-between items-center sticky bottom-0 z-20"
          >
            <span>{mobileTab === 'items' ? 'View Total Breakdown' : 'Hide Total Breakdown'}</span>
            <ArrowRight size={20} className={`transition-transform ${mobileTab === 'total' ? 'rotate-90' : ''}`} />
          </button>

          {mobileTab === 'total' && (
            <div className="bg-nike-card border-t border-white/10 p-4 space-y-3 max-h-[50vh] overflow-y-auto">
              {users.map(user => {
                const userTotal = items
                  .filter(item => item.assignedTo.includes(user.id))
                  .reduce((sum, item) => sum + (item.price / item.assignedTo.length), 0);

                const isMe = currentUser?.id === user.id;

                return (
                  <div
                    key={user.id}
                    className={`p-3 rounded-xl border ${isMe ? 'bg-white/5 border-nike-volt/50' : 'bg-nike-gray border-white/5'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-1">
                            {user.name}
                            {isMe && <span className="text-[8px] bg-white/20 px-1 py-0.5 rounded text-white/80 uppercase">Me</span>}
                          </div>
                          <div className="text-[10px] text-nike-subtext">
                            {items.filter(i => i.assignedTo.includes(user.id)).length} items
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-mono font-bold text-nike-volt">
                        {currency}{userTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex justify-between items-center">
                  <div className="text-nike-subtext text-xs font-bold uppercase tracking-widest">Grand Total</div>
                  <div className="text-2xl font-mono font-bold text-white">
                    {currency}{items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Users & Totals - Desktop Only */}
      <div className="hidden lg:flex w-96 bg-nike-card rounded-2xl md:rounded-3xl overflow-hidden border border-white/5 flex-col">
        <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-lg md:text-xl font-extrabold italic uppercase tracking-tighter text-white">
            Total Breakdown
          </h2>
          <div className="flex -space-x-2">
            {users.slice(0, 3).map(user => (
              <div
                key={user.id}
                className="w-8 h-8 rounded-full border-2 border-nike-card flex items-center justify-center text-xs font-bold text-black"
                style={{ backgroundColor: user.color }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {users.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-nike-card bg-nike-gray flex items-center justify-center text-xs font-bold text-white">
                +{users.length - 3}
              </div>
            )}
            <button
              onClick={handleAddUser}
              className="w-8 h-8 rounded-full bg-nike-volt flex items-center justify-center text-black hover:bg-nike-volt/80 transition-colors border-2 border-nike-card"
              title="Add user"
            >
              <UserPlus size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {users.map(user => {
            const userTotal = items
              .filter(item => item.assignedTo.includes(user.id))
              .reduce((sum, item) => sum + (item.price / item.assignedTo.length), 0);

            const isMe = currentUser?.id === user.id;

            return (
              <div
                key={user.id}
                className={`
                  p-4 rounded-xl border transition-all
                  ${isMe
                    ? 'bg-white/5 border-nike-volt/50'
                    : 'bg-nike-gray border-white/5'}
                `}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black shadow-lg"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        {user.name}
                        {isMe && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/80 uppercase tracking-wider">Me</span>}
                      </div>
                      <div className="text-xs text-nike-subtext">
                        {items.filter(i => i.assignedTo.includes(user.id)).length} items
                      </div>
                    </div>
                  </div>
                  <div className="text-xl font-mono font-bold text-nike-volt">
                    {currency}{userTotal.toFixed(2)}
                  </div>
                </div>

                {/* Mini breakdown of items */}
                <div className="space-y-1 pl-13">
                  {items
                    .filter(item => item.assignedTo.includes(user.id))
                    .map(item => (
                      <div key={item.id} className="flex justify-between text-xs text-white/50">
                        <span className="truncate max-w-[120px]">{item.name}</span>
                        <span>{(item.price / item.assignedTo.length).toFixed(2)}</span>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 md:p-6 bg-white/5 border-t border-white/10">
          <div className="flex justify-between items-end">
            <div className="text-nike-subtext text-sm font-bold uppercase tracking-widest">Grand Total</div>
            <div className="text-3xl md:text-4xl font-mono font-bold text-white leading-none">
              {currency}{items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
            </div>
          </div>
        </div>
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

      {/* Add User Modal */}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onAdd={handleAddUserSubmit}
        />
      )}

      {/* Add Receipt Modal */}
      {showAddReceiptModal && (
        <AddReceiptModal
          onClose={() => setShowAddReceiptModal(false)}
          onUpload={handleReceiptUpload}
        />
      )}
    </div>
  );
};