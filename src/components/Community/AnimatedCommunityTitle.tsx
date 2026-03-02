import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const PHRASES = [
    "Tech & Career",
    "Global Remote Work",
    "Frontend Engineering",
    "Flow State Coding",
    "UI/UX Design",
    "System Architecture",
    "Artificial Intelligence"
];

interface AnimatedCommunityTitleProps {
    isPaused?: boolean;
}

const AnimatedCommunityTitle: React.FC<AnimatedCommunityTitleProps> = ({ isPaused = false }) => {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (isPaused) return;

        const currentPhrase = PHRASES[phraseIndex];

        let typingDelay = isDeleting ? 40 : 80;

        if (!isDeleting && text === currentPhrase) {
            typingDelay = 2500; // Pause before deleting
            const timeoutId = setTimeout(() => setIsDeleting(true), typingDelay);
            return () => clearTimeout(timeoutId);
        } else if (isDeleting && text === '') {
            setIsDeleting(false);
            setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
            typingDelay = 500; // Small pause before typing next word
            const timeoutId = setTimeout(() => { }, typingDelay); // Dummy clearable timeout before next effect cycle
            return () => clearTimeout(timeoutId);
        }

        const timeout = setTimeout(() => {
            setText(currentPhrase.substring(0, text.length + (isDeleting ? -1 : 1)));
        }, typingDelay);

        return () => clearTimeout(timeout);
    }, [text, isDeleting, phraseIndex, isPaused]);

    return (
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-2">
            <span className="text-primary-600 dark:text-primary-400 flex items-center min-h-[40px] sm:min-h-[48px]">
                {text}
                <span className="animate-pulse border-r-[3px] border-primary-600 dark:border-primary-400 h-[1em] ml-0.5 inline-block"></span>
            </span>
            <span className="relative inline-block px-3 py-0.5 shrink-0">
                <span className="relative z-10 text-gray-900 dark:text-white leading-tight">{t('nav.community_static', 'Community')}</span>
                <span className="absolute inset-0 bg-green-200 dark:bg-green-900/40 transform -rotate-1 rounded-lg -z-10 shadow-sm"></span>
            </span>
        </h1>
    );
};

export default AnimatedCommunityTitle;
