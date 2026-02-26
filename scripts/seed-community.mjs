/**
 * seed-community.mjs — Phase 3: Dev Seeding Script
 * Run with: node scripts/seed-community.mjs
 *
 * Requires VITE_FIREBASE_* env vars to be set (reads from .env).
 * Injects realistic community posts into `community_posts` in Firestore.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

// Parse .env manually (no dotenv needed in modern Node)
const env = {};
try {
    readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [key, ...vals] = line.trim().split('=');
        if (key && !key.startsWith('#')) env[key] = vals.join('=').replace(/^["']|["']$/g, '');
    });
} catch {
    console.error('⚠️  Could not read .env file. Make sure it exists at project root.');
    process.exit(1);
}

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const now = () => Timestamp.fromDate(new Date());
const daysAgo = (n) => Timestamp.fromDate(new Date(Date.now() - n * 86_400_000));

const SEED_POSTS = [
    {
        authorId: 'seed_user_1',
        authorName: 'Alex Chen',
        authorAvatar: 'https://i.pravatar.cc/150?u=alex_chen',
        authorRole: 'Senior Software Engineer @ Stripe',
        title: 'How I Nailed the System Design Interview at Stripe (with Excalidraw)',
        content: `## The Call that Changed My Tech Career

After three months of preparation, I finally got the call — an onsite at Stripe.

## The System Design Round

The prompt was simple: *"Design a payment processing system that handles 100k TPS."*

### My approach using Excalidraw:

I opened an Excalidraw whiteboard and started with the high-level architecture:

\`\`\`
Client → API Gateway → Load Balancer → Payment Service
                                    ↓
                              Message Queue (Kafka)
                                    ↓
                            Settlement Workers
                                    ↓
                             Database (Sharded Postgres)
\`\`\`

### Key design decisions I made:

1. **Idempotency keys** — Every payment request gets a unique idempotency key stored in Redis for 24 hours.
2. **Saga Pattern** — For distributed transactions across services.
3. **Event sourcing** — All state changes are captured as immutable events.

## The Result

The interviewers loved that I **drew first, talked second**. Excalidraw let me iterate live while explaining tradeoffs.

> Pro tip: Always start with the happy path, then ask about failure modes.

I got the offer. Total prep time: 90 days, 3 mock interviews, 12 Excalidraw diagrams.`,
        coverImage: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=2070',
        tags: ['system-design', 'interview-prep', 'stripe', 'career'],
        readTime: 6,
        metrics: { likes: 142, comments: 38, views: 2840 },
        createdAt: daysAgo(3),
        updatedAt: daysAgo(3),
    },
    {
        authorId: 'seed_user_2',
        authorName: 'Maya Patel',
        authorAvatar: 'https://i.pravatar.cc/150?u=maya_patel',
        authorRole: 'Frontend Lead @ Netflix',
        title: 'Why Your React Portfolio Isn\'t Getting You Interviews (And How to Fix It)',
        content: `## The Brutal Truth

I've reviewed 200+ portfolios as a hiring manager. Here's what kills 90% of them.

### ❌ The 5 Portfolio Killers

**1. Todo apps and weather clones**
Every junior dev has these. They signal zero ambition.

**2. No deployed demo**
"Ask me for the demo link" means you lose. Deploy everywhere — Vercel is free.

**3. No code quality signals**
No tests? No TypeScript? No CI badge? Red flags.

**4. Generic project descriptions**
"A full-stack app built with React and Node" tells me nothing. Tell me the *problem you solved*.

**5. Missing metrics**
"Optimized performance" → "Reduced LCP from 4.2s to 0.9s, improving conversion by 23%"

### ✅ What Actually Works

\`\`\`tsx
// Instead of this:
const App = () => <div>Hello World</div>

// Show this — real data, real problems solved:
const Dashboard = () => {
  const { data, isLoading } = useSWR('/api/metrics', {
    refreshInterval: 30_000,
    suspense: true,
  });
  // ...
}
\`\`\`

### The One Project That Gets Interviews

Build something that solves YOUR pain point. Mine was a CLI tool to automate PR descriptions. It got me 4 interviews in 2 weeks after I open-sourced it.

> Your portfolio is your best marketing asset. Treat it like a product, not a school project.`,
        tags: ['react', 'portfolio', 'career-advice', 'hiring'],
        readTime: 5,
        metrics: { likes: 234, comments: 67, views: 5120 },
        createdAt: daysAgo(7),
        updatedAt: daysAgo(7),
    },
    {
        authorId: 'seed_user_3',
        authorName: 'Jordan Wright',
        authorAvatar: 'https://i.pravatar.cc/150?u=jordan_wright',
        authorRole: 'Staff Engineer @ Airbnb',
        title: 'From Bootcamp to $220k: My 3-Year Journey in Tech',
        content: `## Year 1: The Grind ($72k)

Graduated from a 12-week coding bootcamp. Took the first offer I got — a React frontend role at a tiny startup. No negotiation. Big mistake.

### What I Did Right
- Shipped code on day 2
- Got obsessed with performance profiling
- Started a "today I learned" engineering blog

## Year 2: The Pivot ($130k)

Got recruited by a mid-size fintech after my blog post on micro-frontends went viral (3k LinkedIn shares).

### The Salary Jump Secret
Job hopping is real. I got a 58% raise by switching. Staying loyal at the same company got me a 4% annual raise. The math is obvious.

## Year 3: Staff Engineer ($220k)

The key was **scope**. I stopped thinking about features and started thinking about **systems**.

### The Framework I Use for System Impact

\`\`\`
Impact = (Users Affected) × (Severity of Problem Solved) × (Longevity of Solution)
\`\`\`

A performance optimization I did in Year 3:
- Affected: 2M daily active users
- Problem: App crashes on low-end Android devices
- Solution: Implemented list virtualization and lazy loading
- Result: 60% reduction in crash rate, $4M in recovered annual revenue

**That's what gets you to Staff.**

> The technical skills get you in the door. The business impact opens every door after that.`,
        tags: ['career-advice', 'salary', 'bootcamp', 'staff-engineer'],
        readTime: 7,
        metrics: { likes: 891, comments: 124, views: 18300 },
        createdAt: daysAgo(14),
        updatedAt: daysAgo(14),
    },
    {
        authorId: 'seed_user_4',
        authorName: 'Dr. Sarah Kim',
        authorAvatar: 'https://i.pravatar.cc/150?u=sarah_kim',
        authorRole: 'Engineering Manager @ Google',
        title: '10 Questions I Ask in Every Interview (And What I\'m Really Looking For)',
        content: `## Why Most Candidates Get Interviews Wrong

Interviews are conversations, not interrogations. After conducting 400+ interviews at Google, here's my question playbook.

### The Questions (And The Real Scoring Rubric)

**"Walk me through a technical decision you made that turned out to be wrong."**

> I'm not testing knowledge. I'm testing self-awareness, psychological safety, and growth mindset.

**"What's the largest codebase you've navigated, and how did you approach understanding it?"**

> This reveals whether they read docs, dig into git blame, ask teammates, or just grep randomly.

**"Tell me about a time you disagreed with your tech lead."**

> Collaboration under disagreement. Do they escalate well? Do they commit after losing the debate?

### The One Question That Predicts Success

*"What would you do in your first 30 days here?"*

The candidates who answer this with specificity — who mention shipping a small bug fix, shadowing the on-call rotation, running 1:1s with every team member — those are the ones who hit the ground running.

### Red Flags I Watch For

- Uses "we" for everything (can't identify their personal contribution)
- Can't explain a past project to a non-technical person
- Hasn't asked *any* questions by the end of the interview

> The best interviews feel like two engineers solving a problem together. That's what you should aim for.`,
        tags: ['interview-prep', 'hiring', 'career-advice', 'google'],
        readTime: 8,
        metrics: { likes: 456, comments: 89, views: 9200 },
        createdAt: daysAgo(21),
        updatedAt: daysAgo(21),
    },
    {
        authorId: 'seed_user_5',
        authorName: 'Marcus Rivera',
        authorAvatar: 'https://i.pravatar.cc/150?u=marcus_rivera',
        authorRole: 'Open Source Maintainer & Indie Hacker',
        title: 'I Open-Sourced My Side Project and It Changed My Career',
        content: `## The Decision

In 2023, I was building a Markdown-based resume builder for myself. After 3 months, it had the features I needed. On a whim, I put it on GitHub.

Within 48 hours: 200 stars.

## What Open Source Did For Me

### Network Effects
GitHub became my resume. I got DMs from:
- Engineers at Meta, asking if I wanted to collaborate
- A VC, asking if I'd considered fundraising
- A bootcamp founder, asking if I'd license the tech

### The Compound Growth of Small PRs
Contributors started appearing. A designer in Finland redesigned the UI. A developer in Brazil added PDF export. I hadn't written those features — the community did.

\`\`\`
Stars:  Day 1 → 200
        Week 1 → 1,200  
        Month 1 → 4,500
        Today → 12,000
\`\`\`

### The Career Pivot

A company found the project, loved the code quality, and offered me a role as a founding engineer. I negotiated a 40% salary increase from my previous job.

## How to Do This

1. **Solve your own real problem first** — Authenticity shows
2. **Write exceptional README + docs** — This is your product page
3. **Be responsive to issues in the first week** — Momentum is everything
4. **Share on HN, Reddit r/programming, and Twitter** — One post can 10x your reach

> Open source compounds like interest. Every star is a potential hire, partner, or collaborator.`,
        tags: ['open-source', 'indie-hacker', 'career', 'react'],
        readTime: 5,
        metrics: { likes: 312, comments: 55, views: 6700 },
        createdAt: daysAgo(28),
        updatedAt: daysAgo(28),
    },
];

async function seed() {
    console.log('🌱 Seeding CareerVivid Community Posts...\n');

    for (const post of SEED_POSTS) {
        try {
            const docRef = await addDoc(collection(db, 'community_posts'), post);
            console.log(`✅ Created: "${post.title.substring(0, 50)}..." → ${docRef.id}`);
        } catch (err) {
            console.error(`❌ Failed: "${post.title.substring(0, 50)}..."\n   Error:`, err.message);
        }
    }

    console.log('\n🎉 Seeding complete! Check your Firebase console.');
    process.exit(0);
}

seed();
