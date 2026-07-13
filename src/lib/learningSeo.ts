const BASE_URL = 'https://careervivid.app';
const PROVIDER = {
    '@type': 'Organization',
    name: 'CareerVivid',
    url: `${BASE_URL}/`,
};

type LearningSeoKey = 'catalog' | 'ai-agent-curriculum' | 'coding-interview-patterns';

export interface LearningSeoPage {
    path: string;
    title: string;
    description: string;
    keywords: string;
    schemaData: Record<string, unknown>;
}

const breadcrumb = (name: string, path: string) => ({
    '@type': 'BreadcrumbList',
    itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'CareerVivid', item: `${BASE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Learning', item: `${BASE_URL}/learning` },
        { '@type': 'ListItem', position: 3, name, item: `${BASE_URL}${path}` },
    ],
});

const courseSchema = ({
    name,
    path,
    description,
    hours,
    level,
    free,
    topics,
    faqs,
}: {
    name: string;
    path: string;
    description: string;
    hours: number;
    level: string;
    free: boolean;
    topics: string[];
    faqs: Array<{ question: string; answer: string }>;
}) => ({
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Course',
            '@id': `${BASE_URL}${path}#course`,
            name,
            description,
            url: `${BASE_URL}${path}`,
            provider: PROVIDER,
            educationalLevel: level,
            isAccessibleForFree: free,
            teaches: topics,
            hasCourseInstance: {
                '@type': 'CourseInstance',
                courseMode: 'online',
                courseWorkload: `PT${hours}H`,
            },
            ...(free ? { offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', category: 'Free' } } : {}),
        },
        breadcrumb(name, path),
        {
            '@type': 'FAQPage',
            mainEntity: faqs.map(({ question, answer }) => ({
                '@type': 'Question',
                name: question,
                acceptedAnswer: { '@type': 'Answer', text: answer },
            })),
        },
    ],
});

const PAGES: Record<LearningSeoKey, LearningSeoPage> = {
    catalog: {
        path: '/learning',
        title: 'Interactive Courses: AI Agents and Coding Interview Patterns',
        description: 'Learn by doing with CareerVivid interactive courses: build AI agents from LLM foundations or practice 20 coding interview patterns with step-through algorithm animations and code labs.',
        keywords: 'interactive online courses, AI agent course, learn AI agents, coding interview patterns, algorithm visualization, data structures and algorithms practice',
        schemaData: {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'CollectionPage',
                    '@id': `${BASE_URL}/learning#webpage`,
                    name: 'CareerVivid Interactive Courses',
                    description: 'Interactive CareerVivid courses for AI agent building and coding interview practice.',
                    url: `${BASE_URL}/learning`,
                    provider: PROVIDER,
                },
                {
                    '@type': 'ItemList',
                    name: 'CareerVivid interactive courses',
                    numberOfItems: 2,
                    itemListElement: [
                        {
                            '@type': 'ListItem',
                            position: 1,
                            url: `${BASE_URL}/learning/ai-agent-curriculum`,
                            name: 'AI Agent Builder Curriculum',
                        },
                        {
                            '@type': 'ListItem',
                            position: 2,
                            url: `${BASE_URL}/learning/coding-interview-patterns`,
                            name: 'Coding Interview Patterns',
                        },
                    ],
                },
            ],
        },
    },
    'ai-agent-curriculum': {
        path: '/learning/ai-agent-curriculum',
        title: 'AI Agent Builder Curriculum: Learn to Build AI Agents',
        description: 'Learn to build AI agents in 10 practical modules: LLM foundations, prompting, RAG, agent architecture, evaluation, security, deployment, and a portfolio project. Module 1 is free.',
        keywords: 'AI agent course, learn to build AI agents, LLM course, prompt engineering, RAG course, agent architecture, AI agent portfolio project',
        schemaData: courseSchema({
            name: 'AI Agent Builder Curriculum',
            path: '/learning/ai-agent-curriculum',
            description: 'A 10-module AI agent learning path from LLM foundations through a shipped portfolio project, with readings, animated playgrounds, quizzes, and code labs.',
            hours: 9,
            level: 'Beginner to Advanced',
            free: false,
            topics: ['LLM fundamentals', 'Prompt engineering', 'Retrieval-augmented generation', 'Agent architecture', 'Evaluation and observability', 'AI agent security', 'Deployment'],
            faqs: [
                { question: 'What does the AI Agent Builder Curriculum cover?', answer: 'The curriculum covers LLM foundations, prompting, RAG, agent architecture, multi-agent systems, evaluation, security, deployment, and a portfolio capstone.' },
                { question: 'Can I start the AI Agent Builder Curriculum for free?', answer: 'Yes. The Foundations module is available to start for free; later modules follow CareerVivid account and plan access rules.' },
            ],
        }),
    },
    'coding-interview-patterns': {
        path: '/learning/coding-interview-patterns',
        title: 'Coding Interview Patterns: 20 Visual Algorithm Lessons',
        description: 'Master 20 coding interview patterns through visual step-through animations, clear recognition signals, and runnable code labs. Practice arrays, graphs, trees, dynamic programming, and advanced algorithms for free.',
        keywords: 'coding interview patterns, data structures and algorithms course, algorithm visualization, coding interview practice, LeetCode patterns, graph algorithms, dynamic programming',
        schemaData: courseSchema({
            name: 'Coding Interview Patterns',
            path: '/learning/coding-interview-patterns',
            description: 'A free visual coding interview course with 20 algorithm patterns, 60 lessons, interactive animations, and runnable JavaScript code labs.',
            hours: 4,
            level: 'Intermediate',
            free: true,
            topics: ['Two pointers', 'Sliding window', 'Binary search', 'Trees and graphs', 'Dynamic programming', 'Union Find', 'Minimum spanning tree', 'Network flow'],
            faqs: [
                { question: 'Which coding interview patterns are included?', answer: 'The course includes array, linked-list, tree, graph, optimization, string matching, range-query, shortest-path, and network-flow patterns, each with an animation and practice lesson.' },
                { question: 'Is Coding Interview Patterns free?', answer: 'Yes. Coding Interview Patterns is currently free to access on CareerVivid.' },
            ],
        }),
    },
};

export const getLearningSeoPage = (key: LearningSeoKey): LearningSeoPage => PAGES[key];

export const getLearningSeoKey = (selectedCourseId: string | null): LearningSeoKey => {
    if (selectedCourseId === 'coding-interview-patterns') return 'coding-interview-patterns';
    if (selectedCourseId === 'ai-agent-curriculum') return 'ai-agent-curriculum';
    return selectedCourseId ? 'ai-agent-curriculum' : 'catalog';
};
