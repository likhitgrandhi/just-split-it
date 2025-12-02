import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const styles = {
        success: 'bg-green-500/90 border-green-400',
        error: 'bg-red-500/90 border-red-400',
        info: 'bg-blue-500/90 border-blue-400',
    };

    const icons = {
        success: <CheckCircle2 size={20} />,
        error: <AlertCircle size={20} />,
        info: <AlertCircle size={20} />,
    };

    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 ${styles[type]} text-white px-4 py-3 rounded-xl border shadow-lg animate-fade-in max-w-sm`}>
            {icons[type]}
            <span className="flex-1 text-sm font-medium">{message}</span>
            <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition-colors">
                <X size={16} />
            </button>
        </div>
    );
};
