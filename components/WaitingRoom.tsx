import React, { useEffect } from 'react';
import { useSplit } from '../contexts/SplitContext';
import { LogOut, Users, AlertTriangle } from 'lucide-react';

export const WaitingRoom: React.FC = () => {
    const { splitStatus, leaveSplit, forceEndSplit, users, currentUser, pin } = useSplit();

    // Auto-redirect when status becomes active
    useEffect(() => {
        if (splitStatus === 'active') {
            // The parent component (App.tsx) will handle the rendering switch
            // based on the status, but we can also force a re-render or check here
        }
    }, [splitStatus]);

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
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white rounded-[2.5rem] shadow-xl p-8 w-full max-w-md text-center space-y-6">
                <div className="w-20 h-20 bg-cloud-light rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <span className="text-4xl">⏳</span>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Waiting for Host</h2>
                    <p className="text-gray-500">
                        Please wait for the host to start the splitting session.
                    </p>
                </div>

                {/* Show PIN */}
                {pin && (
                    <div className="bg-gray-50 rounded-2xl p-4">
                        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Room PIN</div>
                        <div className="text-3xl font-bold text-gray-900 tracking-[0.1em] font-mono">{pin}</div>
                    </div>
                )}

                {/* Show who's in the room */}
                {users.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 uppercase tracking-widest font-bold mb-3">
                            <Users size={14} />
                            <span>People in Room ({users.length})</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {users.map(user => (
                                <div
                                    key={user.id}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${
                                        user.id === currentUser?.id
                                            ? 'bg-black text-white'
                                            : 'bg-white border border-gray-200 text-gray-700'
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

                <div className="pt-4">
                    <div className="flex justify-center space-x-2 mb-6">
                        <div className="w-2 h-2 bg-cloud-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-cloud-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-cloud-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>

                    <div className="space-y-3">
                        {/* Leave button */}
                        <button
                            onClick={handleLeave}
                            className="w-full py-4 rounded-2xl font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                        >
                            <LogOut size={18} />
                            Leave Split
                        </button>
                        
                        {/* Force End - for abandoned sessions */}
                        <button
                            onClick={handleForceEnd}
                            className="w-full py-3 rounded-2xl font-medium text-orange-500 hover:text-orange-700 hover:bg-orange-50 transition-all flex items-center justify-center gap-2 text-sm"
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
