import { supabase } from '../config/supabase';
import { ReceiptItem, User } from '../types';

export interface SplitData {
    items: ReceiptItem[];
    users: User[];
    hostId: string;
    status: 'waiting' | 'active' | 'locked' | 'ended';
}

export const createSplit = async (pin: string, data: SplitData) => {
    const { data: split, error } = await supabase
        .from('splits')
        .insert([{ pin, data: { ...data, status: 'waiting' } }])
        .select()
        .single();

    if (error) throw error;
    return split;
};

export const getSplitByPin = async (pin: string) => {
    const { data, error } = await supabase
        .from('splits')
        .select('*')
        .eq('pin', pin)
        .single();

    if (error) throw error;
    return data;
};

export const updateSplitData = async (pin: string, data: SplitData) => {
    const { error } = await supabase
        .from('splits')
        .update({ data })
        .eq('pin', pin);

    if (error) throw error;
};

export const subscribeToSplit = (pin: string, callback: (payload: any) => void) => {
    console.log(`Subscribing to split-${pin}`);
    return supabase
        .channel(`split-${pin}`)
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'splits', filter: `pin=eq.${pin}` },
            (payload) => {
                console.log('Received update:', payload);
                callback(payload.new);
            }
        )
        .subscribe((status) => {
            console.log(`Subscription status for ${pin}:`, status);
        });
};
