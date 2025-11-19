import React, { useState, useCallback, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { UserSetup } from './components/UserSetup';
import { ModeSelection } from './components/ModeSelection';
import { WaitingRoom } from './components/WaitingRoom';
import { Splitter } from './components/Splitter';
import { ShareView } from './components/ShareView';
import { ReceiptItem, User, AppStep } from './types';
import { fileToGenerativePart, parseReceiptImage } from './services/geminiService';
import { Activity, Settings, X, Users, ArrowRight } from 'lucide-react';
import { SplitProvider, useSplit } from './contexts/SplitContext';

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
    pendingJoinPin
  } = useSplit();

  const [isProcessing, setIsProcessing] = useState(false);
  const [currency, setCurrency] = useState('₹');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Join Flow State
  const [joinPin, setJoinPin] = useState('');
  const [joinName, setJoinName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const [isModeSelectionOpen, setIsModeSelectionOpen] = useState(false);

  // Auto-open join modal if pending pin exists
  useEffect(() => {
    if (pendingJoinPin && !isJoining && step === AppStep.UPLOAD) {
      setJoinPin(pendingJoinPin);
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
      console.error("Failed to process receipt", error);
      alert("Could not extract data from receipt. Please try a clearer image.");
    } finally {
      setIsProcessing(false);
    }
  }, [setItems, setIsModeSelectionOpen]);

  const handleManualSelect = () => {
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
      alert("Failed to create live room. Please try again.");
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
    setIsJoining(true);
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

  return (
    <div className="min-h-screen bg-nike-black text-white selection:bg-nike-volt selection:text-black flex flex-col relative overflow-hidden">
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
      {isModeSelectionOpen && (
        <ModeSelection
          onManualSelect={handleManualSelect}
          onLiveSelect={handleLiveSelect}
          isCreating={false} // We could track loading state for createSplit if needed
          pin={pin}
          onProceed={handleLiveProceed}
        />
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-nike-card w-full max-w-sm rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <div className="p-5 md:p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-extrabold italic uppercase tracking-tighter">Settings</h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
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
                    onClick={() => { setCurrency(c.symbol); setIsSettingsOpen(false); }}
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

      {/* Name Input Modal for Joining */}
      {isJoining && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-nike-card w-full max-w-sm rounded-3xl p-8 border border-white/10 shadow-2xl">
            {currentUser && splitStatus === 'waiting' ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-nike-volt/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <span className="text-4xl">⏳</span>
                </div>
                <h2 className="text-2xl font-extrabold italic uppercase tracking-tighter mb-2">Waiting for Host</h2>
                <p className="text-nike-subtext mb-6">The host will start the session soon.</p>
                <div className="flex justify-center space-x-2">
                  <div className="w-2 h-2 bg-nike-volt rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-nike-volt rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-nike-volt rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-extrabold italic uppercase tracking-tighter mb-2">Join Split</h2>
                <p className="text-nike-subtext mb-6">Enter your name to join the group.</p>
                {contextError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-center gap-2 text-red-500 text-sm font-bold">
                    <span>⚠️</span> {contextError}
                  </div>
                )}
                <form onSubmit={handleNameSubmit} className="flex flex-col gap-4">
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="Your Name"
                    className="bg-nike-gray border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-nike-volt transition-colors"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsJoining(false)}
                      className="flex-1 py-4 rounded-xl font-bold text-nike-subtext hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!joinName.trim() || isProcessing}
                      className="flex-1 py-4 bg-nike-volt text-black rounded-xl font-bold uppercase tracking-wider hover:bg-nike-volt-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                      {isProcessing ? 'Joining...' : 'Join'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="p-4 md:p-6 flex justify-between items-center sticky top-0 bg-nike-black/90 backdrop-blur-md z-50 border-b border-white/10">
        <div className="flex items-center gap-2 group cursor-pointer touch-manipulation" onClick={handleReset}>
          <Activity className="text-nike-volt w-6 h-6 md:w-8 md:h-8 transform -skew-x-12" strokeWidth={3} />
          <h1 className="text-xl md:text-2xl font-extrabold italic uppercase tracking-tighter leading-none">
            Just<br /><span className="text-nike-volt">Split It</span>
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
                  className={`h-1 w-8 rounded-full transition-all duration-500 ${isActive ? 'bg-nike-volt' : 'bg-nike-gray'}`}
                />
              )
            })}
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full bg-nike-gray text-nike-subtext active:text-white md:hover:text-white active:bg-white/10 md:hover:bg-white/10 transition-colors border border-transparent active:border-white/20 md:hover:border-white/20 touch-manipulation"
          >
            <Settings size={18} className="md:w-5 md:h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 md:p-4 lg:p-6 flex flex-col h-[calc(100vh-73px)] md:h-[calc(100vh-90px)]">
        {step === AppStep.UPLOAD && (
          <div className="flex flex-col items-center justify-center flex-1 animate-fade-in">
            <div className="w-full max-w-md">
              <UploadZone onFileSelect={handleFileSelect} isProcessing={isProcessing} />

              {/* Join Split Section */}
              <div className="mt-8 pt-8 border-t border-white/10 w-full">
                <p className="text-center text-nike-subtext text-sm mb-4 uppercase tracking-widest font-bold">Or join an existing split</p>
                <form onSubmit={handleJoinSubmit} className="flex gap-2">
                  <input
                    type="text"
                    pattern="[0-9]*"
                    maxLength={4}
                    placeholder="Enter 4-digit PIN"
                    value={joinPin}
                    onChange={(e) => setJoinPin(e.target.value.replace(/[^0-9]/g, ''))}
                    className="flex-1 bg-nike-gray border border-white/10 rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] font-mono focus:outline-none focus:border-nike-volt transition-colors placeholder:tracking-normal placeholder:text-sm placeholder:font-sans"
                  />
                  <button
                    type="submit"
                    disabled={joinPin.length !== 4}
                    className="bg-white text-black px-6 rounded-xl font-bold uppercase tracking-wider hover:bg-nike-volt transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Join
                  </button>
                </form>
              </div>
            </div>
            {!isProcessing && (
              <div className="mt-8 text-center opacity-50">
                <p className="text-xs font-mono uppercase tracking-widest">Powered by Gemini 2.5 Flash</p>
              </div>
            )}
          </div>
        )}

        {step === AppStep.USERS && (
          <div className="flex justify-center flex-1 items-center animate-fade-in">
            <div className="w-full max-w-lg bg-nike-card rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl border border-white/5">
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
              />
            </div>
          </div>
        )}

        {step === AppStep.SPLIT && (
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
              />
            )}
          </div>
        )}

        {step === AppStep.SHARE && (
          <div className="flex-1 animate-fade-in h-full">
            <ShareView
              items={items}
              users={users}
              currency={currency}
              onBack={() => setStep(AppStep.SPLIT)}
            />
          </div>
        )}
      </main>
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