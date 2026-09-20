import { describe, it, expect } from 'vitest';
import {
  normalizeStatus,
  toLegacyStatus,
  getStatusLabel,
  validateStatusTransition,
  calculateStageDuration,
} from '../server/src/services/applicationLifecycleService';

describe('Phase 1 — Application Lifecycle Tracker Architecture & Invariants', () => {
  describe('Status Normalization & Legacy Compatibility Mapping', () => {
    it('normalizes canonical and legacy statuses to uppercase canonical tokens', () => {
      expect(normalizeStatus('applied')).toBe('APPLIED');
      expect(normalizeStatus('under_review')).toBe('UNDER_REVIEW');
      expect(normalizeStatus('shortlisted')).toBe('SHORTLISTED');
      expect(normalizeStatus('interview')).toBe('INTERVIEW_SCHEDULED');
      expect(normalizeStatus('interview_scheduled')).toBe('INTERVIEW_SCHEDULED');
      expect(normalizeStatus('interview_completed')).toBe('INTERVIEW_COMPLETED');
      expect(normalizeStatus('offered')).toBe('OFFERED');
      expect(normalizeStatus('hired')).toBe('ACCEPTED');
      expect(normalizeStatus('accepted')).toBe('ACCEPTED');
      expect(normalizeStatus('rejected')).toBe('REJECTED');
      expect(normalizeStatus('withdrawn')).toBe('WITHDRAWN');
      expect(normalizeStatus('on_hold')).toBe('ON_HOLD');
    });

    it('maps canonical statuses back to legacy compatibility statuses', () => {
      expect(toLegacyStatus('APPLIED')).toBe('applied');
      expect(toLegacyStatus('UNDER_REVIEW')).toBe('under_review');
      expect(toLegacyStatus('SHORTLISTED')).toBe('shortlisted');
      expect(toLegacyStatus('INTERVIEW_SCHEDULED')).toBe('interview');
      expect(toLegacyStatus('ACCEPTED')).toBe('hired');
      expect(toLegacyStatus('OFFERED')).toBe('offered');
      expect(toLegacyStatus('REJECTED')).toBe('rejected');
      expect(toLegacyStatus('WITHDRAWN')).toBe('withdrawn');
    });

    it('returns human-readable labels for any format', () => {
      expect(getStatusLabel('applied')).toBe('Applied');
      expect(getStatusLabel('SHORTLISTED')).toBe('Shortlisted');
      expect(getStatusLabel('interview')).toBe('Interview Scheduled');
      expect(getStatusLabel('INTERVIEW_COMPLETED')).toBe('Interview Completed');
      expect(getStatusLabel('OFFERED')).toBe('Offer Extended');
      expect(getStatusLabel('ACCEPTED')).toBe('Offer Accepted');
      expect(getStatusLabel('REJECTED')).toBe('Not Selected');
      expect(getStatusLabel('WITHDRAWN')).toBe('Withdrawn');
    });
  });

  describe('Deterministic State Machine Transitions', () => {
    it('allows identical from/to status transitions as idempotent operations', () => {
      const res = validateStatusTransition('APPLIED', 'APPLIED', 'INDUSTRY');
      expect(res.valid).toBe(true);
    });

    it('permits standard sequential recruitment pipeline progression for recruiters', () => {
      // APPLIED -> SHORTLISTED
      expect(validateStatusTransition('APPLIED', 'SHORTLISTED', 'INDUSTRY').valid).toBe(true);

      // SHORTLISTED -> INTERVIEW_SCHEDULED
      expect(validateStatusTransition('SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INDUSTRY').valid).toBe(true);

      // INTERVIEW_SCHEDULED -> INTERVIEW_COMPLETED
      expect(validateStatusTransition('INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'INDUSTRY').valid).toBe(true);

      // INTERVIEW_COMPLETED -> OFFERED
      expect(validateStatusTransition('INTERVIEW_COMPLETED', 'OFFERED', 'INDUSTRY').valid).toBe(true);

      // OFFERED -> ACCEPTED
      expect(validateStatusTransition('OFFERED', 'ACCEPTED', 'INDUSTRY').valid).toBe(true);
    });

    it('permits fast-track recruiter paths (e.g. direct shortlist to offer or direct interview from applied)', () => {
      expect(validateStatusTransition('APPLIED', 'INTERVIEW_SCHEDULED', 'INDUSTRY').valid).toBe(true);
      expect(validateStatusTransition('SHORTLISTED', 'OFFERED', 'INDUSTRY').valid).toBe(true);
    });

    it('rejects arbitrary jumping to terminal states without intermediate progression', () => {
      const res = validateStatusTransition('APPLIED', 'ACCEPTED', 'INDUSTRY');
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Invalid stage transition from 'Applied' to 'Offer Accepted'");
    });

    it('prevents reviving a withdrawn candidate', () => {
      const res = validateStatusTransition('WITHDRAWN', 'SHORTLISTED', 'INDUSTRY');
      expect(res.valid).toBe(false);
    });
  });

  describe('Role-Based Authorization & Guardrails', () => {
    it('prohibits students from advancing or altering recruitment stages', () => {
      const res = validateStatusTransition('APPLIED', 'SHORTLISTED', 'STUDENT');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Students cannot modify recruitment stages');
    });

    it('allows students to voluntarily withdraw active applications', () => {
      expect(validateStatusTransition('APPLIED', 'WITHDRAWN', 'STUDENT').valid).toBe(true);
      expect(validateStatusTransition('UNDER_REVIEW', 'WITHDRAWN', 'STUDENT').valid).toBe(true);
      expect(validateStatusTransition('SHORTLISTED', 'WITHDRAWN', 'STUDENT').valid).toBe(true);
      expect(validateStatusTransition('INTERVIEW_SCHEDULED', 'WITHDRAWN', 'STUDENT').valid).toBe(true);
    });

    it('disallows students from withdrawing once offer has been accepted', () => {
      const res = validateStatusTransition('ACCEPTED', 'WITHDRAWN', 'STUDENT');
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Cannot withdraw an application that is already in 'Offer Accepted' stage");
    });

    it('prohibits Institution Admins from modifying recruiter stage decisions', () => {
      const res = validateStatusTransition('SHORTLISTED', 'OFFERED', 'INSTITUTION_ADMIN');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Institution Admins have read-only oversight');
    });
  });

  describe('Stage Duration & Bottleneck Delay Calculation', () => {
    it('accurately computes days in stage for fresh applications', () => {
      const now = new Date();
      const { daysInCurrentStage, isStageDelayed } = calculateStageDuration({
        appliedAt: now,
        updatedAt: now,
        status: 'APPLIED',
      });

      expect(daysInCurrentStage).toBe(0);
      expect(isStageDelayed).toBe(false);
    });

    it('flags stage delay neutrally when duration exceeds the configurable threshold', () => {
      const sixteenDaysAgo = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000);
      const { daysInCurrentStage, isStageDelayed, delayThresholdDays } = calculateStageDuration({
        appliedAt: sixteenDaysAgo,
        updatedAt: sixteenDaysAgo,
        status: 'SHORTLISTED',
      });

      expect(daysInCurrentStage).toBe(16);
      expect(delayThresholdDays).toBe(14);
      expect(isStageDelayed).toBe(true);
    });

    it('respects dynamic institution-configured thresholdDays when provided', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      
      // With custom threshold of 7 days, 10 days is delayed
      const delayed = calculateStageDuration({
        appliedAt: tenDaysAgo,
        updatedAt: tenDaysAgo,
        status: 'UNDER_REVIEW',
        thresholdDays: 7,
      });
      expect(delayed.daysInCurrentStage).toBe(10);
      expect(delayed.delayThresholdDays).toBe(7);
      expect(delayed.isStageDelayed).toBe(true);

      // With custom threshold of 21 days, 10 days is NOT delayed
      const notDelayed = calculateStageDuration({
        appliedAt: tenDaysAgo,
        updatedAt: tenDaysAgo,
        status: 'UNDER_REVIEW',
        thresholdDays: 21,
      });
      expect(notDelayed.daysInCurrentStage).toBe(10);
      expect(notDelayed.delayThresholdDays).toBe(21);
      expect(notDelayed.isStageDelayed).toBe(false);
    });
  });

  describe('Security & Isolation Authorization Invariants', () => {
    // Simulated authorization validation functions matching backend routes exactly
    function checkStudentAccess(user: { id: string; role: string; studentProfileId?: string }, targetStudentId: string) {
      if (user.role === 'ADMIN') return true;
      if (user.role === 'STUDENT' && user.studentProfileId === targetStudentId) return true;
      return false;
    }

    function checkInstitutionAccess(
      user: { role: string; institutionProfileId?: string },
      instAdminProfile: { id: string; institutionName: string },
      student: { institutionProfileId: string | null; institution: string }
    ) {
      if (user.role !== 'INSTITUTION_ADMIN' || !user.institutionProfileId) return false;
      if (user.institutionProfileId !== instAdminProfile.id) return false;

      // Strict precedence: explicit foreign key must match, or unassigned with exact name
      return (
        student.institutionProfileId === instAdminProfile.id ||
        (!student.institutionProfileId &&
          student.institution.toLowerCase() === instAdminProfile.institutionName.toLowerCase())
      );
    }

    function checkRecruiterAccess(
      user: { role: string; industryProfileId?: string },
      application: { opportunity?: { companyId?: string | null } | null; internship?: { industryId?: string | null } | null }
    ) {
      if (user.role !== 'INDUSTRY' || !user.industryProfileId) return false;
      const oppComp = application.opportunity?.companyId;
      const internComp = application.internship?.industryId;
      return user.industryProfileId === oppComp || user.industryProfileId === internComp;
    }

    function checkResumeAccess(
      user: { id: string; role: string; studentProfileId?: string; industryProfileId?: string; institutionProfileId?: string },
      resume: { studentId: string; student: { institutionProfileId: string | null; institution: string } },
      candidateApplications: { opportunity?: { companyId?: string | null } | null; internship?: { industryId?: string | null } | null }[],
      instAdminProfile?: { id: string; institutionName: string }
    ) {
      if (user.role === 'ADMIN') return true;
      if (user.role === 'STUDENT' && user.studentProfileId === resume.studentId) return true;
      if (user.role === 'INDUSTRY' && user.industryProfileId) {
        return candidateApplications.some(
          a => a.opportunity?.companyId === user.industryProfileId || a.internship?.industryId === user.industryProfileId
        );
      }
      if (user.role === 'INSTITUTION_ADMIN' && user.institutionProfileId && instAdminProfile) {
        return (
          resume.student.institutionProfileId === instAdminProfile.id ||
          (!resume.student.institutionProfileId &&
            resume.student.institution.toLowerCase() === instAdminProfile.institutionName.toLowerCase())
        );
      }
      return false;
    }

    it('denies Student A access to Student B applications portfolio', () => {
      const studentA = { id: 'user-a', role: 'STUDENT', studentProfileId: 'student-profile-a' };
      const studentBId = 'student-profile-b';

      expect(checkStudentAccess(studentA, studentA.studentProfileId)).toBe(true);
      expect(checkStudentAccess(studentA, studentBId)).toBe(false);
    });

    it('denies Institution Admin A access to Institution B students even if legacy text is similar', () => {
      const instAdminA = { role: 'INSTITUTION_ADMIN', institutionProfileId: 'inst-a-id' };
      const instProfileA = { id: 'inst-a-id', institutionName: 'Institute of Tech Alpha' };

      // Student explicitly linked to Institution B
      const studentB = {
        institutionProfileId: 'inst-b-id',
        institution: 'Institute of Tech Alpha', // Legacy text anomaly
      };

      // Institution Admin A MUST be denied access because studentB is explicitly affiliated with B
      expect(checkInstitutionAccess(instAdminA, instProfileA, studentB)).toBe(false);

      // Student genuinely linked to Institution A
      const studentA = {
        institutionProfileId: 'inst-a-id',
        institution: 'Institute of Tech Alpha',
      };
      expect(checkInstitutionAccess(instAdminA, instProfileA, studentA)).toBe(true);
    });

    it('denies Recruiter A from modifying status for applications to Recruiter B opportunities', () => {
      const recruiterA = { role: 'INDUSTRY', industryProfileId: 'company-a-id' };
      const appForCompanyB = {
        opportunity: { companyId: 'company-b-id' },
        internship: null,
      };

      expect(checkRecruiterAccess(recruiterA, appForCompanyB)).toBe(false);

      const appForCompanyA = {
        opportunity: { companyId: 'company-a-id' },
        internship: null,
      };
      expect(checkRecruiterAccess(recruiterA, appForCompanyA)).toBe(true);
    });

    it('protects private resumes from unauthorized recruiters and third parties', () => {
      const candidateResume = {
        studentId: 'student-1',
        student: { institutionProfileId: 'inst-1', institution: 'Apex University' },
      };

      // Candidate has only applied to Company A
      const candidateApps = [
        { opportunity: { companyId: 'company-a' }, internship: null },
      ];

      const recruiterA = { id: 'u-1', role: 'INDUSTRY', industryProfileId: 'company-a' };
      const recruiterB = { id: 'u-2', role: 'INDUSTRY', industryProfileId: 'company-b' };
      const unauthorizedStudent = { id: 'u-3', role: 'STUDENT', studentProfileId: 'student-2' };
      const ownerStudent = { id: 'u-4', role: 'STUDENT', studentProfileId: 'student-1' };

      // Owner can view
      expect(checkResumeAccess(ownerStudent, candidateResume, candidateApps)).toBe(true);

      // Hiring recruiter for applied opportunity can view
      expect(checkResumeAccess(recruiterA, candidateResume, candidateApps)).toBe(true);

      // Unrelated recruiter CANNOT view
      expect(checkResumeAccess(recruiterB, candidateResume, candidateApps)).toBe(false);

      // Other student CANNOT view
      expect(checkResumeAccess(unauthorizedStudent, candidateResume, candidateApps)).toBe(false);
    });
  });
});
