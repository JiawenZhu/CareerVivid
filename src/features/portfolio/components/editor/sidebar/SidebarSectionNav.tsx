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
        <div className={`grid grid-cols-2 gap-1.5 p-3 border-b ${themeClasses.sectionBorder}`}>
            {sections.map(s => (
                <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id as any)}
                    className={`flex h-9 min-w-0 items-center gap-1.5 rounded-lg px-2 text-[11px] font-semibold transition-colors
                        ${activeSection === s.id
                            ? (editorTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900')
                            : 'text-gray-500 hover:text-gray-400 hover:bg-black/5'}
                    `}
                >
                    <span className="shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5">{s.icon}</span>
                    <span className="truncate">{s.label}</span>
                </button>
            ))}
        </div>
    );
};

export default SidebarSectionNav;
