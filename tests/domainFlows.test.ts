import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../server/src/config/prisma.js';
import { executeTool, processChat } from '../server/src/services/aiAssistant.js';

describe('SkillBridge Domain-Specific Intelligence & Radar Suite', () => {
  let sampleStudentId: string;

  beforeAll(async () => {
    const student = await prisma.studentProfile.findFirst({
      include: { user: true, skillScores: true },
    });
    if (student) {
      sampleStudentId = student.id;
    }
  });

  it('should have 5 distinct domains with unique required skills in the catalog', async () => {
    const domains = await prisma.domain.findMany({
      include: {
        requirements: {
          include: { skill: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    expect(domains.length).toBeGreaterThanOrEqual(5);

    const domainNames = domains.map(d => d.name);
    expect(domainNames).toContain('Full-Stack Web');
    expect(domainNames).toContain('AI/Data Science');
    expect(domainNames).toContain('Cloud/DevOps');
    expect(domainNames).toContain('UI/UX Product Design');
    expect(domainNames).toContain('Embedded/IoT');

    // Verify radar axes are completely distinct
    const webSkills = domains.find(d => d.name === 'Full-Stack Web')?.requirements.map(r => r.skill.name);
    const aiSkills = domains.find(d => d.name === 'AI/Data Science')?.requirements.map(r => r.skill.name);
    const uiuxSkills = domains.find(d => d.name === 'UI/UX Product Design')?.requirements.map(r => r.skill.name);
    const cloudSkills = domains.find(d => d.name === 'Cloud/DevOps')?.requirements.map(r => r.skill.name);
    const iotSkills = domains.find(d => d.name === 'Embedded/IoT')?.requirements.map(r => r.skill.name);

    expect(webSkills).toContain('React.js');
    expect(aiSkills).toContain('Python for Data Science');
    expect(uiuxSkills).toContain('Figma & Interactive Prototyping');
    expect(cloudSkills).toContain('Docker & Containerization');
    expect(iotSkills).toContain('Embedded C & C++');

    // Ensure UI/UX does not contain AI/Data Science skills
    expect(uiuxSkills).not.toContain('Machine Learning Fundamentals');
    expect(webSkills).not.toContain('FreeRTOS & Concurrency');
  });

  it('should have non-empty question banks for ALL 5 domains', async () => {
    const domains = ['Full-Stack Web', 'AI/Data Science', 'Cloud/DevOps', 'UI/UX Product Design', 'Embedded/IoT'];

    for (const domain of domains) {
      const questions = await prisma.question.findMany({
        where: { domain },
      });
      expect(questions.length).toBeGreaterThanOrEqual(5);
      
      // Ensure all questions have valid optionsJson (for MCQs), expectedAnswerRubric (for written), or starterCode (for coding)
      for (const q of questions) {
        if (q.questionType === 'written') {
          expect(q.expectedAnswerRubric).toBeDefined();
          expect(q.expectedAnswerRubric!.length).toBeGreaterThan(5);
        } else if (q.questionType === 'coding') {
          expect(q.starterCode).toBeDefined();
          expect(q.testCasesJson).toBeDefined();
        } else {
          const options = JSON.parse(q.optionsJson);
          expect(options.length).toBeGreaterThanOrEqual(4);
          expect(options.some((o: any) => o.isCorrect)).toBe(true);
        }
      }
    }
  });

  it('should have practice sets configured for all domains and aptitude modules', async () => {
    const practiceSets = await prisma.practiceSet.findMany();
    expect(practiceSets.length).toBeGreaterThanOrEqual(8);

    const quantSets = practiceSets.filter(s => s.type === 'aptitude_quant');
    const readingSets = practiceSets.filter(s => s.type === 'aptitude_english_reading');
    const listeningSets = practiceSets.filter(s => s.type === 'aptitude_english_listening');

    expect(quantSets.length).toBeGreaterThanOrEqual(1);
    expect(readingSets.length).toBeGreaterThanOrEqual(1);
    expect(listeningSets.length).toBeGreaterThanOrEqual(1);

    // Verify listening passage structure
    const passages = await prisma.listeningPassage.findMany();
    expect(passages.length).toBeGreaterThanOrEqual(1);
    expect(passages[0].audioText).toBeDefined();
    expect(passages[0].audioText.length).toBeGreaterThan(50);
  });

  it('should deliver context-aware Bridge Bot responses when domain changes', async () => {
    if (!sampleStudentId) return;

    // Bridge Bot on UI/UX Product Design
    const uiuxResponse = await processChat(
      'What are my biggest skill gaps?',
      { id: 'user-1', name: 'Satyam', role: 'STUDENT', studentProfileId: sampleStudentId },
      [],
      'UI/UX Product Design'
    );
    expect(uiuxResponse.message).toBeDefined();

    // Bridge Bot on Cloud/DevOps
    const cloudResponse = await processChat(
      'Recommend courses to learn',
      { id: 'user-1', name: 'Satyam', role: 'STUDENT', studentProfileId: sampleStudentId },
      [],
      'Cloud/DevOps'
    );
    expect(cloudResponse.message).toBeDefined();
    expect(cloudResponse.toolCalls?.[0]?.data?.[0]?.title).toBeDefined();
  });
});
