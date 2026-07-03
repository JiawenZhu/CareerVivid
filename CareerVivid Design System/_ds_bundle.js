/* @ds-bundle: {"format":4,"namespace":"CareerVividDesignSystem_456569","components":[{"name":"Avatar","sourcePath":"components/display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/display/Badge.jsx"},{"name":"StatusDot","sourcePath":"components/display/Badge.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"Eyebrow","sourcePath":"components/display/Card.jsx"},{"name":"CompanyGuideCard","sourcePath":"components/display/CompanyGuideCard.jsx"},{"name":"JobCard","sourcePath":"components/display/JobCard.jsx"},{"name":"StatCard","sourcePath":"components/display/StatCard.jsx"},{"name":"Modal","sourcePath":"components/feedback/Modal.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"CategoryFilter","sourcePath":"components/forms/CategoryFilter.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"SearchInput","sourcePath":"components/forms/SearchInput.jsx"},{"name":"SegmentedControl","sourcePath":"components/forms/SegmentedControl.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"},{"name":"IconWell","sourcePath":"components/icons/IconWell.jsx"},{"name":"LUCIDE_ICONS","sourcePath":"components/icons/lucideIconData.js"},{"name":"Sidebar","sourcePath":"components/navigation/Sidebar.jsx"}],"sourceHashes":{"assets/icons/lucide-icons.js":"3b30616bc6b0","components/display/Avatar.jsx":"9f70c4922d90","components/display/Badge.jsx":"c70f0bbec7f5","components/display/Card.jsx":"ee0a0eb9d41f","components/display/CompanyGuideCard.jsx":"3107bc7d9c93","components/display/JobCard.jsx":"aa5fd50057b3","components/display/StatCard.jsx":"0f493b65fcf4","components/feedback/Modal.jsx":"162c214af6ce","components/forms/Button.jsx":"52e7817e6250","components/forms/CategoryFilter.jsx":"09e71ac3852f","components/forms/Input.jsx":"ea5b55c61bd3","components/forms/SearchInput.jsx":"fbad4d03d166","components/forms/SegmentedControl.jsx":"cdb499ce6bfd","components/icons/Icon.jsx":"4a2ed65ccb68","components/icons/IconWell.jsx":"ecb9698e18c4","components/icons/lucideIconData.js":"deab32bd6c7e","components/navigation/Sidebar.jsx":"b25dae8acd78","redesigns/lucide-icons.js":"3b30616bc6b0","ui_kits/app/workspace.jsx":"d46bda4a4957","ui_kits/marketing/landing.jsx":"014631b20f94"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.CareerVividDesignSystem_456569 = window.CareerVividDesignSystem_456569 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// assets/icons/lucide-icons.js
try { (() => {
// Lucide v0.344.0 (ISC). window global for standalone mockups.
window.CV_LUCIDE = {
  "briefcase": "<rect width=\"20\" height=\"14\" x=\"2\" y=\"7\" rx=\"2\" ry=\"2\" /> <path d=\"M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16\" />",
  "file-text": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" /> <path d=\"M14 2v4a2 2 0 0 0 2 2h4\" /> <path d=\"M10 9H8\" /> <path d=\"M16 13H8\" /> <path d=\"M16 17H8\" />",
  "mic": "<path d=\"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z\" /> <path d=\"M19 10v2a7 7 0 0 1-14 0v-2\" /> <line x1=\"12\" x2=\"12\" y1=\"19\" y2=\"22\" />",
  "search": "<circle cx=\"11\" cy=\"11\" r=\"8\" /> <path d=\"m21 21-4.3-4.3\" />",
  "sparkles": "<path d=\"m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z\" /> <path d=\"M5 3v4\" /> <path d=\"M19 17v4\" /> <path d=\"M3 5h4\" /> <path d=\"M17 19h4\" />",
  "wand-2": "<path d=\"m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z\" /> <path d=\"m14 7 3 3\" /> <path d=\"M5 6v4\" /> <path d=\"M19 14v4\" /> <path d=\"M10 2v2\" /> <path d=\"M7 8H3\" /> <path d=\"M21 16h-4\" /> <path d=\"M11 3H9\" />",
  "check-circle-2": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"m9 12 2 2 4-4\" />",
  "check-circle": "<path d=\"M22 11.08V12a10 10 0 1 1-5.93-9.14\" /> <path d=\"m9 11 3 3L22 4\" />",
  "alert-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"12\" /> <line x1=\"12\" x2=\"12.01\" y1=\"16\" y2=\"16\" />",
  "alert-triangle": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\" /> <path d=\"M12 9v4\" /> <path d=\"M12 17h.01\" />",
  "calendar-clock": "<path d=\"M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5\" /> <path d=\"M16 2v4\" /> <path d=\"M8 2v4\" /> <path d=\"M3 10h5\" /> <path d=\"M17.5 17.5 16 16.3V14\" /> <circle cx=\"16\" cy=\"16\" r=\"6\" />",
  "arrow-up-right": "<path d=\"M7 7h10v10\" /> <path d=\"M7 17 17 7\" />",
  "arrow-right": "<path d=\"M5 12h14\" /> <path d=\"m12 5 7 7-7 7\" />",
  "arrow-left": "<path d=\"m12 19-7-7 7-7\" /> <path d=\"M19 12H5\" />",
  "layout-dashboard": "<rect width=\"7\" height=\"9\" x=\"3\" y=\"3\" rx=\"1\" /> <rect width=\"7\" height=\"5\" x=\"14\" y=\"3\" rx=\"1\" /> <rect width=\"7\" height=\"9\" x=\"14\" y=\"12\" rx=\"1\" /> <rect width=\"7\" height=\"5\" x=\"3\" y=\"16\" rx=\"1\" />",
  "layout-grid": "<rect width=\"7\" height=\"7\" x=\"3\" y=\"3\" rx=\"1\" /> <rect width=\"7\" height=\"7\" x=\"14\" y=\"3\" rx=\"1\" /> <rect width=\"7\" height=\"7\" x=\"14\" y=\"14\" rx=\"1\" /> <rect width=\"7\" height=\"7\" x=\"3\" y=\"14\" rx=\"1\" />",
  "message-square-text": "<path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\" /> <path d=\"M13 8H7\" /> <path d=\"M17 12H7\" />",
  "chevron-left": "<path d=\"m15 18-6-6 6-6\" />",
  "chevron-right": "<path d=\"m9 18 6-6-6-6\" />",
  "chevron-down": "<path d=\"m6 9 6 6 6-6\" />",
  "x": "<path d=\"M18 6 6 18\" /> <path d=\"m6 6 12 12\" />",
  "x-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"m15 9-6 6\" /> <path d=\"m9 9 6 6\" />",
  "plus": "<path d=\"M5 12h14\" /> <path d=\"M12 5v14\" />",
  "minus": "<path d=\"M5 12h14\" />",
  "external-link": "<path d=\"M15 3h6v6\" /> <path d=\"M10 14 21 3\" /> <path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\" />",
  "clipboard-list": "<rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\" ry=\"1\" /> <path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\" /> <path d=\"M12 11h4\" /> <path d=\"M12 16h4\" /> <path d=\"M8 11h.01\" /> <path d=\"M8 16h.01\" />",
  "target": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <circle cx=\"12\" cy=\"12\" r=\"6\" /> <circle cx=\"12\" cy=\"12\" r=\"2\" />",
  "filter": "<polygon points=\"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3\" />",
  "user-round": "<circle cx=\"12\" cy=\"8\" r=\"5\" /> <path d=\"M20 21a8 8 0 0 0-16 0\" />",
  "map-pin": "<path d=\"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z\" /> <circle cx=\"12\" cy=\"10\" r=\"3\" />",
  "dollar-sign": "<line x1=\"12\" x2=\"12\" y1=\"2\" y2=\"22\" /> <path d=\"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6\" />",
  "settings": "<path d=\"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z\" /> <circle cx=\"12\" cy=\"12\" r=\"3\" />",
  "bell": "<path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" /> <path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" />",
  "trophy": "<path d=\"M6 9H4.5a2.5 2.5 0 0 1 0-5H6\" /> <path d=\"M18 9h1.5a2.5 2.5 0 0 0 0-5H18\" /> <path d=\"M4 22h16\" /> <path d=\"M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22\" /> <path d=\"M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22\" /> <path d=\"M18 2H6v7a6 6 0 0 0 12 0V2Z\" />",
  "send": "<path d=\"m22 2-7 20-4-9-9-4Z\" /> <path d=\"M22 2 11 13\" />",
  "clock-3": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <polyline points=\"12 6 12 12 16.5 12\" />",
  "moon": "<path d=\"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z\" />",
  "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\" /> <path d=\"M12 2v2\" /> <path d=\"M12 20v2\" /> <path d=\"m4.93 4.93 1.41 1.41\" /> <path d=\"m17.66 17.66 1.41 1.41\" /> <path d=\"M2 12h2\" /> <path d=\"M20 12h2\" /> <path d=\"m6.34 17.66-1.41 1.41\" /> <path d=\"m19.07 4.93-1.41 1.41\" />",
  "bot": "<path d=\"M12 8V4H8\" /> <rect width=\"16\" height=\"12\" x=\"4\" y=\"8\" rx=\"2\" /> <path d=\"M2 14h2\" /> <path d=\"M20 14h2\" /> <path d=\"M15 13v2\" /> <path d=\"M9 13v2\" />",
  "refresh-cw": "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\" /> <path d=\"M21 3v5h-5\" /> <path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\" /> <path d=\"M8 16H3v5\" />",
  "shield-check": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\" /> <path d=\"m9 12 2 2 4-4\" />",
  "book-open": "<path d=\"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z\" /> <path d=\"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z\" />",
  "presentation": "<path d=\"M2 3h20\" /> <path d=\"M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3\" /> <path d=\"m7 21 5-5 5 5\" />",
  "palette": "<circle cx=\"13.5\" cy=\"6.5\" r=\".5\" fill=\"currentColor\" /> <circle cx=\"17.5\" cy=\"10.5\" r=\".5\" fill=\"currentColor\" /> <circle cx=\"8.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\" /> <circle cx=\"6.5\" cy=\"12.5\" r=\".5\" fill=\"currentColor\" /> <path d=\"M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z\" />",
  "trash-2": "<path d=\"M3 6h18\" /> <path d=\"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6\" /> <path d=\"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2\" /> <line x1=\"10\" x2=\"10\" y1=\"11\" y2=\"17\" /> <line x1=\"14\" x2=\"14\" y1=\"11\" y2=\"17\" />",
  "download": "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /> <polyline points=\"7 10 12 15 17 10\" /> <line x1=\"12\" x2=\"12\" y1=\"15\" y2=\"3\" />",
  "share-2": "<circle cx=\"18\" cy=\"5\" r=\"3\" /> <circle cx=\"6\" cy=\"12\" r=\"3\" /> <circle cx=\"18\" cy=\"19\" r=\"3\" /> <line x1=\"8.59\" x2=\"15.42\" y1=\"13.51\" y2=\"17.49\" /> <line x1=\"15.41\" x2=\"8.59\" y1=\"6.51\" y2=\"10.49\" />",
  "link": "<path d=\"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\" /> <path d=\"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\" />",
  "eye": "<path d=\"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z\" /> <circle cx=\"12\" cy=\"12\" r=\"3\" />",
  "pen-line": "<path d=\"M12 20h9\" /> <path d=\"M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z\" />",
  "globe": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\" /> <path d=\"M2 12h20\" />",
  "loader-2": "<path d=\"M21 12a9 9 0 1 1-6.219-8.56\" />",
  "play": "<polygon points=\"5 3 19 12 5 21 5 3\" />",
  "square": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" />",
  "home": "<path d=\"m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\" /> <polyline points=\"9 22 9 12 15 12 15 22\" />",
  "kanban-square": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" /> <path d=\"M8 7v7\" /> <path d=\"M12 7v4\" /> <path d=\"M16 7v9\" />",
  "app-window": "<rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"2\" /> <path d=\"M10 4v4\" /> <path d=\"M2 8h20\" /> <path d=\"M6 4v4\" />",
  "more-horizontal": "<circle cx=\"12\" cy=\"12\" r=\"1\" /> <circle cx=\"19\" cy=\"12\" r=\"1\" /> <circle cx=\"5\" cy=\"12\" r=\"1\" />",
  "log-out": "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\" /> <polyline points=\"16 17 21 12 16 7\" /> <line x1=\"21\" x2=\"9\" y1=\"12\" y2=\"12\" />",
  "circle-user-round": "<path d=\"M18 20a6 6 0 0 0-12 0\" /> <circle cx=\"12\" cy=\"10\" r=\"4\" /> <circle cx=\"12\" cy=\"12\" r=\"10\" />",
  "graduation-cap": "<path d=\"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z\" /> <path d=\"M22 10v6\" /> <path d=\"M6 12.5V16a6 3 0 0 0 12 0v-3.5\" />",
  "building-2": "<path d=\"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z\" /> <path d=\"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2\" /> <path d=\"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2\" /> <path d=\"M10 6h4\" /> <path d=\"M10 10h4\" /> <path d=\"M10 14h4\" /> <path d=\"M10 18h4\" />",
  "zap": "<polygon points=\"13 2 3 14 12 14 11 22 21 10 12 10 13 2\" />",
  "star": "<polygon points=\"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2\" />",
  "menu": "<line x1=\"4\" x2=\"20\" y1=\"12\" y2=\"12\" /> <line x1=\"4\" x2=\"20\" y1=\"6\" y2=\"6\" /> <line x1=\"4\" x2=\"20\" y1=\"18\" y2=\"18\" />",
  "check": "<path d=\"M20 6 9 17l-5-5\" />",
  "swords": "<polyline points=\"14.5 17.5 3 6 3 3 6 3 17.5 14.5\" /> <line x1=\"13\" x2=\"19\" y1=\"19\" y2=\"13\" /> <line x1=\"16\" x2=\"20\" y1=\"16\" y2=\"20\" /> <line x1=\"19\" x2=\"21\" y1=\"21\" y2=\"19\" /> <polyline points=\"14.5 6.5 18 3 21 3 21 6 17.5 9.5\" /> <line x1=\"5\" x2=\"9\" y1=\"14\" y2=\"18\" /> <line x1=\"7\" x2=\"4\" y1=\"17\" y2=\"20\" /> <line x1=\"3\" x2=\"5\" y1=\"19\" y2=\"21\" />",
  "lock": "<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\" /> <path d=\"M7 11V7a5 5 0 0 1 10 0v4\" />",
  "flame": "<path d=\"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z\" />",
  "bar-chart-3": "<path d=\"M3 3v18h18\" /> <path d=\"M18 17V9\" /> <path d=\"M13 17V5\" /> <path d=\"M8 17v-3\" />",
  "rotate-ccw": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\" /> <path d=\"M3 3v5h5\" />",
  "pen-tool": "<path d=\"m12 19 7-7 3 3-7 7-3-3z\" /> <path d=\"m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z\" /> <path d=\"m2 2 7.586 7.586\" /> <circle cx=\"11\" cy=\"11\" r=\"2\" />",
  "list-checks": "<path d=\"m3 17 2 2 4-4\" /> <path d=\"m3 7 2 2 4-4\" /> <path d=\"M13 6h8\" /> <path d=\"M13 12h8\" /> <path d=\"M13 18h8\" />",
  "sliders-horizontal": "<line x1=\"21\" x2=\"14\" y1=\"4\" y2=\"4\" /> <line x1=\"10\" x2=\"3\" y1=\"4\" y2=\"4\" /> <line x1=\"21\" x2=\"12\" y1=\"12\" y2=\"12\" /> <line x1=\"8\" x2=\"3\" y1=\"12\" y2=\"12\" /> <line x1=\"21\" x2=\"16\" y1=\"20\" y2=\"20\" /> <line x1=\"12\" x2=\"3\" y1=\"20\" y2=\"20\" /> <line x1=\"14\" x2=\"14\" y1=\"2\" y2=\"6\" /> <line x1=\"8\" x2=\"8\" y1=\"10\" y2=\"14\" /> <line x1=\"16\" x2=\"16\" y1=\"18\" y2=\"22\" />",
  "circle": "<circle cx=\"12\" cy=\"12\" r=\"10\" />",
  "diamond": "<path d=\"M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z\" />",
  "type": "<polyline points=\"4 7 4 4 20 4 20 7\" /> <line x1=\"9\" x2=\"15\" y1=\"20\" y2=\"20\" /> <line x1=\"12\" x2=\"12\" y1=\"4\" y2=\"20\" />",
  "hand": "<path d=\"M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0\" /> <path d=\"M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2\" /> <path d=\"M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8\" /> <path d=\"M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15\" />",
  "eraser": "<path d=\"m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21\" /> <path d=\"M22 21H7\" /> <path d=\"m5 11 9 9\" />",
  "mouse-pointer": "<path d=\"m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z\" /> <path d=\"m13 13 6 6\" />",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <polyline points=\"12 6 12 12 16 14\" />"
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/icons/lucide-icons.js", error: String((e && e.message) || e) }); }

// components/display/Avatar.jsx
try { (() => {
/**
 * Circle avatar with 2px white ring. Falls back to a tinted initial.
 * Brand fallback images: assets/avatars/careervivid-rabbit-glasses.jpg (neutral default),
 * careervivid-rabbit-bow.jpg.
 */
