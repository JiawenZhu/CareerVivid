import { Type } from "@google/genai";
import { Tool } from "../../agent/Tool.js";
import { ALL_CODING_TOOLS } from "../../agent/tools/coding.js";
import { ALL_JOB_TOOLS } from "../../agent/tools/jobs.js";
import { ALL_BROWSER_TOOLS } from "../../agent/tools/browser.js";
import { ALL_LOCAL_TRACKER_TOOLS } from "../../agent/tools/local-tracker.js";
import { publishSingleFile } from "../publish.js";

const PublishArticleTool: Tool = {
  name: "publish_article",
  description:
    "Publish a markdown article to CareerVivid. Provide the complete markdown content.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Title of the article." },
      content: { type: Type.STRING, description: "Full markdown content." },
      tags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of tags for the article.",
      },
      isPublic: { type: Type.BOOLEAN, description: "Whether the article should be public." },
    },
    required: ["title", "content"],
  },
  execute: async (args: { title: string; content: string; tags?: string[]; isPublic?: boolean }) => {
    const fs = await import("fs");
    const path = await import("path");
    const slug = args.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const filePath = path.join(process.cwd(), `${slug || "article"}.md`);
    fs.writeFileSync(filePath, args.content, "utf-8");
    const result = await publishSingleFile(
      filePath,
      args.content,
      { title: args.title, type: "article", format: "markdown", tags: (args.tags || []).join(","), public: args.isPublic },
      true,
    );
    return result.success
      ? `Published! URL: ${result.url} | ID: ${result.postId}`
      : "Failed to publish article.";
  },
};

const GenerateDiagramTool: Tool = {
  name: "generate_diagram",
  description:
    "Publish a Mermaid diagram as a whiteboard to CareerVivid. Provide valid Mermaid syntax.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Title of the diagram." },
      content: { type: Type.STRING, description: "Mermaid diagram code (e.g. graph TD...)." },
      tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tags." },
      isPublic: { type: Type.BOOLEAN, description: "Whether the diagram should be public." },
    },
    required: ["title", "content"],
  },
  execute: async (args: { title: string; content: string; tags?: string[]; isPublic?: boolean }) => {
    const fs = await import("fs");
    const path = await import("path");
    const slug = args.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const filePath = path.join(process.cwd(), `${slug || "diagram"}.mmd`);
    fs.writeFileSync(filePath, args.content, "utf-8");
    const result = await publishSingleFile(
      filePath,
      args.content,
      { title: args.title, type: "whiteboard", format: "mermaid", tags: (args.tags || []).join(","), public: args.isPublic },
      true,
    );
    return result.success
      ? `Published! URL: ${result.url} | ID: ${result.postId}`
      : "Failed to publish diagram.";
  },
};

export function getTools(options: { jobs?: boolean; resume?: boolean; coding?: boolean }): Tool[] {
  const tools: Tool[] = [...ALL_CODING_TOOLS, PublishArticleTool, GenerateDiagramTool];

  if (options.jobs) {
    for (const t of ALL_JOB_TOOLS) {
      if (!tools.find((x) => x.name === t.name)) tools.push(t);
    }
    for (const t of ALL_BROWSER_TOOLS) {
      if (!tools.find((x) => x.name === t.name)) tools.push(t);
    }
    for (const t of ALL_LOCAL_TRACKER_TOOLS) {
      if (!tools.find((x) => x.name === t.name)) tools.push(t);
    }
  } else if (options.resume) {
    const resumeTool = ALL_JOB_TOOLS.find((t) => t.name === "get_resume");
    if (resumeTool && !tools.find((x) => x.name === "get_resume")) {
      tools.push(resumeTool);
    }
  }

  return tools;
}
