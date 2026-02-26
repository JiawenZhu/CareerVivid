<div align="center">
  <img src="public/assets/resume-banner.png" alt="CareerVivid Banner" width="100%" />
  
  # CareerVivid
  
  **Personal Brand Building & Career Growth Platform**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Status](https://img.shields.io/badge/Status-Active-success.svg)]()
  [![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-orange.svg)]()
  [![AI](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-blue.svg)]()
</div>

## About

**CareerVivid** is an all-in-one AI-powered platform for building your personal brand, accelerating your career growth, and landing your next opportunity faster. From AI-generated resumes and portfolios to mock interview coaching and a collaborative whiteboard — we give you every tool you need in one seamless workspace.

## Features

### ✨ AI Whiteboard & Diagram Generator
A full collaborative canvas powered by Excalidraw with built-in AI generation.
- **AI Diagram Generator**: Describe any system in plain English — the AI generates a professional architecture diagram directly on your canvas (flowcharts, system designs, service maps).
- **Full Excalidraw Editor**: Freehand drawing, shapes, arrows, text, sticky notes & more.
- **Auto-Save**: Changes persist to Firestore automatically with debounced saves.
- **Thumbnail Previews**: Visual card previews generated from your canvas content.

### 📄 AI Resume Builder
Create professional, ATS-optimized resumes in minutes.
- **Smart Templates**: Multiple professional designs with real-time preview.
- **AI Content Generation**: Intelligent suggestions for summaries and bullet points.
- **PDF Export**: Download publication-ready resumes in one click.
- **Shareable Links**: Share your resume with a unique public URL.

### 🎙️ AI Interview Coach (Interview Studio)
Practice with a real-time AI voice coach that simulates actual interviews.
- **Role-Tailored Questions**: AI generates questions based on your target job and industry.
- **Voice Sessions**: Full real-time AI voice interaction via Cloud Run microservice.
- **Session History**: Review past practice sessions and performance reports.

### 🌐 Portfolio & Personal Brand Builder
Build a beautiful personal website from your resume in minutes.
- **Multiple Modes**: Portfolio sites and link-in-bio pages.
- **Drag-and-Drop Editor**: Fully customizable with live preview.
- **Custom Domain Ready**: Shareable URLs for recruiters and clients.

### 📊 Job Application Tracker
Organize your entire job search with a Kanban-style board.
- **Status Tracking**: Applied → Interviewing → Offer → Rejected pipeline.
- **Detailed Records**: Notes, links, contacts and follow-up dates per application.
- **Statistics**: Visualize your conversion rates at a glance.

### 🏢 Job Marketplace
Discover and apply to jobs powered by AI search.
- **Real-Time AI Search**: Gemini Grounding with live web results.
- **Smart Caching**: 2-week TTL indexed job cache for instant searches.
- **Direct Apply**: Apply with your CareerVivid profile and tailored resume.

### 🤝 Business Partner Portal
A dedicated space for HR teams and recruiters.
- **Job Posting Manager**: Create and publish listings directly to the marketplace.
- **ATS Dashboard**: AI-assisted resume screening and candidate tracking.
- **Status Sync**: HR updates automatically sync to candidates' personal trackers.

### 🎛️ Smart Dashboard
A fully customizable home for all your CareerVivid tools.
- **Drag & Drop Sections**: Reorder sections to your workflow preference.
- **Editable Section Names**: Double-click any section header to rename it.
- **Grid / Row View Toggle**: Switch between compact and card views.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Auth & Database | Firebase Auth + Firestore |
| Storage | Firebase Storage |
| AI | Google Gemini 2.5 Flash (via Cloud Run proxy) |
| Canvas | Excalidraw |
| Drag & Drop | @dnd-kit |
| PDF Export | jsPDF + html2canvas |

## Recent Updates

### February 2026
- **AI Diagram Generator**: Generate professional Excalidraw diagrams from plain-English prompts — direct JSON generation bypasses Mermaid for higher reliability.
- **Whiteboard List Page**: Dedicated `/whiteboard` page listing all boards with grid view, thumbnail previews, and CRUD actions.
- **Editable Dashboard Section Names**: Double-click any dashboard section header to rename it; names persist via localStorage.
- **Security Hardening**: Fixed stored XSS in SVG thumbnail rendering; added AI response element-type whitelisting and prompt length caps.
- **AI Button Visibility Fix**: Resolved Excalidraw z-index layering issue so the AI Generate button always renders above the canvas.

### December 2024
- **SEO Overhaul**: Updated all metadata and Open Graph tags to reflect personal brand positioning.
- **LLM Standardization**: Unified Gemini model usage across frontend and backend.
- **JobMarketPage Refactoring**: Modular architecture with smart job caching (2-week TTL).
- **Job Link Validation**: Server-side URL validation with automated fallbacks.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- Firebase project with Firestore, Auth, and Storage enabled
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jastalk/CareerVivid.git
   cd careervivid
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root and add your credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_GEMINI_PROXY_URL=your_gemini_proxy_url
   ```

4. **Seed Database Templates (Required for Generation)**
   CareerVivid uses a hybrid generation approach. To ensure local templates are uploaded to your Firestore database:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_KEY=./path/to/your-service-account.json npm run seed:templates
   ```
   *Note: You must generate a private key from Firebase Console > Project Settings > Service Accounts.*

5. **Run the App**
   ```bash
   npm run dev
   ```

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