function Avatar({
  src,
  initial,
  size = 36,
  tone = 'purple',
  ring = true,
  style
}) {
  const tones = {
    purple: {
      background: 'var(--cv-purple-50)',
      color: 'var(--cv-purple-600)'
    },
    green: {
      background: '#f7fff8',
      color: '#15803d'
    },
    amber: {
      background: 'var(--cv-amber-50)',
      color: '#a16207'
    }
  };
  const t = tones[tone] || tones.purple;
  const common = {
    width: size,
    height: size,
    borderRadius: 999,
    flexShrink: 0,
    boxShadow: ring ? '0 0 0 2px #ffffff' : 'none'
  };
  if (src) {
    return /*#__PURE__*/React.createElement("img", {
      src: src,
      alt: "",
      style: {
        ...common,
        objectFit: 'cover',
        display: 'block',
        ...style
      }
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...common,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: t.background,
      color: t.color,
      fontFamily: 'var(--cv-font-body)',
      fontSize: Math.round(size * 0.42),
      fontWeight: 700,
      ...style
    }
  }, initial || '?');
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/display/Badge.jsx
try { (() => {
const badgeTones = {
  accent: {
    background: 'var(--cv-purple-50)',
    color: 'var(--cv-purple-600)',
    border: 'var(--cv-purple-200)'
  },
  success: {
    background: 'var(--cv-success-50)',
    color: 'var(--cv-success-600)',
    border: 'var(--cv-success-200)'
  },
  warning: {
    background: 'var(--cv-warning-50)',
    color: 'var(--cv-warning-700)',
    border: 'var(--cv-warning-200)'
  },
  danger: {
    background: 'var(--cv-danger-50)',
    color: 'var(--cv-danger-700)',
    border: 'var(--cv-danger-200)'
  },
  info: {
    background: 'var(--cv-blue-50)',
    color: 'var(--cv-blue-600)',
    border: 'var(--cv-blue-100)'
  },
  neutral: {
    background: 'var(--cv-neutral-100)',
    color: 'var(--cv-neutral-600)',
    border: 'var(--cv-neutral-200)'
  }
};

/**
 * Status badge / chip. 10–11px/700, pill by default.
 */
function Badge({
  tone = 'accent',
  children,
  dot,
  pill = true,
  bordered = false,
  style
}) {
  const t = badgeTones[tone] || badgeTones.accent;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '2px 8px',
      borderRadius: pill ? 999 : 4,
      background: t.background,
      color: t.color,
      border: bordered ? `1px solid ${t.border}` : '1px solid transparent',
      fontFamily: 'var(--cv-font-body)',
      fontSize: 11,
      fontWeight: 700,
      lineHeight: '16px',
      whiteSpace: 'nowrap',
      ...style
    }
  }, dot ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: 'currentColor',
      flexShrink: 0
    }
  }) : null, children);
}

/**
 * 10px pipeline status dot (To Apply / Applied / Interviewing / Offered / Rejected).
 */
function StatusDot({
  status = 'To Apply',
  size = 10,
  style
}) {
  const colors = {
    'To Apply': 'var(--cv-status-to-apply)',
    'Applied': 'var(--cv-status-applied)',
    'Interviewing': 'var(--cv-status-interviewing)',
    'Offered': 'var(--cv-status-offered)',
    'Rejected': 'var(--cv-status-rejected)'
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: 999,
      background: colors[status] || colors['To Apply'],
      flexShrink: 0,
      ...style
    }
  });
}
Object.assign(__ds_scope, { Badge, StatusDot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
const {
  useState
} = React;
/**
 * CareerVivid card. "product" = white workspace card; "warm" = public warm-paper card.
 * hoverable adds the -2px lift + purple-tint border.
 */
function Card({
  variant = 'product',
  hoverable = false,
  padding = 16,
  radius,
  children,
  onClick,
  style
}) {
  const [hover, setHover] = useState(false);
  const warm = variant === 'warm';
  const lifted = hoverable && hover;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: lifted ? 'var(--cv-purple-25)' : warm ? 'var(--cv-surface-warm-card)' : 'var(--cv-surface)',
      border: `1px solid ${lifted ? 'var(--cv-purple-200)' : warm ? 'var(--cv-border-warm)' : 'var(--cv-border-product)'}`,
      borderRadius: radius ?? 12,
      padding,
      boxShadow: lifted ? 'var(--cv-shadow-card-hover)' : warm ? 'var(--cv-shadow-warm-card)' : 'var(--cv-shadow-card)',
      transform: lifted ? 'translateY(-2px)' : 'none',
      transition: 'all var(--cv-duration-normal) var(--cv-ease-standard)',
      cursor: onClick ? 'pointer' : undefined,
      fontFamily: 'var(--cv-font-body)',
      ...style
    }
  }, children);
}

/**
 * Amber uppercase eyebrow label for warm public sections.
 */
function Eyebrow({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--cv-text-eyebrow)',
      fontFamily: 'var(--cv-font-body)',
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Card, Eyebrow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/forms/CategoryFilter.jsx
try { (() => {
const {
  useState
} = React;
/**
 * Category filter pills (Interview Studio guide categories).
 * Active = near-black; inactive = white with purple-tint hover.
 */
function CategoryFilter({
  options,
  value,
  onChange,
  style
}) {
  const [internal, setInternal] = useState(value ?? (options && options[0]));
  const current = value !== undefined ? value : internal;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      ...style
    }
  }, (options || []).map(opt => {
    const active = opt === current;
    return /*#__PURE__*/React.createElement(FilterPill, {
      key: opt,
      label: opt,
      active: active,
      onClick: () => {
        setInternal(opt);
        if (onChange) onChange(opt);
      }
    });
  }));
}
function FilterPill({
  label,
  active,
  onClick
}) {
  const [hover, setHover] = useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      height: 32,
      padding: '0 14px',
      borderRadius: 999,
      cursor: 'pointer',
      fontFamily: 'var(--cv-font-body)',
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: 'nowrap',
      transition: 'all var(--cv-duration-fast) var(--cv-ease-standard)',
      background: active ? 'var(--cv-neutral-950)' : hover ? 'var(--cv-purple-25)' : '#ffffff',
      color: active ? '#ffffff' : hover ? 'var(--cv-purple-600)' : 'var(--cv-neutral-600)',
      border: active ? '1px solid var(--cv-neutral-950)' : hover ? '1px solid var(--cv-purple-200)' : '1px solid var(--cv-border-product)',
      boxShadow: active ? '0 1px 2px rgba(16, 24, 40, 0.08)' : 'none'
    }
  }, label);
}
Object.assign(__ds_scope, { CategoryFilter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/CategoryFilter.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
const {
  useState
} = React;
/**
 * Standard text field. 42–52px tall, white, #d1d5db border, purple focus ring.
 */
function Input({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  height = 42,
  disabled,
  style
}) {
  const [focus, setFocus] = useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      fontFamily: 'var(--cv-font-body)',
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      marginBottom: 6,
      fontSize: 12,
      fontWeight: 700,
      color: 'var(--cv-text-heading-product)'
    }
  }, label) : null, /*#__PURE__*/React.createElement("input", {
    type: type,
    placeholder: placeholder,
    value: value,
    disabled: disabled,
    onChange: onChange ? e => onChange(e.target.value) : undefined,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      boxSizing: 'border-box',
      width: '100%',
      height,
      padding: '0 12px',
      borderRadius: 8,
      background: 'var(--cv-surface)',
      border: focus ? '1px solid var(--cv-action-primary)' : '1px solid var(--cv-neutral-300)',
      boxShadow: focus ? '0 0 0 3px var(--cv-focus-ring)' : 'none',
      outline: 'none',
      fontFamily: 'var(--cv-font-body)',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--cv-text-heading-product)',
      opacity: disabled ? 0.5 : 1,
      transition: 'border-color var(--cv-duration-fast) var(--cv-ease-standard), box-shadow var(--cv-duration-fast) var(--cv-ease-standard)'
    }
  }));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
const {
  useState
} = React;
/**
 * Segmented control — gray track, white active pill with purple text.
 */
