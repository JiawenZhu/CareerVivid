import React, { useLayoutEffect, useRef, useState } from 'react';
import { FileText, PenTool } from 'lucide-react';
import ResumePreview from '../ResumePreview';
import { TEMPLATES } from '../../features/portfolio/templates';
import LinkTreeVisual from '../../features/portfolio/templates/linkinbio/LinkTreeVisual';
import { getTheme } from '../../features/portfolio/styles/themes';
import { CommunityPost } from '../../hooks/useCommunity';

interface PostVisualSnapshotProps {
    post: CommunityPost;
}

const PostVisualSnapshot: React.FC<PostVisualSnapshotProps> = ({ post }) => {
    const postType = post.type;
    const thumbnail = post.assetThumbnail;
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.2);

    useLayoutEffect(() => {
        const calculateScale = () => {
            if (!previewContainerRef.current) return;
            const parentWidth = previewContainerRef.current.offsetWidth;
            let baseWidth = 824;

            if (post.type === 'portfolio' && post.portfolioData) {
                baseWidth = post.portfolioData.mode === 'linkinbio' ? 430 : 1200;
            }

            if (parentWidth > 0) {
                setScale(parentWidth / baseWidth);
            }
        };

        calculateScale();
        const resizeObserver = new ResizeObserver(calculateScale);
        if (previewContainerRef.current) {
            resizeObserver.observe(previewContainerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, [post.type, post.portfolioData?.mode]);

    if (postType === 'portfolio') {
        const portfolio = post.portfolioData;
        if (portfolio) {
            const isBioLink = portfolio.mode === 'linkinbio';
            const originalWidth = isBioLink ? 430 : 1200;
            const originalHeight = isBioLink ? 932 : 675;
            const CurrentTemplate = TEMPLATES[portfolio.templateId as keyof typeof TEMPLATES] || TEMPLATES.minimalist;
            const bioLinkTheme = isBioLink && portfolio.linkInBio?.themeId ? getTheme(portfolio.linkInBio.themeId) : undefined;

            return (
                <div ref={previewContainerRef} className="w-full h-full bg-gray-100 dark:bg-gray-900 group-hover:bg-gray-200 dark:group-hover:bg-gray-800/50 transition-colors flex items-center justify-center overflow-hidden relative">
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: `${originalWidth}px`,
                            height: `${originalHeight}px`,
                            transform: `scale(${scale})`,
                            transformOrigin: 'top left',
                        }}
                    >
                        {isBioLink && portfolio.linkInBio && bioLinkTheme ? <LinkTreeVisual data={portfolio} /> : <CurrentTemplate data={portfolio} />}
                    </div>
                </div>
            );
        }

        if (thumbnail) {
            return <img src={thumbnail} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />;
        }
    }

    if (postType === 'whiteboard') {
        if (post.dataFormat === 'mermaid') {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#0d1117] relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#10b981 0.5px, transparent 0.5px)', backgroundSize: '14px 14px' }} />
                    <div className="p-4 bg-emerald-900/40 rounded-2xl shadow-inner border border-emerald-800/50">
                        <PenTool size={30} className="text-emerald-400" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Whiteboard Diagram</p>
                </div>
            );
        }

        const svgThumbnail = post.whiteboardData?.thumbnailSvg || thumbnail;
        if (svgThumbnail?.startsWith('<svg')) {
            return (
                <div className="w-full h-full bg-white dark:bg-gray-950 flex items-center justify-center p-2 overflow-hidden relative group-hover:bg-gray-50 dark:group-hover:bg-gray-900 transition-colors">
                    <div className="w-full h-full flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: svgThumbnail }} />
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }} />
                </div>
            );
        }
    }

    if (postType === 'resume') {
        if (post.resumeData) {
            return (
                <div ref={previewContainerRef} className="w-full h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden relative">
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '824px', height: '1165px', transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                        <ResumePreview resume={post.resumeData} template={post.resumeData.templateId} />
                    </div>
                </div>
            );
        }

        return (
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/20 flex items-center justify-center relative overflow-hidden">
                <div className="w-[120px] h-[160px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col p-3 gap-2 transform -rotate-2 group-hover:rotate-0 transition-transform duration-300">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <FileText size={16} />
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded" />
                    <div className="h-1 w-3/4 bg-gray-50 dark:bg-gray-700/50 rounded" />
                    <div className="mt-auto space-y-1">
                        <div className="h-0.5 w-full bg-gray-50 dark:bg-gray-700/30 rounded" />
                        <div className="h-0.5 w-full bg-gray-50 dark:bg-gray-700/30 rounded" />
                    </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl -z-1" />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-900/50 group-hover:bg-gray-100 dark:group-hover:bg-gray-800 transition-colors">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 group-hover:scale-110 transition-transform duration-300">
                <FileText size={32} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{postType} Preview</p>
        </div>
    );
};

export default PostVisualSnapshot;
