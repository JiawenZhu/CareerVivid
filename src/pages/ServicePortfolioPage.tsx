
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal, PenTool, Globe, ArrowRight, MessageSquare,
    CheckCircle, Wifi, Smartphone, Layout, Send, Github,
    Play, Volume2
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const ServicePortfolioPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        serviceType: 'IT Services',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // Handle Form Submission
    // Handle Form Submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Write to the same 'contact_messages' collection that the Contact Page uses.
            // This will trigger the 'onContactMessageCreated' Cloud Function to send the email.
            await addDoc(collection(db, 'contact_messages'), {
                name: formData.name,
                email: formData.email,
                subject: `New Inquiry: ${formData.serviceType}`, // Auto-generate subject
                message: formData.message,
                serviceType: formData.serviceType, // store extra field
                status: 'unread',
                timestamp: serverTimestamp(),
                source: 'service_portfolio_page'
            });

            setShowToast(true);
            setFormData({ name: '', email: '', serviceType: 'IT Services', message: '' });
            setTimeout(() => setShowToast(false), 3000);
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Failed to send message. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const scrollToContact = () => {
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handlePlanSelect = (planName: string) => {
        setFormData(prev => ({
            ...prev,
            serviceType: planName,
            message: `I'm interested in the ${planName} layout.`
        }));
        scrollToContact();
    };

    // Helper component for social videos
    const SocialVideoCard = ({ src, title, subtitle }: { src: string, title: string, subtitle: string }) => {
        const videoRef = useRef<HTMLVideoElement>(null);
        const [isHovered, setIsHovered] = useState(false);
        const [isLoading, setIsLoading] = useState(true);

        useEffect(() => {
            if (videoRef.current) {
                videoRef.current.muted = !isHovered; // Unmute on hover
                if (isHovered) {
                    videoRef.current.play().catch(() => { });
                } else {
                    videoRef.current.pause();
                    videoRef.current.currentTime = 0; // Reset on leave
                }
            }
        }, [isHovered]);

        return (
            <div
                className="relative aspect-[9/16] bg-black rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-[#4ADE80] transition-all duration-300 shadow-lg hover:shadow-2xl cursor-pointer group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                        <div className="w-8 h-8 border-4 border-[#4ADE80] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                <video
                    ref={videoRef}
                    src={src}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    loop
                    playsInline
                    muted
                    preload="metadata"
                    onLoadedData={() => setIsLoading(false)}
                />

                {/* Overlay Icon */}
                <div className={`absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                        <Play fill="white" className="text-white ml-1" size={20} />
                    </div>
                </div>

                {/* Title Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-20">
                    <h4 className="text-white font-bold text-lg leading-tight mb-1">{title}</h4>
                    <p className="text-gray-300 text-xs font-medium uppercase tracking-wider">{subtitle}</p>
                </div>

                {/* Sound Indicator */}
                <div className={`absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <Volume2 size={12} />
                    <span>On</span>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-[#4ADE80] selection:text-black">
            {/* Toast Notification */}
            {showToast && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-8 right-8 bg-black text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 z-50 border border-[#4ADE80]"
                >
                    <CheckCircle className="text-[#4ADE80]" size={24} />
                    <div>
                        <h4 className="font-bold">Message Sent!</h4>
                        <p className="text-sm text-gray-400">We'll get back to you shortly.</p>
                    </div>
                </motion.div>
            )}

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <span className="bg-black text-white p-1 rounded">CV</span> Careervivid
                    </div>

                    <div className="hidden md:flex items-center gap-8 font-medium text-gray-600">
                        <a href="#services" className="hover:text-black transition-colors">Services</a>
                        <a href="#portfolio" className="hover:text-black transition-colors">Portfolio</a>
                        <a href="#pricing" className="hover:text-black transition-colors">Pricing</a>
                        <a href="#contact" className="hover:text-black transition-colors">Contact</a>
                    </div>

                    <button
                        onClick={scrollToContact}
                        className="bg-[#4ADE80] hover:bg-[#3ec46d] text-black px-6 py-2.5 rounded-md font-bold transition-transform hover:scale-105 active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-x-[0px] translate-y-[0px] hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto min-h-[90vh] flex flex-col md:flex-row items-center gap-16">
                <div className="flex-1 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-block px-4 py-1 bg-gray-100 rounded-full text-sm font-bold text-gray-600 border border-gray-200"
                    >
                        Local Business Specialist 🚀
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-6xl md:text-7xl font-black leading-[0.9] tracking-tight"
                    >
                        Digital Solutions for <span className="text-gray-400 line-through decoration-[#4ADE80] decoration-4">Boring</span> Local Businesses.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-xl text-gray-600 max-w-lg leading-relaxed"
                    >
                        From IT Support to Stunning Menu Designs. We automate your tech so you can focus on what matters most—your business.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <button onClick={scrollToContact} className="px-8 py-4 bg-black text-white font-bold text-lg rounded-md hover:bg-gray-800 transition-all flex items-center justify-center gap-2 group">
                            Book Consultation <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </button>
                        <a href="#portfolio" className="px-8 py-4 bg-white text-black font-bold text-lg rounded-md border-2 border-black hover:bg-gray-50 transition-all flex items-center justify-center">
                            View Work
                        </a>
                    </motion.div>
                </div>

                {/* Hero Visual - Chat/Card UI */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex-1 relative w-full flex justify-center"
                >
                    <div className="relative w-full max-w-md bg-white border-2 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b-2 border-black flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400 border border-black"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400 border border-black"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400 border border-black"></div>
                            </div>
                            <span className="font-mono text-xs font-bold text-gray-400">STATUS: ONLINE</span>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Chat Bubble 1 */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 border-2 border-black overflow-hidden bg-[url('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix')] bg-cover"></div>
                                <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none border border-gray-200 max-w-[80%]">
                                    <p className="text-sm font-bold mb-1">Client Request</p>
                                    <p className="text-gray-600 text-sm">Our guest WiFi is down and we need a new menu design for the weekend special. urgent!</p>
                                </div>
                            </div>

                            {/* Chat Bubble 2 (Response) */}
                            <div className="flex gap-4 flex-row-reverse">
                                <div className="w-10 h-10 bg-[#4ADE80] rounded-full flex-shrink-0 border-2 border-black flex items-center justify-center font-bold">CV</div>
                                <div className="bg-black text-white p-4 rounded-2xl rounded-tr-none max-w-[80%]">
                                    <p className="text-sm font-bold mb-1 text-[#4ADE80]">Careervivid</p>
                                    <p className="text-gray-300 text-sm">On it! ⚡️ WiFi diagnostics running remotely. Draft menu sent below.</p>
                                </div>
                            </div>

                            {/* Action Card */}
                            <div className="ml-14 bg-white border-2 border-dashed border-gray-300 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <CheckCircle className="text-[#4ADE80]" size={20} />
                                    <span className="font-bold text-sm">Tasks Completed</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs p-2 bg-gray-50 rounded border">
                                        <span className="text-gray-600">WiFi Optimization</span>
                                        <span className="font-bold text-green-600">DONE</span>
                                    </div>
                                    <div className="flex justify-between text-xs p-2 bg-gray-50 rounded border">
                                        <span className="text-gray-600">Menu Design v1</span>
                                        <span className="font-bold text-green-600">SENT</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-24 bg-[#F9FAFB] px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16">
                        <h2 className="text-5xl font-black mb-6 uppercase tracking-tight">Services</h2>
                        <div className="w-24 h-2 bg-[#4ADE80]"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-shadow group">
                            <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#4ADE80] transition-colors">
                                <Terminal size={32} className="text-black" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">IT Services</h3>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                Hardware troubleshooting, smart home installations, and network optimization. We ensure your business tech never fails.
                            </p>
                            <ul className="space-y-2 text-sm font-medium text-gray-500">
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-[#4ADE80]" /> Tech Support & Repair</li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-[#4ADE80]" /> WiFi Optimization</li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-[#4ADE80]" /> Smart Office Setup</li>
                            </ul>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-shadow group">
                            <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#4ADE80] transition-colors">
                                <PenTool size={32} className="text-black" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Design Services</h3>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                Eye-catching visuals for social media and print. We design menus, posters, and assets that drive foot traffic.
                            </p>
                            <ul className="space-y-2 text-sm font-medium text-gray-500">
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-[#4ADE80]" /> Canva Menus</li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-[#4ADE80]" /> Instagram Posters/Stories</li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-[#4ADE80]" /> E-books & Guides</li>
                            </ul>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-shadow group">
                            <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#4ADE80] transition-colors">
                                <Globe size={32} className="text-black" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Web Development</h3>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                Fast, responsive websites that rank. From simple bio-links to full-scale Next.js web applications.
                            </p>
                            <ul className="space-y-2 text-sm font-medium text-gray-500">
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-[#4ADE80]" /> Next.js & React Sites</li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-[#4ADE80]" /> SEO Optimization</li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-[#4ADE80]" /> Custom Bio-Links</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Portfolio Showcase Section (Bento Grid) */}
            <section id="portfolio" className="py-24 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                    <div>
                        <h2 className="text-5xl font-black mb-6 uppercase tracking-tight">Recent Work</h2>
                        <div className="w-24 h-2 bg-black"></div>
                    </div>
                    <p className="text-gray-500 font-medium mt-4 md:mt-0 max-w-sm text-right">
                        A selection of our latest projects across design, development, and IT solutions.
                    </p>
                </div>

                {/* Social Media Video Grid */}
                <div className="mb-16">
                    <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                        <span className="w-2 h-8 bg-[#4ADE80] rounded-full"></span>
                        Social Media Content
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SocialVideoCard
                            src="https://storage.googleapis.com/jastalk-firebase.firebasestorage.app/public/ticktok_video_assets/copy_3C83D03B-12CA-4859-A4E9-05C077D64CF5.MOV?GoogleAccessId=firebase-adminsdk-fbsvc%40jastalk-firebase.iam.gserviceaccount.com&Expires=16730344800&Signature=jHNMbK53u6sbL%2FOOaaJHbGvi4tKrBLKuadWOXDbwWdpeI2%2FaMdS6VnnOjwEeya9FqxJmu%2Bo42dKzmgG8hHvg1YyGayD1PtWikR%2BKwl2aTA4z5Jetlol2TXvrr%2BE2pL99JoUAny06nSYHUAh5EVZH70B1kxr9BNtz84KozZEpZLA12a9Ii63dFfg3w981cTnjca7DmoUNFioPHM2k9sOpyEMcnIPIdrfD470FBP1pFVIGkVamSrrTz7hkm44HiCHJ90FJn%2B%2BlJIL5yuCTDpPnYoj3AAkmkd9qUKOuWbA8IsMpUgc6pH3fIOJ%2FSSDBN1WeXr3KFkDpaihOZW8DN1S2ZQ%3D%3D"
                            title="Social Media Content"
                            subtitle="Engaging & Viral"
                        />

                        <SocialVideoCard
                            src="https://storage.googleapis.com/jastalk-firebase.firebasestorage.app/public/ticktok_video_assets/copy_6DDEDA94-5A0C-46BF-8C5C-CC93A3BBCDAC.MOV?GoogleAccessId=firebase-adminsdk-fbsvc%40jastalk-firebase.iam.gserviceaccount.com&Expires=16730344800&Signature=qNCIKd09xCmgnS8FsvDfib15%2BvrMdBCGNR5KyDh%2FRsDREfF9JJ6it9l99Hfa4spb1Hl4W%2Bva8Bpw%2BI9hvHc5EQPToEhIGMJFPLSNd0bFa1C6FQHaqtGXvdFOjFj8cpR83SXzcWFtTk%2FBa1hopDKrywAdbDHPLrmn%2BCkWlA7wYzxE%2BFc9QTdaWhUAjs3mUq8dHhOj1F1E4%2Fo%2BKPNzEw%2FVI2IfgaqwNtoA6MhK3zMOlTej%2BBnuVfbVZtVE53jtrNAvl6jqVwjWqrepK2sBXxO4dCMNxjnGBsN8C%2BsKUIawi0jfH7iu%2BECQcjqeUmfQ07AEStRTl0NwoBmMbfGNkmrDTA%3D%3D"
                            title="Social Media Content"
                            subtitle="Engaging & Viral"
                        />

                        <SocialVideoCard
                            src="https://storage.googleapis.com/jastalk-firebase.firebasestorage.app/public/ticktok_video_assets/638207DC-0FD3-46FD-AE7B-033004504D85.MOV?GoogleAccessId=firebase-adminsdk-fbsvc%40jastalk-firebase.iam.gserviceaccount.com&Expires=16730344800&Signature=MBi%2BowOw5Kyp0QGelzSC1mi4u%2FgqCcGHEatC8wrguMRrCdIltU8Gmyq7SungDyLmzNVaj57doo8F1u5nZc3ZhKs5pvRUcigzCdsAjOH6CTdeZDnbshgNtHdnHwJh%2BmgYHMpNgL6xDAORqaQwYkSidkAbb%2BMDajX%2BYHQ4uuYRQAnz0Haud5C0EUhqOmw7ZL1XvKBDY9Wdf9lUQ8n49n47DFE%2Bn%2BlP%2BKmbA7Y8NLcN2B2OVF5FkA5fiyZcOQCjieSBINpy5eZ7mG1kDnTRzev0X%2BilLWytgAPE6%2BRPDcd8Hzpc2HTrEkiUFxyEJP6IhdmUmaAvUYKHQHeh9fE8NXTm5w%3D%3D"
                            title="Digital Strategy"
                            subtitle="Business Growth"
                        />
                    </div>
                </div>

                {/* Project Grid */}
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                    <span className="w-2 h-8 bg-[#4ADE80] rounded-full"></span>
                    UI/UX & Web Design
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Project 1 - HealthWell */}
                    <a href="https://www.healthwell.group/" target="_blank" rel="noopener noreferrer" className="group flex flex-col justify-between p-8 bg-white rounded-2xl border border-gray-200 hover:border-black hover:shadow-lg transition-all duration-300">
                        <div>
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Globe className="text-green-600" size={24} />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 group-hover:text-green-600 transition-colors">HealthWell Platform</h3>
                            <p className="text-gray-500 mb-6 leading-relaxed">
                                Redesigned and deployed a responsive appointment booking platform for a health startup, improving UI/UX and increasing customer bookings by over 90% in just two months.
                            </p>
                            <div className="flex flex-wrap gap-2 mb-8">
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">React</span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">Node.js</span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">UI/UX</span>
                            </div>
                        </div>
                        <div className="flex items-center text-sm font-bold text-black group-hover:translate-x-1 transition-transform">
                            View Project <ArrowRight className="ml-2" size={16} />
                        </div>
                    </a>

                    {/* Project 2 - Bio-Link Builder */}
                    <a href="/bio-links" target="_blank" rel="noopener noreferrer" className="group flex flex-col justify-between p-8 bg-white rounded-2xl border border-gray-200 hover:border-black hover:shadow-lg transition-all duration-300">
                        <div>
                            {/* Updated Image for Bio-Links */}
                            <div className="w-full h-48 mb-6 overflow-hidden rounded-xl bg-gray-100 relative">
                                <img
                                    src="/projects/bio-link-builder.png"
                                    alt="Bio-Link Portfolio Builder"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg border border-gray-200 shadow-sm">
                                    <Layout className="text-purple-600" size={20} />
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold mb-3 group-hover:text-purple-600 transition-colors">Bio-Link Portfolio Builder</h3>
                            <p className="text-gray-500 mb-6 leading-relaxed">
                                A flagship internal product allowing professionals to launch stunning, customizable micro-portfolios in seconds. Features an intuitive no-code editor, diverse themes from "Neo-Brutalism" to "Minimalist", and instant global deployment.
                            </p>
                            <div className="flex flex-wrap gap-2 mb-8">
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">Product Design</span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">React Platform</span>
                            </div>
                        </div>
                        <div className="flex items-center text-sm font-bold text-black group-hover:translate-x-1 transition-transform">
                            Try It Live <ArrowRight className="ml-2" size={16} />
                        </div>
                    </a>

                    {/* Project 3 - Interactive Quiz & Survey Engine */}
                    <a href="https://jiawenzhu.github.io/profile/project_idea/quiz/quiz" target="_blank" rel="noopener noreferrer" className="group flex flex-col justify-between p-8 bg-white rounded-2xl border border-gray-200 hover:border-black hover:shadow-lg transition-all duration-300">
                        <div>
                            {/* Re-introduced Image as requested */}
                            <div className="w-full h-48 mb-6 overflow-hidden rounded-xl bg-gray-100 relative">
                                <img
                                    src="/projects/quiz-app.png"
                                    alt="Interactive Quiz & Survey App"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg border border-gray-200 shadow-sm">
                                    <CheckCircle className="text-blue-600" size={20} />
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-600 transition-colors">Interactive Quiz & Survey Engine</h3>
                            <p className="text-gray-500 mb-6 leading-relaxed">
                                A versatile data collection tool perfect for market research, employee feedback, or educational testing. Fully customizable to match your brand and capture the specific insights relevant to your business scenarios.
                            </p>
                            <div className="flex flex-wrap gap-2 mb-8">
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">Data Collection</span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">Google Sheets Integration</span>
                            </div>
                        </div>
                        <div className="flex items-center text-sm font-bold text-black group-hover:translate-x-1 transition-transform">
                            View Project <ArrowRight className="ml-2" size={16} />
                        </div>
                    </a>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-white border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight">Flexible Pricing Plans</h2>
                        <p className="text-gray-500 max-w-xl mx-auto">Choose the level of support that fits your business needs. From quick fixes to full-scale automation.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                        {/* Card 1: The Quick Fix */}
                        <div className="p-8 border-2 border-gray-200 rounded-2xl hover:border-black transition-colors">
                            <h3 className="text-2xl font-black uppercase mb-2">The Quick Fix</h3>
                            <div className="text-gray-500 text-sm font-bold mb-6">Small Updates</div>
                            <div className="text-3xl font-black mb-8">$50 - $150 <span className="text-sm font-medium text-gray-400">/ service</span></div>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                    <CheckCircle size={16} className="text-black" /> Professional UX/UI & Website Design
                                </li>
                                <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                    <CheckCircle size={16} className="text-black" /> Single Menu Redesign (Canva)
                                </li>
                                <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                    <CheckCircle size={16} className="text-black" /> Digital Business Card Setup
                                </li>
                                <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                    <CheckCircle size={16} className="text-black" /> WiFi/Printer Troubleshooting
                                </li>
                            </ul>

                            <button
                                onClick={() => handlePlanSelect("Small Updates ($50-$150)")}
                                className="w-full py-3 border-2 border-black text-black font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors rounded-lg"
                            >
                                Book Appointment
                            </button>
                        </div>

                        {/* Card 2: Digital Essentials */}
                        <div className="p-8 bg-gray-50 border border-gray-200 rounded-2xl relative">
                            <h3 className="text-2xl font-black uppercase mb-2">Digital Essentials</h3>
                            <div className="text-gray-500 text-sm font-bold mb-6">Consistent Growth</div>
                            <div className="text-3xl font-black mb-8">$200 <span className="text-sm font-medium text-gray-400">/ month</span></div>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                    <CheckCircle size={16} className="text-black" /> 2x Social Posters / week
                                </li>
                                <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                    <CheckCircle size={16} className="text-black" /> Google Maps Weekly Updates
                                </li>
                                <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                    <CheckCircle size={16} className="text-black" /> Hosting & Domain Mgmt
                                </li>
                                <li className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                    <CheckCircle size={16} className="text-black" /> Bio-link Pro Included
                                </li>
                            </ul>

                            <button
                                onClick={() => handlePlanSelect("Essentials Plan ($200/mo)")}
                                className="w-full py-3 bg-gray-800 text-white font-bold uppercase tracking-wide hover:bg-black transition-colors rounded-lg shadow-lg"
                            >
                                Start Essentials Plan
                            </button>
                        </div>

                        {/* Card 3: Full Tech Partner (Featured) */}
                        <div className="p-8 bg-white border-2 border-[#84CC16] shadow-[8px_8px_0px_#84CC16] rounded-2xl relative transform md:-translate-y-4">
                            <div className="absolute top-0 right-0 bg-[#84CC16] text-black text-xs font-black uppercase px-3 py-1 rounded-bl-lg rounded-tr-lg">Most Popular</div>
                            <h3 className="text-2xl font-black uppercase mb-2">Full Tech Partner</h3>
                            <div className="text-gray-500 text-sm font-bold mb-6">Total Automation</div>
                            <div className="text-3xl font-black mb-8">$500 <span className="text-sm font-medium text-gray-400">/ month</span></div>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-sm font-bold text-gray-900">
                                    <CheckCircle size={18} className="text-[#84CC16]" /> Full Instagram Management
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-gray-900">
                                    <CheckCircle size={18} className="text-[#84CC16]" /> 7-10x Posts/Week (Daily)
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-gray-900">
                                    <CheckCircle size={18} className="text-[#84CC16]" /> Unlimited Priority IT Support
                                </li>
                                <li className="flex items-center gap-3 text-sm font-bold text-gray-900">
                                    <CheckCircle size={18} className="text-[#84CC16]" /> Website Redesign & SEO
                                </li>
                            </ul>

                            <button
                                onClick={() => handlePlanSelect("Partner Plan ($500/mo)")}
                                className="w-full py-4 bg-[#84CC16] text-black font-black uppercase tracking-wide hover:bg-[#a3e635] transition-colors rounded-lg shadow-lg hover:shadow-xl"
                            >
                                Become a Partner
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-24 bg-gray-900 text-white px-6">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Upgrade?</h2>
                    <p className="text-xl text-gray-400">Tell us what you need. We usually respond within 2 hours.</p>
                </div>

                <div className="max-w-2xl mx-auto bg-white text-black p-8 md:p-12 rounded-2xl shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 font-medium focus:outline-none focus:border-black focus:bg-white transition-all"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 font-medium focus:outline-none focus:border-black focus:bg-white transition-all"
                                    placeholder="john@business.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Service Type</label>
                            <select
                                name="serviceType"
                                value={formData.serviceType}
                                onChange={handleInputChange}
                                className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 font-medium focus:outline-none focus:border-black focus:bg-white transition-all appearance-none"
                            >
                                <option>IT Services</option>
                                <option>Design Services</option>
                                <option>Web Development</option>
                                <option>Small Updates ($50-$150)</option>
                                <option>Essentials Plan ($200/mo)</option>
                                <option>Partner Plan ($500/mo)</option>
                                <option>Other / General Inquiry</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Message</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                required
                                rows={4}
                                className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 font-medium focus:outline-none focus:border-black focus:bg-white transition-all resize-none"
                                placeholder="Tell us about your project..."
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#4ADE80] text-black font-black text-lg py-4 rounded-lg hover:bg-[#3ec46d] transition-all transform hover:-translate-y-1 shadow-lg disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <span>Sending...</span>
                            ) : (
                                <>Send Request <Send size={20} /></>
                            )}
                        </button>
                    </form>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black text-white py-12 px-6 border-t border-gray-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-2xl font-black">Careervivid</div>
                    <div className="text-gray-400 text-sm">© {new Date().getFullYear()} Careervivid. All rights reserved.</div>
                    <div className="flex gap-6">
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">Instagram</a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">LinkedIn</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ServicePortfolioPage;
