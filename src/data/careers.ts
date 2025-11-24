
export interface Role {
  name: string;
}

export interface Industry {
  name: string;
  roles: Role[];
}

export const CAREER_PATHS: Industry[] = [
  {
    name: 'Technology',
    roles: [
      { name: 'Software Engineer' },
      { name: 'Cloud Engineer' },
      { name: 'Prompt Engineer' },
      { name: 'Machine Learning (ML) Engineer' },
      { name: 'Data Engineer' },
      { name: 'Data Scientist' },
      { name: 'Product Manager (PM)' },
      { name: 'UX/UI Designer' },
      { name: 'Cybersecurity Analyst' },
      { name: 'DevOps Engineer' },
      { name: 'IT Support Specialist' },
    ],
  },
  {
    name: 'Healthcare (Medical)',
    roles: [
      { name: 'Medical Doctor (MD)' },
      { name: 'Registered Nurse (RN)' },
      { name: 'Nurse Practitioner (NP)' },
      { name: 'Physician Assistant (PA)' },
      { name: 'Dentist' },
      { name: 'Pharmacist' },
      { name: 'Physical Therapist' },
      { name: 'Medical Laboratory Scientist' },
      { name: 'Medical Assistant' },
      { name: 'Certified Nursing Assistant (CNA)' },
    ],
  },
  {
    name: 'Finance & Business',
    roles: [
      { name: 'Financial Analyst' },
      { name: 'Accountant' },
      { name: 'Investment Banker' },
      { name: 'Financial Advisor' },
      { name: 'Auditor' },
      { name: 'Management Consultant' },
      { name: 'Business Analyst' },
      { name: 'Human Resources (HR) Manager' },
    ],
  },
  {
    name: 'Creative & Marketing',
    roles: [
      { name: 'Graphic Designer' },
      { name: 'Content Writer / Copywriter' },
      { name: 'Marketing Manager' },
      { name: 'Social Media Manager' },
      { name: 'Photographer / Videographer' },
      { name: 'Public Relations (PR) Specialist' },
    ],
  },
  {
    name: 'Education',
    roles: [
      { name: 'K-12 Teacher' },
      { name: 'University Professor' },
      { name: 'School Administrator' },
      { name: 'Librarian' },
    ],
  },
  {
    name: 'Trades & Services',
    roles: [
      { name: 'Electrician' },
      { name: 'Plumber' },
      { name: 'Carpenter' },
      { name: 'Chef / Head Cook' },
    ],
  },
];


export const DEMO_CAREER_PATHS = [
  { 
    name: 'Software Engineer', 
    prompt: 'A brief behavioral interview for a junior software engineer role.', 
    questions: ["Tell me about a challenging project you've worked on.", "How do you handle disagreements with a team member?"] 
  },
  { 
    name: 'Product Manager', 
    prompt: 'A short interview for an associate product manager position.', 
    questions: ["How would you decide which feature to build next?", "Describe a product you admire and why."] 
  },
  { 
    name: 'UX/UI Designer', 
    prompt: 'A quick portfolio review for a UX/UI designer.', 
    questions: ["Walk me through a design project you're proud of.", "How do you incorporate user feedback into your designs?"] 
  },
];