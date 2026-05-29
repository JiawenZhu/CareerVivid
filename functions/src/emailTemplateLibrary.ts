export type CareerVividEmailButton = {
  text: string;
  url: string;
};

export type CareerVividEmailStat = {
  label: string;
  value: string;
  helper?: string;
};

export type CareerVividEmailActivity = {
  label: string;
  title: string;
  meta?: string;
  status?: "neutral" | "success" | "warning" | "critical";
};

export type CareerVividEmailFeature = {
  title: string;
  body: string;
  label?: string;
};

export type CareerVividProductMockup = {
  title: string;
  subtitle?: string;
  badge?: string;
  metrics?: CareerVividEmailStat[];
  rows?: CareerVividEmailActivity[];
  footer?: string;
};

export type CareerVividEmailVisual =
  | {
      kind: "image";
      src: string;
      alt: string;
      background?: "paper" | "lavender" | "warm" | "plain";
    }
  | {
      kind: "mockup";
      mockup: CareerVividProductMockup;
      background?: "paper" | "lavender" | "warm" | "plain";
    };

export type CareerVividEmailModule =
  | {
      type: "hero";
      eyebrow?: string;
      title: string;
      subtitle?: string;
      meta?: string;
      visual?: CareerVividEmailVisual;
      variant?: "default" | "report" | "milestone" | "feature";
    }
  | {
      type: "body";
      greeting?: string;
      paragraphs: string[];
    }
  | {
      type: "checklist";
      title: string;
      items: CareerVividEmailFeature[];
    }
  | {
      type: "featureList";
      title: string;
      items: CareerVividEmailFeature[];
    }
  | {
      type: "stats";
      title: string;
      stats: CareerVividEmailStat[];
      caption?: string;
    }
  | {
      type: "activityList";
      title: string;
      subtitle?: string;
      activities: CareerVividEmailActivity[];
    }
  | {
      type: "status";
      title: string;
      body: string;
      status?: "neutral" | "success" | "warning" | "critical";
      rows?: CareerVividEmailStat[];
    }
  | {
      type: "letter";
      paragraphs: string[];
      signatureName?: string;
      signatureRole?: string;
    }
  | {
      type: "cta";
      primary?: CareerVividEmailButton;
      secondary?: CareerVividEmailButton;
      helper?: string;
    };

export type CareerVividModuleEmailProps = {
  title: string;
  preheader?: string;
  userName?: string;
  modules: CareerVividEmailModule[];
  footerText?: string;
};

export type CareerVividEmailTemplateCatalogItem = {
  id: string;
  name: string;
  lifecycleCategory:
    | "onboarding"
    | "milestone"
    | "retention"
    | "transactional"
    | "feature_nudge"
    | "advocacy"
    | "content_launch";
  referencePattern: string;
  primaryGoal: string;
  moduleSequence: CareerVividEmailModule["type"][];
  placeholderZones: string[];
  recommendedTriggers: string[];
  successMetric: string;
};

const SYSTEM_NOTIFICATION_FOOTER =
  "You are receiving this system notification because you are a registered user of CareerVivid. You can easily modify your delivery frequency or opt-out of specific communication tracks at any time by updating your account settings directly at https://careervivid.app/profile.";

