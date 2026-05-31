import React, { useState, useEffect } from 'react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { Sparkles, Target, Zap, CheckCircle2, AlertCircle, Loader2, Gift, ArrowLeft } from 'lucide-react';
import { navigate } from '../utils/navigation';
import { useAuth } from '../contexts/AuthContext';

const editorialGridStyle: React.CSSProperties = {
    backgroundColor: '#f7f1e7',
    backgroundImage: 'linear-gradient(rgba(228, 211, 188, 0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(228, 211, 188, 0.32) 1px, transparent 1px)',
    backgroundSize: '48px 48px',
};

const ReferralLandingPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [referralCode, setReferralCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
    const [credits, setCredits] = useState(1000); // Monthly plan: 1000 AI Credits/Month

    // Get referral code from URL parameter
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const refCode = params.get('ref');
        if (refCode) {
            setReferralCode(refCode);
            validateCode(refCode);
        }
    }, []);

    const validateCode = async (code: string) => {
        if (!code || code.length < 4) {
            setValidationStatus('idle');
            return;
        }

        setIsValidating(true);

        // Simulate validation (replace with actual Firebase call)
        setTimeout(() => {
            // For demo: codes starting with 'q' are valid
            const isValid = code.startsWith('q') || code.length === 8;
            setValidationStatus(isValid ? 'valid' : 'invalid');
            if (isValid) {
                setCredits(1000); // Monthly plan: 1000 AI Credits/Month
            }
            setIsValidating(false);
        }, 800);
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const code = e.target.value.toUpperCase();
        setReferralCode(code);
        if (code.length >= 4) {
            validateCode(code);
        } else {
            setValidationStatus('idle');
        }
    };

    const handleSignUp = () => {
        // Navigate to signup with referral code
        navigate(`/signup?ref=${referralCode}`);
    };

    const benefits = [
        {
            icon: <Gift className="w-8 h-8 text-[#9a651f]" />,
            title: `${credits} AI Credits/Month`,
            description: 'Generate professional resume content with AI'
        },
        {
            icon: <Sparkles className="w-8 h-8 text-[#8b5a16]" />,
            title: 'All Premium Templates',
            description: 'Access to all professional resume templates'
        },
        {
            icon: <Target className="w-8 h-8 text-[#2f6f5e]" />,
            title: 'Unlimited Interview Practice',
            description: 'Mock interview sessions with AI coach'
        },
        {
            icon: <Zap className="w-8 h-8 text-[#a05a2c]" />,
            title: 'AI Photo Editing',
            description: 'Professional photo enhancement with AI'
        }
    ];

    return (
        <div className="min-h-screen flex flex-col font-sans text-[#211b16] selection:bg-[#ead9c3]" style={editorialGridStyle}>
            {currentUser ? (
                <div className="bg-[#fffaf1]/90 border-b border-[#e4d3bc] w-full mb-8 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-[#665a4a] hover:text-[#211b16] transition-colors font-bold text-[15px]"
                        >
                            <ArrowLeft className="w-[18px] h-[18px] stroke-[2.5]" />
                            <span>Dashboard</span>
                        </button>
                    </div>
                </div>
            ) : (
                <PublicHeader variant="editorial" />
            )}

            <main className="flex-grow">
                {/* ── Hero Section ── */}
                <section className="relative pt-12 lg:pt-20 pb-16 overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto w-full">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fffaf1]/90 border border-[#e4d3bc] text-[#8b5a16] text-sm font-bold mb-6 tracking-wide shadow-sm shadow-[#8b5a16]/5">
                            <span className="w-2 h-2 rounded-full bg-[#a97935] animate-pulse" />
                            Special Community Offer
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#211b16] tracking-tight leading-[1.1] mb-5">
                            Get{' '}
                            <span className="text-[#8b5a16]">
                                Free AI Credits
                            </span>
                        </h1>
                        <p className="text-lg sm:text-xl text-[#665a4a] font-medium leading-relaxed max-w-2xl mx-auto mb-10">
                            Sign up with a referral code and unlock premium features to accelerate your job search. Use AI to tailor your resume and track jobs seamlessly.
                        </p>

                        {/* Referral Code Input Container */}
                        <div className="w-full max-w-md mx-auto mb-6">
                            <div className="relative bg-[#fffaf1] rounded-lg shadow-xl shadow-[#8b5a16]/10 ring-1 ring-[#e4d3bc] p-2 border border-[#e4d3bc]">
                                <div className="absolute -top-3 left-6 px-2 bg-[#fffaf1] text-xs font-bold text-[#8b6a3f] uppercase tracking-widest">
                                    Referral Code
                                </div>
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        value={referralCode}
                                        onChange={handleCodeChange}
                                        placeholder="e.g., q9MYCaKn"
                                        className="w-full px-4 py-4 text-xl font-mono bg-transparent border-none focus:ring-0 text-[#211b16] placeholder-[#a8957f] transition-all outline-none"
                                    />
                                    <div className="absolute right-4 flex items-center">
                                        {isValidating && <Loader2 className="w-6 h-6 text-[#9a651f] animate-spin" />}
                                        {!isValidating && validationStatus === 'valid' && (
                                            <div className="bg-[#e8f0e6] p-1.5 rounded-full text-[#2f6f5e]">
                                                <CheckCircle2 size={20} />
                                            </div>
                                        )}
                                        {!isValidating && validationStatus === 'invalid' && (
                                            <div className="bg-[#f4d9d2] p-1.5 rounded-full text-[#9d3f2b]">
                                                <AlertCircle size={20} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="h-6 mt-3 flex justify-center items-center">
                                {validationStatus === 'valid' && (
                                    <p className="text-sm font-semibold text-[#2f6f5e] flex items-center gap-1.5">
                                        <Sparkles size={14} />
                                        Valid code! You'll receive {credits} AI credits
                                    </p>
                                )}
                                {validationStatus === 'invalid' && (
                                    <p className="text-sm font-semibold text-[#9d3f2b] flex items-center gap-1.5">
                                        <AlertCircle size={14} />
                                        Invalid referral code. Please check and try again.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* CTA Button */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button
                                onClick={handleSignUp}
                                disabled={validationStatus !== 'valid'}
                                className={`px-8 py-4 rounded-lg font-extrabold text-lg transition-all flex items-center justify-center gap-3 ${validationStatus === 'valid'
                                    ? 'bg-[#211b16] hover:bg-[#3a2f26] text-[#fffaf1] shadow-xl shadow-[#8b5a16]/15 hover:shadow-[#8b5a16]/25 transform hover:-translate-y-0.5 cursor-pointer'
                                    : 'bg-[#e9dcc8] text-[#9f917e] cursor-not-allowed'
                                    }`}
                            >
                                <Sparkles size={20} /> Sign Up & Get Credits
                            </button>
                            
                            <button
                                onClick={() => navigate('/signin')}
                                className="px-6 py-4 text-[#665a4a] hover:text-[#211b16] font-bold transition-colors"
                            >
                                Already have an account? Sign in
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── Benefits Section ── */}
                <section className="bg-[#fffaf1]/70 py-20 px-4 border-y border-[#e4d3bc]">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <p className="text-sm font-bold text-[#8b5a16] uppercase tracking-widest mb-2">Unlock Superpowers</p>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#211b16] tracking-tight">
                                What You'll Get
                            </h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {benefits.map((benefit, index) => (
                                <div
                                    key={index}
                                    className="bg-[#fffaf1] rounded-lg p-6 border border-[#e4d3bc] hover:border-[#bfa782] hover:shadow-xl hover:shadow-[#8b5a16]/10 transition-all duration-300 group"
                                >
                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6 bg-[#f7f1e7] shadow-sm border border-[#e4d3bc] group-hover:scale-105 transition-transform">
                                        {benefit.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-[#211b16] mb-3">
                                        {benefit.title}
                                    </h3>
                                    <p className="text-[#665a4a] font-medium leading-relaxed">
                                        {benefit.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── How It Works ── */}
                <section className="bg-[#f7f1e7]/80 py-20 px-4 border-t border-[#e4d3bc]">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#211b16] tracking-tight">
                                How It Works
                            </h2>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-x-12 gap-y-12 relative">
                            {/* Decorative line connecting nodes on larger screens */}
                            <div className="hidden sm:block absolute top-[50px] left-[10%] right-[10%] h-[2px] bg-[#e4d3bc]" />
                            
                            {[
                                { step: 1, title: 'Enter Referral Code', desc: 'Use the unique code shared by your friend or colleague.' },
                                { step: 2, title: 'Create Your Account', desc: 'Sign up with your email securely in just a few seconds.' },
                                { step: 3, title: 'Get Instant Credits', desc: 'Your promotional AI credits are automatically added to your wallet.' },
                                { step: 4, title: 'Start Building', desc: 'Use your credits to power the CLI agent and tailor your resume.' }
                            ].map((item) => (
                                <div key={item.step} className="flex gap-6 items-start relative z-10 bg-[#fffaf1] p-6 rounded-lg border border-[#e4d3bc] shadow-sm hover:shadow-md hover:shadow-[#8b5a16]/10 transition-shadow">
                                    <div className="flex-shrink-0 w-12 h-12 bg-[#ead9c3] text-[#8b5a16] rounded-lg flex items-center justify-center font-black text-xl border border-[#d8c6ad] shadow-inner">
                                        {item.step}
                                    </div>
                                    <div className="pt-2">
                                        <h3 className="text-lg font-bold text-[#211b16] mb-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-[#665a4a] text-sm font-medium leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default ReferralLandingPage;
