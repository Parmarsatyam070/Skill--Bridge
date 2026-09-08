# Phase 8 — Intelligence Dashboards Documentation

## 1. Executive Summary

Phase 8 introduces the **Intelligence Dashboard Layer** to SkillBridge, transforming transactional data across opportunities, applications, candidate matches, verified skills, assessments, and interviews into deterministic, actionable intelligence for two primary stakeholders:

1. **Industry Recruiters (`INDUSTRY`)** — Available at `/industry/intelligence`: Real-time recruitment funnels, candidate skill supply vs. market demand ratios, assessment performance benchmarks, interview analytics, and opportunity conversion rates.
2. **Academic Institution Administrators (`INSTITUTION_ADMIN`)** — Available at `/institution/intelligence`: Institutional skill gap analysis benchmarked against live industry demand, student coverage metrics, privacy-safe affected student rosters, and curated curriculum/diagnostic interventions.

---

## 2. Core Architectural & Safety Principles

### 2.1 Deterministic Calculations as Ground Truth
All dashboard metrics, funnels, skill coverages, and conversion rates are computed strictly from real database records using deterministic algorithms. No synthetic or interpolated metrics exist.

### 2.2 Strict Multi-Tenancy Isolation
- **Industry Scope**: Every query is strictly bounded by `req.user.industryProfileId`. Recruiters cannot view candidates, opportunities, or applications from other companies.
- **Institution Scope**: Every query is strictly bounded by `req.user.institutionProfileId`. The server resolves the authenticated user's `InstitutionProfile.institutionName` directly from the database and scopes queries to `StudentProfile.institution` matching that name. Client-supplied parameters cannot alter or override this tenant boundary.

### 2.3 Strict Role Governance
- Industry Intelligence endpoints are protected by `requireStrictIndustryRole`.
- Institution Intelligence endpoints are protected by `requireStrictInstitutionRole`.
- Generic synthetic roles (e.g. `RECRUITER` or `INSTITUTION`) are prohibited.
- `ADMIN` role is not granted implicit cross-tenant visibility into private organizational intelligence.

### 2.4 Zero Fake Data Guarantee
When no activity exists (e.g. a newly registered company or college), the system returns clean zeros and empty arrays. The UI renders high-polish empty states rather than simulated historical charts.

### 2.5 Authoritative Skill Thresholds
- `SKILL_COVERAGE_THRESHOLD = 60`: Minimum verified score for a student to be considered as having foundational coverage of a skill.
- `SKILL_PROFICIENCY_BENCHMARK = 70`: Standard proficiency benchmark for advanced role readiness (aligning with `OpportunitySkill.minScore`).

---

## 3. Hiring Funnel Mapping

Funnel analytics strictly map real `Application.status` enum values from `prisma/schema.prisma` without modifying database state:

| Funnel Stage | Included Application Statuses | Description |
| :--- | :--- | :--- |
| **Stage 1: Applied** | All records (`applied`, `under_review`, `shortlisted`, `assessment`, `interview`, `hired`, `rejected`) | Total initial submissions |
| **Stage 2: Screening** | `under_review`, `shortlisted`, `assessment`, `interview`, `hired` | Applications advanced past initial triage |
| **Stage 3: Shortlisted** | `shortlisted`, `assessment`, `interview`, `hired` | Qualified candidates marked for evaluation |
| **Stage 4: Interview** | `interview`, `hired` | Candidates actively interviewing |
| **Stage 5: Hired** | `hired` | Successfully extended and accepted offers |

---

## 4. Skill Demand Snapshot Service

To support historical trending without synthetic generation, the `SkillDemandSnapshotService` runs deterministic, idempotent monthly aggregations:
- **Snapshot Key**: Unique composite index `@@unique([skillName, snapshotDate])` where `snapshotDate` is formatted as `YYYY-MM`.
- **Trend Computation**: Compares current open opportunity requirements against the previous month (`YYYY-MM`) snapshot. Evaluates trend as `GROWING`, `DECLINING`, `STABLE`, or `EMERGING`.
- **Maintenance Endpoint**: `POST /api/intelligence/snapshots/generate`.

