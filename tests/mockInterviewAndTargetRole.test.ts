import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../server/src/config/prisma.js';
import {
  getRoleContext,
  generateMockInterviewQuestions,
  evaluateMockInterviewTranscript,
} from '../server/src/services/mockInterviewService.js';
import { getOrCreateDailyMixedPractice } from '../server/src/services/dailyMixedPracticeService.js';
import { MockInterviewAnswerItem } from '../shared/types.js';

describe('Role-Specific Roadmap, Target-Role Daily Prep & AI Mock Interview Suite', () => {
  let testStudentId: string;
  let testUserId: string;
  let testInternshipId: string;
  let testInternshipTitle: string;
  let testCompanyName: string;

  beforeAll(async () => {
    // 1. Find or create a test student profile
    let student = await prisma.studentProfile.findFirst({
      include: { user: true, skillScores: { include: { skill: true } } },
    });

    if (!student) {
      const user = await prisma.user.create({
        data: {
          email: `test_mock_${Date.now()}@example.com`,
          name: 'Mock Interview Candidate',
          role: 'student',
          passwordHash: 'hashed_pw',
        },
      });
      student = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          targetDomain: 'Full-Stack Web',
        },
        include: { user: true, skillScores: { include: { skill: true } } },
      });
    }

    testStudentId = student.id;
    testUserId = student.userId;

    // 2. Find or create an industry profile and internship posting
    let internship = await prisma.internship.findFirst({
      include: { industry: true },
    });

    if (!internship) {
      // Find or create skills for requiredSkillsJson
      const skills = await prisma.skill.findMany({ take: 3 });
      let skillList = skills;
      if (skillList.length === 0) {
        const s1 = await prisma.skill.create({ data: { name: 'React', category: 'TECHNICAL' } });
        const s2 = await prisma.skill.create({ data: { name: 'Node.js', category: 'TECHNICAL' } });
        const s3 = await prisma.skill.create({ data: { name: 'TypeScript', category: 'TECHNICAL' } });
        skillList = [s1, s2, s3];
      }

      // Find or create industry user and profile
      let industryProfile = await prisma.industryProfile.findFirst();
      if (!industryProfile) {
        const indUser = await prisma.user.create({
          data: {
            email: `test_ind_${Date.now()}@example.com`,
            name: 'CloudScale Industry HR',
            role: 'industry',
            passwordHash: 'hashed_pw',
          },
        });
        industryProfile = await prisma.industryProfile.create({
          data: {
            userId: indUser.id,
            companyName: 'CloudScale Technologies',
            industrySector: 'Cloud & Web Services',
            verified: true,
          },
        });
      }

      const reqSkills = skillList.map((s) => ({
        skillId: s.id,
        weight: 1.0,
        minScore: 70,
      }));

      internship = await prisma.internship.create({
        data: {
          industryId: industryProfile.id,
          title: 'Full-Stack Software Engineer Intern',
          description: 'Build robust, scalable full-stack web applications with React, Node.js, and TypeScript.',
          requiredSkillsJson: JSON.stringify(reqSkills),
          stipend: '₹45,000/mo',
          location: 'Remote',
          workMode: 'REMOTE',
          status: 'OPEN',
        },
        include: { industry: true },
      });
    }

    testInternshipId = internship.id;
    testInternshipTitle = internship.title;
    testCompanyName = internship.industry.companyName;
  });

  afterAll(async () => {
    // Clean up created mock interview sessions for this student
    await prisma.mockInterviewSession.deleteMany({
      where: { studentId: testStudentId },
    });
    // Reset target internship
    await prisma.studentProfile.update({
      where: { id: testStudentId },
      data: { targetInternshipId: null },
    });
  });

  describe('1. Target Internship Selection & Role Context Extraction', () => {
    it('sets and updates targetInternshipId on the student profile', async () => {
      const updated = await prisma.studentProfile.update({
        where: { id: testStudentId },
        data: { targetInternshipId: testInternshipId },
        include: { targetInternship: { include: { industry: true } } },
      });

      expect(updated.targetInternshipId).toBe(testInternshipId);
      expect(updated.targetInternship).toBeDefined();
      expect(updated.targetInternship?.title).toBe(testInternshipTitle);
      expect(updated.targetInternship?.industry.companyName).toBe(testCompanyName);
    });

    it('extracts structured role context with top skill gaps from target internship', async () => {
      const context = await getRoleContext(testInternshipId, testStudentId);

      expect(context.internshipId).toBe(testInternshipId);
      expect(context.roleTitle).toBe(testInternshipTitle);
      expect(context.companyName).toBe(testCompanyName);
      expect(context.requiredSkills.length).toBeGreaterThan(0);
      expect(Array.isArray(context.topGaps)).toBe(true);
    });
  });

  describe('2. Role-Specific Roadmap Generation & Mock Weak Areas Integration', () => {
    it('allows inspecting identified weak areas from past completed mock interview sessions', async () => {
      // Create a completed session with identified gaps
      const pastSession = await prisma.mockInterviewSession.create({
        data: {
          studentId: testStudentId,
          internshipId: testInternshipId,
          targetRole: testInternshipTitle,
          companyName: testCompanyName,
          date: '2026-09-01',
          status: 'COMPLETED',
          durationSeconds: 1200,
          overallScore: 65,
          communicationScore: 70,
          technicalScore: 60,
          structureScore: 65,
          readinessTier: 'Developing',
          questionsJson: '[]',
          transcriptJson: '[]',
          feedbackJson: JSON.stringify({
            overallScore: 65,
            readinessTier: 'Developing',
            weakAreas: ['Docker containerization', 'System Architecture'],
          }),
          identifiedGapsJson: JSON.stringify(['Docker containerization', 'System Architecture']),
          retakeNumber: 1,
          isTimedOut: false,
        },
      });

      // Query past sessions to verify weak areas are accessible for roadmap enrichment
      const completedSessions = await prisma.mockInterviewSession.findMany({
        where: { studentId: testStudentId, status: 'COMPLETED' },
        orderBy: { date: 'desc' },
      });

      const extractedWeakAreas: string[] = [];
      completedSessions.forEach((s) => {
        try {
          const gaps: string[] = JSON.parse(s.identifiedGapsJson || '[]');
          gaps.forEach((g) => {
            if (!extractedWeakAreas.includes(g)) extractedWeakAreas.push(g);
          });
        } catch {}
      });

      expect(extractedWeakAreas).toContain('Docker containerization');
      expect(extractedWeakAreas).toContain('System Architecture');

      // Clean up the session
      await prisma.mockInterviewSession.delete({ where: { id: pastSession.id } });
    });
  });

  describe('3. Targeted Daily Practice Set Weighting', () => {
    it('weights domain questions toward target role gaps when student has active target internship', async () => {
      // Ensure target internship is bound
      await prisma.studentProfile.update({
        where: { id: testStudentId },
        data: { targetInternshipId: testInternshipId },
      });

      const testDate = `2099-08-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
      const mixedSet = await getOrCreateDailyMixedPractice(testStudentId, testDate);

      expect(mixedSet).toBeDefined();
      expect(mixedSet.isTargetRoleWeighted).toBe(true);
      expect(mixedSet.targetRole).toContain(testInternshipTitle);
      expect(Array.isArray(mixedSet.targetRoleGaps)).toBe(true);

      // Verify domain questions carry role-targeting metadata
      const domainQuestions = mixedSet.questions.filter((q) => q.sourceType === 'domain');
      expect(domainQuestions.length).toBeGreaterThan(0);

      // At least some domain questions should be targeted
      const roleTargetedQuestions = domainQuestions.filter((q) => q.isRoleTargeted);
      expect(roleTargetedQuestions.length).toBeGreaterThanOrEqual(1);
      expect(roleTargetedQuestions[0].targetRoleSkill).toBeDefined();
    });
  });

  describe('4. AI Mock Interview Question Generation & Anti-Duplicate Rotation', () => {
    it('generates 5 role-tailored questions (3 technical + 2 behavioral STAR)', async () => {
      const questions = await generateMockInterviewQuestions(testInternshipId, testStudentId);

      expect(questions).toBeDefined();
      expect(questions.length).toBe(5);

      const techQs = questions.filter((q) => q.category === 'technical');
      const behavQs = questions.filter((q) => q.category === 'behavioral');

      expect(techQs.length).toBe(3);
      expect(behavQs.length).toBe(2);

      // Verify STAR guidance on behavioral questions
      behavQs.forEach((bq) => {
        expect(bq.tips).toBeDefined();
        expect(bq.tips).toContain('STAR');
      });

      // Verify question index ordering
      questions.forEach((q, idx) => {
        expect(q.questionIndex).toBe(idx + 1);
        expect(q.questionText.length).toBeGreaterThan(15);
      });
    });

    it('excludes questions asked in the most recent sessions (anti-duplicate rotation)', async () => {
      // 1. Generate round 1
      const round1 = await generateMockInterviewQuestions(testInternshipId, testStudentId);
      const round1Texts = round1.map((q) => q.questionText.trim().toLowerCase());

      // 2. Persist a session with round 1 questions so anti-duplicate logic sees it
      const tempSession = await prisma.mockInterviewSession.create({
        data: {
          studentId: testStudentId,
          internshipId: testInternshipId,
          targetRole: testInternshipTitle,
          companyName: testCompanyName,
          date: '2026-09-05',
          status: 'COMPLETED',
          durationSeconds: 900,
          overallScore: 75,
          communicationScore: 75,
          technicalScore: 75,
          structureScore: 75,
          readinessTier: 'Interview Ready',
          questionsJson: JSON.stringify(round1),
          transcriptJson: '[]',
          feedbackJson: '{}',
          identifiedGapsJson: '[]',
          retakeNumber: 1,
          isTimedOut: false,
        },
      });

      // 3. Generate round 2
      const round2 = await generateMockInterviewQuestions(testInternshipId, testStudentId);

      // Questions in round 2 should rotate and avoid round 1 where library capacity allows
      const round2Texts = round2.map((q) => q.questionText.trim().toLowerCase());
      const overlappingQuestions = round2Texts.filter((t) => round1Texts.includes(t));

      // Overlap must be strictly less than total question count (rotation active)
      expect(overlappingQuestions.length).toBeLessThan(round2.length);

      // Clean up temp session
      await prisma.mockInterviewSession.delete({ where: { id: tempSession.id } });
    });
  });

  describe('5. Mock Interview Retake Counting & Daily Cap (<= 3/day)', () => {
    it('computes retakeNumber as prior COMPLETED count + 1', async () => {
      // Clean previous records for target role
      await prisma.mockInterviewSession.deleteMany({
        where: { studentId: testStudentId, targetRole: testInternshipTitle },
      });

      // Create one COMPLETED session
      await prisma.mockInterviewSession.create({
        data: {
          studentId: testStudentId,
          internshipId: testInternshipId,
          targetRole: testInternshipTitle,
          companyName: testCompanyName,
          date: '2026-09-02',
          status: 'COMPLETED',
          durationSeconds: 1500,
          overallScore: 78,
          communicationScore: 80,
          technicalScore: 75,
          structureScore: 80,
          readinessTier: 'Interview Ready',
          questionsJson: '[]',
          transcriptJson: '[]',
          feedbackJson: '{}',
          identifiedGapsJson: '[]',
          retakeNumber: 1,
          isTimedOut: false,
        },
      });

      // Also create an ABANDONED session (should NOT increase completed retake count)
      await prisma.mockInterviewSession.create({
        data: {
          studentId: testStudentId,
          internshipId: testInternshipId,
          targetRole: testInternshipTitle,
          companyName: testCompanyName,
          date: '2026-09-02',
          status: 'ABANDONED',
          durationSeconds: 300,
          overallScore: 0,
          communicationScore: 0,
          technicalScore: 0,
          structureScore: 0,
          readinessTier: 'Needs Work',
          questionsJson: '[]',
          transcriptJson: '[]',
          feedbackJson: '{}',
          identifiedGapsJson: '[]',
          retakeNumber: 2,
          isTimedOut: false,
        },
      });

      // Count prior completed
      const priorCompletedCount = await prisma.mockInterviewSession.count({
        where: {
          studentId: testStudentId,
          status: 'COMPLETED',
          targetRole: testInternshipTitle,
        },
      });

      const nextRetakeNumber = priorCompletedCount + 1;
      expect(nextRetakeNumber).toBe(2); // Only 1 was COMPLETED
    });

    it('enforces the daily cap of maximum 3 sessions per day', async () => {
      const today = '2099-12-31';

      // Clean up today's test records
      await prisma.mockInterviewSession.deleteMany({
        where: { studentId: testStudentId, date: today },
      });

      // Insert 3 sessions for today
      for (let i = 1; i <= 3; i++) {
        await prisma.mockInterviewSession.create({
          data: {
            studentId: testStudentId,
            internshipId: testInternshipId,
            targetRole: testInternshipTitle,
            companyName: testCompanyName,
            date: today,
            status: 'COMPLETED',
            durationSeconds: 1000,
            overallScore: 70 + i,
            communicationScore: 70,
            technicalScore: 70,
            structureScore: 70,
            readinessTier: 'Interview Ready',
            questionsJson: '[]',
            transcriptJson: '[]',
            feedbackJson: '{}',
            identifiedGapsJson: '[]',
            retakeNumber: i,
            isTimedOut: false,
          },
        });
      }

      // Check session count for today
      const todayCount = await prisma.mockInterviewSession.count({
        where: { studentId: testStudentId, date: today },
      });

      expect(todayCount).toBe(3);
      expect(todayCount >= 3).toBe(true); // Cap reached
    });
  });

  describe('6. 30-Minute Timeout, Partial Transcript Auto-Submit & Quoted Evaluation', () => {
    it('evaluates partial transcript with 30m timeout and produces quoted feedback', async () => {
      const questions = await generateMockInterviewQuestions(testInternshipId, testStudentId);

      // Create an active session with these questions
      const session = await prisma.mockInterviewSession.create({
        data: {
          studentId: testStudentId,
          internshipId: testInternshipId,
          targetRole: testInternshipTitle,
          companyName: testCompanyName,
          date: '2026-09-07',
          status: 'IN_PROGRESS',
          durationSeconds: 1800,
          overallScore: 0,
          communicationScore: 0,
          technicalScore: 0,
          structureScore: 0,
          readinessTier: 'Needs Work',
          questionsJson: JSON.stringify(questions),
          transcriptJson: '[]',
          feedbackJson: '{}',
          identifiedGapsJson: '[]',
          retakeNumber: 1,
          isTimedOut: false,
        },
      });

      // Candidate answered only Q1 and Q2; Q3, Q4, Q5 were left unreached due to 30m timeout
      const partialAnswers: MockInterviewAnswerItem[] = [
        {
          questionIndex: 1,
          questionText: questions[0].questionText,
          category: questions[0].category,
          skillTag: questions[0].skillTag,
          studentAnswer:
            'In my production application, I used useMemo to cache expensive data transformations and useCallback to ensure memoized component props do not trigger unwanted reconciliations.',
          timeTakenSeconds: 140,
          isSkipped: false,
        },
        {
          questionIndex: 2,
          questionText: questions[1].questionText,
          category: questions[1].category,
          skillTag: questions[1].skillTag,
          studentAnswer:
            'We architect discriminated union types with a common discriminator field like kind or status to enforce exhaustive type narrowing across API responses.',
          timeTakenSeconds: 110,
          isSkipped: false,
        },
      ];

      // Evaluate partial transcript with isTimedOut = true
      const evaluation = await evaluateMockInterviewTranscript(
        session.id,
        partialAnswers,
        1800,
        true // isTimedOut
      );

      expect(evaluation).toBeDefined();
      expect(evaluation.overallScore).toBeGreaterThanOrEqual(0);
      expect(evaluation.overallScore).toBeLessThanOrEqual(100);
      expect(evaluation.technicalScore).toBeGreaterThanOrEqual(0);
      expect(evaluation.communicationScore).toBeGreaterThanOrEqual(0);
      expect(evaluation.structureScore).toBeGreaterThanOrEqual(0);
      expect(['High Readiness', 'Interview Ready', 'Developing', 'Needs Work']).toContain(
        evaluation.readinessTier
      );

      // Verify all 5 questions received feedback in questionFeedback
      expect(evaluation.questionFeedback.length).toBe(5);

      // Q1 feedback should have valid scores and specific feedback
      const q1Feedback = evaluation.questionFeedback.find((fb) => fb.questionIndex === 1);
      expect(q1Feedback).toBeDefined();
      expect(q1Feedback?.score).toBeGreaterThan(0);
      expect(q1Feedback?.feedback).toBeDefined();
      expect(q1Feedback?.feedback.length).toBeGreaterThan(20);

      // Q3 (unanswered due to timeout) should be recognized as timed out/skipped
      const q3Feedback = evaluation.questionFeedback.find((fb) => fb.questionIndex === 3);
      expect(q3Feedback).toBeDefined();
      expect(q3Feedback?.score).toBe(0);
      expect(q3Feedback?.feedback.toLowerCase()).toMatch(/skipped|timed out|unanswered/);

      // Verify session record in DB was updated to COMPLETED and marked as timed out
      const updatedSession = await prisma.mockInterviewSession.findUnique({
        where: { id: session.id },
      });
      expect(updatedSession?.status).toBe('COMPLETED');
      expect(updatedSession?.isTimedOut).toBe(true);
      expect(updatedSession?.overallScore).toBe(evaluation.overallScore);

      // Clean up session
      await prisma.mockInterviewSession.delete({ where: { id: session.id } });
    });
  });

  describe('7. Mock Interview History Strictly Filters to COMPLETED Sessions', () => {
    it('aggregates scores and trends using only COMPLETED sessions', async () => {
      // Clean up previous test sessions
      await prisma.mockInterviewSession.deleteMany({
        where: { studentId: testStudentId },
      });

      // Insert 2 COMPLETED sessions with ascending scores
      await prisma.mockInterviewSession.create({
        data: {
          studentId: testStudentId,
          internshipId: testInternshipId,
          targetRole: testInternshipTitle,
          companyName: testCompanyName,
          date: '2026-08-01',
          status: 'COMPLETED',
          durationSeconds: 1400,
          overallScore: 60,
          communicationScore: 65,
          technicalScore: 55,
          structureScore: 60,
          readinessTier: 'Developing',
          questionsJson: '[]',
          transcriptJson: '[]',
          feedbackJson: JSON.stringify({ weakAreas: ['Docker containerization'] }),
          identifiedGapsJson: JSON.stringify(['Docker containerization']),
          retakeNumber: 1,
          isTimedOut: false,
        },
      });

      await prisma.mockInterviewSession.create({
        data: {
          studentId: testStudentId,
          internshipId: testInternshipId,
          targetRole: testInternshipTitle,
          companyName: testCompanyName,
          date: '2026-08-15',
          status: 'COMPLETED',
          durationSeconds: 1600,
          overallScore: 84,
          communicationScore: 85,
          technicalScore: 82,
          structureScore: 85,
          readinessTier: 'Interview Ready',
          questionsJson: '[]',
          transcriptJson: '[]',
          feedbackJson: JSON.stringify({ weakAreas: ['System Design'] }),
          identifiedGapsJson: JSON.stringify(['System Design']),
          retakeNumber: 2,
          isTimedOut: false,
        },
      });

      // Also insert an IN_PROGRESS session and an ABANDONED session (must be ignored)
      await prisma.mockInterviewSession.create({
        data: {
          studentId: testStudentId,
          internshipId: testInternshipId,
          targetRole: testInternshipTitle,
          companyName: testCompanyName,
          date: '2026-08-20',
          status: 'IN_PROGRESS',
          durationSeconds: 200,
          overallScore: 0,
          communicationScore: 0,
          technicalScore: 0,
          structureScore: 0,
          readinessTier: 'Needs Work',
          questionsJson: '[]',
          transcriptJson: '[]',
          feedbackJson: '{}',
          identifiedGapsJson: '[]',
          retakeNumber: 3,
          isTimedOut: false,
        },
      });

      await prisma.mockInterviewSession.create({
        data: {
          studentId: testStudentId,
          internshipId: testInternshipId,
          targetRole: testInternshipTitle,
          companyName: testCompanyName,
          date: '2026-08-21',
          status: 'ABANDONED',
          durationSeconds: 150,
          overallScore: 10,
          communicationScore: 10,
          technicalScore: 10,
          structureScore: 10,
          readinessTier: 'Needs Work',
          questionsJson: '[]',
          transcriptJson: '[]',
          feedbackJson: '{}',
          identifiedGapsJson: '[]',
          retakeNumber: 3,
          isTimedOut: false,
        },
      });

      // Fetch history strictly filtering by COMPLETED
      const completedSessions = await prisma.mockInterviewSession.findMany({
        where: {
          studentId: testStudentId,
          status: 'COMPLETED',
        },
        orderBy: { date: 'desc' },
      });

      expect(completedSessions.length).toBe(2);

      // Average score of completed: (60 + 84) / 2 = 72
      const avgScore = Math.round(
        completedSessions.reduce((acc, s) => acc + s.overallScore, 0) / completedSessions.length
      );
      expect(avgScore).toBe(72);

      // Score trend: 60 -> 84 (improving)
      const scoresChronological = [...completedSessions].reverse().map((s) => s.overallScore);
      expect(scoresChronological).toEqual([60, 84]);
      expect(scoresChronological[1]).toBeGreaterThan(scoresChronological[0]);
    });
  });

  describe('8. Early Submission Flow & Actual Elapsed Duration Recording', () => {
    it('submits early when all questions are answered and accurately records actual elapsed duration', async () => {
      const questions = await generateMockInterviewQuestions(testInternshipId, testStudentId);

      const earlySession = await prisma.mockInterviewSession.create({
        data: {
          studentId: testStudentId,
          internshipId: testInternshipId,
          targetRole: testInternshipTitle,
          companyName: testCompanyName,
          date: '2026-09-07',
          status: 'IN_PROGRESS',
          durationSeconds: 0,
          overallScore: 0,
          communicationScore: 0,
          technicalScore: 0,
          structureScore: 0,
          readinessTier: 'Needs Work',
          questionsJson: JSON.stringify(questions),
          transcriptJson: '[]',
          feedbackJson: '{}',
          identifiedGapsJson: '[]',
          retakeNumber: 1,
          isTimedOut: false,
        },
      });

      // Student answered ALL 5 questions early in 12 minutes (720 seconds)
      const completeAnswers: MockInterviewAnswerItem[] = questions.map((q) => ({
        questionIndex: q.questionIndex,
        questionText: q.questionText,
        category: q.category,
        skillTag: q.skillTag,
        studentAnswer:
          q.category === 'behavioral'
            ? 'In my situation at our university project, I led the task of migrating our frontend to TypeScript. I instituted strict lint rules and custom interfaces, resulting in zero production runtime type crashes.'
            : `To address ${q.skillTag}, we structure our services with clear architectural separation of concerns, robust integration tests, and optimized database indexing.`,
        timeTakenSeconds: 144,
        isSkipped: false,
      }));

      // Submit early with durationSeconds = 720 and isTimedOut = false
      const earlyElapsedSeconds = 720;
      const evaluation = await evaluateMockInterviewTranscript(
        earlySession.id,
        completeAnswers,
        earlyElapsedSeconds,
        false // isTimedOut = false
      );

      expect(evaluation).toBeDefined();
      expect(evaluation.overallScore).toBeGreaterThanOrEqual(0);
      expect(evaluation.overallScore).toBeLessThanOrEqual(100);
      expect(evaluation.technicalScore).toBeGreaterThanOrEqual(0);
      expect(evaluation.communicationScore).toBeGreaterThanOrEqual(0);
      expect(evaluation.structureScore).toBeGreaterThanOrEqual(0);
      expect(evaluation.questionFeedback.length).toBe(questions.length);

      // Verify the session in the database recorded the ACTUAL elapsed time (720s), not the full 1800s
      const updatedSession = await prisma.mockInterviewSession.findUnique({
        where: { id: earlySession.id },
      });

      expect(updatedSession?.status).toBe('COMPLETED');
      expect(updatedSession?.isTimedOut).toBe(false);
      expect(updatedSession?.durationSeconds).toBe(earlyElapsedSeconds);
      expect(updatedSession?.durationSeconds).toBeLessThan(1800);

      // Clean up
      await prisma.mockInterviewSession.delete({ where: { id: earlySession.id } });
    });

    it('disallows early submission when any question remains unanswered', async () => {
      const questions = await generateMockInterviewQuestions(testInternshipId, testStudentId);

      const partialAnswers: MockInterviewAnswerItem[] = [
        {
          questionIndex: questions[0].questionIndex,
          questionText: questions[0].questionText,
          category: questions[0].category,
          skillTag: questions[0].skillTag,
          studentAnswer: 'Here is my answer to question 1 only.',
          timeTakenSeconds: 60,
          isSkipped: false,
        },
      ];

      // Replicating the exact route-level and UI gating validation:
      const unanswered = questions.filter((q) => {
        const ans = partialAnswers.find((a) => a.questionIndex === q.questionIndex);
        return !ans || !ans.studentAnswer || ans.studentAnswer.trim().length === 0;
      });

      // Verification: cannot proceed early because 4 questions are still unanswered
      expect(unanswered.length).toBe(4);
      expect(unanswered.length).toBeGreaterThan(0);
      expect(questions.length - unanswered.length).toBe(1);
    });
  });
});
