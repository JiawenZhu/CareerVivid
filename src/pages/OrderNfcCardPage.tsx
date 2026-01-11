import React, { useState, useRef } from 'react';
import { Upload, Info, Check, ArrowLeft, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { navigate } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { uploadImage } from '../services/storageService';

const OrderNfcCardPage: React.FC = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedType, setSelectedType] = useState<'custom' | 'standard'>('custom');
    const [selectedColor, setSelectedColor] = useState<'black' | 'white'>('black');
    const [quantity, setQuantity] = useState<number>(1);
    const [location, setLocation] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [options, setOptions] = useState({
        matchLogo: false,
        includeQR: true,
        metalSurface: false,
        iosAppClip: false
    });

    // Stripe Price IDs
    const PRODUCTS = {
        custom: {
            id: 'price_1So67jRJNflGxv32TKsC7AbX',
            price: 12.90,
            label: 'Custom'
        },
        standard: {
            id: 'price_1So6AtRJNflGxv32qHMPnhwz',
            price: 9.89,
            label: 'Standard'
        }
    };

    const METAL_SURFACE_PRICE = 0.50;

    const calculateTotal = () => {
        let basePrice = PRODUCTS[selectedType].price;
        if (options.metalSurface) basePrice += METAL_SURFACE_PRICE;
        return (basePrice * quantity).toFixed(2);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('File is too large. Please upload an image under 5MB.');
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            const file = event.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                if (file.size > 5 * 1024 * 1024) {
                    alert('File is too large. Please upload an image under 5MB.');
                    return;
                }
                setLogoFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setLogoPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const removeLogo = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLogoFile(null);
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCheckout = async () => {
        if (!currentUser) {
            navigate('/signin?redirect=/order-nfc-card');
            return;
        }

        if (selectedType === 'custom' && !logoFile) {
            alert('Please upload a logo for your custom card.');
            return;
        }

        setIsLoading(true);
        try {
            let logoUrl = '';

            // Upload logo if present (for Custom cards)
            if (selectedType === 'custom' && logoFile) {
                const timestamp = Date.now();
                const path = `orders/${currentUser.uid}/${timestamp}_${logoFile.name}`;
                try {
                    logoUrl = await uploadImage(logoFile, path);
                } catch (uploadError) {
                    console.error("Logo upload failed:", uploadError);
                    alert("Failed to upload logo image. Please try again.");
                    setIsLoading(false);
                    return;
                }
            }

            const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');

            const result: any = await createCheckoutSession({
                priceId: PRODUCTS[selectedType].id,
                quantity: quantity,
                successUrl: `${window.location.origin}/#/order-nfc-card?success=true`,
                cancelUrl: `${window.location.origin}/#/order-nfc-card`,
                metadata: {
                    type: selectedType,
                    color: selectedColor,
                    location: location,
                    includeQR: options.includeQR ? 'yes' : 'no',
                    metalSurface: options.metalSurface ? 'yes' : 'no',
                    matchLogo: options.matchLogo ? 'yes' : 'no',
                    iosAppClip: options.iosAppClip ? 'yes' : 'no',
                    logoUrl: logoUrl,
                    userId: currentUser.uid
                }
            });

            if (result.data.url) {
                window.location.href = result.data.url;
            } else {
                console.error('No URL returned from checkout session creation');
                alert('Something went wrong initiating checkout. Please try again.');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Failed to start checkout. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const steps = [
        { number: 1, label: 'Design', active: true },
        { number: 2, label: 'Shipping', active: false },
        { number: 3, label: 'Confirmation', active: false },
        { number: 4, label: 'Tap Tag Actions', active: false },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/business-card')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Business Card</span>
                    </button>
                    <div className="font-semibold text-gray-900">Order NFC Card</div>
                    <div className="w-24"></div> {/* Spacer for centering */}
                </div>
            </div>

            <div className="max-w-6xl mx-auto py-12 px-6 md:px-12">
                {/* Step Progress Bar */}
                <div className="flex items-center justify-center gap-4 mb-12 overflow-x-auto pb-4">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.number}>
                            <div className="flex items-center gap-2 whitespace-nowrap">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step.active ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {step.number}
                                </span>
                                <span className={`text-sm font-medium ${step.active ? 'text-indigo-600' : 'text-gray-400'}`}>
                                    {step.label}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className="w-16 h-px bg-gray-300 min-w-[40px]" />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Form - Left 2 columns */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Section Title */}
                        <h2 className="text-3xl font-bold text-gray-900">Select Your Tap Tags</h2>

                        {/* Product Cards */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Custom Card */}
                            <button
                                onClick={() => setSelectedType('custom')}
                                className={`p-6 rounded-xl border-2 text-left transition-all ${selectedType === 'custom' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                            >
                                <div className="w-16 h-16 bg-gray-900 rounded-full mb-4 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">LOGO</span>
                                </div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900">Custom</h3>
                                    <span className="font-semibold text-gray-900">${PRODUCTS.custom.price.toFixed(2)} ea.</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    A custom, 4-inch tap tag with your logo, and an optional QR code that ships in 5-7 weeks.
                                </p>
                            </button>

                            {/* Standard Card */}
                            <button
                                onClick={() => {
                                    setSelectedType('standard');
                                    setLogoFile(null);
                                    setLogoPreview(null);
                                }}
                                className={`p-6 rounded-xl border-2 text-left transition-all relative ${selectedType === 'standard' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                            >
                                <span className="absolute top-4 right-4 px-2 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                                    Ships Fast
                                </span>
                                <div className="w-16 h-16 bg-gray-400 rounded-full mb-4 flex items-center justify-center">
                                    <span className="text-white text-xs">TAP</span>
                                </div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900">Standard</h3>
                                    <span className="font-semibold text-gray-900">${PRODUCTS.standard.price.toFixed(2)} ea.</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    An unbranded, 3-inch tap tag that ships in 3-5 business days.
                                </p>
                            </button>
                        </div>

                        {/* Color Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Color</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedColor('black')}
                                    className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 ${selectedColor === 'black' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}
                                >
                                    <span className="w-4 h-4 rounded-full bg-gray-900" />
                                    <span className="text-sm font-medium">Black</span>
                                </button>
                                <button
                                    onClick={() => setSelectedColor('white')}
                                    className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 ${selectedColor === 'white' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}
                                >
                                    <span className="w-4 h-4 rounded-full bg-white border border-gray-300" />
                                    <span className="text-sm font-medium">White</span>
                                </button>
                            </div>
                        </div>

                        {/* Logo Upload */}
                        {selectedType === 'custom' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Logo</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-white"
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleDrop}>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/png,image/jpeg,image/svg+xml"
                                        className="hidden"
                                    />
                                    {logoPreview ? (
                                        <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                                            <img src={logoPreview} alt="Logo Preview" className="h-32 object-contain mx-auto" />
                                            <button
                                                onClick={removeLogo}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <p className="text-sm text-indigo-600 mt-2 font-medium">{logoFile?.name}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                                            <p className="text-gray-600">Drop a PNG logo here or click to upload</p>
                                        </>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    We recommend a black or white PNG logo with a transparent background.
                                </p>
                            </div>
                        )}

                        {/* Options */}
                        <div className="space-y-4">
                            {/* Match Logo */}
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={() => setOptions(prev => ({ ...prev, matchLogo: !prev.matchLogo }))}
                                    className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${options.matchLogo ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${options.matchLogo ? 'left-7' : 'left-1'}`} />
                                </button>
                                <div>
                                    <p className="font-medium text-gray-900">Match logo to tap tag color</p>
                                    <p className="text-sm text-gray-500">We'll try to automatically match your logo to the tap tag color.</p>
                                </div>
                            </div>

                            {/* Include QR */}
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={() => setOptions(prev => ({ ...prev, includeQR: !prev.includeQR }))}
                                    className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${options.includeQR ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${options.includeQR ? 'left-7' : 'left-1'}`} />
                                </button>
                                <div>
                                    <p className="font-medium text-gray-900">Include QR code</p>
                                    <p className="text-sm text-gray-500">Adds a custom QR code to the tap tag that people can scan in addition to tapping.</p>
                                </div>
                            </div>

                            {/* Metal Surfaces */}
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={() => setOptions(prev => ({ ...prev, metalSurface: !prev.metalSurface }))}
                                    className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${options.metalSurface ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${options.metalSurface ? 'left-7' : 'left-1'}`} />
                                </button>
                                <div>
                                    <p className="font-medium text-gray-900">Works with metal surfaces</p>
                                    <p className="text-sm text-gray-500">Allows your tap tags to work when attached to metal. Adds ${METAL_SURFACE_PRICE.toFixed(2)} per tag.</p>
                                </div>
                            </div>

                            {/* iOS App Clip */}
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={() => setOptions(prev => ({ ...prev, iosAppClip: !prev.iosAppClip }))}
                                    className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${options.iosAppClip ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${options.iosAppClip ? 'left-7' : 'left-1'}`} />
                                </button>
                                <div>
                                    <p className="font-medium text-gray-900">Enable app clip iOS experience</p>
                                    <p className="text-sm text-gray-500">iPhone users receive a branded app clip pop-up.</p>
                                </div>
                            </div>
                        </div>

                        {/* Quantity Section */}
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">How Many Tap Tags Do You Need?</h3>
                            <p className="text-gray-500 mb-6">Order one batch or create multiple batches for different locations.</p>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Install location *</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="e.g., Office Lobby"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Info Notice */}
                        <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                            <Info className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            <p className="text-sm text-gray-600">
                                You will customize the tap tag action after you complete your order.
                            </p>
                        </div>
                    </div>

                    {/* Order Summary - Right column */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-6">
                            {/* Preview */}
                            <div className="text-center">
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Preview</p>
                                <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center shadow-xl transition-all ${selectedColor === 'black' ? 'bg-gray-900' : 'bg-white border-8 border-gray-100'}`}>
                                    <div className="text-center">
                                        <p className={`text-xs font-bold leading-tight ${selectedColor === 'black' ? 'text-white' : 'text-gray-900'}`}>
                                            TAP<br />YOUR<br />PHONE<br />HERE
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{selectedType === 'custom' ? 'Custom' : 'Standard'} Tags</span>
                                        <span className="font-medium">${PRODUCTS[selectedType].price.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Quantity</span>
                                        <span className="font-medium">{quantity}</span>
                                    </div>
                                    {options.metalSurface && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Metal Surface Add-on</span>
                                            <span className="font-medium">+${(METAL_SURFACE_PRICE * quantity).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Sales Tax</span>
                                        <span className="font-medium">$0.00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Shipping</span>
                                        <span className="font-medium text-green-600">Free</span>
                                    </div>
                                    <hr className="my-2" />
                                    <div className="flex justify-between text-lg">
                                        <span className="font-bold text-gray-900">Total</span>
                                        <span className="font-bold text-gray-900">${calculateTotal()}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={isLoading}
                                    className="w-full mt-6 px-6 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Next'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderNfcCardPage;