---

## 5. Advisory AI Safety Architecture

1. **Read-Only Operation**: AI services (`generateIndustryAiSummary`, `generateInstitutionAiRecommendations`) are purely analytical. They have zero database write permissions.
2. **Deterministic Inputs**: The LLM prompt is constructed exclusively from deterministic data already queried and verified from the database.
3. **Zod Validation**: Responses are validated against `IntelligenceAiInsightSchema`. Any invalid or malformed output triggers a deterministic fallback.
4. **Mandatory Disclaimer**: Every AI insight object contains:
   > *"This is an AI-generated advisory analysis based on aggregate platform data. All strategic, hiring, and curricular decisions must be verified by humans. AI insights do not alter platform records or guarantee specific outcomes."*
5. **Rate Limiting & Abuse Prevention**:
   - `aiRateLimiter`: Enforces 20 requests/minute per user.
   - `validateAiInput(3000)`: Enforces a 3,000-character payload cap.

---

## 6. API Reference

### 6.1 Industry Intelligence (`/api/intelligence/industry`)

| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `GET` | `/industry/overview` | Returns KPIs: active roles, applications, shortlisted, hires, conversion rate | `requireStrictIndustryRole` |
| `GET` | `/industry/funnel` | Returns deterministic 5-stage recruitment funnel (optional `?opportunityId=`) | `requireStrictIndustryRole` |
| `GET` | `/industry/opportunities` | Paginated performance breakdown per opportunity | `requireStrictIndustryRole` |
| `GET` | `/industry/skills` | Aggregated required skills vs. platform candidate supply | `requireStrictIndustryRole` |
| `GET` | `/industry/assessments` | Submissions, average scores, and pass rates for company assessments | `requireStrictIndustryRole` |
| `GET` | `/industry/interviews` | Interview completion rates, type, and recommendation distributions | `requireStrictIndustryRole` |
| `GET` | `/industry/trends` | 6-month monthly application and opportunity volume trends | `requireStrictIndustryRole` |
| `POST` | `/industry/ai-summary` | Advisory executive summary generated from live stats | `requireStrictIndustryRole`, `aiRateLimiter` |

### 6.2 Institution Intelligence (`/api/intelligence/institution`)

| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `GET` | `/institution/overview` | Returns cohort KPIs: enrolled, verified badges, market demand, gaps | `requireStrictInstitutionRole` |
| `GET` | `/institution/skills` | Gap comparison: industry demand vs. student cohort coverage | `requireStrictInstitutionRole` |
| `GET` | `/institution/affected-students` | Privacy-safe paginated list of students affected by a specific gap | `requireStrictInstitutionRole` |
| `GET` | `/institution/interventions` | Real database courses, resources, and assessments for gap remediation | `requireStrictInstitutionRole` |
| `GET` | `/institution/trends` | 6-month cohort score progression and gap trends | `requireStrictInstitutionRole` |
| `POST` | `/institution/ai-recommendations`| Advisory curriculum guidance generated from cohort metrics | `requireStrictInstitutionRole`, `aiRateLimiter` |

---

## 7. Protected Modules Intact

Phase 8 was constructed with zero modifications to protected systems:
- Legacy Practice Assessment system (`/assessment`, `PracticeSet`, `AssessmentAttempt`)
- Talent Assessment system (`/assessments`, `Assessment`, `AssessmentQuestion`, `AssessmentSubmission`)
- Opportunity 7-factor matcher (`40/20/10/10/10/5/5`)
- Internship 3-pillar matcher (`40/30/30`)
- AI Interview system (`/interviews`, `InterviewSession`)
- Recruiter Copilot (`/api/recruiter-copilot`)
- Collaboration Management UI (`/collaborations`, `Collaboration`)
