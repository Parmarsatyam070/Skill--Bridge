# SkillBridge — Academia–Industry Collaboration Platform 🌉

SkillBridge is a full-stack web platform designed to bridge the gap between **academic learning and industry requirements**. It connects students, recruiters, academicians, and institutions through skill assessment, personalized learning, career opportunities, AI assistance, and verified portfolios.

Built as a **Smart India Hackathon (SIH)** project.

---

## 🚀 Key Features

### 🎓 Student Career Platform

* Personalized student dashboard
* Skill profile and skill-gap analysis
* Dynamic skill radar visualization
* Domain-specific assessments
* Daily mandatory practice system
* Learning streak tracking
* Accredited course recommendations
* Internship discovery and applications
* Career roadmap
* Resume builder and PDF export
* Verified digital portfolio
* Portfolio contact/inbox system
* AI-powered career assistance

### 🏢 Industry / Recruiter Workspace

* Recruiter dashboard
* Create internship/job opportunities
* Define required skills
* Assign skill importance/weights
* Automatically rank candidates
* Candidate match percentages
* Applicant management workflow
* View candidate skill profiles

### 👨‍🏫 Academician Workspace

* Academician dashboard
* Curriculum alignment & syllabus intelligence
* Cohort placement readiness analytics
* Industry skill benchmark tracking
* Department competency vectors

### 🏫 Institution Admin Workspace

* Institution dashboard
* Student skill analytics
* Batch skill heatmaps
* Placement readiness insights
* Curriculum gap identification
* Skill-demand analysis

---

# 🤖 Sash — AI Career Navigator

SkillBridge includes a context-aware AI assistant called **Sash**.

The assistant can:

* Identify student skill gaps
* Recommend relevant courses
* Explain internship/job match scores
* Draft application notes
* Provide career guidance
* Navigate users to relevant platform sections
* Answer questions using the student's verified profile data

### AI Tools

| Tool                     | Purpose                                                 |
| ------------------------ | ------------------------------------------------------- |
| `get_skill_gaps`         | Finds gaps between current skills and domain benchmarks |
| `recommend_courses`      | Recommends courses for missing skills                   |
| `explain_match_score`    | Explains candidate-job compatibility                    |
| `draft_application_note` | Creates personalized application notes                  |
| `navigate_to`            | Provides context-aware navigation                       |

The platform also contains an offline intelligent engine so core functionality can work without an external AI API.

---

# 📊 Skill Matching Engine

SkillBridge uses a **server-side authoritative matching algorithm** to calculate candidate-job compatibility.

The score considers:

* Student skill score
* Required benchmark
* Recruiter-defined skill weight
* Missing required skills

### Matching Formula

```
Score =
round(
  max(
    0,
    min(
      100,
      (
        weighted skill fulfillment
        - missing skill penalty
      )
    )
  )
)
```

More specifically:

```
weightedFulfillment =
Σ(weight × min(1, studentScore / requiredScore))
÷ Σ(weight)

missingSkillPenalty =
min(10, missingSkillCount × 2.5)

finalScore =
round(
  max(
    0,
    min(
      100,
      weightedFulfillment × 100 - missingSkillPenalty
    )
  )
)
```

### Match Tiers

| Score  | Tier     |
| ------ | -------- |
| 80–100 | 🟢 High   |
| 50–79  | 🟡 Medium |
| 0–49   | 🔴 Low    |

All matching calculations are performed on the **server**, preventing inconsistent client-side calculations.

---

# 📈 Dynamic Skill Radar

Student skill scores are continuously updated based on:

* Assessment performance
* Practice-set results
* Course completion
* Skill improvement
* Inactivity

High assessment accuracy increases the corresponding skill score, while prolonged inactivity can introduce a mild decay.

This allows the student's skill radar to represent a more dynamic view of current readiness.

---

# 🔥 Daily Practice & Streak System

SkillBridge uses a gated streak mechanism.

A user does **not** increase their streak simply by logging into the platform.

Instead:

```
Login
  ↓
Daily Practice
  ↓
Submit Practice Set
  ↓
Record Completion
  ↓
Update Streak
```

This makes the streak represent actual learning activity rather than application usage.

---

# 🌐 Supported Career Domains

SkillBridge currently supports five major career domains:

1. **Full-Stack Web**
2. **AI / Data Science**
3. **Cloud / DevOps**
4. **UI/UX Product Design**
5. **Embedded / IoT**

Each domain has its own:

* Skills
* Benchmarks
* Questions
* Practice sets
* Learning resources
* Career requirements

---

# 🧠 Assessment System

The assessment engine supports multiple question types:

### Multiple Choice Questions

Standard MCQs with:

* Multiple options
* Correct answer
* Explanation
* Skill mapping

### Written Questions

Written responses can be evaluated against an expected answer rubric.

### Coding Questions

Coding assessments support:

* Starter code
* Test cases
* Hidden test cases
* Constraints
* Input format
* Output format
* Automated evaluation