function SegmentedControl({
  options,
  value,
  onChange,
  style
}) {
  const [internal, setInternal] = useState(value ?? (options && options[0] && (options[0].value ?? options[0])));
  const current = value !== undefined ? value : internal;
  const items = (options || []).map(o => typeof o === 'string' ? {
    value: o,
    label: o
  } : o);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: 2,
      padding: 4,
      borderRadius: 8,
      background: 'var(--cv-neutral-100)',
      ...style
    }
  }, items.map(item => {
    const active = item.value === current;
    return /*#__PURE__*/React.createElement("button", {
      key: item.value,
      type: "button",
      onClick: () => {
        setInternal(item.value);
        if (onChange) onChange(item.value);
      },
      style: {
        height: 34,
        padding: '0 14px',
        borderRadius: 6,
        border: 'none',
        cursor: 'pointer',
        background: active ? '#ffffff' : 'transparent',
        color: active ? 'var(--cv-purple-600)' : 'var(--cv-neutral-600)',
        boxShadow: active ? 'var(--cv-shadow-segment-active)' : 'none',
        fontFamily: 'var(--cv-font-body)',
        fontSize: 13,
        fontWeight: 700,
        transition: 'all var(--cv-duration-fast) var(--cv-ease-standard)',
        whiteSpace: 'nowrap'
      }
    }, item.label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/icons/lucideIconData.js
try { (() => {
// Lucide v0.344.0 icon inner-SVG data (ISC license), copied from lucide-static.
// Rendered by Icon.jsx inside a 24x24 stroke-currentColor svg.
const LUCIDE_ICONS = {
  "briefcase": "<rect width=\"20\" height=\"14\" x=\"2\" y=\"7\" rx=\"2\" ry=\"2\" /> <path d=\"M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16\" />",
  "file-text": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" /> <path d=\"M14 2v4a2 2 0 0 0 2 2h4\" /> <path d=\"M10 9H8\" /> <path d=\"M16 13H8\" /> <path d=\"M16 17H8\" />",
  "mic": "<path d=\"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z\" /> <path d=\"M19 10v2a7 7 0 0 1-14 0v-2\" /> <line x1=\"12\" x2=\"12\" y1=\"19\" y2=\"22\" />",
  "search": "<circle cx=\"11\" cy=\"11\" r=\"8\" /> <path d=\"m21 21-4.3-4.3\" />",
  "sparkles": "<path d=\"m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z\" /> <path d=\"M5 3v4\" /> <path d=\"M19 17v4\" /> <path d=\"M3 5h4\" /> <path d=\"M17 19h4\" />",
  "wand-2": "<path d=\"m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z\" /> <path d=\"m14 7 3 3\" /> <path d=\"M5 6v4\" /> <path d=\"M19 14v4\" /> <path d=\"M10 2v2\" /> <path d=\"M7 8H3\" /> <path d=\"M21 16h-4\" /> <path d=\"M11 3H9\" />",
  "check-circle-2": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"m9 12 2 2 4-4\" />",
  "check-circle": "<path d=\"M22 11.08V12a10 10 0 1 1-5.93-9.14\" /> <path d=\"m9 11 3 3L22 4\" />",
  "alert-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"12\" /> <line x1=\"12\" x2=\"12.01\" y1=\"16\" y2=\"16\" />",
  "alert-triangle": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\" /> <path d=\"M12 9v4\" /> <path d=\"M12 17h.01\" />",
  "calendar-clock": "<path d=\"M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5\" /> <path d=\"M16 2v4\" /> <path d=\"M8 2v4\" /> <path d=\"M3 10h5\" /> <path d=\"M17.5 17.5 16 16.3V14\" /> <circle cx=\"16\" cy=\"16\" r=\"6\" />",
  "arrow-up-right": "<path d=\"M7 7h10v10\" /> <path d=\"M7 17 17 7\" />",
  "arrow-right": "<path d=\"M5 12h14\" /> <path d=\"m12 5 7 7-7 7\" />",
  "arrow-left": "<path d=\"m12 19-7-7 7-7\" /> <path d=\"M19 12H5\" />",
  "layout-dashboard": "<rect width=\"7\" height=\"9\" x=\"3\" y=\"3\" rx=\"1\" /> <rect width=\"7\" height=\"5\" x=\"14\" y=\"3\" rx=\"1\" /> <rect width=\"7\" height=\"9\" x=\"14\" y=\"12\" rx=\"1\" /> <rect width=\"7\" height=\"5\" x=\"3\" y=\"16\" rx=\"1\" />",
  "layout-grid": "<rect width=\"7\" height=\"7\" x=\"3\" y=\"3\" rx=\"1\" /> <rect width=\"7\" height=\"7\" x=\"14\" y=\"3\" rx=\"1\" /> <rect width=\"7\" height=\"7\" x=\"14\" y=\"14\" rx=\"1\" /> <rect width=\"7\" height=\"7\" x=\"3\" y=\"14\" rx=\"1\" />",
  "message-square-text": "<path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\" /> <path d=\"M13 8H7\" /> <path d=\"M17 12H7\" />",
  "chevron-left": "<path d=\"m15 18-6-6 6-6\" />",
  "chevron-right": "<path d=\"m9 18 6-6-6-6\" />",
  "chevron-down": "<path d=\"m6 9 6 6 6-6\" />",
  "x": "<path d=\"M18 6 6 18\" /> <path d=\"m6 6 12 12\" />",
  "x-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"m15 9-6 6\" /> <path d=\"m9 9 6 6\" />",
  "plus": "<path d=\"M5 12h14\" /> <path d=\"M12 5v14\" />",
  "minus": "<path d=\"M5 12h14\" />",
  "external-link": "<path d=\"M15 3h6v6\" /> <path d=\"M10 14 21 3\" /> <path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\" />",
  "clipboard-list": "<rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\" ry=\"1\" /> <path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\" /> <path d=\"M12 11h4\" /> <path d=\"M12 16h4\" /> <path d=\"M8 11h.01\" /> <path d=\"M8 16h.01\" />",
  "target": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <circle cx=\"12\" cy=\"12\" r=\"6\" /> <circle cx=\"12\" cy=\"12\" r=\"2\" />",
  "filter": "<polygon points=\"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3\" />",
  "user-round": "<circle cx=\"12\" cy=\"8\" r=\"5\" /> <path d=\"M20 21a8 8 0 0 0-16 0\" />",
  "map-pin": "<path d=\"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z\" /> <circle cx=\"12\" cy=\"10\" r=\"3\" />",
  "dollar-sign": "<line x1=\"12\" x2=\"12\" y1=\"2\" y2=\"22\" /> <path d=\"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6\" />",
  "settings": "<path d=\"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z\" /> <circle cx=\"12\" cy=\"12\" r=\"3\" />",
  "bell": "<path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" /> <path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" />",
  "trophy": "<path d=\"M6 9H4.5a2.5 2.5 0 0 1 0-5H6\" /> <path d=\"M18 9h1.5a2.5 2.5 0 0 0 0-5H18\" /> <path d=\"M4 22h16\" /> <path d=\"M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22\" /> <path d=\"M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22\" /> <path d=\"M18 2H6v7a6 6 0 0 0 12 0V2Z\" />",
  "send": "<path d=\"m22 2-7 20-4-9-9-4Z\" /> <path d=\"M22 2 11 13\" />",
  "clock-3": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <polyline points=\"12 6 12 12 16.5 12\" />",
  "moon": "<path d=\"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z\" />",
  "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\" /> <path d=\"M12 2v2\" /> <path d=\"M12 20v2\" /> <path d=\"m4.93 4.93 1.41 1.41\" /> <path d=\"m17.66 17.66 1.41 1.41\" /> <path d=\"M2 12h2\" /> <path d=\"M20 12h2\" /> <path d=\"m6.34 17.66-1.41 1.41\" /> <path d=\"m19.07 4.93-1.41 1.41\" />",
  "bot": "<path d=\"M12 8V4H8\" /> <rect width=\"16\" height=\"12\" x=\"4\" y=\"8\" rx=\"2\" /> <path d=\"M2 14h2\" /> <path d=\"M20 14h2\" /> <path d=\"M15 13v2\" /> <path d=\"M9 13v2\" />",
  "refresh-cw": "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\" /> <path d=\"M21 3v5h-5\" /> <path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\" /> <path d=\"M8 16H3v5\" />",
  "shield-check": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\" /> <path d=\"m9 12 2 2 4-4\" />",
  "book-open": "<path d=\"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z\" /> <path d=\"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z\" />",
  "presentation": "<path d=\"M2 3h20\" /> <path d=\"M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3\" /> <path d=\"m7 21 5-5 5 5\" />",
  "palette": "<circle cx=\"13.5\" cy=\"6.5\" r=\".5\" fill=\"currentColor\" /> <circle cx=\"17.5\" cy=\"10.5\" r=\".5\" fill=\"currentColor\" /> <circle cx=\"8.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\" /> <circle cx=\"6.5\" cy=\"12.5\" r=\".5\" fill=\"currentColor\" /> <path d=\"M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z\" />",
  "trash-2": "<path d=\"M3 6h18\" /> <path d=\"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6\" /> <path d=\"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2\" /> <line x1=\"10\" x2=\"10\" y1=\"11\" y2=\"17\" /> <line x1=\"14\" x2=\"14\" y1=\"11\" y2=\"17\" />",
  "download": "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /> <polyline points=\"7 10 12 15 17 10\" /> <line x1=\"12\" x2=\"12\" y1=\"15\" y2=\"3\" />",
  "share-2": "<circle cx=\"18\" cy=\"5\" r=\"3\" /> <circle cx=\"6\" cy=\"12\" r=\"3\" /> <circle cx=\"18\" cy=\"19\" r=\"3\" /> <line x1=\"8.59\" x2=\"15.42\" y1=\"13.51\" y2=\"17.49\" /> <line x1=\"15.41\" x2=\"8.59\" y1=\"6.51\" y2=\"10.49\" />",
  "link": "<path d=\"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\" /> <path d=\"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\" />",
  "eye": "<path d=\"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z\" /> <circle cx=\"12\" cy=\"12\" r=\"3\" />",
  "pen-line": "<path d=\"M12 20h9\" /> <path d=\"M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z\" />",
  "globe": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\" /> <path d=\"M2 12h20\" />",
  "loader-2": "<path d=\"M21 12a9 9 0 1 1-6.219-8.56\" />",
  "play": "<polygon points=\"5 3 19 12 5 21 5 3\" />",
  "square": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" />",
  "home": "<path d=\"m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\" /> <polyline points=\"9 22 9 12 15 12 15 22\" />",
  "kanban-square": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" /> <path d=\"M8 7v7\" /> <path d=\"M12 7v4\" /> <path d=\"M16 7v9\" />",
  "app-window": "<rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"2\" /> <path d=\"M10 4v4\" /> <path d=\"M2 8h20\" /> <path d=\"M6 4v4\" />",
  "more-horizontal": "<circle cx=\"12\" cy=\"12\" r=\"1\" /> <circle cx=\"19\" cy=\"12\" r=\"1\" /> <circle cx=\"5\" cy=\"12\" r=\"1\" />",
  "log-out": "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\" /> <polyline points=\"16 17 21 12 16 7\" /> <line x1=\"21\" x2=\"9\" y1=\"12\" y2=\"12\" />",
  "circle-user-round": "<path d=\"M18 20a6 6 0 0 0-12 0\" /> <circle cx=\"12\" cy=\"10\" r=\"4\" /> <circle cx=\"12\" cy=\"12\" r=\"10\" />",
  "graduation-cap": "<path d=\"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z\" /> <path d=\"M22 10v6\" /> <path d=\"M6 12.5V16a6 3 0 0 0 12 0v-3.5\" />",
  "building-2": "<path d=\"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z\" /> <path d=\"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2\" /> <path d=\"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2\" /> <path d=\"M10 6h4\" /> <path d=\"M10 10h4\" /> <path d=\"M10 14h4\" /> <path d=\"M10 18h4\" />",
  "zap": "<polygon points=\"13 2 3 14 12 14 11 22 21 10 12 10 13 2\" />",
  "star": "<polygon points=\"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2\" />",
  "menu": "<line x1=\"4\" x2=\"20\" y1=\"12\" y2=\"12\" /> <line x1=\"4\" x2=\"20\" y1=\"6\" y2=\"6\" /> <line x1=\"4\" x2=\"20\" y1=\"18\" y2=\"18\" />",
  "check": "<path d=\"M20 6 9 17l-5-5\" />",
  "swords": "<polyline points=\"14.5 17.5 3 6 3 3 6 3 17.5 14.5\" /> <line x1=\"13\" x2=\"19\" y1=\"19\" y2=\"13\" /> <line x1=\"16\" x2=\"20\" y1=\"16\" y2=\"20\" /> <line x1=\"19\" x2=\"21\" y1=\"21\" y2=\"19\" /> <polyline points=\"14.5 6.5 18 3 21 3 21 6 17.5 9.5\" /> <line x1=\"5\" x2=\"9\" y1=\"14\" y2=\"18\" /> <line x1=\"7\" x2=\"4\" y1=\"17\" y2=\"20\" /> <line x1=\"3\" x2=\"5\" y1=\"19\" y2=\"21\" />",
  "lock": "<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\" /> <path d=\"M7 11V7a5 5 0 0 1 10 0v4\" />",
  "flame": "<path d=\"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z\" />",
  "bar-chart-3": "<path d=\"M3 3v18h18\" /> <path d=\"M18 17V9\" /> <path d=\"M13 17V5\" /> <path d=\"M8 17v-3\" />",
  "rotate-ccw": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\" /> <path d=\"M3 3v5h5\" />",
  "pen-tool": "<path d=\"m12 19 7-7 3 3-7 7-3-3z\" /> <path d=\"m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z\" /> <path d=\"m2 2 7.586 7.586\" /> <circle cx=\"11\" cy=\"11\" r=\"2\" />",
  "list-checks": "<path d=\"m3 17 2 2 4-4\" /> <path d=\"m3 7 2 2 4-4\" /> <path d=\"M13 6h8\" /> <path d=\"M13 12h8\" /> <path d=\"M13 18h8\" />",
  "sliders-horizontal": "<line x1=\"21\" x2=\"14\" y1=\"4\" y2=\"4\" /> <line x1=\"10\" x2=\"3\" y1=\"4\" y2=\"4\" /> <line x1=\"21\" x2=\"12\" y1=\"12\" y2=\"12\" /> <line x1=\"8\" x2=\"3\" y1=\"12\" y2=\"12\" /> <line x1=\"21\" x2=\"16\" y1=\"20\" y2=\"20\" /> <line x1=\"12\" x2=\"3\" y1=\"20\" y2=\"20\" /> <line x1=\"14\" x2=\"14\" y1=\"2\" y2=\"6\" /> <line x1=\"8\" x2=\"8\" y1=\"10\" y2=\"14\" /> <line x1=\"16\" x2=\"16\" y1=\"18\" y2=\"22\" />",
  "circle": "<circle cx=\"12\" cy=\"12\" r=\"10\" />",
  "diamond": "<path d=\"M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z\" />",
  "type": "<polyline points=\"4 7 4 4 20 4 20 7\" /> <line x1=\"9\" x2=\"15\" y1=\"20\" y2=\"20\" /> <line x1=\"12\" x2=\"12\" y1=\"4\" y2=\"20\" />",
  "hand": "<path d=\"M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0\" /> <path d=\"M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2\" /> <path d=\"M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8\" /> <path d=\"M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15\" />",
  "eraser": "<path d=\"m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21\" /> <path d=\"M22 21H7\" /> <path d=\"m5 11 9 9\" />",
  "mouse-pointer": "<path d=\"m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z\" /> <path d=\"m13 13 6 6\" />",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <polyline points=\"12 6 12 12 16 14\" />"
};
Object.assign(__ds_scope, { LUCIDE_ICONS });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/lucideIconData.js", error: String((e && e.message) || e) }); }

// components/icons/Icon.jsx
try { (() => {
/**
 * Lucide icon (v0.344.0 — the app's icon system via lucide-react).
 * Renders stroke-currentColor at the given size (default 16).
 */
function Icon({
  name,
  size = 16,
  strokeWidth = 2,
  className,
  style
}) {
  const inner = __ds_scope.LUCIDE_ICONS[name];
  if (!inner) return null;
  return /*#__PURE__*/React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: className,
    style: style,
    "aria-hidden": "true",
    dangerouslySetInnerHTML: {
      __html: inner
    }
  });
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Icon.jsx", error: String((e && e.message) || e) }); }

// components/display/JobCard.jsx
try { (() => {
const {
  useState
} = React;
/**
 * Compact job pipeline card (Career Pipeline Kanban row).
 * Faithful to src/components/JobTracker/KanbanBoard.tsx CompactJobRow.
 */
function JobCard({
  title,
  company,
  priority = 'Medium',
  matchScore,
  prepDone = 0,
  prepTotal = 5,
  dueDate,
  hasUrl = true,
  noDescription = false,
  onClick,
  style
}) {
  const [hover, setHover] = useState(false);
  const priorityStyles = {
    High: {
      background: 'var(--cv-danger-50)',
      color: 'var(--cv-danger-700)'
    },
    Medium: {
      background: 'var(--cv-warning-50)',
      color: 'var(--cv-warning-700)'
    },
    Low: {
      background: 'var(--cv-neutral-100)',
      color: 'var(--cv-neutral-600)'
    }
  };
  const p = priorityStyles[priority] || priorityStyles.Medium;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      borderRadius: 6,
      border: `1px solid ${hover ? 'var(--cv-purple-300)' : 'var(--cv-border-product)'}`,
      background: hover ? 'rgba(243, 242, 255, 0.4)' : '#ffffff',
      padding: '8px 10px',
      boxShadow: 'var(--cv-shadow-card)',
      transition: 'all var(--cv-duration-fast) var(--cv-ease-standard)',
      cursor: 'pointer',
      fontFamily: 'var(--cv-font-body)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 28,
      flexShrink: 0,
      borderRadius: 6,
      background: 'var(--cv-neutral-100)',
      color: 'var(--cv-neutral-500)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "briefcase",
    size: 15
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      fontSize: 13,
      fontWeight: 700,
      lineHeight: '20px',
      color: 'var(--cv-neutral-950)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, title || 'Untitled Job'), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--cv-neutral-500)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, company || 'Unknown company')), hasUrl ? /*#__PURE__*/React.createElement("span", {
    style: {
      padding: 4,
      borderRadius: 4,
      color: 'var(--cv-neutral-400)',
      opacity: hover ? 1 : 0.7,
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-up-right",
    size: 13
  })) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      columnGap: 8,
      rowGap: 4,
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--cv-neutral-500)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      borderRadius: 4,
      padding: '2px 6px',
      ...p
    }
  }, priority), noDescription ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      borderRadius: 4,
      padding: '2px 6px',
      background: 'var(--cv-warning-50)',
      color: 'var(--cv-warning-700)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "alert-circle",
    size: 11
  }), "No description") : null, matchScore != null ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      color: 'var(--cv-blue-600)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check-circle-2",
    size: 11
  }), matchScore, "%") : null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "calendar-clock",
    size: 11
  }), "Prep ", prepDone, "/", prepTotal), dueDate ? /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      color: 'var(--cv-neutral-700)'
    }
  }, dueDate) : null))));
}
Object.assign(__ds_scope, { JobCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/JobCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Modal.jsx
try { (() => {
/**
 * Modal dialog: 20px radius, big 800 heading, deep soft shadow, gray-navy backdrop.
 * Render inline (position:absolute wrapper) or fixed depending on context.
 */
function Modal({
  title,
  children,
  onClose,
  actions,
  width = 440,
  fixed = true,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: fixed ? 'fixed' : 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(17, 24, 39, 0.45)',
      zIndex: 50,
      padding: 24
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      maxWidth: width,
      background: 'var(--cv-surface)',
      border: '1px solid var(--cv-border-product)',
      borderRadius: 20,
      boxShadow: 'var(--cv-shadow-modal)',
      padding: 24,
      fontFamily: 'var(--cv-font-body)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--cv-font-heading)',
      fontSize: 20,
      fontWeight: 800,
      color: 'var(--cv-text-heading-product)'
    }
  }, title), onClose ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    "aria-label": "Close",
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 28,
      borderRadius: 8,
      border: 'none',
      background: 'transparent',
      color: 'var(--cv-neutral-400)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 16
  })) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      fontSize: 13,
      fontWeight: 500,
      lineHeight: 1.6,
      color: 'var(--cv-text-body-product)'
    }
  }, children), actions ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8
    }
  }, actions) : null));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Modal.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
