import React from 'react';
import { Gift, AlertCircle, Percent, ArrowRight } from 'lucide-react';

interface RetentionModalProps {
    isOpen: boolean;
    step: 'offer_10' | 'offer_20';
    onAccept: () => void;
    onDecline: () => void;
    isLoading?: boolean;
}

const RetentionModal: React.FC<RetentionModalProps> = ({ isOpen, step, onAccept, onDecline, isLoading = false }) => {
    if (!isOpen) return null;

    const isStep10 = step === 'offer_10';

    // Content Configuration
    const content = isStep10 ? {
        title: "Wait! Before you go...",
        subtitle: "We'd love to keep you as a Pro member.",
        offerTitle: "Get 10% OFF for 3 Months",
        offerDescription: "Stay with us and we'll lower your bill. Keep access to unlimited AI credits and resume templates.",
        newPrice: "$13.41",
        oldPrice: "$14.90",
        saveBadge: "Save $4.50 total",
        acceptBtn: "Claim 10% Discount",
        declineBtn: "No thanks, I still want to cancel",
        icon: <Percent className="w-8 h-8 text-primary-600" />,
        bg: "bg-primary-50 dark:bg-primary-900/20"
    } : {
        title: "Last Chance Offer",
        subtitle: "We really don't want to see you go.",
        offerTitle: "Get 20% OFF for 3 Months",
        offerDescription: "This is our best offer. Don't lose your locked-in rate and data.",
        newPrice: "$11.92",
        oldPrice: "$14.90",
        saveBadge: "Save $9.00 total",
        acceptBtn: "Claim 20% Discount",
        declineBtn: "I understand, cancel my subscription",
        icon: <Gift className="w-8 h-8 text-rose-600" />,
        bg: "bg-rose-50 dark:bg-rose-900/20"
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 min-w-[320px]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            />

            <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
                {/* Header Image / Icon Area */}
                <div className={`${content.bg} p-8 flex flex-col items-center justify-center text-center border-b border-gray-100 dark:border-gray-700`}>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-lg mb-4 ring-4 ring-white/50 dark:ring-gray-700/50">
                        {content.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{content.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{content.subtitle}</p>
                </div>

                {/* Offer Details */}
                <div className="p-8">
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600 mb-6">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">New Monthly Price</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{content.newPrice}</span>
                                <span className="text-sm text-gray-400 line-through">{content.oldPrice}</span>
                            </div>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                            {content.saveBadge}
                        </div>
                    </div>

                    <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{content.offerTitle}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                        {content.offerDescription}
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={onAccept}
                            disabled={isLoading}
                            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-primary-500/20 transform transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${isStep10 ? 'bg-primary-600 hover:bg-primary-700' : 'bg-rose-600 hover:bg-rose-700'
                                }`}
                        >
                            {isLoading ? 'applying discount...' : (
                                <>
                                    {content.acceptBtn}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        <button
                            onClick={onDecline}
                            disabled={isLoading}
                            className="w-full py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                        >
                            {content.declineBtn}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RetentionModal;
