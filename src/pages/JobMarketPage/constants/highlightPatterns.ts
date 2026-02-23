// Comprehensive library of patterns to highlight important job information across all industries
export interface HighlightPattern {
    regex: RegExp;
    className: string;
    type?: 'email' | 'link';
}

export const HIGHLIGHT_PATTERNS: HighlightPattern[] = [
    // 1. Salary & Compensation (Green)
    { regex: /\$[\d,]+(k)?(\/yr|\/year|\/mo|\/month|\/hr|\/hour)?(\s?-\s?\$[\d,]+(k)?(\/yr|\/year|\/mo|\/month|\/hr|\/hour)?)?/gi, className: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-1 rounded font-medium" },
    { regex: /\b(\d{2,3}k\s?-\s?\d{2,3}k|competitive salary|negotiable|doe|depending on experience)\b/gi, className: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-1 rounded font-medium" },

    // 2. Benefits & Perks (Blue)
    { regex: /\b(401\(?k\)?|health insurance|medical insurance|life insurance|pto|paid time off|paid vacation|sick leave|parental leave|maternity leave|paternity leave|equity|stock options|rsu|espp|dental|vision|wellness|gym membership|commuter benefits|tuition reimbursement|professional development|learning budget|signing bonus|annual bonus|performance bonus|relocation assistance|retirement|pension|profit sharing|employee discount|free meals|catered lunches|childcare|continuing education)\b/gi, className: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-1 rounded font-medium" },

    // 3. Work Arrangement (Teal)
    { regex: /\b(remote|fully remote|remote-friendly|hybrid|on-site|onsite|in-office|work from anywhere|distributed team|flexible location|telecommute|virtual|field-based)\b/gi, className: "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 px-1 rounded font-medium" },

    // 4. Experience Requirements (Orange)
    { regex: /\b(\d+\+?\s?(years?|yrs?)\s?(of)?\s?(experience|exp)?|\d+\s?-\s?\d+\s?(years?|yrs?)|entry[- ]level|mid[- ]level|senior[- ]level|staff[- ]level|principal|lead|junior|senior|experienced|intern|internship|new grad|associate|manager|director|executive|vp|vice president|c-level|ceo|cfo|cto|coo)\b/gi, className: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-1 rounded font-medium" },

    // 5. Education & Certifications (Purple)
    { regex: /\b(bachelor'?s?|master'?s?|phd|doctorate|mba|bs|ba|ms|ma|md|jd|dds|dmd|pharmd|dnp|msn|bsn|degree|diploma|certification|certified|license|licensed|board certified|cpa|cfa|cfp|pmp|shrm|aws certified|google certified|microsoft certified|scrum master|six sigma|osha|hipaa compliant|acls|bls|cpr certified|emt|paramedic|lpn|rn|np|pa-c|lcsw|lpc|lmft)\b/gi, className: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-1 rounded font-medium" },

    // 6. Technical Skills - Programming & Software (Rose)
    { regex: /\b(javascript|typescript|python|java|c\+\+|c#|ruby|go|golang|rust|swift|kotlin|scala|php|perl|sql|nosql|html|css|sass|excel|word|powerpoint|outlook|quickbooks|sap|oracle|epic|cerner|meditech|autocad|solidworks|revit|photoshop|illustrator|indesign|premiere|final cut|logic pro|pro tools|ableton)\b/gi, className: "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 px-1 rounded font-medium" },

    // 7. Technical Skills - Frameworks, Tools & Platforms (Cyan)
    { regex: /\b(react|angular|vue|node\.?js|express|django|flask|spring|\.net|rails|laravel|next\.?js|docker|kubernetes|aws|azure|gcp|terraform|jenkins|git|github|gitlab|jira|confluence|figma|tableau|power bi|salesforce|hubspot|mongodb|postgresql|mysql|redis|elasticsearch|graphql|rest api|microservices|ci\/cd|agile|scrum|kanban|lean|waterfall|seo|google analytics|mailchimp|hootsuite|buffer|slack|teams|zoom|asana|trello|monday\.com|notion|ai|artificial intelligence|ml|machine learning|deep learning|nlp|natural language processing|llm|large language model|generative ai|genai|computer vision|robotics|blockchain|iot|internet of things|cloud computing|big data|data science|saas|paas|iaas|algorithm|data structure|scalability|security|encryption|cybersecurity)\b/gi, className: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 px-1 rounded font-medium" },

    // 8. Soft Skills & Professional Qualities (Amber)
    { regex: /\b(communication skills|leadership|team player|problem[- ]solving|critical thinking|collaboration|cross[- ]functional|stakeholder management|project management|time management|self[- ]starter|detail[- ]oriented|analytical|creative|innovative|innovation|adaptable|fast[- ]paced|entrepreneurial|customer service|client facing|patient care|bedside manner|interpersonal|negotiation|presentation skills|public speaking|conflict resolution|emotional intelligence|multitasking|organizational skills|bilingual|multilingual|fluent in)\b/gi, className: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-1 rounded font-medium" },

    // 9. Urgency & Hiring Keywords (Red)
    { regex: /\b(hiring immediately|urgent|asap|start immediately|immediate start|now hiring|actively hiring|fast[- ]track|priority hire|multiple openings|growing team|expanding|new position)\b/gi, className: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-1 rounded font-medium" },

    // 10. Company Culture & Values (Indigo)
    { regex: /\b(diversity|inclusion|dei|equal opportunity|inclusive|work[- ]life balance|culture|values-driven|mission-driven|growth mindset|transparent|collaborative environment|supportive team|mentorship|career growth|promotion opportunities|family-owned|startup|fortune 500|non-profit|sustainability|green|eco-friendly)\b/gi, className: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-1 rounded font-medium" },

    // 11. Healthcare-Specific Keywords (Emerald)
    { regex: /\b(patient care|clinical|icu|er|emergency room|operating room|surgery|outpatient|inpatient|acute care|long-term care|hospice|home health|telemedicine|telehealth|ehr|emr|electronic health records|hipaa|jcaho|cms|medicaid|medicare|insurance verification|prior authorization|medical billing|medical coding|icd-10|cpt|phlebotomy|vitals|medication administration|wound care|iv therapy|dialysis|oncology|pediatrics|geriatrics|obstetrics|cardiology|neurology|orthopedics|radiology|laboratory)\b/gi, className: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-1 rounded font-medium" },

    // 12. Finance & Business Keywords (Lime)
    { regex: /\b(financial analysis|budgeting|forecasting|gaap|ifrs|audit|tax|compliance|risk management|portfolio management|asset management|investment|trading|underwriting|due diligence|m&a|mergers and acquisitions|ipo|venture capital|private equity|hedge fund|mutual fund|securities|derivatives|fixed income|equities|commodities|forex|bloomberg|reuters|finra|sec|regulatory|anti-money laundering|aml|kyc|know your customer|sox|sarbanes-oxley)\b/gi, className: "bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-300 px-1 rounded font-medium" },

    // 13. Creative & Marketing Keywords (Fuchsia)
    { regex: /\b(brand|branding|creative direction|art direction|copywriting|content creation|content marketing|social media marketing|digital marketing|email marketing|marketing automation|lead generation|conversion|roi|kpi|analytics|a\/b testing|ux|ui|user experience|user interface|wireframe|prototype|design system|typography|color theory|photography|videography|video editing|motion graphics|animation|storyboard|campaign|advertising|media buying|pr|public relations|influencer|brand ambassador)\b/gi, className: "bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-800 dark:text-fuchsia-300 px-1 rounded font-medium" },

    // 14. Education Keywords (Sky)
    { regex: /\b(curriculum|lesson plan|classroom management|student engagement|differentiated instruction|iep|individualized education|special education|sped|esl|english as a second language|k-12|higher education|online learning|e-learning|lms|learning management|blackboard|canvas|moodle|tutoring|teaching assistant|ta|research assistant|ra|tenure|tenure-track|adjunct|professor|lecturer|department chair|academic advisor|student affairs|admissions|registrar|accreditation)\b/gi, className: "bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 px-1 rounded font-medium" },

    // 15. Trades & Services Keywords (Stone)
    { regex: /\b(journeyman|apprentice|master|licensed electrician|licensed plumber|hvac|refrigeration|carpentry|woodworking|welding|machining|cnc|blueprint|schematic|electrical code|nec|building code|osha|safety|ppe|hand tools|power tools|installation|maintenance|repair|troubleshooting|preventive maintenance|commercial|residential|industrial|construction|renovation|remodel|blueprint reading|estimating|bid|permit|inspection|foreman|superintendent|site manager|crew lead)\b/gi, className: "bg-stone-200 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 px-1 rounded font-medium" },

    // 16. Emails (Clickable)
    { regex: /\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/gi, className: "text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer", type: 'email' },

    // 17. URLs (Clickable links)
    { regex: /(https?:\/\/[^\s]+)/gi, className: "text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5", type: 'link' }
];

export interface HighlightLegendItem {
    color: string;
    label: string;
    examples: string;
}

export const HIGHLIGHT_LEGEND: HighlightLegendItem[] = [
    { color: 'bg-green-100 dark:bg-green-900/30', label: 'Salary & Compensation', examples: '$120k, $80k-100k/yr, Competitive Salary' },
    { color: 'bg-blue-100 dark:bg-blue-900/30', label: 'Benefits & Perks', examples: '401k, Health Insurance, Stock Options, PTO, Signing Bonus' },
    { color: 'bg-teal-100 dark:bg-teal-900/30', label: 'Work Arrangement', examples: 'Remote, Hybrid, On-site, Work from Anywhere' },
    { color: 'bg-orange-100 dark:bg-orange-900/30', label: 'Experience Level', examples: '5+ years, Senior, Entry-level, Manager, Director' },
    { color: 'bg-purple-100 dark:bg-purple-900/30', label: 'Education & Certifications', examples: "Bachelor's, MBA, PhD, CPA, PMP, RN, Licensed" },
    { color: 'bg-rose-100 dark:bg-rose-900/30', label: 'Programming & Software', examples: 'Python, JavaScript, Excel, AutoCAD, Photoshop' },
    { color: 'bg-cyan-100 dark:bg-cyan-900/30', label: 'Frameworks, Tools & AI', examples: 'React, AWS, AI, Machine Learning, Jira' },
    { color: 'bg-amber-100 dark:bg-amber-900/30', label: 'Soft Skills', examples: 'Leadership, Problem-solving, Communication, Bilingual' },
    { color: 'bg-red-100 dark:bg-red-900/30', label: 'Urgency Keywords', examples: 'Hiring Immediately, ASAP, Now Hiring' },
    { color: 'bg-indigo-100 dark:bg-indigo-900/30', label: 'Company Culture', examples: 'Diversity, Work-life Balance, Mentorship, Growth' },
    { color: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Healthcare Industry', examples: 'Patient Care, ICU, HIPAA, EHR, Nursing' },
    { color: 'bg-lime-100 dark:bg-lime-900/30', label: 'Finance Industry', examples: 'GAAP, Audit, Compliance, Risk, Investment' },
    { color: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', label: 'Creative & Marketing', examples: 'Branding, UX/UI, Content Marketing, SEO' },
    { color: 'bg-sky-100 dark:bg-sky-900/30', label: 'Education Industry', examples: 'Curriculum, IEP, K-12, Tenure, LMS' },
    { color: 'bg-stone-200 dark:bg-stone-800/50', label: 'Trades & Services', examples: 'Journeyman, HVAC, Electrician, OSHA, Blueprint' },
];
