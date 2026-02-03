import React, { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '../firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';

const MerchantProductSubmission: React.FC = () => {
    const { currentUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Data State
    const [drops, setDrops] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    // Form State
    const [selectedDropId, setSelectedDropId] = useState('');
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [description, setDescription] = useState('');

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Load drops on mount
    useEffect(() => {
        const fetchDrops = async () => {
            try {
                // Fetch only OPEN drops
                const q = query(collection(db, 'drops'), where('status', '==', 'open'));
                const querySnapshot = await getDocs(q);
                const fetchedDrops: any[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedDrops.push({ id: doc.id, ...doc.data() });
                });
                setDrops(fetchedDrops);

                // Default select the first one if available
                if (fetchedDrops.length > 0) {
                    setSelectedDropId(fetchedDrops[0].id);
                }
            } catch (error) {
                console.error("Error fetching drops:", error);
            }
        };

        const fetchHistory = async () => {
            if (!currentUser) return;
            try {
                // Simple query for merchant's products
                const q = query(collection(db, 'products'), where('merchant_uid', '==', currentUser.uid));
                const snap = await getDocs(q);
                const prods: any[] = [];
                snap.forEach(d => prods.push({ id: d.id, ...d.data() }));
                setProducts(prods);
            } catch (error) {
                console.error("Error fetching history:", error);
            }
        }

        fetchDrops();
        fetchHistory();
    }, [currentUser]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            // Create local preview
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
        }
    };

    const handleSubmit = async () => {
        if (!currentUser) {
            alert("Please sign in first.");
            return;
        }
        if (!selectedDropId) {
            alert("No active drop selected. Please wait for an open drop.");
            return;
        }
        if (!imageFile) {
            alert("Please upload a product image.");
            return;
        }
        if (!name || !price || !quantity) {
            alert("Please fill in all fields.");
            return;
        }

        setIsUploading(true);
        setSubmitStatus('idle');

        try {
            // 1. Upload Image
            // Path: products/{merchant_uid}/{filename}
            // Use timestamp to unique-ify filename
            const filename = `${Date.now()}_${imageFile.name}`;
            const storageRef = ref(storage, `products/${currentUser.uid}/${filename}`);

            await uploadBytes(storageRef, imageFile);
            const downloadURL = await getDownloadURL(storageRef);

            // 2. Create Product Document
            const productData = {
                merchant_uid: currentUser.uid, // CRITICAL for security rule
                drop_id: selectedDropId,
                name: name,
                price: parseFloat(price),
                max_quantity: parseInt(quantity),
                description: description,
                image_url: downloadURL,
                created_at: serverTimestamp(),
            };

            await addDoc(collection(db, 'products'), productData);

            setSubmitStatus('success');
            // Reset form
            setName('');
            setPrice('');
            setQuantity('');
            setDescription('');
            setImageFile(null);
            setImagePreview(null);
            // alert("Product added successfully!"); // Removed alert for smoother UX

            // Refresh history
            const newProd = { ...productData, image_url: downloadURL, id: 'temp_' + Date.now() };
            setProducts([newProd, ...products]);

            // Optional: Redirect or show toast

        } catch (error) {
            console.error("Error uploading product:", error);
            setSubmitStatus('error');
            alert("Failed to submit product. Check console.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-text-light font-display antialiased pb-24 min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/5 dark:border-white/5">
                <div className="flex items-center p-4 justify-between max-w-lg mx-auto">
                    <h1 className="text-xl font-bold leading-tight tracking-tight flex-1">New Drop Submission</h1>
                    <button className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-2xl">settings</span>
                    </button>
                </div>
            </header>

            <main className="flex flex-col max-w-lg mx-auto w-full px-4 pt-4 gap-6">

                {/* Drop Selector */}
                <section className="flex flex-col gap-2">
                    <label className="text-base font-bold text-text-main dark:text-text-light ml-1">Select Drop</label>
                    <div className="relative">
                        <select
                            value={selectedDropId}
                            onChange={(e) => setSelectedDropId(e.target.value)}
                            className="form-select w-full rounded-xl border-transparent bg-surface-light dark:bg-surface-dark px-4 py-3.5 text-base text-text-main dark:text-text-light focus:border-primary focus:ring-primary/20 focus:ring-4 transition-all appearance-none shadow-sm"
                        >
                            {drops.length === 0 && <option value="">No Open Drops</option>}
                            {drops.map(drop => (
                                <option key={drop.id} value={drop.id}>
                                    {drop.zones?.join(', ')} - {drop.scheduled_date}
                                </option>
                            ))}
                        </select>
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none material-symbols-outlined text-gray-400">expand_more</span>
                    </div>
                </section>

                {/* Image Uploader */}
                <section className="flex flex-col gap-2">
                    <label className="text-base font-bold text-text-main dark:text-text-light ml-1">Product Image</label>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`group relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark px-6 py-10 transition-colors hover:border-primary hover:bg-surface-light/50 cursor-pointer ${imagePreview ? '!border-primary' : ''}`}
                    >
                        {imagePreview ? (
                            <div className="relative w-full h-48 rounded-lg overflow-hidden shadow-inner">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined">edit</span> Change
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-primary text-3xl">add_a_photo</span>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-text-main dark:text-text-light">Tap to upload product photo</p>
                                    <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">Supports: JPG, PNG</p>
                                </div>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageSelect}
                        />
                    </div>
                </section>

                {/* Form Fields */}
                <form className="flex flex-col gap-5">
                    {/* Product Name */}
                    <div className="flex flex-col gap-2">
                        <label className="text-base font-bold text-text-main dark:text-text-light ml-1">Product Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="form-input w-full rounded-xl border-transparent bg-surface-light dark:bg-surface-dark px-4 py-3.5 text-base text-text-main dark:text-text-light placeholder-gray-400 focus:border-primary focus:ring-primary/20 focus:ring-4 transition-all outline-none shadow-sm"
                            placeholder="e.g. Fresh Sourdough Loaf"
                            type="text"
                        />
                    </div>
                    {/* Price & Quantity Row */}
                    <div className="flex gap-4">
                        <div className="flex flex-col gap-2 flex-1">
                            <label className="text-base font-bold text-text-main dark:text-text-light ml-1">Price</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                <input
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="form-input w-full rounded-xl border-transparent bg-surface-light dark:bg-surface-dark pl-8 pr-4 py-3.5 text-base text-text-main dark:text-text-light placeholder-gray-400 focus:border-primary focus:ring-primary/20 focus:ring-4 transition-all outline-none shadow-sm"
                                    placeholder="0.00"
                                    type="number"
                                    step="0.01"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 w-1/3">
                            <label className="text-base font-bold text-text-main dark:text-text-light ml-1">Qty</label>
                            <input
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="form-input w-full rounded-xl border-transparent bg-surface-light dark:bg-surface-dark px-4 py-3.5 text-base text-text-main dark:text-text-light placeholder-gray-400 focus:border-primary focus:ring-primary/20 focus:ring-4 transition-all outline-none shadow-sm"
                                placeholder="10"
                                type="number"
                            />
                        </div>
                    </div>
                    {/* Description */}
                    <div className="flex flex-col gap-2">
                        <label className="text-base font-bold text-text-main dark:text-text-light ml-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="form-textarea w-full rounded-xl border-transparent bg-surface-light dark:bg-surface-dark px-4 py-3.5 text-base text-text-main dark:text-text-light placeholder-gray-400 min-h-[120px] resize-none focus:border-primary focus:ring-primary/20 focus:ring-4 transition-all outline-none shadow-sm"
                            placeholder="Describe your product (ingredients, origin, etc.)..."
                        ></textarea>
                    </div>
                    {/* Submit Button */}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isUploading}
                        className="mt-2 flex w-full items-center justify-center rounded-xl bg-primary px-6 py-4 text-base font-bold text-[#111b0e] hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {isUploading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                Uploading...
                            </span>
                        ) : 'Add to Next Drop'}
                    </button>
                </form>

                {/* Divider */}
                <div className="my-2 h-px w-full bg-gray-200 dark:bg-white/10"></div>

                {/* History List */}
                <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-text-main dark:text-text-light">Your Products</h2>
                        <button className="text-sm font-bold text-primary hover:underline">View All</button>
                    </div>
                    <div className="flex flex-col gap-3">
                        {products.map((prod, idx) => (
                            <div key={idx} className="flex items-center gap-4 rounded-xl bg-surface-light dark:bg-surface-dark p-3 border border-transparent hover:border-black/5 dark:hover:border-white/10 shadow-sm transition-all">
                                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                                    <img
                                        src={prod.image_url}
                                        alt={prod.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-1 flex-col justify-center">
                                    <h3 className="font-bold text-text-main dark:text-text-light leading-tight">{prod.name}</h3>
                                    <p className="text-sm text-text-secondary dark:text-gray-400">${prod.price} • {prod.max_quantity} units</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/40 px-2.5 py-1 text-xs font-bold text-yellow-800 dark:text-yellow-100 border border-yellow-200 dark:border-yellow-700/50">
                                        Submitted
                                    </span>
                                </div>
                            </div>
                        ))}
                        {products.length === 0 && (
                            <div className="text-center py-8 opacity-50">
                                <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
                                <p className="text-sm font-medium">No products submitted yet.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/5 dark:border-white/5 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md pb-safe">
                <div className="mx-auto flex max-w-lg items-center justify-around h-16">
                    <button onClick={() => navigate('/feed')} className="flex flex-1 flex-col items-center justify-center gap-1 text-gray-400 hover:text-text-main dark:hover:text-text-light transition-colors">
                        <span className="material-symbols-outlined text-2xl">home</span>
                        <span className="text-[10px] font-bold">Home</span>
                    </button>
                    <button className="flex flex-1 flex-col items-center justify-center gap-1 text-primary">
                        <span className="material-symbols-outlined text-2xl font-variation-fill">add_circle</span>
                        <span className="text-[10px] font-bold">Add Item</span>
                    </button>
                    <button className="flex flex-1 flex-col items-center justify-center gap-1 text-gray-400 hover:text-text-main dark:hover:text-text-light transition-colors">
                        <span className="material-symbols-outlined text-2xl">inventory_2</span>
                        <span className="text-[10px] font-bold">Orders</span>
                    </button>
                    <button onClick={() => navigate('/profile')} className="flex flex-1 flex-col items-center justify-center gap-1 text-gray-400 hover:text-text-main dark:hover:text-text-light transition-colors">
                        <span className="material-symbols-outlined text-2xl">person</span>
                        <span className="text-[10px] font-bold">Profile</span>
                    </button>
                </div>
            </nav>
            <style>{`
                .font-variation-fill {
                    font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
                .pb-safe {
                    padding-bottom: env(safe-area-inset-bottom, 20px);
                }
            `}</style>
        </div>
    );
};

export default MerchantProductSubmission;
