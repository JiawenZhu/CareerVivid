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
  "ai-native-developer-portfolios": {
    slug: "ai-native-developer-portfolios",
    title: "AI-Native Developer Portfolios | CareerVivid",
    h1: "Build AI-Native Developer Portfolios",
    metaDescription: "Showcase your skills with an AI-native developer portfolio on CareerVivid. Vibe code your interactive resume and stand out to tech recruiters.",
    content: {
      heroSubtitle: "Transform your professional presence with intelligent, AI-driven portfolios.",
      sections: [
        {
          heading: "Why AI-Native Portfolios Matter",
          body: "In a world of static PDF resumes, an AI-native developer portfolio stands out. Automatically sync your projects, summarize your contributions using AI, and present your capabilities in an interactive format that technical recruiters love."
        },
        {
          heading: "Customizable Profiles",
          body: "Use natural language to customize the look and feel of your portfolio. Your AI-native developer portfolio adapts instantly to your brand, demonstrating your forward-thinking approach to modern development."
        }
      ]
    }
  },
  "vibe-coding-platform": {
    slug: "vibe-coding-platform",
    title: "Vibe Coding Platform | CareerVivid",
    h1: "The Ultimate Vibe Coding Platform",
    metaDescription: "Experience flow state with CareerVivid's vibe coding platform. Let AI handle the boilerplate while you focus on the big picture.",
    content: {
      heroSubtitle: "Code at the speed of thought. Ditch the boilerplate and embrace focus.",
      sections: [
        {
          heading: "What is Vibe Coding?",
          body: "Vibe coding is the art of programming in high flow, directing AI tools to handle the syntax and structure while you focus on architecture and logic. Our vibe coding platform is built specifically for this modern workflow."
        },
        {
          heading: "Accelerated Development",
          body: "Stop typing monotonous setups and start creating. Our platform anticipates your needs, letting you build complex UI components and logic from simple prompts, creating the ultimate vibe coding experience."
        }
      ]
    }
  }
};
