import React from 'react';
import { navigate } from '../../../utils/navigation';

const CreateNewDrop: React.FC = () => {

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-gray-100 antialiased selection:bg-primary selection:text-black min-h-screen">
            <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24 max-w-md mx-auto">
                {/* TopAppBar */}
                <div className="sticky top-0 z-50 flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm p-4 border-b border-gray-200 dark:border-gray-800 justify-between">
                    <div className="flex w-16 items-center justify-start">
                        <p onClick={() => window.history.back()} className="text-green-700 dark:text-green-400 text-base font-bold leading-normal tracking-[0.015em] shrink-0 cursor-pointer">Cancel</p>
                    </div>
                    <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] text-center">New Drop</h2>
                    <div className="w-16"></div> {/* Spacer for centering */}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 flex flex-col w-full">
                    {/* Headline: Logistics */}
                    <div className="px-4 pt-6 pb-2">
                        <h2 className="text-gray-900 dark:text-white tracking-tight text-[28px] font-bold leading-tight text-left">Logistics</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Set the time and place for the drop.</p>
                    </div>

                    {/* Logistics Form */}
                    <div className="flex flex-col gap-4 px-4 py-3">
                        {/* Date & Time Row */}
                        <div className="flex gap-4">
                            <label className="flex flex-col min-w-0 flex-1">
                                <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">Drop Date</p>
                                <div className="relative">
                                    <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white dark:bg-gray-800/50 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-200 dark:border-gray-700 focus:border-primary h-14 placeholder:text-gray-400 p-[15px] text-base font-normal leading-normal" placeholder="Select Date" type="date" />
                                </div>
                            </label>
                            <label className="flex flex-col min-w-0 flex-1">
                                <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">Cut-off Time</p>
                                <div className="relative">
                                    <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white dark:bg-gray-800/50 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-200 dark:border-gray-700 focus:border-primary h-14 placeholder:text-gray-400 p-[15px] text-base font-normal leading-normal" placeholder="Select Time" type="time" />
                                </div>
                            </label>
                        </div>
                        {/* Zone Input */}
                        <label className="flex flex-col w-full">
                            <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">Target Zone (Zip Codes)</p>
                            <div className="flex w-full items-stretch rounded-lg shadow-sm">
                                <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-l-lg text-gray-900 dark:text-white dark:bg-gray-800/50 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-200 dark:border-gray-700 border-r-0 focus:border-primary h-14 placeholder:text-gray-400 p-[15px] text-base font-normal leading-normal" placeholder="e.g. 90210, 90001" />
                                <div className="flex items-center justify-center px-4 rounded-r-lg border border-l-0 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-green-700 dark:text-primary">
                                    <span className="material-symbols-outlined">location_on</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 ml-1">Separate multiple zip codes with commas.</p>
                        </label>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-200 dark:bg-gray-800 mx-4 my-4"></div>

                    {/* Headline: Curate Products */}
                    <div className="px-4 pt-2 pb-2">
                        <h2 className="text-gray-900 dark:text-white tracking-tight text-[28px] font-bold leading-tight text-left">Curate Products</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Select items from the master catalog.</p>
                    </div>

                    {/* Search Bar */}
                    <div className="px-4 py-2">
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-gray-400">search</span>
                            </div>
                            <input type="text" className="block w-full rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-10 pr-4 leading-normal text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm" placeholder="Search avocados, bread, milk..." />
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="flex overflow-x-auto gap-3 px-4 py-4 no-scrollbar">
                        <button className="flex-shrink-0 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2 rounded-full text-sm font-bold shadow-md transition-transform active:scale-95">All</button>
                        <button className="flex-shrink-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm hover:border-primary dark:hover:border-primary transition-colors">🍎 Produce</button>
                        <button className="flex-shrink-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm hover:border-primary dark:hover:border-primary transition-colors">🥐 Bakery</button>
                        <button className="flex-shrink-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm hover:border-primary dark:hover:border-primary transition-colors">🥛 Dairy</button>
                        <button className="flex-shrink-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm hover:border-primary dark:hover:border-primary transition-colors">🥫 Pantry</button>
                    </div>

                    {/* Product List */}
                    <div className="flex flex-col gap-4 px-4 pb-8">
                        {/* Item 1 */}
                        <div className="group flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
                            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                <img alt="Fresh organic avocados on a wooden table" className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2xif77wyLch8Cpe0r2J0KzmqOpnDdHbKhtI74qHQleCt4lOTJn_EGOS4ki-WWrQnS1CnuIOpzTDfQ-Hirp3rT0jU0cpUXPKLSMFP6yV9LcNWvODX8M5cCtJuFAxr9kGvWVhr8jxF6_HakkOxFqDuenmnXvwd-xPnWC_90YIc2TZPDGePlS0FezQICzZDAEoP9rx1QYeFM_ySIddqV75Y9UQZQEy3FLindSmdqFY7QFbRmxBBrKH1gjvmAPHJQmSGbKr6kJ-WhkT3U" />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">Organic Hass Avocados</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Bag of 4 • Large Size</p>
                                <p className="mt-1 text-sm font-bold text-green-700 dark:text-primary">$5.99</p>
                            </div>
                            <button className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-black shadow-md hover:bg-[#3cd015] transition-colors">
                                <span className="material-symbols-outlined text-[20px] font-bold">add</span>
                            </button>
                        </div>

                        {/* Item 2 */}
                        <div className="group flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-xl border border-primary dark:border-primary shadow-sm ring-1 ring-primary/20 bg-primary/5 dark:bg-primary/5">
                            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 relative">
                                <img alt="Loaf of fresh sourdough bread" className="h-full w-full object-cover object-center" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNIXeJjj56wAFFX_PDkiZcHEehSenJzEM2r89DHClTdmTD2BQkePQu4UP4uhG061q05uRdvTiS7p1cHCqz22aaC_HZGgvflNf2IaL2WHSKqvYN2cTOeD85x9Y3KLjkQ3ys0YpvWaLQ3xQciM4Z3DqnPOEIkBC4QcbJ6HKQx3dTbSc8rrUFQEHktiqex1vaEnM-g30LA75dZeOntLX_LzPTBd7Y1aXAItEwE3o6Q8TZsB2FU8787XZNfv20251NuiYvjpgiu6fw6VWy" />
                                <div className="absolute inset-0 bg-primary/20 mix-blend-multiply"></div>
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">Artisan Sourdough</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Freshly Baked • 750g</p>
                                <p className="mt-1 text-sm font-bold text-green-700 dark:text-primary">$6.50</p>
                            </div>
                            <button className="h-10 w-10 flex items-center justify-center rounded-full bg-black dark:bg-white text-white dark:text-black shadow-md">
                                <span className="material-symbols-outlined text-[20px] font-bold">check</span>
                            </button>
                        </div>

                        {/* Item 3 */}
                        <div className="group flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
                            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                <img alt="Carton of fresh eggs on white background" className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyc-7UVA5_gbweHaVst3pw7G_FEW1XlRK0lANOVmIwy0jWpR4raMJsnlCaG_tlbyjmbpWJL-D-EfxtdeNhpymfhk1OqsrWsM8i1YskQo54bz0rIEm6djQ9Sy6-Ep3W2q_VS36AfPfCAuf8cxE1YrPTHkIXUEuNFOo7uGG0i4AAkIdq8I6qc6-J9wzWq-JXAmbH9jvEdf4su5Yaj1x0UFXGtmAoijSdwHab4Mh8Xu6ZVRU8g381F5MxFCaMnZTIqaCsPAeX4PfqMXD2" />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">Free-range Eggs</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Dozen • Grade AA</p>
                                <p className="mt-1 text-sm font-bold text-green-700 dark:text-primary">$4.25</p>
                            </div>
                            <button className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-600 text-gray-400 hover:border-primary hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[20px] font-bold">add</span>
                            </button>
                        </div>

                        {/* Item 4 */}
                        <div className="group flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
                            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                <img alt="Carton of oat milk pouring into glass" className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRLeS-xVVpiU5DLVEAxC7P53DtAXK5ieVZ887IndQNcIGt89JXboTinej13-FpBCgtaG67F1OnTS8frTVF-f3Hpb3lrtMQY5W-N0STPvYpOPSrY5W-hX2hAVDo9YDUHFQtlF6dXgKnyUrCBPuQI1rR5snnBhpXO8I3Cikny2uypPTO002qnZTGwM3Jc89eKWN5C-RXSpeU6kwLspTEj60w1VW5dD2KWM8icCNzJSGjVf1Ss5PSgK_bzgdfovyQn94aA52k3JU0WS8o" />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">Oat Milk Barista</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">1L • Plant Based</p>
                                <p className="mt-1 text-sm font-bold text-green-700 dark:text-primary">$4.99</p>
                            </div>
                            <button className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-600 text-gray-400 hover:border-primary hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[20px] font-bold">add</span>
                            </button>
                        </div>

                        {/* Item 5 */}
                        <div className="group flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
                            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                <img alt="Fresh honey jar with honeycomb" className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAec1FzV82IKS8RC7L_xjBfj87faINc7Q5iwRkiBlVrVROEkSTKu3kfqhbJU9gOk0itYNKb_z6TWgyS1t4ARqzZkrcZzcsp36xCE20l_NTBSnOxqlKJx3PD_NFyWGXHwk8xtfR2BUiXpW2YVDDj5vHcspIktD3IZte5r_EwSA5PFJoGAnHYDMZQRi5zZp-f6TSxaubsU0frVy56KnVcfiC2IXEskkKt6qWf74Ic0EMincpUKfiqz2flragwSgkFR3mB3D0QqTVB2v3L" />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">Raw Local Honey</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">12oz • Wildflower</p>
                                <p className="mt-1 text-sm font-bold text-green-700 dark:text-primary">$12.00</p>
                            </div>
                            <button className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-600 text-gray-400 hover:border-primary hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[20px] font-bold">add</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-background-light/80 dark:bg-background-dark/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 pb-8 pt-4 px-4 shadow-lg">
                    <div className="flex flex-col max-w-md mx-auto gap-3">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black dark:bg-white text-xs font-bold text-white dark:text-black">1</span>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Item Selected</p>
                            </div>
                            <p className="text-sm font-medium text-gray-500">Est. Audience: ~120</p>
                        </div>
                        <button className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3.5 text-base font-bold text-black shadow-lg transition-transform active:scale-95 hover:bg-[#3cd015]">
                            Review & Publish
                        </button>
                    </div>
                </div>
                <style>{`
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

export default CreateNewDrop;
