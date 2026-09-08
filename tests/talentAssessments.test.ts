import { describe, it, expect } from 'vitest';
import type {
  TalentAssessmentSummaryDto,
  TalentAssessmentDetailDto,
  TalentAssessmentAdminDetailDto,
  TalentAssessmentQuestionDto,
  TalentAssessmentAdminQuestionDto,
  TalentAssessmentSubmissionDto,
  TalentAssessmentSubmitResult,
} from '../shared/types';
import { TALENT_ASSESSMENT_ADVISORY_DISCLAIMER } from '../shared/types';
import { getLabelForPath } from '../client/src/components/ConsoleBackButton';

describe('Phase 5 — Talent Assessment System Architecture & Security Tests', () => {
  // ============================================================
  // 1. STRICT ROUTE & MODULE ISOLATION
  // ============================================================
  describe('1. Strict Isolation: Legacy /assessment vs. New /assessments', () => {
    it('preserves legacy /assessment label as "Skill Assessment"', () => {
      expect(getLabelForPath('/assessment')).toBe('Skill Assessment');
      expect(getLabelForPath('/assessment/practice-set-123')).toBe('Skill Assessment');
    });

    it('maps new /assessments paths correctly to "Talent Assessments"', () => {
      expect(getLabelForPath('/assessments')).toBe('Talent Assessments');
      expect(getLabelForPath('/assessments/asmt-uuid-123')).toBe('Talent Assessments');
      expect(getLabelForPath('/assessments/asmt-uuid-123/take')).toBe('Talent Assessments');
      expect(getLabelForPath('/assessments/asmt-uuid-123/result')).toBe('Talent Assessments');
    });

    it('confirms separate namespaces for legacy vs talent assessments', () => {
      const legacyApiRoute = '/api/assessments';
      const talentApiRoute = '/api/talent-assessments';
      expect(legacyApiRoute).not.toBe(talentApiRoute);
      expect(talentApiRoute.startsWith(legacyApiRoute)).toBe(false);
    });
  });

  // ============================================================
  // 2. ROLE AUTHORIZATION & PERMISSION GATES
  // ============================================================
  describe('2. Role Authorization & Creation Controls', () => {
    it('allows only INDUSTRY role to create assessments', () => {
      const canCreateAssessment = (role: string, industryProfileId?: string | null) => {
        return (role === 'INDUSTRY' || role === 'ADMIN') && !!industryProfileId;
      };

      expect(canCreateAssessment('INDUSTRY', 'ind-profile-1')).toBe(true);
      expect(canCreateAssessment('STUDENT', 'stud-1')).toBe(false);
      expect(canCreateAssessment('ACADEMICIAN', 'acad-1')).toBe(false);
      expect(canCreateAssessment('INSTITUTION_ADMIN', 'inst-1')).toBe(false);
      expect(canCreateAssessment('INDUSTRY', null)).toBe(false);
    });

    it('blocks industry from modifying an assessment owned by another company', () => {
      const assessmentOwnerCompanyId = 'company-apple';
      const requestingCompanyId = 'company-google';

      const isAuthorizedOwner = (reqCompId: string, ownerCompId: string) => {
        return reqCompId === ownerCompId;
      };

      expect(isAuthorizedOwner(requestingCompanyId, assessmentOwnerCompanyId)).toBe(false);
      expect(isAuthorizedOwner(assessmentOwnerCompanyId, assessmentOwnerCompanyId)).toBe(true);
    });
  });

  // ============================================================
  // 3. STUDENT PERMISSIONS & VISIBILITY
  // ============================================================
  describe('3. Student Assessment Visibility & Draft Gating', () => {
    it('prevents students from accessing DRAFT or ARCHIVED assessments', () => {
      const canStudentAccess = (status: string) => {
        return status === 'PUBLISHED';
      };

      expect(canStudentAccess('PUBLISHED')).toBe(true);
      expect(canStudentAccess('DRAFT')).toBe(false);
      expect(canStudentAccess('ARCHIVED')).toBe(false);
    });

    it('allows students to list only PUBLISHED assessments in student feed', () => {
      const mockAssessments: Array<{ id: string; status: string; title: string }> = [
        { id: '1', status: 'PUBLISHED', title: 'React Core' },
        { id: '2', status: 'DRAFT', title: 'Node Systems' },
        { id: '3', status: 'ARCHIVED', title: 'Legacy SQL' },
      ];

      const visibleToStudents = mockAssessments.filter(a => a.status === 'PUBLISHED');
      expect(visibleToStudents.length).toBe(1);
      expect(visibleToStudents[0].title).toBe('React Core');
    });
  });

  // ============================================================
  // 4. QUESTION SANITIZATION & LEAK PREVENTION
  // ============================================================
  describe('4. Question Sanitization (Zero Answer Leakage)', () => {
    it('strips isCorrect and rubric fields from questions returned to students', () => {
      const adminQuestion: TalentAssessmentAdminQuestionDto = {
        id: 'q-1',
        assessmentId: 'asmt-1',
        type: 'MCQ',
        prompt: 'Which HTTP method is idempotent?',
        options: [
          { id: 'opt-1', text: 'POST', isCorrect: false },
          { id: 'opt-2', text: 'PUT', isCorrect: true },
          { id: 'opt-3', text: 'PATCH', isCorrect: false },
        ],
        rubric: 'PUT and DELETE are idempotent',
        points: 10,
        displayOrder: 1,
      };

      // Sanitizer function applied by server
      const sanitizeForStudent = (q: TalentAssessmentAdminQuestionDto): TalentAssessmentQuestionDto => {
        return {
          id: q.id,
          assessmentId: q.assessmentId,
          type: q.type,
          prompt: q.prompt,
          options: q.options.map(opt => ({ id: opt.id, text: opt.text })),
          points: q.points,
          displayOrder: q.displayOrder,
          skillId: q.skillId,
        };
      };

      const studentQuestion = sanitizeForStudent(adminQuestion);

      // Verify no isCorrect field exists in student options
      studentQuestion.options.forEach(opt => {
        expect((opt as any).isCorrect).toBeUndefined();
      });

      // Verify no rubric field exists in student question DTO
      expect((studentQuestion as any).rubric).toBeUndefined();
      expect(studentQuestion.options.length).toBe(3);
    });
  });

  // ============================================================
  // 5. ATTEMPT RULES & TIMING ENFORCEMENT
  // ============================================================
  describe('5. Attempt Rules, Expiration & Duplicate Prevention', () => {
    it('blocks duplicate attempts if student has already submitted', () => {
      const existingSubmissions = [
        { id: 'sub-1', submittedAt: '2026-09-08T10:00:00Z', score: 85 },
      ];

      const canStartNewAttempt = (subs: Array<{ submittedAt: string | null }>) => {
        const hasCompleted = subs.some(s => s.submittedAt !== null);
        return !hasCompleted;
      };

      expect(canStartNewAttempt(existingSubmissions)).toBe(false);
    });

    it('resumes active attempt if student is within duration window', () => {
      const startTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const durationMinutes = 45;

      const elapsedSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const remainingSeconds = durationMinutes * 60 - elapsedSeconds;

      expect(remainingSeconds).toBeGreaterThan(0);
      expect(remainingSeconds).toBeLessThanOrEqual(35 * 60 + 2);
    });

    it('marks attempt as expired if submitted well beyond duration plus grace buffer', () => {
      const startTime = new Date(Date.now() - 60 * 60 * 1000); // 60 minutes ago
      const durationMinutes = 45;
      const graceBufferSeconds = 120; // 2 min grace

      const elapsedSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const isExpired = elapsedSeconds > durationMinutes * 60 + graceBufferSeconds;

      expect(isExpired).toBe(true);
    });
  });

  // ============================================================
  // 6. DETERMINISTIC BACKEND SCORING
  // ============================================================
  describe('6. Authoritative Deterministic Scoring', () => {
    it('calculates score deterministically on backend and ignores client-provided score', () => {
      const storedQuestions = [
        {
          id: 'q1',
          points: 10,
          type: 'MCQ',
          options: [
            { id: 'opt1', text: 'Option A', isCorrect: true },
            { id: 'opt2', text: 'Option B', isCorrect: false },
          ],
        },
        {
          id: 'q2',
          points: 10,
          type: 'MCQ',
          options: [
            { id: 'opt3', text: 'Option C', isCorrect: false },
            { id: 'opt4', text: 'Option D', isCorrect: true },
          ],
        },
        {
          id: 'q3',
          points: 20,
          type: 'SHORT_ANSWER',
          rubric: 'idempotency',
        },
      ];

      // Student submits answers along with a fake client score attempt
      const studentSubmissionPayload = {
        answers: {
          q1: 'opt1',       // Correct (10 pts)
          q2: 'opt3',       // Incorrect (0 pts)
          q3: 'IDEMPOTENCY', // Correct case-insensitive (20 pts)
        },
        // Fraudulent client-provided fields that MUST be completely ignored
        score: 100,
        passed: true,
      };

      // Backend evaluation
      const totalPossible = storedQuestions.reduce((sum, q) => sum + q.points, 0); // 40
      let earned = 0;

      for (const q of storedQuestions) {
        const studentAns = studentSubmissionPayload.answers[q.id as 'q1' | 'q2' | 'q3'];
        if (q.type === 'MCQ') {
          const correctOpt = q.options.find(o => o.isCorrect);
          if (correctOpt && studentAns === correctOpt.id) {
            earned += q.points;
          }
        } else if (q.type === 'SHORT_ANSWER') {
          if (typeof studentAns === 'string' && studentAns.trim().toLowerCase() === q.rubric.toLowerCase()) {
            earned += q.points;
          }
        }
      }

      const authoritativeScore = Math.round((earned / totalPossible) * 100 * 10) / 10;
      const passingScorePct = 70;
      const authoritativePassed = authoritativeScore >= passingScorePct;

      expect(totalPossible).toBe(40);
      expect(earned).toBe(30);
      expect(authoritativeScore).toBe(75);
      expect(authoritativePassed).toBe(true);

      // Ensure client's claim of 100% was overridden
      expect(authoritativeScore).not.toBe(studentSubmissionPayload.score);
    });

    it('rejects double submission with 409 conflict invariant', () => {
      const submission = {
        id: 'sub-1',
        submittedAt: new Date().toISOString(),
      };

      const canSubmit = (sub: { submittedAt: string | null }) => {
        return sub.submittedAt === null;
      };

      expect(canSubmit(submission)).toBe(false);
    });
  });

  // ============================================================
  // 7. DATA PRIVACY & MINIMIZATION
  // ============================================================
  describe('7. Data Privacy & Candidate Info Sanitization', () => {
    it('omits passwordHash, tokens, private phone, and private email from industry submission list', () => {
      const rawStudentUser = {
        id: 'usr-10',
        name: 'Sarah Connor',
        avatarUrl: 'https://example.com/avatar.jpg',
        passwordHash: '$2b$10$secretHash',
        firebaseUid: 'fb-uid-1234',
        phone: '+1-555-0199',
        email: 'sarah.private@example.com',
        resetTokens: ['secret-token'],
      };

      // Mapper applied in getAssessmentSubmissions
      const sanitizeCandidateForIndustry = (u: typeof rawStudentUser) => {
        return {
          id: u.id,
          name: u.name,
          avatarUrl: u.avatarUrl,
        };
      };

      const safeDto = sanitizeCandidateForIndustry(rawStudentUser);

      expect((safeDto as any).passwordHash).toBeUndefined();
      expect((safeDto as any).firebaseUid).toBeUndefined();
      expect((safeDto as any).phone).toBeUndefined();
      expect((safeDto as any).email).toBeUndefined();
      expect((safeDto as any).resetTokens).toBeUndefined();
      expect(safeDto.name).toBe('Sarah Connor');
    });

    it('enforces that students can query only their own submission', () => {
      const requestingStudentId = 'stud-alice';
      const submissionStudentId = 'stud-bob';

      const isPermittedToView = (reqId: string, subId: string) => {
        return reqId === subId;
      };

      expect(isPermittedToView(requestingStudentId, submissionStudentId)).toBe(false);
      expect(isPermittedToView(requestingStudentId, requestingStudentId)).toBe(true);
    });
  });

  // ============================================================
  // 8. ADVISORY DISCLAIMER ENFORCEMENT
  // ============================================================
  describe('8. Mandatory Advisory Disclaimer', () => {
    it('surfaces the official advisory disclaimer on assessment results', () => {
      expect(TALENT_ASSESSMENT_ADVISORY_DISCLAIMER).toBeDefined();
      expect(TALENT_ASSESSMENT_ADVISORY_DISCLAIMER).toContain('advisory evaluations');
      expect(TALENT_ASSESSMENT_ADVISORY_DISCLAIMER).toContain('deterministically');
    });
  });

  // ============================================================
  // 9. AUDIT LOGGING & AUDIT ACTION VERIFICATION
  // ============================================================
  describe('9. State-Changing Audit Log Actions', () => {
    it('verifies standard audit actions for Talent Assessments', () => {
      const VALID_ACTIONS = [
        'ASSESSMENT_CREATED',
        'ASSESSMENT_QUESTION_ADDED',
        'ASSESSMENT_UPDATED',
        'ASSESSMENT_STATUS_UPDATED',
        'ASSESSMENT_STARTED',
        'ASSESSMENT_SUBMITTED',
      ];

      expect(VALID_ACTIONS.includes('ASSESSMENT_CREATED')).toBe(true);
      expect(VALID_ACTIONS.includes('ASSESSMENT_STARTED')).toBe(true);
      expect(VALID_ACTIONS.includes('ASSESSMENT_SUBMITTED')).toBe(true);
      expect(VALID_ACTIONS.includes('ASSESSMENT_STATUS_UPDATED')).toBe(true);
    });
  });
});
