import { supabase } from '../config/supabase';

export const createOrUpdateUser = async (userId: string, email: string) => {
    const { error } = await supabase
        .from('app_users')
        .upsert({
            id: userId,
            email: email,
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'id'
        });

    if (error) {
        console.error('Error creating/updating user:', error);
        throw error;
    }
};

