import React from 'react';
import { navigate } from '../../../utils/navigation';
import { useCart } from '../context/CartContext';
import { stitchService } from '../../../services/stitchService';
import { useAuth } from '../../../contexts/AuthContext';

const CheckoutSummary: React.FC = () => {
    const { items, cartTotal, clearCart } = useCart();
    const { currentUser, userProfile } = useAuth();

    const handlePlaceOrder = async () => {
        if (!currentUser) return;

        try {
            // Create order in Firestore
            // 2. Prepare payload for Cloud Function (Server calculates prices/names)
            const simplifiedItems = items.map(item => ({
                productId: item.id,
                quantity: item.quantity
            }));

            // 3. Create Order via Service (Secure Cloud Function)
            // Note: status, total_amount, etc. are handled server-side now
            // We pass the simplified payload which stitchService.createOrder expects.
            const orderId = await stitchService.createOrder({
                drop_id: 'drop_1', // Hardcoded for demo/MVP
                items: simplifiedItems,
            });

            // Clear cart and show feedback
            clearCart();
            alert('Order Placed Successfully!'); // Replace with Toast later
            navigate('/feed');
        } catch (error) {
            console.error("Order failed", error);
            alert('Failed to place order. Please try again.');
        }
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark p-6 text-center">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">shopping_cart_off</span>
                <h2 className="text-xl font-bold mb-2 text-text-main dark:text-white">Your cart is empty</h2>
                <p className="text-text-secondary dark:text-gray-400 mb-6">Looks like you haven't added any fresh drops yet.</p>
                <button onClick={() => navigate('/feed')} className="px-6 py-3 bg-primary text-text-main font-bold rounded-xl shadow-lg shadow-primary/20">
                    Browse Drops
                </button>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-display antialiased overflow-x-hidden transition-colors duration-200 min-h-screen pb-32">
            <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-xl pb-32">
                {/* Sticky Header */}
                <div className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
                    <button onClick={() => window.history.back()} className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-text-main-light dark:text-text-main-dark">
                        <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                    </button>
                    <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-8">Checkout</h2>
                </div>

                {/* Scrollable Content */}
                <div className="flex flex-col gap-6 p-4">
                    {/* Hero Delivery Card */}
                    <div className="relative overflow-hidden rounded-xl bg-surface-light dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="absolute top-0 right-0 p-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-1 text-xs font-bold text-red-600 dark:text-red-400">
                                <span className="material-symbols-outlined text-[14px] align-middle">timer</span>
                                Closes in 2h
                            </span>
                        </div>
                        <div className="p-5 flex gap-4">
                            <div className="flex-1 flex flex-col justify-center">
                                <p className="text-primary text-sm font-bold uppercase tracking-wider mb-1">Next Drop</p>
                                <h3 className="text-2xl font-bold mb-1">Friday, Oct 24</h3>
                                <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                                    4:00 PM - 6:00 PM
                                </p>
                            </div>
                        </div>
                        {/* Decorative Progress Bar indicating group buy status */}
                        <div className="bg-gray-100 dark:bg-gray-800 h-1 w-full mt-2">
                            <div className="bg-primary h-full w-[85%] rounded-r-full"></div>
                        </div>
                        <div className="px-5 py-2 flex justify-between items-center text-xs text-text-secondary-light dark:text-text-secondary-dark bg-gray-50 dark:bg-white/5">
                            <span>Group order is 85% full</span>
                            <span className="font-bold text-primary">Confirmed</span>
                        </div>
                    </div>

                    {/* Location Section */}
                    <div className="flex items-center gap-4 bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 text-primary shrink-0 size-12">
                            <span className="material-symbols-outlined text-2xl">location_on</span>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-medium">Delivering to</p>
                            <p className="text-base font-bold truncate">The Commons, Building B</p>
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">123 Maple Ave (Community Lobby)</p>
                        </div>
                        <button className="shrink-0 p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                    </div>

                    {/* Cart Section */}
                    <div>
                        <h3 className="text-lg font-bold mb-3 px-1">Your Cart</h3>
                        <div className="flex flex-col gap-3">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 bg-surface-light dark:bg-surface-dark p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                                    <div className="bg-center bg-no-repeat bg-cover rounded-lg size-14 shrink-0 bg-gray-200" style={{ backgroundImage: `url(${item.image_url})` }}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-semibold truncate">{item.name}</p>
                                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Qty: {item.quantity} x {item.unit}</p>
                                    </div>
                                    <div className="shrink-0 font-bold">${(item.price * item.quantity).toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-text-secondary-light dark:text-text-secondary-dark">Subtotal</span>
                            <span className="font-medium">${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-text-secondary-light dark:text-text-secondary-dark">Community Fee</span>
                            <span className="font-medium text-primary">Free</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-text-secondary-light dark:text-text-secondary-dark">Delivery</span>
                            <span className="font-medium text-primary">Free (Group Drop)</span>
                        </div>
                        <div className="h-px w-full bg-gray-100 dark:bg-gray-700 my-1"></div>
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Total</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="flex items-center justify-between bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center rounded bg-gray-100 dark:bg-white/10 size-10">
                                <span className="material-symbols-outlined text-2xl text-gray-600 dark:text-gray-300">credit_card</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold">Apple Pay</span>
                                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Citibank •• 4242</span>
                            </div>
                        </div>
                        <button className="text-sm font-semibold text-primary hover:opacity-80 transition-opacity">Change</button>
                    </div>
                </div>

                {/* Fixed Bottom Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface-light dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800 p-4 pb-8 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div>
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Total to pay</p>
                            <p className="text-2xl font-bold tracking-tight">${cartTotal.toFixed(2)}</p>
                        </div>
                        {/* Using text-background-dark on primary background for high contrast */}
                        <button onClick={handlePlaceOrder} className="flex-1 ml-6 bg-primary text-background-dark font-bold text-lg h-14 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                            Place Order
                            <span className="material-symbols-outlined font-bold">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
                /* Custom scrollbar hide for cleaner mobile look */
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

export default CheckoutSummary;