---

# 📚 Learning & Course System

Courses are mapped directly to platform skills.

Completing a course can increase the student's corresponding skill score.

Example:

```
Complete React Course
        ↓
React skill points increase
        ↓
Skill Radar updates
        ↓
Job Match Score recalculates
        ↓
New opportunities may become available
```

Course providers can include platforms such as:

* NPTEL
* SWAYAM
* HCL TechBee
* GUVI
* Coursera
* upGrad

External course links are provided transparently through the platform.

---

# 💼 Internship Matching

Recruiters can create opportunities containing:

* Job title
* Description
* Required skills
* Skill weights
* Minimum skill scores
* Stipend
* Location
* Work mode
* Opportunity status

Students can then receive personalized matching based on their verified skill profile.

Supported work modes include:

```
REMOTE
HYBRID
ON_SITE
```

---

# 🧑‍💻 Portfolio Builder

SkillBridge provides a verified public portfolio system.

Students can create portfolios containing:

* Professional headline
* About section
* Skills
* Projects
* Services
* Achievements
* Education
* Experience
* Contact information

Each portfolio can be published through a public URL/slug.

The public portfolio also supports:

* Recruiter contact messages
* Public AI assistant
* Project showcase
* Professional information
* Print-friendly presentation

---

# 📄 Resume Builder

The platform includes a career-focused resume builder supporting:

* Education
* Experience
* Projects
* Skills
* Achievements
* Certifications
* Responsibilities
* Social profiles

Resume content can be generated/improved using the platform's AI services.

The final resume can be exported as a PDF.

---

# 🎨 Design System

SkillBridge uses two coordinated design systems.

## Campus Palette

Used for public and marketing pages.

Designed to communicate:

* Academia
* Trust
* Professionalism
* Opportunity

## Console Palette

Used for authenticated dashboards.

Designed around:

* Dark workspace interfaces
* High information density
* Developer-console aesthetics
* Data visualization

### Signature UI Element

**Bridge Line**

An animated connector representing a genuine relationship between:

```
Student Skill
      ↕
Industry Requirement
```

It is used to visually communicate meaningful skill-to-opportunity matches.

---

# 🛠️ Tech Stack

## Frontend

* React 18
* TypeScript
* Vite
* React Router
* TanStack React Query
* Tailwind CSS
* Recharts
* Lucide React

## Backend

* Node.js
* Express.js
* TypeScript
* JWT Authentication
* bcryptjs
* Zod
* Multer
* Express Rate Limit

## Database

* SQLite
* Prisma ORM

## Testing

* Vitest

## Other Technologies

* jsPDF
* dotenv
* Concurrently
* PostCSS
* Autoprefixer

---

# 🏗️ Project Architecture

```
SkillBridge/
│
├── client/
│   └── src/
│       ├── components/
│       │   ├── SashWidget.tsx
│       │   ├── BridgeLine.tsx
│       │   ├── CareerRoadmap.tsx
│       │   ├── CodingSandbox.tsx
│       │   ├── ConsoleLayout.tsx
│       │   ├── DailyPracticeBanner.tsx
│       │   ├── MatchBadge.tsx
│       │   ├── SkillRadarCard.tsx
│       │   └── RoleGate.tsx
│       │
│       ├── context/
│       │   └── AuthContext.tsx
│       │
│       ├── pages/
│       │   ├── student/
│       │   ├── industry/
│       │   ├── academician/
│       │   ├── institution/
│       │   ├── portfolio/
│       │   └── resumes/
│       │
│       ├── App.tsx
│       └── index.css
│
├── server/
│   └── src/
│       ├── config/
│       │   └── prisma.ts
│       │
│       ├── middleware/
│       │   └── auth.ts
│       │
│       ├── routes/
│       │   ├── academic.ts
│       │   ├── ai.ts
│       │   ├── applications.ts
│       │   ├── assessments.ts
│       │   ├── auth.ts
│       │   ├── courses.ts
│       │   ├── institutions.ts
│       │   ├── internships.ts
│       │   ├── notifications.ts
│       │   ├── portfolios.ts
│       │   ├── resources.ts
│       │   ├── resumes.ts
│       │   └── students.ts
│       │
│       ├── services/
│       │   ├── aiAssistant.ts
│       │   ├── assessmentService.ts
│       │   ├── codeRunnerService.ts
│       │   ├── learningResourceService.ts
│       │   ├── matchingEngine.ts
│       │   ├── notificationService.ts
│       │   ├── portfolioService.ts
│       │   ├── resumeService.ts
│       │   ├── skillEngine.ts
│       │   ├── streakService.ts
│       │   └── tokenService.ts
│       │
│       └── index.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── shared/
│   ├── types.ts
│   └── validation.ts
│
├── tests/
│   ├── apiFlows.test.ts
│   ├── assessmentSystem.test.ts
│   ├── auth.test.ts
│   ├── dailyPracticeAndRadarDecay.test.ts
│   ├── domainFlows.test.ts
│   ├── matchingEngine.test.ts
│   └── portfolioBuilder.test.ts
│
├── package.json
├── tsconfig.json
├── tsconfig.server.json
├── vite.config.ts
└── README.md
```

