import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Nfc, Check } from 'lucide-react';

interface HowItWorksProps {
    theme: 'dark' | 'light';
    selectedColor?: string;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ theme, selectedColor = '#FF69B4' }) => {
    const isDark = theme === 'dark';

    const features = [
        'Works with any NFC-enabled phone',
        'No app download required',
        'Instant contact sharing',
        'Unlimited taps, forever',
    ];

    return (
        <section
            id="how-it-works"
            className={`min-h-screen py-20 px-6 md:px-12 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}
        >
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className={`text-4xl md:text-6xl font-black mb-4 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        How It Works
                    </h2>
                    <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Share your digital identity with a single tap
                    </p>
                </div>

                {/* Two Column Layout */}
                <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
                    {/* Left Column - Content */}
                    <div className="order-2 md:order-1">
                        <h3 className={`text-3xl md:text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            NFC Tap Tags for Everyone
                        </h3>
                        <p className={`text-lg mb-8 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            Our NFC-enabled business cards use the same technology as contactless payments.
                            Just tap your card to any smartphone and instantly share your digital portfolio,
                            contact info, and social links.
                        </p>

                        {/* Feature List */}
                        <ul className="space-y-4">
                            {features.map((feature, index) => (
                                <motion.li
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center gap-3"
                                >
                                    <span className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </span>
                                    <span className={`text-lg ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                        {feature}
                                    </span>
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    {/* Right Column - Animation */}
                    <div className="order-1 md:order-2 flex justify-center items-center">
                        <div className="relative w-full max-w-md h-[500px]">
                            {/* NFC Card */}
                            <motion.div
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-40 rounded-2xl shadow-2xl flex items-center justify-center"
                                style={{ backgroundColor: selectedColor }}
                                initial={{ scale: 1 }}
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <div className="absolute top-3 right-3 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                    <Nfc className="w-5 h-5 text-white/80" />
                                </div>
                                <span className="text-white font-bold text-xl">Your Card</span>
                            </motion.div>

                            {/* Phone approaching */}
                            <motion.div
                                className={`absolute w-48 rounded-[2rem] overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-900'}`}
                                style={{ height: 380 }}
                                initial={{ x: 200, y: -100, rotate: 15 }}
                                animate={{
                                    x: [200, 50, 50, 200],
                                    y: [-100, 20, 20, -100],
                                    rotate: [15, 0, 0, 15]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    times: [0, 0.3, 0.7, 1]
                                }}
                            >
                                {/* Phone Notch */}
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full z-10" />

                                {/* Phone Screen */}
                                <div className="absolute inset-2 rounded-[1.5rem] bg-white overflow-hidden">
                                    {/* Notification */}
                                    <motion.div
                                        className="absolute top-16 left-4 right-4 bg-gray-100 rounded-xl p-4 shadow-lg"
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{
                                            opacity: [0, 0, 1, 1, 0],
                                            y: [-20, -20, 0, 0, -20]
                                        }}
                                        transition={{
                                            duration: 4,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            times: [0, 0.25, 0.35, 0.65, 0.75]
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: selectedColor }}
                                            >
                                                <Nfc className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">Open Link</p>
                                                <p className="text-xs text-gray-500">careervivid.app</p>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Browser Bar */}
                                    <motion.div
                                        className="absolute bottom-0 left-0 right-0 bg-gray-50 p-4"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: [0, 0, 0, 1, 1, 0] }}
                                        transition={{
                                            duration: 4,
                                            repeat: Infinity,
                                            times: [0, 0.4, 0.5, 0.55, 0.9, 1]
                                        }}
                                    >
                                        <div className="bg-white rounded-lg px-3 py-2 text-xs text-gray-500 text-center">
                                            careervivid.app/portfolio/...
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* Ripple Effect */}
                            <motion.div
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-4"
                                style={{ borderColor: selectedColor }}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{
                                    scale: [0.5, 2, 2.5],
                                    opacity: [0, 0.6, 0]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeOut",
                                    times: [0, 0.35, 0.5],
                                    delay: 0.3
                                }}
                            />
                            <motion.div
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-4"
                                style={{ borderColor: selectedColor }}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{
                                    scale: [0.5, 2.5, 3],
                                    opacity: [0, 0.4, 0]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeOut",
                                    times: [0, 0.35, 0.5],
                                    delay: 0.5
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
