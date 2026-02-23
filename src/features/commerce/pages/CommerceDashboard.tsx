import React, { useState, useEffect } from 'react';
import {
    ShoppingBag,
    Plus,
    CreditCard,
    TrendingUp,
    Settings,
    MoreVertical,
    Edit2,
    Trash2,
    Store,
    Loader2,
    ArrowLeft
} from 'lucide-react';
import { Product, StripeAccountStatus } from '../types';
import { getMerchantProducts, deleteProduct } from '../services/productService';
import { createConnectAccount, getAccountStatus, createExpressDashboardLink } from '../services/stripeService';
import { useAuth } from '../../../contexts/AuthContext';
import ProductEditorModal from '../components/ProductEditorModal';

interface CommerceDashboardProps {
    isEmbedded?: boolean;
    onProductsChange?: (products: Product[]) => void;
}

const CommerceDashboard: React.FC<CommerceDashboardProps> = ({ isEmbedded = false, onProductsChange }) => {
    const { currentUser } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Fetch Data
    const fetchData = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const fetchedProducts = await getMerchantProducts(currentUser.uid);
            setProducts(fetchedProducts);
            if (onProductsChange) {
                onProductsChange(fetchedProducts);
            }

            // TODO: Fetch real Stripe status if connectedAccountId exists in user profile
            // For now, mock or handle gracefully
        } catch (error) {
            console.error("Error fetching commerce data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentUser]);

    // Handlers
    const handleDelete = async (productId: string) => {
        if (!currentUser || !window.confirm("Are you sure you want to delete this product?")) return;
        await deleteProduct(currentUser.uid, productId);
        fetchData(); // Refresh
    };

    const handleConnectStripe = async () => {
        if (!currentUser) return;
        try {
            const url = await createConnectAccount(currentUser.uid, currentUser.email || '');
            window.location.href = url;
        } catch (error) {
            alert("Failed to initiate Stripe Connect. Check console.");
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

    return (
        <div className={` min-h-screen bg-gray-50 dark:bg-gray-900 ${isEmbedded ? 'flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50 dark:bg-black/20' : 'p-8'}`}>
            <div className={`max-w-6xl mx-auto space-y-8 ${isEmbedded ? 'max-w-4xl' : ''}`}>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        {!isEmbedded && (
                            <button
                                onClick={async () => {
                                    // Try to find the user's portfolio to be smart about "Back"
                                    if (currentUser && products.length >= 0) { // Just using product fetch as proxy for intent
                                        try {
                                            // Quick fetch of user's portfolios
                                            // Since we don't have the hook here easily without modifying a lot, 
                                            // we'll try a history back first if referrer is internal, otherwise /portfolio
                                            if (document.referrer.includes('/edit/')) {
                                                window.history.back();
                                            } else {
                                                // Default to main dashboard or we could query for their portfolio
                                                // For speed/simplicity:
                                                window.location.href = '/dashboard';
                                            }
                                        } catch {
                                            window.history.back();
                                        }
                                    } else {
                                        window.history.back();
                                    }
                                }}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-2 transition-colors"
                            >
                                <ArrowLeft size={16} /> Back to Editor
                            </button>
                        )}
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Store className="text-blue-600" />
                            Commerce Hub
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your products and earnings.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            // onClick={handleConnectStripe}
                            disabled
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-400 dark:text-gray-500 font-medium cursor-not-allowed flex items-center gap-2 relative opacity-70"
                        >
                            <CreditCard size={18} />
                            Connect Stripe
                            <span className="absolute -top-2 -right-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-600">
                                SOON
                            </span>
                        </button>
                        <button
                            onClick={() => { setEditingProduct(null); setIsEditorOpen(true); }}
                            className="px-4 py-2 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-lg hover:shadow-blue-500/25"
                        >
                            <Plus size={20} />
                            Add Product
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-3 opacity-80 mb-2">
                            <TrendingUp size={20} />
                            <span className="font-medium">Total Revenue</span>
                        </div>
                        <div className="text-3xl font-bold">$0.00</div>
                        <div className="text-sm opacity-60 mt-2">Lifetime earnings</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-2">
                            <ShoppingBag size={20} />
                            <span className="font-medium">Active Products</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{products.length}</div>
                    </div>
                    {/* Add more stats here */}
                </div>

                {/* Products List */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Products</h3>
                    </div>

                    {products.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                            <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium mb-2">No products yet</p>
                            <p className="text-sm mb-6">Start selling digital courses, templates, or physical goods.</p>
                            <button
                                onClick={() => { setEditingProduct(null); setIsEditorOpen(true); }}
                                className="text-blue-600 hover:underline font-medium"
                            >
                                Create your first product
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {products.map(product => (
                                <div key={product.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-900 overflow-hidden flex-shrink-0">
                                            {product.images[0] ? (
                                                <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <ShoppingBag size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-lg">{product.title}</h4>
                                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                                                    ${(product.price / 100).toFixed(2)}
                                                </span>
                                                <span className="capitalize px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-xs">
                                                    {product.type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => { setEditingProduct(product); setIsEditorOpen(true); }}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                            title="Edit"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Modal */}
            <ProductEditorModal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                userId={currentUser?.uid || ''}
                productToEdit={editingProduct}
                onSuccess={() => {
                    fetchData();
                }}
            />
        </div>
    );
};

export default CommerceDashboard;
