import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getProductById } from '../services/productService';
import { createProductCheckoutSession } from '../services/stripeService';
import { Product } from '../types';
import { Loader2, CheckCircle, ArrowLeft, ShoppingBag } from 'lucide-react';

const ProductPage: React.FC = () => {
    // Current URL format in App.tsx navigation logic suggests we might need to parse window.location manually
    // because App.tsx might not be using React Router params for this specific catch-all?
    // Actually App.tsx renders <ProductPage /> for any path starting with /p/
    // So we can parse the path.
    // Expected: /p/USER_ID/PRODUCT_ID

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [purchasing, setPurchasing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            const pathParts = window.location.pathname.split('/');
            // ["", "p", "userId", "productId"]
            // Note: getPathFromUrl in App.tsx strips language prefix.
            // But window.location.pathname might include it if we read directly.
            // We should trust the logic or try to be robust.

            let userId = pathParts[2];
            let productId = pathParts[3];

            // Handle potential language prefix if App doesn't strip it for us here (it passes control)
            // But simplistic parsing: find 'p' index
            const pIndex = pathParts.indexOf('p');
            if (pIndex !== -1 && pathParts.length > pIndex + 2) {
                userId = pathParts[pIndex + 1];
                productId = pathParts[pIndex + 2];
            }

            if (!userId || !productId) {
                setError("Product not found");
                setLoading(false);
                return;
            }

            try {
                const data = await getProductById(userId, productId);
                if (data) {
                    setProduct(data);
                } else {
                    setError("Product not found");
                }
            } catch (e) {
                console.error(e);
                setError("Error loading product");
            } finally {
                setLoading(false);
            }
        };

        // Check for success param
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('success') === 'true') {
            setIsSuccess(true);
            setLoading(false);
            return;
        }

        fetchProduct();
    }, []);

    const handleBuy = async () => {
        if (!product) return;
        setPurchasing(true);
        try {
            // Need merchantId (userId from URL)
            const pathParts = window.location.pathname.split('/');
            const pIndex = pathParts.indexOf('p');
            const merchantId = pathParts[pIndex + 1];

            const { url } = await createProductCheckoutSession(product.id, merchantId);
            if (url) window.location.href = url;
            else alert("Error initiating checkout");
        } catch (e) {
            console.error(e);
            alert("Checkout failed");
        } finally {
            setPurchasing(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 dark:text-white">Payment Successful!</h2>
                    <p className="text-gray-500 mb-8 dark:text-gray-400">Thank you for your purchase. You will receive an email confirmation shortly.</p>
                    <button onClick={() => window.history.back()} className="text-blue-600 font-medium hover:underline">
                        Return to Portfolio
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
                <ShoppingBag size={48} className="opacity-20" />
                <p>{error || "Product not found"}</p>
                <button onClick={() => window.history.back()} className="flex items-center gap-2 text-blue-600 hover:underline">
                    <ArrowLeft size={16} /> Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col md:flex-row">
            {/* Image Side */}
            <div className="w-full md:w-1/2 h-[50vh] md:h-screen bg-gray-100 dark:bg-gray-900 relative">
                {product.images[0] ? (
                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingBag size={64} opacity={0.2} />
                    </div>
                )}
                <button
                    onClick={() => window.history.back()}
                    className="absolute top-6 left-6 p-3 bg-white/80 backdrop-blur rounded-full shadow-lg hover:bg-white transition text-gray-800"
                >
                    <ArrowLeft size={20} />
                </button>
            </div>

            {/* Info Side */}
            <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
                <div className="max-w-lg mx-auto w-full space-y-8">
                    <div>
                        <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium uppercase tracking-wider mb-4">
                            {product.type}
                        </span>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{product.title}</h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                            {product.description}
                        </p>
                    </div>

                    <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-baseline gap-2 mb-8">
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                ${(product.price / 100).toFixed(2)}
                            </span>
                            <span className="text-gray-500 uppercase font-medium">{product.currency}</span>
                        </div>

                        <button
                            onClick={handleBuy}
                            disabled={purchasing || product.stock === 0}
                            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {purchasing ? <Loader2 className="animate-spin" /> : 'Buy Now'}
                        </button>
                        {product.stock === 0 && (
                            <p className="text-red-500 text-center mt-3 font-medium">Out of Stock</p>
                        )}
                        <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                            <CheckCircle size={12} /> Secure payment via Stripe
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
