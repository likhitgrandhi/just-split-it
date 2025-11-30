import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'; 
import { ReceiptItem, User, AppStep } from '../types';
import { createSplit as apiCreateSplit, getSplitByPin, updateSplitData, subscribeToSplit } from '../services/supabase';

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
    createSplit: (overrideUsers?: User[], overrideItems?: ReceiptItem[]) => Promise<string>;
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
    leaveSplit: () => Promise<void>;
    isLiveMode: boolean;
    forceEndSplit: () => Promise<void>;
    splitItem: (itemId: string) => void;
    mergeItems: (splitGroupId: string) => void;
}

const SplitContext = createContext<SplitContextType | undefined>(undefined);

export const SplitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<ReceiptItem[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
    const [pin, setPin] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [splitStatus, setSplitStatus] = useState<'waiting' | 'active' | 'locked' | 'ended'>('waiting');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Ref to track if we're currently updating to prevent subscription loops
    const isUpdatingRef = useRef(false);
    const subscriptionRef = useRef<any>(null);
    // Ref to track current status for use in subscription callback (avoids stale closure)
    const splitStatusRef = useRef(splitStatus);
    
    // Keep the ref in sync with state
    useEffect(() => {
        splitStatusRef.current = splitStatus;
    }, [splitStatus]);
    
    // Subscribe to changes when PIN is set
    useEffect(() => {
        if (!pin) {
            // Clean up any existing subscription
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }
            return;
        }

        // Clean up previous subscription before creating new one
        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
        }

        subscriptionRef.current = subscribeToSplit(pin, (newData) => {
            // Skip updates if we're currently updating (prevents loops)
            if (isUpdatingRef.current) {
                return;
            }
            
            if (newData && newData.data) {
                // Always update items (simple replacement is fine for items)
                setItems(newData.data.items || []);

                // Update status if it changed
                if (newData.data.status) {
                    const newStatus = newData.data.status;
                    const previousStatus = splitStatusRef.current;
                    
                    setSplitStatus(newStatus);
                    
                    // If status changed to 'active' from 'waiting', ensure we're on SPLIT step
                    // This handles the case where a joining user is waiting and host starts
                    if (newStatus === 'active' && previousStatus === 'waiting') {
                        console.log('🚀 Room activated - transitioning to split view');
                        setStep(AppStep.SPLIT);
                    }
                    
                    // If split ended, clean up local storage
                    if (newStatus === 'ended') {
                        localStorage.removeItem(STORAGE_KEY);
                    }
                }

                // For users, we need to merge intelligently to avoid race conditions
                // We merge by ID: keep all users from the server, but preserve our currentUser if it exists
                setUsers(prevUsers => {
                    const serverUsers = newData.data.users || [];

                    // Create a map of server users by ID for quick lookup
                    const serverUserMap = new Map(serverUsers.map((u: User) => [u.id, u]));

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
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }
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

            if (urlJoinPin) {
                console.log('🔗 DEEP LINK: Found PIN in URL', urlJoinPin);
                setPendingJoinPin(urlJoinPin);
                // If we have a URL PIN, we might want to prioritize it over local storage
                // UNLESS the local storage matches the URL PIN (rejoining same split)
            }

            // 2. Check Local Storage
            const savedSession = localStorage.getItem(STORAGE_KEY);
            if (savedSession && !pin) {
                try {
                    const { pin: savedPin, userId, userName, isHost: savedIsHost, userColor } = JSON.parse(savedSession);

                    // If URL PIN exists and is different from Saved PIN, URL wins (User clicked a new link)
                    if (urlJoinPin && urlJoinPin !== savedPin) {
                        console.log('🔗 DEEP LINK: URL PIN differs from saved session. Ignoring saved session.');
                        // We don't restore, we let the UI handle the pendingJoinPin
                        setIsRestoring(false);
                        return;
                    }

                    if (savedPin && userId && userName) {
                        console.log('🔄 PERSISTENCE: Found saved session', { savedPin, userName, savedIsHost });

                        // Restore basic state immediately
                        setPin(savedPin);
                        setCurrentUser({ id: userId, name: userName, color: userColor || '#CBF300' });
                        setStep(AppStep.SPLIT);
                        
                        // Restore host status
                        if (savedIsHost) {
                            setIsHost(true);
                        }

                        // Re-fetch full data
                        try {
                            const response = await getSplitByPin(savedPin);
                            if (response && response.data) {
                                const data = response.data;
                                
                                // Check if split has ended
                                if (data.status === 'ended') {
                                    console.log('🔄 PERSISTENCE: Split has ended');
                                    localStorage.removeItem(STORAGE_KEY);
                                    setSplitStatus('ended');
                                    setIsRestoring(false);
                                    return;
                                }
                                
                                setItems(data.items || []);
                                setUsers(data.users || []);
                                if (data.status) setSplitStatus(data.status);

                                const me = data.users?.find((u: User) => u.id === userId);
                                if (me) {
                                    setCurrentUser(me);
                                    // Update localStorage with correct color
                                    localStorage.setItem(STORAGE_KEY, JSON.stringify({
                                        pin: savedPin,
                                        userId: me.id,
                                        userName: me.name,
                                        userColor: me.color,
                                        isHost: savedIsHost
                                    }));
                                }
                            } else {
                                console.warn('🔄 PERSISTENCE: Split not found, clearing session');
                                localStorage.removeItem(STORAGE_KEY);
                                reset();
                            }
                        } catch (err) {
                            console.error('🔄 PERSISTENCE: Failed to restore', err);
                            // Split might be deleted, clean up
                            localStorage.removeItem(STORAGE_KEY);
                            reset();
                        }
                    }
                } catch (e) {
                    console.error('🔄 PERSISTENCE: Failed to parse session', e);
                    localStorage.removeItem(STORAGE_KEY);
                }
            }

            setIsRestoring(false);
        };

        init();
    }, []);

    const createSplit = async (overrideUsers?: User[], overrideItems?: ReceiptItem[]) => {
        const hostId = crypto.randomUUID();
        
        // Use override values if provided (handles async state update race condition)
        const usersToSave = overrideUsers || users;
        const itemsToSave = overrideItems || items;
        
        // Generate unique PIN with collision check
        let newPin: string;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            newPin = Math.floor(1000 + Math.random() * 9000).toString();
            try {
                // Check if PIN already exists
                const existing = await getSplitByPin(newPin);
                if (!existing) {
                    break; // PIN is available
                }
                attempts++;
            } catch {
                // PIN doesn't exist (error thrown), we can use it
                break;
            }
        }
        
        if (attempts >= maxAttempts) {
            throw new Error('Unable to generate unique PIN. Please try again.');
        }

        try {
            await apiCreateSplit(newPin!, {
                items: itemsToSave,
                users: usersToSave,
                hostId,
                status: 'waiting'
            });
            setPin(newPin!);
            setIsHost(true);
            setSplitStatus('waiting');
            
            // Also update local state with the users we saved
            if (overrideUsers) {
                setUsers(overrideUsers);
            }
            if (overrideItems) {
                setItems(overrideItems);
            }

            // Update URL without reloading
            const url = new URL(window.location.href);
            url.searchParams.set('join', newPin!);
            window.history.pushState({}, '', url);

            // Save session - use the host user from the users array we saved
            const hostUser = usersToSave[0] || currentUser;
            if (hostUser) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    pin: newPin!,
                    userId: hostUser.id,
                    userName: hostUser.name,
                    userColor: hostUser.color,
                    isHost: true
                }));
                // Ensure currentUser is set
                setCurrentUser(hostUser);
            }

            return newPin!;
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            throw err;
        }
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
            const latestItems = latestSplit?.data?.items || [];

            let joinUser: User;
            let updatedUsers: User[];
            let updatedItems = latestItems;

            // If rejoining with existing userId, find and reuse that user
            if (existingUserId) {
                const existingUser = latestUsers.find((u: User) => u.id === existingUserId);
                if (existingUser) {
                    console.log('🔄 REJOIN: Reusing existing user', existingUser);
                    joinUser = existingUser;
                    updatedUsers = latestUsers; // No change to users list
                    setCurrentUser(joinUser);
                    setItems(latestItems);
                    setUsers(updatedUsers);
                    setPin(joinPin);
                    setStep(AppStep.SPLIT);
                    
                    // Update localStorage with current data
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({
                        pin: joinPin,
                        userId: joinUser.id,
                        userName: joinUser.name,
                        userColor: joinUser.color,
                        isHost: false
                    }));
                    return;
                }
            }

            // Check if a user with the same name already exists (duplicate prevention)
            const existingUserByName = latestUsers.find((u: User) => 
                u.name.toLowerCase().trim() === userName.toLowerCase().trim()
            );
            
            if (existingUserByName) {
                // User with same name exists - either it's a rejoin with lost session
                // or someone trying to join with duplicate name
                console.log('🔄 REJOIN: Found user with same name, reusing', existingUserByName);
                joinUser = existingUserByName;
                updatedUsers = latestUsers;
                
                // Don't create new user, just restore state
                setCurrentUser(joinUser);
                setItems(latestItems);
                setUsers(updatedUsers);
                setPin(joinPin);
                setStep(AppStep.SPLIT);
                
                // Save session with existing user data
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    pin: joinPin,
                    userId: joinUser.id,
                    userName: joinUser.name,
                    userColor: joinUser.color,
                    isHost: false
                }));
                return;
            }

            // Create new user (first time joining)
            // Generate a proper hex color
            const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
            const newUser: User = {
                id: crypto.randomUUID(),
                name: userName,
                color: randomColor
            };
            joinUser = newUser;
            setCurrentUser(newUser);

            updatedUsers = [...latestUsers, newUser];

            // Default Assignment: Assign new user to ALL items
            updatedItems = latestItems.map((item: ReceiptItem) => ({
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
                userColor: newUser.color,
                isHost: false
            }));

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
            isUpdatingRef.current = true;
            try {
                await updateSplitData(pin, {
                    items: newItems,
                    users,
                    hostId: '',
                    status: splitStatus
                });
            } catch (err) {
                console.error("Failed to sync", err);
            } finally {
                // Small delay before allowing subscription updates again
                setTimeout(() => {
                    isUpdatingRef.current = false;
                }, 100);
            }
        }
    };

    // Split an item with quantity > 1 into two separate items
    const splitItem = async (itemId: string) => {
        const item = items.find(i => i.id === itemId);
        if (!item || item.quantity <= 1) return;

        const unitPrice = item.price / item.quantity;
        const groupId = item.splitGroupId || item.id; // Use existing group or create new one based on original item ID

        // Create new item with quantity 1
        const newItem: ReceiptItem = {
            id: crypto.randomUUID(),
            name: item.name,
            price: unitPrice,
            quantity: 1,
            assignedTo: [...item.assignedTo], // Copy assignments
            splitGroupId: groupId
        };

        // Update original item (reduce quantity and price)
        const newItems = items.map(i => {
            if (i.id === itemId) {
                return {
                    ...i,
                    quantity: i.quantity - 1,
                    price: i.price - unitPrice,
                    splitGroupId: groupId
                };
            }
            return i;
        });

        // Insert new item right after the original
        const originalIndex = newItems.findIndex(i => i.id === itemId);
        newItems.splice(originalIndex + 1, 0, newItem);

        setItems(newItems);

        // Sync to server if in live mode
        if (pin) {
            isUpdatingRef.current = true;
            try {
                await updateSplitData(pin, {
                    items: newItems,
                    users,
                    hostId: '',
                    status: splitStatus
                });
            } catch (err) {
                console.error("Failed to sync split", err);
            } finally {
                setTimeout(() => {
                    isUpdatingRef.current = false;
                }, 100);
            }
        }
    };

    // Merge all items with the same splitGroupId back into one
    const mergeItems = async (splitGroupId: string) => {
        const itemsToMerge = items.filter(i => i.splitGroupId === splitGroupId);
        if (itemsToMerge.length <= 1) return;

        // Calculate merged values
        const totalQuantity = itemsToMerge.reduce((sum, i) => sum + i.quantity, 0);
        const totalPrice = itemsToMerge.reduce((sum, i) => sum + i.price, 0);
        
        // Merge all assignedTo arrays and deduplicate
        const allAssigned = [...new Set(itemsToMerge.flatMap(i => i.assignedTo))];

        // Keep the first item and update it with merged values
        const firstItem = itemsToMerge[0];
        const otherItemIds = itemsToMerge.slice(1).map(i => i.id);

        const newItems = items
            .filter(i => !otherItemIds.includes(i.id)) // Remove other items
            .map(i => {
                if (i.id === firstItem.id) {
                    return {
                        ...i,
                        quantity: totalQuantity,
                        price: totalPrice,
                        assignedTo: allAssigned,
                        splitGroupId: undefined // Remove split group since it's merged
                    };
                }
                return i;
            });

        setItems(newItems);

        // Sync to server if in live mode
        if (pin) {
            isUpdatingRef.current = true;
            try {
                await updateSplitData(pin, {
                    items: newItems,
                    users,
                    hostId: '',
                    status: splitStatus
                });
            } catch (err) {
                console.error("Failed to sync merge", err);
            } finally {
                setTimeout(() => {
                    isUpdatingRef.current = false;
                }, 100);
            }
        }
    };

    const toggleLock = async () => {
        if (!pin) return;
        isUpdatingRef.current = true;
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
        } finally {
            setTimeout(() => {
                isUpdatingRef.current = false;
            }, 100);
        }
    };

    const endSplit = async () => {
        if (!pin) return;
        isUpdatingRef.current = true;
        try {
            await updateSplitData(pin, {
                items,
                users,
                hostId: '',
                status: 'ended'
            });
            setSplitStatus('ended');
            localStorage.removeItem(STORAGE_KEY);
            
            // Clean up URL params
            const url = new URL(window.location.href);
            url.searchParams.delete('join');
            window.history.replaceState({}, '', url.toString());
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            isUpdatingRef.current = false;
        }
    };
    
    // Force end split - can be used by non-hosts when host abandons session
    const forceEndSplit = async () => {
        if (!pin) return;
        isUpdatingRef.current = true;
        try {
            await updateSplitData(pin, {
                items,
                users,
                hostId: '',
                status: 'ended'
            });
            setSplitStatus('ended');
            localStorage.removeItem(STORAGE_KEY);
            
            // Clean up URL params
            const url = new URL(window.location.href);
            url.searchParams.delete('join');
            window.history.replaceState({}, '', url.toString());
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            isUpdatingRef.current = false;
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
        
        // Clean up URL params
        const url = new URL(window.location.href);
        url.searchParams.delete('join');
        window.history.replaceState({}, '', url.toString());
    };
    
    const leaveSplit = async () => {
        if (!pin || !currentUser) {
            reset();
            return;
        }
        
        isUpdatingRef.current = true;
        try {
            // Remove current user from the split
            const latestSplit = await getSplitByPin(pin);
            if (latestSplit && latestSplit.data) {
                const updatedUsers = latestSplit.data.users.filter((u: User) => u.id !== currentUser.id);
                
                // Remove user assignments from items
                const updatedItems = latestSplit.data.items.map((item: ReceiptItem) => ({
                    ...item,
                    assignedTo: item.assignedTo.filter((id: string) => id !== currentUser.id)
                }));
                
                await updateSplitData(pin, {
                    items: updatedItems,
                    users: updatedUsers,
                    hostId: latestSplit.data.hostId,
                    status: latestSplit.data.status
                });
            }
        } catch (err) {
            console.error('Failed to leave split cleanly', err);
        } finally {
            isUpdatingRef.current = false;
        }
        
        // Reset local state regardless of server update success
        reset();
    };
    
    // Determine if we're in live mode (has PIN) vs manual mode
    const isLiveMode = pin !== null;

    const startManualSplit = () => {
        setSplitStatus('active');
        setIsHost(true); // Treat manual user as host so they don't see waiting room
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
            leaveSplit,
            isLiveMode,
            forceEndSplit,
            splitItem,
            mergeItems
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
