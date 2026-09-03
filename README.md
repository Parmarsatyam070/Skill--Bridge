# SkillBridge — Academia-Industry Collaboration Platform 🌉

SkillBridge is a production-grade web platform engineered to close the skill gap between academic learning and industry demand. Built for the Smart India Hackathon (SIH) problem statement, it creates an authoritative, single-source-of-truth ecosystem connecting **Students**, **Industry Recruiters**, **Academicians**, and **Institution Admins**.

---

## 🎨 Dual Coordinated Design System

SkillBridge features two meticulously calibrated design palettes:

### 1. Campus Palette (Public & Marketing Pages)
*Evokes academia, trust, prestige, and open opportunity.*
- **Paper:** `#FBFAF7` (warm cream background)
- **Ink:** `#181B22` / **Ink Muted:** `#5B6270`
- **Campus Blue:** `#2B4C7E` (academic identity)
- **Industry Amber:** `#E8963C` (industry identity)
- **Bridge Teal:** `#2F8C82` (platform matching identity & primary CTA)
- **Line:** `#E4E1D9` (subtle border rules)

### 2. Console Palette (Authenticated Dashboards)
*Evokes high-density precision, code workspace clarity, and data density.*
- **Console BG:** `#12141C` (deep obsidian canvas)
- **Console Panel:** `#1B1E29` / **Panel Raised:** `#242836`
- **Console Border:** `#2E3241` / **Console Text:** `#EDEFF3`
- **Status Green:** `#4CC38A` / **Status Amber:** `#F0A94E` / **Status Red:** `#E5637C`

### Signature Element: "Bridge Line"
An animated SVG connector linking verified student skill nodes to industry opportunity requirements. It is rendered **only on genuine matches** (never as generic decorative noise) and dynamically changes color based on the match tier.

---

## 🧮 Authoritative Server-Side Matching Engine

Match percentages are **never recomputed independently on the client**. The client queries `GET /api/students/:id/matches`, which executes the standardized vector distance formula:

$$\text{Score} = \text{round}\left( \max\left(0, \min\left(100, \left(\frac{\sum w_i \cdot \min(1.0, \frac{s_i}{m_i})}{\sum w_i}\right) \times 100 - \min(10, \text{missingCount} \times 2.5)\right)\right)\right)$$

Where:
- $w_i$: Weight assigned by recruiter to skill $i$ ($1$ to $5$)
- $s_i$: Student's verified score in skill $i$ ($0$ to $100$)
- $m_i$: Minimum required benchmark score for skill $i$ ($0$ to $100$)
- $\text{missingCount}$: Number of required skills completely absent from the student profile

### Live Score Invalidation Loop:
When a student completes an accredited course on `/courses`, the server updates `StudentSkillScore` and increments skill points. React Query invalidates `['studentMatches']` and `['studentProfile']`, immediately updating all radar charts and match badges across the entire platform in real-time.

---

## 👥 4 Role Workspaces & Demo Credentials

All accounts are pre-seeded with password: `password123`. Instant **1-Click Quick Demo Login Switchers** are available on `/login` and the Console Topbar.

| Persona | Role | Email | Password | Key Capabilities |
|---|---|---|---|---|
| **Aarav Sharma** | Student | `student@skillbridge.edu` | `password123` | Radar Chart, Domain Assessment, Bridge Line Internships, Accredited Courses, AI Resume Builder (PDF export), Public Portfolio (`/portfolio/:id`) |
| **TechCorp India** | Industry | `recruiter@techcorp.com` | `password123` | Job Requisition Builder with Skill Weights (1–5x), Ranked Candidate Pool, Applicant Status Workflow |
| **Dr. Priya Menon** | Academician | `faculty@dtu.ac.in` | `password123` | AICTE Faculty Development Programs (FDPs), Joint Industry Research Grants, Sabbatical Residencies |
| **Prof. Rajesh Gupta** | Institution Admin | `admin@dtu.ac.in` | `password123` | Batch Skill Heatmap, Placement Readiness Index, Curriculum Gap Alerts, Syllabus Board Recommendations |

---

## 🤝 Accredited Learning Partners & Deep Linking

Real, publicly listed course offerings with skill point accelerators are seeded from:
- **NPTEL (National Programme on Technology Enhanced Learning)**
- **SWAYAM (Ministry of Education)**
- **HCL TechBee & GUVI**
- **Coursera & upGrad**

