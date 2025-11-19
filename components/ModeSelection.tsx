import React, { useState } from 'react';
import { User } from '../types';

interface ModeSelectionProps {
    onManualSelect: () => void;
    onLiveSelect: (hostName: string) => Promise<void>;
    isCreating: boolean;
    pin: string | null;
    onProceed: () => void;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({
    onManualSelect,
    onLiveSelect,
    isCreating,
    pin,
    onProceed
}) => {
    const [mode, setMode] = useState<'selection' | 'live-setup'>('selection');
    const [hostName, setHostName] = useState('');

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
                <div className="bg-[#1C1C1E] rounded-3xl p-8 w-full max-w-2xl border border-white/10 shadow-2xl animate-fade-in">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">How do you want to split?</h2>
                    <p className="text-gray-400 text-center mb-8">Choose the best way for your group</p>

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
            <div className="bg-[#1C1C1E] rounded-3xl p-8 w-full max-w-md border border-white/10 shadow-2xl animate-fade-in">
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

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-[#CBF300]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#CBF300]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">What's your name?</h2>
                            <p className="text-gray-400">We'll show this to your friends</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={hostName}
                                onChange={(e) => setHostName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full bg-[#2C2C2E] text-white px-4 py-4 rounded-xl border border-white/10 focus:border-[#CBF300] focus:outline-none transition-colors text-lg text-center placeholder-gray-600"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateSplit()}
                            />

                            <button
                                onClick={handleCreateSplit}
                                disabled={!hostName.trim() || isCreating}
                                className="w-full bg-[#CBF300] hover:bg-[#b5d900] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl transition-all duration-200 text-lg shadow-lg shadow-[#CBF300]/20"
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
                        </div>
                    </>
                ) : (
                    <div className="text-center py-4">
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

                        <button
                            onClick={onProceed}
                            className="w-full bg-white hover:bg-gray-100 text-black font-bold py-4 rounded-xl transition-all duration-200 text-lg"
                        >
                            Start Splitting
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
