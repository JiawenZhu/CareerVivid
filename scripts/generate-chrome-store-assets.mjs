import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "canvas";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outDir = path.join(repoRoot, "docs/chrome-extension-publish/assets");
const iconPath = path.join(repoRoot, "public/icons/icon128.png");

const colors = {
  ink: "#121827",
  text: "#2f3748",
  muted: "#6b7280",
  faint: "#f7f8fc",
  card: "#ffffff",
  line: "#e6e9f0",
  blue: "#2563eb",
  blueSoft: "#e9f0ff",
  purple: "#4f46e5",
  purpleSoft: "#eeedff",
  green: "#16a34a",
  greenSoft: "#e8f8ef",
  amber: "#f59e0b",
  amberSoft: "#fff5d8",
  red: "#ef4444",
  redSoft: "#feeaea",
  graySoft: "#f1f3f7",
};

const screenshots = [
  {
    filename: "01-track-every-job-1280x800.png",
    headline: "Track Every Job",
    accent: "Every",
    kicker: "Career pipeline",
    subcopy: "See status, priority, match score, prep progress, and next steps in one focused board.",
    draw: drawPipelineBoard,
  },
  {
    filename: "02-know-what-to-do-next-1280x800.png",
    headline: "Know What To Do Next",
    accent: "Next",
    kicker: "Strategy map",
    subcopy: "Connect resumes to roles and quickly spot the strongest paths across your job search.",
    draw: drawStrategyMap,
  },
  {
    filename: "03-match-resumes-to-roles-1280x800.png",
    headline: "Match Resumes To Roles",
    accent: "Match",
    kicker: "Role dashboard",
    subcopy: "Review prep notes, match results, missing keywords, and role details before you apply.",
    draw: drawRoleDetail,
  },
  {
    filename: "04-tailor-and-review-faster-1280x800.png",
    headline: "Tailor And Review Faster",
    accent: "Tailor",
    kicker: "Resume builder",
    subcopy: "Use AI tailoring, templates, score checks, and PDF preview to prepare stronger materials.",
    draw: drawResumeBuilder,
  },
  {
    filename: "05-practice-with-ai-coaching-1280x800.png",
    headline: "Practice With AI Coaching",
    accent: "Practice",
    kicker: "Interview prep",
    subcopy: "Run voice practice sessions and turn feedback into focused coaching dashboards.",
    draw: drawInterviewCoaching,
  },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function makeCanvas(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "alphabetic";
  return { canvas, ctx };
}

function savePng(canvas, filename) {
  const file = path.join(outDir, filename);
  fs.writeFileSync(file, canvas.toBuffer("image/png"));
  return file;
}

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fillRound(ctx, x, y, w, h, r, fill, stroke = null, lineWidth = 1) {
  roundedRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function shadow(ctx, blur = 24, color = "rgba(31,41,55,0.10)", x = 0, y = 12) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = x;
  ctx.shadowOffsetY = y;
}

function clearShadow(ctx) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function font(size, weight = 600) {
  return `${weight} ${size}px Inter, SF Pro Display, Helvetica, Arial, sans-serif`;
}

function drawText(ctx, text, x, y, size, color = colors.text, weight = 500, maxWidth = undefined) {
  ctx.fillStyle = color;
  ctx.font = font(size, weight);
  ctx.fillText(text, x, y, maxWidth);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, size, color = colors.text, weight = 500) {
  ctx.fillStyle = color;
  ctx.font = font(size, weight);
  const words = text.split(/\s+/);
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      cursorY += lineHeight;
      line = word;
    } else {
      line = next;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
  return cursorY + lineHeight;
}

function splitLines(ctx, text, maxWidth, size, weight = 700, maxLines = 2) {
  ctx.font = font(size, weight);
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(`${last}...`).width > maxWidth && last.length > 4) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = last.length < text.length ? `${last}...` : last;
  }
  return lines;
}

function drawPill(ctx, x, y, text, fill, color, width = null) {
  ctx.font = font(14, 700);
  const w = width ?? Math.ceil(ctx.measureText(text).width + 26);
  fillRound(ctx, x, y, w, 30, 15, fill);
  drawText(ctx, text, x + 13, y + 20, 14, color, 700);
  return w;
}

