import React, { useState, useEffect } from 'react';
import { navigate } from '../../../utils/navigation';
import { stitchService } from '../../../services/stitchService';
import { Drop } from '../../../types';

const UpcomingDropsFeed: React.FC = () => {
    const [drops, setDrops] = useState<Drop[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDrops = async () => {
        setLoading(true);
        setError(null);
        try {
            // Hardcoded zone for demo. Real app would get this from user profile.
            const fetchedDrops = await stitchService.getUpcomingDrops('urbana');
            setDrops(fetchedDrops);
        } catch (error) {
            console.error("Failed to load drops", error);
            setError("Unable to load drops. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrops();
    }, []);

    const featuredDrop = drops.length > 0 ? drops[0] : null;
    const ongoingDrops = drops.length > 1 ? drops.slice(1) : [];

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-text-main dark:text-white overflow-x-hidden transition-colors duration-200 min-h-screen">
            <div className="relative min-h-screen flex flex-col pb-24 max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-xl">
                {/* Sticky Header */}
                <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center justify-between px-4 py-3">
                        {/* Location */}
                        <div className="flex flex-col items-start cursor-pointer group">
                            <span className="text-xs font-medium text-text-secondary dark:text-primary/80 uppercase tracking-wider mb-0.5">Delivering to</span>
                            <div className="flex items-center gap-1 text-text-main dark:text-white">
                                <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
                                <h2 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">Downtown Urbana</h2>
                                <span className="material-symbols-outlined text-text-secondary text-[18px]">expand_more</span>
                            </div>
                        </div>
                        {/* Notification Bell */}
                        <button className="flex items-center justify-center size-10 rounded-full bg-white dark:bg-card-dark shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative">
                            <span className="material-symbols-outlined text-text-main dark:text-white">notifications</span>
                            <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border border-white dark:border-card-dark"></span>
                        </button>
                    </div>
                </header>

                {error ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center h-64">
                        <span className="material-symbols-outlined text-4xl text-red-500 mb-2">cloud_off</span>
                        <p className="text-sm text-text-secondary dark:text-gray-400 mb-4">{error}</p>
                        <button onClick={fetchDrops} className="px-4 py-2 bg-primary text-text-main text-sm font-bold rounded-lg shadow-sm">
                            Retry
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Featured Section */}
                        <section className="mt-4">
                            <div className="px-4 mb-3 flex items-end justify-between">
                                <h2 className="text-xl font-bold text-text-main dark:text-white uppercase tracking-tight">Featured Drop</h2>
                                <button className="text-sm font-bold text-primary hover:underline">See All</button>
                            </div>

                            {/* Horizontal Carousel */}
                            <div className="flex overflow-x-auto no-scrollbar gap-4 px-4 pb-4 snap-x">
                                {loading ? (
                                    <div className="flex-none w-[85%] max-w-sm snap-center h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse flex flex-col overflow-hidden">
                                        <div className="h-40 bg-gray-200 dark:bg-gray-700"></div>
                                        <div className="p-4 flex flex-col gap-2">
                                            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                            <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        </div>
                                    </div>
                                ) : featuredDrop ? (
                                    <div className="flex-none w-[85%] max-w-sm snap-center">
                                        <div className="flex flex-col h-full rounded-xl bg-card-light dark:bg-card-dark shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-none overflow-hidden group border border-transparent dark:border-white/10">
                                            {/* Image Area with Countdown */}
                                            <div className="relative h-48 w-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                                                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDo-r3ZzNyBvkmEsB6QHEfmkrrbPQMtQ94FRkRsWaJWzOIlkz64x0ybx1hf4Z9elUnpHh_iL4xAbUDtQOJm0U8d0DqU_Fe3SnJUIKi16P-qlkzSvvkOKapInm1KELEwwA_UfkqPVxw7rPXw0294PH6-dOtCM0YDaOX_kdU_m2I8Pi_-nnzWwZ6OCtiX-Y1Wf5XT-jtHoXs8bGweHd6-7uvl2438HbcvAfVdbaSxTOhs7ud85_Dko5mODZCfIO9rvCSVi_9q6VLLBrG7")' }}></div>
                                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                                {/* Timer Badge */}
                                                <div className="absolute top-3 right-3 bg-white/95 dark:bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                                    <span className="material-symbols-outlined text-red-500 text-[16px]">timer</span>
                                                    <span className="text-xs font-bold text-red-600 dark:text-red-400 tabular-nums">04:12:30</span>
                                                </div>
                                                {/* Title Overlay */}
                                                <div className="absolute bottom-3 left-3 right-3">
                                                    <h3 className="text-white text-xl font-bold leading-tight drop-shadow-md">{featuredDrop.title}</h3>
                                                </div>
                                            </div>
                                            {/* Content Area */}
                                            <div className="p-4 flex flex-col gap-3">
                                                <div className="flex items-center gap-2 text-text-secondary dark:text-gray-400 text-sm">
                                                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                                    {/* TODO: Format date correctly using date-fns or similar */}
                                                    <span>Arrives Sun, Oct 12</span>
                                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                                    <span className="text-primary font-bold">45 joined</span>
                                                </div>
                                                <button onClick={() => navigate(`/drop/${featuredDrop.id}`)} className="w-full h-10 mt-auto flex items-center justify-center gap-2 rounded-lg bg-primary text-text-main text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
                                                    <span>View Drop</span>
                                                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-gray-500">No upcoming drops in Urbana.</div>
                                )}
                            </div>
                        </section>

                        {/* Vertical Feed */}
                        <section className="mt-2 px-4 flex flex-col gap-4">
                            <h2 className="text-xl font-bold text-text-main dark:text-white uppercase tracking-tight py-2">Happening Now</h2>

                            {ongoingDrops.map((drop) => (
                                <article key={drop.id} className="bg-card-light dark:bg-card-dark rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-none overflow-hidden border border-transparent dark:border-white/10 flex flex-col @container">
                                    <div className="relative h-48 w-full">
                                        {/* Placeholder image logic or real image from Drop object if added later */}
                                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA8AabcUe9DFV-A6iNkMltJeAt-LQ1_HhAHbX67mnknDmHvC8HEpF09SHR3N23sJjA1-vQGJZ0FI7xdyK_NocRiClFtoACWyYH01-bRBw2NPS3UI2iiQMhR_9eH4m1D4lMbLsfR1BTfAb2ax9pVM-eA9xePPxX1kTUcyxa4JtL3MGo6mPNfDFIDg4uvDQrtNOuHz8tTTjEUt7M3gHU29C0M3tTeO7apOQw2fFNoZA_Vfvp-Isizrl4oJhgD3QaazkZIc_-yfT5Xz3Nd")' }}></div>
                                        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg">
                                            <p className="text-primary text-xs font-bold uppercase tracking-wider">{drop.status}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-bold text-text-main dark:text-white leading-snug">{drop.title}</h3>
                                                <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">Direct from Urbana Farms Collective</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Ends in</span>
                                                <span className="text-sm font-bold text-text-main dark:text-white font-mono">2 days</span>
                                            </div>
                                        </div>
                                        <div className="w-full h-px bg-gray-100 dark:bg-white/10 my-1"></div>
                                        <div className="flex items-end justify-between gap-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary text-[18px]">local_shipping</span>
                                                    <span className="text-sm font-medium text-text-main dark:text-gray-200">Wed, Oct 15</span>
                                                </div>
                                            </div>
                                            <button onClick={() => navigate(`/drop/${drop.id}`)} className="shrink-0 h-9 px-5 rounded-lg bg-primary text-text-main text-sm font-bold shadow-sm active:scale-95 transition-transform">
                                                View Drop
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}

                            {ongoingDrops.length === 0 && !loading && (
                                <div className="p-4 text-center text-gray-500">Check back later for more drops.</div>
                            )}

                        </section>

                        {/* Bottom Navigation */}
                        <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-background-dark border-t border-gray-100 dark:border-white/5 pb-5 pt-3 px-6 z-50">
                            <div className="flex items-center justify-between max-w-md mx-auto">
                                <button onClick={() => navigate('/feed')} className="flex flex-col items-center gap-1 text-primary w-12 group transition-colors">
                                    <span className="material-symbols-outlined text-[26px] group-hover:scale-110 transition-transform">home</span>
                                    <span className="text-[10px] font-bold">Home</span>
                                </button>
                                {/* Linking Orders to /tracker for now as it's the closest "my activity" page, or a new placeholder */}
                                <button onClick={() => navigate('/tracker')} className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-text-main dark:hover:text-white w-12 transition-colors group">
                                    <span className="material-symbols-outlined text-[26px] group-hover:scale-110 transition-transform">receipt_long</span>
                                    <span className="text-[10px] font-medium">Orders</span>
                                </button>
                                <div className="relative -top-6">
                                    <button onClick={() => navigate('/checkout')} className="flex items-center justify-center size-14 rounded-full bg-primary text-text-main shadow-[0_4px_12px_rgba(73,230,25,0.4)] hover:shadow-[0_6px_16px_rgba(73,230,25,0.5)] transition-all active:scale-95">
                                        <span className="material-symbols-outlined text-[28px]">shopping_cart</span>
                                    </button>
                                </div>
                                <button className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-text-main dark:hover:text-white w-12 transition-colors group">
                                    <span className="material-symbols-outlined text-[26px] group-hover:scale-110 transition-transform">favorite</span>
                                    <span className="text-[10px] font-medium">Saved</span>
                                </button>
                                <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-text-main dark:hover:text-white w-12 transition-colors group">
                                    <span className="material-symbols-outlined text-[26px] group-hover:scale-110 transition-transform">person</span>
                                    <span className="text-[10px] font-medium">Profile</span>
                                </button>
                            </div>
                        </nav>
                    </>
                )}
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
    );
};

export default UpcomingDropsFeed;
