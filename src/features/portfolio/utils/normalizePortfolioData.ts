import { PortfolioData, PortfolioProject } from '../types/portfolio';
import { Education, EmploymentHistory, Skill, WebsiteLink } from '../../../types';

const asArray = <T,>(value: T[] | null | undefined): T[] => Array.isArray(value) ? value : [];

const asString = (value: unknown, fallback = ''): string => (
    typeof value === 'string' && value.trim().length > 0 ? value : fallback
);

const asBoolean = (value: unknown, fallback = false): boolean => (
    typeof value === 'boolean' ? value : fallback
);

const normalizeProject = (project: Partial<PortfolioProject> | null | undefined, index: number): PortfolioProject => ({
    id: asString(project?.id, `project-${index + 1}`),
    title: asString(project?.title, 'Untitled Project'),
    description: asString(project?.description, 'Add a short project description.'),
    link: asString(project?.link),
    demoUrl: asString(project?.demoUrl),
    repoUrl: asString(project?.repoUrl),
    thumbnailUrl: asString(project?.thumbnailUrl),
    tags: asArray(project?.tags).filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
});

const normalizeSkill = (skill: Partial<Skill> | null | undefined, index: number): Skill => ({
    id: asString(skill?.id, `skill-${index + 1}`),
    name: asString(skill?.name, 'Skill'),
    level: skill?.level || 'Intermediate'
});

const normalizeJob = (job: Partial<EmploymentHistory> | null | undefined, index: number): EmploymentHistory => ({
    id: asString(job?.id, `role-${index + 1}`),
    jobTitle: asString(job?.jobTitle, 'Role Title'),
    employer: asString(job?.employer, 'Organization'),
    city: asString(job?.city),
    startDate: asString(job?.startDate),
    endDate: asString(job?.endDate, 'Present'),
    description: asString(job?.description, 'Add a short role description.')
});

const normalizeEducation = (education: Partial<Education> | null | undefined, index: number): Education => ({
    id: asString(education?.id, `education-${index + 1}`),
    school: asString(education?.school, 'School'),
    degree: asString(education?.degree, 'Credential'),
    city: asString(education?.city),
    startDate: asString(education?.startDate),
    endDate: asString(education?.endDate),
    description: asString(education?.description)
});

const normalizeSocialLink = (link: Partial<WebsiteLink> | null | undefined, index: number): WebsiteLink => ({
    id: asString(link?.id, `social-${index + 1}`),
    label: asString(link?.label, 'Website'),
    url: asString(link?.url, '#'),
    icon: asString(link?.icon),
    platform: asString(link?.platform),
    showUrl: asBoolean(link?.showUrl, false)
});

export const normalizePortfolioData = (data: PortfolioData): PortfolioData => {
    const linkInBio = data.linkInBio;
    const heroHeadline = asString(data.hero?.headline, linkInBio?.displayName || 'Your Name');
    const heroSubheadline = asString(data.hero?.subheadline, linkInBio?.bio || 'Tell people what you do.');

    return {
        ...data,
        id: asString(data.id, 'draft'),
        title: asString(data.title, `${heroHeadline} Portfolio`),
        hero: {
            ...(data.hero || {}),
            headline: heroHeadline,
            subheadline: heroSubheadline,
            avatarUrl: asString(data.hero?.avatarUrl || linkInBio?.profileImage),
            avatarSize: data.hero?.avatarSize || 'md',
            avatarShape: data.hero?.avatarShape || 'circle',
            avatarPosition: data.hero?.avatarPosition || 'left',
            ctaPrimaryLabel: asString(data.hero?.ctaPrimaryLabel, "Let's Talk"),
            ctaPrimaryUrl: asString(data.hero?.ctaPrimaryUrl),
            ctaSecondaryLabel: asString(data.hero?.ctaSecondaryLabel, 'View Work'),
            ctaSecondaryUrl: asString(data.hero?.ctaSecondaryUrl, '#work'),
            buttons: asArray(data.hero?.buttons as any)
        },
        about: asString(data.about, heroSubheadline),
        projects: asArray(data.projects as any).map(normalizeProject),
        timeline: asArray(data.timeline as any).map(normalizeJob),
        education: asArray(data.education as any).map(normalizeEducation),
        techStack: asArray(data.techStack as any).map(normalizeSkill),
        socialLinks: asArray(data.socialLinks as any).map(normalizeSocialLink),
        contactEmail: asString(data.contactEmail),
        theme: {
            primaryColor: asString(data.theme?.primaryColor, '#2563eb'),
            secondaryColor: asString(data.theme?.secondaryColor),
            textColor: asString(data.theme?.textColor),
            backgroundColor: asString(data.theme?.backgroundColor),
            darkMode: asBoolean(data.theme?.darkMode, false),
            fontFamily: asString(data.theme?.fontFamily),
            animations: data.theme?.animations,
            customCss: asString(data.theme?.customCss)
        },
        sectionLabels: {
            ...(data.sectionLabels || {})
        },
        linkInBio: linkInBio ? {
            ...linkInBio,
            links: asArray(linkInBio.links as any).map((link: any, index) => ({
                id: asString(link?.id, `link-${index + 1}`),
                label: asString(link?.label, 'Link'),
                url: asString(link?.url, '#'),
                icon: asString(link?.icon),
                variant: link?.variant || 'primary',
                style: link?.style || {},
                thumbnail: asString(link?.thumbnail),
                enabled: typeof link?.enabled === 'boolean' ? link.enabled : true,
                clicks: typeof link?.clicks === 'number' ? link.clicks : 0,
                order: typeof link?.order === 'number' ? link.order : index
            })),
            showSocial: asBoolean(linkInBio.showSocial, false),
            showEmail: asBoolean(linkInBio.showEmail, true),
            profileImage: asString(linkInBio.profileImage || data.hero?.avatarUrl),
            displayName: asString(linkInBio.displayName, heroHeadline),
            bio: asString(linkInBio.bio, heroSubheadline),
            customStyle: linkInBio.customStyle || {}
        } : undefined
    };
};