export const careerVividEmailTokens = {
  color: {
    page: "#f7f1e7",
    paper: "#fffaf1",
    panel: "#fbfbfe",
    card: "#ffffff",
    ink: "#211b16",
    slateInk: "#0f172a",
    muted: "#665a4a",
    coolMuted: "#64748b",
    softText: "#8a7a6a",
    border: "#e4d3bc",
    coolBorder: "#ececf4",
    purple: "#625bd5",
    purpleHover: "#5851c8",
    purpleSoft: "#eef0ff",
    purpleSoftAlt: "#f3f2ff",
    lavender: "#f8f8fb",
    amber: "#a97935",
    amberSoft: "#fff5d8",
    amberBorder: "#e9c56e",
    successText: "#047857",
    successSoft: "#eff6ec",
    successBorder: "#bdd3b3",
    warningText: "#92400e",
    criticalText: "#be123c",
    criticalSoft: "#fff0ec",
    criticalBorder: "#e4b0a4"
  },
  font: {
    body: "Inter, Helvetica, Arial, sans-serif",
    heading: "'Plus Jakarta Sans', Inter, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif"
  },
  type: {
    heroTitle: "36px",
    title: "28px",
    section: "18px",
    cardTitle: "14px",
    body: "15px",
    helper: "12px",
    badge: "11px"
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "18px"
  },
  space: {
    pageX: "14px",
    sectionY: "18px",
    card: "24px",
    compact: "12px"
  },
  width: {
    container: "640px",
    readable: "520px"
  }
} as const;

export const careerVividEmailTemplateCatalog: CareerVividEmailTemplateCatalogItem[] = [
  {
    id: "cv-welcome-checklist",
    name: "Welcome checklist",
    lifecycleCategory: "onboarding",
    referencePattern: "Centered welcome hero followed by first-step checklist",
    primaryGoal: "Move a new user to first resume creation",
    moduleSequence: ["hero", "body", "checklist", "cta"],
    placeholderZones: ["user first name", "hero title", "three to six setup steps", "primary CTA"],
    recommendedTriggers: ["new user created", "no resume after 15-30 minutes"],
    successMetric: "resume_created within 24h"
  },
  {
    id: "cv-milestone-product-hero",
    name: "Milestone product hero",
    lifecycleCategory: "milestone",
    referencePattern: "Milestone headline with one product mock or image above practical next copy",
    primaryGoal: "Convert a completed first task into the next workflow",
    moduleSequence: ["hero", "body", "featureList", "cta"],
    placeholderZones: ["milestone label", "product mock", "feature benefit bullets", "next-step CTA"],
    recommendedTriggers: ["first resume created", "first job saved", "first review completed"],
    successMetric: "next workflow started within 24h"
  },
  {
    id: "cv-activity-digest",
    name: "Activity digest",
    lifecycleCategory: "retention",
    referencePattern: "Operational summary with stats, activity rows, and board-update CTA",
    primaryGoal: "Bring users back to update stale job-search state",
    moduleSequence: ["body", "cta", "stats", "activityList"],
    placeholderZones: ["period label", "stats grid", "activity rows", "board CTA"],
    recommendedTriggers: ["daily digest opt-in", "weekly digest opt-in", "saved jobs or applications changed"],
    successMetric: "dashboard_opened or job_updated within 48h"
  },
  {
    id: "cv-transaction-status",
    name: "Transactional status",
    lifecycleCategory: "transactional",
    referencePattern: "Short status notice with one action and low decoration",
    primaryGoal: "Confirm completion and route user to the result",
    moduleSequence: ["status", "cta"],
    placeholderZones: ["status icon text", "object name", "result link", "fallback URL"],
    recommendedTriggers: ["resume review completed", "payment completed", "export completed"],
    successMetric: "result viewed"
  },
  {
    id: "cv-feature-nudge",
    name: "Feature nudge",
    lifecycleCategory: "feature_nudge",
    referencePattern: "Feature-specific hero and compact benefit list",
    primaryGoal: "Introduce a related feature after relevant user behavior",
    moduleSequence: ["hero", "body", "featureList", "cta"],
    placeholderZones: ["feature mock", "feature title", "three practical benefits", "CTA"],
    recommendedTriggers: ["jobs saved and no cover letter", "resume created and no match analysis"],
    successMetric: "feature_started"
  },
  {
    id: "cv-advocacy-letter",
    name: "Advocacy letter",
    lifecycleCategory: "advocacy",
    referencePattern: "Plain founder-style letter after clear value is delivered",
    primaryGoal: "Collect feedback or Chrome Web Store reviews without fake urgency",
    moduleSequence: ["letter", "cta"],
    placeholderZones: ["value moment", "review destination", "founder signature", "support reply path"],
    recommendedTriggers: ["extension used several times", "autofill completed", "positive active user milestone"],
    successMetric: "review_clicked or feedback_submitted"
  },
  {
    id: "cv-content-launch",
    name: "Research or product update launch",
    lifecycleCategory: "content_launch",
    referencePattern: "Large report/product launch hero with concise summary and proof points",
    primaryGoal: "Drive engaged users to a useful product or market update",
    moduleSequence: ["hero", "body", "stats", "cta"],
    placeholderZones: ["report title", "date/meta", "proof metrics", "read/share CTA"],
    recommendedTriggers: ["newsletter subscribed", "active users with job tracker activity"],
    successMetric: "content_clicked"
  }
];