const {
  useState
} = React;
const buttonVariants = {
  primary: {
    base: {
      background: 'var(--cv-action-primary)',
      color: '#ffffff',
      border: '1px solid transparent'
    },
    hover: {
      background: 'var(--cv-action-primary-hover)'
    }
  },
  soft: {
    base: {
      background: 'var(--cv-action-soft-bg)',
      color: 'var(--cv-action-soft-text)',
      border: '1px solid var(--cv-action-soft-border)'
    },
    hover: {
      background: 'var(--cv-action-soft-hover)'
    }
  },
  neutral: {
    base: {
      background: 'var(--cv-surface)',
      color: 'var(--cv-neutral-700)',
      border: '1px solid var(--cv-border-product)'
    },
    hover: {
      background: 'var(--cv-neutral-50)'
    }
  },
  danger: {
    base: {
      background: 'var(--cv-danger-50)',
      color: 'var(--cv-danger-700)',
      border: '1px solid var(--cv-danger-200)'
    },
    hover: {
      background: 'var(--cv-danger-100)'
    }
  }
};
const buttonSizes = {
  sm: {
    height: 32,
    padding: '0 12px',
    fontSize: 12,
    borderRadius: 8,
    gap: 6,
    iconSize: 15
  },
  md: {
    height: 36,
    padding: '0 14px',
    fontSize: 13,
    borderRadius: 8,
    gap: 6,
    iconSize: 16
  },
  lg: {
    height: 44,
    padding: '0 18px',
    fontSize: 14,
    borderRadius: 12,
    gap: 8,
    iconSize: 18
  }
};

/**
 * CareerVivid button. Labels are short verb phrases in sentence case
 * ("Save to tracker", "Tailor resume"). Purple is for primary actions only.
 */
function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  disabled,
  fullWidth,
  onClick,
  style,
  type = 'button'
}) {
  const [hover, setHover] = useState(false);
  const v = buttonVariants[variant] || buttonVariants.primary;
  const s = buttonSizes[size] || buttonSizes.md;
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      borderRadius: s.borderRadius,
      fontFamily: 'var(--cv-font-body)',
      fontSize: s.fontSize,
      fontWeight: 700,
      lineHeight: 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      width: fullWidth ? '100%' : undefined,
      transition: 'background var(--cv-duration-fast) var(--cv-ease-standard), border-color var(--cv-duration-fast) var(--cv-ease-standard)',
      whiteSpace: 'nowrap',
      ...v.base,
      ...(hover && !disabled ? v.hover : null),
      ...style
    }
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.iconSize
  }) : null, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/display/CompanyGuideCard.jsx
try { (() => {
const {
  useState
} = React;
const guideAvatarTones = [{
  background: '#f3f2ff',
  color: '#625bd5',
  ring: '#dfdcff'
}, {
  background: '#eef0ff',
  color: '#7069dc',
  ring: '#dfe2ff'
}, {
  background: '#f7f1ff',
  color: '#7c5fd6',
  ring: '#eadfff'
}, {
  background: '#f5f7ff',
  color: '#5c62d6',
  ring: '#e0e5ff'
}];
const guideScoreTones = {
  high: {
    background: '#fff1f2',
    color: '#be123c',
    ring: '#fecdd3'
  },
  medium: {
    background: '#fffbeb',
    color: '#b45309',
    ring: '#fde68a'
  },
  low: {
    background: '#eef9f2',
    color: '#15803d',
    ring: '#cfe8d5'
  }
};

/**
 * Company interview guide card (Interview Studio).
 */
function CompanyGuideCard({
  company,
  role,
  difficulty = 'medium',
  difficultyLabel,
  topics = [],
  toneIndex = 0,
  actionLabel = 'Practice',
  onAction,
  style
}) {
  const [hover, setHover] = useState(false);
  const avatar = guideAvatarTones[toneIndex % guideAvatarTones.length];
  const score = guideScoreTones[difficulty] || guideScoreTones.medium;
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: hover ? 'var(--cv-purple-25)' : '#ffffff',
      border: `1px solid ${hover ? 'var(--cv-purple-200)' : 'var(--cv-border-product)'}`,
      borderRadius: 12,
      padding: 16,
      boxShadow: hover ? 'var(--cv-shadow-card-hover)' : 'var(--cv-shadow-card)',
      transform: hover ? 'translateY(-2px)' : 'none',
      transition: 'all var(--cv-duration-normal) var(--cv-ease-standard)',
      fontFamily: 'var(--cv-font-body)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      flexShrink: 0,
      borderRadius: 8,
      background: avatar.background,
      color: avatar.color,
      boxShadow: `0 0 0 1px ${avatar.ring}`,
      fontSize: 15,
      fontWeight: 800,
      fontFamily: 'var(--cv-font-heading)'
    }
  }, (company || '?').slice(0, 1)), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--cv-neutral-950)'
    }
  }, company), /*#__PURE__*/React.createElement("span", {
    style: {
      borderRadius: 999,
      padding: '2px 8px',
      fontSize: 10,
      fontWeight: 700,
      background: score.background,
      color: score.color,
      boxShadow: `0 0 0 1px ${score.ring}`,
      whiteSpace: 'nowrap'
    }
  }, difficultyLabel || `${difficulty[0].toUpperCase()}${difficulty.slice(1)} difficulty`)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--cv-neutral-500)'
    }
  }, role))), topics.length > 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, topics.map(topic => /*#__PURE__*/React.createElement("span", {
    key: topic,
    style: {
      borderRadius: 999,
      padding: '3px 10px',
      fontSize: 11,
      fontWeight: 700,
      background: 'var(--cv-neutral-100)',
      color: 'var(--cv-neutral-600)'
    }
  }, topic))) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "soft",
    size: "sm",
    icon: "mic",
    onClick: onAction,
    style: {
      flex: 1
    }
  }, actionLabel), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 32,
      borderRadius: 8,
      border: '1px solid var(--cv-border-product)',
      background: '#ffffff',
      color: hover ? 'var(--cv-purple-600)' : 'var(--cv-neutral-400)',
      transition: 'color var(--cv-duration-fast) var(--cv-ease-standard)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "external-link",
    size: 14
  }))));
}
Object.assign(__ds_scope, { CompanyGuideCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/CompanyGuideCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchInput.jsx
try { (() => {
const {
  useState
} = React;
/**
 * Large rounded search bar (Interview Studio company-guide search).
 * 46–52px tall, 16px radius, translucent gray resting → white focused.
 */
function SearchInput({
  placeholder = 'Search',
  value,
  onChange,
  height = 48,
  style
}) {
  const [focus, setFocus] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height,
      padding: '0 16px',
      borderRadius: 16,
      background: focus ? '#ffffff' : 'rgba(249, 250, 251, 0.8)',
      border: focus ? '1px solid var(--cv-neutral-400)' : '1px solid var(--cv-border-product)',
      boxShadow: focus ? 'var(--cv-shadow-input-focus)' : 'none',
      transition: 'all var(--cv-duration-normal) var(--cv-ease-standard)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      color: focus ? 'var(--cv-neutral-700)' : 'var(--cv-neutral-400)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 17
  })), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: placeholder,
    value: value,
    onChange: onChange ? e => onChange(e.target.value) : undefined,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--cv-font-body)',
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--cv-neutral-900)'
    }
  }));
}
Object.assign(__ds_scope, { SearchInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchInput.jsx", error: String((e && e.message) || e) }); }

// components/icons/IconWell.jsx
try { (() => {
const iconWellTones = {
  purple: {
    background: 'var(--cv-purple-50)',
    color: 'var(--cv-purple-600)'
  },
  softPurple: {
    background: 'var(--cv-purple-75)',
    color: 'var(--cv-purple-500)'
  },
  amber: {
    background: 'var(--cv-amber-50)',
    color: '#9a651f'
  },
  green: {
    background: 'var(--cv-success-50)',
    color: 'var(--cv-success-600)'
  },
  rose: {
    background: '#fff6f6',
    color: '#b64a5a'
  },
  blue: {
    background: 'var(--cv-blue-50)',
    color: 'var(--cv-blue-600)'
  },
  neutral: {
    background: 'var(--cv-neutral-100)',
    color: 'var(--cv-neutral-500)'
  }
};

/**
 * Tinted icon well — CareerVivid's standard icon treatment.
 * 28–40px square, 8–12px radius, tinted background with matching icon color.
 */
function IconWell({
  icon,
  tone = 'purple',
  size = 32,
  iconSize,
  style
}) {
  const t = iconWellTones[tone] || iconWellTones.purple;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: size >= 36 ? 12 : 8,
      background: t.background,
      color: t.color,
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: iconSize || Math.round(size * 0.5)
  }));
}
Object.assign(__ds_scope, { IconWell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/IconWell.jsx", error: String((e && e.message) || e) }); }

// components/display/StatCard.jsx
try { (() => {
/**
 * Dashboard stat card: tiny bold muted title, 24–32px/800 number, tinted icon well.
 */
function StatCard({
  label,
  value,
  icon = 'layout-dashboard',
  tone = 'purple',
  delta,
  style
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, {
    radius: 16,
    padding: 16,
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 11,
      fontWeight: 700,
      color: '#64748b'
    }
  }, label), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '6px 0 0',
      fontFamily: 'var(--cv-font-heading)',
      fontSize: 28,
      fontWeight: 800,
      lineHeight: 1.1,
      color: 'var(--cv-text-heading-product)'
    }
  }, value), delta ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--cv-text-muted)'
    }
  }, delta) : null), /*#__PURE__*/React.createElement(__ds_scope.IconWell, {
    icon: icon,
    tone: tone,
    size: 36
  })));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Sidebar.jsx
