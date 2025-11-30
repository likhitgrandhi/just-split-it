import React, { useEffect } from 'react';
import { useSplit } from '../contexts/SplitContext';
import { LogOut, Users, AlertTriangle } from 'lucide-react';
import { AppStep } from '../types';

export const WaitingRoom: React.FC = () => {
    const { splitStatus, leaveSplit, forceEndSplit, users, currentUser, pin, setStep } = useSplit();

    // Actively redirect when status becomes active - ensures transition happens
    useEffect(() => {
        if (splitStatus === 'active') {
            console.log('🚀 WaitingRoom: Status is active, ensuring split view');
            // Force navigation to split view - this ensures the parent re-renders correctly
            setStep(AppStep.SPLIT);
        }
    }, [splitStatus, setStep]);

    const handleLeave = () => {
        if (confirm('Are you sure you want to leave this split?')) {
            leaveSplit();
        }
    };
    
    const handleForceEnd = () => {
        if (confirm('End this split for everyone? Use this if the host has left and is not coming back. This cannot be undone.')) {
            forceEndSplit();
        }
    };

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
            {/* Content */}
            <div className="flex-1 flex flex-col p-6 pt-12 md:pt-6 md:items-center md:justify-center">
                <div className="flex-1 flex flex-col md:flex-none md:bg-gray-50 md:rounded-[2.5rem] md:p-10 md:w-full md:max-w-md">
                    {/* Logo */}
                    <div className="text-center mb-6 md:hidden">
                        <h1 className="text-3xl font-black tracking-tighter text-cloud-logo lowercase select-none relative inline-block drop-shadow-md">
                            <span className="absolute inset-0 text-stroke-4 text-white z-0" aria-hidden="true">splitto</span>
                            <span className="relative z-10">splitto</span>
                        </h1>
                    </div>

                    {/* Waiting Icon */}
                    <div className="text-center mb-6">
                        <div className="w-24 h-24 md:w-20 md:h-20 bg-pastel-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-5xl md:text-4xl">⏳</span>
                        </div>
                        <h2 className="text-2xl font-bold text-cloud-text mb-2">Waiting for Host</h2>
                        <p className="text-cloud-subtext text-sm">
                            The host will start the session soon
                        </p>
                    </div>

                    {/* Show PIN */}
                    {pin && (
                        <div className="bg-pastel-blue rounded-2xl p-5 mb-4">
                            <div className="text-xs text-cloud-subtext uppercase tracking-widest font-bold mb-2 text-center">Room PIN</div>
                            <div className="text-4xl font-black text-cloud-text tracking-[0.15em] font-mono text-center">{pin}</div>
                        </div>
                    )}

                    {/* Show who's in the room */}
                    {users.length > 0 && (
                        <div className="bg-gray-50 md:bg-white rounded-2xl p-4 mb-4">
                            <div className="flex items-center justify-center gap-2 text-xs text-cloud-subtext uppercase tracking-widest font-bold mb-3">
                                <Users size={14} />
                                <span>In Room ({users.length})</span>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                {users.map(user => (
                                    <div
                                        key={user.id}
                                        className={`px-3 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${
                                            user.id === currentUser?.id
                                                ? 'bg-black text-white'
                                                : 'bg-white md:bg-gray-50 border border-gray-100 text-cloud-text'
                                        }`}
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: user.color }}
                                        />
                                        {user.name}
                                        {user.id === currentUser?.id && <span className="text-[10px] opacity-70">(You)</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading dots */}
                    <div className="flex justify-center space-x-2 my-6">
                        <div className="w-2.5 h-2.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>

                    <div className="flex-1 md:flex-none" />

                    {/* Actions */}
                    <div className="space-y-3 pt-4">
                        <button
                            onClick={handleLeave}
                            className="w-full py-4 rounded-2xl font-bold text-cloud-subtext active:text-cloud-text active:bg-gray-100 transition-all flex items-center justify-center gap-2"
                        >
                            <LogOut size={18} />
                            Leave Split
                        </button>
                        
                        <button
                            onClick={handleForceEnd}
                            className="w-full py-3 rounded-2xl font-medium text-orange-500 active:text-orange-700 active:bg-orange-50 transition-all flex items-center justify-center gap-2 text-sm"
                            title="End this split if the host has abandoned it"
                        >
                            <AlertTriangle size={16} />
                            Host not coming? End Split
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
