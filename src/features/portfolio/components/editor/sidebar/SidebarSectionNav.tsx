import React from 'react';

interface SidebarSectionNavProps {
    sections: { id: string; icon: React.ReactNode; label: string }[];
    activeSection: string;
    setActiveSection: (section: any) => void;
    editorTheme: 'light' | 'dark';
    themeClasses: any;
}

const SidebarSectionNav: React.FC<SidebarSectionNavProps> = ({
    sections,
    activeSection,
    setActiveSection,
    editorTheme,
    themeClasses
}) => {
    return (
        <div className={`flex p-2 border-b ${themeClasses.sectionBorder} gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
            {sections.map(s => (
                <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id as any)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                        ${activeSection === s.id
                            ? (editorTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900')
                            : 'text-gray-500 hover:text-gray-400 hover:bg-black/5'}
                    `}
                >
                    {s.icon} {s.label}
                </button>
            ))}
        </div>
    );
};

export default SidebarSectionNav;
