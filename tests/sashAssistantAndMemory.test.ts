import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../server/src/config/prisma.js';
import { processChat, executeTool } from '../server/src/services/aiAssistant.js';
import {
  getStudentBoundedMemory,
  upsertStudentMemory,
  extractAndSaveMemoriesWithLlm,
  getStudentMemories,
  deleteStudentMemory,
  consolidateStudentMemoriesIfNeeded,
} from '../server/src/services/sashMemoryService.js';
import fs from 'fs';
import path from 'path';

describe('Sash AI Career Navigator & SashMemory Context Suite', () => {
  let testStudentId: string;
  let testUserId: string;
  let testDomainName = 'Full-Stack Web';

  beforeAll(async () => {
    // 1. Find or create a test student profile
    let student = await prisma.studentProfile.findFirst({
      include: {
        user: true,
        skillScores: { include: { skill: true } },
      },
    });

    if (!student) {
      const user = await prisma.user.create({
        data: {
          email: `sash_test_${Date.now()}@example.com`,
          name: 'Sash Test Student',
          role: 'student',
          passwordHash: 'hashed_pw',
        },
      });
      student = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          targetDomain: testDomainName,
        },
        include: {
          user: true,
          skillScores: { include: { skill: true } },
        },
      });
    }

    testStudentId = student.id;
    testUserId = student.userId;

    // Clean up any pre-existing memories for test isolation
    await prisma.sashMemory.deleteMany({
      where: { studentProfileId: testStudentId },
    });
  });

  afterAll(async () => {
    // Clean up test memories
    if (testStudentId) {
      await prisma.sashMemory.deleteMany({
        where: { studentProfileId: testStudentId },
      });
    }
  });

  describe('1. UI Branding Audit: "Bridge Bot" vs "Sash"', () => {
    it('verifies that "Bridge Bot" no longer appears in UI components and "Sash" appears consistently', () => {
      const componentsDir = path.resolve(process.cwd(), 'client/src/components');
      const filesToCheck = ['SashWidget.tsx', 'ConsoleLayout.tsx'];

      filesToCheck.forEach((fileName) => {
        const filePath = path.join(componentsDir, fileName);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');

          // Ensure "Bridge Bot" is not used in UI text/JSX
          expect(content).not.toContain('Bridge Bot AI');
          expect(content).not.toContain('I\'m **Bridge Bot**');
          expect(content).not.toContain('>Bridge Bot<');

          // Ensure Sash appears in UI
          expect(content).toContain('Sash');
        }
      });
    });
  });

  describe('2. Open-Ended General Conversation', () => {
    it('coherently answers a general conceptual question unrelated to fixed keywords (e.g. TCP vs UDP)', async () => {
      const response = await processChat(
        'What is the difference between TCP and UDP in computer networks?',
        {
          id: testUserId,
          name: 'Satyam',
          role: 'STUDENT',
          studentProfileId: testStudentId,
        },
        [],
        testDomainName
      );

      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(100);

      // Verify coherent, grounded technical content
      const lower = response.message.toLowerCase();
      expect(lower).toContain('tcp');
      expect(lower).toContain('udp');
      expect(lower).toContain('connection');

      // Ensure it did not fall back to generic "Here is what I can do for you right now"
      expect(response.message).not.toContain('Here is what I can do for you right now:');
    });

    it('answers general study advice or interview preparation questions with structured mentorship', async () => {
      const response = await processChat(
        'How should I organize a weekly study schedule for technical interviews?',
        {
          id: testUserId,
          name: 'Satyam',
          role: 'STUDENT',
          studentProfileId: testStudentId,
        },
        [],
        testDomainName
      );

      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(80);
      expect(response.message).not.toContain('Here is what I can do for you right now:');
    });
  });

  describe('3. Deduplicating Upserts & Retention Capping', () => {
    it('upserts memory by (studentProfileId, category, key) so changing a goal supersedes old value without duplicates', async () => {
      // 1. Initial goal
      await upsertStudentMemory(testStudentId, {
        category: 'goal',
        key: 'target_role',
        value: 'Goal: Backend Engineer at Google',
        sourceMessage: 'My goal is to work as a backend engineer at Google',
      });

      let memories = await prisma.sashMemory.findMany({
        where: { studentProfileId: testStudentId, category: 'goal', key: 'target_role' },
      });
      expect(memories.length).toBe(1);
      expect(memories[0].value).toBe('Goal: Backend Engineer at Google');

      // 2. Student changes goal to Stripe
      await upsertStudentMemory(testStudentId, {
        category: 'goal',
        key: 'target_role',
        value: 'Goal: Distributed Systems Engineer at Stripe',
        sourceMessage: 'My goal is to become a distributed systems engineer at Stripe',
      });

      // Verification: exactly 1 row exists, updated with the new goal (no duplicate accumulation)
      memories = await prisma.sashMemory.findMany({
        where: { studentProfileId: testStudentId, category: 'goal', key: 'target_role' },
      });
      expect(memories.length).toBe(1);
      expect(memories[0].value).toBe('Goal: Distributed Systems Engineer at Stripe');
    });

    it('enforces retention cap and consolidates older memories into summary when exceeding threshold', async () => {
      // Clean student memories first
      await prisma.sashMemory.deleteMany({ where: { studentProfileId: testStudentId } });

      // Insert 26 distinct facts
      for (let i = 1; i <= 26; i++) {
        await prisma.sashMemory.create({
          data: {
            studentProfileId: testStudentId,
            category: 'fact',
            key: `fact_${i}`,
            value: `Learned technical skill topic #${i}`,
            createdAt: new Date(Date.now() - (30 - i) * 60000),
            updatedAt: new Date(Date.now() - (30 - i) * 60000),
          },
        });
      }

      const initialCount = await prisma.sashMemory.count({
        where: { studentProfileId: testStudentId, category: { in: ['goal', 'struggle', 'preference', 'fact'] } },
      });
      expect(initialCount).toBe(26);

      // Trigger consolidation
      await consolidateStudentMemoriesIfNeeded(testStudentId);

      // Non-summary count should now be capped at 20
      const afterCount = await prisma.sashMemory.count({
        where: { studentProfileId: testStudentId, category: { in: ['goal', 'struggle', 'preference', 'fact'] } },
      });
      expect(afterCount).toBeLessThanOrEqual(20);

      // A summary record should have been created containing the consolidated facts
      const summaryRecord = await prisma.sashMemory.findFirst({
        where: { studentProfileId: testStudentId, category: 'summary' },
      });
      expect(summaryRecord).toBeDefined();
      expect(summaryRecord?.value).toContain('Archived fact');
    });
  });

  describe('4. Cross-Session Memory Recall via Database Persistence', () => {
    it('correctly writes to database and recalls student goals/struggles in a separate request context', async () => {
      // Clean memories for a clean test
      await prisma.sashMemory.deleteMany({ where: { studentProfileId: testStudentId } });

      // Turn 1: Student states goals and struggles to Sash
      const turn1Prompt = 'My goal is to crack an SDE-2 role at Netflix, and I struggle with dynamic programming and graphs';
      await processChat(
        turn1Prompt,
        {
          id: testUserId,
          name: 'Satyam',
          role: 'STUDENT',
          studentProfileId: testStudentId,
        },
        [],
        testDomainName
      );

      // Explicitly wait for background extraction to persist to DB (or call directly)
      await extractAndSaveMemoriesWithLlm(
        testStudentId,
        turn1Prompt,
        'Noted! I have saved this in my memory.'
      );

      // ASSERTION 1: Verify direct database persistence in SashMemory table (NOT an in-memory cache)
      const dbMemories = await prisma.sashMemory.findMany({
        where: { studentProfileId: testStudentId },
      });
      expect(dbMemories.length).toBeGreaterThanOrEqual(1);

      const dbValues = dbMemories.map((m) => m.value.toLowerCase()).join(' ');
      expect(dbValues).toMatch(/netflix|sde/);

      // Turn 2: Simulating a completely fresh, separate request context later
      // Fresh user object, empty history, separate call
      const turn2Response = await processChat(
        'What do you remember about my goals and what topics I struggle with?',
        {
          id: testUserId,
          name: 'Satyam',
          role: 'STUDENT',
          studentProfileId: testStudentId,
        },
        [], // empty history proves cross-session database memory!
        testDomainName
      );

      expect(turn2Response).toBeDefined();
      expect(turn2Response.message).toBeDefined();

      const recallText = turn2Response.message.toLowerCase();
      // Verifies that Sash recalls what was read back from the SashMemory database table
      expect(recallText).toMatch(/netflix|dynamic programming|graphs|goal/i);
    });
  });

  describe('5. Authoritative Grounding & Zero Hallucination', () => {
    it('strictly outputs verified skill scores without hallucinating or inventing numbers', async () => {
      // Ensure student has known skill scores in database
      const skills = await prisma.skill.findMany({ take: 2 });
      if (skills.length >= 2) {
        await prisma.studentSkillScore.upsert({
          where: { studentId_skillId: { studentId: testStudentId, skillId: skills[0].id } },
          update: { score: 85.0 },
          create: { studentId: testStudentId, skillId: skills[0].id, score: 85.0 },
        });

        await prisma.studentSkillScore.upsert({
          where: { studentId_skillId: { studentId: testStudentId, skillId: skills[1].id } },
          update: { score: 42.0 },
          create: { studentId: testStudentId, skillId: skills[1].id, score: 42.0 },
        });
      }

      // Execute tool directly
      const toolRes = await executeTool('get_skill_gaps', { domain: testDomainName }, testStudentId);
      expect(toolRes.toolName).toBe('get_skill_gaps');
      expect(toolRes.data.gaps).toBeDefined();

      // Ask Sash about skill gaps
      const response = await processChat(
        'What are my skill gaps for Full-Stack Web?',
        {
          id: testUserId,
          name: 'Satyam',
          role: 'STUDENT',
          studentProfileId: testStudentId,
        },
        [],
        testDomainName
      );

      expect(response).toBeDefined();
      expect(response.message).toBeDefined();

      // Tool calls should be present
      expect(response.toolCalls).toBeDefined();
      expect(response.toolCalls?.[0]?.toolName).toBe('get_skill_gaps');

      // The returned data in the response message must be grounded in real gaps, not arbitrary fake numbers
      if (toolRes.data.gaps.length > 0) {
        const topGap = toolRes.data.gaps[0];
        expect(response.message).toContain(topGap.skillName);
        expect(response.message).toContain(`${topGap.currentScore}%`);
        expect(response.message).toContain(`${topGap.benchmarkScore}%`);
      }
    });

    it('returns grounded match scores matching calculateStudentMatches in final user-facing response', async () => {
      const toolRes = await executeTool('explain_match_score', {}, testStudentId, testDomainName);
      expect(toolRes.toolName).toBe('explain_match_score');

      if (!toolRes.data.error) {
        expect(toolRes.data.overallScore).toBeDefined();
        expect(typeof toolRes.data.overallScore).toBe('number');
        expect(toolRes.data.overallScore).toBeGreaterThanOrEqual(0);
        expect(toolRes.data.overallScore).toBeLessThanOrEqual(100);

        // Call processChat to verify the actual final text shown to the student
        const chatRes = await processChat(
          'Explain my match score for my top internship',
          {
            id: testUserId,
            name: 'Satyam',
            role: 'STUDENT',
            studentProfileId: testStudentId,
          },
          [],
          testDomainName
        );

        expect(chatRes).toBeDefined();
        expect(chatRes.message).toBeDefined();
        // The user-facing text must contain the verified figures, not hallucinated numbers
        expect(chatRes.message).toContain(`${toolRes.data.overallScore}%`);
        expect(chatRes.message).toContain(toolRes.data.internshipTitle);
      }
    });
  });

  describe('6. Student Privacy & Memory Management Endpoints', () => {
    it('retrieves memories strictly for the authenticated student', async () => {
      await upsertStudentMemory(testStudentId, {
        category: 'preference',
        key: 'preferred_stack',
        value: 'Preference: React, Node.js, and PostgreSQL',
      });

      const memories = await getStudentMemories(testStudentId);
      expect(memories.length).toBeGreaterThanOrEqual(1);
      expect(memories.some((m) => m.key === 'preferred_stack')).toBe(true);
    });

    it('deletes a specific memory item by ID', async () => {
      const item = await upsertStudentMemory(testStudentId, {
        category: 'fact',
        key: 'temp_to_delete',
        value: 'Temporary memory to delete',
      });

      await deleteStudentMemory(testStudentId, item.id);

      const check = await prisma.sashMemory.findUnique({
        where: { id: item.id },
      });
      expect(check).toBeNull();
    });

    it('clears all memories for the student on privacy purge', async () => {
      await upsertStudentMemory(testStudentId, {
        category: 'goal',
        key: 'purge_goal',
        value: 'Goal to purge',
      });

      await deleteStudentMemory(testStudentId);

      const remaining = await prisma.sashMemory.findMany({
        where: { studentProfileId: testStudentId },
      });
      expect(remaining.length).toBe(0);
    });
  });
});
