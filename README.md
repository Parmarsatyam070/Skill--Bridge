# SkillBridge — Autonomous Academia–Industry Intelligence Platform 🌉

[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20TypeScript-blue?logo=react)](https://reactjs.org/)
[![Node](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20TypeScript-green?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Prisma%20ORM-336791?logo=postgresql)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20%7C%20Console%20Theme-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Testing-Vitest%20%7C%2041%20Passed-brightgreen)](https://vitest.dev/)
[![Security](https://img.shields.io/badge/Security-Multi--Tenant%20%7C%20Role--Guarded-blueviolet)](https://jwt.io/)

> **Smart India Hackathon (SIH) Flagship Project**  
> An enterprise-grade, data-driven platform that eliminates the disconnect between university curricula and live market talent demand. SkillBridge transforms unverified student claims into verified, measurable competency through deterministic skill matching, cohort gap analytics, institutional accreditation reporting, and bilateral academia-industry collaboration.

---

## 📑 Table of Contents

1. [Executive Summary & Problem Statement](#-executive-summary--problem-statement)
2. [Platform Architecture & System Topology](#-platform-architecture--system-topology)
3. [Core Personas & Workspaces](#-core-personas--workspaces)
   - [Student Career Workspace](#1-student-career-workspace)
   - [Industry & Recruiter Console](#2-industry--recruiter-console)
   - [Institution Admin Intelligence Suite](#3-institution-admin-intelligence-suite)
4. [Flagship Capabilities & Algorithmic Engines](#-flagship-capabilities--algorithmic-engines)
   - [Deterministic 7-Factor Skill Matching Engine](#-deterministic-7-factor-skill-matching-engine)
   - [Dynamic Skill Radar & Decay Mathematics](#-dynamic-skill-radar--decay-mathematics)
   - [Daily Practice & Gated Streak System](#-daily-practice--gated-streak-system)
   - [Academic Marksheet Extraction & Remediation Roadmaps](#-academic-marksheet-extraction--remediation-roadmaps)
   - [Candidate Explorer & Institutional Endorsements](#-candidate-explorer--institutional-endorsements)
   - [Institutional Recruitment Metrics & Placement Analytics](#-institutional-recruitment-metrics--placement-analytics)
   - [Skill Demand Analysis & Curriculum Alignment](#-skill-demand-analysis--curriculum-alignment)
   - [Policy-Ready Compliance Reports (NIRF, NAAC, NBA)](#-policy-ready-compliance-reports-nirf-naac-nba)
   - [Bilateral Recruiter Collaboration Hub](#-bilateral-recruiter-collaboration-hub)
   - [Sash — Context-Aware AI Career Navigator](#-sash--context-aware-ai-career-navigator)
   - [DSA Sandbox & Multi-Language Execution](#-dsa-sandbox--multi-language-execution)
   - [Verified Public Portfolios & AI Resume Builder](#-verified-public-portfolios--ai-resume-builder)
5. [Evaluator Demo Dataset & Quickstart](#-evaluator-demo-dataset--quickstart)
6. [Technology Stack](#-technology-stack)
7. [Installation & Setup Guide](#-installation--setup-guide)
8. [Available NPM Scripts](#-available-npm-scripts)
9. [Multi-Tenant Security & Isolation](#-multi-tenant-security--isolation)
10. [Repository Directory Structure](#-repository-directory-structure)
11. [License & Acknowledgments](#-license--acknowledgments)

---

## 🎯 Executive Summary & Problem Statement

### The Disconnect in Indian Higher Education
- **Students** graduate with degrees but lack verified proof of required industry competencies, relying on subjective resumes that recruiters struggle to validate.
- **Institutions & Placement Cells** operate in silos without live telemetry on market skill trends, causing syllabus obsolescence and slow curriculum adaptation.
- **Industry Recruiters** waste hundreds of hours screening unqualified applicants due to unverified applicant claims and a lack of standardized benchmarking.
- **Accreditation Bodies (NIRF, NAAC, NBA)** require rigorous auditing of student outcomes, industry partnerships, and placement metrics, which universities currently compile manually with error-prone spreadsheets.

### The SkillBridge Solution
SkillBridge provides an end-to-end, multi-tenant digital bridge:
```
Academic Transcripts & Learning 
       ↓
Automated Gap Analysis & Multi-Skill Assessments
       ↓
Deterministic Skill Radar & Verified Credentials
       ↓
Authoritative Job Matching & Candidate Explorer
       ↓
Targeted Remediation & Curriculum Alignment
       ↓
Accreditation Compliance & Bilateral Industry Partnerships
```

---

## 🏛 Platform Architecture & System Topology

SkillBridge follows a modern decoupled architecture with strict server-authoritative calculations, role-based authorization, and robust tenant scoping.

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Application (React 18 + Vite + Tailwind)"]
        UI_Student["Student Workspace\n(/dashboard, /profile, /opportunities)"]
        UI_Recruiter["Recruiter Console\n(/industry/dashboard, /opportunities)"]
        UI_Admin["Institution Admin Suite\n(/institution/dashboard, /candidates, /reports)"]
        UI_Collab["Collaboration Hub\n(/collaborations)"]
    end

    subgraph APILayer["API & Security Layer (Express.js + TypeScript)"]
        AUTH_GUARD["JWT & Firebase Auth Guard\nRole-Based Access Control"]
        TENANT_GUARD["Tenant Boundary & Scoping Middleware\nInstitution & Recruiter Isolation"]
        ROUTERS["REST API Endpoints\n/api/auth, /api/institutions, /api/students,\n/api/collaborations, /api/opportunities"]
    end

    subgraph ServiceLayer["Core Domain Services"]
        MATCH_ENG["Authoritative Matching Engine"]
        RADAR_SRV["Dynamic Skill & Decay Engine"]
        EXPLORER_SRV["Candidate Explorer Service"]
        METRICS_SRV["Recruitment Metrics Service"]
        ALIGN_SRV["Skill Demand Alignment Service"]
        REPORT_SRV["Compliance Report Engine (CSV/PDF)"]
        COLLAB_SRV["Collaboration Service Layer"]
        AI_SRV["Sash AI Assistant & Gemini Integration"]
    end

    subgraph DataLayer["Data & Persistence Layer"]
        PRISMA["Prisma ORM (PostgreSQL)"]
        DB[(PostgreSQL Database)]
        FIREBASE["Firebase Auth SDK"]
    end

    ClientLayer --> AUTH_GUARD
    AUTH_GUARD --> TENANT_GUARD
    TENANT_GUARD --> ROUTERS
    ROUTERS --> ServiceLayer
    ServiceLayer --> PRISMA
    PRISMA --> DB
    AUTH_GUARD -.-> FIREBASE
```

---

## 👥 Core Personas & Workspaces

The platform natively supports three verified participant roles:

### 1. Student Career Workspace
- **Dynamic Skill Profile**: Multi-dimensional radar visualization across 5 core domains (Full-Stack Web, AI/Data Science, Cloud/DevOps, UI/UX Product Design, Embedded/IoT).
- **Academic Performance & Transcript OCR**: Upload semester transcripts; view aggregate CGPA, extracted subjects, and identify domain-weighted weak subjects.
- **Curated Remediation Roadmaps**: Personalized 6-stage structured roadmaps with target dates, milestones, curated books, and accredited course links (NPTEL, SWAYAM, Coursera).
- **Opportunity Marketplace**: View matched internships with real-time match scores, 7-factor breakdowns, application history, and direct lifecycle tracking.
- **DSA & Technical Practice**: Built-in coding sandbox with automated test case evaluation in Python, JavaScript, Java, and C++.
- **Digital Verified Portfolio**: Standalone public web portfolio with customizable slug, project showcases, verified credentials, and recruiter direct inquiry box.
- **AI Resume Builder**: ATS-friendly resume creation with intelligent bullet generation and high-resolution PDF download.

### 2. Industry & Recruiter Console
- **Recruitment Hub**: Live status cards for active requisitions, applications received, shortlisted candidates, and hires.
- **Candidate Explorer (Benchmark & Live Cohorts)**: Advanced multi-attribute search across 410 candidate records and institution students with filters for CGPA, domains, graduation year, verified skills, and match percentages.
- **Opportunity Creator**: Create internships and full-time requisitions with custom skill weightings, benchmarks, locations, stipends, and work modes (Remote, Hybrid, On-site).
- **Applicant Lifecycle Pipeline**: Progress applicants through standardized hiring stages (`Applied`, `Screening`, `Interview Scheduled`, `Hired`, `Rejected`) with timestamped audit trails.
- **Recruiter Collaboration Hub**: Discover university partners, negotiate MoUs, host campus hackathons, and coordinate talent pipeline initiatives.

### 3. Institution Admin Intelligence Suite
- **Institutional Analytics Dashboard**: Department-level student distribution, overall placement rates, skill readiness heatmaps, and year-over-year trends.
- **Candidate Explorer**: Student discovery tool with administrative tags, internal private notes, and candidate endorsement recommendations for open employer requisitions.
- **Recruitment Metrics Dashboard**: Authoritative placement funnel, offer conversion rates, domain distribution, company engagement activity, and average match score at apply.
- **Skill Demand Analysis**: Deterministic comparative matrix aligning market demand counts against student skill supply and mapped syllabus modules.
- **Policy & Compliance Audit Reports**: Generate exportable, audit-ready compliance summaries for statutory accreditation (NIRF, NAAC, NBA) in JSON, RFC-4180 CSV, and print-ready PDF formats.
- **Collaborations Hub**: Manage bilateral industry partnerships, review incoming employer proposals, organize technical workshops, and collaborate directly via secure messaging.

---

## ⚡ Flagship Capabilities & Algorithmic Engines

### 📊 Deterministic 7-Factor Skill Matching Engine
Rather than relying on client-side approximations or vague keyword matching, SkillBridge computes job-candidate compatibility server-side using an authoritative mathematical formula:

$$\text{weightedFulfillment} = \frac{\sum \left(\text{weight}_i \times \min\left(1, \frac{\text{studentScore}_i}{\text{requiredScore}_i}\right)\right)}{\sum \text{weight}_i}$$

$$\text{missingPenalty} = \min\left(10, \text{missingSkillCount} \times 2.5\right)$$

$$\text{Final Match Score} = \text{round}\left(\max\left(0, \min\left(100, \text{weightedFulfillment} \times 100 - \text{missingPenalty}\right)\right)\right)$$

#### Match Tiers
| Tier | Score Range | Meaning | Visual Indicator |
| :--- | :---: | :--- | :--- |
| **High Match** | 80% – 100% | Highly qualified; meets or exceeds primary benchmarks | 🟢 Green Badge |
| **Medium Match** | 50% – 79% | Viable candidate with targeted upskilling gaps | 🟡 Amber Badge |
| **Low Match** | 0% – 49% | Significant foundational skill gaps | 🔴 Slate/Red Badge |

---

### 📈 Dynamic Skill Radar & Decay Mathematics
Skill competencies evolve with practice and decay over periods of inactivity:
- **Practice & Assessment Gains**: High accuracy in practice sets and proctored assessments boosts verified skill levels asymptotically towards 100.
- **Inactivity Decay**: A gradual, capped decay rate ensures radar representations reflect active, current student readiness.
- **Verification Levels**:
  - `LEVEL_1`: Self-declared / Profile baseline
  - `LEVEL_2`: Assessment verified
  - `LEVEL_3`: Project & course verified with institutional/industry endorsement

---

### 🔥 Daily Practice & Gated Streak System
SkillBridge prevents artificial login farming. A student's learning streak increases **only** when they complete and submit a verified daily practice set:
```
User Login  ──▶  Daily Practice Prompt  ──▶  Attempt Questions  ──▶  Submit Valid Set  ──▶  +1 Day Streak
```
If a student skips practice for more than 36 hours, the streak resets to 1, encouraging genuine daily discipline.

---

### 📄 Academic Marksheet Extraction & Remediation Roadmaps
- **OCR & Transcript Parsing**: Students upload semester grade sheets. The system extracts subject names, credits, and grades.
- **Domain-Weighted Gap Detection**: Subjects with subpar marks are cross-referenced with the student's chosen career domain. For example, a low score in "Database Management Systems" for a "Full-Stack Web" student flags a high-priority gap in SQL and Relational Modeling.
- **Curated Action Roadmap**: Generates an actionable 6-stage milestone plan with recommended remediation courses (NPTEL, SWAYAM, Coursera) and reference textbooks.

---

### 🔍 Candidate Explorer & Institutional Endorsements
- **Multi-Attribute Filter**: Filter students across domains, graduation batches, CGPA cutoffs, verified skill proficiencies, and readiness levels.
- **Institution Tags & Private Notes**: Faculty and placement officers can tag candidates (`"Placement Ready"`, `"Needs DSA Prep"`) and write private audit notes.
- **Candidate Recommendations**: Institution Admins can directly endorse standout students for specific active opportunities without modifying student applications, notifying the recruiter with an official institutional stamp.

---

### 📊 Institutional Recruitment Metrics & Placement Analytics
- **Placement Rate Telemetry**: Tracks enrolled students, active applicants, shortlisted candidates, and confirmed offers.
- **Application Lifecycle Funnel**: Visualizes transition rates across `Applied` $\rightarrow$ `Screening` $\rightarrow$ `Interview` $\rightarrow$ `Offer` $\rightarrow$ `Hired`.
- **Domain & Company Performance**: Highlights top-recruiting companies, average package benchmarks, and domain placement velocity.
- **Average Match at Apply**: Quantifies whether students are applying to roles that suit their verified competencies or applying randomly.

---

### 🎯 Skill Demand Analysis & Curriculum Alignment
- **Deterministic Market Demand vs Supply**: Aggregates skills demanded by live opportunities in the region versus skills possessed by the student body.
- **Under-Supplied & Over-Supplied Signals**: Explicitly tags skills where employer demand outstrips student supply, providing faculty with empirical evidence for syllabus updates.
- **Curriculum Intervention Recommendations**: Actionable suggestions for credit-bearing electives and workshops to close identified cohort gaps.

---

### 📑 Policy-Ready Compliance Reports (NIRF, NAAC, NBA)
University accreditation requires defensible, aggregated compliance metrics:
- **Zero Student PII**: Compliance exports contain strictly aggregated cohort numbers, distributions, and placement rates to comply with data privacy policies.
- **Multi-Format Export**:
  - **JSON Preview**: Real-time structured data preview with period selectors (Last 30 Days, Last 90 Days, Academic Year, All Time).
  - **RFC-4180 CSV**: Strict CRLF compliance with escaped quotation for spreadsheet software.
  - **Audit-Ready PDF**: Professional, printable layout featuring institutional branding, summary KPI tables, and formal signature blocks.

---

### 🤝 Bilateral Recruiter Collaboration Hub
- **Direct Partnership Proposals**: Both Recruiters and Institution Admins can initiate proposals for Technical Workshops, Guest Lectures, Hackathons, Joint Curriculum Design, and Campus Drives.
- **Scoped Tenant Isolation**: Institution A can only see and manage collaborations involving Institution A. Employer A only accesses Employer A data.
- **Audit Logging & Discussion Thread**: Integrated timeline messaging enables bilateral communication, proposal revisions, and approval status tracking (`PROPOSED`, `ACCEPTED`, `REJECTED`, `COMPLETED`).
- **Legacy Partnership Preservation**: Preserves platform-wide benchmark collaborations with null institutional bindings.

---

### 🤖 Sash — Context-Aware AI Career Navigator
Powered by Google Gemini with a deterministic fallback engine:
- Explains why a candidate received a specific match percentage for an internship.
- Analyzes candidate strengths and pinpoints remaining competency gaps.
- Drafts personalized, professional application cover notes grounded in real student credentials.
- Navigates students directly to recommended practice questions and learning modules.

---

### 💻 DSA Sandbox & Multi-Language Execution
- Integrated Monaco code editor with syntax highlighting and auto-formatting.
- Multi-language sandbox supporting Python, JavaScript, Java, and C++.
- Standard input/output testing, hidden edge cases, time complexity constraints, and runtime diagnostics.

---

### 🌐 Verified Public Portfolios & AI Resume Builder
- **Slug-Based Portfolio Hosting**: Students publish verified portfolios at `/portfolio/:slug`.
- **Verified Credentials Display**: Skill badges and assessment scores link directly to cryptographic platform proof.
- **Direct Recruiter Inquiries**: Employers viewing a student's public portfolio can send direct interview invitations through an integrated message drawer.
- **ATS Resume Generator**: Exports high-fidelity, cleanly structured PDFs tailored for corporate recruitment systems.

---

## 🧪 Evaluator Demo Dataset & Quickstart

SkillBridge includes a comprehensive, deterministic synthetic demo dataset designed for instant evaluation without manual data entry.

### Evaluator Demo Accounts

All demo accounts share the standard password:
```text
DemoPassword@123
```

| Role | Email | Affiliation / Organization | Key Verifiable Scenarios |
| :--- | :--- | :--- | :--- |
| **Student** | `demo.student.01@skillbridge.demo` | Demo Institute of Technology | Academic analysis, radar scores, applications, learning roadmaps, Sash AI |
| **Student** | `demo.student.02@skillbridge.demo` | Demo Institute of Technology | High-tier candidate match, active applications, daily streak |
| **Industry Recruiter** | `demo.recruiter.01@skillbridge.demo` | SkillBridge Technologies Demo | Live requisitions, applicant pipeline, candidate explorer (410 records), collaborations |
| **Industry Recruiter** | `demo.recruiter.02@skillbridge.demo` | SkillBridge Analytics Demo | Tenant isolation check: cannot view or modify Recruiter 01 requisitions |
| **Institution Admin** | `demo.admin.01@skillbridge.demo` | Demo Institute of Technology | Recruitment metrics, skill demand analysis, compliance reports (CSV/PDF), collaborations |
| **Institution Admin** | `demo.admin.02@skillbridge.demo` | SkillBridge Demo University | Tenant isolation check: cannot access Admin 01 cohort data or private candidate tags |

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Bundler & Dev Server**: Vite 5
- **Routing**: React Router DOM (v6)
- **State & Data Fetching**: TanStack React Query v5
- **Styling**: Tailwind CSS with custom Dark Console & Campus design tokens
- **Data Visualization**: Recharts (radar charts, bar charts, area charts)
- **Code Editor**: Monaco Editor (`@monaco-editor/react`)
- **Icons**: Lucide React
- **Document Generation**: jsPDF

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js with TypeScript
- **Database & ORM**: PostgreSQL with Prisma ORM (v5)
- **Authentication**: Stateless JWT access tokens + HTTP-only refresh tokens, integrated with Firebase Admin SDK
- **Password Security**: bcryptjs (10 salt rounds)
- **Validation**: Zod schema validation
- **File Handling**: Multer for marksheet transcript uploads
- **AI Integration**: Google Gen AI SDK (`@google/genai` / Gemini 2.5 Flash)

### Testing & Quality Assurance
- **Test Runner**: Vitest (v2)
- **Assertions**: Vitest expectations with strict database assertions
- **Execution**: Dual-run idempotent seeding tests, tenant isolation suites, and preservation audits

---

## 🚀 Installation & Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: Local instance or cloud database (Render, Supabase, AWS RDS, Neon)
- **Git**: Installed and configured

### 1. Clone the Repository
```bash
git clone https://github.com/Parmarsatyam070/Skill--Bridge.git
cd Skill--Bridge
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root based on `.env.example`:
```bash
cp .env.example .env
```

Ensure your `.env` contains the required database connection string and authentication secrets:
```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/skillbridge?schema=public"

# Server Configuration
PORT=5000
NODE_ENV="development"

# JWT Authentication Secrets
JWT_SECRET="your_secure_jwt_access_secret_here"
JWT_REFRESH_SECRET="your_secure_jwt_refresh_secret_here"

# Optional AI Configuration (Google Gemini)
GEMINI_API_KEY="your_gemini_api_key_here"

# Optional Firebase Admin SDK (if using Firebase Auth)
FIREBASE_PROJECT_ID="your_project_id"
FIREBASE_CLIENT_EMAIL="your_service_account_email"
FIREBASE_PRIVATE_KEY="your_private_key"
```

### 4. Setup Database & Prisma Client
Generate the Prisma Client and apply migrations:
```bash
npx prisma generate
npx prisma db push
```

### 5. Seed the Deterministic Evaluator Dataset
Run the dual-run idempotent seed script to populate demo accounts, opportunities, applications, and benchmarks:
```bash
npm run seed:demo
```

### 6. Run the Application
Start the full-stack development environment (launches Express backend on port 5000 and Vite frontend on port 5173):
```bash
npm run dev
```

Open your browser and navigate to:
```text
Frontend: http://localhost:5173
Backend Health: http://localhost:5000/api/health
```

---

## 📜 Available NPM Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `concurrently "npm run dev:server" "npm run dev:client"` | Runs frontend (port 5173) and backend (port 5000) concurrently |
| `npm run build` | `npm run build:client && npm run build:server` | Full production build of client and server |
| `npm run build:client` | `vite build --mode production` | Compiles and tree-shakes frontend assets to `client/dist/` |
| `npm run build:server` | `tsc -p tsconfig.server.json` | Typechecks and compiles backend TypeScript to `dist/` |
| `npm start` | `node dist/server/src/index.js` | Runs the compiled production server |
| `npm test` | `vitest run` | Executes all automated test suites |
| `npm run seed:demo` | `tsx server/src/scripts/seedDemoDataset.ts` | Seeds the deterministic evaluator dataset with Run 1 & Run 2 zero-mutation verification |
| `npm run seed:demo:clean` | `tsx server/src/scripts/cleanDemoDataset.ts` | Safely purges demo records without affecting real or benchmark data |
| `npm run db:seed` | `tsx prisma/seed.ts` | Seeds baseline domains, questions, and skills |
| `npm run seed:industry-demo`| `tsx server/src/scripts/seedIndustryDemo.ts` | Seeds the 410 candidate benchmark dataset |
| `npm run seed:academic-data`| `tsx server/src/scripts/seedAcademicDataset.ts` | Seeds the 150 benchmark academic dataset |

---

## 🔒 Multi-Tenant Security & Isolation

SkillBridge enforces enterprise-grade security standards across all layers:

1. **Tenant Isolation**:
   - **Institutions**: Queries for candidates, recruitment metrics, skill demands, and compliance reports are strictly bounded by `req.user.institutionProfileId`.
   - **Companies**: Requisitions, applications, candidate notes, and collaboration chats are strictly bounded by `req.user.industryProfileId`.
   - Cross-tenant data leakage attempts automatically return `403 Forbidden`.

2. **Authentication & Session Safety**:
   - Short-lived JWT access tokens with secure refresh token rotation.
   - Dual-token support for both standard bcrypt authentication and verified Firebase JWT tokens.
   - Passwords hashed using bcrypt with 10 salt rounds. Passwords and secrets are never exposed in responses or server logs.

3. **PII Redaction in Compliance Reporting**:
   - Institutional compliance exports (JSON, CSV, PDF) contain strictly aggregate totals, percentages, and performance bands. Individual student identities, names, and contact details are excluded by design.

4. **Input Sanitization & Injection Prevention**:
   - Database operations use parameterized Prisma ORM queries, eliminating SQL injection vectors.
   - RFC-4180 CSV export sanitizes values to prevent spreadsheet formula injection.

---

## 📁 Repository Directory Structure

```text
SkillBridge/
├── client/                                 # Frontend React 18 Application
│   ├── src/
│   │   ├── components/                     # Reusable UI & Console Components
│   │   │   ├── academic/                   # Academic analysis & transcript cards
│   │   │   ├── collaborations/             # Partnership modals & discussion threads
│   │   │   ├── industry/                   # Recruiter widgets & candidate tables
│   │   │   ├── intelligence/               # Skill heatmaps & analytics charts
│   │   │   ├── interview/                  # Video interview & proctoring UI
│   │   │   ├── profile/                    # Skill radar, heatmap, domain modals
│   │   │   ├── BridgeLine.tsx              # Signature animated skill-to-job connector
│   │   │   ├── CodingSandbox.tsx           # Multi-language code execution IDE
│   │   │   ├── ConsoleLayout.tsx           # Authenticated dockable navigation console
│   │   │   ├── PublicNavbar.tsx            # Clean marketing navigation header
│   │   │   └── SashWidget.tsx              # Floating Sash AI assistant widget
│   │   ├── context/                        # React Contexts (AuthContext, ThemeContext)
│   │   ├── hooks/                          # Custom React Hooks (useCollaborations, etc.)
│   │   ├── pages/                          # Application Page Views
│   │   │   ├── academician/                # Deprecated/Academic views
│   │   │   ├── assessments/                # Talent assessments & test runner
│   │   │   ├── collaborations/             # Bilateral Collaborations Hub
│   │   │   ├── industry/                   # Recruiter dashboard, applicants, job post
│   │   │   ├── institution/                # Admin candidate explorer, metrics, reports
│   │   │   ├── interviews/                 # AI interview practice & feedback
│   │   │   ├── opportunities/              # Internship hub & detail pages
│   │   │   ├── portfolio/                  # Public portfolio & editor
│   │   │   ├── resumes/                    # AI resume builder & PDF export
│   │   │   ├── student/                    # Student dashboard, applications, performance
│   │   │   ├── LandingPage.tsx             # Public landing page
│   │   │   ├── LoginPage.tsx               # Secure role-aware authentication page
│   │   │   └── RegisterPage.tsx            # Three-persona registration portal
│   │   ├── App.tsx                         # Main client routing & lazy load configurations
│   │   ├── index.css                       # Design tokens, variables & Tailwind CSS
│   │   └── main.tsx                        # Client entry point
│   └── dist/                               # Production build output
│
├── server/                                 # Backend Express.js Server
│   ├── src/
│   │   ├── config/                         # Environment & Prisma client setup
│   │   ├── middleware/                     # JWT authentication, role guards & tenant checks
│   │   ├── routes/                         # REST API Route Handlers
│   │   │   ├── applications.ts             # Application lifecycle & history tracking
│   │   │   ├── auth.ts                     # Login, register, token refresh, OAuth
│   │   │   ├── collaborations.ts           # Partnership CRUD, metrics, messaging
│   │   │   ├── institutions.ts             # Candidate explorer, metrics, compliance
│   │   │   ├── opportunities.ts            # Internship posting & matching endpoints
│   │   │   ├── students.ts                 # Skill scores, radar, daily practice
│   │   │   └── ...                         # Additional domain routers
│   │   ├── scripts/                        # Database management & seed scripts
│   │   │   ├── seedDemoDataset.ts          # Deterministic evaluator dataset seeder
│   │   │   └── cleanDemoDataset.ts         # Targeted demo dataset cleanup script
│   │   ├── services/                       # Authoritative Business Logic Services
│   │   │   ├── candidateExplorerService.ts # Multi-factor search & recommendation engine
│   │   │   ├── collaborationService.ts     # Bilateral partnership lifecycle & metrics
│   │   │   ├── complianceReportService.ts  # NIRF/NAAC/NBA report generator (JSON/CSV/PDF)
│   │   │   ├── recruitmentMetricsService.ts# Cohort placement & funnel analytics
│   │   │   ├── skillDemandAlignmentService.ts# Market demand vs syllabus alignment
│   │   │   └── ...                         # Additional business logic services
│   │   └── index.ts                        # Server entry point & Express bootstrap
│
├── prisma/
│   ├── schema.prisma                       # Complete PostgreSQL Prisma Database Schema
│   └── migrations/                         # Version-controlled SQL migration history
│
├── shared/                                 # Shared TypeScript Types & Contracts
│   ├── types.ts                            # Universal DTOs, Enums, and API interfaces
│   └── validation.ts                       # Shared Zod validation schemas
│
├── tests/                                  # Automated Test Suites
│   ├── demoData.test.ts                    # 23 tests verifying demo dataset & idempotency
│   ├── phase6Collaboration.test.ts         # 18 tests verifying collaboration isolation
│   └── ...                                 # Integration & lifecycle unit tests
│
├── package.json                            # Scripts, dependencies, and project metadata
├── tailwind.config.js                      # Custom design tokens, colors & themes
├── tsconfig.json                           # Client TypeScript configuration
├── tsconfig.server.json                    # Server TypeScript configuration
└── vite.config.ts                          # Vite build & backend proxy configuration
```

---

## 📄 License & Acknowledgments

- **License**: MIT License. Open-source for higher education, research, and non-profit talent development initiatives.
- **Smart India Hackathon**: Developed with pride for the Smart India Hackathon to empower Indian universities, colleges, students, and recruiters with transparent, measurable, and verified technical education.

---

<p align="center">
  <strong>SkillBridge — Verified Intelligence Platform</strong><br>
  <em>Turning unverified student claims into verified, measurable proof.</em>
</p>