try { (() => {
const {
  useState
} = React;
function SidebarItem({
  item,
  active,
  onClick
}) {
  const [hover, setHover] = useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      height: 36,
      padding: '0 10px',
      borderRadius: 8,
      border: active ? '1px solid var(--cv-action-soft-border)' : '1px solid transparent',
      background: active ? 'var(--cv-action-soft-bg)' : 'transparent',
      color: active ? 'var(--cv-action-soft-text)' : hover ? 'var(--cv-neutral-900)' : '#64748b',
      cursor: 'pointer',
      fontFamily: 'var(--cv-font-body)',
      fontSize: 13,
      fontWeight: 600,
      textAlign: 'left',
      transition: 'all var(--cv-duration-fast) var(--cv-ease-standard)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: item.icon || 'layout-dashboard',
    size: 16
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, item.label), item.badge ? /*#__PURE__*/React.createElement("span", {
    style: {
      borderRadius: 999,
      padding: '1px 7px',
      fontSize: 10,
      fontWeight: 700,
      background: 'var(--cv-purple-50)',
      color: 'var(--cv-purple-600)'
    }
  }, item.badge) : null);
}

/**
 * App workspace sidebar: white, subtle border, soft-purple active item, credit meter.
 */
function Sidebar({
  items = [],
  activeId,
  onSelect,
  credits,
  width = 232,
  footer,
  style
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      width,
      flexShrink: 0,
      padding: 12,
      background: 'var(--cv-surface)',
      borderRight: '1px solid var(--cv-border-subtle)',
      fontFamily: 'var(--cv-font-body)',
      boxSizing: 'border-box',
      ...style
    }
  }, items.map(item => item.section ? /*#__PURE__*/React.createElement("p", {
    key: item.section,
    style: {
      margin: '14px 4px 6px',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--cv-neutral-400)'
    }
  }, item.section) : /*#__PURE__*/React.createElement(SidebarItem, {
    key: item.id,
    item: item,
    active: item.id === activeId,
    onClick: () => onSelect && onSelect(item.id)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), credits ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 10,
      borderRadius: 10,
      border: '1px solid var(--cv-border-product)',
      background: 'var(--cv-surface-muted)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--cv-neutral-900)'
    }
  }, credits.label || 'AI credits'), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--cv-neutral-500)'
    }
  }, credits.used, "/", credits.total)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      height: 6,
      borderRadius: 999,
      background: 'var(--cv-neutral-200)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      borderRadius: 999,
      background: 'var(--cv-purple-600)',
      width: `${Math.min(100, credits.used / credits.total * 100)}%`
    }
  }))) : null, footer);
}
Object.assign(__ds_scope, { Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Sidebar.jsx", error: String((e && e.message) || e) }); }

// redesigns/lucide-icons.js
try { (() => {
// Lucide v0.344.0 (ISC). window global for standalone mockups.
window.CV_LUCIDE = {
  "briefcase": "<rect width=\"20\" height=\"14\" x=\"2\" y=\"7\" rx=\"2\" ry=\"2\" /> <path d=\"M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16\" />",
  "file-text": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" /> <path d=\"M14 2v4a2 2 0 0 0 2 2h4\" /> <path d=\"M10 9H8\" /> <path d=\"M16 13H8\" /> <path d=\"M16 17H8\" />",
  "mic": "<path d=\"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z\" /> <path d=\"M19 10v2a7 7 0 0 1-14 0v-2\" /> <line x1=\"12\" x2=\"12\" y1=\"19\" y2=\"22\" />",
  "search": "<circle cx=\"11\" cy=\"11\" r=\"8\" /> <path d=\"m21 21-4.3-4.3\" />",
  "sparkles": "<path d=\"m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z\" /> <path d=\"M5 3v4\" /> <path d=\"M19 17v4\" /> <path d=\"M3 5h4\" /> <path d=\"M17 19h4\" />",
  "wand-2": "<path d=\"m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z\" /> <path d=\"m14 7 3 3\" /> <path d=\"M5 6v4\" /> <path d=\"M19 14v4\" /> <path d=\"M10 2v2\" /> <path d=\"M7 8H3\" /> <path d=\"M21 16h-4\" /> <path d=\"M11 3H9\" />",
  "check-circle-2": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"m9 12 2 2 4-4\" />",
  "check-circle": "<path d=\"M22 11.08V12a10 10 0 1 1-5.93-9.14\" /> <path d=\"m9 11 3 3L22 4\" />",
  "alert-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"12\" /> <line x1=\"12\" x2=\"12.01\" y1=\"16\" y2=\"16\" />",
  "alert-triangle": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\" /> <path d=\"M12 9v4\" /> <path d=\"M12 17h.01\" />",
  "calendar-clock": "<path d=\"M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5\" /> <path d=\"M16 2v4\" /> <path d=\"M8 2v4\" /> <path d=\"M3 10h5\" /> <path d=\"M17.5 17.5 16 16.3V14\" /> <circle cx=\"16\" cy=\"16\" r=\"6\" />",
  "arrow-up-right": "<path d=\"M7 7h10v10\" /> <path d=\"M7 17 17 7\" />",
  "arrow-right": "<path d=\"M5 12h14\" /> <path d=\"m12 5 7 7-7 7\" />",
  "arrow-left": "<path d=\"m12 19-7-7 7-7\" /> <path d=\"M19 12H5\" />",
  "layout-dashboard": "<rect width=\"7\" height=\"9\" x=\"3\" y=\"3\" rx=\"1\" /> <rect width=\"7\" height=\"5\" x=\"14\" y=\"3\" rx=\"1\" /> <rect width=\"7\" height=\"9\" x=\"14\" y=\"12\" rx=\"1\" /> <rect width=\"7\" height=\"5\" x=\"3\" y=\"16\" rx=\"1\" />",
  "layout-grid": "<rect width=\"7\" height=\"7\" x=\"3\" y=\"3\" rx=\"1\" /> <rect width=\"7\" height=\"7\" x=\"14\" y=\"3\" rx=\"1\" /> <rect width=\"7\" height=\"7\" x=\"14\" y=\"14\" rx=\"1\" /> <rect width=\"7\" height=\"7\" x=\"3\" y=\"14\" rx=\"1\" />",
  "message-square-text": "<path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\" /> <path d=\"M13 8H7\" /> <path d=\"M17 12H7\" />",
  "chevron-left": "<path d=\"m15 18-6-6 6-6\" />",
  "chevron-right": "<path d=\"m9 18 6-6-6-6\" />",
  "chevron-down": "<path d=\"m6 9 6 6 6-6\" />",
  "x": "<path d=\"M18 6 6 18\" /> <path d=\"m6 6 12 12\" />",
  "x-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"m15 9-6 6\" /> <path d=\"m9 9 6 6\" />",
  "plus": "<path d=\"M5 12h14\" /> <path d=\"M12 5v14\" />",
  "minus": "<path d=\"M5 12h14\" />",
  "external-link": "<path d=\"M15 3h6v6\" /> <path d=\"M10 14 21 3\" /> <path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\" />",
  "clipboard-list": "<rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\" ry=\"1\" /> <path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\" /> <path d=\"M12 11h4\" /> <path d=\"M12 16h4\" /> <path d=\"M8 11h.01\" /> <path d=\"M8 16h.01\" />",
  "target": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <circle cx=\"12\" cy=\"12\" r=\"6\" /> <circle cx=\"12\" cy=\"12\" r=\"2\" />",
  "filter": "<polygon points=\"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3\" />",
  "user-round": "<circle cx=\"12\" cy=\"8\" r=\"5\" /> <path d=\"M20 21a8 8 0 0 0-16 0\" />",
  "map-pin": "<path d=\"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z\" /> <circle cx=\"12\" cy=\"10\" r=\"3\" />",
  "dollar-sign": "<line x1=\"12\" x2=\"12\" y1=\"2\" y2=\"22\" /> <path d=\"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6\" />",
  "settings": "<path d=\"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z\" /> <circle cx=\"12\" cy=\"12\" r=\"3\" />",
  "bell": "<path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" /> <path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" />",
  "trophy": "<path d=\"M6 9H4.5a2.5 2.5 0 0 1 0-5H6\" /> <path d=\"M18 9h1.5a2.5 2.5 0 0 0 0-5H18\" /> <path d=\"M4 22h16\" /> <path d=\"M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22\" /> <path d=\"M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22\" /> <path d=\"M18 2H6v7a6 6 0 0 0 12 0V2Z\" />",
  "send": "<path d=\"m22 2-7 20-4-9-9-4Z\" /> <path d=\"M22 2 11 13\" />",
  "clock-3": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <polyline points=\"12 6 12 12 16.5 12\" />",
  "moon": "<path d=\"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z\" />",
  "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\" /> <path d=\"M12 2v2\" /> <path d=\"M12 20v2\" /> <path d=\"m4.93 4.93 1.41 1.41\" /> <path d=\"m17.66 17.66 1.41 1.41\" /> <path d=\"M2 12h2\" /> <path d=\"M20 12h2\" /> <path d=\"m6.34 17.66-1.41 1.41\" /> <path d=\"m19.07 4.93-1.41 1.41\" />",
  "bot": "<path d=\"M12 8V4H8\" /> <rect width=\"16\" height=\"12\" x=\"4\" y=\"8\" rx=\"2\" /> <path d=\"M2 14h2\" /> <path d=\"M20 14h2\" /> <path d=\"M15 13v2\" /> <path d=\"M9 13v2\" />",
  "refresh-cw": "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\" /> <path d=\"M21 3v5h-5\" /> <path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\" /> <path d=\"M8 16H3v5\" />",
  "shield-check": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\" /> <path d=\"m9 12 2 2 4-4\" />",
  "book-open": "<path d=\"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z\" /> <path d=\"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z\" />",
  "presentation": "<path d=\"M2 3h20\" /> <path d=\"M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3\" /> <path d=\"m7 21 5-5 5 5\" />",
  "palette": "<circle cx=\"13.5\" cy=\"6.5\" r=\".5\" fill=\"currentColor\" /> <circle cx=\"17.5\" cy=\"10.5\" r=\".5\" fill=\"currentColor\" /> <circle cx=\"8.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\" /> <circle cx=\"6.5\" cy=\"12.5\" r=\".5\" fill=\"currentColor\" /> <path d=\"M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z\" />",
  "trash-2": "<path d=\"M3 6h18\" /> <path d=\"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6\" /> <path d=\"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2\" /> <line x1=\"10\" x2=\"10\" y1=\"11\" y2=\"17\" /> <line x1=\"14\" x2=\"14\" y1=\"11\" y2=\"17\" />",
  "download": "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /> <polyline points=\"7 10 12 15 17 10\" /> <line x1=\"12\" x2=\"12\" y1=\"15\" y2=\"3\" />",
  "share-2": "<circle cx=\"18\" cy=\"5\" r=\"3\" /> <circle cx=\"6\" cy=\"12\" r=\"3\" /> <circle cx=\"18\" cy=\"19\" r=\"3\" /> <line x1=\"8.59\" x2=\"15.42\" y1=\"13.51\" y2=\"17.49\" /> <line x1=\"15.41\" x2=\"8.59\" y1=\"6.51\" y2=\"10.49\" />",
  "link": "<path d=\"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\" /> <path d=\"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\" />",
  "eye": "<path d=\"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z\" /> <circle cx=\"12\" cy=\"12\" r=\"3\" />",
  "pen-line": "<path d=\"M12 20h9\" /> <path d=\"M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z\" />",
  "globe": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\" /> <path d=\"M2 12h20\" />",
  "loader-2": "<path d=\"M21 12a9 9 0 1 1-6.219-8.56\" />",
  "play": "<polygon points=\"5 3 19 12 5 21 5 3\" />",
  "square": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" />",
  "home": "<path d=\"m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\" /> <polyline points=\"9 22 9 12 15 12 15 22\" />",
  "kanban-square": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" /> <path d=\"M8 7v7\" /> <path d=\"M12 7v4\" /> <path d=\"M16 7v9\" />",
  "app-window": "<rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"2\" /> <path d=\"M10 4v4\" /> <path d=\"M2 8h20\" /> <path d=\"M6 4v4\" />",
  "more-horizontal": "<circle cx=\"12\" cy=\"12\" r=\"1\" /> <circle cx=\"19\" cy=\"12\" r=\"1\" /> <circle cx=\"5\" cy=\"12\" r=\"1\" />",
  "log-out": "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\" /> <polyline points=\"16 17 21 12 16 7\" /> <line x1=\"21\" x2=\"9\" y1=\"12\" y2=\"12\" />",
  "circle-user-round": "<path d=\"M18 20a6 6 0 0 0-12 0\" /> <circle cx=\"12\" cy=\"10\" r=\"4\" /> <circle cx=\"12\" cy=\"12\" r=\"10\" />",
  "graduation-cap": "<path d=\"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z\" /> <path d=\"M22 10v6\" /> <path d=\"M6 12.5V16a6 3 0 0 0 12 0v-3.5\" />",
  "building-2": "<path d=\"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z\" /> <path d=\"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2\" /> <path d=\"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2\" /> <path d=\"M10 6h4\" /> <path d=\"M10 10h4\" /> <path d=\"M10 14h4\" /> <path d=\"M10 18h4\" />",
  "zap": "<polygon points=\"13 2 3 14 12 14 11 22 21 10 12 10 13 2\" />",
  "star": "<polygon points=\"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2\" />",
  "menu": "<line x1=\"4\" x2=\"20\" y1=\"12\" y2=\"12\" /> <line x1=\"4\" x2=\"20\" y1=\"6\" y2=\"6\" /> <line x1=\"4\" x2=\"20\" y1=\"18\" y2=\"18\" />",
  "check": "<path d=\"M20 6 9 17l-5-5\" />",
  "swords": "<polyline points=\"14.5 17.5 3 6 3 3 6 3 17.5 14.5\" /> <line x1=\"13\" x2=\"19\" y1=\"19\" y2=\"13\" /> <line x1=\"16\" x2=\"20\" y1=\"16\" y2=\"20\" /> <line x1=\"19\" x2=\"21\" y1=\"21\" y2=\"19\" /> <polyline points=\"14.5 6.5 18 3 21 3 21 6 17.5 9.5\" /> <line x1=\"5\" x2=\"9\" y1=\"14\" y2=\"18\" /> <line x1=\"7\" x2=\"4\" y1=\"17\" y2=\"20\" /> <line x1=\"3\" x2=\"5\" y1=\"19\" y2=\"21\" />",
  "lock": "<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\" /> <path d=\"M7 11V7a5 5 0 0 1 10 0v4\" />",
  "flame": "<path d=\"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z\" />",
  "bar-chart-3": "<path d=\"M3 3v18h18\" /> <path d=\"M18 17V9\" /> <path d=\"M13 17V5\" /> <path d=\"M8 17v-3\" />",
  "rotate-ccw": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\" /> <path d=\"M3 3v5h5\" />",
  "pen-tool": "<path d=\"m12 19 7-7 3 3-7 7-3-3z\" /> <path d=\"m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z\" /> <path d=\"m2 2 7.586 7.586\" /> <circle cx=\"11\" cy=\"11\" r=\"2\" />",
  "list-checks": "<path d=\"m3 17 2 2 4-4\" /> <path d=\"m3 7 2 2 4-4\" /> <path d=\"M13 6h8\" /> <path d=\"M13 12h8\" /> <path d=\"M13 18h8\" />",
  "sliders-horizontal": "<line x1=\"21\" x2=\"14\" y1=\"4\" y2=\"4\" /> <line x1=\"10\" x2=\"3\" y1=\"4\" y2=\"4\" /> <line x1=\"21\" x2=\"12\" y1=\"12\" y2=\"12\" /> <line x1=\"8\" x2=\"3\" y1=\"12\" y2=\"12\" /> <line x1=\"21\" x2=\"16\" y1=\"20\" y2=\"20\" /> <line x1=\"12\" x2=\"3\" y1=\"20\" y2=\"20\" /> <line x1=\"14\" x2=\"14\" y1=\"2\" y2=\"6\" /> <line x1=\"8\" x2=\"8\" y1=\"10\" y2=\"14\" /> <line x1=\"16\" x2=\"16\" y1=\"18\" y2=\"22\" />",
  "circle": "<circle cx=\"12\" cy=\"12\" r=\"10\" />",
  "diamond": "<path d=\"M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z\" />",
  "type": "<polyline points=\"4 7 4 4 20 4 20 7\" /> <line x1=\"9\" x2=\"15\" y1=\"20\" y2=\"20\" /> <line x1=\"12\" x2=\"12\" y1=\"4\" y2=\"20\" />",
  "hand": "<path d=\"M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0\" /> <path d=\"M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2\" /> <path d=\"M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8\" /> <path d=\"M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15\" />",
  "eraser": "<path d=\"m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21\" /> <path d=\"M22 21H7\" /> <path d=\"m5 11 9 9\" />",
  "mouse-pointer": "<path d=\"m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z\" /> <path d=\"m13 13 6 6\" />",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <polyline points=\"12 6 12 12 16 14\" />"
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "redesigns/lucide-icons.js", error: String((e && e.message) || e) }); }

// ui_kits/app/workspace.jsx
try { (() => {
const P = '#625bd5',
  PH = '#514ac5',
  PSOFT = '#eef0ff',
  PRING = '#dfe2ff',
  PTINT = '#f3f2ff';
const wsFont = 'var(--cv-font-body)';
function Ic({
  name,
  size = 16,
  sw = 2,
  style
}) {
  return /*#__PURE__*/React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: style,
    dangerouslySetInnerHTML: {
      __html: window.CV_LUCIDE[name] || ''
    }
  });
}

/* ---------- Sidebar ---------- */
function NavItem({
  item,
  active,
  onClick
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      height: 36,
      padding: '0 10px',
      borderRadius: 8,
      border: `1px solid ${active ? PRING : 'transparent'}`,
      background: active ? PSOFT : 'transparent',
      color: active ? P : h ? 'var(--cv-neutral-900)' : '#64748b',
      cursor: 'pointer',
      fontFamily: wsFont,
      fontSize: 13,
      fontWeight: 600,
      textAlign: 'left',
      transition: 'all 120ms cubic-bezier(0.2,0,0,1)',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: item.icon,
    size: 16
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, item.label), item.badge ? /*#__PURE__*/React.createElement("span", {
    style: {
      borderRadius: 999,
      padding: '1px 7px',
      fontSize: 10,
      fontWeight: 700,
      background: PTINT,
      color: P
    }
  }, item.badge) : null);
}
function WorkspaceSidebar({
  view,
  setView
}) {
  const items = [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'home'
  }, {
    id: 'resumes',
    label: 'My Resumes',
    icon: 'file-text',
    disabled: true
  }, {
    id: 'pipeline',
    label: 'Career Pipeline',
    icon: 'kanban-square',
    badge: '12'
  }, {
    id: 'studio',
    label: 'Interview Studio',
    icon: 'mic'
  }];
  const brandItems = [{
    id: 'portfolio',
    label: 'Portfolio',
    icon: 'globe',
    disabled: true
  }, {
    id: 'whiteboard',
    label: 'Whiteboard',
    icon: 'pen-line',
    disabled: true
  }, {
    id: 'jobs',
    label: 'Job Market',
    icon: 'briefcase',
    disabled: true
  }];
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      width: 224,
      flexShrink: 0,
      padding: 12,
      background: '#fff',
      borderRight: '1px solid var(--cv-border-subtle)',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '4px 6px 12px'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/careervivid-icon-128.png",
    alt: "",
    style: {
      width: 26,
      height: 26
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--cv-font-heading)',
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--cv-neutral-900)'
    }
  }, "CareerVivid")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 4px 6px',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--cv-neutral-400)'
    }
  }, "Workspace"), items.map(it => /*#__PURE__*/React.createElement(NavItem, {
    key: it.id,
    item: it,
    active: view === it.id,
    onClick: () => !it.disabled && setView(it.id)
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '14px 4px 6px',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--cv-neutral-400)'
    }
  }, "Brand"), brandItems.map(it => /*#__PURE__*/React.createElement(NavItem, {
    key: it.id,
    item: it,
    active: false,
    onClick: () => {}
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 10,
      borderRadius: 10,
      border: '1px solid var(--cv-border-product)',
      background: 'var(--cv-neutral-25)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--cv-neutral-900)'
    }
  }, "AI credits"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--cv-neutral-500)'
    }
  }, "34/100")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      height: 6,
      borderRadius: 999,
      background: 'var(--cv-neutral-200)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: '34%',
      borderRadius: 999,
      background: P
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 6px 2px'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/avatars/careervivid-rabbit-glasses.jpg",
    alt: "",
    style: {
      width: 30,
      height: 30,
      borderRadius: 999,
      objectFit: 'cover',
      boxShadow: '0 0 0 2px #fff'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 12,
      fontWeight: 700,
      color: 'var(--cv-neutral-900)'
    }
  }, "Jiawen Zhu"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 10,
      fontWeight: 600,
      color: 'var(--cv-neutral-400)'
    }
  }, "Free plan"))));
}

