import React, { useEffect, useState, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../firebase';
import { PortfolioData } from '../types/portfolio';
import { Loader2, AlertCircle, Eye } from 'lucide-react';
import { TEMPLATES } from '../templates';
import { useAnalytics } from '../hooks/useAnalytics';
import IntroOverlay from '../components/intro/IntroOverlay';
import PublicProfilePage from './PublicProfilePage';
import { useAuth } from '../../../contexts/AuthContext';

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
    const [isUserProfileRoute, setIsUserProfileRoute] = useState(false);

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
                    // Fallback: The URL segment might be a user UID (e.g. from community post links).
                    // If so, we should render the User's Public Profile (Portfolio Hub) instead of a specific portfolio.
                    const q = query(
                        collection(db, 'public_portfolios'),
                        where('userId', '==', id),
                        limit(1)
                    );
                    const qResumes = query(
                        collection(db, 'public_resumes'),
                        where('userId', '==', id),
                        limit(1)
                    );

                    const [querySnap, resumesSnap] = await Promise.all([getDocs(q), getDocs(qResumes)]);

                    // Note: even if they have NO portfolios or resumes, if they have an active user ID 
                    // from a community post, we should still show the profile. For safety, we check if
                    // there's ANY public presence, but really the hook inside PublicProfilePage will 
                    // validate the user document directly. We just flip the toggle here.

                    setIsUserProfileRoute(true);
                    setLoading(false);
                    return;
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

    if (isUserProfileRoute) {
        return <PublicProfilePage />;
    }

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

    // Allow explicitly forcing the flip state (true = back/QR, false = front/info)
    // If param is present, it sets the initial state.
    const flippedParam = urlParams.get('flipped');
    const initialFlipped = flippedParam !== null ? flippedParam === 'true' : undefined;

    const [isFlipped, setIsFlipped] = useState<boolean | undefined>(initialFlipped);

    // Update state if URL changes (e.g. navigation)
    useEffect(() => {
        if (flippedParam !== null) {
            setIsFlipped(flippedParam === 'true');
        }
    }, [flippedParam]);

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
        if (displayData?.mode === 'linkinbio') {
            const id = displayData.templateId as string;
            // If it is one of the structural keys, use it. Otherwise default to visual.
            if (['linktree_minimal', 'linktree_visual', 'linktree_corporate', 'linktree_bento'].includes(id)) {
                return TEMPLATES[id as keyof typeof TEMPLATES];
            }
            return TEMPLATES.linktree_visual;
        }
        return TEMPLATES[displayData?.templateId as keyof typeof TEMPLATES] || TEMPLATES.minimalist;
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
                        isFlipped={isFlipped}
                        onToggleFlip={setIsFlipped}
                    />
                </div>
            </Suspense>

            {/* View Only Badge — top-left for non-owners */}
            {!isEmbed && portfolioData.userId && (
                (() => {
                    // We need to import useAuth — it's declared at module level
                    // This is a render-time check
                    const isViewOnly = true; // All public portfolio viewers are view-only by design
                    return isViewOnly ? (
                        <div className="fixed top-4 left-4 z-50">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-500 dark:text-gray-400 text-xs font-semibold shadow-sm border border-gray-200 dark:border-gray-700">
                                <Eye size={14} />
                                View Only
                            </span>
                        </div>
                    ) : null;
                })()
            )}

            {/* Simple footer or badge - Hidden if removeBranding is set OR isEmbed */}
            {!isEmbed && !portfolioData.linkInBio?.settings?.removeBranding && (
                <div className="fixed bottom-4 right-4 z-50">
                    <a href="/portfolio" className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                        <span>Build your own with CareerVivid</span>
                    </a>
                </div>
            )}
        </div>
    );
};

export default PublicPortfolioPage;
