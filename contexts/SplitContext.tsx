import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ReceiptItem, User, AppStep } from '../types';
import { createSplit as apiCreateSplit, getSplitByPin, updateSplitData, subscribeToSplit, deleteSplit } from '../services/supabase';

interface SplitContextType {
    items: ReceiptItem[];
    setItems: React.Dispatch<React.SetStateAction<ReceiptItem[]>>;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    step: AppStep;
    setStep: (step: AppStep) => void;
    pin: string | null;
    isHost: boolean;
    splitStatus: 'waiting' | 'active' | 'locked' | 'ended';
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    createSplit: () => Promise<string>;
    startRoom: () => Promise<void>;
    joinSplit: (pin: string, userName: string) => Promise<void>;
    updateItemAssignment: (itemId: string, userId: string, action: 'add' | 'remove') => void;
    reset: () => void;
    error: string | null;
    isRestoring: boolean;
    pendingJoinPin: string | null;
    clearPendingJoinPin: () => void;
    toggleLock: () => Promise<void>;
    endSplit: () => Promise<void>;
    startManualSplit: () => void;
    discardUnstartedRoom: () => Promise<void>;
}

const SplitContext = createContext<SplitContextType | undefined>(undefined);

export const SplitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<ReceiptItem[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
    const [pin, setPin] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [splitStatus, setSplitStatus] = useState<'waiting' | 'active'>('waiting');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Subscribe to changes when PIN is set
    useEffect(() => {
        if (!pin) return;

        const subscription = subscribeToSplit(pin, (newData) => {
            if (newData && newData.data) {
                // Always update items (simple replacement is fine for items)
                setItems(newData.data.items || []);

                // Update status if it changed
                if (newData.data.status) {
                    setSplitStatus(newData.data.status);
                }

                // For users, we need to merge intelligently to avoid race conditions
                // We merge by ID: keep all users from the server, but preserve our currentUser if it exists
                setUsers(prevUsers => {
                    const serverUsers = newData.data.users || [];

                    // Create a map of server users by ID for quick lookup
                    const serverUserMap = new Map(serverUsers.map(u => [u.id, u]));

                    // Start with all server users
                    const mergedUsers = [...serverUsers];

                    // If we have local users that aren't on the server yet, keep them
                    // (This handles the brief moment between local update and server confirmation)
                    prevUsers.forEach(localUser => {
                        if (!serverUserMap.has(localUser.id)) {
                            mergedUsers.push(localUser);
                        }
                    });

                    return mergedUsers;
                });
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [pin]);

    // Sync changes to Supabase when items or users change (if host or participant)
    // We need to debounce this or control it to avoid loops.
    // Actually, better to have explicit "save" or update methods.
    // But for real-time feel, we want it automatic.
    // The subscription updates state -> triggers effect -> updates Supabase -> triggers subscription... LOOP.
    // Solution: Only update Supabase if the change originated locally.
    // For now, let's make `updateItemAssignment` responsible for pushing changes.

    const [isRestoring, setIsRestoring] = useState(true);
    const [pendingJoinPin, setPendingJoinPin] = useState<string | null>(null);

    // Persistence Keys
    const STORAGE_KEY = 'just_split_it_session';

    // Load session on mount & Check URL
    useEffect(() => {
        const init = async () => {
            setIsRestoring(true);
            // 1. Check URL for join param
            const params = new URLSearchParams(window.location.search);
            const urlJoinPin = params.get('join');

            // 2. Check Local Storage
            const savedSession = localStorage.getItem(STORAGE_KEY);
            let savedData = null;
            if (savedSession) {
                try {
                    savedData = JSON.parse(savedSession);
                } catch (e) {
                    console.error('Failed to parse session', e);
                    localStorage.removeItem(STORAGE_KEY);
                }
            }

            if (urlJoinPin) {
                console.log('🔗 DEEP LINK: Found PIN in URL', urlJoinPin);

                // Check if this matches our saved session
                let matchesSaved = false;
                if (savedData && savedData.pin === urlJoinPin) {
                    matchesSaved = true;
                }

                if (!matchesSaved) {
                    // Only set pending if URL PIN is NEW (doesn't match saved session)
                    setPendingJoinPin(urlJoinPin);
                    // If URL PIN differs from Saved PIN, URL wins (User clicked a new link)
                    if (savedData) {
                        console.log('🔗 DEEP LINK: URL PIN differs from saved session. Ignoring saved session.');
                        setIsRestoring(false);
                        return;
                    }
                } else {
                    console.log('🔗 DEEP LINK: Matches saved session, resuming auto-login');
                    // Don't set pendingJoinPin - we're auto-restoring
                }
            }

            if (savedData && !pin) {
                const { pin: savedPin, userId, userName, isHost: savedIsHost } = savedData;
                console.log('🔍 DEBUG: Checking restoration conditions', {
                    hasSavedData: !!savedData,
                    currentPin: pin,
                    savedPin,
                    userId,
                    userName,
                    urlJoinPin,
                    pinsMatch: savedPin === urlJoinPin
                });

                // ONLY restore if the URL PIN matches the saved PIN.
                // If the user is at the base URL, we do NOT auto-restore.
                if (savedPin && userId && userName && savedPin === urlJoinPin) {
                    console.log('🔄 PERSISTENCE: Found saved session matching URL PIN', { savedPin, userName, savedIsHost });

                    // Restore basic state immediately
                    setPin(savedPin);
                    setCurrentUser({ id: userId, name: userName, color: '#CBF300' });
                    if (savedIsHost) setIsHost(true);
                    setStep(AppStep.SPLIT);

                    // Re-fetch full data
                    try {
                        const response = await getSplitByPin(savedPin);
                        if (response && response.data) {
                            const data = response.data;
                            setItems(data.items || []);
                            setUsers(data.users || []);
                            if (data.status) setSplitStatus(data.status);

                            const me = data.users?.find((u: User) => u.id === userId);
                            if (me) setCurrentUser(me);
                        } else {
                            console.warn('🔄 PERSISTENCE: Split not found, clearing session');
                            localStorage.removeItem(STORAGE_KEY);
                            reset();
                        }
                    } catch (err) {
                        console.error('🔄 PERSISTENCE: Failed to restore', err);
                    }
                } else {
                    console.log('❌ PERSISTENCE: Restoration conditions not met');
                }
            } else {
                console.log('⏭️ PERSISTENCE: Skipping restoration', { hasSavedData: !!savedData, currentPin: pin });
            }

            setIsRestoring(false);
        };

        init();
    }, []);

    const createSplit = async () => {
        let retries = 3;
        while (retries > 0) {
            const newPin = Math.floor(1000 + Math.random() * 9000).toString();
            const hostId = crypto.randomUUID();

            try {
                await apiCreateSplit(newPin, {
                    items,
                    users,
                    hostId,
                    status: 'waiting'
                });
                setPin(newPin);
                setIsHost(true);
                setSplitStatus('waiting');

                // Update URL without reloading
                const url = new URL(window.location.href);
                url.searchParams.set('join', newPin);
                window.history.pushState({}, '', url);

                if (currentUser) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({
                        pin: newPin,
                        userId: currentUser.id,
                        userName: currentUser.name,
                        isHost: true
                    }));
                }

                return newPin;
            } catch (err: any) {
                console.error('Failed to create split, retrying...', err);
                retries--;
                if (retries === 0) {
                    setError('Failed to create room. Please try again.');
                    throw err;
                }
            }
        }
        throw new Error("Failed to create split");
    };

    const startRoom = async () => {
        if (!pin) return;
        try {
            await updateSplitData(pin, {
                items,
                users,
                hostId: '',
                status: 'active'
            });
            setSplitStatus('active');
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            throw err;
        }
    };

    const joinSplit = async (joinPin: string, userName: string) => {
        setError(null);
        try {
            console.log('🔵 JOIN: Starting join process for', userName);
            const split = await getSplitByPin(joinPin);
            if (!split) throw new Error('Split not found');

            const data = split.data;
            // Set initial status from server
            if (data.status) {
                setSplitStatus(data.status);
                if (data.status === 'ended') {
                    throw new Error('This split has ended.');
                }
            }

            // Check if we are rejoining (already in local storage?)
            const savedSession = localStorage.getItem(STORAGE_KEY);
            let existingUserId: string | null = null;
            let isRejoining = false;

            if (savedSession) {
                try {
                    const { pin: savedPin, userId } = JSON.parse(savedSession);
                    if (savedPin === joinPin && userId) {
                        isRejoining = true;
                        existingUserId = userId;
                        console.log('🔄 REJOIN: Found existing session for this split', { userId });
                    }
                } catch (e) { }
            }

            if (data.status === 'locked' && !isRejoining) {
                throw new Error('This room is locked by the host.');
            }

            setIsHost(false);

            const latestSplit = await getSplitByPin(joinPin);
            const latestUsers = latestSplit?.data?.users || [];

            let currentUser: User;
            let updatedUsers: User[];

            // If rejoining with existing userId, find and reuse that user
            if (existingUserId) {
                const existingUser = latestUsers.find((u: User) => u.id === existingUserId);
                if (existingUser) {
                    console.log('🔄 REJOIN: Reusing existing user', existingUser);
                    currentUser = existingUser;
                    updatedUsers = latestUsers; // No change to users list
                    setCurrentUser(currentUser);
                    setItems(data.items || []);
                    setUsers(updatedUsers);
                    setPin(joinPin);
                    setStep(AppStep.SPLIT);

                    // Update URL even when rejoining
                    const url = new URL(window.location.href);
                    url.searchParams.set('join', joinPin);
                    window.history.pushState({}, '', url);

                    // Don't update Supabase, just restore local state
                    return;
                }
            }

            // Create new user (first time joining or session lost)
            const newUser: User = {
                id: crypto.randomUUID(),
                name: userName,
                color: '#' + Math.floor(Math.random() * 16777215).toString(16)
            };
            currentUser = newUser;
            setCurrentUser(newUser);

            updatedUsers = [...latestUsers, newUser];

            // Default Assignment: Assign new user to ALL items
            const updatedItems = data.items.map((item: ReceiptItem) => ({
                ...item,
                assignedTo: [...(item.assignedTo || []), newUser.id]
            }));

            setItems(updatedItems);
            setUsers(updatedUsers);

            await updateSplitData(joinPin, {
                items: updatedItems,
                users: updatedUsers,
                hostId: data.hostId,
                status: data.status || 'waiting'
            });

            setPin(joinPin);
            setStep(AppStep.SPLIT);

            // Save session
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                pin: joinPin,
                userId: newUser.id,
                userName: newUser.name,
                isHost: false
            }));

            // Update URL without reloading so refresh works
            const url = new URL(window.location.href);
            url.searchParams.set('join', joinPin);
            window.history.pushState({}, '', url);

        } catch (err: any) {
            console.error(err);
            setError(err.message);
            throw err;
        }
    };

    const updateItemAssignment = async (itemId: string, userId: string, action: 'add' | 'remove') => {
        const newItems = items.map(item => {
            if (item.id === itemId) {
                const currentAssigned = item.assignedTo || [];
                let newAssigned;
                if (action === 'add') {
                    if (!currentAssigned.includes(userId)) newAssigned = [...currentAssigned, userId];
                    else newAssigned = currentAssigned;
                } else {
                    newAssigned = currentAssigned.filter(id => id !== userId);
                }
                return { ...item, assignedTo: newAssigned };
            }
            return item;
        });

        setItems(newItems);

        if (pin) {
            try {
                await updateSplitData(pin, {
                    items: newItems,
                    users,
                    hostId: '',
                    status: splitStatus
                });
            } catch (err) {
                console.error("Failed to sync", err);
            }
        }
    };

    const toggleLock = async () => {
        if (!pin) return;
        try {
            const newStatus = splitStatus === 'locked' ? 'active' : 'locked';
            await updateSplitData(pin, {
                items,
                users,
                hostId: '',
                status: newStatus
            });
            setSplitStatus(newStatus);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        }
    };

    const endSplit = async () => {
        if (!pin) return;
        try {
            await updateSplitData(pin, {
                items,
                users,
                hostId: '',
                status: 'ended'
            });
            setSplitStatus('ended');
            localStorage.removeItem(STORAGE_KEY);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        }
    };

    const reset = () => {
        setItems([]);
        setUsers([]);
        setStep(AppStep.UPLOAD);
        setPin(null);
        setIsHost(false);
        setSplitStatus('waiting');
        setCurrentUser(null);
        setError(null);
        localStorage.removeItem(STORAGE_KEY);

        // Clear URL params
        const url = new URL(window.location.href);
        url.searchParams.delete('join');
        window.history.replaceState({}, '', url.toString());
    };

    const startManualSplit = () => {
        setSplitStatus('active');
        setIsHost(true); // Treat manual user as host so they don't see waiting room
    };

    const discardUnstartedRoom = async () => {
        // Only discard if we have a PIN and the room is still in 'waiting' status
        if (pin && splitStatus === 'waiting' && isHost) {
            try {
                console.log('🗑️ DISCARD: Marking unstarted room as ended', pin);
                // Mark as 'ended' instead of deleting so participants get notified
                await updateSplitData(pin, {
                    items,
                    users,
                    hostId: '',
                    status: 'ended'
                });
                setSplitStatus('ended');
                // Wait a moment for the status update to propagate to participants
                await new Promise(resolve => setTimeout(resolve, 500));
                reset();
            } catch (err) {
                console.error('Failed to discard room', err);
                // Still reset locally even if update fails
                reset();
            }
        } else {
            // Not a waiting room, just reset normally
            reset();
        }
    };

    const clearPendingJoinPin = () => {
        setPendingJoinPin(null);
    };

    return (
        <SplitContext.Provider value={{
            items, setItems,
            users, setUsers,
            step, setStep,
            pin, isHost,
            splitStatus,
            currentUser, setCurrentUser,
            createSplit, startRoom, joinSplit,
            updateItemAssignment,
            reset,
            error,
            isRestoring,
            pendingJoinPin,
            toggleLock,
            endSplit,
            startManualSplit,
            clearPendingJoinPin,
            discardUnstartedRoom
        }}>
            {children}
        </SplitContext.Provider>
    );
};

export const useSplit = () => {
    const context = useContext(SplitContext);
    if (context === undefined) {
        throw new Error('useSplit must be used within a SplitProvider');
    }
    return context;
};
