import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Info } from 'lucide-react';

interface OrderNowProps {
    theme: 'dark' | 'light';
}

const OrderNow: React.FC<OrderNowProps> = ({ theme }) => {
    const { t } = useTranslation();
    const tOrder = (key: string, options?: Record<string, unknown>) => t(`nfc_order.${key}`, options);
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
        { number: 1, label: tOrder('steps.design'), active: true },
        { number: 2, label: tOrder('steps.shipping'), active: false },
        { number: 3, label: tOrder('steps.confirmation'), active: false },
        { number: 4, label: tOrder('steps.tap_tag_actions'), active: false },
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
                        <h2 className="text-3xl font-bold text-gray-900">{tOrder('select_title')}</h2>

                        {/* Product Cards */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Custom Card */}
                            <button
                                onClick={() => setSelectedType('custom')}
                                className={`p-6 rounded-xl border-2 text-left transition-all ${selectedType === 'custom' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                            >
                                <div className="w-16 h-16 bg-gray-900 rounded-full mb-4 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">{tOrder('product.custom.badge')}</span>
                                </div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900">{tOrder('product.custom.title')}</h3>
                                    <span className="font-semibold text-gray-900">{tOrder('price_each', { price: prices.custom.toFixed(2) })}</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {tOrder('product.custom.description')}
                                </p>
                            </button>

                            {/* Standard Card */}
                            <button
                                onClick={() => setSelectedType('standard')}
                                className={`p-6 rounded-xl border-2 text-left transition-all relative ${selectedType === 'standard' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                            >
                                <span className="absolute top-4 right-4 px-2 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                                    {tOrder('product.standard.badge')}
                                </span>
                                <div className="w-16 h-16 bg-gray-400 rounded-full mb-4 flex items-center justify-center">
                                    <span className="text-white text-xs">{tOrder('product.standard.icon_label')}</span>
                                </div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900">{tOrder('product.standard.title')}</h3>
                                    <span className="font-semibold text-gray-900">{tOrder('price_each', { price: prices.standard.toFixed(2) })}</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {tOrder('product.standard.description')}
                                </p>
                            </button>
                        </div>

                        {/* Color Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">{tOrder('color.label')}</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedColor('black')}
                                    className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 ${selectedColor === 'black' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}
                                >
                                    <span className="w-4 h-4 rounded-full bg-gray-900" />
                                    <span className="text-sm font-medium">{tOrder('color.black')}</span>
                                </button>
                                <button
                                    onClick={() => setSelectedColor('white')}
                                    className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 ${selectedColor === 'white' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}
                                >
                                    <span className="w-4 h-4 rounded-full bg-white border border-gray-300" />
                                    <span className="text-sm font-medium">{tOrder('color.white')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Logo Upload */}
                        {selectedType === 'custom' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">{tOrder('logo.label')}</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                                    <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                                    <p className="text-gray-600">{tOrder('logo.drop_prompt')}</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {tOrder('logo.recommendation')}
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
                                    <p className="font-medium text-gray-900">{tOrder('options.match_logo.title')}</p>
                                    <p className="text-sm text-gray-500">{tOrder('options.match_logo.description')}</p>
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
                                    <p className="font-medium text-gray-900">{tOrder('options.include_qr.title')}</p>
                                    <p className="text-sm text-gray-500">{tOrder('options.include_qr.description')}</p>
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
                                    <p className="font-medium text-gray-900">{tOrder('options.metal_surface.title')}</p>
                                    <p className="text-sm text-gray-500">{tOrder('options.metal_surface.description', { price: prices.metalSurface.toFixed(2) })}</p>
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
                                    <p className="font-medium text-gray-900">{tOrder('options.ios_app_clip.title')}</p>
                                    <p className="text-sm text-gray-500">{tOrder('options.ios_app_clip.description')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Quantity Section */}
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{tOrder('quantity.title')}</h3>
                            <p className="text-gray-500 mb-6">{tOrder('quantity.description')}</p>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{tOrder('quantity.location_label')}</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder={tOrder('quantity.location_placeholder')}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{tOrder('quantity.quantity_label')}</label>
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
                                {tOrder('notice')}
                            </p>
                            <button className="ml-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                                {tOrder('summary.next')}
                            </button>
                        </div>
                    </div>

                    {/* Order Summary - Right column */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-6">
                            {/* Preview */}
                            <div className="text-center">
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">{tOrder('summary.preview')}</p>
                                <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center ${selectedColor === 'black' ? 'bg-gray-900' : 'bg-white border-2 border-gray-200'}`}>
                                    <div className="text-center">
                                        <p className={`text-xs font-bold ${selectedColor === 'black' ? 'text-white' : 'text-gray-900'}`}>
                                            {tOrder('summary.preview_lines.line1')}<br />{tOrder('summary.preview_lines.line2')}<br />{tOrder('summary.preview_lines.line3')}<br />{tOrder('summary.preview_lines.line4')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="font-bold text-gray-900 mb-4">{tOrder('summary.title')}</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{selectedType === 'custom' ? tOrder('summary.custom_tags') : tOrder('summary.standard_tags')}</span>
                                        <span className="font-medium">${(selectedType === 'custom' ? prices.custom : prices.standard).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{tOrder('summary.quantity')}</span>
                                        <span className="font-medium">{quantity}</span>
                                    </div>
                                    {options.metalSurface && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">{tOrder('summary.metal_surface_add_on')}</span>
                                            <span className="font-medium">+${(prices.metalSurface * quantity).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{tOrder('summary.sales_tax')}</span>
                                        <span className="font-medium">$0.00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">{tOrder('summary.shipping')}</span>
                                        <span className="font-medium text-green-600">{tOrder('summary.free')}</span>
                                    </div>
                                    <hr className="my-2" />
                                    <div className="flex justify-between text-lg">
                                        <span className="font-bold text-gray-900">{tOrder('summary.total')}</span>
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