/* ---------- Shared bits ---------- */
function PrimaryBtn({
  icon,
  children,
  small
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: small ? 32 : 36,
      padding: small ? '0 12px' : '0 14px',
      borderRadius: 8,
      border: 'none',
      background: h ? PH : P,
      color: '#fff',
      fontFamily: wsFont,
      fontSize: small ? 12 : 13,
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'background 120ms',
      whiteSpace: 'nowrap'
    }
  }, icon ? /*#__PURE__*/React.createElement(Ic, {
    name: icon,
    size: small ? 14 : 16
  }) : null, children);
}
function StatCard({
  label,
  value,
  icon,
  toneBg,
  toneFg,
  delta
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      border: '1px solid var(--cv-border-product)',
      borderRadius: 16,
      padding: 16,
      boxShadow: 'var(--cv-shadow-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 11,
      fontWeight: 700,
      color: '#64748b'
    }
  }, label), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '6px 0 0',
      fontFamily: 'var(--cv-font-heading)',
      fontSize: 28,
      fontWeight: 800,
      lineHeight: 1.1,
      color: 'var(--cv-neutral-900)'
    }
  }, value), delta ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--cv-neutral-500)'
    }
  }, delta) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 36,
      height: 36,
      borderRadius: 12,
      background: toneBg,
      color: toneFg,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: icon,
    size: 17
  }))));
}

