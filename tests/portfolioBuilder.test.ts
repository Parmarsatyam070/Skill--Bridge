import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { portfolioService } from '../server/src/services/portfolioService';

const prisma = new PrismaClient();

describe('Portfolio Website Builder & Public Viewer Suite', () => {
  let testStudentProfileId: string;
  let testPortfolioId: string;

  beforeAll(async () => {
    // Find sample student (Satyam Singh)
    const student = await prisma.studentProfile.findFirst({
      where: { user: { email: 'demo@skillbridge.app' } },
      include: { portfolioWebsite: true },
    });

    if (student) {
      testStudentProfileId = student.id;
      if (student.portfolioWebsite) {
        testPortfolioId = student.portfolioWebsite.id;
      }
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should retrieve or initialize student portfolio website', async () => {
    if (!testStudentProfileId) return;

    const data = await portfolioService.getOrCreateStudentPortfolio(testStudentProfileId);
    expect(data).toBeDefined();
    expect(data.slug).toBe('satyam-singh');
    expect(data.status).toBe('PUBLISHED');
    expect(data.services.length).toBe(3);
    expect(data.projects.length).toBeGreaterThanOrEqual(1);
  });

  it('should resolve public portfolio by slug and studentId without requiring auth', async () => {
    // Lookup by slug
    const bySlug = await portfolioService.getPublicPortfolio('satyam-singh');
    expect(bySlug).toBeDefined();
    expect(bySlug?.headline).toBeDefined();
    expect(bySlug?.services.length).toBe(3);
    expect(bySlug?.projects.length).toBeGreaterThanOrEqual(1);

    // Lookup by studentId
    if (testStudentProfileId) {
      const byId = await portfolioService.getPublicPortfolio(testStudentProfileId);
      expect(byId).toBeDefined();
      expect(byId?.slug).toBe('satyam-singh');
    }
  });

  it('should allow public visitors to send messages stored in the database', async () => {
    const message = await portfolioService.savePortfolioMessage('satyam-singh', {
      senderName: 'Ananya Sharma',
      senderEmail: 'ananya@google.com',
      message: 'Hello Satyam, loved your SkillBridge architecture and would like to schedule a recruiter chat.',
    });

    expect(message).toBeDefined();
    expect(message.id).toBeDefined();
    expect(message.senderEmail).toBe('ananya@google.com');

    // Verify message is in candidate inbox
    const messages = await portfolioService.getPortfolioMessages(testStudentProfileId);
    expect(messages.some(m => m.senderEmail === 'ananya@google.com')).toBe(true);
  });

  it('should generate conversational responses scoped to student public profile data', async () => {
    const reply1 = await portfolioService.handlePublicBotChat(
      'satyam-singh',
      'What are your top projects and technologies?'
    );

    expect(typeof reply1).toBe('string');
    expect(reply1.length).toBeGreaterThan(20);

    const reply2 = await portfolioService.handlePublicBotChat(
      'satyam-singh',
      'How can I get in touch with you?'
    );
    expect(typeof reply2).toBe('string');
    expect(reply2.toLowerCase()).toContain('email');
  });

  it('should generate portfolio copy via AI Wizard engine', async () => {
    if (!testStudentProfileId) return;

    const generated = await portfolioService.generateAIWizardPortfolio(
      testStudentProfileId,
      {
        targetRole: 'Full-Stack Distributed Systems Architect',
        tone: 'Technical',
        colorPreference: 'teal',
      }
    );

    expect(generated.headline).toBeDefined();
    expect(generated.subheadline).toBeDefined();
    expect(generated.services?.length).toBe(3);
    expect(generated.stats?.length).toBe(3);
  });
});
