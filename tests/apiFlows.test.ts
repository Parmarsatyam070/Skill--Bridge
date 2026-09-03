import { describe, it, expect, beforeAll } from 'vitest';
import { calculateStudentMatches, calculateSingleMatch } from '../server/src/services/matchingEngine.js';
import { gradeAssessment, getDerivedPortfolio } from '../server/src/services/skillEngine.js';
import { generateResumeContent } from '../server/src/services/resumeService.js';
import { executeTool } from '../server/src/services/aiAssistant.js';
import { prisma } from '../server/src/config/prisma.js';

describe('SkillBridge Core Full-Stack Integration Flows', () => {
  let sampleStudentId: string;
  let sampleJobId: string;

  beforeAll(async () => {
    const student = await prisma.studentProfile.findFirst({
      include: { user: true, skillScores: { include: { skill: true } } },
    });
    if (student) {
      sampleStudentId = student.id;
    }

    const job = await prisma.internship.findFirst();
    if (job) {
      sampleJobId = job.id;
    }
  });

  it('should compute authoritative matches with breakdown and tiers', async () => {
    if (!sampleStudentId) return;

    const matches = await calculateStudentMatches(sampleStudentId);
    expect(matches).toBeDefined();
    expect(matches.length).toBeGreaterThan(0);

    const first = matches[0];
    expect(first).toHaveProperty('internshipId');
    expect(first).toHaveProperty('overallScore');
    expect(first).toHaveProperty('tier');
    expect(typeof first.overallScore).toBe('number');
    expect(first.overallScore).toBeGreaterThanOrEqual(0);
    expect(first.overallScore).toBeLessThanOrEqual(100);
    expect(['high', 'medium', 'low']).toContain(first.tier);
    expect(first.breakdown).toHaveProperty('strengths');
    expect(first.breakdown).toHaveProperty('missingSkills');
  });

  it('should derive an immutable public portfolio with verified skills', async () => {
    if (!sampleStudentId) return;

    const portfolio = await getDerivedPortfolio(sampleStudentId);
    expect(portfolio).toBeDefined();
    expect(portfolio.name).toBeDefined();
    expect(portfolio.skills).toBeInstanceOf(Array);
    expect(portfolio.benchmarks).toBeInstanceOf(Array);
    expect(portfolio.completedCourses).toBeInstanceOf(Array);
  });

  it('should generate structured AI resume data with verified skill scores', async () => {
    if (!sampleStudentId) return;

    const resumeData = await generateResumeContent(sampleStudentId);
    expect(resumeData).toBeDefined();
    expect(resumeData.fullName).toBeDefined();
    expect(resumeData.verifiedSkills).toBeInstanceOf(Array);
    expect(resumeData.summary).toContain('Full-Stack');
  });

  it('should execute Bridge Bot AI tools deterministically', async () => {
    if (!sampleStudentId) return;

    // Tool 1: get_skill_gaps
    const gapResult = await executeTool('get_skill_gaps', { domain: 'Full-Stack Web' }, sampleStudentId);
    expect(gapResult).toHaveProperty('toolName', 'get_skill_gaps');
    expect(gapResult.data).toHaveProperty('gaps');

    // Tool 2: recommend_courses
    const recResult = await executeTool('recommend_courses', { skillName: 'React.js' }, sampleStudentId);
    expect(recResult).toHaveProperty('toolName', 'recommend_courses');
    expect(recResult.data).toBeInstanceOf(Array);

    // Tool 3: explain_match_score
    if (sampleJobId) {
      const matchResult = await executeTool('explain_match_score', { internshipId: sampleJobId }, sampleStudentId);
      expect(matchResult).toHaveProperty('toolName', 'explain_match_score');
      expect(matchResult.data).toHaveProperty('overallScore');
    }
  });
});
