import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface SocialLinkWrapperProps {
    url: string;
    type?: string; // e.g. 'Wechat', 'Linkedin'
    children: React.ReactNode;
    className?: string;
}

const SocialLinkWrapper: React.FC<SocialLinkWrapperProps> = ({ url, type, children, className }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Check if it's a WeChat link
    const isWeChat = type?.toLowerCase() === 'wechat' || type?.toLowerCase() === 'weixin';

    const handleClick = (e: React.MouseEvent) => {
        if (isWeChat) {
            e.preventDefault();
            setIsModalOpen(true);
        }
    };

    return (
        <>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
                className={className}
            >
                {children}
            </a>

            {/* QR Code Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="mt-2 mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">Scan QR Code</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
                                Open WeChat and scan to connect
                            </p>
                        </div>

                        <div className="bg-white p-2 rounded-xl border border-gray-100 dark:border-gray-800 shadow-inner">
                            {/* We expect 'url' to be the image URL for WeChat */}
                            <img
                                src={url}
                                alt="WeChat QR Code"
                                className="w-64 h-64 object-cover rounded-lg"
                                onError={(e) => {
                                    // Fallback if image fails or is actually a regular link
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                            {/* Fallback Text if Image Fails (hidden by default) */}
                            <div className="hidden w-64 h-64 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed rounded-lg">
                                Invalid QR Code Image
                            </div>
                        </div>

                        {/* Fallback Actions */}
                        <div className="mt-6 w-full">
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                            >
                                <ExternalLink size={18} />
                                Open Link Directly
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SocialLinkWrapper;
