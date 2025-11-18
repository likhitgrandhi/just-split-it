import React, { useState, useCallback } from 'react';
import { UploadZone } from './components/UploadZone';
import { UserSetup } from './components/UserSetup';
import { Splitter } from './components/Splitter';
import { ShareView } from './components/ShareView';
import { ReceiptItem, User, AppStep } from './types';
import { fileToGenerativePart, parseReceiptImage } from './services/geminiService';
import { Activity, Settings, X } from 'lucide-react';

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

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currency, setCurrency] = useState('$');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
      setStep(AppStep.USERS);
    } catch (error) {
      console.error("Failed to process receipt", error);
      alert("Could not extract data from receipt. Please try a clearer image.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleReset = () => {
    setItems([]);
    setUsers([]);
    setStep(AppStep.UPLOAD);
  };

  return (
    <div className="min-h-screen bg-nike-black text-white selection:bg-nike-volt selection:text-black flex flex-col relative overflow-hidden">
      
      {/* Settings Modal */}
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

      {/* Header */}
      <header className="p-4 md:p-6 flex justify-between items-center sticky top-0 bg-nike-black/90 backdrop-blur-md z-50 border-b border-white/10">
        <div className="flex items-center gap-2 group cursor-pointer touch-manipulation" onClick={handleReset}>
            <Activity className="text-nike-volt w-6 h-6 md:w-8 md:h-8 transform -skew-x-12" strokeWidth={3} />
            <h1 className="text-xl md:text-2xl font-extrabold italic uppercase tracking-tighter leading-none">
              Just<br/><span className="text-nike-volt">Split It</span>
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
             <Splitter 
               items={items} 
               users={users} 
               setItems={setItems} 
               onReset={handleReset}
               onShare={() => setStep(AppStep.SHARE)}
               currency={currency}
             />
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
    </div>
  );
};

export default App;