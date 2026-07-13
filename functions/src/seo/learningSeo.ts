export type LearningSeoSlug = 'ai-agent-curriculum' | 'coding-interview-patterns';

export interface LearningSeoPage {
    path: string;
    title: string;
    description: string;
    heading: string;
    introduction: string;
    duration: string;
    level: string;
    access: string;
    topics: string[];
    faqs: Array<{ question: string; answer: string }>;
}

const pages: Record<'catalog' | LearningSeoSlug, LearningSeoPage> = {
    catalog: {
        path: '/learning',
        title: 'Interactive Courses: AI Agents and Coding Interview Patterns',
        description: 'Learn by doing with CareerVivid interactive courses: build AI agents from LLM foundations or practice 20 coding interview patterns with step-through algorithm animations and code labs.',
        heading: 'Interactive courses for AI agents and coding interviews',
        introduction: 'CareerVivid offers hands-on learning paths with readings, animations, quizzes, and runnable code labs. Choose a course and learn by doing.',
        duration: 'Two self-paced online courses',
        level: 'Beginner through advanced',
        access: 'Courses include free starting access.',
        topics: ['AI agent building', 'Coding interview preparation'],
        faqs: [],
    },
    'ai-agent-curriculum': {
        path: '/learning/ai-agent-curriculum',
        title: 'AI Agent Builder Curriculum: Learn to Build AI Agents',
        description: 'Learn to build AI agents in 10 practical modules: LLM foundations, prompting, RAG, agent architecture, evaluation, security, deployment, and a portfolio project. Module 1 is free.',
        heading: 'AI Agent Builder Curriculum',
        introduction: 'Build a practical mental model of AI agents, then apply it through readings, animated playgrounds, quizzes, and code labs from LLM foundations to a portfolio project.',
        duration: '10 modules, 58 lessons, about 9 hours',
        level: 'Beginner to advanced',
        access: 'The Foundations module is free. Later modules follow CareerVivid account and plan access rules.',
        topics: ['LLM foundations', 'Prompt engineering', 'Retrieval-augmented generation', 'Agent architecture', 'Multi-agent systems', 'Evaluation and observability', 'AI agent security', 'Deployment and a portfolio capstone'],
        faqs: [
            { question: 'What does the AI Agent Builder Curriculum cover?', answer: 'The curriculum covers LLM foundations, prompting, RAG, agent architecture, multi-agent systems, evaluation, security, deployment, and a portfolio capstone.' },
            { question: 'Can I start the AI Agent Builder Curriculum for free?', answer: 'Yes. The Foundations module is free to start. Later modules follow CareerVivid account and plan access rules.' },
        ],
    },
    'coding-interview-patterns': {
        path: '/learning/coding-interview-patterns',
        title: 'Coding Interview Patterns: 20 Visual Algorithm Lessons',
        description: 'Master 20 coding interview patterns through visual step-through animations, clear recognition signals, and runnable code labs. Practice arrays, graphs, trees, dynamic programming, and advanced algorithms for free.',
        heading: 'Coding Interview Patterns',
        introduction: 'Learn how to recognize common interview patterns, watch the algorithm state change one step at a time, and implement each pattern in a runnable JavaScript code lab.',
        duration: '20 patterns, 60 lessons, about 4 hours',
        level: 'Intermediate',
        access: 'Coding Interview Patterns is currently free to access.',
        topics: ['Arrays and pointers', 'Sliding windows and binary search', 'Trees and graphs', 'Dynamic programming', 'Divide and conquer and quickselect', 'String matching', 'Union Find and range trees', 'Minimum spanning trees, shortest paths, and network flow'],
        faqs: [
            { question: 'Which coding interview patterns are included?', answer: 'The course includes array, linked-list, tree, graph, optimization, string matching, range-query, shortest-path, and network-flow patterns, each with an animation and practice lesson.' },
            { question: 'Is Coding Interview Patterns free?', answer: 'Yes. Coding Interview Patterns is currently free to access on CareerVivid.' },
        ],
    },
};

export const getLearningSeoPage = (slug?: string): LearningSeoPage | null => {
    if (!slug) return pages.catalog;
    return slug === 'ai-agent-curriculum' || slug === 'coding-interview-patterns' ? pages[slug] : null;
};
