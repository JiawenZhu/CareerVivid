import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
  title: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  message,
  title,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    // Autofocus cancel for safety
    if (cancelRef.current) cancelRef.current.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <X className="w-6 h-6 text-red-600 dark:text-red-400" />,
          btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          bgIcon: 'bg-red-100 dark:bg-red-900/30'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
          btn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
          bgIcon: 'bg-amber-100 dark:bg-amber-900/30'
        };
      default:
        return {
          icon: <X className="w-6 h-6 text-primary-600 dark:text-primary-400" />,
          btn: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
          bgIcon: 'bg-primary-100 dark:bg-primary-900/30'
        };
    }
  };

  const styles = getVariantStyles();

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm shadow-xl relative z-[10000]">
        <div className="absolute top-4 right-4">
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>
        <div className="flex gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${styles.bgIcon}`}>
            {styles.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              {message}
            </p>
            <div className="flex justify-end gap-3">
              {cancelText && (
                <button
                  ref={cancelRef}
                  onClick={onCancel}
                  className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={onConfirm}
                ref={!cancelText ? cancelRef : undefined}
                className={`px-4 py-2 text-white rounded-lg font-medium text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${styles.btn}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;