import React, { useEffect, useState } from 'react';
import { ShoppingBag, Loader2, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { getMerchantProducts } from '../services/productService';
import { createProductCheckoutSession } from '../services/stripeService';

interface ProductShowcaseProps {
    userId: string;
    theme?: 'light' | 'dark' | 'glass';
}

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({ userId, theme = 'glass' }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasingId, setPurchasingId] = useState<string | null>(null);

    useEffect(() => {
        const loadProducts = async () => {
            if (!userId) return;
            try {
                const data = await getMerchantProducts(userId);
                setProducts(data.filter(p => p.isActive && p.stock !== 0));
            } catch (e) {
                console.error("Failed to load products", e);
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
    }, [userId]);

    const handleBuy = async (product: Product) => {
        setPurchasingId(product.id);
        try {
            const { url } = await createProductCheckoutSession(product.id, userId);
            if (url) {
                window.location.href = url;
            }
        } catch (e) {
            console.error("Checkout failed:", e);
            alert("Unable to start checkout. Please try again.");
        } finally {
            setPurchasingId(null);
        }
    };

    if (loading) return null;
    if (products.length === 0) return null;

    const cardClass = theme === 'glass'
        ? "bg-white/10 backdrop-blur-md border border-white/20 text-white"
        : (theme === 'light' ? "bg-white text-gray-900 border border-gray-200" : "bg-gray-900 text-white border border-gray-800");

    return (
        <div className="w-full">
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${theme !== 'light' ? 'text-white' : 'text-gray-900'}`}>
                <ShoppingBag size={20} />
                Products
            </h3>
            <div className="grid grid-cols-1 gap-4">
                {products.map(product => (
                    <div key={product.id} className={`rounded-xl overflow-hidden p-4 flex gap-4 items-center transition hover:scale-[1.01] ${cardClass}`}>
                        <div className="w-20 h-20 bg-gray-200/20 rounded-lg flex-shrink-0 bg-cover bg-center"
                            style={{ backgroundImage: product.images[0] ? `url(${product.images[0]})` : undefined }}>
                            {!product.images[0] && <ShoppingBag className="m-auto mt-6 text-current opacity-50" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold truncate text-lg leading-tight">{product.title}</h4>
                            <p className="opacity-80 text-sm line-clamp-1 mt-1">{product.description}</p>
                            <div className="mt-2 text-xl font-bold">
                                ${(product.price / 100).toFixed(2)} <span className="text-xs font-normal opacity-60 uppercase">{product.currency}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => handleBuy(product)}
                            disabled={!!purchasingId}
                            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed
                                ${theme === 'light' ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-200'}
                            `}
                        >
                            {purchasingId === product.id ? <Loader2 size={18} className="animate-spin" /> : <span className="whitespace-nowrap">Buy</span>}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
