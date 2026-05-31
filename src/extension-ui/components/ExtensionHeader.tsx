import React from 'react';
import { Monitor, Moon, Settings, Sun } from 'lucide-react';
import { Theme, useTheme } from '../../contexts/ThemeContext';
import { getPreferredUserAvatar } from '../../utils/avatarFallback';

interface ExtensionHeaderProps {
    userProfile: any;
    currentUser: any;
    localPhotoURL: string | null;
    localProfile: any;
}

const THEME_OPTIONS: Array<{ value: Theme; label: string; icon: React.ElementType }> = [
    { value: 'system', label: 'Default', icon: Monitor },
    { value: 'bright', label: 'Bright', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
];

const ExtensionThemeMenu: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const activeTheme = theme === 'light' ? 'system' : theme;
    const CurrentIcon = THEME_OPTIONS.find((option) => option.value === activeTheme)?.icon || Monitor;

    return (
        <div className="relative group">
            <button
                type="button"
                title="Theme"
                aria-label="Theme"
                className="p-2 rounded-full hover:bg-[#f1f2f7] text-slate-400 hover:text-slate-600 transition-colors"
            >
                <CurrentIcon size={17} />
            </button>
            <div className="pointer-events-none absolute right-0 top-full z-20 w-max translate-y-1 pt-2 opacity-0 transition-all group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div className="flex gap-1 rounded-2xl border border-[#ececf4] bg-white/95 p-1.5 shadow-[0_14px_28px_rgba(15,23,42,0.12)] backdrop-blur">
                    {THEME_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isActive = activeTheme === option.value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setTheme(option.value)}
                                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                                    isActive
                                        ? 'border-[#c8c7f4] bg-[#f3f2ff] text-[#625bd5]'
                                        : 'border-transparent text-slate-400 hover:border-[#ececf4] hover:bg-[#f8f8fb] hover:text-slate-700'
                                }`}
                                title={option.label}
                                aria-label={`Use ${option.label} theme`}
                            >
                                <Icon size={15} />
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const ExtensionHeader: React.FC<ExtensionHeaderProps> = ({
    userProfile,
    currentUser,
    localPhotoURL,
    localProfile
}) => {
    const displayName = userProfile?.displayName ||
        (localProfile ? `${localProfile.firstName || ''} ${localProfile.lastName || ''}`.trim() : '') ||
        currentUser?.displayName ||
        'CareerVivid User';
    const email = userProfile?.email || currentUser?.email || localProfile?.email || '';
    const avatarUrl = getPreferredUserAvatar({
        photoURL: userProfile?.photoURL || currentUser?.photoURL || localPhotoURL,
        avatarUrl: userProfile?.avatarUrl,
        displayName,
        firstName: userProfile?.firstName || localProfile?.firstName,
        email,
        seed: userProfile?.uid || currentUser?.uid || email,
    });

    return (
        <header className="flex items-center justify-between px-4 py-3 bg-[#fbfbfd]/95 backdrop-blur border-b border-[#ececf4] sticky top-0 z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#eef0ff] shadow-sm ring-2 ring-white flex items-center justify-center overflow-hidden">
                    <img src={avatarUrl} alt={`${displayName} avatar`} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                    <h1 className="text-sm font-semibold !text-slate-950 leading-tight truncate max-w-[220px]">
                        {displayName}
                    </h1>
                    <p className="text-[10px] font-semibold !text-[#6b66d8]">
                        CareerVivid
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <ExtensionThemeMenu />
                <button 
                    onClick={() => window.open('https://careervivid.app/profile', '_blank')}
                    title="Settings"
                    className="p-2 rounded-full hover:bg-[#f1f2f7] text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <Settings size={18} />
                </button>
            </div>
        </header>
    );
};
