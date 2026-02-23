import React, { useState } from 'react';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { createCheckoutSession } from '../services/stripeService';

interface BuyButtonProps {
    product: Product;
    connectedAccountId: string; // The merchant's stripe account ID
    onSuccess?: () => void;
}

export const BuyButton: React.FC<BuyButtonProps> = ({ product, connectedAccountId }) => {
    const [loading, setLoading] = useState(false);

    const handleBuy = async () => {
        if (!connectedAccountId) {
            alert("This seller is not ready to accept payments yet.");
            return;
        }

        setLoading(true);
        try {
            // We need a priceId for Checkout. 
            // In a real app, we'd ensure products are synced to Stripe and have a priceId.
            // For MVP/Connect without sync, we might pass amount data to a generic price creator function 
            // or assume priceId exists.
            // Setup assumes product.stripePriceId exists.

            if (!product.stripePriceId) {
                // TODO: Handle ad-hoc checkout creation or sync
                alert("Product setup incomplete (Missing Price ID).");
                return;
            }

            const session = await createCheckoutSession(product.stripePriceId, connectedAccountId);
            window.location.href = session.url;
        } catch (error) {
            console.error("Checkout failed:", error);
            alert("Unable to start checkout. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleBuy}
            disabled={loading}
            className="w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-all transform active:scale-95 flex items-center justify-center gap-2"
        >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <ShoppingBag size={20} />}
            Buy Now
        </button>
    );
};