function drawButton(ctx, x, y, w, h, text, fill = colors.blue, color = "#fff") {
  fillRound(ctx, x, y, w, h, 8, fill);
  drawText(ctx, text, x + 18, y + h / 2 + 6, 15, color, 800);
}

function drawLogo(ctx, logo, x, y, size = 34, dark = true) {
  ctx.drawImage(logo, x, y, size, size);
  drawText(ctx, "CareerVivid", x + size + 10, y + size - 9, 22, dark ? colors.ink : "#fff", 800);
}

function drawPageBackground(ctx, logo, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#f8fbff");
  gradient.addColorStop(0.52, "#f5f1ff");
  gradient.addColorStop(1, "#eef7ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(width - 80, 95, 190, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(80, height - 50, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  drawLogo(ctx, logo, 58, 45, 34);
}

function drawHeadlineBlock(ctx, scene) {
  drawPill(ctx, 58, 108, scene.kicker, colors.purpleSoft, colors.purple);
  const words = scene.headline.split(" ");
  let x = 58;
  let y = 190;
  for (const word of words) {
    const color = word === scene.accent ? colors.purple : colors.ink;
    ctx.font = font(58, 900);
    const w = ctx.measureText(word).width;
    if (x + w > 485) {
      x = 58;
      y += 66;
    }
    drawText(ctx, word, x, y, 58, color, 900);
    x += w + 18;
  }
  wrapText(ctx, scene.subcopy, 62, y + 44, 390, 30, 19, colors.text, 500);
}

function drawBrowserFrame(ctx, x, y, w, h, title = "careervivid.app") {
  shadow(ctx, 30, "rgba(20,24,40,0.14)", 0, 16);
  fillRound(ctx, x, y, w, h, 18, "#ffffff", colors.line);
  clearShadow(ctx);
  fillRound(ctx, x, y, w, 48, 18, "#fbfcff", colors.line);
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(x + 24, y + 24, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.arc(x + 44, y + 24, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.arc(x + 64, y + 24, 6, 0, Math.PI * 2);
  ctx.fill();
  fillRound(ctx, x + 110, y + 12, w - 210, 24, 12, "#f1f3f8");
  drawText(ctx, title, x + 128, y + 30, 12, colors.muted, 600);
}

function drawMetric(ctx, x, y, w, label, value, color) {
  fillRound(ctx, x, y, w, 88, 12, "#fff", colors.line);
  drawText(ctx, label, x + 18, y + 27, 13, colors.muted, 800);
  drawText(ctx, value, x + 18, y + 68, 34, colors.ink, 900);
  fillRound(ctx, x + w - 48, y + 14, 32, 32, 8, `${color}18`);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + w - 32, y + 30, 7, 0, Math.PI * 2);
  ctx.stroke();
}

function drawJobCard(ctx, x, y, w, title, company, score, prep, selected = false) {
  fillRound(ctx, x, y, w, 120, 12, "#fff", selected ? "#b8ccff" : colors.line, selected ? 2 : 1);
  fillRound(ctx, x + 14, y + 14, 34, 34, 8, colors.graySoft);
  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 24, y + 23, 13, 13);
  const lines = splitLines(ctx, title, w - 74, 15, 800, 2);
  lines.forEach((line, index) => drawText(ctx, line, x + 58, y + 30 + index * 18, 15, colors.ink, 800));
  drawText(ctx, company, x + 58, y + 72, 12, colors.muted, 700);
  drawPill(ctx, x + 14, y + 78, "Medium", colors.amberSoft, "#b45309");
  drawPill(ctx, x + 82, y + 78, score, colors.blueSoft, colors.blue);
  drawText(ctx, prep, x + 14, y + 113, 12, colors.muted, 700);
}

function drawPipelineBoard(ctx, box) {
  const { x, y, w, h } = box;
  drawBrowserFrame(ctx, x, y, w, h, "careervivid.app/job-tracker");
  const sx = x + 24;
  const sy = y + 70;
  drawText(ctx, "Career Pipeline", sx, sy, 24, colors.ink, 900);
  drawButton(ctx, x + w - 176, sy - 28, 150, 40, "Track New Job");
  drawMetric(ctx, sx, sy + 30, 118, "Total", "36", colors.blue);
  drawMetric(ctx, sx + 132, sy + 30, 118, "Active", "36", colors.purple);
  drawMetric(ctx, sx + 264, sy + 30, 118, "Interviews", "4", colors.amber);
  drawMetric(ctx, sx + 396, sy + 30, 118, "Offers", "1", colors.green);

  fillRound(ctx, sx, sy + 140, w - 48, 52, 12, "#fff", colors.line);
  fillRound(ctx, sx + 16, sy + 154, 270, 24, 12, "#f6f7fb");
  drawText(ctx, "Search title, company, stage, action", sx + 32, sy + 172, 12, "#9aa3b2", 600);
  drawPill(ctx, sx + 305, sy + 151, "All statuses", "#f6f7fb", colors.text, 112);
  drawPill(ctx, sx + 426, sy + 151, "All priorities", "#f6f7fb", colors.text, 116);
  drawPill(ctx, x + w - 138, sy + 151, "Kanban", colors.blueSoft, colors.blue, 86);

  const colY = sy + 214;
  const colW = (w - 72) / 3;
  const cols = [
    ["To Apply", "3", colors.muted],
    ["Applied", "33", colors.blue],
    ["Interviewing", "4", colors.amber],
  ];
  cols.forEach(([label, count, color], index) => {
    const cx = sx + index * (colW + 12);
    fillRound(ctx, cx, colY, colW, h - 300, 14, "#f8f9fc", colors.line);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx + 18, colY + 24, 5, 0, Math.PI * 2);
    ctx.fill();
    drawText(ctx, label, cx + 32, colY + 30, 15, colors.ink, 900);
    drawPill(ctx, cx + colW - 44, colY + 11, count, "#fff", colors.muted, 30);
  });

  drawJobCard(ctx, sx + 12, colY + 54, colW - 24, "Senior UX Engineer, Payments UX", "Google", "61% match", "Prep 5/5");
  drawJobCard(ctx, sx + 12, colY + 188, colW - 24, "Technical Consultant, Platform", "Global Tech", "Ready", "Prep 3/5");
  drawJobCard(ctx, sx + colW + 24, colY + 54, colW - 24, "AI Systems Engineer", "OpenAI", "86% match", "Prep 2/5", true);
  drawJobCard(ctx, sx + colW + 24, colY + 188, colW - 24, "Full-Stack Engineer", "Anthropic", "Queued", "Prep 1/5");
  drawJobCard(ctx, sx + (colW + 12) * 2 + 12, colY + 54, colW - 24, "Solutions Engineer", "Vercel", "Next step", "Prep 4/5");
}