Outbound transparent deep links (`<ExternalApplyButton />`) are integrated for **Internshala**, **AICTE Internship Enterprise Portal**, **LinkedIn Jobs**, and **HCL Careers**.

---

## 🤖 Bridge Bot AI Assistant

A persistent, collapsible drawer available across all Console pages equipped with autonomous database tools:
- `get_skill_gaps`: Analyzes student skill scores vs target domain benchmarks.
- `recommend_courses`: Queries accredited partner courses mapped to deficit skills.
- `explain_match_score`: Explains why a candidate received a specific match percentage.
- `draft_application_note`: Tailors personalized cover notes using verified strengths.
- `navigate_to`: Context-aware deep linking.

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Installation
```bash
npm install
```

### 2. Database Migration & Seeding
```bash
# Push Prisma schema to local SQLite database
npx prisma db push

# Seed 5 domain benchmarks, 23 skills, 5 content partners, 4 personas, 6 internships, and assessments
npx tsx prisma/seed.ts
```

### 3. Run Automated Vitest Test Suite
```bash
npm test
```
*Executes 12 unit and integration tests verifying password hashing, JWT RBAC, authoritative matching vector calculations, derived portfolios, and AI tool execution.*

### 4. Launch Development Server
```bash
npm run dev
```
- **Client Application:** `http://localhost:3000`
- **Server API Gateway:** `http://localhost:5000`

---

## 📂 Project Architecture

```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BridgeLine.tsx        # Signature animated SVG match connector
│   │   │   ├── BridgeBotWidget.tsx   # Persistent AI Assistant drawer
│   │   │   ├── SkillRadarCard.tsx    # Recharts radar comparison
│   │   │   ├── MatchBadge.tsx        # IBM Plex Mono tabular percentage pill
│   │   │   ├── CareerRoadmap.tsx     # 2-Year Plan infographic roadmap
│   │   │   ├── ExternalApplyButton.tsx# Deep-link partner buttons
│   │   │   ├── ConsoleLayout.tsx     # Dark authenticated workspace
│   │   │   ├── PublicNavbar.tsx      # Campus theme header
│   │   │   └── RoleGate.tsx          # Role-based route guard
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx       # Marketing page with interactive match simulator
│   │   │   ├── LoginPage.tsx         # Role-aware login with 1-click demo switcher
│   │   │   ├── RegisterPage.tsx      # 4-Persona card selector & tailored forms
│   │   │   ├── PublicPortfolioPage.tsx# Print-friendly verified digital portfolio
│   │   │   ├── student/              # Dashboard, Skill Profile, Assessment, Internships, Courses, Resume Builder
│   │   │   ├── industry/             # Recruiter Dashboard, Post Job, Ranked Applicants
│   │   │   ├── academician/          # Faculty Dashboard, Post Opportunities
│   │   │   └── institution/          # Heatmap, Readiness Index, Curriculum Gap Signals
│   │   ├── App.tsx                   # Central router
│   │   └── index.css                 # Custom CSS variables, tokens, print styles
├── server/
│   ├── src/
│   │   ├── config/prisma.ts          # Relational ORM client
│   │   ├── services/
│   │   │   ├── matchingEngine.ts     # Authoritative vector matching algorithm
│   │   │   ├── skillEngine.ts        # Course completion bump & portfolio generator
│   │   │   ├── tokenService.ts       # JWT access/refresh token signing
│   │   │   ├── aiAssistant.ts        # Bridge Bot database tool execution
│   │   │   └── resumeService.ts      # AI resume bullet builder & jsPDF export
│   │   ├── routes/                   # auth, students, courses, internships, applications, resumes, institutions, ai
│   │   └── index.ts                  # Express server entry point
├── shared/
│   ├── types.ts                      # Universal TypeScript interfaces
│   └── validation.ts                 # Strict Zod schemas
└── tests/                            # Vitest unit & integration test suites
```

---

## 🛡️ Security, Reliability & Production Standards
- **Strict Input Validation**: Every request payload is parsed and validated using Zod.
- **Authentication**: Bcrypt password hashing (salt rounds 10), dual JWT access and refresh tokens, and strict Role-Based Access Control (RBAC) middleware.
- **Rate Limiting**: Express rate limiters protect authentication endpoints against brute force attacks.
- **Print Styles**: The public portfolio includes dedicated `@media print` rules for clean, single-page CV printing and PDF saving.

---
Built with pride for academia-industry convergence.
