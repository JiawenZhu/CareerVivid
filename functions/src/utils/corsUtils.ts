import cors from "cors";

const allowedOrigins = new Set([
  // CareerVivid Web App (Prod & Dev)
  "https://careervivid.app",
  "https://careervivid.web.app",
  "https://careervivid.firebaseapp.com",
  // Local development
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "https://jiawenzhu.github.io",
]);

// Allowed job boards and ATS domains (specifically for extension injected requests)
const allowedDomains = [
  "linkedin.com",
  "indeed.com",
  "lever.co",
  "greenhouse.io",
  "ashbyhq.com",
  "myworkdayjobs.com",
];

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return true; // Allows server-to-server, curl, etc.

  // 1. Direct whitelisted origins
  if (allowedOrigins.has(origin)) {
    return true;
  }

  // 2. CareerVivid staging/dev subdomains
  if (
    origin.endsWith(".careervivid.app") ||
    origin.endsWith(".careervivid.web.app") ||
    origin.endsWith(".careervivid.firebaseapp.com")
  ) {
    return true;
  }

  // 3. Chrome Extension origins
  if (origin.startsWith("chrome-extension://")) {
    return true;
  }

  // 4. Injected job sites & ATS domains
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    return allowedDomains.some((domain) =>
      hostname === domain || hostname.endsWith("." + domain)
    );
  } catch {
    return false;
  }
}

export const secureCorsHandler = cors({
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} is not allowed by CareerVivid CORS policy.`));
    }
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key", "x-gemini-key"],
  credentials: true,
  maxAge: 86400,
});
