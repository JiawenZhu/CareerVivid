import React from 'react';
import { navigate } from '../../../utils/navigation';

const DropProductGallery: React.FC = () => {

    return (
        <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-text-light font-display transition-colors duration-200 min-h-screen">
            <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden pb-24 max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-xl">
                {/* TopAppBar */}
                <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center p-4 pb-2 justify-between">
                        <div
                            onClick={() => window.history.back()}
                            className="flex size-12 shrink-0 items-center justify-start cursor-pointer text-text-main dark:text-text-light"
                        >
                            <span className="material-symbols-outlined text-2xl">arrow_back</span>
                        </div>
                        <h2 className="text-text-main dark:text-text-light text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center truncate">
                            Drop #802
                        </h2>
                        <div className="flex w-12 items-center justify-end">
                            <button className="flex items-center justify-center rounded-full size-10 bg-transparent text-text-main dark:text-text-light hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                                <span className="material-symbols-outlined text-2xl">ios_share</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* ActionPanel: Warning Banner */}
                <div className="px-4 pt-4 @container">
                    <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800/50 p-4 shadow-sm">
                        <div className="flex gap-3 items-start">
                            <div className="text-orange-600 dark:text-orange-400 mt-0.5">
                                <span className="material-symbols-outlined">location_off</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-text-main dark:text-text-light text-base font-bold leading-tight">Not in Delivery Area</p>
                                <p className="text-text-main/70 dark:text-text-light/70 text-sm font-normal leading-normal">
                                    Delivery unavailable for <strong>90210</strong>. You can browse, but won't be able to checkout.
                                </p>
                            </div>
                        </div>
                        <button className="w-full sm:w-auto self-end sm:self-center flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-orange-100 dark:bg-orange-800 hover:bg-orange-200 dark:hover:bg-orange-700 text-orange-800 dark:text-orange-100 text-sm font-bold transition-colors">
                            <span className="truncate">Change Location</span>
                        </button>
                    </div>
                </div>

                {/* HeadlineText & Drop Info */}
                <div className="px-4 pt-6 pb-2">
                    <h2 className="text-text-main dark:text-text-light tracking-tight text-[32px] font-extrabold leading-tight text-left">
                        Weekend Pasture Drop
                    </h2>
                    <p className="text-text-main/60 dark:text-text-light/60 text-sm mt-1 font-medium">Curated by Green Valley Collective</p>
                </div>

                {/* Timer */}
                <div className="flex gap-3 py-4 px-4">
                    <div className="flex grow basis-0 flex-col items-stretch gap-2">
                        <div className="flex h-12 grow items-center justify-center rounded-lg bg-[#eaf3e7] dark:bg-white/10 border border-transparent dark:border-white/5">
                            <p className="text-text-main dark:text-text-light text-xl font-bold font-mono">04</p>
                        </div>
                        <div className="flex items-center justify-center"><p className="text-text-main/60 dark:text-text-light/60 text-xs font-medium uppercase tracking-wider">Hours</p></div>
                    </div>
                    <div className="flex items-start pt-2 justify-center">
                        <span className="text-text-main/30 dark:text-text-light/30 font-bold">:</span>
                    </div>
                    <div className="flex grow basis-0 flex-col items-stretch gap-2">
                        <div className="flex h-12 grow items-center justify-center rounded-lg bg-[#eaf3e7] dark:bg-white/10 border border-transparent dark:border-white/5">
                            <p className="text-text-main dark:text-text-light text-xl font-bold font-mono">23</p>
                        </div>
                        <div className="flex items-center justify-center"><p className="text-text-main/60 dark:text-text-light/60 text-xs font-medium uppercase tracking-wider">Mins</p></div>
                    </div>
                    <div className="flex items-start pt-2 justify-center">
                        <span className="text-text-main/30 dark:text-text-light/30 font-bold">:</span>
                    </div>
                    <div className="flex grow basis-0 flex-col items-stretch gap-2">
                        <div className="flex h-12 grow items-center justify-center rounded-lg bg-[#eaf3e7] dark:bg-white/10 border border-transparent dark:border-white/5">
                            <p className="text-text-main dark:text-text-light text-xl font-bold font-mono text-primary">10</p>
                        </div>
                        <div className="flex items-center justify-center"><p className="text-text-main/60 dark:text-text-light/60 text-xs font-medium uppercase tracking-wider">Secs</p></div>
                    </div>
                </div>

                {/* Filters/Chips */}
                <div className="sticky top-[60px] z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm py-2">
                    <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar pb-2">
                        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-text-main dark:bg-white px-5 transition-transform active:scale-95">
                            <p className="text-background-light dark:text-background-dark text-sm font-bold">All Items</p>
                        </button>
                        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full border border-black/10 dark:border-white/20 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 px-5 transition-all active:scale-95">
                            <p className="text-text-main dark:text-text-light text-sm font-medium">Meat & Poultry</p>
                        </button>
                        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full border border-black/10 dark:border-white/20 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 px-5 transition-all active:scale-95">
                            <p className="text-text-main dark:text-text-light text-sm font-medium">Dairy</p>
                        </button>
                        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full border border-black/10 dark:border-white/20 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 px-5 transition-all active:scale-95">
                            <p className="text-text-main dark:text-text-light text-sm font-medium">Produce</p>
                        </button>
                    </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 gap-6 px-4 pt-2 pb-8">
                    {/* Card 1: High Urgency */}
                    <div className="group relative flex flex-col gap-3 rounded-2xl bg-surface-light dark:bg-surface-dark p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10 hover:shadow-md transition-all">
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                            <img alt="Pasture raised chicken" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAk2Uw3wTP2eE1Dovuu64KfjmWU85AmfkpOFMsp5QIoqjR3U92yB5SXqobixq08qSNPtWx_NXKuR4QaGLl-G0npKkk5JxCigj3dwSiOn4KLjxAkiNX0oeV9vTEzG04N5hOzM8CRZA4eyA5XQG4-MzbytO2Jp3MC1mkyEQaHJGHBKJCtmYgAUPnKEHnu6AqTEaSkgDBK2q5nQZoj8AYsOU4EW5G1ZvRfDpm2aIvdT4qq2VPVEgmzWS2xsjFhBjNnHM3NimSMlAlUioR6" />
                            <div className="absolute top-2 right-2 rounded-md bg-white/90 dark:bg-black/80 px-2 py-1 backdrop-blur-sm">
                                <p className="text-xs font-bold text-text-main dark:text-text-light">Only 8 left</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 px-1">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-text-main dark:text-text-light leading-snug">Whole Pasture-Raised Chicken</h3>
                                <span className="text-lg font-bold text-text-main dark:text-text-light whitespace-nowrap">$18.50</span>
                            </div>
                            <p className="text-sm font-medium text-text-main/60 dark:text-text-light/60">Sunny Creek Farms • ~4.5 lbs</p>
                        </div>
                        <div className="px-1 space-y-2 mt-1">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                                    <span className="material-symbols-outlined text-sm">local_fire_department</span>
                                    <span>42/50 Claimed</span>
                                </div>
                                <span className="text-xs font-bold text-text-main/40 dark:text-text-light/40">84%</span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full bg-primary w-[84%] shadow-[0_0_10px_rgba(73,230,25,0.4)]"></div>
                            </div>
                        </div>
                        <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-background-dark hover:bg-primary/90 active:scale-[0.98] transition-all">
                            <span>Add to Cart</span>
                            <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                        </button>
                    </div>

                    {/* Card 2: Medium Progress */}
                    <div className="group relative flex flex-col gap-3 rounded-2xl bg-surface-light dark:bg-surface-dark p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10 hover:shadow-md transition-all">
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                            <img alt="Sourdough Bread" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOJ4gsSQ3qudsNvevqWl2jms6UbMEznJzhDMigjhSwUJq44TqtBfV-MQ-QR5G6nGgUzvWEZgJt6Tc-ANRS-guXirg_4FKZQQzuLMLe3Q4eff2hqNvT3ylM_29dhozOATwtrWhnp95RSryu8qLSz-uDHuQ16IZNCGVEq85cHqKu413wqe0KdtiETxWHXxqsuRHP6A8nXstltngHUQnzTd1-Vgmlwey0mRfNWoPr_nLpwH-3rFgEG9H0GOolHHbtT221AOBt4NHhvQbW" />
                        </div>
                        <div className="flex flex-col gap-1 px-1">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-text-main dark:text-text-light leading-snug">Organic Sourdough Loaf</h3>
                                <span className="text-lg font-bold text-text-main dark:text-text-light">$8.00</span>
                            </div>
                            <p className="text-sm font-medium text-text-main/60 dark:text-text-light/60">The Grainery • Freshly Baked</p>
                        </div>
                        <div className="px-1 space-y-2 mt-1">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-text-main/80 dark:text-text-light/80">
                                    <span className="material-symbols-outlined text-sm text-yellow-500">group</span>
                                    <span>12/20 Claimed</span>
                                </div>
                                <span className="text-xs font-bold text-text-main/40 dark:text-text-light/40">60%</span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full bg-primary w-[60%]"></div>
                            </div>
                        </div>
                        <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 dark:bg-primary/20 py-3.5 text-sm font-bold text-text-main dark:text-primary hover:bg-primary/20 dark:hover:bg-primary/30 active:scale-[0.98] transition-all">
                            <span>Add to Cart</span>
                            <span className="material-symbols-outlined text-lg">add</span>
                        </button>
                    </div>

                    {/* Card 3: Sold Out */}
                    <div className="group relative flex flex-col gap-3 rounded-2xl bg-surface-light dark:bg-surface-dark p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10 opacity-70 grayscale-[0.5]">
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                            <img alt="Heirloom Tomatoes" className="h-full w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDm7qws41-cvdBE7eCepTirmgVkVeJyONHtmxCWEDMLbHcoC_cKkHYF5QPbb1Twwjas08hSfnY5uLw8n900WReGFKkz10jZQsFaVTPrf3x3zFE4Zz31iFDFdqU2avUaioHdPoAMwcq7I59Q5BAxe4-0Y7H0qE7pzsb7tbJgCYWbIjnZQM1mewTubsm4iHGsEFkeFf3X7v2yPqmHTrqLXNLaOtzSTMkm9514dcdIjcLZfmrnvjOOfiWrChHRmlG2a221MeLrqbyV3OlT" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider transform -rotate-6">Sold Out</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 px-1">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-text-main dark:text-text-light leading-snug line-through">Heirloom Tomato Box</h3>
                                <span className="text-lg font-bold text-text-main dark:text-text-light">$22.00</span>
                            </div>
                            <p className="text-sm font-medium text-text-main/60 dark:text-text-light/60">Red Soil Gardens • 5 lbs</p>
                        </div>
                        <div className="px-1 space-y-2 mt-1">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-text-main/50 dark:text-text-light/50">
                                    <span>30/30 Claimed</span>
                                </div>
                                <span className="text-xs font-bold text-text-main/40 dark:text-text-light/40">100%</span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full bg-text-main/30 dark:bg-white/30 w-full"></div>
                            </div>
                        </div>
                        <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-black/5 dark:bg-white/5 py-3.5 text-sm font-bold text-text-main/40 dark:text-text-light/40 cursor-not-allowed" disabled>
                            <span>Join Waitlist</span>
                        </button>
                    </div>

                    {/* Card 4: New Item */}
                    <div className="group relative flex flex-col gap-3 rounded-2xl bg-surface-light dark:bg-surface-dark p-3 shadow-sm ring-1 ring-black/5 dark:ring-white/10 hover:shadow-md transition-all">
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                            <img alt="Raw Milk" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAumtzsmh2SlCl9fo50FndiiTaHPoRuJPNVIZp8rkx-dPBpVT-y7Mv931GxGgZUWhNyCz252Tk7n6yxx7pyenNny7oOvDwuJVkcfMptilnL9xXOVWHgW7pvZj2upVHGmi7TydAEIbaUI5Fo66UwXVvYFHaL5P_0kdkzIx6SakUYZ5VIjfhfMQykYmyVZhZlZsJuyqjLFxvtUnr7eb8J4JfYlKsJwbNtZ131XN-8SUEfoNUJQtYSS4zmP14V7tVDTTjr-dMadNKnLZDr" />
                        </div>
                        <div className="flex flex-col gap-1 px-1">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-text-main dark:text-text-light leading-snug">Raw Jersey Milk</h3>
                                <span className="text-lg font-bold text-text-main dark:text-text-light">$12.00</span>
                            </div>
                            <p className="text-sm font-medium text-text-main/60 dark:text-text-light/60">Happy Cow Dairy • 1 Gallon</p>
                        </div>
                        <div className="px-1 space-y-2 mt-1">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                                    <span className="material-symbols-outlined text-sm">trending_up</span>
                                    <span>5/40 Claimed</span>
                                </div>
                                <span className="text-xs font-bold text-text-main/40 dark:text-text-light/40">12%</span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full bg-primary w-[12%]"></div>
                            </div>
                        </div>
                        <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 dark:bg-primary/20 py-3.5 text-sm font-bold text-text-main dark:text-primary hover:bg-primary/20 dark:hover:bg-primary/30 active:scale-[0.98] transition-all">
                            <span>Add to Cart</span>
                            <span className="material-symbols-outlined text-lg">add</span>
                        </button>
                    </div>
                </div>

                {/* Sticky Bottom Cart Actions */}
                <div className="fixed bottom-6 inset-x-4 z-50">
                    <div className="w-full max-w-md mx-auto relative group">
                        <button onClick={() => navigate('/checkout')} className="w-full flex items-center justify-between bg-text-main dark:bg-primary text-white dark:text-background-dark p-2 pl-4 pr-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] active:scale-[0.98] transition-all">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center size-10 rounded-xl bg-white/20 dark:bg-black/10 font-bold">
                                    2
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-xs font-medium opacity-80">Subtotal</span>
                                    <span className="text-base font-bold">$26.50</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 dark:bg-black/10 px-4 py-2.5 rounded-xl font-bold text-sm">
                                <span>View Cart</span>
                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                            </div>
                        </button>
                    </div>
                </div>
                <style>{`
            .material-symbols-outlined {
                font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            }
            .no-scrollbar::-webkit-scrollbar {
                display: none;
            }
            .no-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        `}</style>
            </div>
        </div>
    );
};

export default DropProductGallery;
