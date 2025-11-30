import React, { useState, useEffect } from 'react';
import { User, Sparkles, Users, ArrowLeft, Check, X, Copy, Link } from 'lucide-react';

interface ModeSelectionProps {
    onManualSelect: () => void;
    onLiveSelect: (hostName: string) => Promise<void>;
    isCreating: boolean;
    pin: string | null;
    onProceed: () => void;
    onClose: () => void;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({
    onManualSelect,
    onLiveSelect,
    isCreating,
    pin,
    onProceed,
    onClose
}) => {
    const [mode, setMode] = useState<'selection' | 'live-setup'>('selection');
    const [hostName, setHostName] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleCopyLink = async () => {
        if (!pin) return;
        const shareUrl = `${window.location.origin}${window.location.pathname}?join=${pin}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link', err);
        }
    };

    const handleLiveClick = () => {
        setMode('live-setup');
    };

    const handleCreateSplit = async () => {
        if (!hostName.trim()) return;
        await onLiveSelect(hostName);
    };

    // Mobile: Full-screen page view
    if (isMobile) {
        if (mode === 'selection') {
            return (
                <div className="fixed inset-0 bg-white z-50 flex flex-col animate-fade-in overflow-y-auto">
                    {/* Content */}
                    <div className="flex-1 flex flex-col p-6 pt-4 pb-6 safe-area-inset min-h-min">
                        {/* Header with close */}
                        <div className="flex items-start justify-between mb-2">
                            <button
                                onClick={onClose}
                                className="p-2 -ml-2 rounded-full active:bg-gray-100 text-gray-400 active:text-black transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-cloud-text mb-1">How do you want to split?</h2>
                            <p className="text-cloud-subtext text-sm">Choose the best way for your group</p>
                        </div>

                        {/* Cards - flex to fill available space */}
                        <div className="flex-1 flex flex-col gap-4 min-h-0">
                            {/* Manual Mode Card */}
                            <button
                                onClick={onManualSelect}
                                className="flex-1 group bg-pastel-blue p-6 rounded-[2rem] border-2 border-transparent active:border-cloud-primary/30 transition-all duration-200 flex flex-col items-center justify-center shadow-sm active:scale-[0.98] min-h-[140px]"
                            >
                                <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mb-4">
                                    <Users className="h-7 w-7 text-cloud-text" strokeWidth={2} />
                                </div>
                                <h3 className="text-xl font-bold text-cloud-text mb-1">Manual Split</h3>
                                <p className="text-cloud-subtext text-sm text-center leading-relaxed">
                                    Add friends and assign items yourself
                                </p>
                            </button>

                            {/* Live Mode Card */}
                            <button
                                onClick={handleLiveClick}
                                className="flex-1 group bg-pastel-purple p-6 rounded-[2rem] border-2 border-transparent active:border-cloud-primary/30 transition-all duration-200 flex flex-col items-center justify-center shadow-sm active:scale-[0.98] relative min-h-[140px]"
                            >
                                <div className="absolute top-4 right-4">
                                    <span className="bg-cloud-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">New</span>
                                </div>
                                <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mb-4">
                                    <Sparkles className="h-7 w-7 text-cloud-primary" strokeWidth={2} />
                                </div>
                                <h3 className="text-xl font-bold text-cloud-text mb-1">Live Split</h3>
                                <p className="text-cloud-subtext text-sm text-center leading-relaxed">
                                    Get a PIN. Friends join and pick in real-time
                                </p>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Mobile Live Setup view
        return (
            <div className="fixed inset-0 bg-white z-50 flex flex-col animate-fade-in overflow-y-auto">
                {/* Content */}
                <div className="flex-1 flex flex-col p-6 pt-4 pb-6 safe-area-inset min-h-min">
                    {/* Header with back/close */}
                    <div className="flex items-start justify-between mb-2">
                        {!pin ? (
                            <button
                                onClick={() => setMode('selection')}
                                className="p-2 -ml-2 rounded-full active:bg-gray-100 text-gray-400 active:text-black transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                        ) : (
                            <div className="w-10" />
                        )}
                    </div>

                    {!pin ? (
                        <div className="flex-1 flex flex-col">
                            <div className="text-center mb-8">
                                <div className="w-24 h-24 bg-pastel-blue rounded-full flex items-center justify-center mx-auto mb-5">
                                    <User className="h-10 w-10 text-cloud-text" strokeWidth={2} />
                                </div>
                                <h2 className="text-2xl font-bold text-cloud-text mb-2">What's your name?</h2>
                                <p className="text-cloud-subtext">We'll show this to your friends</p>
                            </div>

                            <input
                                type="text"
                                value={hostName}
                                onChange={(e) => setHostName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full bg-gray-50 text-cloud-text px-6 py-5 rounded-2xl border-2 border-transparent focus:border-cloud-primary focus:outline-none transition-all text-xl text-center placeholder-gray-300 font-bold"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateSplit()}
                            />

                            <div className="flex-1 min-h-[20px]" />

                            <button
                                onClick={handleCreateSplit}
                                disabled={!hostName.trim() || isCreating}
                                className="w-full bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-5 rounded-2xl transition-all duration-200 text-lg shadow-lg active:scale-[0.98] transform mt-4"
                            >
                                {isCreating ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating...
                                    </span>
                                ) : (
                                    "Create Live Room"
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="h-8 w-8 text-green-500" strokeWidth={3} />
                                </div>
                                <h2 className="text-2xl font-bold text-cloud-text mb-2">Room Created!</h2>
                                <p className="text-cloud-subtext">Share this PIN with your friends</p>
                            </div>

                            <div className="bg-pastel-green rounded-3xl p-8 mb-6">
                                <div className="text-xs text-cloud-subtext uppercase tracking-widest font-bold mb-3 text-center">Room PIN</div>
                                <div className="text-6xl font-black text-cloud-text tracking-[0.15em] font-mono text-center">{pin}</div>
                            </div>

                            <button
                                onClick={handleCopyLink}
                                className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all mb-4 ${
                                    linkCopied 
                                        ? 'bg-green-100 text-green-600' 
                                        : 'bg-gray-100 text-cloud-text active:bg-gray-200'
                                }`}
                            >
                                {linkCopied ? (
                                    <>
                                        <Check size={20} />
                                        Link Copied!
                                    </>
                                ) : (
                                    <>
                                        <Link size={20} />
                                        Copy Invite Link
                                    </>
                                )}
                            </button>

                            <div className="flex-1 min-h-[20px]" />

                            <div className="space-y-3">
                                <button
                                    onClick={onProceed}
                                    className="w-full bg-black text-white font-bold py-5 rounded-2xl transition-all duration-200 text-lg shadow-lg active:scale-[0.98] transform"
                                >
                                    Start Splitting
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full text-cloud-subtext font-medium py-3 transition-colors active:text-cloud-text"
                                >
                                    Cancel & Go Back
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Desktop: Modal view (original behavior)
    if (mode === 'selection') {
        return (
            <div className="fixed inset-0 bg-cloud-primary/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-soft border border-white/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cloud-light via-cloud-primary to-cloud-light opacity-50"></div>

                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors z-10"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex justify-center mb-6">
                        <h1 className="text-5xl font-black tracking-tighter text-cloud-logo lowercase select-none relative inline-block drop-shadow-md">
                            <span className="absolute inset-0 text-stroke-4 text-white z-0" aria-hidden="true">splitto</span>
                            <span className="relative z-10">splitto</span>
                        </h1>
                    </div>

                    <h2 className="text-3xl font-bold text-cloud-text mb-2 text-center">How do you want to split?</h2>
                    <p className="text-cloud-subtext text-center mb-8">Choose the best way for your group</p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Manual Mode Card */}
                        <button
                            onClick={onManualSelect}
                            className="group relative bg-gray-50 hover:bg-white p-8 rounded-[2rem] border-2 border-transparent hover:border-cloud-primary/30 transition-all duration-300 flex flex-col items-center justify-center h-full min-h-[280px] shadow-sm hover:shadow-lg"
                        >
                            <div className="mb-6 w-24 h-24 rounded-full bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Users className="h-10 w-10 text-cloud-text group-hover:text-cloud-primary transition-colors" strokeWidth={2} />
                            </div>
                            <h3 className="text-2xl font-bold text-cloud-text mb-3">Manual Split</h3>
                            <p className="text-cloud-subtext text-sm text-center leading-relaxed max-w-[200px]">
                                Add friends and assign items yourself
                            </p>
                        </button>

                        {/* Live Mode Card */}
                        <button
                            onClick={handleLiveClick}
                            className="group relative bg-gray-50 hover:bg-white p-8 rounded-[2rem] border-2 border-transparent hover:border-cloud-primary/30 transition-all duration-300 flex flex-col items-center justify-center h-full min-h-[280px] shadow-sm hover:shadow-lg"
                        >
                            <div className="absolute top-6 right-6">
                                <span className="bg-cloud-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">New</span>
                            </div>
                            <div className="mb-6 w-24 h-24 rounded-full bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Sparkles className="h-10 w-10 text-cloud-primary" strokeWidth={2} />
                            </div>
                            <h3 className="text-2xl font-bold text-cloud-text mb-3">Live Split</h3>
                            <p className="text-cloud-subtext text-sm text-center leading-relaxed max-w-[200px]">
                                Get a PIN. Friends join and pick items in real-time
                            </p>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Live Setup Mode
    return (
        <div className="fixed inset-0 bg-cloud-primary/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-soft border border-white/50 relative overflow-hidden">
                {!pin ? (
                    <>
                        <button
                            onClick={() => setMode('selection')}
                            className="mb-6 text-cloud-subtext hover:text-cloud-text flex items-center gap-2 text-sm font-bold transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
                            Back
                        </button>

                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-cloud-light rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner-soft">
                                <User className="h-8 w-8 text-cloud-primary" strokeWidth={2.5} />
                            </div>
                            <h2 className="text-2xl font-bold text-cloud-text mb-2">What's your name?</h2>
                            <p className="text-cloud-subtext">We'll show this to your friends</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={hostName}
                                onChange={(e) => setHostName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full bg-gray-50 text-cloud-text px-6 py-5 rounded-2xl border-2 border-transparent focus:border-cloud-primary focus:outline-none transition-all text-lg text-center placeholder-gray-300 font-medium"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateSplit()}
                            />

                            <button
                                onClick={handleCreateSplit}
                                disabled={!hostName.trim() || isCreating}
                                className="w-full bg-cloud-primary hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-5 rounded-2xl transition-all duration-200 text-lg shadow-lg active:scale-[0.98] transform"
                            >
                                {isCreating ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Room...
                                    </span>
                                ) : (
                                    "Create Live Room"
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-float animate-bounce">
                            <Check className="h-10 w-10 text-green-500" strokeWidth={3} />
                        </div>

                        <h2 className="text-2xl font-bold text-cloud-text mb-2">Room Created!</h2>
                        <p className="text-cloud-subtext mb-8">Share this PIN with your friends</p>

                        <div className="bg-gray-50 rounded-3xl p-8 mb-6 border border-gray-100 shadow-inner-soft">
                            <div className="text-xs text-cloud-subtext uppercase tracking-widest font-bold mb-3">Room PIN</div>
                            <div className="text-6xl font-bold text-cloud-text tracking-[0.1em] font-mono">{pin}</div>
                        </div>

                        {/* Copy Link Button */}
                        <button
                            onClick={handleCopyLink}
                            className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all mb-6 ${
                                linkCopied 
                                    ? 'bg-green-100 text-green-600 border-2 border-green-200' 
                                    : 'bg-white text-cloud-text border-2 border-gray-200 hover:border-cloud-primary hover:text-cloud-primary'
                            }`}
                        >
                            {linkCopied ? (
                                <>
                                    <Check size={18} />
                                    Link Copied!
                                </>
                            ) : (
                                <>
                                    <Link size={18} />
                                    Copy Invite Link
                                </>
                            )}
                        </button>

                        <div className="space-y-3">
                            <button
                                onClick={onProceed}
                                className="w-full bg-cloud-primary hover:bg-blue-500 text-white font-bold py-5 rounded-2xl transition-all duration-200 text-lg shadow-lg active:scale-[0.98] transform"
                            >
                                Start Splitting
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full text-cloud-subtext hover:text-cloud-text font-medium py-3 transition-colors"
                            >
                                Cancel & Go Back
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
