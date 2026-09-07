export type Role = 'STUDENT' | 'INDUSTRY' | 'ACADEMICIAN' | 'INSTITUTION_ADMIN';

export type WorkMode = 'REMOTE' | 'HYBRID' | 'ON_SITE';
export type JobStatus = 'OPEN' | 'CLOSED' | 'DRAFT';
export type ApplicationStatus = 'applied' | 'under_review' | 'shortlisted' | 'rejected';
export type EnrollmentStatus = 'enrolled' | 'completed';
export type AcademicOpportunityType = 'fdp' | 'research' | 'industrial_training';
export type SkillCategory = 'technical' | 'soft' | 'core';

export interface UserSession {
  id: string;
  email: string;
  phone?: string;
  phoneVerified?: boolean;
  name: string;
  role: Role;
  avatarUrl?: string;
  currentStreak?: number;
  longestStreak?: number;
  lastActiveDate?: string;
  studentProfile?: {
    id: string;
    institution: string;
    targetDomain: string;
    cgpa?: number;
    bio?: string;
    gradYear?: number;
    resumeUrl?: string;
    githubUsername?: string;
    linkedinUrl?: string;
    headline?: string;
    location?: string;
    resumeFileName?: string;
    experiencesJson?: string;
    educationsJson?: string;
    projectsJson?: string;
    certificatesJson?: string;
    responsibilitiesJson?: string;
    achievementsJson?: string;
    socialsJson?: string;
    customSkillsJson?: string;
  };
  industryProfile?: {
    id: string;
    companyName: string;
    website?: string;
    industrySector: string;
    verified: boolean;
  };
  academicianProfile?: {
    id: string;
    institution: string;
    department: string;
    designation: string;
  };
  institutionProfile?: {
    id: string;
    institutionName: string;
    adminDesignation: string;
  };
}

export interface ActivityLog {
  id: string;
  userId: string;
  date: string;
  loggedInAt: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
  activeToday: boolean;
  streakMilestones: {
    days: number;
    bonusPoints: number;
    achieved: boolean;
  }[];
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  description?: string;
}

export interface SkillBenchmark {
  id: string;
  domain: string;
  skillId: string;
  skillName: string;
  benchmarkScore: number;
}

export interface ScoreHistoryEntry {
  date: string;
  score: number;
  attemptId?: string;
  delta?: number;
}

export interface StudentSkillScore {
  id?: string;
  studentId: string;
  skillId: string;
  skillName: string;
  category?: SkillCategory;
  score: number;
  lastAttemptDate?: string;
  scoreHistory?: ScoreHistoryEntry[];
  inactivityDecayPct?: number;
  decayDaysCount?: number;
  delta?: number; // e.g. +6 or -4
  updatedAt?: string;
}

export interface RequiredSkill {
  skillId: string;
  skillName?: string;
  weight: number; // 1 to 5
  minScore: number; // 0 to 100
}

export interface SkillCovered {
  skillId: string;
  skillName?: string;
  pointsGain: number; // points gained on completion (e.g., +15)
}

export interface CourseProvider {
  id: string;
  name: string;
  logoUrl?: string;
  baseUrl: string;
  isVerified: boolean;
}

export interface Course {
  id: string;
  providerId: string;
  provider?: CourseProvider;
  title: string;
  description: string;
  skillsCovered: SkillCovered[];
  externalUrl: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  enrolled?: boolean;
  completed?: boolean;
  enrollmentId?: string;
}

export interface Internship {
  id: string;
  industryId: string;
  companyName?: string;
  companyLogo?: string;
  title: string;
  description: string;
  requiredSkills: RequiredSkill[];
  stipend: string;
  location: string;
  workMode: WorkMode;
  status: JobStatus;
  postedAt: string;
  applied?: boolean;
  matchScore?: number;
  matchTier?: 'high' | 'medium' | 'low';
}

export interface Application {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentInstitution?: string;
  studentTargetDomain?: string;
  internshipId: string;
  internshipTitle?: string;
  companyName?: string;
  status: ApplicationStatus;
  matchScoreAtApply: number;
  currentMatchScore?: number;
  coverNote?: string;
  resumeId?: string;
  resumeUrl?: string;
  appliedAt: string;
}

