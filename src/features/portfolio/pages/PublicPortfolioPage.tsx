import React, { useEffect, useState, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { PortfolioData } from '../types/portfolio';
import { Loader2, AlertCircle } from 'lucide-react';
import { TEMPLATES } from '../templates';
import { useAnalytics } from '../hooks/useAnalytics';
import IntroOverlay from '../components/intro/IntroOverlay';

// Simple types for the public page if not importing full types
// but we have PortfolioData so we are good.

const PublicPortfolioPage: React.FC = () => {
    // We need to parse the ID from the hash path since we use HashRouter logic in App.tsx mostly
    // But the user requested careervivid.app/portfolio/ID which looks like a real path or a hash path.
    // Given App.tsx parsing logic:
    // /portfolio/ID -> parts=['portfolio', 'ID']

    // However, App.tsx logic parses hash. 
    // If the user goes to careervivid.app/portfolio/ID, the server might redirect to /#/portfolio/ID or handle it directly.
    // Let's rely on our manual hash parsing or simple window.location check to be safe, 
    // similar to PublicResumePage which uses window.location.hash.

    const [id, setId] = useState<string | null>(null);
    const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showIntro, setShowIntro] = useState(true);

    useEffect(() => {
        // Parse ID from URL
        // Support: 
        // 1. /portfolio/ID
        // 2. /portfolio/USERNAME/ID
        // 3. #/portfolio/ID
        // 4. #/portfolio/USERNAME/ID
        const path = window.location.pathname;
        const segments = path.split('/').filter(p => p !== '');

        // Assuming the ID is always the last segment
        // And generally non-empty. 
        if (segments.length > 0) {
            const lastSegment = segments[segments.length - 1];
            // Basic validation to avoid grabbing 'portfolio' if path is just /portfolio (shouldn't happen due to routing)
            if (lastSegment !== 'portfolio') {
                setId(lastSegment);
            } else {
                setError("Invalid portfolio link.");
                setLoading(false);
            }
        } else {
            setError("Invalid portfolio link.");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!id) return;

        const fetchPortfolio = async () => {
            try {
                // Try fetching from public_portfolios collection first
                // This assumes "Publish" copies data here.
                const docRef = doc(db, 'public_portfolios', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as PortfolioData & { username?: string };
                    setPortfolioData(data);

                    // URL Normalization: Redirect to /portfolio/username/ID if currently at /portfolio/ID
                    const currentPath = window.location.pathname;
                    // Check if path matches /portfolio/ID pattern (missing username segment)
                    if (data.username && currentPath.match(/\/portfolio\/[^/]+$/)) {
                        const newPath = `/portfolio/${data.username}/${id}`;
                        window.history.replaceState(null, '', newPath);
                    }

                } else {
                    // Fallback: This might be a direct user link, but we can't read users/{uid}/portfolios/{pid} directly due to rules
                    // unless rules allow it. We'll show not found for now.
                    setError("Portfolio not found or is private.");
                }
            } catch (err) {
                console.error("Error fetching portfolio:", err);
                setError("Failed to load portfolio.");
            } finally {
                setLoading(false);
            }
        };

        fetchPortfolio();
    }, [id]);

    // Analytics
    const { trackClick } = useAnalytics({
        portfolioId: portfolioData?.id,
        ownerId: portfolioData?.userId,
        enabled: !!portfolioData
    });

    // Check for embed mode and theme/orientation overrides - MUST be before any early returns
    const urlParams = new URLSearchParams(window.location.search);
    const isEmbed = urlParams.get('embed') === 'true';
    const themeOverride = urlParams.get('theme');
    const orientationOverride = urlParams.get('orientation');

    // Apply theme and orientation overrides if provided (used by BusinessCardPage iframe)
    // Using useMemo BEFORE early returns to comply with Rules of Hooks
    const displayData = React.useMemo(() => {
        if (!portfolioData) return null;
        let result = { ...portfolioData };
        if (themeOverride) {
            result.templateId = themeOverride as any;
        }
        if (orientationOverride) {
            result.businessCard = {
                ...(result.businessCard || {}),
                orientation: orientationOverride as 'horizontal' | 'vertical'
            };
        }
        return result;
    }, [portfolioData, themeOverride, orientationOverride]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (error || !portfolioData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
                <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Portfolio Not Found</h1>
                <p className="text-gray-600">{error}</p>
            </div>
        );
    }

    // Render the Template
    const TemplateComponent = (() => {
        if (portfolioData.mode === 'linkinbio') {
            const id = portfolioData.templateId as string;
            // If it is one of the structural keys, use it. Otherwise default to visual.
            if (['linktree_minimal', 'linktree_visual', 'linktree_corporate', 'linktree_bento'].includes(id)) {
                return TEMPLATES[id as keyof typeof TEMPLATES];
            }
            return TEMPLATES.linktree_visual;
        }
        return TEMPLATES[portfolioData.templateId as keyof typeof TEMPLATES] || TEMPLATES.minimalist;
    })();

    // Determine background color for the wrapper to ensure full-page theme
    // This is crucial for Corporate template in Dark Mode to have a matching backdrop
    const defaultTheme = { darkMode: false, primaryColor: '#000000' } as PortfolioData['theme'];
    const theme = portfolioData.theme || defaultTheme;
    const isDark = theme.darkMode;
    // Fix stale data issues similar to templates
    const isExplicitlyLight = theme.backgroundColor?.toLowerCase() === '#ffffff' || theme.backgroundColor?.toLowerCase() === '#fff';
    const wrapperBg = (isDark && isExplicitlyLight) ? '#0f1117' : (theme.backgroundColor || (isDark ? '#0f1117' : '#ffffff'));


    // Handle local theme updates (e.g. toggle dark mode)
    // This allows the visitor to toggle the theme on the client side without saving
    const handleUpdate = (updates: Partial<PortfolioData>) => {
        if (!portfolioData) return;
        setPortfolioData(prev => {
            if (!prev) return null;
            return { ...prev, ...updates };
        });
    };

    const handleGlobalClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = (e.target as HTMLElement).closest('a');
        if (target && target.href) {
            if (target.getAttribute('href')?.startsWith('#')) return;
            const label = target.innerText.trim() || target.getAttribute('aria-label') || 'link';
            trackClick(target.href, label.substring(0, 50));
        }
    };

    return (
        <div
            className={`transition-colors duration-500 ${isEmbed ? 'h-full flex items-center justify-center overflow-hidden' : 'min-h-screen'}`}
            style={{ backgroundColor: isEmbed ? 'transparent' : wrapperBg }}
            onClick={handleGlobalClick}
        >
            {/* Intro / Splash Screen - Hide in embed mode */}
            {!isEmbed && portfolioData.linkInBio?.introPage?.enabled && showIntro && (
                <IntroOverlay
                    config={portfolioData.linkInBio.introPage}
                    onEnter={() => setShowIntro(false)}
                    portfolioId={portfolioData.id}
                />
            )}

            <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
                <div className={isEmbed ? 'w-full h-screen' : ''}>
                    <TemplateComponent
                        data={displayData}
                        onEdit={undefined}
                        onUpdate={handleUpdate}
                        isEmbed={isEmbed}
                    />
                </div>
            </Suspense>

            {/* Simple footer or badge - Hidden if removeBranding is set OR isEmbed */}
            {!isEmbed && !portfolioData.linkInBio?.settings?.removeBranding && (
                <div className="fixed bottom-4 right-4 z-50">
                    <a href="/" className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                        <span>Build your own with CareerVivid</span>
                    </a>
                </div>
            )}
        </div>
    );
};

export default PublicPortfolioPage;