const T = careerVividEmailTokens;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeAttribute = (value: string): string => escapeHtml(value).replace(/`/g, "&#96;");

const paragraph = (text: string, margin = "0 0 16px 0") => `
  <p style="margin:${margin};font-family:${T.font.body};font-size:${T.type.body};line-height:1.65;color:${T.color.ink};font-weight:500;">
    ${text}
  </p>
`;

const moduleWrapper = (content: string, extraStyle = "") => `
  <tr>
    <td class="cv-pad" style="padding:0 0 ${T.space.sectionY} 0;${extraStyle}">
      ${content}
    </td>
  </tr>
`;

const statusColor = (status: CareerVividEmailActivity["status"] = "neutral") => {
  if (status === "success") return { bg: T.color.successSoft, text: T.color.successText, border: T.color.successBorder };
  if (status === "warning") return { bg: T.color.amberSoft, text: T.color.warningText, border: T.color.amberBorder };
  if (status === "critical") return { bg: T.color.criticalSoft, text: T.color.criticalText, border: T.color.criticalBorder };
  return { bg: T.color.purpleSoft, text: T.color.purple, border: T.color.coolBorder };
};

const visualBackground = (background: CareerVividEmailVisual["background"] = "paper") => {
  if (background === "lavender") return T.color.lavender;
  if (background === "warm") return T.color.amberSoft;
  if (background === "plain") return T.color.card;
  return T.color.paper;
};

function renderPreheader(text?: string): string {
  if (!text) return "";
  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
      ${escapeHtml(text)}
    </div>
  `;
}

function renderHeader(): string {
  return `
    <tr>
      <td align="center" style="padding:0 0 20px 0;">
        <p style="margin:0;font-family:${T.font.heading};font-size:15px;line-height:1;color:${T.color.ink};font-weight:800;letter-spacing:0;">
          CareerVivid
        </p>
        <p style="margin:8px 0 0 0;font-family:${T.font.body};font-size:12px;line-height:1.4;color:${T.color.softText};font-weight:600;">
          Job search workspace
        </p>
      </td>
    </tr>
  `;
}