export interface MatchBreakdown {
  internshipId: string;
  internshipTitle: string;
  companyName: string;
  overallScore: number; // 0 - 100
  tier: 'high' | 'medium' | 'low'; // >=80% high, 50-79% medium, <50% low
  matchedSkills: {
    skillId: string;
    skillName: string;
    studentScore: number;
    requiredScore: number;
    weight: number;
    contribution: number;
    isMet: boolean;
  }[];
  strengths: string[];
  missingSkills: {
    skillId: string;
    skillName: string;
    gap: number;
    recommendedCourses: {
      courseId: string;
      title: string;
      providerName: string;
      externalUrl: string;
      pointsGain: number;
    }[];
  }[];
}

export interface ActivityHeatmapResponse {
  year: number;
  totalSubmissions: number;
  currentStreak: number;
  longestStreak: number;
  activeRate: string;
  logs: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[];
}

export interface ResumeDocument {
  id: string;
  studentId: string;
  type: 'AI_GENERATED' | 'BUILT' | 'UPLOADED';
  title: string;
  templateId?: string;
  fileUrl?: string;
  fileSize?: string;
  isPrimary: boolean;
  content: {
    fullName: string;
    headline?: string;
    email: string;
    phone?: string;
    location?: string;
    avatarUrl?: string;
    summary?: string;
    skills: string[];
    educations: {
      id?: string;
      degree: string;
      institution: string;
      duration: string;
      score?: string;
    }[];
    experiences: {
      id?: string;
      title: string;
      company: string;
      location?: string;
      duration: string;
      description: string;
    }[];
    responsibilities?: {
      id?: string;
      title: string;
      org?: string;
      description: string;
    }[];
    projects: {
      id?: string;
      title: string;
      description: string;
      techStack?: string[] | string;
      demoUrl?: string;
      githubUrl?: string;
    }[];
    socials?: {
      linkedin?: string;
      github?: string;
      website?: string;
      twitter?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ResumeData {
  id: string;
  studentId: string;
  type: 'AI_GENERATED' | 'BUILT' | 'UPLOADED';
  title: string;
  templateId?: string;
  fileUrl?: string;
  fileSize?: string;
  isPrimary?: boolean;
  contentJson?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  domain: string;
  skillId: string;
  skillName?: string;
  type: 'technical' | 'soft';
  prompt: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  weight: number;
  entryFunctionName?: string;
}

export interface DomainSkillReqItem {
  skillId: string;
  skillName: string;
  category: SkillCategory;
  benchmarkScore: number;
  displayOrder: number;
}

export interface DomainCatalogItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  avgSalaryINR: number;
  avgSalaryDisplay: string; // e.g. "₹13.8 LPA"
  icon: string;
  skills: DomainSkillReqItem[];
}

export interface StudentDomainInfo {
  id: string;
  domainId: string;
  domainName: string;
  isPrimary: boolean;
  addedAt: string;
}

export interface DomainRecommendation {
  domainId: string;
  domainName: string;
  slug: string;
  description: string;
  avgSalaryINR: number;
  avgSalaryDisplay: string;
  icon: string;
  skillOverlapPercentage: number; // 0 - 100
  overlappingSkillsCount: number;
  totalRequiredSkills: number;
  overlappingSkills: { skillId: string; skillName: string; currentScore: number }[];
  missingSkills: { skillId: string; skillName: string; benchmarkScore: number }[];
  weightedScore: number; // 0 - 100
  readinessTier: 'High Readiness' | 'Moderate Gap' | 'Exploratory';
}

export interface RoadmapMilestoneAction {
  text: string;
  link?: string;
  isDone?: boolean;
}

export interface CuratedRoadmapResource {
  id: string;
  title: string;
  type: 'book' | 'youtube_channel' | 'youtube_playlist' | 'course' | 'website';
  category: 'books' | 'videos' | 'recommended' | 'courses';
  author?: string;
  provider: string;
  url: string;
  whyRecommended: string;
  rating?: number;
  isFree?: boolean;
  topicTag: string;
}

export interface RoadmapMilestone {
  id: string;
  phase: string;
  timeframe: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  accentColor: 'campus-blue' | 'bridge-teal' | 'industry-amber';
  actions: RoadmapMilestoneAction[];
  skillTags?: string[];
  recommendedCourses?: {
    id: string;
    title: string;
    provider: string;
    duration: string;
    pointsGain: number;
    externalUrl: string;
  }[];
  recommendedBooks?: CuratedRoadmapResource[];
  recommendedYoutube?: CuratedRoadmapResource[];
}

export interface RoadmapResponse {
  domain: string;
  studentGapsCount: number;
  targetRole?: string;
  projectedSalaryRange?: string;
  readinessScore?: number;
  milestones: RoadmapMilestone[];
  isRoleSpecific?: boolean;
  internshipId?: string;
  companyName?: string;
  mockInterviewWeakAreas?: string[];
}

export type PortfolioTheme = 'teal_dark' | 'slate_clean' | 'indigo_creative' | 'cyber_amber';

export interface PortfolioServiceCard {
  icon: string;
  title: string;
  description: string;
}

export interface PortfolioProjectItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  thumbnail?: string;
  githubUrl?: string;
  demoUrl?: string;
}

export interface PortfolioStatItem {
  label: string;
  value: string;
  subtext?: string;
}

export interface PortfolioWebsiteData {
  id: string;
  studentId: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED';
  theme: PortfolioTheme;
  enableBot: boolean;
  headline: string;
  subheadline: string;
  heroCtaText: string;
  heroCtaLink: string;
  heroImageUrl?: string;
  services: PortfolioServiceCard[];
  projects: PortfolioProjectItem[];
  aboutBio: string;
  aboutImageUrl?: string;
  skills: string[];
  stats: PortfolioStatItem[];
  contactEmail?: string;
  socials: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
    email?: string;
  };
  sectionsOrder: string[]; // ['hero', 'services', 'projects', 'about', 'stats', 'contact', 'footer']
  sectionsVisibility: {
    hero: boolean;
    services: boolean;
    projects: boolean;
    about: boolean;
    stats: boolean;
    contact: boolean;
    footer: boolean;
  };
  studentName?: string;
  studentInstitution?: string;
  studentDomain?: string;
  student?: {
    id: string;
    targetDomain: string;
    collegeName: string;
    institution?: string;
    headline?: string;
    bio?: string;
    user?: {
      name: string;
      email: string;
      avatarUrl?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioMessageData {
  id: string;
  portfolioId: string;
  senderName: string;
  senderEmail: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type PracticeSetCategory =
  | 'domain'
  | 'aptitude_quant'
  | 'aptitude_english_reading'
  | 'aptitude_english_listening'
  | 'daily_mixed'
  | 'dsa';

export interface PracticeSetData {
  id: string;
  domainId?: string;
  domainName: string;
  type: PracticeSetCategory;
  title: string;
  description: string;
  timeLimitMinutes: number;
  passingScorePct: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  displayOrder: number;
  questionCount: number;
  previousBestScore?: number;
  previousBestAttempt?: {
    score: number;
    passed: boolean;
    submittedAt: string;
  } | null;
}

export interface ListeningPassageData {
  id: string;
  title: string;
  audioUrl?: string;
  audioText: string;
  transcript: string;
  durationSeconds: number;
}

export interface TestCaseData {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  explanation?: string;
}

export interface ExternalPlatformLink {
  platform: 'LeetCode' | 'GeeksforGeeks';
  topic: string;
  url: string;
}

export type SupportedLanguage = 'javascript' | 'python' | 'java' | 'cpp' | 'c';

export type ExecutionStatus =
  | 'IDLE'
  | 'COMPILING'
  | 'COMPILE_ERROR'
  | 'COMPILED'
  | 'RUNNING'
  | 'WRONG_ANSWER'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'RUNNER_ERROR'
  | 'ACCEPTED';

export interface TestResultData {
  id: string;
  testCaseId?: string;
  passed: boolean;
  status: 'PASSED' | 'FAILED' | 'NOT_EXECUTED';
  input: string;
  expectedOutput: string;
  actualOutput: string;
  executionTimeMs: number;
  error?: string;
  isHidden?: boolean;
}

export interface CodeExecutionResult {
  status: ExecutionStatus;
  passed: boolean; // true ONLY when status === 'ACCEPTED'
  compilationSuccess: boolean;
  executionCompleted: boolean;
  compilationTimeMs: number | null;
  executionTimeMs: number | null;
  testsTotal: number;
  testsExecuted: number;
  testsPassed: number;
  allTestsPassed: boolean;
  totalTestCases: number; // backward compatibility
  passedTestCases: number; // backward compatibility
  failedTestCases: number; // backward compatibility
  language?: SupportedLanguage | string;
  stdout?: string;
  stderr?: string;
  compilerOutput?: string;
  exitCode?: number | null;
  errorType?: string;
  error?: string;
  testResults: TestResultData[];
  testCaseResults: TestResultData[]; // backward compatibility alias
  logs?: string[];
}

export interface AssessmentQuestionData {
  id: string;
  domain: string;
  skillId: string;
  type: 'technical' | 'soft' | 'aptitude';
  questionType: 'mcq' | 'written' | 'coding';
  prompt: string;
  options: { id: string; text: string }[];
  weight: number;
  practiceSetId?: string;
  listeningPassageId?: string;
  listeningPassage?: ListeningPassageData | null;
  passageText?: string;
  explanation?: string;
  starterCode?: string;
  entryFunctionName?: string;
  testCases?: TestCaseData[];
  constraints?: string;
  inputFormat?: string;
  outputFormat?: string;
  externalLinks?: ExternalPlatformLink[];
}

export interface DailyPracticeStatus {
  completedToday: boolean;
  lastSubmittedAt: string | null;
  currentStreak: number;
  longestStreak: number;
  streakActive: boolean;
  recommendedSet: {
    id: string;
    title: string;
    domainName: string;
    type: PracticeSetCategory;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    timeLimitMinutes: number;
    questionCount: number;
    reason: string;
  } | null;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'DAILY_PRACTICE' | 'MATCH_ALERT' | 'SKILL_UPDATE' | 'SYSTEM';
  link?: string;
  read: boolean;
  createdAt: string;
}

export type LearningResourceType = 'website' | 'app' | 'youtube_channel' | 'youtube_playlist' | 'course' | 'book';

export interface LearningResource {
  id: string;
  skillId?: string;
  topicTag: string;
  domain?: string;
  type: LearningResourceType;
  title: string;
  url: string;
  provider: string;
  author?: string;
  description: string;
  whyRecommended?: string;
  isFree: boolean;
  rating?: number;
  thumbnailUrl?: string;
  displayOrder?: number;
  createdAt?: string;
}

export interface AssessmentStartResponse {
  attemptId: string;
  practiceSet: PracticeSetData;
  timeLimitMinutes: number;
  questions: AssessmentQuestionData[];
  previousBestScore?: number;
}

export interface AssessmentSubmitResult {
  attemptId: string;
  practiceSetId: string;
  practiceSetTitle: string;
  score: number;
  scorePct?: number; // Alias for UI
  passed: boolean;
  passingScorePct: number;
  timeSpentSeconds: number;
  totalPointsEarned?: number;
  maxPossiblePoints?: number;
  evaluatedCount: number;
  correctMcqCount: number;
  totalMcqCount: number;
  writtenCount: number;
  codingCount?: number;
  practiceSet?: PracticeSetData;
  updatedSkills?: { skillId: string; score: number; skillName: string }[];
  skillDeltas?: {
    skillId: string;
    skillName: string;
    previousScore: number;
    newScore: number;
    delta: number;
    decayDaysCount?: number;
    inactivityDecayPct?: number;
  }[];
  questionResults: {
    questionId: string;
    prompt: string;
    questionType: 'mcq' | 'written' | 'coding';
    userAnswer: string;
    correctAnswerText?: string;
    isCorrect?: boolean;
    score: number;
    pointsAwarded?: number;
    maxScore: number;
    maxPoints?: number;
    aiFeedback?: string;
    feedback?: string;
    explanation?: string;
    codeResult?: CodeExecutionResult;
    externalLinks?: ExternalPlatformLink[];
  }[];
  questionBreakdown?: {
    questionId: string;
    prompt: string;
    questionType: 'mcq' | 'written' | 'coding';
    userAnswer: string;
    correctAnswerText?: string;
    isCorrect?: boolean;
    score: number;
    pointsAwarded: number;
    maxScore: number;
    maxPoints: number;
    aiFeedback?: string;
    feedback?: string;
    explanation?: string;
    codeResult?: CodeExecutionResult;
    externalLinks?: ExternalPlatformLink[];
  }[];
}

export interface HistoricalAttemptItem {
  id: string;
  practiceSetId: string;
  practiceSetTitle: string;
  domainName: string;
  type: PracticeSetCategory;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  score: number;
  passed: boolean;
  passingScorePct: number;
  timeSpentSeconds: number;
  timeLimitMinutes: number;
  startedAt: string;
  submittedAt: string;
  isBestScore: boolean;
  totalQuestions: number;
  strongSkills: string[];
  weakSkills: string[];
}

export interface FocusAreaItem {
  topic: string;
  category: 'dsa' | 'domain' | 'aptitude';
  failureSummary: string; // e.g. "3 missed questions out of 4 (25% accuracy)"
  explanation: string; // AI-generated pattern explanation
  practiceSet: {
    id: string;
    title: string;
    url: string;
    type: string;
    estimatedMinutes?: number;
    difficulty?: string;
  };
  tips: string[]; // 2-3 practical "tips & tricks" bullets specific to topic
  metrics: {
    accuracyPct: number;
    attemptsCount: number;
    failedCount?: number;
    lastAttemptDate?: string | null;
  };
}

export interface ReportCardSummaryData {
  totalAttempts: number;
  passedAttempts: number;
  passRate: number; // e.g. 75.0
  averageScore: number; // e.g. 82.5
  performanceTrend: 'improving' | 'steady' | 'declining' | 'neutral';
  attempts: HistoricalAttemptItem[];
  // Category-wise score breakdowns
  categoryBreakdown?: {
    domain: { totalAttempts: number; passedAttempts: number; passRate: number; averageScore: number };
    aptitude: { totalAttempts: number; passedAttempts: number; passRate: number; averageScore: number };
    dsa: { totalAttempts: number; passedAttempts: number; passRate: number; averageScore: number };
    dailyMixed: { totalAttempts: number; passedAttempts: number; passRate: number; averageScore: number };
  };
  // Streak and activity history
  streakHistory?: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate?: string | null;
    activeDaysLast30: number;
    activityHeatmap: { date: string; count: number }[];
  };
  // Skill radar progression over time
  radarProgression?: {
    skillId: string;
    skillName: string;
    category: string;
    currentScore: number;
    benchmarkScore: number;
    inactivityDecayPct: number;
    decayDaysCount: number;
    lastAttemptDate?: string | null;
    history: { date: string; score: number; delta: number }[];
  }[];
  // Actionable Focus Areas
  focusAreas?: FocusAreaItem[];
}

export interface HistoricalAttemptDetail {
  id: string;
  practiceSetId: string;
  practiceSetTitle: string;
  domainName: string;
  type: PracticeSetCategory;
  difficulty: string;
  score: number;
  passed: boolean;
  passingScorePct: number;
  timeSpentSeconds: number;
  timeLimitMinutes: number;
  submittedAt: string;
  skillBreakdown: { skillId: string; skillName: string; scoreDelta: number }[];
  questionResults: {
    questionId: string;
    prompt: string;
    questionType: 'mcq' | 'written' | 'coding';
    userAnswer: string;
    correctAnswerText?: string;
    isCorrect?: boolean;
    score: number;
    maxScore: number;
    aiFeedback?: string;
    explanation?: string;
    codeResult?: CodeExecutionResult;
    externalLinks?: ExternalPlatformLink[];
  }[];
}

export type DSAPlatform =
  | 'LEETCODE'
  | 'GEEKSFORGEEKS'
  | 'CSES'
  | 'CODEFORCES'
  | 'LeetCode'
  | 'GeeksforGeeks'
  | 'Codeforces';
export type DSADifficulty = 'Easy' | 'Medium' | 'Hard';
export type DSAAttemptStatus = 'UNSEEN' | 'VIEWED' | 'ATTEMPTED' | 'SOLVED' | 'FAILED';

export interface DSAQuestionData {
  id: string;
  title: string;
  slug: string;
  platform: DSAPlatform;
  difficulty: DSADifficulty;
  topic: string;
  tags: string[];
  canonicalUrl: string;
  estimatedMinutes: number;
  description?: string;
  starterCode?: Record<string, string> | string;
  testCases?: TestCaseData[];
  entryFunctionName?: string;
  companyTags?: string[];
  styleTag?: string; // e.g. "LeetCode-style (Medium)", "GFG-style", "CSES-style", "Codeforces-style (Div 2 B)"
  outboundUrl?: string; // Direct link to solve authentic original problem on platform
  userAttemptStatus?: DSAAttemptStatus;
  userLastCode?: string;
}

export interface DSAAttemptData {
  id: string;
  questionId: string;
  status: DSAAttemptStatus;
  timeSpentSeconds: number;
  codeSubmitted?: string;
  language?: string;
  attemptCount: number;
  isDailyPractice: boolean;
  updatedAt: string;
}

export interface DSASubmissionItem {
  id: string;
  questionId: string;
  status: DSAAttemptStatus | ExecutionStatus;
  language: string;
  executionTimeMs?: number;
  codeSubmitted?: string;
  submittedAt: string;
}

export interface DailyPracticeData {
  id: string;
  date: string;
  questionCount: number;
  questions: DSAQuestionData[];
  completedQuestionIds: string[];
  score: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  timeSpentSeconds: number;
  currentStreak: number;
  longestStreak: number;
  startedAt?: string;
  completedAt?: string;
}

// ─────────────────────────────────────────────────────────────
// DAILY MIXED PRACTICE SET (Aptitude + Domain Core + DSA)
// ─────────────────────────────────────────────────────────────

export type DailyMixedQuestionSource = 'aptitude' | 'domain' | 'dsa';

export interface DailyMixedQuestionItem {
  id: string;
  sourceType: DailyMixedQuestionSource;
  categoryLabel: string; // e.g. "Quantitative Aptitude", "English Reading", "Full-Stack Web Core", "DSA / Algorithms"
  questionType: 'mcq' | 'written' | 'coding';
  prompt: string;
  difficulty: string;
  weight: number;
  // MCQ fields
  options?: { id: string; text: string }[];
  // Audio & Reading fields
  listeningPassage?: ListeningPassageData | null;
  passageText?: string;
  // Coding fields
  starterCode?: Record<string, string> | string;
  entryFunctionName?: string;
  testCases?: TestCaseData[];
  constraints?: string;
  externalLinks?: ExternalPlatformLink[];
  styleTag?: string;
  outboundUrl?: string;
  isRoleTargeted?: boolean;
  targetRoleSkill?: string;
}

export interface DailyMixedPracticeSetData {
  id: string;
  date: string;
  studentId: string;
  totalQuestions: number;
  aptitudeCount: number;
  domainCount: number;
  dsaCount: number;
  questions: DailyMixedQuestionItem[];
  completedQuestionIds: string[];
  overallScore: number;
  passed: boolean;
  categoryScores: {
    aptitudeScore: number;
    aptitudePassed: boolean;
    domainScore: number;
    domainPassed: boolean;
    dsaScore: number;
    dsaPassed: boolean;
  };
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  currentStreak: number;
  longestStreak: number;
  timeSpentSeconds: number;
  startedAt?: string;
  completedAt?: string;
  isTargetRoleWeighted?: boolean;
  targetRole?: string;
  targetRoleGaps?: string[];
}

export interface DailyMixedSubmitResult {
  dailyPracticeId: string;
  date: string;
  overallScore: number;
  passed: boolean;
  streakUpdated: boolean;
  currentStreak: number;
  longestStreak: number;
  categoryBreakdown: {
    aptitude: { score: number; total: number; correct: number; passed: boolean };
    domain: { score: number; total: number; correct: number; passed: boolean };
    dsa: { score: number; total: number; solved: number; passed: boolean };
  };
  questionResults: {
    questionId: string;
    sourceType: DailyMixedQuestionSource;
    prompt: string;
    isCorrect: boolean;
    score: number;
    maxScore: number;
    userAnswer: string;
    explanation?: string;
    feedback?: string;
    codeResult?: CodeExecutionResult;
  }[];
}

export interface DSAProgressSummary {
  totalSolved: number;
  totalAttempted: number;
  easySolved: number;
  easyTotal: number;
  mediumSolved: number;
  mediumTotal: number;
  hardSolved: number;
  hardTotal: number;
  platformBreakdown: { platform: DSAPlatform; solved: number; total: number }[];
  topicBreakdown: { topic: string; solved: number; total: number; accuracy: number }[];
  currentStreak: number;
  longestStreak: number;
  weakTopics: string[];
  strongTopics: string[];
  recentActivity: { date: string; solvedCount: number; attemptCount: number }[];
}

export interface DSACustomSetRequest {
  questionCount: 15 | 20 | 25 | 30;
  difficulty?: 'All' | 'Easy' | 'Medium' | 'Hard';
  platform?: 'All' | DSAPlatform;
  topic?: string;
  includeWeakTopics?: boolean;
  filterUnseenOnly?: boolean;
}

export type LearningCategory =
  | 'recommended'
  | 'videos'
  | 'courses'
  | 'documentation'
  | 'articles'
  | 'practice'
  | 'projects'
  | 'books'
  | 'interview_prep';

export interface SmartLearningResource {
  id: string;
  topicTag: string;
  domain?: string;
  category: LearningCategory;
  type: string;
  title: string;
  url: string;
  provider: string;
  author?: string;
  description: string;
  whyRecommended?: string;
  isFree: boolean;
  rating: number;
  difficulty?: string;
  authorityScore: number;
  tags: string[];
  thumbnailUrl?: string;
  relevanceScore?: number;
}

export interface LearningHubSearchResponse {
  query: string;
  totalResults: number;
  personalizedWeakTopics?: string[];
  categories: Record<LearningCategory, SmartLearningResource[]>;
}

// ── Daily Target Types ──
export interface DailyTargetData {
  id: string;
  studentId: string;
  date: string; // Format: YYYY-MM-DD
  title: string;
  targetGoal: string;
  actionLabel: string;
  targetType: 'dsa' | 'practice_set' | 'resource' | 'roadmap_phase';
  targetUrl: string;
  targetRefId?: string;
  roadmapPhase: string;
  focusTopic: string;
  rationale: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

// ── Mock Interview Types ──
export interface MockInterviewQuestionItem {
  id: string;
  questionIndex: number;
  category: 'technical' | 'behavioral';
  skillTag: string;
  questionText: string;
  tips?: string;
}

export interface MockInterviewAnswerItem {
  questionIndex: number;
  questionText: string;
  category: 'technical' | 'behavioral';
  skillTag: string;
  studentAnswer: string;
  timeTakenSeconds: number;
  isSkipped?: boolean;
}

export interface QuestionFeedbackItem {
  questionIndex: number;
  score: number;
  maxScore: number;
  relevanceScore: number;
  clarityScore: number;
  grammarScore: number;
  structureScore: number;
  feedback: string;
  quotedSnippet?: string;
  improvements?: string;
}

export interface MockInterviewEvaluation {
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  structureScore: number;
  readinessTier: 'High Readiness' | 'Interview Ready' | 'Developing' | 'Needs Work';
  overallSummary: string;
  strengths: string[];
  weakAreas: string[];
  questionFeedback: QuestionFeedbackItem[];
}

export interface MockInterviewSessionData {
  id: string;
  studentId: string;
  internshipId?: string;
  targetRole: string;
  companyName?: string;
  date: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  durationSeconds: number;
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  structureScore: number;
  readinessTier: string;
  questions: MockInterviewQuestionItem[];
  transcript: MockInterviewAnswerItem[];
  feedback?: MockInterviewEvaluation;
  identifiedGaps: string[];
  retakeNumber: number;
  isTimedOut: boolean;
  startedAt: string;
  completedAt?: string;
}

export interface MockInterviewHistoryItem {
  id: string;
  internshipId?: string;
  targetRole: string;
  companyName?: string;
  date: string;
  durationSeconds: number;
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  structureScore: number;
  readinessTier: string;
  retakeNumber: number;
  identifiedGaps: string[];
  strengths: string[];
  completedAt: string;
}

export interface MockInterviewHistoryResponse {
  sessions: MockInterviewHistoryItem[];
  totalSessions: number;
  averageScore: number;
  overallTrend: 'improving' | 'declining' | 'steady' | 'neutral';
  scoreTrend: {
    retakeNumber: number;
    date: string;
    score: number;
    targetRole: string;
  }[];
  commonWeakAreas: string[];
  latestSession?: MockInterviewHistoryItem;
}
