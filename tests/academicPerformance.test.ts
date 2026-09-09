import { describe, it, expect } from 'vitest';
import {
  normalizeSubjectName,
  classifySubjectForStudent,
  calculateDomainWeakSubjects,
  calculateSemesterTrends,
  calculateRadarData,
  generatePersonalizedRoadmaps,
  getPracticeQuestionsByTopic,
  gradePracticeSubmission,
  getCuratedBookRecommendations,
  getCuratedCourseRecommendations,
  isAiMarksheetExtractionConfigured,
  extractMarksheetData,
  AnalyzedSubjectRecord,
} from '../server/src/services/academicPerformanceService.js';

describe('Academic Performance & Improvement Service', () => {
  // ─── 1. SUBJECT NORMALIZATION TESTS ─────────────────────────────────────────
  describe('Subject Normalization', () => {
    it('normalizes common variations of Data Structures to canonical name', () => {
      const aliases = [
        'DS',
        'Data Structure',
        'Data Structures',
        'Data Structures & Algorithms',
        'data structures and algorithms',
        'DSA',
        'Data Structure using C',
        'Advanced Data Structures',
      ];

      for (const alias of aliases) {
        const result = normalizeSubjectName(alias);
        expect(result.normalized).toBe('Data Structures');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      }
    });

    it('normalizes DBMS variations to Database Management Systems', () => {
      const aliases = ['DBMS', 'Database Management', 'database systems', 'RDBMS', 'Database Management Systems'];
      for (const alias of aliases) {
        const result = normalizeSubjectName(alias);
        expect(result.normalized).toBe('Database Management Systems');
      }
    });

    it('normalizes Operating Systems and Computer Networks', () => {
      expect(normalizeSubjectName('OS').normalized).toBe('Operating Systems');
      expect(normalizeSubjectName('Operating System Concepts').normalized).toBe('Operating Systems');
      expect(normalizeSubjectName('CN').normalized).toBe('Computer Networks');
      expect(normalizeSubjectName('Data Communication & Networks').normalized).toBe('Computer Networks');
    });
  });

  // ─── 2. DEGREE / DOMAIN CLASSIFICATION TESTS ────────────────────────────────
  describe('Degree / Domain Subject Classification', () => {
    const cseContext = { branch: 'Computer Science and Engineering', degree: 'B.Tech', targetDomain: 'Full-Stack Web' };
    const mechContext = { branch: 'Mechanical Engineering', degree: 'B.Tech' };
    const eceContext = { branch: 'Electronics & Communication', degree: 'B.Tech' };

    it('classifies subjects properly for CSE student', () => {
      expect(classifySubjectForStudent('Data Structures', cseContext)).toBe('CORE');
      expect(classifySubjectForStudent('Database Management Systems', cseContext)).toBe('CORE');
      expect(classifySubjectForStudent('Operating Systems', cseContext)).toBe('CORE');
      expect(classifySubjectForStudent('Discrete Mathematics', cseContext)).toBe('SUPPORTING');
      expect(classifySubjectForStudent('Engineering Physics', cseContext)).toBe('GENERAL');
      expect(classifySubjectForStudent('Thermodynamics', cseContext)).toBe('UNRELATED');
    });

    it('classifies subjects properly for Mechanical student', () => {
      expect(classifySubjectForStudent('Thermodynamics', mechContext)).toBe('CORE');
      expect(classifySubjectForStudent('Fluid Mechanics', mechContext)).toBe('CORE');
      expect(classifySubjectForStudent('Data Structures', mechContext)).toBe('UNRELATED');
    });

    it('classifies subjects properly for Electronics student', () => {
      expect(classifySubjectForStudent('Digital Signal Processing', eceContext)).toBe('CORE');
      expect(classifySubjectForStudent('Basic Electrical & Electronics', eceContext)).toBe('CORE');
    });
  });

  // ─── 3. TEST 1: DOMAIN-AWARE WEAKNESS PRIORITIZATION ────────────────────────
  describe('Core Rule: Domain-Aware Weakness Prioritization', () => {
    it('prioritizes weak CORE subject (Data Structures @ 58%) over unrelated lowest score (Physics @ 41%)', () => {
      const subjects: AnalyzedSubjectRecord[] = [
        {
          marksheetId: 'm1',
          semester: 2,
          subjectCode: 'PH101',
          subjectName: 'Engineering Physics',
          normalizedSubject: 'Engineering Physics',
          percentage: 41,
          classification: 'UNRELATED',
          isBacklog: false,
        },
        {
          marksheetId: 'm1',
          semester: 2,
          subjectCode: 'CS201',
          subjectName: 'Data Structures',
          normalizedSubject: 'Data Structures',
          percentage: 58,
          classification: 'CORE',
          isBacklog: false,
        },
        {
          marksheetId: 'm1',
          semester: 2,
          subjectCode: 'CS202',
          subjectName: 'DBMS',
          normalizedSubject: 'Database Management Systems',
          percentage: 64,
          classification: 'CORE',
          isBacklog: false,
        },
        {
          marksheetId: 'm1',
          semester: 2,
          subjectCode: 'CS203',
          subjectName: 'Operating Systems',
          normalizedSubject: 'Operating Systems',
          percentage: 72,
          classification: 'CORE',
          isBacklog: false,
        },
      ];

      const trends = calculateSemesterTrends(subjects);
      const { weakSubjects, unrelatedIgnored } = calculateDomainWeakSubjects(subjects, trends);

      // Priority #1 MUST be Data Structures, NOT Physics!
      expect(weakSubjects.length).toBeGreaterThan(0);
      expect(weakSubjects[0].normalizedSubject).toBe('Data Structures');
      expect(weakSubjects[0].classification).toBe('CORE');
      expect(weakSubjects[0].priorityScore).toBe(126); // (100 - 58) * 3 = 126

      // Priority #2 should be DBMS
      expect(weakSubjects[1].normalizedSubject).toBe('Database Management Systems');
      expect(weakSubjects[1].priorityScore).toBe(108); // (100 - 64) * 3 = 108

      // Physics (41%) should be in unrelatedIgnored list and excluded from primary gaps
      expect(unrelatedIgnored.some(u => u.subjectName === 'Engineering Physics')).toBe(true);
      expect(weakSubjects.some(w => w.normalizedSubject === 'Engineering Physics')).toBe(false);
    });

    it('GENERAL subjects (e.g. Physics @ 30%) never override relevant CORE domain weaknesses (DS @ 60%, DBMS @ 65%)', () => {
      const subjects: AnalyzedSubjectRecord[] = [
        {
          marksheetId: 'm1',
          semester: 2,
          subjectCode: 'PH101',
          subjectName: 'Engineering Physics',
          normalizedSubject: 'Engineering Physics',
          percentage: 30,
          classification: 'GENERAL',
          isBacklog: false,
        },
        {
          marksheetId: 'm1',
          semester: 2,
          subjectCode: 'CS201',
          subjectName: 'Data Structures',
          normalizedSubject: 'Data Structures',
          percentage: 60,
          classification: 'CORE',
          isBacklog: false,
        },
        {
          marksheetId: 'm1',
          semester: 2,
          subjectCode: 'CS202',
          subjectName: 'DBMS',
          normalizedSubject: 'Database Management Systems',
          percentage: 65,
          classification: 'CORE',
          isBacklog: false,
        },
      ];

      const trends = calculateSemesterTrends(subjects);
      const { weakSubjects } = calculateDomainWeakSubjects(subjects, trends);

      // Data Structures remains Priority #1 despite Physics having 30%
      expect(weakSubjects.length).toBe(3);
      expect(weakSubjects[0].normalizedSubject).toBe('Data Structures');
      expect(weakSubjects[0].classification).toBe('CORE');
      expect(weakSubjects[1].normalizedSubject).toBe('Database Management Systems');
      expect(weakSubjects[1].classification).toBe('CORE');
      expect(weakSubjects[2].normalizedSubject).toBe('Engineering Physics');
      expect(weakSubjects[2].classification).toBe('GENERAL');
    });

    it('CORE subject with 70% outranks GENERAL subject with 55%', () => {
      const subjects: AnalyzedSubjectRecord[] = [
        {
          marksheetId: 'm1',
          semester: 2,
          subjectName: 'Environmental Studies',
          normalizedSubject: 'Environmental Studies',
          percentage: 55,
          classification: 'GENERAL',
          isBacklog: false,
        },
        {
          marksheetId: 'm1',
          semester: 2,
          subjectName: 'Computer Networks',
          normalizedSubject: 'Computer Networks',
          percentage: 70,
          classification: 'CORE',
          isBacklog: false,
        },
      ];

      const trends = calculateSemesterTrends(subjects);
      const { weakSubjects } = calculateDomainWeakSubjects(subjects, trends);

      expect(weakSubjects[0].normalizedSubject).toBe('Computer Networks');
      expect(weakSubjects[0].classification).toBe('CORE');
    });
  });

  // ─── 4. CROSS-SEMESTER TREND TESTS ──────────────────────────────────────────
  describe('Cross-Semester Trend Calculation', () => {
    it('TEST 2: identifies steadily improving trend (52% -> 61% -> 68%)', () => {
      const records: AnalyzedSubjectRecord[] = [
        {
          marksheetId: 'm1',
          semester: 2,
          subjectName: 'Data Structures',
          normalizedSubject: 'Data Structures',
          percentage: 52,
          classification: 'CORE',
          isBacklog: false,
        },
        {
          marksheetId: 'm2',
          semester: 3,
          subjectName: 'Data Structures & Algorithms',
          normalizedSubject: 'Data Structures',
          percentage: 61,
          classification: 'CORE',
          isBacklog: false,
        },
        {
          marksheetId: 'm3',
          semester: 4,
          subjectName: 'Advanced Data Structures',
          normalizedSubject: 'Data Structures',
          percentage: 68,
          classification: 'CORE',
          isBacklog: false,
        },
      ];

      const trends = calculateSemesterTrends(records);
      const dsTrend = trends.find(t => t.normalizedSubject === 'Data Structures');

      expect(dsTrend).toBeDefined();
      expect(dsTrend?.trend).toBe('IMPROVING');
      expect(dsTrend?.trendScoreDelta).toBe(16);
    });

    it('TEST 3: identifies declining trend (78% -> 69% -> 57%)', () => {
      const records: AnalyzedSubjectRecord[] = [
        {
          marksheetId: 'm1',
          semester: 2,
          subjectName: 'Mathematics - II',
          normalizedSubject: 'Engineering Mathematics',
          percentage: 78,
          classification: 'SUPPORTING',
          isBacklog: false,
        },
        {
          marksheetId: 'm2',
          semester: 3,
          subjectName: 'Discrete Mathematics',
          normalizedSubject: 'Engineering Mathematics',
          percentage: 69,
          classification: 'SUPPORTING',
          isBacklog: false,
        },
        {
          marksheetId: 'm3',
          semester: 4,
          subjectName: 'Applied Probability',
          normalizedSubject: 'Engineering Mathematics',
          percentage: 57,
          classification: 'SUPPORTING',
          isBacklog: false,
        },
      ];

      const trends = calculateSemesterTrends(records);
      const mathTrend = trends.find(t => t.normalizedSubject === 'Engineering Mathematics');

      expect(mathTrend).toBeDefined();
      expect(mathTrend?.trend).toBe('DECLINING');
      expect(mathTrend?.trendScoreDelta).toBe(-21);
    });

    it('TEST 4: identifies persistent weakness (48% -> 51% -> 49%)', () => {
      const records: AnalyzedSubjectRecord[] = [
        {
          marksheetId: 'm1',
          semester: 2,
          subjectName: 'Theory of Computation',
          normalizedSubject: 'Theory of Computation',
          percentage: 48,
          classification: 'CORE',
          isBacklog: false,
        },
        {
          marksheetId: 'm2',
          semester: 3,
          subjectName: 'Formal Languages',
          normalizedSubject: 'Theory of Computation',
          percentage: 51,
          classification: 'CORE',
          isBacklog: false,
        },
        {
          marksheetId: 'm3',
          semester: 4,
          subjectName: 'Automata Theory',
          normalizedSubject: 'Theory of Computation',
          percentage: 49,
          classification: 'CORE',
          isBacklog: false,
        },
      ];

      const trends = calculateSemesterTrends(records);
      const tocTrend = trends.find(t => t.normalizedSubject === 'Theory of Computation');

      expect(tocTrend).toBeDefined();
      expect(tocTrend?.trend).toBe('CONSISTENTLY_WEAK');
    });
  });

  // ─── 5. TEST 5: ALL-STRONG CONDITION ────────────────────────────────────────
  describe('All-Strong Condition', () => {
    it('evaluates hasCriticalWeakness = false when all CORE domain subjects are >= 75%', () => {
      const records: AnalyzedSubjectRecord[] = [
        {
          marksheetId: 'm1',
          semester: 3,
          subjectName: 'Data Structures',
          normalizedSubject: 'Data Structures',
          percentage: 86,
          classification: 'CORE',
          isBacklog: false,
        },
        {
          marksheetId: 'm1',
          semester: 3,
          subjectName: 'DBMS',
          normalizedSubject: 'Database Management Systems',
          percentage: 82,
          classification: 'CORE',
          isBacklog: false,
        },
        {
          marksheetId: 'm1',
          semester: 3,
          subjectName: 'Operating Systems',
          normalizedSubject: 'Operating Systems',
          percentage: 79,
          classification: 'CORE',
          isBacklog: false,
        },
        {
          marksheetId: 'm1',
          semester: 3,
          subjectName: 'Computer Networks',
          normalizedSubject: 'Computer Networks',
          percentage: 88,
          classification: 'CORE',
          isBacklog: false,
        },
      ];

      const trends = calculateSemesterTrends(records);
      const analysis = calculateDomainWeakSubjects(records, trends);

      expect(analysis.hasCriticalWeakness).toBe(false);
      expect(analysis.corePerformanceAvg).toBeGreaterThanOrEqual(75);
      expect(analysis.weakSubjects.length).toBe(0);
    });

    it('low marks in GENERAL (50%) or UNRELATED (40%) do not manufacture a false critical domain weakness when all CORE >= 75%', () => {
      const records: AnalyzedSubjectRecord[] = [
        {
          marksheetId: 'm1',
          semester: 3,
          subjectName: 'Data Structures',
          normalizedSubject: 'Data Structures',
          percentage: 85,
          classification: 'CORE',
          isBacklog: false,
        },
        {
          marksheetId: 'm1',
          semester: 3,
          subjectName: 'DBMS',
          normalizedSubject: 'Database Management Systems',
          percentage: 80,
          classification: 'CORE',
          isBacklog: false,
        },
        {
          marksheetId: 'm1',
          semester: 3,
          subjectName: 'Environmental Studies',
          normalizedSubject: 'Environmental Studies',
          percentage: 50,
          classification: 'GENERAL',
          isBacklog: false,
        },
        {
          marksheetId: 'm1',
          semester: 3,
          subjectName: 'Workshop Practice',
          normalizedSubject: 'Engineering Graphics & CAD',
          percentage: 40,
          classification: 'UNRELATED',
          isBacklog: false,
        },
      ];

      const trends = calculateSemesterTrends(records);
      const analysis = calculateDomainWeakSubjects(records, trends);

      expect(analysis.hasCriticalWeakness).toBe(false);
      expect(analysis.weakSubjects.length).toBe(0);
      expect(analysis.unrelatedIgnored.some(u => u.subjectName === 'Engineering Graphics & CAD')).toBe(true);
    });
  });

  // ─── 6. RADAR & ROADMAP GENERATION ──────────────────────────────────────────
  describe('Radar & Roadmap Generation', () => {
    it('aggregates radar into canonical domain pillars', () => {
      const records: AnalyzedSubjectRecord[] = [
        {
          marksheetId: 'm1',
          semester: 3,
          subjectName: 'Data Structures',
          normalizedSubject: 'Data Structures',
          percentage: 65,
          classification: 'CORE',
          isBacklog: false,
        },
        {
          marksheetId: 'm1',
          semester: 3,
          subjectName: 'DBMS',
          normalizedSubject: 'Database Management Systems',
          percentage: 70,
          classification: 'CORE',
          isBacklog: false,
        },
      ];

      const radar = calculateRadarData(records);
      expect(radar.length).toBe(6);
      expect(radar.some(r => r.pillar === 'Algorithms & Data Structures')).toBe(true);
      expect(radar.some(r => r.pillar === 'Database Systems')).toBe(true);
    });

    it('generates 6 realistic stages in personalized roadmap for prioritized domain gap', () => {
      const weak = [
        {
          subjectName: 'Data Structures',
          normalizedSubject: 'Data Structures',
          classification: 'CORE' as const,
          performancePercentage: 58,
          priorityScore: 126,
          trend: 'DECLINING' as const,
          status: 'Needs Improvement' as const,
          reasonForSelection: 'Core Domain subject',
        },
      ];

      const roadmaps = generatePersonalizedRoadmaps(weak);
      expect(roadmaps.length).toBe(1);
      expect(roadmaps[0].normalizedSubject).toBe('Data Structures');
      expect(roadmaps[0].stages.foundation).toBeDefined();
      expect(roadmaps[0].stages.conceptBuilding).toBeDefined();
      expect(roadmaps[0].stages.guidedPractice).toBeDefined();
      expect(roadmaps[0].stages.advancedPractice).toBeDefined();
      expect(roadmaps[0].stages.assessment).toBeDefined();
      expect(roadmaps[0].stages.mastery).toBeDefined();
    });
  });

  // ─── 7. PRACTICE QUESTION BANK & SCORING ────────────────────────────────────
  describe('Practice Question Bank & Scoring', () => {
    it('retrieves questions by subject and topic', () => {
      const questions = getPracticeQuestionsByTopic('Data Structures', 'Arrays');
      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0].subject).toBe('Data Structures');
      expect(questions[0].topic).toBe('Arrays');
    });

    it('grades practice answers accurately and flags weak topics', async () => {
      const questions = getPracticeQuestionsByTopic('Data Structures', 'Arrays');
      const q1 = questions[0];

      // Submit correct answer for q1
      const result = await gradePracticeSubmission('test-student-id', 'Data Structures', 'Arrays', [
        { questionId: q1.id, selectedAnswer: q1.correctAnswer },
      ]);

      expect(result.score).toBe(1);
      expect(result.totalQuestions).toBe(1);
      expect(result.percentage).toBe(100);
      expect(result.passed).toBe(true);
      expect(result.questionResults[0].isCorrect).toBe(true);
    });
  });

  // ─── 8. PROVIDER CONFIGURATION & EXTRACTION FALLBACK ────────────────────────
  describe('Provider Configuration & Extraction Fallback', () => {
    it('isAiMarksheetExtractionConfigured returns boolean status without throwing', () => {
      const isConfigured = isAiMarksheetExtractionConfigured();
      expect(typeof isConfigured).toBe('boolean');
    });

    it('fallback heuristic extraction provides complete structured curriculum with honest status note', async () => {
      const studentContext = { branch: 'Computer Science and Engineering', degree: 'B.Tech', targetDomain: 'Full-Stack Web' };
      const result = await extractMarksheetData('non-existent-file.pdf', 'application/pdf', 3, '2023-2024', studentContext);

      expect(result.semester).toBe(3);
      expect(result.academicYear).toBe('2023-2024');
      expect(result.subjects.length).toBeGreaterThan(0);
      expect(result.subjects.some(s => s.normalizedSubject === 'Data Structures')).toBe(true);
      expect(result.extractionNotes).toBeDefined();
    });
  });

  // ─── 9. DOWNSTREAM RECOMMENDATION CONSISTENCY ───────────────────────────────
  describe('Downstream Recommendation Consistency', () => {
    it('curates books focused on identified weak domain skill', () => {
      const weak = [
        {
          subjectName: 'Data Structures',
          normalizedSubject: 'Data Structures',
          classification: 'CORE' as const,
          performancePercentage: 58,
          priorityScore: 126,
          trend: 'DECLINING' as const,
          status: 'Needs Improvement' as const,
          reasonForSelection: 'Core Domain subject',
        },
      ];

      const books = getCuratedBookRecommendations(weak);
      expect(books.length).toBeGreaterThan(0);
      expect(books.some(b => b.topicsCovered.some(t => t.toLowerCase().includes('data structure') || t.toLowerCase().includes('algorithm')))).toBe(true);
    });

    it('curates courses with authentic links focused on identified weak domain skill', () => {
      const weak = [
        {
          subjectName: 'Data Structures',
          normalizedSubject: 'Data Structures',
          classification: 'CORE' as const,
          performancePercentage: 58,
          priorityScore: 126,
          trend: 'DECLINING' as const,
          status: 'Needs Improvement' as const,
          reasonForSelection: 'Core Domain subject',
        },
      ];

      const courses = getCuratedCourseRecommendations(weak);
      expect(courses.length).toBeGreaterThan(0);
      expect(courses.some(c => c.provider === 'NPTEL' || c.provider === 'Coursera' || c.provider === 'MIT OpenCourseWare')).toBe(true);
      expect(courses.every(c => c.url.startsWith('https://'))).toBe(true);
    });
  });

  // ─── 10. CSV DEMO DATASET & IMPORT TESTS ───────────────────────────────────
  describe('CSV Demo Dataset & Validation', () => {
    it('validates CSV format, required columns, and parses 150 rows', async () => {
      const { parseAndValidateCsv } = await import('../server/src/scripts/seedAcademicDataset.js');
      const fs = await import('fs');
      const path = await import('path');

      const csvPath = path.join(process.cwd(), 'server', 'data', 'academic-skill-dataset.csv');
      expect(fs.existsSync(csvPath)).toBe(true);

      const content = fs.readFileSync(csvPath, 'utf-8');
      const { validRecords, invalidRows, totalRows } = parseAndValidateCsv(content);

      expect(totalRows).toBe(150);
      expect(validRecords.length).toBe(150);
      expect(invalidRows.length).toBe(0);
      expect(validRecords.every(r => r.overallSkillScore >= 0 && r.overallSkillScore <= 100)).toBe(true);
      expect(validRecords.every(r => r.studentName && r.externalStudentId && r.domain && r.branch && r.skill)).toBe(true);
    });

    it('rejects malformed CSV rows with invalid scores gracefully', async () => {
      const { parseAndValidateCsv } = await import('../server/src/scripts/seedAcademicDataset.js');
      const badCsv = `Student Name,Student ID,Domain,Branch,Skill,Skill Category,Overall Skill Score
Valid Student,STU9999,Technical,Computer Science,Python,Technical - Language,85
Bad Student,STU9998,Technical,Computer Science,Java,Technical - Language,150
Missing Col,STU9997,Technical,Computer Science,C++`;

      const { validRecords, invalidRows } = parseAndValidateCsv(badCsv);
      expect(validRecords.length).toBe(1);
      expect(invalidRows.length).toBe(2);
      expect(invalidRows.some(r => r.reason.includes('Invalid score value'))).toBe(true);
    });
  });

  // ─── 11. ANANYA CHOPRA DEMO DATASET TEST SCENARIO ──────────────────────────
  describe('Demo Scenario: Ananya Chopra (STU1001)', () => {
    it('runs data-driven analysis on Ananya Chopra and prioritizes TypeScript 53% as highest priority gap', async () => {
      const { runDemoStudentAcademicAnalysis, getDemoStudentsList, getDemoDatasetStats } = await import(
        '../server/src/services/academicPerformanceService.js'
      );

      // Verify stats API
      const stats = await getDemoDatasetStats();
      expect(stats.totalRecords).toBeGreaterThanOrEqual(150);
      expect(stats.uniqueStudents).toBeGreaterThanOrEqual(25);
      expect(stats.uniqueBranches).toBeGreaterThanOrEqual(4);
      expect(stats.averageScore).toBeGreaterThan(0);

      // Verify search & list API
      const searchResult = await getDemoStudentsList({ search: 'Ananya Chopra' });
      expect(searchResult.length).toBeGreaterThan(0);
      const ananya = searchResult.find(s => s.externalStudentId === 'STU1001');
      expect(ananya).toBeDefined();
      expect(ananya?.studentName).toBe('Ananya Chopra');
      expect(ananya?.branch).toBe('Computer Science');
      expect(ananya?.domain).toBe('Technical');
      expect(ananya?.skills.some(k => k.skill === 'TypeScript' && k.score === 53)).toBe(true);

      // Run full academic analysis engine on Ananya Chopra
      const analysis = await runDemoStudentAcademicAnalysis('STU1001');

      expect(analysis.isDemo).toBe(true);
      expect(analysis.source).toBe('DEMO_DATASET');
      expect(analysis.demoStudentName).toBe('Ananya Chopra');
      expect(analysis.externalStudentId).toBe('STU1001');
      expect(analysis.totalSubjects).toBe(6);

      // Data-Driven Weakness Prioritization:
      // TypeScript (53%) is CORE technical programming skill -> priority score = (100 - 53) * 3 = 141
      expect(analysis.weakSubjects.length).toBeGreaterThan(0);
      expect(analysis.weakSubjects[0].subjectName).toBe('TypeScript');
      expect(analysis.weakSubjects[0].performancePercentage).toBe(53);
      expect(analysis.weakSubjects[0].classification).toBe('CORE');
      expect(analysis.weakSubjects[0].priorityScore).toBeGreaterThanOrEqual(140);

      // Verify dynamic radar chart
      expect(analysis.radarData.length).toBe(6);
      expect(analysis.radarData.every(r => typeof r.performance === 'number')).toBe(true);

      // Verify roadmap generated for weak skill
      expect(analysis.roadmaps.length).toBeGreaterThan(0);
      expect(analysis.roadmaps[0].subject).toBe('TypeScript');
      expect(analysis.roadmaps[0].stages.foundation).toBeDefined();
      expect(analysis.roadmaps[0].stages.mastery).toBeDefined();

      // Verify books and courses are populated
      expect(analysis.bookRecommendations.length).toBeGreaterThan(0);
      expect(analysis.courseRecommendations.length).toBeGreaterThan(0);
    });

    it('confirms Priority Score is represented as a scalar score (not a percentage string)', async () => {
      const { runDemoStudentAcademicAnalysis } = await import(
        '../server/src/services/academicPerformanceService.js'
      );
      const analysis = await runDemoStudentAcademicAnalysis('STU1001');
      for (const ws of analysis.weakSubjects) {
        expect(typeof ws.priorityScore).toBe('number');
        expect(Number.isFinite(ws.priorityScore)).toBe(true);
        expect(String(ws.priorityScore).includes('%')).toBe(false);
      }
    });

    it('verifies dynamic branch vs domain counts are independently calculated', async () => {
      const { getDemoDatasetStats } = await import(
        '../server/src/services/academicPerformanceService.js'
      );
      const stats = await getDemoDatasetStats();
      expect(stats.uniqueBranches).toBeGreaterThan(0);
      expect(stats.uniqueDomains).toBeGreaterThan(0);
      expect(typeof stats.uniqueBranches).toBe('number');
      expect(typeof stats.uniqueDomains).toBe('number');
    });

    it('verifies demo dataset records are isolated from real student marksheets', async () => {
      const { prisma } = await import('../server/src/config/prisma.js');
      const demoRecords = await prisma.academicSkillDataset.findMany({
        where: { source: 'DEMO_DATASET' },
      });
      expect(demoRecords.length).toBeGreaterThan(0);
      expect(demoRecords.every(r => r.source === 'DEMO_DATASET')).toBe(true);

      // Verify STU1001 is not in UploadedMarksheet
      const realMarksheet = await prisma.uploadedMarksheet.findFirst({
        where: { studentProfileId: 'STU1001' },
      });
      expect(realMarksheet).toBeNull();
    });

    it('retrieves detailed skill records for a specific demo student and returns null for invalid student ID', async () => {
      const { getDemoStudentDetails } = await import(
        '../server/src/services/academicPerformanceService.js'
      );
      const student = await getDemoStudentDetails('STU1001');
      expect(student).toBeDefined();
      expect(student?.studentName).toBe('Ananya Chopra');
      expect(student?.skills.length).toBe(6);

      const nonExistent = await getDemoStudentDetails('NON_EXISTENT_ID');
      expect(nonExistent).toBeNull();
    });
  });
});

