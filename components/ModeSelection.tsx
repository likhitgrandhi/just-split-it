import React, { useState } from 'react';
import { User, Users, Radio, ArrowLeft, Copy, Check } from 'lucide-react';

interface ModeSelectionProps {
    onManualSelect: () => void;
    onLiveSelect: (hostName: string) => Promise<void>;
    isCreating: boolean;
    pin: string | null;
    onProceed: () => void;
    onBack: () => void;
    users: any[];
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({
    onManualSelect,
    onLiveSelect,
    isCreating,
    pin,
    onProceed,
    onBack,
    users
}) => {
    const [mode, setMode] = useState<'selection' | 'live-setup'>('selection');
    const [hostName, setHostName] = useState('');
    const [copied, setCopied] = useState(false);

    const handleLiveClick = () => {
        setMode('live-setup');
    };

    const handleCreateSplit = async () => {
        if (!hostName.trim()) return;
        await onLiveSelect(hostName);
    };

    const handleCopyLink = async () => {
        if (!pin) return;
        const link = `${window.location.origin}?join=${pin}`;
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (mode === 'selection') {
        return (
            <div className="w-full h-full flex flex-col animate-fade-in relative">
                {/* Header / Back Button */}
                <div className="absolute top-0 left-0 z-10 p-2">
                    <button
                        onClick={onBack}
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

                <div className="flex-1 flex flex-col justify-center items-center mb-8">
                    <h2 className="text-4xl md:text-4xl font-black text-nike-forest uppercase tracking-tighter mb-2 text-center">
                        Split Mode
                    </h2>
                    <p className="text-nike-subtext font-medium text-center">How do you want to split?</p>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-4xl mx-auto">
                    {/* Manual Mode Tile */}
                    <button
                        onClick={onManualSelect}
                        className="group relative bg-white rounded-[2rem] p-8 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center border border-transparent hover:border-nike-forest/10 overflow-hidden"
                    >
                        <div className="mb-6 w-24 h-24 rounded-full bg-nike-forest/5 flex items-center justify-center group-hover:bg-nike-volt group-hover:text-nike-forest transition-colors duration-500 text-nike-forest">
                            <Users size={40} strokeWidth={2} />
                        </div>
                        <h3 className="text-2xl font-bold text-nike-forest mb-2">Manual Split</h3>
                        <p className="text-nike-subtext text-sm text-center leading-relaxed max-w-[200px]">
                            Add friends and assign items yourself
                        </p>
                    </button>

                    {/* Live Mode Tile */}
                    <button
                        onClick={handleLiveClick}
                        className="group relative bg-nike-forest rounded-[2rem] p-8 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center overflow-hidden"
                    >
                        <div className="absolute top-6 right-6">
                            <span className="bg-nike-volt text-nike-forest text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Recommended</span>
                        </div>

                        <div className="mb-6 w-24 h-24 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-nike-volt group-hover:text-nike-forest transition-colors duration-500 text-nike-volt">
                            <Radio size={40} strokeWidth={2} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Live Split</h3>
                        <p className="text-white/60 text-sm text-center leading-relaxed max-w-[200px]">
                            Get a PIN. Friends join and pick items in real-time
                        </p>
                    </button>
                </div>
            </div>
        );
    }

    // Live Setup Mode (Inline)
    return (
        <div className="w-full h-full flex flex-col items-center animate-fade-in relative">
            {/* Back Button - Moved to flow to prevent overlap */}
            <div className="w-full flex justify-start p-4 z-10">
                <button
                    onClick={() => setMode('selection')}
                    className="text-nike-subtext hover:text-nike-forest font-bold text-sm uppercase tracking-wider flex items-center gap-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full hover:bg-white/80 transition-all"
                >
                    <ArrowLeft size={16} /> Back
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center w-full p-4">
                {!pin ? (
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/20 relative overflow-hidden mb-20">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-nike-volt/20 rounded-full flex items-center justify-center mx-auto mb-6 text-nike-forest">
                                <Radio size={32} />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-nike-forest mb-2">Host Name</h2>
                            <p className="text-nike-subtext font-medium">What should we call you?</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={hostName}
                                onChange={(e) => setHostName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full bg-gray-50 border border-transparent focus:border-nike-volt rounded-xl p-4 text-center text-2xl font-bold text-nike-forest placeholder:text-nike-subtext/50 focus:outline-none transition-all"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateSplit()}
                            />

                            <button
                                onClick={handleCreateSplit}
                                disabled={!hostName.trim() || isCreating}
                                className="w-full bg-nike-volt hover:bg-nike-volt-hover disabled:opacity-50 disabled:cursor-not-allowed text-nike-forest font-black uppercase tracking-wider py-4 rounded-xl transition-all duration-200 text-lg shadow-lg"
                            >
                                {isCreating ? 'Creating...' : 'Create Room'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-md flex flex-col gap-4 mb-20">
                        {/* Tile 1: Room Ready & PIN */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-white/20 text-center relative overflow-hidden">
                            <div className="w-16 h-16 bg-nike-volt rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce text-nike-forest">
                                <Radio size={24} />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-nike-forest mb-1">Room Ready!</h2>
                            <p className="text-nike-subtext mb-6 font-medium text-sm">Share this PIN with friends</p>

                            <div className="bg-gray-50 rounded-2xl p-4 border border-black/5">
                                <div className="text-[10px] text-nike-subtext uppercase tracking-widest font-bold mb-1">Room PIN</div>
                                <div className="text-5xl font-black text-nike-forest tracking-[0.2em] font-mono leading-none">{pin}</div>
                            </div>
                        </div>

                        {/* Tile 2: Copy Link */}
                        <button
                            onClick={handleCopyLink}
                            className="w-full bg-nike-volt hover:bg-nike-volt-hover rounded-[1.5rem] p-6 shadow-lg transition-all duration-200 flex items-center justify-center gap-3 group"
                        >
                            <div className="bg-nike-forest/10 p-3 rounded-full group-hover:bg-nike-forest/20 transition-colors">
                                {copied ? <Check size={24} className="text-nike-forest" /> : <Copy size={24} className="text-nike-forest" />}
                            </div>
                            <div className="text-left">
                                <div className="text-nike-forest font-black uppercase tracking-wider text-lg leading-none">
                                    {copied ? 'Copied!' : 'Copy Link'}
                                </div>
                                <div className="text-nike-forest/60 text-xs font-bold uppercase tracking-widest">
                                    Share with friends
                                </div>
                            </div>
                        </button>

                        {/* Tile 3: Joined Members */}
                        <div className="bg-white rounded-[1.5rem] p-6 shadow-xl border border-white/20 text-center">
                            <div className="text-xs text-nike-subtext uppercase tracking-widest font-bold mb-4">Joined Members ({users.length})</div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {users.map((user) => (
                                    <div key={user.id} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                        <div className={`w-2 h-2 rounded-full ${user.color.replace('bg-', 'bg-') || 'bg-gray-400'}`} />
                                        <span className="text-sm font-bold text-nike-forest">{user.name}</span>
                                    </div>
                                ))}
                                {users.length === 0 && (
                                    <span className="text-sm text-nike-subtext italic py-2">Waiting for members...</span>
                                )}
                            </div>
                        </div>

                        {/* Start Button */}
                        <button
                            onClick={onProceed}
                            className="w-full bg-nike-forest text-white font-bold uppercase tracking-wider py-4 rounded-xl transition-all duration-200 hover:shadow-lg mt-2"
                        >
                            Start Splitting
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
