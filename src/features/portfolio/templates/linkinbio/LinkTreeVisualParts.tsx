import React, { useEffect } from 'react';
import * as Icons from 'lucide-react';
import { FaTiktok, FaWeibo, FaWeixin } from 'react-icons/fa';
import confetti from 'canvas-confetti';
import { LinkTreeTheme } from '../../styles/linktreeThemes';

export const useTypewriter = (text: string, speed = 100, enabled = false) => {
    const [displayText, setDisplayText] = React.useState('');

    useEffect(() => {
        if (!enabled) {
            setDisplayText(text);
            return;
        }

        let i = 0;
        setDisplayText('');

        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayText(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed, enabled]);

    return displayText;
};

const useTilt = (active: boolean) => {
    const ref = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!active || !ref.current) return;

        const el = ref.current;
        const handleMove = (e: MouseEvent) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;
            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        };

        const handleLeave = () => {
            el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        };

        el.addEventListener('mousemove', handleMove);
        el.addEventListener('mouseleave', handleLeave);

        return () => {
            el.removeEventListener('mousemove', handleMove);
            el.removeEventListener('mouseleave', handleLeave);
        };
    }, [active]);

    return ref;
};

export const getGoogleFontUrl = (theme: LinkTreeTheme, customFont?: string, profileFont?: string) => {
    const fonts = [customFont, profileFont, theme.fonts.heading, theme.fonts.body].filter(Boolean) as string[];
    const uniqueFonts = [...new Set(fonts.map(f => f.split(',')[0].replace(/['"]/g, '').trim()))];
    if (uniqueFonts.length === 0) return null;
    return `https://fonts.googleapis.com/css2?family=${uniqueFonts.map(f => f.replace(/ /g, '+')).join('&family=')}:wght@400;600;700&display=swap`;
};

export const getShapeStyle = (shape?: string): React.CSSProperties => {
    if (!shape) return {};
    if (shape === 'torn-paper') {
        return {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 95%, 2% 96%, 4% 94%, 6% 96%, 8% 94%, 10% 96%, 12% 94%, 14% 96%, 16% 94%, 18% 96%, 20% 94%, 22% 96%, 24% 94%, 26% 96%, 28% 94%, 30% 96%, 32% 94%, 34% 96%, 36% 94%, 38% 96%, 40% 94%, 42% 96%, 44% 94%, 46% 96%, 48% 94%, 50% 96%, 52% 94%, 54% 96%, 56% 94%, 58% 96%, 60% 94%, 62% 96%, 64% 94%, 66% 96%, 68% 94%, 70% 96%, 72% 94%, 74% 96%, 76% 94%, 78% 96%, 80% 94%, 82% 96%, 84% 94%, 86% 96%, 88% 94%, 90% 96%, 92% 94%, 94% 96%, 96% 94%, 98% 96%, 100% 94%, 100% 100%, 0% 100%)',
        };
    }
    if (shape === 'jagged') {
        return {
            clipPath: 'polygon(0% 0%, 100% 0%, 95% 50%, 100% 100%, 0% 100%, 5% 50%)',
        };
    }
    if (shape === 'wavy') {
        return {
            borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
        };
    }
    return {};
};

export const getLinkIcon = (iconName?: string) => {
    if (!iconName) return null;
    if (iconName === 'Tiktok' || iconName === 'Douyin') return <FaTiktok size={20} />;
    if (iconName === 'Wechat') return <FaWeixin size={20} />;
    if (iconName === 'Weibo') return <FaWeibo size={20} />;

    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent size={20} /> : null;
};

export const SantaHatDecoration: React.FC<{ className: string }> = ({ className }) => (
    <div className={className}>
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path d="M116.5 393.1c-19.1-16.7-33.8-38.3-43.2-62.7-18.4-44.1-12.8-95.6 15.6-135 23.4-32.5 59-54 99.4-62.3 35.1-7.2 73.4 3.7 103.7 26.6 23.9 18.1 39.3 45.4 43.6 74.8 2 13.5 1.5 27.6-1.5 40.8-5.3 22.8-16.3 43.8-31.5 61.4-12.4 14.3-27.4 26.4-44.1 35.5-16.1 8.8-33.6 14.7-51.7 17.5-30.1 4.7-61-1.6-88.6-16.2z" fill="#D32F2F" />
            <path d="M428.6 376.5c-15.6-11.2-28.7-25-39.7-40.2-22.3-30.8-34.9-68.5-44.1-105.8-9.4-38.3-15.3-77.9-22-116.6-4.9-28.3-10.4-56.5-17.6-84.3-3.6-13.9-8.4-27.4-14.7-40.3-6.5-13.3-15.2-25.2-26.4-34.6-5.8-4.9-12.4-8.8-19.7-11.3s-15.3-3.3-22.9-2.1c-15 2.5-28.3 10.1-39.1 20.8-10.7 10.6-17.7 24.3-19.7 39.3-3.5 16.7 1.8 34.3 12.8 46.8 11.2 12.7 27.2 19.9 44.1 20.2 16.4.3 32.5-6.2 44.2-17.8 7.3-7.2 12.7-16.1 15.6-26 2.4-8.1 3-16.8 1.4-25.1-1.3-6.8-4.1-13.2-8.3-18.4-5.3-6.6-13.4-10.5-21.8-10.8-14.2-.5-27.1 9.4-30 23.3-1.6 7.6-.6 15.7 2.8 22.6 4.7 9.4 15.2 14.9 25.6 13.8 10.4-1.2 19.4-8.7 21.8-19 1.4-6.1.7-12.6-2.1-18.2-3.1-6.1-9.3-10.2-16.2-10.9-6.3-.6-12.6 1.8-16.7 6.6-3.8 4.4-4.8 10.7-3.2 16.3 2.1 7.2 8.7 12 16.2 11.8 7.5-.2 14.1-5.3 16-12.6 1.2-4.6.3-9.6-2.5-13.3-2.9-3.9-7.8-5.9-12.6-5.3-4.2.6-7.8 3.7-8.8 7.8-.8 3.5.3 7.2 2.9 9.8 2.3 2.3 5.8 3.1 8.9 2.1" fill="#FFFFFF" />
            <path d="M124.6 405.6c-4.4 2.8-9 5.4-13.8 7.7-27.3 13.2-59 14.8-87.7 5.7-26.6-8.4-48.5-28.5-57.9-54.8-1.5-4.1-2.5-8.4-3.1-12.7 3.9 10.3 10.4 19.5 18.9 26.8 15.4 13.2 35.6 18.7 55.4 18.1 20.3-.6 39.8-7.9 56.4-19.8 12.9-9.2 23.3-21.3 31-35.3 5.1-9.3 8.7-19.4 10.6-29.8 1.9-10.8 2.2-22 0-32.9l8.6 3.8c-1.4 10.1-4.8 19.6-9.9 28.3-8.8 14.9-21.4 27.2-36.4 36.1-17.6 10.4-37.9 15.3-58 13.9-19-.3-37.4-7.4-51.5-19.4-5.3-4.5-9.8-9.8-13.4-15.8-2.6-4.4-4.7-9.2-6.1-14.1-1.3-4.5-2-9.2-2.1-13.9.7 13.6 5.8 26.5 14.3 36.9 14.5 17.7 36.6 27.9 59.2 27.3 22.8-.6 44.5-9.7 60.5-25.5 10.1-10 17.5-22.3 21.6-35.8 2-6.6 3.1-13.6 3-20.6l8.8 2.2c1.4 11.2-1.3 22.5-6.6 32.2-6.2 11.2-15 20.7-25.1 28.5-17.5 13.5-39.7 19.9-61.6 18-20.7-1.7-40.4-10.7-54.3-25.2-11.8-12.2-18.6-28.8-18.9-45.7-.1-3.6.4-7.2 1.4-10.7-5.1 11.6-4.5 25.4 1.7 36.7 10.6 19.5 31.7 31.5 53.6 32.5 11 .5 22-1.4 32.3-5.6z" fill="#FFFFFF" />
            <circle cx="430" cy="80" r="45" fill="#FFFFFF" />
            <rect x="50" y="320" width="220" height="60" rx="30" fill="#FFFFFF" transform="rotate(-15 160 350)" />
        </svg>
    </div>
);

export const AnimatedLinkButton = ({
    link,
    theme,
    buttonStyle,
    customStyle,
    LinkWrapper,
    getIcon,
    onLinkClick
}: any) => {
    const tiltRef = useTilt(theme.effects?.tilt || false);

    const handleClick = (e: React.MouseEvent) => {
        if (onLinkClick) {
            const shouldPreventDefault = onLinkClick(link, e);
            if (shouldPreventDefault) {
                e.preventDefault();
                return;
            }
        }

        if (theme.effects?.confetti) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
    };

    const isCentered = customStyle?.buttonAlignment === 'center';

    return (
        <LinkWrapper url={link.url} type={link.icon} className="block w-full" onClick={handleClick}>
            <div
                ref={tiltRef}
                className={`group relative w-full p-4 md:p-5 flex items-center hover:scale-[1.02] active:scale-[0.98] ${isCentered ? 'justify-center' : 'justify-between'}`}
                style={buttonStyle(link.variant || 'primary')}
            >
                <div className={`flex items-center gap-4 ${isCentered ? 'justify-center text-center w-full px-8' : ''}`}>
                    {link.thumbnail && (
                        <img src={link.thumbnail} alt="" className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
                    )}
                    {!link.thumbnail && link.icon && (
                        <div className={`flex-shrink-0 ${theme.id === 'air' ? 'text-gray-900' : ''}`}>
                            {getIcon(link.icon)}
                        </div>
                    )}
                    <span className={`font-semibold text-lg tracking-wide ${isCentered ? 'text-center w-full' : ''}`}>
                        {link.label}
                    </span>
                </div>

                <div className={`opacity-60 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 ${isCentered ? 'absolute right-5' : ''}`}>
                    {theme.buttons.customShape === 'torn-paper' ? null :
                        theme.buttons.style === 'glass' || theme.buttons.style === 'outline' ?
                            <Icons.ArrowUpRight size={20} /> :
                            <Icons.ChevronRight size={20} />
                    }
                </div>
            </div>
        </LinkWrapper>
    );
};
