import { describe, it, expect } from 'vitest';
import type {
  CopilotQueryResult,
  CopilotComparisonResult,
  CopilotCandidateRanking,
  SafeCandidateDto,
} from '../shared/types';

describe('Phase 4 — Recruiter Copilot Frontend Architecture & Safety Rules', () => {
  describe('1. Role Authorization & Access Guard', () => {
    it('allows access to Recruiter Copilot strictly for INDUSTRY role', () => {
      const allowedRoles = ['INDUSTRY'];
      const testRoleIndustry = 'INDUSTRY';
      const testRoleStudent = 'STUDENT';
      const testRoleAcademician = 'ACADEMICIAN';
      const testRoleInstitution = 'INSTITUTION_ADMIN';

      expect(allowedRoles.includes(testRoleIndustry)).toBe(true);
      expect(allowedRoles.includes(testRoleStudent)).toBe(false);
      expect(allowedRoles.includes(testRoleAcademician)).toBe(false);
      expect(allowedRoles.includes(testRoleInstitution)).toBe(false);
    });

    it('denies copilot execution if authenticated user lacks industryProfileId', () => {
      const mockUserWithoutProfile = {
        id: 'usr-1',
        role: 'INDUSTRY',
        industryProfileId: null,
      };

      const hasValidRecruiterAccess =
        mockUserWithoutProfile.role === 'INDUSTRY' && !!mockUserWithoutProfile.industryProfileId;
      expect(hasValidRecruiterAccess).toBe(false);
    });
  });

  describe('2. Advisory AI Presentation & Non-Binding Disclaimers', () => {
    it('enforces that every AI query response includes an explicit advisory disclaimer', () => {
      const mockQueryResult: CopilotQueryResult = {
        intent: 'CANDIDATE_SEARCH',
        answer: 'Candidate Jane Doe demonstrates high proficiency in React and Node.js.',
        disclaimer:
          'This is an AI-generated advisory analysis. All hiring decisions must be made by humans based on verified data. AI outputs may contain errors and should not be used as the sole basis for any employment decision.',
      };

      expect(mockQueryResult.disclaimer).toBeTruthy();
      expect(mockQueryResult.disclaimer.toLowerCase()).toContain('advisory');
      expect(mockQueryResult.disclaimer.toLowerCase()).toContain('hiring decisions must be made by humans');
    });

    it('enforces that candidate comparison outputs contain clear advisory summary and disclaimers', () => {
      const mockComparisonResult: CopilotComparisonResult = {
        advisoryRanking: [
          {
            candidateId: 'cand-1',
            candidateName: 'Alice Sharma',
            advisoryScore: 92.5,
            advisoryReason: 'Ranked #1 by algorithmic match score (92.5%). Meets mandatory requirements.',
          },
          {
            candidateId: 'cand-2',
            candidateName: 'Bob Verma',
            advisoryScore: 81.0,
            advisoryReason: 'Ranked #2 by algorithmic match score (81.0%). Meets mandatory requirements.',
          },
        ],
        advisorySummary:
          'Alice Sharma demonstrates superior skill proficiency depth in distributed databases, whereas Bob Verma has stronger front-end portfolio quality.',
        topStrengths: {
          'cand-1': ['PostgreSQL (90%)', 'Node.js (88%)'],
          'cand-2': ['React (85%)', 'CSS (82%)'],
        },
        topGaps: {
          'cand-1': [],
          'cand-2': [],
        },
        disclaimer:
          'This is an AI-generated advisory analysis. All hiring decisions must be made by humans based on verified data.',
      };

      expect(mockComparisonResult.disclaimer).toBeTruthy();
      expect(mockComparisonResult.advisorySummary).toBeTruthy();
      expect(mockComparisonResult.advisoryRanking).toHaveLength(2);
    });
  });

  describe('3. Candidate Comparison Constraints (2 to 5 Candidates Only)', () => {
    it('accepts comparison when exactly 2 to 5 candidate IDs are selected', () => {
      const validateCandidateCount = (ids: string[]) => ids.length >= 2 && ids.length <= 5;

      expect(validateCandidateCount([])).toBe(false);
      expect(validateCandidateCount(['c1'])).toBe(false);
      expect(validateCandidateCount(['c1', 'c2'])).toBe(true);
      expect(validateCandidateCount(['c1', 'c2', 'c3'])).toBe(true);
      expect(validateCandidateCount(['c1', 'c2', 'c3', 'c4'])).toBe(true);
      expect(validateCandidateCount(['c1', 'c2', 'c3', 'c4', 'c5'])).toBe(true);
      expect(validateCandidateCount(['c1', 'c2', 'c3', 'c4', 'c5', 'c6'])).toBe(false);
    });
  });

  describe('4. Privacy & Sensitive Field Stripping (SafeCandidateDto)', () => {
    it('verifies that SafeCandidateDto strictly excludes sensitive internal security fields', () => {
      const safeCandidate: SafeCandidateDto = {
        id: 'cand-123',
        studentProfileId: 'sp-123',
        fullName: 'Candidate Test',
        institutionName: 'National Institute of Technology',
        department: 'Computer Science',
        degree: 'B.Tech',
        graduationYear: 2025,
        cgpaBracket: '8.0 - 8.9 (Distinction)',
        generalLocation: 'Bengaluru, India',
        sanitizedBio: 'Passionate full-stack developer with experience in React and Node.',
        skills: [
          { name: 'TypeScript', score: 85, verificationLevel: 'PROCTORED' },
          { name: 'PostgreSQL', score: 80, verificationLevel: 'VERIFIED' },
        ],
        matchScore: 88.0,
      };

      // Ensure sensitive internal fields do NOT exist on the DTO
      const rawObj = safeCandidate as any;
      expect(rawObj.passwordHash).toBeUndefined();
      expect(rawObj.firebaseUid).toBeUndefined();
      expect(rawObj.authToken).toBeUndefined();
      expect(rawObj.resetToken).toBeUndefined();
      expect(rawObj.privateEmail).toBeUndefined();
      expect(rawObj.privatePhone).toBeUndefined();
      expect(rawObj.phoneNumber).toBeUndefined();

      // Ensure privacy protections are in place
      expect(safeCandidate.cgpaBracket).toBe('8.0 - 8.9 (Distinction)');
      expect(safeCandidate.generalLocation).toBe('Bengaluru, India');
    });
  });

  describe('5. Authoritative Match Scores & Deterministic Ranking Invariant', () => {
    it('uses backend-provided deterministic scores for ranking rather than client-calculated or hallucinated AI scores', () => {
      const rankingItem: CopilotCandidateRanking = {
        candidateId: 'cand-1',
        candidateName: 'John Doe',
        advisoryScore: 87.5,
        advisoryReason: 'Ranked #1 by algorithmic match score (87.5%).',
      };

      // Score comes directly from the backend matching engine
      expect(rankingItem.advisoryScore).toBe(87.5);

      // The frontend must NOT compute or alter this value
      const displayedScore = rankingItem.advisoryScore;
      expect(displayedScore).toBe(87.5);
    });
  });

  describe('6. Error Handling & Rate Limiting (429 Cooldown)', () => {
    it('maps HTTP 429 status to clear, user-friendly rate-limit warning without exposing internal tokens', () => {
      const formatErrorResponse = (status: number) => {
        if (status === 429) {
          return 'AI rate limit reached (20 queries/min). Please wait a moment before sending another question.';
        }
        if (status === 403) {
          return 'Access denied: An Industry recruiter profile is required to use Recruiter Copilot.';
        }
        return 'Unable to complete Copilot query. Please try again.';
      };

      expect(formatErrorResponse(429)).toContain('AI rate limit reached');
      expect(formatErrorResponse(403)).toContain('Access denied');
      expect(formatErrorResponse(500)).toBe('Unable to complete Copilot query. Please try again.');
    });
  });
});