/* ---------- Pipeline (Kanban) ---------- */
const pipelineData = [{
  status: 'To Apply',
  dot: '#6b7280',
  jobs: [{
    t: 'Product Designer',
    c: 'Linear',
    pr: 'Medium',
    prep: 1,
    due: 'Jul 10'
  }, {
    t: 'Design Engineer',
    c: 'Vercel',
    pr: 'Low',
    prep: 0,
    noDesc: true
  }]
}, {
  status: 'Applied',
  dot: '#3b82f6',
  jobs: [{
    t: 'Senior Frontend Engineer',
    c: 'Figma',
    pr: 'High',
    match: 86,
    prep: 3,
    due: 'Jul 8'
  }, {
    t: 'Full-stack Engineer',
    c: 'Notion',
    pr: 'Medium',
    match: 74,
    prep: 2
  }, {
    t: 'Software Engineer II',
    c: 'Stripe',
    pr: 'Medium',
    match: 68,
    prep: 1,
    due: 'Jul 14'
  }]
}, {
  status: 'Interviewing',
  dot: '#eab308',
  jobs: [{
    t: 'Frontend Engineer',
    c: 'Airbnb',
    pr: 'High',
    match: 91,
    prep: 5,
    due: 'Jul 7'
  }]
}, {
  status: 'Offered',
  dot: '#22c55e',
  jobs: [{
    t: 'UI Engineer',
    c: 'Datadog',
    pr: 'Medium',
    match: 82,
    prep: 5
  }]
}, {
  status: 'Rejected',
  dot: '#ef4444',
  jobs: [{
    t: 'Staff Engineer',
    c: 'Coinbase',
    pr: 'Low',
    prep: 2
  }]
}];
function PipelineCard({
  j
}) {
  const [h, setH] = React.useState(false);
  const prTone = j.pr === 'High' ? {
    background: '#fff1f2',
    color: '#be123c'
  } : j.pr === 'Low' ? {
    background: '#f3f4f6',
    color: '#4b5563'
  } : {
    background: '#fffbeb',
    color: '#b45309'
  };
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      borderRadius: 6,
      border: `1px solid ${h ? '#c8c3ff' : 'var(--cv-border-product)'}`,
      background: h ? 'rgba(243,242,255,0.4)' : '#fff',
      padding: '8px 10px',
      boxShadow: 'var(--cv-shadow-card)',
      cursor: 'pointer',
      transition: 'all 120ms'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 28,
      flexShrink: 0,
      borderRadius: 6,
      background: 'var(--cv-neutral-100)',
      color: 'var(--cv-neutral-500)'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: "briefcase",
    size: 15
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      fontSize: 13,
      fontWeight: 700,
      lineHeight: '19px',
      color: 'var(--cv-neutral-950)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontFamily: wsFont
    }
  }, j.t), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--cv-neutral-500)'
    }
  }, j.c)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--cv-neutral-400)',
      opacity: h ? 1 : 0.6
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: "arrow-up-right",
    size: 13
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      columnGap: 8,
      rowGap: 4,
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--cv-neutral-500)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      borderRadius: 4,
      padding: '2px 6px',
      ...prTone
    }
  }, j.pr), j.noDesc ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 3,
      borderRadius: 4,
      padding: '2px 6px',
      background: '#fffbeb',
      color: '#b45309'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: "alert-circle",
    size: 11
  }), "No description") : null, j.match != null ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 3,
      color: '#2563eb'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: "check-circle-2",
    size: 11
  }), j.match, "%") : null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: "calendar-clock",
    size: 11
  }), "Prep ", j.prep, "/5"), j.due ? /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      color: 'var(--cv-neutral-700)'
    }
  }, j.due) : null))));
}
function PipelineView() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20,
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 800,
      color: 'var(--cv-neutral-900)'
    }
  }, "Career Pipeline"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      fontSize: 13,
      fontWeight: 500,
      color: '#64748b'
    }
  }, "Organize and manage your job application pipeline.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: 36,
      padding: '0 12px',
      borderRadius: 10,
      background: 'rgba(249,250,251,0.8)',
      border: '1px solid var(--cv-border-product)',
      color: 'var(--cv-neutral-400)',
      fontSize: 12,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: "search",
    size: 15
  }), " Search jobs\u2026"), /*#__PURE__*/React.createElement(PrimaryBtn, {
    icon: "plus"
  }, "Add job"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flex: 1,
      minHeight: 0,
      overflowX: 'auto'
    }
  }, pipelineData.map(col => /*#__PURE__*/React.createElement("div", {
    key: col.status,
    style: {
      minWidth: 244,
      width: 244,
      flexShrink: 0,
      borderRadius: 8,
      border: '1px solid var(--cv-border-product)',
      background: 'rgba(249,250,251,0.8)',
      padding: 10,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      padding: '0 2px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 999,
      background: col.dot,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 12,
      fontWeight: 700,
      color: 'var(--cv-neutral-700)',
      flex: 1
    }
  }, col.status), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--cv-neutral-400)'
    }
  }, col.jobs.length)), col.jobs.map(j => /*#__PURE__*/React.createElement(PipelineCard, {
    key: j.t,
    j: j
  }))))));
}

/* ---------- Dashboard ---------- */
function DashboardView({
  setView
}) {
  const tools = [{
    icon: 'file-text',
    bg: PTINT,
    fg: P,
    title: 'AI Resume Builder',
    desc: 'Create ATS-optimized resumes with smart templates.',
    cta: 'New resume'
  }, {
    icon: 'mic',
    bg: '#fff6f6',
    fg: '#b64a5a',
    title: 'Interview Studio',
    desc: 'Practice with a real-time AI voice coach.',
    cta: 'Start practice',
    view: 'studio'
  }, {
    icon: 'kanban-square',
    bg: '#eff6ff',
    fg: '#2563eb',
    title: 'Job Tracker',
    desc: 'Kanban pipeline from Applied to Offer.',
    cta: 'Open pipeline',
    view: 'pipeline'
  }, {
    icon: 'globe',
    bg: '#eef9f2',
    fg: '#15803d',
    title: 'Portfolio Builder',
    desc: 'Turn your resume into a personal site.',
    cta: 'Build portfolio'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20,
      overflowY: 'auto',
      height: '100%',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 800,
      color: 'var(--cv-neutral-900)'
    }
  }, "Welcome back, Jiawen"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      fontSize: 13,
      fontWeight: 500,
      color: '#64748b'
    }
  }, "Here's your job search at a glance.")), /*#__PURE__*/React.createElement(PrimaryBtn, {
    icon: "sparkles"
  }, "Tailor resume")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Active applications",
    value: 12,
    icon: "briefcase",
    toneBg: "#eff6ff",
    toneFg: "#2563eb",
    delta: "3 added this week"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Interviews scheduled",
    value: 2,
    icon: "calendar-clock",
    toneBg: "#fffbeb",
    toneFg: "#b45309",
    delta: "Next: Airbnb, Jul 7"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Practice sessions",
    value: 9,
    icon: "mic",
    toneBg: "#fff6f6",
    toneFg: "#b64a5a",
    delta: "Avg score 78"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Offers",
    value: 1,
    icon: "trophy",
    toneBg: "#eef9f2",
    toneFg: "#15803d",
    delta: "Datadog \xB7 reviewing"
  })), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '22px 0 10px',
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--cv-neutral-900)'
    }
  }, "Your tools"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12
    }
  }, tools.map(tool => /*#__PURE__*/React.createElement("div", {
    key: tool.title,
    style: {
      background: '#fff',
      border: '1px solid var(--cv-border-product)',
      borderRadius: 12,
      padding: 16,
      boxShadow: 'var(--cv-shadow-card)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 36,
      height: 36,
      borderRadius: 12,
      background: tool.bg,
      color: tool.fg
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: tool.icon,
    size: 17
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '10px 0 0',
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--cv-neutral-950)',
      fontFamily: wsFont
    }
  }, tool.title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 12px',
      fontSize: 12,
      fontWeight: 500,
      lineHeight: 1.55,
      color: '#64748b',
      flex: 1
    }
  }, tool.desc), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => tool.view && setView(tool.view),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 32,
      borderRadius: 8,
      background: PSOFT,
      color: P,
      border: `1px solid ${PRING}`,
      fontFamily: wsFont,
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer'
    }
  }, tool.cta, " ", /*#__PURE__*/React.createElement(Ic, {
    name: "arrow-right",
    size: 13
  }))))));
}

/* ---------- Interview Studio ---------- */
const studioGuides = [{
  c: 'Google',
  d: 'High',
  topics: ['Algorithms', 'System design'],
  meta: '5 stages · 120 questions'
}, {
  c: 'Stripe',
  d: 'High',
  topics: ['APIs', 'Integrations'],
  meta: '4 stages · 84 questions'
}, {
  c: 'Airbnb',
  d: 'Medium',
  topics: ['Frontend', 'Behavioral'],
  meta: '4 stages · 76 questions'
}, {
  c: 'Figma',
  d: 'Medium',
  topics: ['Design eng', 'Prototyping'],
  meta: '3 stages · 58 questions'
}, {
  c: 'Notion',
  d: 'Medium',
  topics: ['Product sense', 'Coding'],
  meta: '3 stages · 51 questions'
}, {
  c: 'Datadog',
  d: 'Low',
  topics: ['Systems', 'Debugging'],
  meta: '3 stages · 44 questions'
}];
const guideTones = [{
  bg: '#f3f2ff',
  fg: '#625bd5',
  ring: '#dfdcff'
}, {
  bg: '#eef0ff',
  fg: '#7069dc',
  ring: '#dfe2ff'
}, {
  bg: '#f7f1ff',
  fg: '#7c5fd6',
  ring: '#eadfff'
}, {
  bg: '#f5f7ff',
  fg: '#5c62d6',
  ring: '#e0e5ff'
}];
function GuideCard({
  g,
  i
}) {
  const [h, setH] = React.useState(false);
  const tone = guideTones[i % 4];
  const dTone = g.d === 'High' ? {
    background: '#fff1f2',
    color: '#be123c',
    ring: '#fecdd3'
  } : g.d === 'Low' ? {
    background: '#eef9f2',
    color: '#15803d',
    ring: '#cfe8d5'
  } : {
    background: '#fffbeb',
    color: '#b45309',
    ring: '#fde68a'
  };
  return /*#__PURE__*/React.createElement("article", {
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 12,
      border: `1px solid ${h ? PRING : 'var(--cv-border-product)'}`,
      background: h ? '#fbfbff' : '#fff',
      padding: 16,
      boxShadow: h ? '0 8px 24px rgba(98,91,213,0.08)' : 'var(--cv-shadow-card)',
      transform: h ? 'translateY(-2px)' : 'none',
      transition: 'all 200ms cubic-bezier(0.2,0,0,1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      flexShrink: 0,
      borderRadius: 8,
      background: tone.bg,
      color: tone.fg,
      boxShadow: `0 0 0 1px ${tone.ring}`,
      fontFamily: 'var(--cv-font-heading)',
      fontSize: 15,
      fontWeight: 800
    }
  }, g.c[0]), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--cv-neutral-950)',
      fontFamily: wsFont
    }
  }, g.c), /*#__PURE__*/React.createElement("span", {
    style: {
      borderRadius: 999,
      padding: '2px 8px',
      fontSize: 10,
      fontWeight: 700,
      whiteSpace: 'nowrap',
      background: dTone.background,
      color: dTone.color,
      boxShadow: `0 0 0 1px ${dTone.ring}`
    }
  }, g.d)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--cv-neutral-500)'
    }
  }, g.meta))), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '12px 0 0',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, g.topics.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      borderRadius: 6,
      padding: '3px 8px',
      fontSize: 11,
      fontWeight: 600,
      background: h ? PTINT : 'var(--cv-neutral-100)',
      color: h ? P : 'var(--cv-neutral-600)',
      transition: 'all 120ms'
    }
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      display: 'inline-flex',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 34,
      borderRadius: 8,
      background: PSOFT,
      color: P,
      border: `1px solid ${PRING}`,
      fontFamily: wsFont,
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: "swords",
    size: 14
  }), " Start quest"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 34,
      height: 34,
      borderRadius: 8,
      border: '1px solid var(--cv-border-product)',
      background: '#fff',
      color: 'var(--cv-neutral-400)'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: "sparkles",
    size: 14
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 34,
      height: 34,
      borderRadius: 8,
      border: '1px solid var(--cv-border-product)',
      background: '#fff',
      color: 'var(--cv-neutral-400)'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: "external-link",
    size: 14
  }))));
}
function StudioView() {
  const [cat, setCat] = React.useState('All');
  const cats = ['All', 'Big Tech', 'Startups', 'Finance', 'System design'];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20,
      overflowY: 'auto',
      height: '100%',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 32,
      borderRadius: 8,
      background: PTINT,
      color: P,
      boxShadow: '0 0 0 1px #dfdcff'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: "building-2",
    size: 16
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 18,
      fontWeight: 700,
      color: 'var(--cv-neutral-900)'
    }
  }, "Practice from real company guides"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '1px 0 0',
      fontSize: 12,
      fontWeight: 500,
      color: '#64748b'
    }
  }, "Verified stages, topics, and sample questions \u2014 turned into a company-style mock interview."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      borderRadius: 12,
      border: '1px solid var(--cv-border-product)',
      background: 'rgba(255,255,255,0.8)',
      boxShadow: 'var(--cv-shadow-card)'
    }
  }, [['1,214', 'companies'], ['38,410', 'questions'], ['4,932', 'stages']].map(([v, l], i) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      padding: '8px 16px',
      textAlign: 'center',
      borderLeft: i ? '1px solid var(--cv-border-product)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--cv-neutral-900)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, v), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--cv-neutral-400)'
    }
  }, l))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      margin: '16px 0 10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      height: 46,
      padding: '0 14px',
      borderRadius: 12,
      background: 'rgba(249,250,251,0.8)',
      border: '1px solid var(--cv-border-product)'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: "search",
    size: 17,
    style: {
      color: 'var(--cv-neutral-400)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--cv-neutral-400)'
    }
  }, "Search Google, Stripe, OpenAI, system design\u2026"), /*#__PURE__*/React.createElement("kbd", {
    style: {
      marginLeft: 'auto',
      borderRadius: 6,
      border: '1px solid var(--cv-border-product)',
      background: '#fff',
      padding: '1px 7px',
      fontFamily: wsFont,
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--cv-neutral-400)'
    }
  }, "/"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 14
    }
  }, cats.map(c => {
    const active = c === cat;
    return /*#__PURE__*/React.createElement("button", {
      key: c,
      type: "button",
      onClick: () => setCat(c),
      style: {
        borderRadius: 999,
        padding: '6px 12px',
        fontFamily: wsFont,
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 120ms',
        background: active ? '#030712' : '#fff',
        color: active ? '#fff' : 'var(--cv-neutral-600)',
        border: active ? '1px solid #030712' : '1px solid var(--cv-border-product)'
      }
    }, c);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 12
    }
  }, studioGuides.map((g, i) => /*#__PURE__*/React.createElement(GuideCard, {
    key: g.c,
    g: g,
    i: i
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      borderRadius: 8,
      border: '1px solid var(--cv-border-product)',
      background: '#fff',
      padding: '9px 16px',
      fontFamily: wsFont,
      fontSize: 12,
      fontWeight: 700,
      color: 'var(--cv-neutral-700)',
      cursor: 'pointer',
      boxShadow: 'var(--cv-shadow-card)'
    }
  }, "Show more companies ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--cv-neutral-400)',
      fontWeight: 600
    }
  }, "(1,208 more)"))));
}

