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
    const [isExiting, setIsExiting] = React.useState(false);

    const handleClose = React.useCallback(() => {
        setIsExiting(true);
        setTimeout(onClose, 500); // Wait for animation to finish
    }, [onClose]);

    useEffect(() => {
        const timer = setTimeout(handleClose, duration);
        return () => clearTimeout(timer);
    }, [duration, handleClose]);

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
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 ${styles[type]} text-white px-6 py-4 rounded-2xl border shadow-2xl max-w-sm w-full mx-4 md:w-auto md:min-w-[300px] ${isExiting ? 'animate-slide-down' : 'animate-slide-up'}`}>
            {icons[type]}
            <span className="flex-1 text-base font-medium">{message}</span>
            <button onClick={handleClose} className="hover:bg-white/20 rounded-full p-1 transition-colors">
                <X size={18} />
            </button>
        </div>
    );
};
