import React, { useState, useMemo, useEffect } from 'react';
import { Check, ArrowRight, Calculator, Laptop, ShoppingCart, Bot, PenTool, Clock } from 'lucide-react';

// --- Data Structure ---

interface ServiceOption {
    id: string;
    label: string;
    originalPrice: number;
    price: number; // Sale price
    description?: string;
}

interface ServiceCategory {
    id: string;
    title: string;
    icon: React.ElementType;
    description: string;
    options: ServiceOption[];
}

const servicesData: ServiceCategory[] = [
    {
        id: 'web',
        title: "Web Design & Development",
        icon: Laptop,
        description: "Modern, fast, and mobile-friendly websites that convert visitors into customers.",
        options: [
            { id: 'web_landing', label: 'Modern Landing Page (Mobile Friendly)', originalPrice: 1500, price: 450 },
            { id: 'web_cms', label: 'CMS Integration (Wordpress/Webflow)', originalPrice: 1000, price: 300 }, // Added logic based on prev data but with discount
            { id: 'web_react', label: 'Custom React App (High Performance)', originalPrice: 4000, price: 1200 },
        ]
    },
    {
        id: 'ecom',
        title: "E-commerce Setup",
        icon: ShoppingCart,
        description: "Start selling online with a seamless setup and secure payment processing.",
        options: [
            { id: 'ecom_stripe', label: 'Stripe Integration (No Monthly Fees)', originalPrice: 1000, price: 300 },
            { id: 'ecom_setup', label: 'Product Upload & Store Setup', originalPrice: 500, price: 150 },
        ]
    },
    {
        id: 'ai',
        title: "AI Agents & Automation",
        icon: Bot,
        description: "Leverage AI to save time and automate customer interactions.",
        options: [
            { id: 'ai_chat', label: 'AI Customer Support Bot (24/7)', originalPrice: 1200, price: 360 },
            { id: 'ai_email', label: 'Automated Email Sequences', originalPrice: 600, price: 180 },
        ]
    },
    {
        id: 'content',
        title: "Content & Design",
        icon: PenTool,
        description: "Engaging content to tell your brand story and attract customers.",
        options: [
            { id: 'canvas_ebook', label: 'Canvas E-Book / Lead Magnet', originalPrice: 500, price: 150 },
            { id: 'social_content', label: 'Social Media Content Pack', originalPrice: 800, price: 240 },
        ]
    }
];

// --- Sticky Banner Component ---
const StickyBanner = () => {
    const [timeLeft, setTimeLeft] = useState({ h: 4, m: 23, s: 15 });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.s > 0) return { ...prev, s: prev.s - 1 };
                if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
                if (prev.h > 0) return { ...prev, h: prev.h - 1, m: 59, s: 59 };
                return { h: 4, m: 23, s: 15 }; // Reset for demo loop
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (val: number) => val.toString().padStart(2, '0');

    return (
        <div className="bg-black text-white text-center py-3 px-4 sticky top-0 z-50 shadow-md flex justify-center items-center gap-2 text-xs md:text-sm font-medium">
            <span className="text-yellow-400">⚠️ Launch Offer:</span>
            <span>Get <span className="font-bold text-emerald-400">70% OFF</span> all services! Sale ends in:</span>
            <div className="font-mono bg-gray-800 px-2 py-0.5 rounded text-white border border-gray-700">
                {formatTime(timeLeft.h)}h : {formatTime(timeLeft.m)}m : {formatTime(timeLeft.s)}s
            </div>
        </div>
    );
};

// --- Main InteractiveComponent ---

const InteractiveEstimator: React.FC = () => {
    const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());

    const toggleService = (id: string) => {
        setSelectedServices(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const totals = useMemo(() => {
        let totalSale = 0;
        let totalOriginal = 0;
        const selectedList: { label: string; price: number }[] = [];

        servicesData.forEach(category => {
            category.options.forEach(option => {
                if (selectedServices.has(option.id)) {
                    totalSale += option.price;
                    totalOriginal += option.originalPrice;
                    selectedList.push({ label: option.label, price: option.price });
                }
            });
        });
        return { totalSale, totalOriginal, selectedList };
    }, [selectedServices]);

    const handleEmailBooking = () => {
        const recipient = "evan@careervivid.app"; // Using the specified email
        const subject = encodeURIComponent("New Project Inquiry: [Client Name]");

        let body = "Hi Evan,\n\nI am interested in the following services:\n\n";
        totals.selectedList.forEach((item, index) => {
            body += `${index + 1}. ${item.label} ($${item.price})\n`;
        });
        body += `\nTotal Budget: $${totals.totalSale}\n\nThanks!`;

        window.location.href = `mailto:${recipient}?subject=${subject}&body=${encodeURIComponent(body)}`;
    };

    return (
        <>
            <StickyBanner />

            <div id="estimator" className="py-16 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-4 border border-emerald-200 dark:border-emerald-800">
                            <Calculator size={16} />
                            <span>Instant Quote Calculator</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Build Your Custom Package
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Start small or go all in. Select what you need and lock in your <span className="font-bold text-emerald-600 dark:text-emerald-400">70% discount</span> today.
                        </p>
                    </div>

                    <div className="space-y-8 pb-32">
                        {servicesData.map((category) => (
                            <div key={category.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md">
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-emerald-50/30 dark:bg-emerald-900/10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                                            <category.icon size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{category.title}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2 sm:p-4 divide-y divide-gray-100 dark:divide-gray-700/50">
                                    {category.options.map((option) => (
                                        <label
                                            key={option.id}
                                            className={`
                                                relative flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200
                                                hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10
                                                ${selectedServices.has(option.id) ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}
                                            `}
                                        >
                                            <div className="flex-shrink-0 mt-1">
                                                <div className={`
                                                    w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors duration-200
                                                    ${selectedServices.has(option.id)
                                                        ? 'bg-emerald-600 border-emerald-600 shadow-sm shadow-emerald-200 dark:shadow-none'
                                                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}
                                                `}>
                                                    {selectedServices.has(option.id) && <Check size={14} className="text-white" strokeWidth={3} />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={selectedServices.has(option.id)}
                                                    onChange={() => toggleService(option.id)}
                                                />
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                                    <span className={`font-semibold text-gray-900 dark:text-white ${selectedServices.has(option.id) ? 'text-emerald-800 dark:text-emerald-300' : ''}`}>
                                                        {option.label}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-400 line-through">
                                                            ${option.originalPrice.toLocaleString()}
                                                        </span>
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg tabular-nums">
                                                            ${option.price.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                {option.description && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {option.description}
                                                    </p>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Floating Price Summary */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_30px_rgba(0,0,0,0.15)] z-40 animate-slide-up">
                    <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col items-center sm:items-start">
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                                <span>Total Estimate</span>
                                {totals.totalOriginal > 0 && (
                                    <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded font-bold">
                                        SAVE ${(totals.totalOriginal - totals.totalSale).toLocaleString()}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-medium text-gray-400 line-through">
                                    ${totals.totalOriginal.toLocaleString()}
                                </span>
                                <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                                    ${totals.totalSale.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <button
                            className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                            onClick={handleEmailBooking}
                        >
                            <span>Book Consultation</span>
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default InteractiveEstimator;
