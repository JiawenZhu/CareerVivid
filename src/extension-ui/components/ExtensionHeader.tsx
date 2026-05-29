import React from 'react';
import { Settings } from 'lucide-react';

interface ExtensionHeaderProps {
    userProfile: any;
    currentUser: any;
    localPhotoURL: string | null;
    localProfile: any;
}

const getRandomAvatar = (seed: string): string => {
    const avatars = [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80',
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % avatars.length;
    return avatars[index];
};

export const ExtensionHeader: React.FC<ExtensionHeaderProps> = ({
    userProfile,
    currentUser,
    localPhotoURL,
    localProfile
}) => {
    const resolvedPhotoUrl = userProfile?.photoURL || currentUser?.photoURL || localPhotoURL;
    const seed = userProfile?.email || currentUser?.email || localProfile?.email || userProfile?.uid || 'careervivid';
    const avatarUrl = resolvedPhotoUrl || getRandomAvatar(seed);

    return (
        <header className="flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur border-b border-gray-100 sticky top-0 z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gray-200 shadow-sm ring-2 ring-white flex items-center justify-center overflow-hidden">
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                    <h1 className="text-sm font-bold !text-slate-950 leading-tight truncate max-w-[220px]">
                        {userProfile?.displayName || 
                         (localProfile ? `${localProfile.firstName || ''} ${localProfile.lastName || ''}`.trim() || 'CareerVivid User' : 'CareerVivid User')}
                    </h1>
                    <p className="text-[10px] uppercase tracking-wide font-semibold !text-indigo-600">
                        CareerVivid
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button 
                    onClick={() => window.open('https://careervivid.app/profile', '_blank')}
                    title="Settings"
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <Settings size={18} />
                </button>
            </div>
        </header>
    );
};
