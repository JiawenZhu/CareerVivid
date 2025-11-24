
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
    contact: 'Contact',
    profile: 'Profile',
    skills: 'Skills',
    experience: 'Experience',
    education: 'Education',
    languages: 'Languages',
    websites: 'Websites & Social Links'
};

export const DEFAULT_ICONS = {
    email: 'mail',
    phone: 'phone',
    location: 'map-pin'
};

export const createNewResume = (): ResumeData => {
  const newId = Date.now().toString();
  return {
    id: newId,
    title: 'Untitled Resume',
    updatedAt: new Date().toISOString(),
    templateId: 'Modern',
    personalDetails: { ...DEFAULT_PERSONAL_DETAILS },
    professionalSummary: DEFAULT_SUMMARY,
    websites: [...DEFAULT_WEBSITES.map(w => ({ ...w, id: crypto.randomUUID() }))],
    skills: [...DEFAULT_SKILLS.map(s => ({ ...s, id: crypto.randomUUID() }))],
    employmentHistory: [...DEFAULT_EMPLOYMENT.map(e => ({ ...e, id: crypto.randomUUID() }))],
    education: [...DEFAULT_EDUCATION.map(e => ({ ...e, id: crypto.randomUUID() }))],
    languages: [...DEFAULT_LANGUAGES.map(l => ({ ...l, id: crypto.randomUUID() }))],
    themeColor: '#000000',
    titleFont: 'Montserrat',
    bodyFont: 'Crimson Text',
    language: 'English',
    sectionTitles: { ...DEFAULT_SECTION_TITLES },
    customIcons: { ...DEFAULT_ICONS },
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
    themeColor: '#000000',
    titleFont: 'Montserrat',
    bodyFont: 'Crimson Text',
    language: 'English',
    sectionTitles: { ...DEFAULT_SECTION_TITLES },
    customIcons: { ...DEFAULT_ICONS },
  };
};


export const FONTS = [
  'Montserrat', 'Lato', 'Roboto', 'Open Sans', 'Merriweather', 'Playfair Display',
  'Oswald', 'Raleway', 'Poppins', 'Nunito Sans', 'Crimson Text', 'Source Sans Pro', 'Tajawal'
];

export const UI_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Arabic', 'Armenian'
];

export const LANGUAGE_PROFICIENCY_LEVELS = [
  'Native', 'Fluent', 'Proficient', 'Intermediate', 'Basic'
];

export const AVAILABLE_ICONS = [
    { id: 'mail', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'map-pin', label: 'Location' },
    { id: 'globe', label: 'Website' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'github', label: 'GitHub' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'twitter', label: 'Twitter/X' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'video', label: 'TikTok' },
    { id: 'at-sign', label: 'Gmail' },
    { id: 'briefcase', label: 'Portfolio' },
    { id: 'send', label: 'Telegram' },
    { id: 'link', label: 'Link' },
    { id: 'yahoo', label: 'Yahoo' },
];

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
];

export const SUPPORTED_TRANSLATE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
  { code: 'ko', name: 'Korean' },
  { code: 'nl', name: 'Dutch' },
  { code: 'hi', name: 'Hindi' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'el', name: 'Greek' },
  { code: 'cs', name: 'Czech' },
  { code: 'ro', name: 'Romanian' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'th', name: 'Thai' },
  { code: 'fi', name: 'Finnish' },
  { code: 'da', name: 'Danish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'he', name: 'Hebrew' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ms', name: 'Malay' },
  { code: 'sk', name: 'Slovak' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Albanian' },
  { code: 'am', name: 'Amharic' },
  { code: 'hy', name: 'Armenian' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'eu', name: 'Basque' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'ceb', name: 'Cebuano' },
  { code: 'ny', name: 'Chichewa' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'co', name: 'Corsican' },
  { code: 'hr', name: 'Croatian' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'et', name: 'Estonian' },
  { code: 'tl', name: 'Filipino' },
  { code: 'fy', name: 'Frisian' },
  { code: 'gl', name: 'Galician' },
  { code: 'ka', name: 'Georgian' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ht', name: 'Haitian Creole' },
  { code: 'ha', name: 'Hausa' },
  { code: 'haw', name: 'Hawaiian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'ig', name: 'Igbo' },
  { code: 'ga', name: 'Irish' },
  { code: 'jw', name: 'Javanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' },
  { code: 'ku', name: 'Kurdish (Kurmanji)' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'lo', name: 'Lao' },
  { code: 'la', name: 'Latin' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lb', name: 'Luxembourgish' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'mg', name: 'Malagasy' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mt', name: 'Maltese' },
  { code: 'mi', name: 'Maori' },
  { code: 'mr', name: 'Marathi' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'my', name: 'Myanmar (Burmese)' },
  { code: 'ne', name: 'Nepali' },
  { code: 'ps', name: 'Pashto' },
  { code: 'fa', name: 'Persian' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'sm', name: 'Samoan' },
  { code: 'gd', name: 'Scots Gaelic' },
  { code: 'sr', name: 'Serbian' },
  { code: 'st', name: 'Sesotho' },
  { code: 'sn', name: 'Shona' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'si', name: 'Sinhala' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'so', name: 'Somali' },
  { code: 'su', name: 'Sundanese' },
  { code: 'sw', name: 'Swahili' },
  { code: 'tg', name: 'Tajik' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'ur', name: 'Urdu' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'cy', name: 'Welsh' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'yi', name: 'Yiddish' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' }
];

export const EXPORT_OPTIONS = [
  { id: 'pdf', name: 'PDF Document', recommendation: 'Best for job applications and professional sharing.' },
  { id: 'png', name: 'PNG Image (Full)', recommendation: 'High-quality image of the entire resume.' },
  { id: '1:1', name: 'Square Image (1:1)', recommendation: 'Ideal for profile pictures or social media posts.' },
  { id: '16:9', name: 'Widescreen Image (16:9)', recommendation: 'Great for presentation slides or banners.' },
  { id: '9:16', name: 'Story Image (9:16)', recommendation: 'Perfect for sharing on mobile stories.' },
  { id: '4:5', name: 'Portrait Image (4:5)', recommendation: 'Optimized for social media feeds.' },
];
