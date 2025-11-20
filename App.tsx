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
import { Activity, Settings, X, Users, ArrowRight, ArrowLeft } from 'lucide-react';
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
    discardUnstartedRoom
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
  // Removed activeTab state for Bento Grid layout

  // Auto-open join modal if pending pin exists
  useEffect(() => {
    if (pendingJoinPin && !isJoining && step === AppStep.UPLOAD) {
      setJoinPin(pendingJoinPin);
      // Auto-open the name modal
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
        color: '#CBF300' // Host gets the brand color
      };

      setUsers([newUser]);
      setCurrentUser(newUser);

      // Create the split
      await createSplit();

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
      // If the room is active, we can close the modal.
      // If it's waiting, we keep the modal open to show the waiting screen.
      // We'll handle this logic in the render part or via an effect.
      // For now, just clear the inputs.
      setJoinPin('');
      setJoinName('');
    } catch (err: any) {
      console.error("Failed to join", err);
      // alert("Failed to join split. Please check the PIN and try again."); // Removed alert
      // Error is already set in context, but we can also show local error if needed
      // The context error will be displayed by the UI if we use it.
      // Let's rely on the context error or set a local one if we want to show it in the modal.
    } finally {
      setIsProcessing(false);
    }
  };

  // Effect to close join modal when room becomes active
  React.useEffect(() => {
    if (isJoining && splitStatus === 'active' && currentUser) {
      setIsJoining(false);
      setStep(AppStep.SPLIT);
    }
  }, [splitStatus, isJoining, currentUser, setStep]);

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
    <div className="min-h-screen bg-[#F2F2F2] text-nike-forest selection:bg-nike-volt selection:text-nike-forest flex flex-col relative overflow-hidden font-sans">
      {isRestoring && (
        <div className="fixed inset-0 z-[100] bg-nike-black flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-nike-volt border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {splitStatus === 'ended' && (
        <div className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-nike-card w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl text-center">
            <div className="w-20 h-20 bg-nike-volt/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🏁</span>
            </div>
            <h2 className="text-2xl font-extrabold italic uppercase tracking-tighter mb-2">Split Ended</h2>
            <p className="text-nike-subtext mb-8">The host has ended this session.</p>
            <button
              onClick={handleReset}
              className="w-full py-4 bg-nike-volt text-black rounded-xl font-bold uppercase tracking-wider hover:bg-nike-volt-hover transition-colors"
            >
              Start New Split
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}


      {isCurrencyOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-nike-card w-full max-w-sm rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <div className="p-5 md:p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-extrabold italic uppercase tracking-tighter">Settings</h2>
              <button
                onClick={() => setIsCurrencyOpen(false)}
                className="p-1 rounded-full active:bg-white/10 md:hover:bg-white/10 text-nike-subtext active:text-white md:hover:text-white transition-colors touch-manipulation"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-5 md:p-6">
              <h3 className="text-sm font-bold text-nike-subtext uppercase tracking-widest mb-4">Select Currency</h3>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => { setCurrency(c.symbol); setIsCurrencyOpen(false); }}
                    className={`
                      flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border transition-all touch-manipulation
                      ${currency === c.symbol
                        ? 'bg-nike-volt text-black border-nike-volt'
                        : 'bg-nike-gray text-white border-white/10 active:border-white/30 md:hover:border-white/30 active:bg-white/5 md:hover:bg-white/5'}
                    `}
                  >
                    <span className="text-xl md:text-2xl font-condensed font-bold mb-1">{c.symbol}</span>
                    <span className={`text-[10px] font-bold tracking-wider ${currency === c.symbol ? 'opacity-100' : 'opacity-60'}`}>{c.code}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Split Full Screen View */}
      {isJoining && (
        <div className="fixed inset-0 z-[60] bg-[#F2F2F2] flex flex-col items-center justify-center p-4 animate-fade-in">
          {/* Back Button */}
          <div className="absolute top-0 left-0 z-10 p-2">
            <button
              onClick={handleCloseJoinModal}
              className="text-nike-subtext hover:text-nike-forest font-bold text-sm uppercase tracking-wider flex items-center gap-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full hover:bg-white/80 transition-all"
            >
              <ArrowLeft size={16} /> Back
            </button>
          </div>

          {/* Branding Tile (Top Right) */}
          <div className="absolute top-0 right-0 z-10 p-2 hidden md:block">
            <div className="bg-nike-volt rounded-xl px-4 py-2 flex flex-row justify-center items-center gap-2 shadow-lg">
              <img src="/splitways.svg" alt="Logo" className="h-6 w-6 object-contain" />
              <h3 className="text-nike-forest font-black text-xl tracking-tighter leading-none">
                SPLIT WAYS
              </h3>
            </div>
          </div>

          <div className="w-full max-w-sm flex flex-col gap-4">
            {currentUser && splitStatus === 'waiting' ? (
              <div className="bg-white rounded-[2rem] p-8 shadow-2xl text-center">
                <div className="w-20 h-20 bg-nike-volt/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <span className="text-4xl">⏳</span>
                </div>
                <h2 className="text-2xl font-extrabold italic uppercase tracking-tighter mb-2 text-nike-forest">Waiting for Host</h2>
                <p className="text-nike-subtext mb-6">The host will start the session soon.</p>
                <div className="flex justify-center space-x-2">
                  <div className="w-2 h-2 bg-nike-volt rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-nike-volt rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-nike-volt rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            ) : (
              <>
                {/* Tile 1: Room Code */}
                <div className="bg-nike-forest rounded-[2rem] p-8 shadow-xl text-center relative overflow-hidden">
                  <div className="text-xs text-nike-volt uppercase tracking-widest font-bold mb-2">Room Code</div>
                  <div className="text-6xl font-black text-white tracking-[0.2em] font-mono leading-none">{joinPin}</div>
                </div>

                {/* Tile 2: Name Input & Actions */}
                <div className="bg-white rounded-[2rem] p-8 shadow-xl">
                  <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 text-nike-forest text-center">Join Split</h2>
                  <p className="text-nike-subtext mb-6 text-center font-medium">Enter your name to join</p>

                  {contextError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-center gap-2 text-red-500 text-sm font-bold">
                      <span>⚠️</span> {contextError}
                    </div>
                  )}

                  <form onSubmit={handleNameSubmit} className="flex flex-col gap-4">
                    <label htmlFor="join-name-input" className="sr-only">Your Name</label>
                    <input
                      id="join-name-input"
                      type="text"
                      value={joinName}
                      onChange={(e) => setJoinName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full bg-gray-50 border border-transparent focus:border-nike-volt rounded-xl p-4 text-center text-xl font-bold text-nike-forest placeholder:text-nike-subtext/50 focus:outline-none transition-all"
                      autoFocus
                    />

                    <button
                      type="submit"
                      disabled={!joinName.trim() || isProcessing}
                      className="w-full py-4 bg-nike-forest text-white rounded-xl font-bold uppercase tracking-wider hover:bg-nike-volt hover:text-nike-forest transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-2"
                    >
                      {isProcessing ? 'Joining...' : 'Join Room'}
                    </button>

                    <button
                      type="button"
                      onClick={handleCloseJoinModal}
                      className="w-full py-3 text-nike-subtext font-bold text-sm uppercase tracking-wider hover:text-nike-forest transition-colors"
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      {step !== AppStep.UPLOAD && step !== AppStep.USERS && step !== AppStep.SPLIT && (
        <header className="p-4 md:p-6 flex justify-between items-center sticky top-0 bg-[#F2F2F2]/80 backdrop-blur-md z-50">
          <div className="flex items-center gap-2 group cursor-pointer touch-manipulation" onClick={handleReset}>
            <Activity className="text-nike-volt w-6 h-6 md:w-8 md:h-8" strokeWidth={2.5} />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-none text-nike-forest">
              Just<span className="text-nike-volt">Split</span>It
            </h1>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            {/* Progress Indicators (Hidden on mobile) */}
            <div className="hidden md:flex gap-2">
              {[AppStep.UPLOAD, AppStep.USERS, AppStep.SPLIT, AppStep.SHARE].map((s, idx) => {
                const stepsOrder = [AppStep.UPLOAD, AppStep.USERS, AppStep.SPLIT, AppStep.SHARE];
                const currentIdx = stepsOrder.indexOf(step);
                const stepIdx = stepsOrder.indexOf(s);
                const isActive = currentIdx >= stepIdx;

                return (
                  <div
                    key={s}
                    className={`h-1 w-8 rounded-full transition-all duration-500 ${isActive ? 'bg-nike-volt' : 'bg-gray-200'}`}
                  />
                )
              })}
            </div>

            <button
              onClick={() => setIsCurrencyOpen(true)}
              className="p-2 rounded-full bg-white/10 text-white/70 active:text-white md:hover:text-white active:bg-white/20 md:hover:bg-white/20 transition-colors border border-transparent touch-manipulation"
            >
              <Settings size={18} className="md:w-5 md:h-5" />
            </button>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1024px] mx-auto p-3 md:p-4 lg:p-6 flex flex-col h-[calc(100vh-73px)] md:h-[calc(100vh-90px)]">
        {step === AppStep.UPLOAD && (
          <div className="flex flex-col items-center pt-4 justify-start flex-1 animate-fade-in w-full h-full">

            {isModeSelectionOpen ? (
              <ModeSelection
                onManualSelect={handleManualSelect}
                onLiveSelect={handleLiveSelect}
                isCreating={isProcessing}
                pin={pin}
                onProceed={handleLiveProceed}
                onBack={async () => {
                  await discardUnstartedRoom();
                  setIsModeSelectionOpen(false);
                }}
                users={users}
              />
            ) : (
              /* Bento Grid Layout */
              <div className="flex flex-col md:grid md:grid-cols-3 md:grid-rows-[auto_auto] gap-4 w-full h-full">

                {/* Tile 1: Branding Tile (Top on Mobile, Bottom Right on Desktop) */}
                <div className="order-1 md:order-3 md:col-start-3 md:row-start-2 h-32 md:h-40 bg-nike-volt rounded-[2rem] p-8 flex flex-row justify-center items-center gap-3 relative overflow-hidden shadow-xl">
                  <img src="/splitways.svg" alt="Logo" className="h-10 w-10 object-contain z-10" />
                  <h3 className="text-nike-forest font-black text-4xl tracking-tighter leading-none z-10">
                    SPLIT WAYS
                  </h3>
                  <div className="absolute inset-0 bg-gradient-to-t from-nike-volt/50 to-transparent mix-blend-overlay"></div>
                  <div className="absolute -right-4 -bottom-4 text-nike-forest/10 transform rotate-12">
                    <Activity size={120} />
                  </div>
                </div>

                {/* Tile 2: Upload Zone (Middle on Mobile, Left on Desktop) */}
                <div className="order-2 md:order-1 md:col-span-2 md:row-span-2 bg-white rounded-[2rem] p-0 shadow-xl overflow-hidden relative group transition-transform duration-500 hover:scale-[1.01] min-h-[400px]">
                  <div className="absolute top-6 left-6 z-10">
                    <span className="bg-nike-volt text-nike-forest text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Create a Split</span>
                  </div>
                  <UploadZone onFileSelect={handleFileSelect} isProcessing={isProcessing} />
                </div>

                {/* Tile 3: Join Split (Bottom on Mobile, Top Right on Desktop) */}
                <div className="order-3 md:order-2 md:col-start-3 md:row-start-1 flex flex-col">
                  <div className="flex-1 bg-white rounded-[2rem] p-8 shadow-xl flex flex-col justify-center relative overflow-hidden transition-transform duration-500 hover:scale-[1.02] min-h-[300px]">
                    <div className="absolute top-6 left-6">
                      <span className="bg-nike-forest/5 text-nike-forest text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Join a Split</span>
                    </div>

                    <div className="mt-8 text-center">
                      <h2 className="text-6xl font-bold text-nike-forest mb-2 tracking-tighter">
                        P<span className="text-nike-volt">I</span>N
                      </h2>
                      <p className="text-nike-subtext mb-8 text-sm font-medium">Enter code to join</p>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2 mb-4 flex items-center gap-2 text-red-500 text-xs font-bold">
                        <span>⚠️</span> {error}
                      </div>
                    )}

                    <form onSubmit={handleJoinSubmit} className="flex flex-col gap-4">
                      <label htmlFor="join-pin-input" className="sr-only">Enter PIN</label>
                      <input
                        id="join-pin-input"
                        type="text"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder="0000"
                        value={joinPin}
                        onChange={(e) => {
                          setJoinPin(e.target.value.replace(/[^0-9]/g, ''));
                          setError(null);
                        }}
                        className="w-full bg-transparent border-b-2 border-nike-forest/10 rounded-none px-2 py-4 text-center text-5xl font-bold tracking-[0.2em] focus:outline-none focus:border-nike-volt transition-colors placeholder:text-nike-forest/20 placeholder:tracking-[0.2em] text-nike-forest font-sans"
                      />
                      <button
                        type="submit"
                        disabled={joinPin.length !== 4 || isProcessing}
                        className="w-full py-4 bg-nike-forest text-white rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-nike-volt hover:text-nike-forest transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-[0.98] transform mt-4"
                      >
                        {isProcessing ? '...' : 'Join'}
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            )}
          </div >
        )}

        {
          step === AppStep.USERS && (
            <div className="flex flex-col flex-1 animate-fade-in w-full h-full pt-12">
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
                onBack={() => {
                  // If we came from manual split, we probably want to go back to upload/mode selection
                  setStep(AppStep.UPLOAD);
                  setIsModeSelectionOpen(true);
                }}
              />
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
                  onBack={handleReset}
                />
              )}
            </div>
          )
        }

        {
          step === AppStep.SHARE && (
            <div className="flex-1 animate-fade-in h-full">
              <ShareView
                currency={currency}
                onBack={() => setStep(AppStep.SPLIT)}
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