import React, { useState } from 'react';
import { X, Link } from 'lucide-react';
import { User } from '../types';
import { useToast } from '../hooks/useToast';
import { Toast } from './Toast';

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
    const { toasts, hideToast, success, error: showError } = useToast(); // Added

    const handleShareLink = async () => {
        if (!pin) return;

        const shareUrl = `${window.location.origin}${window.location.pathname}?join = ${pin} `;
        const shareText = `Join my split! PIN: ${pin} \n\nClick here: ${shareUrl} `;

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

    const handleLiveClick = () => {
        setMode('live-setup');
    };

    const handleCreateSplit = async () => {
        if (!hostName.trim()) return;
        await onLiveSelect(hostName);
    };

    if (mode === 'selection') {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                {/* Modal */}
                <div className="bg-nike-card rounded-3xl max-w-2xl w-full h-[500px] p-8 pb-10 relative flex flex-col shadow-2xl border border-white/10">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>

                    <h2 className="text-2xl md:text-3xl font-extrabold italic uppercase tracking-tighter mb-2 text-nike-volt text-center">How do you want to split?</h2>
                    <p className="text-nike-subtext text-sm md:text-base mb-8 text-center">Choose the best way for your group</p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Manual Mode Card */}
                        <button
                            onClick={onManualSelect}
                            className="group relative bg-[#2C2C2E] hover:bg-[#3A3A3C] p-8 rounded-2xl border border-white/5 hover:border-[#CBF300]/50 transition-all duration-300 flex flex-col items-center justify-center h-full min-h-[280px]"
                        >
                            <div className="mb-6 w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">Manual Split</h3>
                            <p className="text-gray-400 text-xs text-center leading-relaxed max-w-[200px]">
                                Add friends and assign items yourself
                            </p>
                        </button>

                        {/* Live Mode Card */}
                        <button
                            onClick={handleLiveClick}
                            className="group relative bg-[#2C2C2E] hover:bg-[#3A3A3C] p-8 rounded-2xl border border-white/5 hover:border-[#CBF300]/50 transition-all duration-300 flex flex-col items-center justify-center h-full min-h-[280px]"
                        >
                            <div className="absolute top-4 right-4">
                                <span className="bg-[#CBF300] text-black text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">New</span>
                            </div>
                            <div className="mb-6 w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#CBF300]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">Live Split</h3>
                            <p className="text-gray-400 text-xs text-center leading-relaxed max-w-[200px]">
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-nike-card rounded-3xl max-w-2xl w-full h-[500px] p-8 pb-10 relative flex flex-col shadow-2xl border border-white/10">
                {!pin ? (
                    <>
                        <button
                            onClick={() => setMode('selection')}
                            className="mb-6 text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>

                        <div className="mb-6 md:mb-8">
                            <h2 className="text-2xl md:text-3xl font-extrabold italic uppercase tracking-tighter mb-2 text-nike-volt text-center">What's your name?</h2>
                            <p className="text-nike-subtext text-sm md:text-base text-center">We'll show this to your friends</p>
                        </div>

                        <div className="flex-1">
                            <input
                                type="text"
                                value={hostName}
                                onChange={(e) => setHostName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full bg-[#2C2C2E] text-white px-4 py-4 rounded-xl border border-white/10 focus:border-[#CBF300] focus:outline-none transition-colors text-lg text-center placeholder-gray-600"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateSplit()}
                            />
                        </div>

                        <button
                            onClick={handleCreateSplit}
                            disabled={!hostName.trim() || isCreating}
                            className="w-full bg-[#CBF300] hover:bg-[#b5d900] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl transition-all duration-200 text-lg shadow-lg shadow-[#CBF300]/20 uppercase tracking-wider"
                        >
                            {isCreating ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Room...
                                </span>
                            ) : (
                                "Create Live Room"
                            )}
                        </button>
                    </>
                ) : (
                    <div className="text-center py-4 pb-8">
                        <div className="w-20 h-20 bg-[#CBF300] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#CBF300]/30 animate-bounce">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">Room Created!</h2>
                        <p className="text-gray-400 mb-8">Share this PIN with your friends</p>

                        <div className="bg-[#2C2C2E] rounded-2xl p-6 mb-8 border border-white/10">
                            <div className="text-sm text-gray-500 uppercase tracking-wider font-bold mb-2">Room PIN</div>
                            <div className="text-5xl font-black text-white tracking-[0.2em] font-mono">{pin}</div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleShareLink}
                                className="flex-1 bg-[#CBF300] hover:bg-[#b5d900] text-black font-bold py-4 rounded-xl transition-all duration-200 text-lg flex items-center justify-center gap-2"
                            >
                                <Link size={20} />
                                Share Link
                            </button>
                            <button
                                onClick={onProceed}
                                className="flex-1 bg-white hover:bg-gray-100 text-black font-bold py-4 rounded-xl transition-all duration-200 text-lg"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}
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
        </div>
    );
};