/* ---------- Shell ---------- */
function Workspace() {
  const [view, setView] = React.useState('pipeline');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: '100vh',
      fontFamily: wsFont,
      background: 'var(--cv-neutral-50)'
    },
    "data-screen-label": view
  }, /*#__PURE__*/React.createElement(WorkspaceSidebar, {
    view: view,
    setView: setView
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, view === 'dashboard' ? /*#__PURE__*/React.createElement(DashboardView, {
    setView: setView
  }) : view === 'studio' ? /*#__PURE__*/React.createElement(StudioView, null) : /*#__PURE__*/React.createElement(PipelineView, null)));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(Workspace, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/workspace.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/landing.jsx
try { (() => {
const P = '#625bd5',
  PH = '#514ac5',
  PTINT = '#f3f2ff',
  PRING = '#dfdcff';
const WARM = {
  border: '#eadbc5',
  borderStrong: '#e4d3bc',
  ink: '#211b16',
  muted: '#665a4a',
  eyebrow: '#a97935',
  surface: '#fffaf1',
  panel: 'rgba(249,239,224,0.8)'
};
const lpFont = 'var(--cv-font-body)';
function Ic({
  name,
  size = 16,
  sw = 2,
  style
}) {
  return /*#__PURE__*/React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: style,
    dangerouslySetInnerHTML: {
      __html: window.CV_LUCIDE[name] || ''
    }
  });
}
function Header() {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 5,
      background: 'rgba(247,241,231,0.92)',
      backdropFilter: 'blur(8px)',
      borderBottom: `1px solid ${WARM.borderStrong}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      maxWidth: 1200,
      margin: '0 auto',
      padding: '12px 24px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/careervivid-icon-128.png",
    alt: "",
    style: {
      width: 30,
      height: 30
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--cv-font-heading)',
      fontSize: 17,
      fontWeight: 700,
      color: WARM.ink
    }
  }, "CareerVivid")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 22,
      fontSize: 13,
      fontWeight: 600,
      color: WARM.muted
    }
  }, /*#__PURE__*/React.createElement("span", null, "Resume"), /*#__PURE__*/React.createElement("span", null, "Job Tracker"), /*#__PURE__*/React.createElement("span", null, "Interviews"), /*#__PURE__*/React.createElement("span", null, "Extension"), /*#__PURE__*/React.createElement("span", null, "Pricing")), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: WARM.ink
    }
  }, "Sign in"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 36,
      padding: '0 16px',
      borderRadius: 10,
      border: 'none',
      background: P,
      color: '#fff',
      fontFamily: lpFont,
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
      boxShadow: '0 8px 18px rgba(98,91,213,0.18)'
    }
  }, "Start for free"))));
}
function MiniResumePreview() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 16,
      border: `1px solid ${WARM.border}`,
      background: 'rgba(255,255,255,0.9)',
      boxShadow: '0 24px 60px rgba(139,90,22,0.1)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '12px 16px',
      borderBottom: `1px solid ${WARM.border}`
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: WARM.eyebrow
    }
  }, "My resumes"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '1px 0 0',
      fontSize: 15,
      fontWeight: 700,
      color: WARM.ink,
      fontFamily: 'var(--cv-font-heading)'
    }
  }, "Resume workspace")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 34,
      padding: '0 12px',
      borderRadius: 8,
      border: 'none',
      background: P,
      color: '#fff',
      fontFamily: lpFont,
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer',
      boxShadow: '0 8px 18px rgba(98,91,213,0.15)'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: "file-text",
    size: 14
  }), " New resume")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.35fr 1fr',
      gap: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 10,
      border: `1px solid ${WARM.border}`,
      background: WARM.surface,
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderBottom: `1px solid ${WARM.border}`,
      paddingBottom: 8
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      fontWeight: 700,
      color: WARM.ink
    }
  }, "Jiawen Zhu"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 11,
      fontWeight: 700,
      color: WARM.muted
    }
  }, "Frontend Engineer")), [['Profile', 'Product-minded engineer with 6 years shipping web apps at scale.'], ['Experience', 'Senior Engineer · Acme — led the design-system migration.'], ['Education', 'B.S. Computer Science, UCSD']].map(([label, copy]) => /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      marginTop: 9
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: WARM.eyebrow
    }
  }, label), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      fontSize: 11,
      fontWeight: 600,
      lineHeight: 1.5,
      color: WARM.muted
    }
  }, copy))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 5,
      marginTop: 10
    }
  }, ['HTML', 'CSS', 'JavaScript', 'React'].map(s => /*#__PURE__*/React.createElement("span", {
    key: s,
    style: {
      borderRadius: 999,
      padding: '2px 8px',
      fontSize: 10,
      fontWeight: 700,
      background: '#f7fff8',
      color: '#137245'
    }
  }, s))))), /*#__PURE__*/React.createElement("aside", {
    style: {
      borderLeft: `1px solid ${WARM.border}`,
      background: WARM.panel,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 10,
      border: `1px solid ${WARM.border}`,
      background: 'rgba(255,255,255,0.9)',
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: WARM.eyebrow
    }
  }, "Create"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      fontSize: 13,
      fontWeight: 700,
      color: WARM.ink
    }
  }, "Paste your resume to start"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 9,
      borderRadius: 8,
      border: '1px dashed #d8c6ad',
      background: WARM.surface,
      padding: 10,
      fontSize: 10.5,
      fontWeight: 600,
      lineHeight: 1.6,
      color: '#8a7865'
    }
  }, "Paste resume text, a LinkedIn export, or a job posting\u2026"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      display: 'inline-flex',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 34,
      marginTop: 10,
      borderRadius: 8,
      border: 'none',
      background: P,
      color: '#fff',
      fontFamily: lpFont,
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: "wand-2",
    size: 14
  }), " Tailor to a job")))));
}
function Hero() {
  return /*#__PURE__*/React.createElement("section", {
    className: "cv-warm-grid",
    style: {
      padding: '56px 24px 48px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '0.92fr 1.08fr',
      gap: 48,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "cv-warm-eyebrow",
    style: {
      margin: 0
    }
  }, "Job search workspace"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: '14px 0 0',
      fontSize: 44,
      fontWeight: 700,
      lineHeight: 1.12,
      letterSpacing: 0,
      color: WARM.ink
    }
  }, "Everything you need to land your next job \u2014 in one place."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '16px 0 0',
      fontSize: 16,
      fontWeight: 500,
      lineHeight: 1.75,
      color: WARM.muted,
      maxWidth: 440
    }
  }, "Build standout resumes, track applications, prep for interviews, and autofill job forms in seconds. Your next job starts here."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      height: 44,
      padding: '0 20px',
      borderRadius: 12,
      border: 'none',
      background: P,
      color: '#fff',
      fontFamily: lpFont,
      fontSize: 14,
      fontWeight: 700,
      cursor: 'pointer',
      boxShadow: '0 12px 24px rgba(98,91,213,0.2)'
    }
  }, "Start for free ", /*#__PURE__*/React.createElement(Ic, {
    name: "arrow-right",
    size: 16
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      height: 44,
      padding: '0 18px',
      borderRadius: 12,
      background: '#fff',
      color: WARM.ink,
      border: `1px solid ${WARM.borderStrong}`,
      fontFamily: lpFont,
      fontSize: 14,
      fontWeight: 700,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: "app-window",
    size: 16
  }), " Get the extension")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      marginTop: 26
    }
  }, [['Direct apply links', 'check-circle-2'], ['ATS-ready resumes', 'check-circle-2'], ['Chrome extension', 'check-circle-2']].map(([label, icon]) => /*#__PURE__*/React.createElement("span", {
    key: label,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      fontWeight: 700,
      color: WARM.muted
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: icon,
    size: 14,
    style: {
      color: '#15803d'
    }
  }), label)))), /*#__PURE__*/React.createElement(MiniResumePreview, null)));
}
function ProductIndex() {
  const products = [{
    icon: 'file-text',
    title: 'AI Resume Builder',
    desc: 'ATS-optimized resumes with smart templates and one-click PDF export.'
  }, {
    icon: 'kanban-square',
    title: 'Job Tracker',
    desc: 'A Kanban pipeline from Applied to Offer, with notes and follow-ups.'
  }, {
    icon: 'mic',
    title: 'Interview Studio',
    desc: 'Real-time AI voice coach with 1,200+ verified company guides.'
  }, {
    icon: 'globe',
    title: 'Portfolio Builder',
    desc: 'Turn your resume into a personal site with a shareable link.'
  }, {
    icon: 'app-window',
    title: 'Chrome Extension',
    desc: 'Save roles, analyze fit, and autofill applications where you apply.'
  }, {
    icon: 'pen-line',
    title: 'AI Whiteboard',
    desc: 'Describe a system in plain English — get a diagram on your canvas.'
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '48px 24px',
      borderTop: `1px solid ${WARM.borderStrong}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "cv-warm-eyebrow",
    style: {
      margin: 0
    }
  }, "The workspace"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '10px 0 0',
      fontSize: 28,
      fontWeight: 650,
      color: WARM.ink
    }
  }, "Designed around the moments job seekers repeat."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 14,
      marginTop: 24
    }
  }, products.map(pr => /*#__PURE__*/React.createElement("div", {
    key: pr.title,
    className: "cv-warm-card",
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      borderRadius: 12,
      background: PTINT,
      color: P
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    name: pr.icon,
    size: 18
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '12px 0 0',
      fontSize: 15,
      fontWeight: 700,
      color: WARM.ink,
      fontFamily: lpFont
    }
  }, pr.title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '5px 0 0',
      fontSize: 13,
      fontWeight: 500,
      lineHeight: 1.65,
      color: WARM.muted
    }
  }, pr.desc))))));
}
function FinalCTA() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '52px 24px 64px',
      borderTop: `1px solid ${WARM.borderStrong}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 640,
      margin: '0 auto',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 30,
      fontWeight: 650,
      color: WARM.ink
    }
  }, "Create one workspace for the whole search."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '12px 0 0',
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 1.8,
      color: WARM.muted
    }
  }, "Start free, then choose the AI help that matches your search."), /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      height: 44,
      marginTop: 20,
      padding: '0 22px',
      borderRadius: 12,
      border: 'none',
      background: P,
      color: '#fff',
      fontFamily: lpFont,
      fontSize: 14,
      fontWeight: 700,
      cursor: 'pointer',
      boxShadow: '0 12px 24px rgba(98,91,213,0.2)'
    }
  }, "Start for free ", /*#__PURE__*/React.createElement(Ic, {
    name: "arrow-right",
    size: 16
  }))), /*#__PURE__*/React.createElement("footer", {
    style: {
      maxWidth: 1200,
      margin: '48px auto 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 20,
      borderTop: `1px solid ${WARM.borderStrong}`,
      fontSize: 12,
      fontWeight: 600,
      color: WARM.muted
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/careervivid-icon-128.png",
    alt: "",
    style: {
      width: 20,
      height: 20
    }
  }), " \xA9 2026 CareerVivid"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("span", null, "Privacy"), /*#__PURE__*/React.createElement("span", null, "Terms"), /*#__PURE__*/React.createElement("span", null, "Contact"), /*#__PURE__*/React.createElement("span", null, "Blog"))));
}
function Landing() {
  return /*#__PURE__*/React.createElement("div", {
    className: "cv-warm-page",
    style: {
      fontFamily: lpFont
    },
    "data-screen-label": "landing"
  }, /*#__PURE__*/React.createElement(Header, null), /*#__PURE__*/React.createElement(Hero, null), /*#__PURE__*/React.createElement(ProductIndex, null), /*#__PURE__*/React.createElement(FinalCTA, null));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(Landing, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/landing.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.StatusDot = __ds_scope.StatusDot;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Eyebrow = __ds_scope.Eyebrow;

__ds_ns.CompanyGuideCard = __ds_scope.CompanyGuideCard;

__ds_ns.JobCard = __ds_scope.JobCard;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.CategoryFilter = __ds_scope.CategoryFilter;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SearchInput = __ds_scope.SearchInput;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconWell = __ds_scope.IconWell;

__ds_ns.LUCIDE_ICONS = __ds_scope.LUCIDE_ICONS;

__ds_ns.Sidebar = __ds_scope.Sidebar;

})();
