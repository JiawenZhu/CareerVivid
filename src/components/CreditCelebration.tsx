import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles } from 'lucide-react';

const CreditCelebration: React.FC = () => {
    const { userProfile, currentUser, loading } = useAuth();
    const prevCreditsRef = useRef<number | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [addedAmount, setAddedAmount] = useState<number>(0);

    useEffect(() => {
        // We only track this if the user is fully logged in and AuthContext has finished loading the user profile
        if (!currentUser || loading) return;
        
        const currentCredits = userProfile?.promotions?.tokenCredits || 0;
        
        if (prevCreditsRef.current !== null) {
            if (currentCredits > prevCreditsRef.current) {
                setAddedAmount(currentCredits - prevCreditsRef.current);
                setShowCelebration(true);
                
                // Hide after 5 seconds
                const timer = setTimeout(() => {
                    setShowCelebration(false);
                }, 5000);
                
                prevCreditsRef.current = currentCredits;
                return () => clearTimeout(timer);
            }
        }
        
        prevCreditsRef.current = currentCredits;
    }, [userProfile?.promotions?.tokenCredits, currentUser, loading]);

    if (!showCelebration) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center animate-celebration-fade-in-out">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl text-center max-w-sm w-full mx-4">
                <Sparkles className="w-16 h-16 text-yellow-400 mx-auto animate-celebration-sparkle" />
                <h2 className="text-3xl font-bold mt-4 text-gray-900 dark:text-white">Congratulations!</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                    You've just been granted <strong className="text-primary-600 dark:text-primary-400">{addedAmount}</strong> AI Credits!
                </p>
                <button 
                    onClick={() => setShowCelebration(false)}
                    className="mt-6 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full font-medium transition-colors"
                >
                    Awesome
                </button>
            </div>
        </div>
    );
};

export default CreditCelebration;
