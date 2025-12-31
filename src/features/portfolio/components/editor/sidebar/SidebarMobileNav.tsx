import React from 'react';

interface SidebarMobileNavProps {
    sections: { id: string; icon: React.ReactNode; label: string }[];
    activeSection: string;
    setActiveSection: (section: any) => void;
    editorTheme: 'light' | 'dark';
}

const SidebarMobileNav: React.FC<SidebarMobileNavProps> = ({
    sections,
    activeSection,
    setActiveSection,
    editorTheme
}) => {
    return (
        <div className={`fixed bottom-0 left-0 w-full z-40 border-t backdrop-blur-md pb-safe ${editorTheme === 'dark' ? 'bg-[#0f1117]/90 border-white/5' : 'bg-white/90 border-gray-200'}`}>
            <div className="flex items-center justify-around">
                {sections.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id as any)}
                        className={`flex flex-col items-center gap-1 py-3 px-2 min-w-[60px] transition-colors
                            ${activeSection === s.id
                                ? (editorTheme === 'dark' ? 'text-white' : 'text-indigo-600')
                                : 'text-gray-500 hover:text-gray-400'}
                        `}
                    >
                        {React.cloneElement(s.icon as any, {
                            size: 20,
                            strokeWidth: activeSection === s.id ? 2.5 : 2
                        })}
                        <span className={`text-[10px] font-medium ${activeSection === s.id ? 'opacity-100' : 'opacity-70'}`}>
                            {s.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SidebarMobileNav;
