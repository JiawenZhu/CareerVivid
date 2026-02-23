import React, { useState } from 'react';
import { navigate } from '../../../utils/navigation';

const AssemblyLinePacking: React.FC = () => {
    const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});

    const toggleItem = (id: string) => {
        setCheckedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display flex flex-col min-h-screen overflow-hidden">
            {/* Top App Bar */}
            <header className="flex-none bg-surface-light dark:bg-surface-dark shadow-sm z-10">
                <div className="flex items-center px-4 py-3 justify-between">
                    <button
                        onClick={() => window.history.back()}
                        className="text-text-main dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-3xl">close</span>
                    </button>
                    <div className="flex flex-col items-center">
                        <h2 className="text-text-main dark:text-white text-sm font-bold uppercase tracking-wider">Packing Mode</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            <p className="text-text-secondary dark:text-gray-400 text-xs font-semibold">Live Batch</p>
                        </div>
                    </div>
                    <div className="flex w-12 items-center justify-end">
                        <span className="material-symbols-outlined text-text-secondary dark:text-gray-400">help</span>
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="px-4 pb-4 pt-1">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-text-main dark:text-white font-bold text-lg">Bag 4 <span className="text-text-secondary dark:text-gray-500 font-normal text-sm">of 50</span></span>
                        <span className="text-text-secondary dark:text-gray-400 text-xs font-medium">8% Complete</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: '8%' }}></div>
                    </div>
                </div>
            </header>

            {/* Main Scrollable Content */}
            <main className="flex-1 overflow-y-auto pb-32">
                <div className="p-4 flex flex-col gap-6 max-w-md mx-auto">
                    {/* Bag Indicator Card */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
                        <p className="text-text-secondary dark:text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Current Order</p>
                        <h1 className="text-text-main dark:text-white text-5xl font-extrabold tracking-tight mb-2">BAG #12-A</h1>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                            <span className="material-symbols-outlined text-base text-gray-500">person</span>
                            <p className="text-text-main dark:text-gray-300 text-sm font-semibold">John D.</p>
                        </div>
                    </div>

                    {/* Packing Checklist */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-text-main dark:text-white text-lg font-bold px-1">Items to Pack (3)</h3>

                        {/* Item 1 */}
                        <label className="relative flex items-center bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm active:scale-[0.99] transition-transform touch-manipulation cursor-pointer">
                            <input
                                type="checkbox"
                                className="custom-checkbox peer h-8 w-8 shrink-0 rounded border-2 border-gray-300 dark:border-gray-600 bg-transparent text-primary focus:ring-0 focus:ring-offset-0 focus:border-primary outline-none transition-all"
                                checked={checkedItems['item1'] || false}
                                onChange={() => toggleItem('item1')}
                            />
                            <div className="ml-5 flex flex-1 items-center justify-between peer-checked:opacity-50 transition-opacity">
                                <div className="flex flex-col">
                                    <span className="text-text-main dark:text-white text-lg font-medium leading-tight">Organic Whole Milk</span>
                                    <span className="text-text-secondary dark:text-gray-500 text-sm">Dairy Aisle • Shelf 2</span>
                                </div>
                                <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 min-w-[4rem]">
                                    <span className="text-text-main dark:text-white text-3xl font-extrabold">2<span className="text-lg font-bold text-gray-400 ml-0.5">x</span></span>
                                </div>
                            </div>
                            <div className="absolute inset-y-0 left-0 w-1 bg-primary scale-y-0 peer-checked:scale-y-100 transition-transform origin-center rounded-l-xl"></div>
                        </label>

                        {/* Item 2 */}
                        <label className="relative flex items-center bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm active:scale-[0.99] transition-transform touch-manipulation cursor-pointer">
                            <input
                                type="checkbox"
                                className="custom-checkbox peer h-8 w-8 shrink-0 rounded border-2 border-gray-300 dark:border-gray-600 bg-transparent text-primary focus:ring-0 focus:ring-offset-0 focus:border-primary outline-none transition-all"
                                checked={checkedItems['item2'] || false}
                                onChange={() => toggleItem('item2')}
                            />
                            <div className="ml-5 flex flex-1 items-center justify-between peer-checked:opacity-50 transition-opacity">
                                <div className="flex flex-col">
                                    <span className="text-text-main dark:text-white text-lg font-medium leading-tight">Free-range Chicken Breast</span>
                                    <span className="text-text-secondary dark:text-gray-500 text-sm">Meat Dept • Cooler B</span>
                                </div>
                                <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 min-w-[4rem]">
                                    <span className="text-text-main dark:text-white text-3xl font-extrabold">1<span className="text-lg font-bold text-gray-400 ml-0.5">x</span></span>
                                </div>
                            </div>
                            <div className="absolute inset-y-0 left-0 w-1 bg-primary scale-y-0 peer-checked:scale-y-100 transition-transform origin-center rounded-l-xl"></div>
                        </label>

                        {/* Item 3 */}
                        <label className="relative flex items-center bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm active:scale-[0.99] transition-transform touch-manipulation cursor-pointer">
                            <input
                                type="checkbox"
                                className="custom-checkbox peer h-8 w-8 shrink-0 rounded border-2 border-gray-300 dark:border-gray-600 bg-transparent text-primary focus:ring-0 focus:ring-offset-0 focus:border-primary outline-none transition-all"
                                checked={checkedItems['item3'] || false}
                                onChange={() => toggleItem('item3')}
                            />
                            <div className="ml-5 flex flex-1 items-center justify-between peer-checked:opacity-50 transition-opacity">
                                <div className="flex flex-col">
                                    <span className="text-text-main dark:text-white text-lg font-medium leading-tight">Fuji Apples</span>
                                    <span className="text-text-secondary dark:text-gray-500 text-sm">Produce • Bin 4</span>
                                </div>
                                <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 min-w-[4rem]">
                                    <span className="text-text-main dark:text-white text-3xl font-extrabold">5<span className="text-lg font-bold text-gray-400 ml-0.5">x</span></span>
                                </div>
                            </div>
                            <div className="absolute inset-y-0 left-0 w-1 bg-primary scale-y-0 peer-checked:scale-y-100 transition-transform origin-center rounded-l-xl"></div>
                        </label>

                        {/* Instructions Card */}
                        <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30 rounded-lg p-3 flex items-start gap-3">
                            <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-500 mt-0.5">info</span>
                            <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">Keep cold items together. Use thermal liner for this bag.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Footer Action Area */}
            <footer className="fixed bottom-0 w-full bg-surface-light dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800 p-4 pb-8 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col gap-3 max-w-md mx-auto">
                    <button className="w-full bg-primary hover:bg-primary-dark text-text-main font-extrabold text-xl py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 group">
                        <span>CONFIRM & NEXT</span>
                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                    <div className="flex justify-between gap-3">
                        <button className="flex-1 py-3 px-4 rounded-lg border-2 border-transparent hover:border-red-100 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:border-red-900/30 text-red-600 dark:text-red-400 font-bold text-sm transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-lg">report_problem</span>
                            Report Issue
                        </button>
                        <button className="flex-1 py-3 px-4 rounded-lg border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold text-sm transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-lg">skip_next</span>
                            Skip Bag
                        </button>
                    </div>
                </div>
            </footer>
            <style>{`
        /* Custom checkbox styling override to match the theme perfectly */
        .custom-checkbox:checked {
            background-color: #49e619;
            border-color: #49e619;
            background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuD-GLAOkG14p47XnbwE5zvPjbPDsINRKdHj6lUNdHHdCITxMwMEUNFDhO7qcElDVOYTaP3Re15tB1RtEqvTjJkAWK5s7Yxo46wuDAVrIG6tix7Hni8XbwUsPBTPdNSCi8lUVqwceyLkrp-OEOllOj4aIhUW29QKzr-GYnR8ZSOXT-rmajH2TVJ_ng7hCq9gDQakECjnbIL01xIHFJHpdY4E3T9or-an8XMAkdBLUMdJNoSOodY-u5jWw2VGu1ZGmvSxcmu0-I6rqI75");
        }
      `}</style>
        </div>
    );
};

export default AssemblyLinePacking;
