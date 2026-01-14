import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    onClose: (id: string) => void;
}

const toastIcons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
};

const toastStyles: Record<ToastType, string> = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
};

export const Toast: React.FC<ToastProps> = ({ id, type, title, message, onClose }) => {
    return (
        <div
            className={cn(
                'flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm animate-slide-in',
                toastStyles[type]
            )}
        >
            {toastIcons[type]}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white">{title}</p>
                {message && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{message}</p>
                )}
            </div>
            <button
                onClick={() => onClose(id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};

// Toast container
export const ToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
            {children}
        </div>
    );
};

// Toast hook and context
interface ToastContextValue {
    toasts: ToastProps[];
    addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = React.useState<ToastProps[]>([]);

    const addToast = React.useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
        const id = crypto.randomUUID();
        const duration = toast.duration ?? 5000;

        setToasts((prev) => [...prev, { ...toast, id, onClose: removeToast }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer>
                {toasts.map((toast) => (
                    <Toast key={toast.id} {...toast} onClose={removeToast} />
                ))}
            </ToastContainer>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
