import React from 'react';
import { CheckCircle2, ExternalLink, Globe, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ExportSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    docUrl: string;
}

const ExportSuccessModal: React.FC<ExportSuccessModalProps> = ({ isOpen, onClose, docUrl }) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
                onClick={onClose}
            ></div>
            
            {/* Modal Content */}
            <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in border border-primary-100 dark:border-primary-900/30">
                {/* Header Decoration */}
                <div className="h-2 bg-gradient-to-r from-primary-500 via-purple-500 to-primary-500"></div>
                
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-6 animate-bounce-slow">
                        <CheckCircle2 size={48} className="stroke-[1.5]" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {t('export.success_title', 'Resume Exported!')}
                    </h2>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                        {t('export.success_message', 'Your resume has been successfully saved to your Google Drive. You can now view and edit it as a Google Doc.')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <a 
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-primary-500/25 active:scale-95"
                        >
                            <Globe size={18} />
                            <span>{t('export.open_doc', 'Open Google Doc')}</span>
                            <ExternalLink size={14} className="opacity-70" />
                        </a>
                        
                        <button 
                            onClick={onClose}
                            className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-3 px-6 rounded-xl transition-colors active:scale-95"
                        >
                            {t('common.close', 'Done')}
                        </button>
                    </div>
                </div>

                {/* Footer Tip */}
                <div className="bg-gray-50 dark:bg-gray-800/50 px-8 py-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                        <span className="font-semibold text-primary-500">Tip:</span> Your Google Doc is fully editable and keeps all your resume sections intact.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExportSuccessModal;