function renderButton(button: CareerVividEmailButton, variant: "primary" | "secondary" = "primary"): string {
  if (variant === "secondary") {
    return `
      <p style="margin:18px 0 0 0;font-family:${T.font.body};font-size:14px;line-height:1.5;">
        <a href="${escapeAttribute(button.url)}" style="color:${T.color.purple};text-decoration:underline;font-weight:800;">
          ${escapeHtml(button.text)}
        </a>
      </p>
    `;
  }

  return `
    <table border="0" cellspacing="0" cellpadding="0" role="presentation" style="margin:0;">
      <tr>
        <td align="left" style="border-radius:${T.radius.sm};background-color:${T.color.purple};">
          <a href="${escapeAttribute(button.url)}" style="display:inline-block;padding:13px 20px;border-radius:${T.radius.sm};color:#ffffff;font-family:${T.font.body};font-size:14px;line-height:1;font-weight:800;text-decoration:none;">
            ${escapeHtml(button.text)}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function renderVisual(visual?: CareerVividEmailVisual): string {
  if (!visual) return "";

  if (visual.kind === "image") {
    return `
      <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:24px 0 0 0;background:${visualBackground(visual.background)};border:1px solid ${T.color.coolBorder};border-radius:${T.radius.lg};">
        <tr>
          <td align="center" style="padding:18px;">
            <img src="${escapeAttribute(visual.src)}" alt="${escapeAttribute(visual.alt)}" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;border-radius:${T.radius.md};">
          </td>
        </tr>
      </table>
    `;
  }

  return `
    <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:24px 0 0 0;background:${visualBackground(visual.background)};border:1px solid ${T.color.coolBorder};border-radius:${T.radius.lg};">
      <tr>
        <td align="center" style="padding:22px 18px;">
          ${renderProductMockup(visual.mockup)}
        </td>
      </tr>
    </table>
  `;
}

function renderProductMockup(mockup: CareerVividProductMockup): string {
  const metrics = mockup.metrics || [];
  const rows = mockup.rows || [];

  return `
    <table class="cv-mock" role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:500px;background:${T.color.card};border:1px solid ${T.color.coolBorder};border-radius:${T.radius.md};box-shadow:0 14px 32px rgba(15,23,42,0.08);overflow:hidden;">
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid ${T.color.coolBorder};">
          <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td>
                <p style="margin:0;font-family:${T.font.body};font-size:12px;line-height:1.35;color:${T.color.coolMuted};font-weight:800;">${escapeHtml(mockup.badge || "Career workspace")}</p>
                <h3 style="margin:4px 0 0 0;font-family:${T.font.heading};font-size:18px;line-height:1.25;color:${T.color.slateInk};font-weight:800;">${escapeHtml(mockup.title)}</h3>
                ${mockup.subtitle ? `<p style="margin:5px 0 0 0;font-family:${T.font.body};font-size:12px;line-height:1.45;color:${T.color.coolMuted};font-weight:600;">${escapeHtml(mockup.subtitle)}</p>` : ""}
              </td>
              <td align="right" style="vertical-align:top;">
                <span style="display:inline-block;border-radius:999px;background:${T.color.purpleSoft};color:${T.color.purple};padding:5px 8px;font-family:${T.font.body};font-size:11px;line-height:1;font-weight:800;">Live</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${metrics.length ? `
        <tr>
          <td style="padding:14px 16px 2px 16px;">
            <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0">
              <tr>
                ${metrics.slice(0, 3).map((metric) => `
                  <td class="cv-stat" width="${Math.floor(100 / Math.min(metrics.length, 3))}%" style="padding:0 6px 12px 0;">
                    <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0" style="background:${T.color.lavender};border:1px solid ${T.color.coolBorder};border-radius:${T.radius.sm};">
                      <tr>
                        <td style="padding:10px;">
                          <p style="margin:0;font-family:${T.font.heading};font-size:20px;line-height:1;color:${T.color.slateInk};font-weight:900;">${escapeHtml(metric.value)}</p>
                          <p style="margin:5px 0 0 0;font-family:${T.font.body};font-size:11px;line-height:1.25;color:${T.color.coolMuted};font-weight:700;">${escapeHtml(metric.label)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                `).join("")}
              </tr>
            </table>
          </td>
        </tr>
      ` : ""}
      ${rows.length ? `
        <tr>
          <td style="padding:4px 16px 16px 16px;">
            ${rows.slice(0, 4).map((row) => {
              const colors = statusColor(row.status);
              return `
                <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:0 0 8px 0;border:1px solid ${T.color.coolBorder};border-radius:${T.radius.sm};background:#ffffff;">
                  <tr>
                    <td style="padding:10px 12px;">
                      <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="vertical-align:top;">
                            <p style="margin:0;font-family:${T.font.body};font-size:12px;line-height:1.35;color:${T.color.slateInk};font-weight:800;">${escapeHtml(row.title)}</p>
                            ${row.meta ? `<p style="margin:3px 0 0 0;font-family:${T.font.body};font-size:11px;line-height:1.35;color:${T.color.coolMuted};font-weight:600;">${escapeHtml(row.meta)}</p>` : ""}
                          </td>
                          <td align="right" style="vertical-align:top;">
                            <span style="display:inline-block;border:1px solid ${colors.border};background:${colors.bg};color:${colors.text};border-radius:999px;padding:4px 7px;font-family:${T.font.body};font-size:10px;line-height:1;font-weight:800;">${escapeHtml(row.label)}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              `;
            }).join("")}
          </td>
        </tr>
      ` : ""}
      ${mockup.footer ? `
        <tr>
          <td style="padding:0 16px 16px 16px;">
            <p style="margin:0;font-family:${T.font.body};font-size:11px;line-height:1.45;color:${T.color.coolMuted};font-weight:600;">${escapeHtml(mockup.footer)}</p>
          </td>
        </tr>
      ` : ""}
    </table>
  `;
}

function renderHero(module: Extract<CareerVividEmailModule, { type: "hero" }>): string {
  const titleSize = module.variant === "report" ? "44px" : T.type.heroTitle;
  return moduleWrapper(`
    <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0" style="background:${T.color.paper};border:1px solid ${T.color.border};border-radius:${T.radius.xl};">
      <tr>
        <td align="center" style="padding:38px 30px 32px 30px;">
          ${module.eyebrow ? `<p style="margin:0 0 10px 0;font-family:${T.font.body};font-size:${T.type.badge};line-height:1.35;color:${T.color.amber};font-weight:900;letter-spacing:0.14em;text-transform:uppercase;">${escapeHtml(module.eyebrow)}</p>` : ""}
          <h1 style="margin:0 auto;font-family:${module.variant === "report" ? T.font.heading : T.font.serif};font-size:${titleSize};line-height:1.05;color:${T.color.ink};font-weight:800;letter-spacing:0;max-width:${T.width.readable};">
            ${escapeHtml(module.title)}
          </h1>
          ${module.subtitle ? `<p style="margin:14px auto 0 auto;font-family:${T.font.body};font-size:${T.type.body};line-height:1.6;color:${T.color.muted};font-weight:600;max-width:480px;">${escapeHtml(module.subtitle)}</p>` : ""}
          ${module.meta ? `<p style="margin:14px 0 0 0;font-family:${T.font.body};font-size:${T.type.helper};line-height:1.45;color:${T.color.softText};font-weight:700;">${escapeHtml(module.meta)}</p>` : ""}
          ${renderVisual(module.visual)}
        </td>
      </tr>
    </table>
  `);
}

function renderBody(module: Extract<CareerVividEmailModule, { type: "body" }>, userName?: string): string {
  const firstName = (module.greeting || userName || "there").trim().split(/\s+/)[0];
  return moduleWrapper(`
    <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0" style="background:${T.color.card};border:1px solid ${T.color.border};border-radius:${T.radius.lg};">
      <tr>
        <td style="padding:28px 28px 18px 28px;">
          ${paragraph(`Hi ${escapeHtml(firstName)},`, "0 0 18px 0")}
          ${module.paragraphs.map((item) => paragraph(escapeHtml(item))).join("")}
        </td>
      </tr>
    </table>
  `);
}

function renderChecklist(module: Extract<CareerVividEmailModule, { type: "checklist" }>): string {
  return moduleWrapper(`
    <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0" style="background:${T.color.card};border:1px solid ${T.color.border};border-radius:${T.radius.lg};">
      <tr>
        <td style="padding:${T.space.card};">
          <h2 style="margin:0 0 16px 0;font-family:${T.font.heading};font-size:${T.type.section};line-height:1.25;color:${T.color.ink};font-weight:800;">${escapeHtml(module.title)}</h2>
          ${module.items.map((item, index) => `
            <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:0 0 12px 0;">
              <tr>
                <td width="28" style="vertical-align:top;">
                  <span style="display:inline-block;width:22px;height:22px;border-radius:999px;background:${T.color.purpleSoft};color:${T.color.purple};font-family:${T.font.body};font-size:12px;line-height:22px;text-align:center;font-weight:900;">${index + 1}</span>
                </td>
                <td style="vertical-align:top;">
                  <p style="margin:0;font-family:${T.font.body};font-size:${T.type.cardTitle};line-height:1.35;color:${T.color.ink};font-weight:800;">${escapeHtml(item.title)}</p>
                  <p style="margin:3px 0 0 0;font-family:${T.font.body};font-size:${T.type.helper};line-height:1.45;color:${T.color.muted};font-weight:600;">${escapeHtml(item.body)}</p>
                </td>
              </tr>
            </table>
          `).join("")}
        </td>
      </tr>
    </table>
  `);
}

function renderFeatureList(module: Extract<CareerVividEmailModule, { type: "featureList" }>): string {
  return moduleWrapper(`
    <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0" style="background:${T.color.panel};border:1px solid ${T.color.coolBorder};border-radius:${T.radius.lg};">
      <tr>
        <td style="padding:${T.space.card};">
          <h2 style="margin:0 0 16px 0;font-family:${T.font.heading};font-size:${T.type.section};line-height:1.25;color:${T.color.slateInk};font-weight:800;">${escapeHtml(module.title)}</h2>
          ${module.items.map((item) => `
            <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:0 0 12px 0;background:#ffffff;border:1px solid ${T.color.coolBorder};border-radius:${T.radius.md};">
              <tr>
                <td style="padding:14px 16px;">
                  ${item.label ? `<p style="margin:0 0 6px 0;font-family:${T.font.body};font-size:10px;line-height:1;color:${T.color.purple};font-weight:900;letter-spacing:0.1em;text-transform:uppercase;">${escapeHtml(item.label)}</p>` : ""}
                  <p style="margin:0;font-family:${T.font.body};font-size:${T.type.cardTitle};line-height:1.35;color:${T.color.slateInk};font-weight:800;">${escapeHtml(item.title)}</p>
                  <p style="margin:4px 0 0 0;font-family:${T.font.body};font-size:${T.type.helper};line-height:1.5;color:${T.color.coolMuted};font-weight:600;">${escapeHtml(item.body)}</p>
                </td>
              </tr>
            </table>
          `).join("")}
        </td>
      </tr>
    </table>
  `);
}

function renderStats(module: Extract<CareerVividEmailModule, { type: "stats" }>): string {
  return moduleWrapper(`
    <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0" style="background:${T.color.card};border:1px solid ${T.color.border};border-radius:${T.radius.lg};">
      <tr>
        <td style="padding:${T.space.card};">
          <h2 style="margin:0 0 16px 0;font-family:${T.font.heading};font-size:${T.type.section};line-height:1.25;color:${T.color.ink};font-weight:800;">${escapeHtml(module.title)}</h2>
          <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0">
            <tr>
              ${module.stats.slice(0, 4).map((stat) => `
                <td class="cv-stat" width="${Math.floor(100 / Math.min(module.stats.length, 4))}%" style="padding:0 8px 8px 0;">
                  <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0" style="border:1px solid ${T.color.coolBorder};border-radius:${T.radius.md};background:${T.color.lavender};">
                    <tr>
                      <td align="center" style="padding:16px 10px;">
                        <p style="margin:0;font-family:${T.font.heading};font-size:26px;line-height:1;color:${T.color.slateInk};font-weight:900;">${escapeHtml(stat.value)}</p>
                        <p style="margin:7px 0 0 0;font-family:${T.font.body};font-size:11px;line-height:1.25;color:${T.color.coolMuted};font-weight:800;">${escapeHtml(stat.label)}</p>
                        ${stat.helper ? `<p style="margin:5px 0 0 0;font-family:${T.font.body};font-size:10px;line-height:1.25;color:${T.color.softText};font-weight:600;">${escapeHtml(stat.helper)}</p>` : ""}
                      </td>
                    </tr>
                  </table>
                </td>
              `).join("")}
            </tr>
          </table>
          ${module.caption ? `<p style="margin:8px 0 0 0;font-family:${T.font.body};font-size:${T.type.helper};line-height:1.5;color:${T.color.muted};font-weight:600;">${escapeHtml(module.caption)}</p>` : ""}
        </td>
      </tr>
    </table>
  `);
}

function renderActivityList(module: Extract<CareerVividEmailModule, { type: "activityList" }>): string {
  return moduleWrapper(`
    <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0" style="background:${T.color.card};border:1px solid ${T.color.border};border-radius:${T.radius.lg};">
      <tr>
        <td style="padding:${T.space.card};">
          <h2 style="margin:0;font-family:${T.font.heading};font-size:${T.type.section};line-height:1.25;color:${T.color.ink};font-weight:800;">${escapeHtml(module.title)}</h2>
          ${module.subtitle ? `<p style="margin:6px 0 16px 0;font-family:${T.font.body};font-size:${T.type.helper};line-height:1.5;color:${T.color.muted};font-weight:600;">${escapeHtml(module.subtitle)}</p>` : ""}
          ${module.activities.map((activity) => {
            const colors = statusColor(activity.status);
            return `
              <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:0 0 10px 0;border:1px solid ${T.color.coolBorder};border-radius:${T.radius.md};background:${T.color.panel};">
                <tr>
                  <td style="padding:14px 16px;">
                    <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align:top;">
                          <p style="margin:0;font-family:${T.font.body};font-size:${T.type.cardTitle};line-height:1.35;color:${T.color.slateInk};font-weight:800;">${escapeHtml(activity.title)}</p>
                          ${activity.meta ? `<p style="margin:4px 0 0 0;font-family:${T.font.body};font-size:${T.type.helper};line-height:1.45;color:${T.color.coolMuted};font-weight:600;">${escapeHtml(activity.meta)}</p>` : ""}
                        </td>
                        <td align="right" style="vertical-align:top;">
                          <span style="display:inline-block;border:1px solid ${colors.border};background:${colors.bg};color:${colors.text};border-radius:999px;padding:5px 8px;font-family:${T.font.body};font-size:10px;line-height:1;font-weight:900;">${escapeHtml(activity.label)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            `;
          }).join("")}
        </td>
      </tr>
    </table>
  `);
}

function renderStatus(module: Extract<CareerVividEmailModule, { type: "status" }>): string {
  const colors = statusColor(module.status);
  return moduleWrapper(`
    <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0" style="background:${colors.bg};border:1px solid ${colors.border};border-radius:${T.radius.lg};">
      <tr>
        <td style="padding:${T.space.card};">
          <h2 style="margin:0 0 10px 0;font-family:${T.font.heading};font-size:${T.type.section};line-height:1.25;color:${T.color.ink};font-weight:800;">${escapeHtml(module.title)}</h2>
          <p style="margin:0;font-family:${T.font.body};font-size:${T.type.body};line-height:1.6;color:${T.color.ink};font-weight:600;">${escapeHtml(module.body)}</p>
          ${module.rows?.length ? `
            <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:18px 0 0 0;">
              ${module.rows.map((row) => `
                <tr>
                  <td style="padding:8px 0;border-top:1px solid rgba(33,27,22,0.1);font-family:${T.font.body};font-size:12px;line-height:1.35;color:${T.color.muted};font-weight:700;">${escapeHtml(row.label)}</td>
                  <td align="right" style="padding:8px 0;border-top:1px solid rgba(33,27,22,0.1);font-family:${T.font.body};font-size:12px;line-height:1.35;color:${T.color.ink};font-weight:900;">${escapeHtml(row.value)}</td>
                </tr>
              `).join("")}
            </table>
          ` : ""}
        </td>
      </tr>
    </table>
  `);
}

function renderLetter(module: Extract<CareerVividEmailModule, { type: "letter" }>): string {
  return moduleWrapper(`
    <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0" style="background:${T.color.card};border:1px solid ${T.color.border};border-radius:${T.radius.lg};">
      <tr>
        <td style="padding:30px 30px 24px 30px;">
          ${module.paragraphs.map((item) => paragraph(escapeHtml(item))).join("")}
          ${module.signatureName ? `
            <p style="margin:24px 0 0 0;font-family:${T.font.body};font-size:14px;line-height:1.55;color:${T.color.ink};font-weight:800;">
              ${escapeHtml(module.signatureName)}
              ${module.signatureRole ? `<br><span style="color:${T.color.muted};font-weight:600;">${escapeHtml(module.signatureRole)}</span>` : ""}
            </p>
          ` : ""}
        </td>
      </tr>
    </table>
  `);
}

function renderCta(module: Extract<CareerVividEmailModule, { type: "cta" }>): string {
  return moduleWrapper(`
    <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="left" style="padding:6px 0 8px 0;">
          ${module.primary ? renderButton(module.primary) : ""}
          ${module.secondary ? renderButton(module.secondary, "secondary") : ""}
          ${module.helper ? `<p style="margin:16px 0 0 0;font-family:${T.font.body};font-size:${T.type.helper};line-height:1.5;color:${T.color.muted};font-weight:600;">${escapeHtml(module.helper)}</p>` : ""}
        </td>
      </tr>
    </table>
  `);
}

function renderModule(module: CareerVividEmailModule, userName?: string): string {
  if (module.type === "hero") return renderHero(module);
  if (module.type === "body") return renderBody(module, userName);
  if (module.type === "checklist") return renderChecklist(module);
  if (module.type === "featureList") return renderFeatureList(module);
  if (module.type === "stats") return renderStats(module);
  if (module.type === "activityList") return renderActivityList(module);
  if (module.type === "status") return renderStatus(module);
  if (module.type === "letter") return renderLetter(module);
  return renderCta(module);
}

export function generateCareerVividModuleEmail(props: CareerVividModuleEmailProps): string {
  const safeTitle = escapeHtml(props.title);
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>${safeTitle}</title>
  <style>
    @media only screen and (max-width: 640px) {
      .cv-container { width: 100% !important; max-width: 100% !important; }
      .cv-shell { padding-left: 12px !important; padding-right: 12px !important; }
      .cv-pad { padding-bottom: 14px !important; }
      .cv-stat { display: block !important; width: 100% !important; padding-right: 0 !important; }
      .cv-mock { max-width: 100% !important; }
      h1 { font-size: 30px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${T.color.page};font-family:${T.font.body};">
  ${renderPreheader(props.preheader)}
  <center style="width:100%;background:${T.color.page};">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:${T.color.page};">
      <tr>
        <td class="cv-shell" align="center" style="padding:34px 14px;">
          <table class="cv-container" role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:${T.width.container};">
            ${renderHeader()}
            ${props.modules.map((module) => renderModule(module, props.userName)).join("")}
            <tr>
              <td align="center" style="padding:8px 22px 0 22px;">
                <p style="margin:0;font-family:${T.font.body};font-size:12px;line-height:1.6;color:${T.color.muted};font-weight:600;">
                  ${escapeHtml(props.footerText || SYSTEM_NOTIFICATION_FOOTER)}
                </p>
                <p style="margin:10px 0 0 0;font-family:${T.font.body};font-size:12px;line-height:1.6;color:${T.color.softText};font-weight:600;">
                  CareerVivid, ${new Date().getFullYear()} &middot; <a href="https://careervivid.app" style="color:${T.color.purple};text-decoration:underline;font-weight:800;">careervivid.app</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
  `;
}
