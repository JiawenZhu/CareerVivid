import React, { useState } from 'react';
import { Upload, Info, ChevronDown } from 'lucide-react';

interface OrderNowProps {
    theme: 'dark' | 'light';
}

const OrderNow: React.FC<OrderNowProps> = ({ theme }) => {
    const [selectedType, setSelectedType] = useState<'custom' | 'standard'>('custom');
    const [selectedColor, setSelectedColor] = useState<'black' | 'white'>('black');
    const [quantity, setQuantity] = useState<number>(10);
    const [location, setLocation] = useState('');
    const [options, setOptions] = useState({
        matchLogo: false,
        includeQR: true,
        metalSurface: false,
        iosAppClip: false
    });

    const prices = {
        custom: 2.00,
        standard: 1.00,
        metalSurface: 0.50
    };

    const calculateTotal = () => {
        let basePrice = selectedType === 'custom' ? prices.custom : prices.standard;
        if (options.metalSurface) basePrice += prices.metalSurface;
        return (basePrice * quantity).toFixed(2);
    };

    const steps = [
        { number: 1, label: 'Design', active: true },
        { number: 2, label: 'Shipping', active: false },
        { number: 3, label: 'Confirmation', active: false },
        { number: 4, label: 'Tap Tag Actions', active: false },
    ];

    return (
        <section
            id="order-now"
            className="min-h-screen py-20 px-6 md:px-12 bg-gray-50"
        >
            <div className="max-w-6xl mx-auto">
                {/* Step Progress Bar */}
                <div className="flex items-center justify-center gap-4 mb-12">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.number}>
                            <div className="flex items-center gap-2">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step.active ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {step.number}
                                </span>
                                <span className={`text-sm font-medium ${step.active ? 'text-indigo-600' : 'text-gray-400'}`}>
                                    {step.label}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className="w-16 h-px bg-gray-300" />
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
                                    <span className="font-semibold text-gray-900">${prices.custom.toFixed(2)} ea.</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    A custom, 4-inch tap tag with your logo, and an optional QR code that ships in 5-7 weeks.
                                </p>
                            </button>

                            {/* Standard Card */}
                            <button
                                onClick={() => setSelectedType('standard')}
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
                                    <span className="font-semibold text-gray-900">${prices.standard.toFixed(2)} ea.</span>
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
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                                    <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                                    <p className="text-gray-600">Drop a PNG logo here or click to upload</p>
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
                                    className={`w-12 h-6 rounded-full relative transition-colors ${options.matchLogo ? 'bg-indigo-600' : 'bg-gray-300'}`}
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
                                    className={`w-12 h-6 rounded-full relative transition-colors ${options.includeQR ? 'bg-indigo-600' : 'bg-gray-300'}`}
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
                                    className={`w-12 h-6 rounded-full relative transition-colors ${options.metalSurface ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${options.metalSurface ? 'left-7' : 'left-1'}`} />
                                </button>
                                <div>
                                    <p className="font-medium text-gray-900">Works with metal surfaces</p>
                                    <p className="text-sm text-gray-500">Allows your tap tags to work when attached to metal. Adds ${prices.metalSurface.toFixed(2)} per tag.</p>
                                </div>
                            </div>

                            {/* iOS App Clip */}
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={() => setOptions(prev => ({ ...prev, iosAppClip: !prev.iosAppClip }))}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${options.iosAppClip ? 'bg-indigo-600' : 'bg-gray-300'}`}
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
                        <div className="flex items-center gap-3 p-4 bg-gray-100 rounded-xl">
                            <Info className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            <p className="text-sm text-gray-600">
                                You will customize the tap tag action after you complete your order.
                            </p>
                            <button className="ml-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                                Next
                            </button>
                        </div>
                    </div>

                    {/* Order Summary - Right column */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-6">
                            {/* Preview */}
                            <div className="text-center">
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Preview</p>
                                <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center ${selectedColor === 'black' ? 'bg-gray-900' : 'bg-white border-2 border-gray-200'}`}>
                                    <div className="text-center">
                                        <p className={`text-xs font-bold ${selectedColor === 'black' ? 'text-white' : 'text-gray-900'}`}>
                                            TAP<br />YOUR<br />PHONE<br />HERE
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{selectedType === 'custom' ? 'Custom' : 'Standard'} Tags</span>
                                        <span className="font-medium">${(selectedType === 'custom' ? prices.custom : prices.standard).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Quantity</span>
                                        <span className="font-medium">{quantity}</span>
                                    </div>
                                    {options.metalSurface && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Metal Surface Add-on</span>
                                            <span className="font-medium">+${(prices.metalSurface * quantity).toFixed(2)}</span>
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default OrderNow;
