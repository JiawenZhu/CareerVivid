export const QUICK_PROMPTS = [
    { label: 'Rewrite About', icon: '✍️', prompt: 'Rewrite my About section to sound more confident, senior, and impactful. Keep it under 80 words.' },
    { label: 'Punch up Hero', icon: '⚡', prompt: 'Make my hero headline and subheadline more punchy, memorable, and keyword-rich for recruiters.' },
    { label: 'Add a Project', icon: '🚀', prompt: 'Add a placeholder project called "New Project" with a description, URL, and tech stack I can fill in.' },
    { label: 'Add a Skill', icon: '🛠️', prompt: 'Add React, TypeScript, and Node.js to my tech stack if they are not already there.' },
    { label: 'Clean Timeline', icon: '🗓️', prompt: 'Tighten the descriptions in my work experience — make each bullet point shorter, stronger, and result-focused.' },
    { label: 'Remove Oldest Job', icon: '🗑️', prompt: 'Remove the oldest entry from my work experience timeline.' },
];

export const QUICK_STYLE_PROMPTS = [
    { icon: '🎨', label: 'Gradient Headings', prompt: 'Make all section headings a purple-to-indigo gradient text' },
    { icon: '✨', label: 'Fade-in Sections', prompt: 'Add a subtle fade-in animation to each section as it enters the viewport' },
    { icon: '📐', label: 'Left Accent Border', prompt: 'Add a thin colored left border accent to each section heading' },
    { icon: '🔵', label: 'Rounded Buttons', prompt: 'Make all buttons and CTA elements fully rounded pill shapes' },
    { icon: '🌗', label: 'Card Shadows', prompt: 'Add soft drop shadows to all card and project elements' },
    { icon: '🔤', label: 'Tighter Typography', prompt: 'Reduce letter-spacing on headings to -0.5px for a premium editorial look' },
    { icon: '💫', label: 'Hover Effects', prompt: 'Add smooth hover scale effects to all project cards and links' },
    { icon: '🗑️', label: 'Reset Styles', prompt: 'Remove all custom CSS and return to the default template styling' },
];

export const SECTION_LABELS: Record<string, string> = {
    hero: '🎯 Hero',
    about: '👤 About',
    timeline: '🗓️ Experience',
    education: '🎓 Education',
    techStack: '🛠️ Tech Stack',
    projects: '🚀 Projects',
    socialLinks: '🔗 Social Links',
    contactEmail: '📧 Contact',
    sectionLabels: '🏷️ Labels',
};