---

# 🔐 Security

SkillBridge implements several security mechanisms:

* Password hashing using bcrypt
* JWT access tokens
* JWT refresh tokens
* Role-Based Access Control
* Authentication middleware
* Request validation using Zod
* Authentication rate limiting
* Protected API routes
* Environment-based configuration

### Important

Never commit your real `.env` file or API keys to GitHub.

Use:

```
.env.example
```

as the template for environment configuration.

---

# ⚙️ Installation & Setup

## Prerequisites

Make sure you have:

* Node.js 18+
* npm 9+
* Git

Check versions:

```bash
node --version
npm --version
git --version
```

---

## 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Move into the project:

```bash
cd sih-project
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file:

```bash
copy .env.example .env
```

For macOS/Linux:

```bash
cp .env.example .env
```

Configure the required values in `.env`.

Example:

```env
DATABASE_URL="file:./dev.db"
PORT=5000
JWT_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
NODE_ENV="development"
```

Optional AI configuration:

```env
GEMINI_API_KEY=""
OPENAI_API_KEY=""
```

---

# 🗄️ Database Setup

Generate Prisma Client:

```bash
npx prisma generate
```

Create/update the SQLite database:

```bash
npx prisma db push
```

Seed the database:

```bash
npm run db:seed
```

The seed process creates the initial:

* Domains
* Skills
* Skill benchmarks
* Questions
* Practice sets
* Courses
* Users
* Internships
* Learning resources
* Demo data

---

# ▶️ Run the Application

Start both frontend and backend:

```bash
npm run dev
```

The application will run at:

```
Frontend:
http://localhost:3000

Backend:
http://localhost:5000
```

The Vite development server proxies API requests to the Express backend.

---

# 🧪 Testing

Run the complete test suite:

```bash
npm test
```

The tests cover areas including:

* Authentication
* Authorization
* API flows
* Daily practice
* Streak logic
* Skill radar updates
* Skill decay
* Matching engine
* Domain-specific intelligence
* Portfolio builder
* AI assistant functionality

---

# 🏭 Production Build

Build both frontend and backend:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

---

# 👥 User Roles

SkillBridge supports four major user roles.

| Role              | Purpose                                                 |
| ----------------- | ------------------------------------------------------- |
| STUDENT           | Build skills, learn, apply for opportunities            |
| INDUSTRY          | Create opportunities and find candidates                |
| ACADEMICIAN       | Participate in academic-industry collaboration          |
| INSTITUTION_ADMIN | Analyze institution-level skill and placement readiness |

---

# 🔄 Core Platform Flow

```
                    ┌────────────────────┐
                    │      Student       │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ Skill Assessment   │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │   Skill Radar      │
                    │   & Skill Gaps     │
                    └─────────┬──────────┘
                              │
                  ┌───────────┴───────────┐
                  ▼                       ▼
        ┌─────────────────┐     ┌─────────────────┐
        │ Recommended     │     │ Career /        │
        │ Courses         │     │ Internships     │
        └────────┬────────┘     └────────┬────────┘
                 │                       │
                 ▼                       ▼
        ┌─────────────────┐     ┌─────────────────┐
        │ Skill Score     │     │ Matching Engine │
        │ Improvement     │────▶│                │
        └─────────────────┘     └────────┬────────┘
                                         │
                                         ▼
                                ┌─────────────────┐
                                │ Recruiter /     │
                                │ Industry        │
                                └─────────────────┘
```

---

# 📌 Why SkillBridge?

Traditional education platforms generally focus on completing courses, while recruitment platforms focus on vacancies.

SkillBridge connects these two worlds.

```
Academic Learning
       ↓
Skill Assessment
       ↓
Verified Skill Profile
       ↓
Skill Gap Identification
       ↓
Personalized Learning
       ↓
Improved Skills
       ↓
Industry Matching
       ↓
Career Opportunity
```

This creates a continuous **Learn → Measure → Improve → Match → Apply** ecosystem.

---

# 🎯 Smart India Hackathon Relevance

SkillBridge addresses the academia-industry skill gap by providing a unified platform for:

* Student skill development
* Industry-aligned benchmarks
* Personalized learning
* Internship matching
* Recruiter candidate discovery
* Institutional analytics
* Academic-industry collaboration
* AI-powered career guidance

The platform aims to make student readiness **measurable, actionable, and connected to real industry requirements**.

---

# 📄 License

This project was developed as part of a Smart India Hackathon project.

---

## 🌉 SkillBridge

**Learn. Measure. Improve. Connect.**

Bridging the gap between **academia and industry**, one skill at a time.
