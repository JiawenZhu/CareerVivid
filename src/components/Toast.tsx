import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ToastProps {
    message: string;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 4000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-2xl border border-gray-700 p-4 pr-12 min-w-[300px] max-w-md">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                        <CheckCircle className="text-green-400" size={20} />
                    </div>
                    <p className="text-sm font-medium">{message}</p>
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                        aria-label="Close notification"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Toast;
