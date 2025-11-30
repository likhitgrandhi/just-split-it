import React, { useState, useCallback, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { UserSetup } from './components/UserSetup';
import { ModeSelection } from './components/ModeSelection';
import { WaitingRoom } from './components/WaitingRoom';
import { Splitter } from './components/Splitter';
import { ShareView } from './components/ShareView';
import { Toast } from './components/Toast';
import { ReceiptItem, User, AppStep } from './types';
import { fileToGenerativePart, parseReceiptImage } from './services/geminiService';
import { Activity, Settings, X, Users, ArrowRight, Sparkles } from 'lucide-react';
import { SplitProvider, useSplit } from './contexts/SplitContext';
import { getSplitByPin } from './services/supabase';
import { useToast } from './hooks/useToast';

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'INR', symbol: '₹' },
  { code: 'JPY', symbol: '¥' },
  { code: 'KRW', symbol: '₩' },
  { code: 'CAD', symbol: 'C$' },
];

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const AppContent: React.FC = () => {
  const {
    step, setStep,
    items, setItems,
    users, setUsers,
    setCurrentUser,
    createSplit,
    startRoom,
    pin,
    splitStatus,
    isHost,
    reset,
    joinSplit,
    currentUser,
    error: contextError,
    isRestoring,
    pendingJoinPin,
    startManualSplit,
    clearPendingJoinPin,
    leaveSplit
  } = useSplit();

  const [isProcessing, setIsProcessing] = useState(false);
  const [currency, setCurrency] = useState('₹');
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  const { toasts, hideToast, success, error: showError } = useToast();

  // Join Flow State
  const [joinPin, setJoinPin] = useState('');
  const [joinName, setJoinName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModeSelectionOpen, setIsModeSelectionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'host' | 'join'>('host');

  // Auto-open join modal if pending pin exists
  useEffect(() => {
    if (pendingJoinPin && !isJoining && step === AppStep.UPLOAD) {
      setJoinPin(pendingJoinPin);
      setActiveTab('join');
      setIsJoining(true);
    }
  }, [pendingJoinPin, isJoining, step]);



  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const base64Data = await fileToGenerativePart(file);
      const extractedItems = await parseReceiptImage(base64Data, file.type);

      const formattedItems: ReceiptItem[] = extractedItems.map(item => ({
        id: generateId(),
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        assignedTo: []
      }));

      setItems(formattedItems);
      // Instead of going straight to USERS, show mode selection
      setIsModeSelectionOpen(true);
    } catch (error) {
      console.error(error);
      showError("Could not extract data from receipt. Please try a clearer image.");
    } finally {
      setIsProcessing(false);
    }
  }, [setItems, setIsModeSelectionOpen]);

  const handleManualSelect = () => {
    startManualSplit();
    setIsModeSelectionOpen(false);
    setStep(AppStep.USERS);
  };

  const handleLiveSelect = async (hostName: string) => {
    try {
      // Create the user first
      const newUser: User = {
        id: crypto.randomUUID(),
        name: hostName,
        color: '#2D9CDB' // Host gets the brand color
      };

      // Pass user and items directly to avoid async state update race condition
      await createSplit([newUser], items);

      // We don't close the modal yet, we wait for the PIN to be shown
    } catch (error) {
      console.error("Failed to create live split", error);
      showError("Failed to create live room. Please try again.");
    }
  };

  const handleLiveProceed = async () => {
    await startRoom();
    setIsModeSelectionOpen(false);
    setStep(AppStep.SPLIT);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinPin || joinPin.length < 4) return;

    // Validate PIN exists before showing name modal
    setIsProcessing(true);
    try {
      const split = await getSplitByPin(joinPin);
      if (!split || !split.data) {
        setError('No split room exists with this PIN');
        setIsProcessing(false);
        return;
      }

      // Check if split has ended
      if (split.data.status === 'ended') {
        setError('This split has already ended');
        setIsProcessing(false);
        return;
      }

      // PIN is valid, show name modal
      setIsJoining(true);
    } catch (err) {
      console.error('Failed to validate PIN', err);
      setError('No split room exists with this PIN');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim()) return;

    setIsProcessing(true);
    try {
      await joinSplit(joinPin, joinName);
      setJoinPin('');
      setJoinName('');
    } catch (err: any) {
      console.error("Failed to join", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Effect to handle room becoming active - close any modals and ensure correct view
  React.useEffect(() => {
    if (splitStatus === 'active' && currentUser && pin) {
      // Close join modal if open
      if (isJoining) {
        console.log('🚀 Room active - closing join modal');
        setIsJoining(false);
      }
      // Ensure we're on the split step
      if (step !== AppStep.SPLIT) {
        console.log('🚀 Room active - navigating to split view');
        setStep(AppStep.SPLIT);
      }
    }
  }, [splitStatus, currentUser, pin, isJoining, step, setStep]);

  const handleReset = () => {
    reset();
    setJoinPin('');
    setJoinName('');
    setIsJoining(false);
  };

  const handleCloseJoinModal = () => {
    setIsJoining(false);
    clearPendingJoinPin(); // Clear the pending join state
    // Clear the URL query param without refreshing
    const url = new URL(window.location.href);
    url.searchParams.delete('join');
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <div className="min-h-[100dvh] bg-white text-cloud-text selection:bg-cloud-primary selection:text-white flex flex-col relative overflow-x-hidden">
      {isRestoring && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="w-16 h-16 border-8 border-cloud-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {splitStatus === 'ended' && (
        <div className="fixed inset-0 z-[90] bg-cloud-primary/20 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-soft text-center transform hover:scale-[1.02] transition-transform duration-500 my-4">
            <div className="w-24 h-24 bg-cloud-light rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner-soft">
              <span className="text-5xl">🏁</span>
            </div>
            <h2 className="text-4xl font-bold text-cloud-text mb-4 tracking-tight">Split Ended</h2>
            <p className="text-xl text-cloud-subtext mb-10">The host has ended this session.</p>
            <button
              onClick={handleReset}
              className="w-full py-6 bg-cloud-primary text-white rounded-3xl font-bold text-xl shadow-lg hover:bg-blue-500 transition-all transform active:scale-95 hover:shadow-xl"
            >
              Start New Split
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isModeSelectionOpen && (
        <ModeSelection
          onManualSelect={handleManualSelect}
          onLiveSelect={handleLiveSelect}
          isCreating={false} // We could track loading state for createSplit if needed
          pin={pin}
          onProceed={handleLiveProceed}
          onClose={() => {
            // If a PIN was created but user cancels, clean up the split
            if (pin) {
              handleReset();
            }
            setIsModeSelectionOpen(false);
          }}
        />
      )}

      {isCurrencyOpen && (
        <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-soft transform transition-all my-4">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-3xl font-bold text-cloud-text tracking-tight">Settings</h2>
              <button
                onClick={() => setIsCurrencyOpen(false)}
                className="p-3 rounded-full hover:bg-gray-100 text-cloud-subtext hover:text-cloud-text transition-colors transform hover:rotate-90 duration-300"
              >
                <X size={32} />
              </button>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-bold text-cloud-subtext uppercase tracking-widest mb-6">Select Currency</h3>
              <div className="grid grid-cols-3 gap-4">
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => { setCurrency(c.symbol); setIsCurrencyOpen(false); }}
                    className={`
                      flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all transform hover:scale-105 active:scale-95
                      ${currency === c.symbol
                        ? 'bg-cloud-primary text-white border-cloud-primary shadow-lg scale-105'
                        : 'bg-gray-50 text-cloud-text border-transparent hover:bg-gray-100 hover:shadow-md'}
                    `}
                  >
                    <span className="text-3xl font-bold mb-2">{c.symbol}</span>
                    <span className={`text-xs font-bold tracking-wider ${currency === c.symbol ? 'opacity-100' : 'opacity-60'}`}>{c.code}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Name Input for Joining - Full screen on mobile, modal on desktop */}
      {isJoining && (
        <div className="fixed inset-0 z-[60] bg-white md:bg-black/20 md:backdrop-blur-md flex flex-col md:items-center md:justify-center animate-fade-in overflow-y-auto">
          <div className="flex-1 flex flex-col p-6 pt-4 pb-6 md:pt-6 md:flex-none md:bg-white md:w-full md:max-w-md md:rounded-[3rem] md:p-10 md:shadow-soft md:my-4">
            {currentUser && splitStatus === 'waiting' ? (
              // Waiting state - shown after joining, before host starts
              <div className="flex-1 flex flex-col">
                {/* Mobile header with back button */}
                <div className="flex items-start justify-between mb-2 md:hidden">
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to leave this split?')) {
                        leaveSplit();
                        setIsJoining(false);
                      }
                    }}
                    className="p-2 -ml-2 rounded-full active:bg-gray-100 text-gray-400 active:text-black transition-colors"
                  >
                    <ArrowRight className="rotate-180" size={24} />
                  </button>
                </div>

                {/* Mobile logo */}
                <div className="text-center mb-4 md:hidden">
                  <h1 className="text-3xl font-black tracking-tighter text-cloud-logo lowercase select-none relative inline-block drop-shadow-md">
                    <span className="absolute inset-0 text-stroke-4 text-white z-0" aria-hidden="true">splitto</span>
                    <span className="relative z-10">splitto</span>
                  </h1>
                </div>

                <div className="text-center">
                  <div className="w-24 h-24 md:w-28 md:h-28 bg-pastel-yellow rounded-full flex items-center justify-center mx-auto mb-5">
                    <span className="text-5xl md:text-6xl">⏳</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-cloud-text mb-2">Waiting for Host</h2>
                  <p className="text-cloud-subtext mb-6">The host will start the session soon</p>
                  <div className="flex justify-center space-x-2 mb-6">
                    <div className="w-2.5 h-2.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>

                <div className="flex-1 md:flex-none min-h-[20px]" />

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to leave this split?')) {
                      leaveSplit();
                      setIsJoining(false);
                    }
                  }}
                  className="w-full py-4 text-cloud-subtext active:text-cloud-text font-bold transition-colors rounded-2xl active:bg-gray-100"
                >
                  Leave & Go Back
                </button>
              </div>
            ) : (
              // Name entry state
              <div className="flex-1 flex flex-col">
                {/* Mobile header with back button */}
                <div className="flex items-start justify-between mb-2 md:hidden">
                  <button
                    onClick={handleCloseJoinModal}
                    className="p-2 -ml-2 rounded-full active:bg-gray-100 text-gray-400 active:text-black transition-colors"
                  >
                    <ArrowRight className="rotate-180" size={24} />
                  </button>
                </div>

                {/* Mobile logo */}
                <div className="text-center mb-4 md:hidden">
                  <h1 className="text-3xl font-black tracking-tighter text-cloud-logo lowercase select-none relative inline-block drop-shadow-md">
                    <span className="absolute inset-0 text-stroke-4 text-white z-0" aria-hidden="true">splitto</span>
                    <span className="relative z-10">splitto</span>
                  </h1>
                </div>

                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-pastel-green rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-cloud-text" strokeWidth={2} />
                  </div>
                  <h2 className="text-2xl font-bold text-cloud-text mb-1">Join Split</h2>
                  <p className="text-cloud-subtext text-sm">Enter your name to join the group</p>
                </div>

                {contextError && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4 flex items-center gap-3 text-red-500 text-sm font-bold">
                    <span>⚠️</span> {contextError}
                  </div>
                )}

                <form onSubmit={handleNameSubmit} className="flex-1 flex flex-col">
                  <label htmlFor="join-name-input" className="sr-only">Your Name</label>
                  <input
                    id="join-name-input"
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-black/10 rounded-2xl p-5 text-cloud-text placeholder:text-gray-300 focus:outline-none transition-all text-xl font-bold text-center"
                    autoFocus
                  />

                  <div className="flex-1 min-h-[20px] md:min-h-[20px]" />

                  {/* Mobile: stacked buttons, Desktop: side by side */}
                  <div className="space-y-3 md:space-y-0 md:flex md:gap-4 mt-4">
                    <button
                      type="button"
                      onClick={handleCloseJoinModal}
                      className="hidden md:block flex-1 py-5 rounded-2xl font-bold text-base text-cloud-subtext hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!joinName.trim() || isProcessing}
                      className="w-full md:flex-1 py-5 bg-black text-white rounded-2xl font-bold text-lg shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex justify-center items-center active:scale-[0.98]"
                    >
                      {isProcessing ? 'Joining...' : 'Join Split'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header - Settings Only */}
      <header className="px-6 py-6 md:px-10 md:py-8 flex justify-end items-center sticky top-0 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <button
            onClick={() => setIsCurrencyOpen(true)}
            className="w-12 h-12 rounded-full bg-white text-black hover:bg-gray-50 shadow-sm hover:shadow-md transition-all flex items-center justify-center border border-gray-100"
          >
            <Settings size={24} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-2 md:p-8 flex flex-col min-h-0">
        {step === AppStep.UPLOAD && (
          <div className="flex flex-col items-center pt-4 md:pt-8 justify-start flex-1 animate-fade-in w-full max-w-lg mx-auto">

            {/* Logo - Centered */}
            <div className="mb-2 md:mb-8 text-center group cursor-pointer pt-1" onClick={handleReset}>
              <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-cloud-logo lowercase select-none transition-transform duration-300 hover:scale-105 relative inline-block drop-shadow-xl">
                <span className="absolute inset-0 text-stroke-8 text-white z-0" aria-hidden="true">splitto</span>
                <span className="relative z-10">splitto</span>
              </h1>
              <p className="text-cloud-subtext text-sm md:text-lg font-medium mt-1 md:mt-2 tracking-wide">The right way to split</p>
            </div>

            {/* Tabs */}
            <div className="flex w-full bg-gray-100 p-1 md:p-1.5 rounded-full mb-2 md:mb-8 shadow-inner-soft flex-shrink-0">
              <button
                onClick={() => setActiveTab('host')}
                className={`flex-1 py-2 md:py-4 rounded-full font-bold text-sm md:text-lg transition-all duration-300 transform ${activeTab === 'host'
                  ? 'bg-white text-black shadow-sm scale-100'
                  : 'text-gray-400 active:text-gray-600 scale-95'
                  }`}
              >
                Host
              </button>
              <button
                onClick={() => setActiveTab('join')}
                className={`flex-1 py-2 md:py-4 rounded-full font-bold text-sm md:text-lg transition-all duration-300 transform ${activeTab === 'join'
                  ? 'bg-white text-black shadow-sm scale-100'
                  : 'text-gray-400 active:text-gray-600 scale-95'
                  }`}
              >
                Join
              </button>
            </div>

            <div className="w-full flex-1 flex flex-col min-h-0 pb-1">
              {activeTab === 'host' ? (
                <div className="animate-fade-in flex-1 flex flex-col min-h-0">
                  <UploadZone onFileSelect={handleFileSelect} isProcessing={isProcessing} />
                </div>
              ) : (
                <div className="animate-fade-in flex-1 flex flex-col">
                  <div className="bg-pastel-green rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-sm border border-black/5 relative overflow-hidden">
                    <div className="relative z-10">
                      <h2 className="text-2xl md:text-3xl font-black text-black mb-2 md:mb-3 text-center tracking-tight">Enter PIN</h2>
                      <p className="text-base md:text-xl text-gray-600 mb-6 md:mb-10 text-center font-medium">Ask the host for the 4-digit code</p>

                      {error && (
                        <div className="bg-white/50 border-2 border-red-100 rounded-2xl md:rounded-3xl p-3 md:p-4 mb-4 md:mb-6 flex items-center gap-2 md:gap-3 text-red-500 text-sm md:text-lg font-bold animate-shake">
                          <span>⚠️</span> {error}
                        </div>
                      )}

                      <form onSubmit={handleJoinSubmit} className="flex flex-col gap-4 md:gap-6">
                        <label htmlFor="join-pin-input" className="sr-only">Enter PIN</label>
                        <input
                          id="join-pin-input"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={4}
                          placeholder="0000"
                          value={joinPin}
                          onChange={(e) => {
                            setJoinPin(e.target.value.replace(/[^0-9]/g, ''));
                            setError(null);
                          }}
                          className="w-full bg-white/60 border-2 border-transparent focus:border-black/10 rounded-2xl md:rounded-[2rem] px-4 md:px-6 py-5 md:py-8 text-center text-5xl md:text-7xl tracking-[0.15em] md:tracking-[0.2em] font-black text-black focus:outline-none transition-all placeholder:text-black/10 shadow-inner-soft"
                        />
                        <button
                          type="submit"
                          disabled={joinPin.length !== 4 || isProcessing}
                          className="w-full py-4 md:py-6 bg-black text-white rounded-2xl md:rounded-[2rem] font-bold text-lg md:text-2xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 md:mt-4 active:scale-[0.98] transform"
                        >
                          {isProcessing ? 'Checking...' : 'Join Split'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div >
        )
        }

        {
          step === AppStep.USERS && (
            <div className="flex justify-center flex-1 items-center animate-fade-in">
              <div className="w-full max-w-lg bg-white rounded-[3rem] p-8 md:p-10 shadow-soft border border-white/50">
                <UserSetup
                  users={users}
                  setUsers={setUsers}
                  onContinue={() => {
                    // Auto-assign all users to all items by default
                    setItems(prevItems => prevItems.map(item => ({
                      ...item,
                      assignedTo: users.map(u => u.id)
                    })));
                    setStep(AppStep.SPLIT);
                  }}
                  onClose={handleReset}
                />
              </div>
            </div>
          )
        }

        {
          step === AppStep.SPLIT && (
            <div className="flex-1 animate-fade-in h-full">
              {splitStatus === 'waiting' && !isHost ? (
                <WaitingRoom />
              ) : (
                <Splitter
                  items={items}
                  users={users}
                  setItems={setItems}
                  onReset={handleReset}
                  onShare={() => setStep(AppStep.SHARE)}
                  currency={currency}
                  onClose={handleReset}
                />
              )}
            </div>
          )
        }

        {
          step === AppStep.SHARE && (
            <div className="flex-1 animate-fade-in h-full">
              <ShareView
                items={items}
                users={users}
                currency={currency}
                onBack={() => setStep(AppStep.SPLIT)}
                onHome={handleReset}
              />
            </div>
          )
        }
      </main >

      {/* Toast Notifications */}
      {
        toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => hideToast(toast.id)}
          />
        ))
      }
    </div >
  );
};

const App: React.FC = () => {
  return (
    <SplitProvider>
      <AppContent />
    </SplitProvider>
  );
};

export default App;