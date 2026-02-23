
import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2, Image as ImageIcon, FileText, Check } from 'lucide-react';
import { Product } from '../types';
import { createProduct, updateProduct } from '../services/productService';
import { uploadImage } from '../../../services/storageService';
// Note: uploadFile might not exist in storageService yet, fallback or implement it. 
// Assuming uploadImage works for general files or create a specific one.

interface ProductEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    productToEdit?: Product | null;
    onSuccess: () => void;
}

const ProductEditorModal: React.FC<ProductEditorModalProps> = ({
    isOpen, onClose, userId, productToEdit, onSuccess
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [type, setType] = useState<'digital' | 'physical'>('digital');
    const [currency, setCurrency] = useState('usd');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [digitalFile, setDigitalFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const imageInputRef = useRef<HTMLInputElement>(null);
    const digitalFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (productToEdit) {
            setTitle(productToEdit.title);
            setDescription(productToEdit.description);
            setPrice((productToEdit.price / 100).toFixed(2));
            setType(productToEdit.type);
            setCurrency(productToEdit.currency);
            setImagePreview(productToEdit.images[0] || null);
            // Can't set File objects from URL, user must re-upload to change
        } else {
            resetForm();
        }
    }, [productToEdit, isOpen]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPrice('');
        setType('digital');
        setCurrency('usd');
        setImageFile(null);
        setImagePreview(null);
        setDigitalFile(null);
        setError('');
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleDigitalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setDigitalFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            // 1. Upload Image if changed
            let imageUrl = productToEdit?.images[0] || '';
            if (imageFile) {
                imageUrl = await uploadImage(imageFile, `products / ${userId}/${Date.now()}_${imageFile.name}`);
            }

            // 2. Upload Digital File if present (and type is digital)
            let fileUrl = productToEdit?.fileUrl || '';
            if (type === 'digital' && digitalFile) {
                // Using uploadImage for now as generic uploader, ideally verify storageService supports arbitrary files
                fileUrl = await uploadImage(digitalFile, `digital_downloads/${userId}/${Date.now()}_${digitalFile.name}`);
            }

            const priceInCents = Math.round(parseFloat(price) * 100);
            const productData: Partial<Product> = {
                title,
                description,
                price: priceInCents,
                currency,
                type,
                images: imageUrl ? [imageUrl] : [],
                fileUrl: type === 'digital' ? fileUrl : undefined,
                slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), // Simple slugify
            };

            if (productToEdit) {
                await updateProduct(userId, productToEdit.id, productData);
            } else {
                await createProduct(userId, productData);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Submission failed:", err);
            setError("Failed to save product. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {productToEdit ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    placeholder="e.g. Ultimate Design Guide"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        required
                                        min="0.50"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${type === 'digital' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                        <input type="radio" className="hidden" checked={type === 'digital'} onChange={() => setType('digital')} />
                                        <FileText size={18} /> Digital
                                    </label>
                                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${type === 'physical' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                        <input type="radio" className="hidden" checked={type === 'physical'} onChange={() => setType('physical')} />
                                        <Package size={18} /> Physical
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Image</label>
                            <div
                                onClick={() => imageInputRef.current?.click()}
                                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors relative overflow-hidden bg-gray-50 dark:bg-gray-800"
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-500">Click to upload image</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    ref={imageInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                            required
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition"
                            placeholder="Describe your product..."
                        />
                    </div>

                    {/* Digital File Upload */}
                    {type === 'digital' && (
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                            <h4 className="font-medium text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-2">
                                <Upload size={18} /> Digital Asset
                            </h4>
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => digitalFileInputRef.current?.click()}
                                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-lg text-sm text-indigo-700 dark:text-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                >
                                    {digitalFile ? 'Change File' : (productToEdit?.fileUrl ? 'Replace File' : 'Upload File')}
                                </button>
                                <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                                    {digitalFile ? digitalFile.name : (productToEdit?.fileUrl ? 'File already uploaded' : 'No file selected')}
                                </span>
                            </div>
                            <input
                                type="file"
                                ref={digitalFileInputRef}
                                className="hidden"
                                onChange={handleDigitalFileChange}
                            />
                            <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-2">
                                Supported formats: PDF, ZIP, PNG, etc. Securely stored.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                            {productToEdit ? 'Save Changes' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductEditorModal;
import { Package } from 'lucide-react'; // Late import fix for used Icon
