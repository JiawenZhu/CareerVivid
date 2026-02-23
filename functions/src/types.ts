
export interface PersonalDetails {
  jobTitle: string;
  photo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface WebsiteLink {
  id: string;
  label: string;
  url: string;
}

export interface Skill {
  id: string;
  name: string;
  level: 'Novice' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface Language {
  id: string;
  name: string;
  level: string;
}

export interface EmploymentHistory {
  id: string;
  jobTitle: string;
  employer: string;
  city: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  city: string;
  startDate: string;
  endDate: string;
  description: string;
}

export type TemplateId = string;

export type SharePermission = 'viewer' | 'commenter' | 'editor';

export interface ShareConfig {
  enabled: boolean;
  permission: SharePermission;
  shareId?: string;
}

export interface ResumeData {
  id: string;
  title: string;
  updatedAt: string;
  templateId: TemplateId;
  personalDetails: PersonalDetails;
  professionalSummary: string;
  websites: WebsiteLink[];
  skills: Skill[];
  employmentHistory: EmploymentHistory[];
  education: Education[];
  languages: Language[];
  themeColor: string;
  titleFont: string;
  bodyFont: string;
  language: string;
  section?: string;
  shareConfig?: ShareConfig;
}
