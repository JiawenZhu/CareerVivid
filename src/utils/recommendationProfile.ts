import { ResumeData } from '../types';
import { PortfolioData } from '../features/portfolio/types/portfolio';

type ProfileSourceInput = {
    resumes?: Array<Partial<ResumeData>>;
    portfolios?: Array<Partial<PortfolioData>>;
};

const CORE_RECOMMENDATION_TERMS = [
    'React',
    'TypeScript',
    'JavaScript',
    'HTML',
    'CSS',
    'Next.js',
    'Node.js',
    'Python',
    'Java',
    'Spring Boot',
    'GraphQL',
    'REST APIs',
    'PostgreSQL',
    'MySQL',
    'Firebase',
    'Firestore',
    'AWS',
    'Google Cloud',
    'CI/CD',
    'Testing',
    'Accessibility',
    'Design Systems',
    'System Design',
    'Full Stack',
    'Frontend',
    'Backend',
    'Chrome Extension',
    'AI',
    'LLM',
    'Agentic AI',
];

const TERM_ALIASES: Record<string, string[]> = {
    'REST APIs': ['rest', 'rest api', 'rest apis'],
    'CI/CD': ['ci/cd', 'continuous integration', 'continuous deployment'],
    'Google Cloud': ['google cloud', 'gcp'],
    'Design Systems': ['design system', 'design systems'],
    'System Design': ['system design', 'architecture'],
    'Full Stack': ['full stack', 'fullstack'],
    'Frontend': ['frontend', 'front end'],
    'Backend': ['backend', 'back end'],
    'Chrome Extension': ['chrome extension', 'browser extension'],
    'LLM': ['llm', 'large language model'],
    'Agentic AI': ['agentic ai', 'ai agent', 'agents'],
};

const normalize = (value: string): string => value
    .toLowerCase()
    .replace(/c\+\+/g, 'cpp')
    .replace(/c#/g, 'csharp')
    .replace(/[^a-z0-9+#.]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const addText = (parts: string[], value: unknown) => {
    if (typeof value === 'string' && value.trim()) parts.push(value);
};

const addUnknownTextFields = (parts: string[], value: unknown, depth = 0) => {
    if (!value || depth > 2) return;
    if (typeof value === 'string') {
        addText(parts, value);
        return;
    }
    if (Array.isArray(value)) {
        value.slice(0, 24).forEach((item) => addUnknownTextFields(parts, item, depth + 1));
        return;
    }
    if (typeof value === 'object') {
        Object.values(value as Record<string, unknown>).forEach((item) => addUnknownTextFields(parts, item, depth + 1));
    }
};

const collectResumeText = (resume: Partial<ResumeData>): string[] => {
    const parts: string[] = [];
    addText(parts, resume.title);
    addText(parts, resume.personalDetails?.jobTitle);
    addText(parts, resume.professionalSummary);
    resume.skills?.forEach((skill) => addText(parts, skill.name));
    resume.employmentHistory?.forEach((role) => {
        addText(parts, role.jobTitle);
        addText(parts, role.employer);
        addText(parts, role.description);
    });
    resume.education?.forEach((education) => {
        addText(parts, education.degree);
        addText(parts, education.description);
    });
    resume.websites?.forEach((website) => {
        addText(parts, website.label);
        addText(parts, website.platform);
    });
    return parts;
};

const collectPortfolioText = (portfolio: Partial<PortfolioData>): string[] => {
    const parts: string[] = [];
    addText(parts, portfolio.title);
    addText(parts, portfolio.hero?.headline);
    addText(parts, portfolio.hero?.subheadline);
    addText(parts, portfolio.about);
    addUnknownTextFields(parts, portfolio.techStack);
    addUnknownTextFields(parts, portfolio.projects);
    addUnknownTextFields(parts, portfolio.timeline);
    addUnknownTextFields(parts, portfolio.socialLinks);
    return parts;
};

const uniqueTerms = (terms: string[]): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];
    terms.forEach((term) => {
        const key = normalize(term);
        if (!key || seen.has(key)) return;
        seen.add(key);
        result.push(term);
    });
    return result;
};

const termAliases = (term: string): string[] => TERM_ALIASES[term] || [term];

const normalizedAliases = (term: string): string[] => termAliases(term).map(normalize).filter(Boolean);

const textContainsTerm = (text: string, term: string): boolean => (
    normalizedAliases(term).some((alias) => text.includes(alias))
);

const profileHasTerm = (profileKeywords: string[], term: string): boolean => {
    const targetAliases = normalizedAliases(term);
    return profileKeywords.some((profileTerm) => {
        const profileAliases = normalizedAliases(profileTerm);
        return profileAliases.some((profileAlias) => (
            targetAliases.some((targetAlias) => profileAlias === targetAlias || profileAlias.includes(targetAlias) || targetAlias.includes(profileAlias))
        ));
    });
};

export const extractRecommendationProfileKeywords = ({
    resumes = [],
    portfolios = [],
}: ProfileSourceInput): string[] => {
    const profileTextParts = [
        ...resumes.flatMap(collectResumeText),
        ...portfolios.flatMap(collectPortfolioText),
    ];
    const normalizedProfileText = normalize(profileTextParts.join(' '));
    const explicitSkillTerms = resumes.flatMap((resume) => resume.skills || [])
        .map((skill) => skill.name)
        .filter((skill): skill is string => Boolean(skill?.trim()));
    const explicitPortfolioTerms = portfolios.flatMap((portfolio) => {
        const terms: string[] = [];
        addUnknownTextFields(terms, portfolio.techStack);
        portfolio.projects?.forEach((project) => {
            addText(terms, project.title);
            addText(terms, project.description);
            project.tags?.forEach((tag) => addText(terms, tag));
        });
        return terms;
    });
    const matchedCoreTerms = CORE_RECOMMENDATION_TERMS.filter((term) => {
        const aliases = TERM_ALIASES[term] || [term];
        return aliases.some((alias) => normalizedProfileText.includes(normalize(alias)));
    });
    const profileTerms = uniqueTerms([
        ...explicitSkillTerms,
        ...explicitPortfolioTerms,
        ...matchedCoreTerms,
    ])
        .filter((term) => normalize(term).length >= 2)
        .slice(0, 24);

    return profileTerms;
};

export const getProfileKeywordFit = (
    jobText: string,
    profileKeywords: string[],
    jobKeywordCandidates: string[] = [],
    maxMissing = 6
): { matchedKeywords: string[]; missingKeywords: string[] } => {
    const normalizedJobText = normalize(jobText);
    const uniqueProfileKeywords = uniqueTerms(profileKeywords);
    const inferredJobTerms = CORE_RECOMMENDATION_TERMS.filter((term) => textContainsTerm(normalizedJobText, term));
    const jobTerms = uniqueTerms([...jobKeywordCandidates, ...inferredJobTerms])
        .filter((term) => normalize(term).length >= 2)
        .filter((term) => textContainsTerm(normalizedJobText, term) || jobKeywordCandidates.includes(term))
        .slice(0, 18);

    const matchedKeywords = jobTerms.filter((term) => profileHasTerm(uniqueProfileKeywords, term));
    const missingKeywords = jobTerms
        .filter((term) => !profileHasTerm(uniqueProfileKeywords, term))
        .slice(0, maxMissing);

    return {
        matchedKeywords,
        missingKeywords,
    };
};
