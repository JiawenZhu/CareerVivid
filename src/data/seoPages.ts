export interface SeoPageData {
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  content: {
    heroSubtitle: string;
    sections: {
      heading: string;
      body: string;
    }[];
  };
}

export const seoPagesData: Record<string, SeoPageData> = {
  "ai-job-search-workspace": {
    slug: "ai-job-search-workspace",
    title: "AI Job Search Workspace | CareerVivid",
    h1: "One AI Workspace for the Whole Job Search",
    metaDescription: "Use CareerVivid to manage resumes, job tracking, interview prep, portfolios, and Chrome extension application workflows in one AI job-search workspace.",
    content: {
      heroSubtitle: "Keep every role, resume, prep note, and next action connected.",
      sections: [
        {
          heading: "Why a Job Search Workspace Matters",
          body: "Most job seekers spread their work across PDFs, spreadsheets, browser tabs, saved posts, and separate interview notes. CareerVivid keeps resumes, tracked roles, match scores, prep notes, portfolios, and follow-up context in one place so each application is easier to continue."
        },
        {
          heading: "Where Gemini Fits",
          body: "CareerVivid uses Gemini-powered workflows to compare resumes with job descriptions, generate focused interview preparation, and make the repeated parts of job search easier to review instead of scattered across separate tools."
        }
      ]
    }
  },
  "chrome-extension-job-autofill": {
    slug: "chrome-extension-job-autofill",
    title: "Chrome Extension for Job Autofill | CareerVivid",
    h1: "Chrome Extension for Job Capture and Autofill",
    metaDescription: "CareerVivid's Chrome extension helps job seekers save roles, analyze fit, autofill applications, and send browser context into the job tracker.",
    content: {
      heroSubtitle: "Bring the job-search workspace to the application page.",
      sections: [
        {
          heading: "Built for the Browser Moment",
          body: "The most important job-search context is usually visible on the posting page. CareerVivid's Chrome workflow helps save the title, company, location, requirements, and source link before that information disappears into another browser tab."
        },
        {
          heading: "Connected to the Tracker",
          body: "The extension is not a separate tool. Saved jobs, resume match analysis, autofill progress, and application notes can move back into CareerVivid so the user can keep preparing, following up, and improving from one workspace."
        }
      ]
    }
  },
  "ai-resume-builder-job-tracker": {
    slug: "ai-resume-builder-job-tracker",
    title: "AI Resume Builder and Job Tracker | CareerVivid",
    h1: "AI Resume Builder Connected to a Job Tracker",
    metaDescription: "CareerVivid connects AI resume tailoring, ATS match scoring, job tracking, and interview prep so each application has a clear next step.",
    content: {
      heroSubtitle: "Build the resume, save the role, and keep the preparation together.",
      sections: [
        {
          heading: "Resume Work Should Stay Tied to the Role",
          body: "Generic resume builders help with one document. CareerVivid connects each resume draft to the job description, match score, application status, and preparation notes so users can see why a change matters."
        },
        {
          heading: "A Repeatable Application Routine",
          body: "Use the workspace to move from resume review to application tracking to interview prep without rebuilding context for every company. That repeat loop is the difference between a document tool and a job-search operating system."
        }
      ]
    }
  },
  "ai-native-developer-portfolios": {
    slug: "ai-native-developer-portfolios",
    title: "Developer Portfolios for Job Applications | CareerVivid",
    h1: "Developer Portfolios Inside the Job Search Workspace",
    metaDescription: "CareerVivid portfolios help job seekers connect resume proof, projects, whiteboards, and application context in one AI job-search workspace.",
    content: {
      heroSubtitle: "Use portfolio proof as part of the application workflow, not as another disconnected site.",
      sections: [
        {
          heading: "Portfolio Proof Belongs Near the Application",
          body: "CareerVivid still supports portfolios and whiteboards, but they are positioned as part of the job-search workspace. Users can connect proof of work with resumes, tracked roles, and interview preparation."
        },
        {
          heading: "Clearer Than a Developer Platform Claim",
          body: "The product is not primarily an abstract publishing tool. It is a career workspace that helps job seekers prepare stronger applications with resumes, portfolios, job tracking, interview prep, and Chrome extension workflows."
        }
      ]
    }
  },
  "vibe-coding-platform": {
    slug: "vibe-coding-platform",
    title: "AI Career Workspace for Job Seekers | CareerVivid",
    h1: "AI Career Workspace for Job Seekers",
    metaDescription: "CareerVivid is an AI career workspace for resumes, job tracking, interview prep, portfolios, and Chrome extension application workflows.",
    content: {
      heroSubtitle: "A practical workspace for applications, not a vague platform promise.",
      sections: [
        {
          heading: "What CareerVivid Is",
          body: "CareerVivid helps job seekers keep resumes, roles, match analysis, interview prep, portfolios, and follow-up work connected. The workspace is built for repeated application work across job boards and company sites."
        },
        {
          heading: "How the Chrome Extension Fits",
          body: "The Chrome workflow brings job capture, fit analysis, and autofill closer to the application page, then sends that context back into the CareerVivid workspace for tracking and preparation."
        }
      ]
    }
  }
};
