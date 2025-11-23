
import { ResumeData, PersonalDetails, Skill, EmploymentHistory, Education, WebsiteLink, Language } from './types';

export const DEFAULT_PERSONAL_DETAILS: PersonalDetails = {
    jobTitle: 'Software Developer',
    photo: '',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    address: '123 Main Street',
    city: 'Anytown',
    postalCode: '12345',
    country: 'USA',
};

export const DEFAULT_SUMMARY = `A highly skilled and experienced IT professional adept at managing and overseeing complex server infrastructure, ensuring high availability and optimal performance. Proficient in system security and system monitoring. Experienced in implementing disaster recovery plans and conducting regular system audits to ensure compliance with industry standards. Well-versed in a variety of operating systems, including Windows and Linux, and skilled in virtualization technologies, user management, Active Directory administration, Group policy management, IIS, and MSSQL databases. Seeking to leverage my skills and experience in a challenging IT leadership role.`;

export const DEFAULT_WEBSITES: WebsiteLink[] = [{ id: '1', label: 'LinkedIn', url: 'linkedin.com/in/johndoe', icon: 'linkedin' }];

export const DEFAULT_SKILLS: Skill[] = [
    { id: '1', name: 'System administration', level: 'Expert' },
    { id: '2', name: 'Operating systems', level: 'Expert' },
    { id: '3', name: 'Network administration', level: 'Expert' },
];

export const DEFAULT_LANGUAGES: Language[] = [
    { id: '1', name: 'English', level: 'Native' },
    { id: '2', name: 'Spanish', level: 'Intermediate' },
];

export const DEFAULT_EMPLOYMENT: EmploymentHistory[] = [
    {
        id: '1',
        jobTitle: 'Web Developer',
        employer: 'Tech Solutions Inc.',
        city: 'Anytown',
        startDate: 'Jan 2019',
        endDate: 'Apr 2021',
        description: 'Led a team in developing and maintaining web applications. Improved system efficiency by 25%.'
    }
];

export const DEFAULT_EDUCATION: Education[] = [
    {
        id: '1',
        school: 'State University',
        degree: 'Bachelor of Science in Computer Science',
        city: 'Anytown',
        startDate: 'Aug 2015',
        endDate: 'May 2019',
        description: 'Focused on software development and algorithms. Graduated with honors.'
    }
];

export const DEFAULT_SECTION_TITLES = {
    summary: 'Professional Summary',
    experience: 'Employment History',
    education: 'Education',
    skills: 'Skills',
    languages: 'Languages',
    contact: 'Contact',
};

export const DEFAULT_ICONS = {
    email: 'mail',
    phone: 'phone',
    location: 'map-pin',
};

export const AVAILABLE_ICONS = [
    { id: 'mail', label: 'Mail' },
    { id: 'phone', label: 'Phone' },
    { id: 'map-pin', label: 'Map Pin' },
    { id: 'globe', label: 'Globe' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'github', label: 'GitHub' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'twitter', label: 'Twitter/X' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'video', label: 'TikTok/Video' }, // Generic video icon for TikTok
    { id: 'at-sign', label: 'Email (At)' },
    { id: 'briefcase', label: 'Portfolio' },
    { id: 'link', label: 'Link' },
    { id: 'send', label: 'Telegram' },
];

export const createNewResume = (): ResumeData => {
  const newId = Date.now().toString();
  return {
    id: newId,
    title: 'Untitled Resume',
    updatedAt: new Date().toISOString(),
    templateId: 'Modern',
    personalDetails: { ...DEFAULT_PERSONAL_DETAILS },
    professionalSummary: DEFAULT_SUMMARY,
    websites: [...DEFAULT_WEBSITES.map(w => ({...w, id: crypto.randomUUID()}))],
    skills: [...DEFAULT_SKILLS.map(s => ({...s, id: crypto.randomUUID()}))],
    employmentHistory: [...DEFAULT_EMPLOYMENT.map(e => ({...e, id: crypto.randomUUID()}))],
    education: [...DEFAULT_EDUCATION.map(e => ({...e, id: crypto.randomUUID()}))],
    languages: [...DEFAULT_LANGUAGES.map(l => ({...l, id: crypto.randomUUID()}))],
    sectionTitles: { ...DEFAULT_SECTION_TITLES },
    customIcons: { ...DEFAULT_ICONS },
    themeColor: '#000000',
    titleFont: 'Montserrat',
    bodyFont: 'Crimson Text',
    language: 'English',
  };
};

export const createBlankResume = (): ResumeData => {
  const newId = Date.now().toString();
  return {
    id: newId,
    title: 'Untitled Resume',
    updatedAt: new Date().toISOString(),
    templateId: 'Modern',
    personalDetails: {
        jobTitle: '',
        photo: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
    },
    professionalSummary: '',
    websites: [],
    skills: [],
    employmentHistory: [],
    education: [],
    languages: [],
    sectionTitles: { ...DEFAULT_SECTION_TITLES },
    customIcons: { ...DEFAULT_ICONS },
    themeColor: '#000000',
    titleFont: 'Montserrat',
    bodyFont: 'Crimson Text',
    language: 'English',
  };
};


export const FONTS = [
  'Montserrat', 'Lato', 'Roboto', 'Open Sans', 'Merriweather', 'Playfair Display',
  'Oswald', 'Raleway', 'Poppins', 'Nunito Sans', 'Crimson Text', 'Source Sans Pro', 'Tajawal'
];

export const LANGUAGE_PROFICIENCY_LEVELS = [
    'Native', 'Fluent', 'Proficient', 'Intermediate', 'Basic'
];

// The 36 supported languages for UI and Translation
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'jv', name: 'Javanese', nativeName: 'Jawa' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'yue', name: 'Cantonese', nativeName: '粵語' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' }
];

export const SUPPORTED_TRANSLATE_LANGUAGES = SUPPORTED_LANGUAGES;

export const EXPORT_OPTIONS = [
  { id: 'pdf', name: 'PDF Document', recommendation: 'Best for job applications and professional sharing.' },
  { id: 'png', name: 'PNG Image (Full)', recommendation: 'High-quality image of the entire resume.' },
  { id: '1:1', name: 'Square Image (1:1)', recommendation: 'Ideal for profile pictures or social media posts.' },
  { id: '16:9', name: 'Widescreen Image (16:9)', recommendation: 'Great for presentation slides or banners.' },
  { id: '9:16', name: 'Story Image (9:16)', recommendation: 'Perfect for sharing on mobile stories.' },
  { id: '4:5', name: 'Portrait Image (4:5)', recommendation: 'Optimized for social media feeds.' },
];