function drawNode(ctx, x, y, w, title, subtitle, color = colors.blue, selected = false) {
  shadow(ctx, 12, "rgba(20,24,40,0.08)", 0, 5);
  fillRound(ctx, x, y, w, 62, 12, selected ? "#edf4ff" : "#fff", selected ? "#8bb6ff" : colors.line, selected ? 2 : 1);
  clearShadow(ctx);
  fillRound(ctx, x + 14, y + 14, 34, 34, 9, `${color}18`);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 25, y + 24, 12, 14);
  drawText(ctx, title, x + 58, y + 27, 13, colors.ink, 900, w - 70);
  drawText(ctx, subtitle, x + 58, y + 46, 11, color, 700, w - 70);
}

function drawStrategyMap(ctx, box) {
  const { x, y, w, h } = box;
  drawBrowserFrame(ctx, x, y, w, h, "careervivid.app/job-tracker");
  const sx = x + 28;
  const sy = y + 72;
  drawText(ctx, "Career Pipeline", sx, sy, 24, colors.ink, 900);
  drawPill(ctx, x + w - 146, sy - 27, "Strategy", colors.blueSoft, colors.blue, 94);
  drawPill(ctx, x + w - 246, sy - 27, "Kanban", "#f5f6fa", colors.text, 86);
  fillRound(ctx, sx, sy + 30, w - 56, h - 118, 16, "#fbfcff", colors.line);

  ctx.strokeStyle = "#e1e7f0";
  ctx.lineWidth = 1;
  for (let gx = sx + 16; gx < sx + w - 70; gx += 24) {
    for (let gy = sy + 48; gy < sy + h - 110; gy += 24) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const leftX = sx + 86;
  const rightX = sx + 430;
  const rows = [sy + 90, sy + 190, sy + 290, sy + 390];
  const rightRows = [sy + 110, sy + 230, sy + 350];
  ctx.lineCap = "round";
  [
    [leftX + 240, rows[0] + 31, rightX, rightRows[0] + 31, colors.green],
    [leftX + 240, rows[1] + 31, rightX, rightRows[1] + 31, colors.blue],
    [leftX + 240, rows[2] + 31, rightX, rightRows[1] + 31, colors.purple],
    [leftX + 240, rows[3] + 31, rightX, rightRows[2] + 31, colors.amber],
  ].forEach(([x1, y1, x2, y2, color]) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const mid = (x1 + x2) / 2;
    ctx.bezierCurveTo(mid, y1, mid, y2, x2, y2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  drawNode(ctx, leftX, rows[0], 240, "Product Engineer Resume", "95% profile", colors.green, true);
  drawNode(ctx, leftX, rows[1], 240, "Full-Stack Resume", "75% profile", colors.blue);
  drawNode(ctx, leftX, rows[2], 240, "Documentation Resume", "86% profile", colors.purple);
  drawNode(ctx, leftX, rows[3], 240, "Support Tooling Resume", "Ready", colors.amber);
  drawNode(ctx, rightX, rightRows[0], 260, "Senior UX Engineer", "Google 61% match", colors.blue, true);
  drawNode(ctx, rightX, rightRows[1], 260, "AI Systems Engineer", "OpenAI 86% match", colors.green);
  drawNode(ctx, rightX, rightRows[2], 260, "Solutions Engineer", "Vercel next action", colors.purple);
}

function drawMatchPanel(ctx, x, y, w, h) {
  fillRound(ctx, x, y, w, h, 14, "#fff", colors.line);
  drawText(ctx, "Resume Match", x + 18, y + 30, 18, colors.ink, 900);
  drawText(ctx, "COMPARE WITH RESUME", x + 18, y + 62, 11, colors.muted, 900);
  fillRound(ctx, x + 18, y + 76, w - 36, 36, 8, "#f8f9fc", colors.line);
  drawText(ctx, "Product Engineer Resume", x + 32, y + 100, 13, colors.text, 800);
  drawButton(ctx, x + 18, y + 124, w - 36, 42, "Analyze Match", colors.purple);
  fillRound(ctx, x + 18, y + 180, w - 36, 130, 10, colors.blueSoft);
  drawText(ctx, "6 / 8 keywords", x + 34, y + 208, 15, colors.blue, 900);
  drawText(ctx, "75%", x + w - 70, y + 208, 15, colors.blue, 900);
  fillRound(ctx, x + 34, y + 224, w - 68, 8, 4, "#d4ddf7");
  fillRound(ctx, x + 34, y + 224, (w - 68) * 0.75, 8, 4, colors.blue);
  wrapText(ctx, "Strong fit for React, TypeScript, AI tooling, and design systems.", x + 34, y + 258, w - 68, 17, 12, colors.blue, 700);
  drawPill(ctx, x + 30, y + 324, "Matched", colors.greenSoft, colors.green, 82);
  drawPill(ctx, x + 120, y + 324, "TypeScript", "#e6f4ff", "#0369a1", 90);
  drawPill(ctx, x + 30, y + h - 52, "Missing", colors.amberSoft, "#b45309", 78);
  drawPill(ctx, x + 114, y + h - 52, "Prototyping", colors.amberSoft, "#b45309", 100);
}

function drawRoleDetail(ctx, box) {
  const { x, y, w, h } = box;
  drawBrowserFrame(ctx, x, y, w, h, "careervivid.app/job-tracker");
  const sx = x + 28;
  const sy = y + 72;
  fillRound(ctx, sx, sy, w - 56, h - 116, 16, "#f4f5f8", colors.line);
  fillRound(ctx, sx, sy, w - 56, 76, 16, "#fff", colors.line);
  fillRound(ctx, sx + 20, sy + 20, 36, 36, 9, colors.graySoft);
  drawText(ctx, "Senior UX Engineer, Payments UX", sx + 70, sy + 30, 22, colors.ink, 900);
  drawText(ctx, "Google", sx + 70, sy + 54, 13, colors.muted, 700);
  drawPill(ctx, sx + 70, sy + 86, "To Apply", colors.blueSoft, colors.blue, 82);
  drawPill(ctx, sx + 160, sy + 86, "Medium Priority", colors.graySoft, colors.text, 130);

  fillRound(ctx, sx + 18, sy + 110, 445, h - 252, 14, "#fff", colors.line);
  drawText(ctx, "Prep", sx + 40, sy + 148, 22, colors.ink, 900);
  drawButton(ctx, sx + 280, sy + 126, 160, 38, "Generate Prep", colors.blue);
  drawText(ctx, "Company & Role Research", sx + 40, sy + 196, 18, colors.ink, 900);
  wrapText(ctx, "Understand payment flows, compliance constraints, accessibility, and cross-functional design engineering expectations. Prepare stories about translating complex UX into reliable front-end systems.", sx + 40, sy + 226, 380, 22, 15, colors.text, 500);
  drawText(ctx, "Interview Prep Q&A", sx + 40, sy + 352, 18, colors.ink, 900);
  wrapText(ctx, "1. Tell me about a complex payment flow you implemented.\n2. How do you balance speed, reliability, and compliance?\n3. How do you collaborate with product and design?", sx + 40, sy + 382, 390, 24, 15, colors.text, 500);

  drawMatchPanel(ctx, sx + 470, sy + 110, 250, 370);
  fillRound(ctx, sx + 470, sy + 496, 250, 118, 14, "#fff", colors.line);
  drawText(ctx, "Pipeline", sx + 488, sy + 526, 18, colors.ink, 900);
  drawPill(ctx, sx + 488, sy + 548, "Next: tailor resume", colors.blueSoft, colors.blue, 150);
  drawPill(ctx, sx + 488, sy + 590, "Due tomorrow", colors.amberSoft, "#b45309", 120);
}

function drawResumeBuilder(ctx, box) {
  const { x, y, w, h } = box;
  drawBrowserFrame(ctx, x, y, w, h, "careervivid.app/edit");
  const sx = x + 24;
  const sy = y + 64;
  fillRound(ctx, sx, sy, w - 48, h - 92, 16, "#f7f8fb", colors.line);
  fillRound(ctx, sx, sy, w - 48, 54, 16, "#fff", colors.line);
  drawText(ctx, "Product Engineer Resume", sx + 22, sy + 34, 20, colors.ink, 900);
  drawButton(ctx, sx + 360, sy + 12, 132, 32, "AI Tailor", colors.blue);
  drawButton(ctx, sx + 506, sy + 12, 148, 32, "Download PDF", colors.blueSoft, colors.blue);

  fillRound(ctx, sx + 18, sy + 76, 185, h - 204, 12, "#fff", colors.line);
  drawText(ctx, "Templates", sx + 36, sy + 108, 16, colors.ink, 900);
  for (let i = 0; i < 3; i++) {
    fillRound(ctx, sx + 36, sy + 128 + i * 94, 148, 72, 8, i === 0 ? colors.blueSoft : "#f8f9fc", i === 0 ? colors.blue : colors.line, i === 0 ? 2 : 1);
    drawText(ctx, ["Modern", "Sydney", "Professional"][i], sx + 52, sy + 154 + i * 94, 13, colors.ink, 800);
    ctx.strokeStyle = "#d6dae5";
    ctx.lineWidth = 1;
    for (let j = 0; j < 4; j++) {
      ctx.beginPath();
      ctx.moveTo(sx + 52, sy + 168 + i * 94 + j * 9);
      ctx.lineTo(sx + 166 - j * 12, sy + 168 + i * 94 + j * 9);
      ctx.stroke();
    }
  }

  fillRound(ctx, sx + 225, sy + 76, 325, h - 204, 12, "#fff", colors.line);
  drawText(ctx, "Alex Morgan", sx + 248, sy + 124, 30, colors.ink, 900);
  drawText(ctx, "Product & Full-Stack Engineer", sx + 248, sy + 152, 13, colors.muted, 800);
  drawText(ctx, "Professional Summary", sx + 248, sy + 196, 15, colors.ink, 900);
  wrapText(ctx, "Builds reliable product experiences across AI tooling, application workflows, and internal platforms.", sx + 248, sy + 224, 275, 19, 13, colors.text, 500);
  drawText(ctx, "Key Competencies", sx + 248, sy + 292, 15, colors.ink, 900);
  ["React", "TypeScript", "AI tooling", "Design systems", "Automation"].forEach((item, i) => {
    drawPill(ctx, sx + 248 + (i % 2) * 120, sy + 308 + Math.floor(i / 2) * 35, item, colors.graySoft, colors.text, item.length > 10 ? 112 : 92);
  });
  drawText(ctx, "Experience", sx + 248, sy + 430, 15, colors.ink, 900);
  wrapText(ctx, "Founder and full-stack engineer, CareerVivid. Built a job-search workspace with resume tailoring, interview practice, and browser autofill review.", sx + 248, sy + 458, 275, 19, 13, colors.text, 500);

  const railX = sx + 558;
  fillRound(ctx, railX, sy + 76, 185, 190, 12, "#fff", colors.line);
  drawText(ctx, "Resume Score", railX + 29, sy + 116, 18, colors.ink, 900);
  ctx.strokeStyle = "#dcfce7";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(railX + 92, sy + 178, 48, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#65c900";
  ctx.beginPath();
  ctx.arc(railX + 92, sy + 178, 48, Math.PI, Math.PI * 1.86);
  ctx.stroke();
  drawText(ctx, "95", railX + 67, sy + 184, 38, colors.ink, 900);
  drawText(ctx, "READY", railX + 67, sy + 208, 12, colors.green, 900);

  fillRound(ctx, railX, sy + 286, 185, 206, 12, "#fff", colors.line);
  drawText(ctx, "AI Suggestions", railX + 23, sy + 322, 18, colors.ink, 900);
  ["Add stronger impact", "Tune keywords", "Check length"].forEach((item, i) => {
    fillRound(ctx, railX + 23, sy + 346 + i * 44, 132, 28, 14, colors.greenSoft);
    drawText(ctx, item, railX + 37, sy + 365 + i * 44, 12, colors.green, 800);
  });
}

function drawInterviewCoaching(ctx, box) {
  const { x, y, w, h } = box;
  drawBrowserFrame(ctx, x, y, w, h, "careervivid.app/interview-studio");
  const sx = x + 28;
  const sy = y + 70;
  fillRound(ctx, sx, sy, w - 56, h - 116, 16, "#f6f7fb", colors.line);

  fillRound(ctx, sx + 24, sy + 26, 330, 430, 16, "#fff", colors.line);
  drawText(ctx, "AI Interview Agent", sx + 48, sy + 66, 22, colors.ink, 900);
  drawText(ctx, "Investment Banker practice", sx + 48, sy + 92, 14, colors.muted, 700);
  fillRound(ctx, sx + 48, sy + 120, 260, 78, 14, colors.greenSoft, "#c9f3d8");
  drawText(ctx, "SESSION STATUS", sx + 70, sy + 150, 13, colors.green, 900);
  drawText(ctx, "Listening", sx + 70, sy + 176, 22, colors.green, 900);
  fillRound(ctx, sx + 64, sy + 230, 244, 120, 14, "#fff", "#dcefe4");
  drawText(ctx, "The AI is ready.", sx + 118, sy + 285, 20, colors.ink, 900);
  drawText(ctx, "Say Hello to begin.", sx + 122, sy + 316, 14, colors.muted, 700);
  drawButton(ctx, sx + 78, sy + 388, 206, 42, "End Interview", colors.red);

  fillRound(ctx, sx + 385, sy + 26, 370, 430, 16, "#fff", colors.line);
  drawText(ctx, "Interview Feedback Report", sx + 412, sy + 66, 22, colors.ink, 900);
  fillRound(ctx, sx + 414, sy + 94, 110, 110, 55, "#fff", colors.line, 8);
  ctx.strokeStyle = colors.red;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(sx + 469, sy + 149, 50, Math.PI * 1.5, Math.PI * 1.78);
  ctx.stroke();
  drawText(ctx, "82", sx + 444, sy + 158, 34, colors.ink, 900);
  drawText(ctx, "OVERALL", sx + 438, sy + 180, 10, colors.muted, 900);
  drawText(ctx, "Metric breakdown", sx + 552, sy + 112, 16, colors.ink, 900);
  drawScoreBar(ctx, sx + 552, sy + 135, "Communication", 0.86, colors.blue);
  drawScoreBar(ctx, sx + 552, sy + 185, "Confidence", 0.78, colors.purple);
  drawScoreBar(ctx, sx + 552, sy + 235, "Relevance", 0.92, colors.green);
  fillRound(ctx, sx + 414, sy + 270, 150, 132, 12, colors.greenSoft, "#c9f3d8");
  drawText(ctx, "What went well", sx + 432, sy + 304, 16, colors.green, 900);
  wrapText(ctx, "Clear structure, concrete examples, and concise answers.", sx + 432, sy + 334, 112, 17, 12, colors.text, 600);
  fillRound(ctx, sx + 580, sy + 270, 150, 132, 12, colors.amberSoft, "#f8e1a6");
  drawText(ctx, "Practice next", sx + 598, sy + 304, 16, "#b45309", 900);
  wrapText(ctx, "Add stronger role-specific metrics and tradeoff stories.", sx + 598, sy + 334, 112, 17, 12, colors.text, 600);
}

function drawScoreBar(ctx, x, y, label, value, color) {
  drawText(ctx, label, x, y, 12, colors.text, 800);
  fillRound(ctx, x, y + 10, 145, 8, 4, colors.graySoft);
  fillRound(ctx, x, y + 10, 145 * value, 8, 4, color);
  drawText(ctx, `${Math.round(value * 100)}%`, x + 155, y + 16, 12, colors.text, 800);
}

function drawScreenshotScene(ctx, logo, scene) {
  const width = 1280;
  const height = 800;
  drawPageBackground(ctx, logo, width, height);
  drawHeadlineBlock(ctx, scene);
  scene.draw(ctx, { x: 500, y: 98, w: 720, h: 612 });
}

function drawSmallPromo(logo) {
  const { canvas, ctx } = makeCanvas(440, 280);
  const gradient = ctx.createLinearGradient(0, 0, 440, 280);
  gradient.addColorStop(0, "#f8fbff");
  gradient.addColorStop(1, "#f2edff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 440, 280);
  drawLogo(ctx, logo, 30, 26, 30);
  drawText(ctx, "AI job search", 30, 94, 34, colors.ink, 900);
  drawText(ctx, "save to apply", 30, 132, 28, colors.purple, 900);
  wrapText(ctx, "Resume tailoring, autofill review, job tracking, and interview prep in one Chrome side panel.", 32, 168, 205, 21, 14, colors.text, 600);
  shadow(ctx, 22, "rgba(20,24,40,0.16)", 0, 10);
  fillRound(ctx, 255, 48, 150, 192, 18, "#fff", colors.line);
  clearShadow(ctx);
  drawText(ctx, "CareerVivid", 276, 80, 15, colors.ink, 900);
  drawPill(ctx, 276, 96, "Job detected", colors.blueSoft, colors.blue, 98);
  fillRound(ctx, 276, 136, 108, 32, 8, colors.purple);
  drawText(ctx, "Match Resume", 291, 157, 12, "#fff", 800);
  fillRound(ctx, 276, 184, 84, 8, 4, colors.graySoft);
  fillRound(ctx, 276, 184, 64, 8, 4, colors.blue);
  drawText(ctx, "86% match", 276, 210, 14, colors.blue, 900);
  return canvas;
}

function drawMarquee(ctx, logo) {
  const width = 1400;
  const height = 560;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#f8fbff");
  gradient.addColorStop(0.55, "#f5f1ff");
  gradient.addColorStop(1, "#eef7ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  drawLogo(ctx, logo, 64, 56, 42);
  drawPill(ctx, 66, 130, "Chrome extension", colors.purpleSoft, colors.purple, 154);
  drawText(ctx, "From saved job", 66, 206, 54, colors.ink, 900);
  drawText(ctx, "to tailored", 66, 268, 54, colors.purple, 900);
  drawText(ctx, "application", 66, 330, 54, colors.purple, 900);
  wrapText(ctx, "CareerVivid brings job tracking, resume matching, autofill review, and interview coaching into one focused workflow.", 70, 376, 420, 30, 19, colors.text, 600);

  shadow(ctx, 30, "rgba(20,24,40,0.15)", 0, 16);
  fillRound(ctx, 568, 72, 720, 410, 26, "#fff", colors.line);
  clearShadow(ctx);
  fillRound(ctx, 600, 112, 196, 292, 20, "#fff", colors.line);
  drawText(ctx, "Job detected", 628, 158, 21, colors.ink, 900);
  drawText(ctx, "Senior UX Engineer", 628, 186, 14, colors.muted, 800);
  drawButton(ctx, 628, 214, 132, 38, "Save Job", colors.blue);
  drawPill(ctx, 628, 274, "Next action", colors.blueSoft, colors.blue, 112);
  drawPill(ctx, 628, 316, "Interview prep", colors.purpleSoft, colors.purple, 126);

  fillRound(ctx, 820, 92, 220, 330, 22, "#fff", colors.line);
  drawText(ctx, "Resume Match", 850, 140, 22, colors.ink, 900);
  fillRound(ctx, 850, 166, 160, 10, 5, colors.graySoft);
  fillRound(ctx, 850, 166, 126, 10, 5, colors.blue);
  drawText(ctx, "86% match", 850, 206, 28, colors.blue, 900);
  drawPill(ctx, 850, 234, "TypeScript", "#e6f4ff", "#0369a1", 92);
  drawPill(ctx, 850, 276, "Design systems", colors.greenSoft, colors.green, 130);
  drawButton(ctx, 850, 336, 150, 40, "Tailor Resume", colors.purple);

  fillRound(ctx, 1065, 124, 190, 258, 20, "#fff", colors.line);
  drawText(ctx, "Pipeline", 1092, 166, 22, colors.ink, 900);
  drawMetric(ctx, 1092, 190, 120, "Active", "36", colors.blue);
  drawPill(ctx, 1092, 300, "Kanban board", colors.blueSoft, colors.blue, 120);
  drawPill(ctx, 1092, 342, "Strategy map", colors.purpleSoft, colors.purple, 120);

  fillRound(ctx, 660, 430, 500, 42, 12, colors.blue);
  drawText(ctx, "Track, match, prep, and review before you apply", 714, 457, 17, "#fff", 900);
  return ctx.canvas;
}

async function main() {
  ensureDir(outDir);
  const logo = await loadImage(iconPath);

  const written = [];
  for (const scene of screenshots) {
    const { canvas, ctx } = makeCanvas(1280, 800);
    drawScreenshotScene(ctx, logo, scene);
    written.push(savePng(canvas, scene.filename));
  }

  written.push(savePng(drawSmallPromo(logo), "promo-small-440x280.png"));
  const { canvas: marqueeCanvas, ctx: marqueeCtx } = makeCanvas(1400, 560);
  written.push(savePng(drawMarquee(marqueeCtx, logo), "promo-marquee-1400x560.png"));

  const manifest = [
    "# CareerVivid Chrome Web Store Assets",
    "",
    "Generated by `node scripts/generate-chrome-store-assets.mjs`.",
    "",
    "## Upload Order",
    "",
    "- `public/icons/icon128.png` - store icon",
    "- `promo-small-440x280.png` - required small promotional tile",
    "- `promo-marquee-1400x560.png` - optional marquee promotional tile",
    "- `01-track-every-job-1280x800.png`",
    "- `02-know-what-to-do-next-1280x800.png`",
    "- `03-match-resumes-to-roles-1280x800.png`",
    "- `04-tailor-and-review-faster-1280x800.png`",
    "- `05-practice-with-ai-coaching-1280x800.png`",
    "",
    "These assets use sanitized product-style mockups and avoid personal email, phone, address, credit balance, browser tabs, and private job history.",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(outDir, "README.md"), manifest);

  for (const file of written) {
    console.log(path.relative(repoRoot, file));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
