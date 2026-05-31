import React from 'react';
import { X, Sparkles, Check, Download, CreditCard } from 'lucide-react';
import { navigate } from '../utils/navigation';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    feature?: string;
    downloadCredits?: number;
    isBuyingOneTime?: boolean;
    onBuyOneTime?: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
    isOpen,
    onClose,
    feature = 'PDF Export',
    downloadCredits = 0,
    isBuyingOneTime = false,
    onBuyOneTime,
}) => {
    if (!isOpen) return null;

    const handleUpgrade = () => {
        navigate('/subscription');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-up">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-primary-600 to-primary-500 p-6 text-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{feature} is Premium</h2>
                            <p className="text-white/90 text-sm mt-1">Upgrade or buy a single PDF export credit</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="space-y-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Export high-quality PDFs</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Professional resumes ready for any application</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Unlimited resume and PDF downloads</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Create multiple versions for different jobs</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">AI photo editing included</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Professional headshots with AI enhancement</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm dark:bg-gray-900 dark:text-amber-300">
                                    <Download className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-950 dark:text-white">Need just one PDF?</p>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                        Buy 1 PDF download credit. No subscription.
                                    </p>
                                    {downloadCredits > 0 && (
                                        <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                            You already have {downloadCredits} PDF credit{downloadCredits === 1 ? '' : 's'}.
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-gray-950 dark:text-white">$2.99</span>
                                    <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">one-time</span>
                                </div>
                                <button
                                    onClick={onBuyOneTime}
                                    disabled={!onBuyOneTime || isBuyingOneTime}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100"
                                >
                                    <CreditCard className="h-4 w-4" />
                                    {isBuyingOneTime ? 'Opening...' : 'Buy 1 PDF'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <div>
                                <span className="font-semibold text-gray-900 dark:text-white">Want ongoing access?</span>
                                <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">Pro includes 1,000 AI credits / month.</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">$9</span>
                                <span className="text-gray-600 dark:text-gray-400 text-sm ml-1">/mo</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            Maybe Later
                        </button>
                        <button
                            onClick={handleUpgrade}
                            className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30"
                        >
                            View Plans
                        </button>
                    </div>

                    <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                        Free users can export as images instead
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
