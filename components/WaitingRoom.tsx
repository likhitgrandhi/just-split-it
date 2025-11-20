import React, { useEffect } from 'react';
import { useSplit } from '../contexts/SplitContext';

export const WaitingRoom: React.FC = () => {
    const { splitStatus, reset } = useSplit();

    // Auto-redirect when status becomes active or ended
    useEffect(() => {
        if (splitStatus === 'ended') {
            // Room was ended/discarded by host, redirect to home
            console.log('🔴 WAITING ROOM: Room ended, redirecting to home');
            reset();
        }
    }, [splitStatus, reset]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center space-y-6">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <span className="text-4xl">⏳</span>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Waiting for Host</h2>
                    <p className="text-gray-500">
                        Please wait for the host to start the splitting session.
                    </p>
                </div>

                <div className="pt-4">
                    <div className="flex justify-center space-x-2">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
