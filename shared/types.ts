export type Role = 'STUDENT' | 'INDUSTRY' | 'ACADEMICIAN' | 'INSTITUTION_ADMIN';

export type WorkMode = 'REMOTE' | 'HYBRID' | 'ON_SITE';
export type JobStatus = 'OPEN' | 'CLOSED' | 'DRAFT';
export type ApplicationStatus = 'applied' | 'under_review' | 'shortlisted' | 'interview' | 'hired' | 'rejected';
export type EnrollmentStatus = 'enrolled' | 'completed';
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

export interface InterviewDetails {
  interviewDate: string; // YYYY-MM-DD or ISO
  interviewTime: string; // e.g. "10:30 AM IST"
  roundType: 'technical' | 'hr' | 'system_design' | 'managerial' | 'final';
  roundTitle?: string;
  meetingLink?: string;
  interviewerNotes?: string;
  scheduledAt?: string;
}

export interface HiredDetails {
  offerDate: string;
  joiningDate?: string;
  stipend?: string;
  roleTitle?: string;
  notes?: string;
  hiredAt?: string;
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
  interviewDetails?: InterviewDetails;
  hiredDetails?: HiredDetails;
  resumeId?: string;
  resumeUrl?: string;
  appliedAt: string;
}

export interface SkillMatchPillar {
  score: number; // 0 - 100
  weight: number; // e.g. 0.40
  weightedScore: number;
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
  penalty: number;
}

export interface ExperienceMatchPillar {
  score: number; // 0 - 100
  weight: number; // e.g. 0.30
  weightedScore: number;
  totalProjects: number;
  matchedProjectsCount: number;
  relevantProjects: {
    id?: string;
    title: string;
    description: string;
    techStack: string[];
    matchingSkills: string[];
    hasLiveDemo: boolean;
    hasGithub: boolean;
    demoUrl?: string;
    githubUrl?: string;
  }[];
  verifiedCertificates: {
    id?: string;
    title: string;
    issuer: string;
    issueDate?: string;
    credentialUrl?: string;
    isRelevant: boolean;
  }[];
  techStackOverlapPct: number;
  highlights: string[];
}

export interface AssessmentScorePillar {
  score: number; // 0 - 100
  weight: number; // e.g. 0.30
  weightedScore: number;
  attemptsCount: number;
  passedCount: number;
  averageTestScore: number;
  dsaSolvedCount: number;
  dsaBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
  dailyPracticeStreak: number;
  calibrationTier: 'Expert' | 'Proficient' | 'Developing' | 'Uncalibrated';
  badge: string;
}

export interface MatchBreakdown {
  internshipId: string;
  internshipTitle: string;
  companyName: string;
  overallScore: number; // 0 - 100
  tier: 'high' | 'medium' | 'low'; // >=80% high, 50-79% medium, <50% low
  pillars: {
    skillMatch: SkillMatchPillar;
    experienceMatch: ExperienceMatchPillar;
    assessmentScore: AssessmentScorePillar;
  };
  // Backwards-compatible legacy fields for existing UI components
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
  verificationHash?: string;
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

// ========================================================
// OPPORTUNITY PLATFORM TYPES
// ========================================================

export type OpportunityType =
  | 'JOB'
  | 'INTERNSHIP'
  | 'APPRENTICESHIP'
  | 'PROJECT'
  | 'TRAINING'
  | 'CERTIFICATION'
  | 'WORKSHOP'
  | 'HACKATHON'
  | 'MENTORSHIP'
  | 'GUEST_LECTURE'
  | 'RESEARCH';

export type OpportunityWorkMode = 'REMOTE' | 'HYBRID' | 'ON_SITE';
export type OpportunityExperienceLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD';
export type OpportunityStatus = 'OPEN' | 'PAUSED' | 'CLOSED' | 'DRAFT';

export interface OpportunitySkillItem {
  id?: string;
  skillId: string;
  skillName?: string;
  proficiencyLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  weight?: number;
  minScore?: number;
  isMandatory: boolean;
}

export interface OpportunitySummary {
  id: string;
  title: string;
  description: string;
  type: OpportunityType | string;
  industry?: string;
  location: string;
  remote: boolean;
  workMode: OpportunityWorkMode | string;
  experienceLevel: OpportunityExperienceLevel | string;
  educationRequirements?: string | null;
  stipend?: string | null;
  duration?: string | null;
  applicationDeadline?: string | null;
  status: OpportunityStatus | string;
  createdAt: string;
  company: {
    id: string;
    name: string;
    website?: string | null;
    industry?: string | null;
  };
  requiredSkills: OpportunitySkillItem[];
  applicantCount?: number;
  matchCount?: number;
}

export interface OpportunityFactorBreakdown {
  score: number;
  weight: number;
  weighted: number;
}

export interface OpportunityMatchBreakdown {
  algorithmVersion: string;
  opportunityId: string;
  totalScore: number;
  tier: 'high' | 'medium' | 'low';
  eligibility: boolean;
  ineligibilityReason: string | null;
  factors: {
    requiredSkillsCoverage: OpportunityFactorBreakdown;
    skillProficiencyDepth: OpportunityFactorBreakdown;
    experienceTechOverlap: OpportunityFactorBreakdown;
    projectPortfolioQuality: OpportunityFactorBreakdown;
    assessmentAndDSA: OpportunityFactorBreakdown;
    educationMatch: OpportunityFactorBreakdown;
    certificationRelevance: OpportunityFactorBreakdown;
  };
}

export interface OpportunityMatchItem {
  opportunityId: string;
  opportunityTitle: string;
  score: number;
  tier: 'high' | 'medium' | 'low';
  eligibility: boolean;
  ineligibilityReason: string | null;
  company: { id: string; name: string } | null;
  type?: string;
  location?: string;
  workMode?: string;
  stipend?: string | null;
  matchedSkills?: any[];
  missingSkills?: any[];
  strengths?: string[];
  recommendations?: string[];
  breakdown?: OpportunityMatchBreakdown;
}

export interface SafeCandidateSkillDto {
  name: string;
  score: number;
  verificationLevel: string;
  verifiedAt?: string | Date | null;
}

export interface SafeCandidateProjectDto {
  title: string;
  description: string;
  technologies: string[];
  liveUrl?: string | null;
  githubUrl?: string | null;
}

export interface SafeCandidateDto {
  id: string;
  studentProfileId: string;
  fullName: string;
  avatarUrl?: string | null;
  institutionName?: string | null;
  department?: string | null;
  degree?: string | null;
  graduationYear?: number | null;
  cgpaBracket?: string | null;
  generalLocation?: string | null;
  sanitizedBio?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  skills: SafeCandidateSkillDto[];
  projects?: SafeCandidateProjectDto[];
  matchScore?: number;
  matchBreakdown?: any;
}

export interface CopilotCandidateRanking {
  candidateId: string;
  candidateName: string;
  advisoryScore: number;
  advisoryReason: string;
}

export interface CopilotComparisonResult {
  advisoryRanking: CopilotCandidateRanking[];
  advisorySummary: string;
  topStrengths: Record<string, string[]>;
  topGaps: Record<string, string[]>;
  disclaimer: string;
}

export interface CopilotQueryResult {
  intent: 'CANDIDATE_SEARCH' | 'SKILL_QUERY' | 'MARKET_INSIGHT' | 'GENERAL';
  answer: string;
  supportingData?: any;
  disclaimer: string;
}

// ============================================================
// PHASE 5 — TALENT PLATFORM ASSESSMENT SYSTEM DTOs
// ============================================================

export const TALENT_ASSESSMENT_ADVISORY_DISCLAIMER =
  'Assessments are scored deterministically by the SkillBridge test engine. Results are advisory evaluations of technical proficiency for matching and recruitment purposes.';

export type TalentAssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type TalentAssessmentQuestionType = 'MCQ' | 'TECHNICAL' | 'SCENARIO' | 'BEHAVIORAL' | 'SHORT_ANSWER';

export interface TalentAssessmentOptionDto {
  id: string;
  text: string;
}

export interface TalentAssessmentAdminOptionDto extends TalentAssessmentOptionDto {
  isCorrect?: boolean;
}

export interface TalentAssessmentQuestionDto {
  id: string;
  assessmentId: string;
  type: TalentAssessmentQuestionType;
  prompt: string;
  options: TalentAssessmentOptionDto[];
  points: number;
  displayOrder: number;
  skillId?: string | null;
}

export interface TalentAssessmentAdminQuestionDto extends TalentAssessmentQuestionDto {
  options: TalentAssessmentAdminOptionDto[];
  rubric?: string | null;
  starterCode?: string | null;
  testCasesJson?: string | null;
}

export interface TalentAssessmentSummaryDto {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  passingScorePct: number;
  status: TalentAssessmentStatus;
  opportunityId?: string | null;
  opportunityTitle?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  questionCount: number;
  totalPoints: number;
  requiredSkills: string[];
  createdAt: string;
  updatedAt: string;
  mySubmission?: {
    id: string;
    score: number;
    passed: boolean;
    timeSpentSeconds: number;
    startedAt: string;
    submittedAt: string | null;
  } | null;
}

export interface TalentAssessmentDetailDto extends TalentAssessmentSummaryDto {
  questions: TalentAssessmentQuestionDto[];
}

export interface TalentAssessmentAdminDetailDto extends TalentAssessmentSummaryDto {
  questions: TalentAssessmentAdminQuestionDto[];
}

export interface TalentAssessmentSubmissionDto {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string | null;
  institution?: string | null;
  headline?: string | null;
  startedAt: string;
  submittedAt: string | null;
  timeSpentSeconds: number;
  score: number;
  passed: boolean;
  technicalScore: number;
  skillScoreBreakdown?: Record<string, { score: number; total: number }>;
  feedback?: string | null;
}

export interface TalentAssessmentStartResult {
  submissionId: string;
  assessmentId: string;
  title: string;
  durationMinutes: number;
  startedAt: string;
  timeRemainingSeconds: number;
  questions: TalentAssessmentQuestionDto[];
}

export interface TalentAssessmentSubmitResult {
  submissionId: string;
  assessmentId: string;
  score: number;
  passed: boolean;
  timeSpentSeconds: number;
  submittedAt: string;
  totalQuestions: number;
  correctQuestions: number;
  skillBreakdown?: Record<string, { score: number; total: number }>;
  disclaimer: string;
}

// ============================================================
// PHASE 6: AI INTERVIEW SYSTEM TYPES & DTOs
// ============================================================

export const AI_INTERVIEW_ADVISORY_DISCLAIMER =
  "AI interview evaluations are advisory educational signals generated by generative AI models for candidate preparation and recruiter screening context. They do not constitute authoritative hiring decisions, employment guarantees, or automated rejections. Authoritative hiring decisions remain exclusively with human recruiters.";

export type InterviewType = 'TECHNICAL' | 'BEHAVIORAL' | 'HR' | 'MIXED';
export type InterviewStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type InterviewRecommendation = 'STRONGLY_RECOMMEND' | 'RECOMMEND' | 'MAYBE' | 'DO_NOT_RECOMMEND';

export interface InterviewQuestionItem {
  id: string;
  questionNumber: number;
  question: string;
  category: 'TECHNICAL' | 'BEHAVIORAL' | 'SYSTEM_DESIGN' | 'PROBLEM_SOLVING' | 'EXPERIENCE';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  targetSkill?: string;
  context?: string;
}

export interface InterviewAnswerItem {
  questionId: string;
  questionNumber: number;
  question: string;
  answer: string;
  answeredAt: string;
  timeSpentSeconds?: number;
}

export interface InterviewSkillObservation {
  skill: string;
  observation: string;
  rating: number; // 0 - 100
}

export interface InterviewEvaluation {
  overallScore: number; // 0 - 100 AI advisory signal
  technicalScore?: number;
  communicationScore?: number;
  readinessTier: 'READY' | 'ALMOST_READY' | 'DEVELOPING' | 'NEEDS_WORK';
  recommendation: InterviewRecommendation;
  strengths: string[];
  improvementAreas: string[];
  evidenceObserved: string[];
  skillObservations: InterviewSkillObservation[];
  communicationObservations: string[];
  recommendations: string[];
  advisoryDisclaimer: string;
}

export interface InterviewSessionSummaryDto {
  id: string;
  opportunityId?: string | null;
  opportunityTitle?: string | null;
  companyName?: string | null;
  candidateId: string;
  candidateName: string;
  candidateAvatar?: string | null;
  institution?: string | null;
  headline?: string | null;
  type: InterviewType;
  status: InterviewStatus;
  questionCount: number;
  answeredCount: number;
  overallScore?: number | null;
  recommendation?: InterviewRecommendation | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface InterviewSessionDetailDto {
  id: string;
  opportunityId?: string | null;
  opportunityTitle?: string | null;
  companyName?: string | null;
  candidateId: string;
  candidateName: string;
  candidateAvatar?: string | null;
  institution?: string | null;
  headline?: string | null;
  type: InterviewType;
  status: InterviewStatus;
  scheduledAt?: string | null;
  completedAt?: string | null;
  currentQuestionNumber: number;
  totalQuestions: number;
  questions: InterviewQuestionItem[];
  currentQuestion?: InterviewQuestionItem | null;
  transcript: InterviewAnswerItem[];
  evaluation?: InterviewEvaluation | null;
  overallScore?: number | null;
  recommendation?: InterviewRecommendation | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartInterviewInput {
  opportunityId?: string | null;
  type?: InterviewType;
  targetDomain?: string;
  totalQuestions?: number;
}

export interface SubmitAnswerInput {
  questionNumber: number;
  questionId: string;
  answer: string;
  timeSpentSeconds?: number;
}

export interface CompleteInterviewInput {
  notes?: string;
}

// ============================================================
// PHASE 7: COLLABORATION MANAGEMENT TYPES
// ============================================================

export type CollaborationType =
  | 'WORKSHOP'
  | 'HACKATHON'
  | 'MENTORSHIP'
  | 'CURRICULUM'
  | 'RESEARCH'
  | 'PLACEMENT_DRIVE';

export type CollaborationStatus =
  | 'REQUESTED'
  | 'DISCUSSION'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'ACCEPTED'
  | 'ACTIVE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface CollaborationInstitutionParticipant {
  id: string;
  institutionName: string;
  adminDesignation?: string | null;
}

export interface CollaborationCompanyParticipant {
  id: string;
  companyName: string;
  website?: string | null;
  industrySector?: string | null;
}

export interface CollaborationSenderUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
}

export interface CollaborationMessageDto {
  id: string;
  collaborationId: string;
  senderUserId: string;
  senderUser: CollaborationSenderUser;
  message: string;
  createdAt: string;
}

export interface CollaborationSummaryDto {
  id: string;
  institutionId: string;
  companyId: string;
  type: CollaborationType;
  title: string;
  description: string;
  skillsJson?: string | null;
  targetDepartment?: string | null;
  proposedDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: CollaborationStatus;
  initiatedByRole: string;
  createdAt: string;
  updatedAt: string;
  institution: CollaborationInstitutionParticipant;
  company: CollaborationCompanyParticipant;
  _count?: {
    messages: number;
  };
}

export interface CollaborationDetailDto {
  id: string;
  institutionId: string;
  companyId: string;
  type: CollaborationType;
  title: string;
  description: string;
  skillsJson?: string | null;
  targetDepartment?: string | null;
  proposedDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: CollaborationStatus;
  initiatedByRole: string;
  createdAt: string;
  updatedAt: string;
  institution: CollaborationInstitutionParticipant;
  company: CollaborationCompanyParticipant;
  messages: CollaborationMessageDto[];
}

export interface CreateCollaborationInput {
  type: CollaborationType;
  title: string;
  description: string;
  skills?: string[];
  targetDepartment?: string;
  proposedDate?: string;
  institutionId?: string; // Required for Industry
  companyId?: string;     // Required for Institution
}

export interface UpdateCollaborationStatusInput {
  status: CollaborationStatus;
  startDate?: string;
  endDate?: string;
}

export interface SendCollaborationMessageInput {
  message: string;
}

export interface CollaborationPartnersResponse {
  institutions: Array<{ id: string; institutionName: string; adminDesignation?: string | null }>;
  companies: Array<{ id: string; companyName: string; website?: string | null; industrySector?: string | null }>;
}

// ========================================================
// PHASE 8: INTELLIGENCE DASHBOARD DTOs
// ========================================================

export type GapSeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IndustryOverviewDto {
  activeOpportunities: number;
  totalApplications: number;
  shortlistedCandidates: number;
  assessmentsCompleted: number;
  interviewsCompleted: number;
  hiredCandidates: number;
  overallConversionRate: number; // Percentage
}

export interface RecruitmentFunnelStage {
  stage: 'applied' | 'under_review' | 'shortlisted' | 'interview' | 'hired';
  label: string;
  count: number;
  percentageOfTotal: number;
  conversionFromPrevious: number;
}

export interface IndustryFunnelResponse {
  stages: RecruitmentFunnelStage[];
  totalApplications: number;
  rejectedCount: number;
  overallConversionRate: number;
}

export interface IndustryOpportunityPerformanceItem {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  applicationCount: number;
  eligibleCandidateCount: number;
  matchCount: number;
  assessmentParticipationCount: number;
  interviewCount: number;
  hiredCount: number;
  conversionRate: number;
}

export interface IndustryOpportunityPerformanceResponse {
  opportunities: IndustryOpportunityPerformanceItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SkillDemandItem {
  skillId: string;
  skillName: string;
  category: string;
  demandCount: number;
  demandPct: number;
  mandatoryCount: number;
  preferredCount: number;
}

export interface CandidateSkillSupplyItem {
  skillId: string;
  skillName: string;
  category: string;
  demandCount: number;
  candidateSupplyCount: number;
  coveragePct: number;
  gapType: 'HEALTHY' | 'SUPPLY_DEFICIT' | 'HIGH_DEMAND_LOW_SUPPLY';
}

export interface IndustrySkillAnalyticsResponse {
  topDemandedSkills: SkillDemandItem[];
  skillSupplyComparison: CandidateSkillSupplyItem[];
  totalOpportunitiesAnalyzed: number;
}

export interface IndustryAssessmentAnalyticsDto {
  assessmentsCreated: number;
  totalSubmissions: number;
  completionRate: number;
  averageScore: number;
  passRate: number;
  assessments: Array<{
    id: string;
    title: string;
    submissionsCount: number;
    averageScore: number;
    passedCount: number;
    passRate: number;
  }>;
}

export interface IndustryInterviewAnalyticsDto {
  interviewsScheduled: number;
  interviewsCompleted: number;
  completionRate: number;
  averageScore: number | null;
  typeDistribution: Record<string, number>;
  recommendationDistribution: Record<string, number>;
}

export interface IndustryTrendsDto {
  periodLabel: string;
  monthlyApplications: Array<{ month: string; count: number }>;
  monthlyOpportunities: Array<{ month: string; count: number }>;
  skillTrends: Array<{
    skillName: string;
    month: string;
    demandCount: number;
    trendDirection: string;
  }>;
}

export interface InstitutionOverviewDto {
  totalStudents: number;
  verifiedSkillsCount: number;
  highDemandSkillsCount: number;
  skillGapsCount: number;
  affectedStudentsCount: number;
  studentsWithImprovementCount: number;
  activeInterventionsCount: number;
}

export interface InstitutionSkillComparisonItem {
  skillId: string;
  skillName: string;
  category: string;
  industryDemandCount: number;
  studentCoverageCount: number;
  coveragePct: number;
  avgStudentScore: number;
  gapSeverity: GapSeverityLevel;
  affectedStudentCount: number;
  verificationStrengthPct: number;
}

export interface InstitutionSkillsResponse {
  institutionName: string;
  totalStudents: number;
  comparison: InstitutionSkillComparisonItem[];
}

export interface AffectedStudentDto {
  id: string;
  fullName: string;
  targetDomain: string;
  cgpaBracket: string | null;
  currentSkillScore: number;
  verificationLevel: string;
  lastAttemptDate: string | null;
}

export interface AffectedStudentsResponse {
  skillId: string;
  skillName: string;
  gapSeverity: GapSeverityLevel;
  totalAffected: number;
  students: AffectedStudentDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InstitutionInterventionRecommendation {
  id: string;
  skillId: string;
  skillName: string;
  gapSeverity: GapSeverityLevel;
  interventionType: 'COURSE' | 'RESOURCE' | 'ASSESSMENT' | 'PRACTICE';
  title: string;
  provider: string;
  url: string;
  rationale: string;
  enrolledStudentsCount: number; // 0 if none enrolled
}

export interface InstitutionInterventionsResponse {
  institutionName: string;
  recommendations: InstitutionInterventionRecommendation[];
}

export interface InstitutionTrendsDto {
  periodLabel: string;
  cohortScoreProgression: Array<{ month: string; avgScore: number; evaluatedCount: number }>;
  topGapSkillsTrend: Array<{ skillName: string; currentGap: number; severity: GapSeverityLevel }>;
}

export interface IntelligenceAiInsight {
  summary: string;
  keyObservations: string[];
  recommendations: string[];
  disclaimer: string;
  generatedAt: string;
}

// ============================================================
// EXAM INTEGRITY / ANTI-CHEATING SYSTEM TYPES
// ============================================================

export type ExamIntegrityEventType =
  | 'COPY_ATTEMPT'
  | 'PASTE_ATTEMPT'
  | 'FORCE_PASTE_ATTEMPT'
  | 'CUT_ATTEMPT'
  | 'CONTEXT_MENU_ATTEMPT'
  | 'DRAG_DROP_ATTEMPT'
  | 'PRINT_SCREEN_ATTEMPT'
  | 'SCREENSHOT_ATTEMPT'
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'VISIBILITY_CHANGE'
  | 'FULLSCREEN_EXIT';

export type ExamIntegritySessionType =
  | 'TALENT_ASSESSMENT'
  | 'PRACTICE_SET'
  | 'DAILY_SET'
  | 'DSA_PRACTICE'
  | 'MOCK_INTERVIEW'
  | 'AI_INTERVIEW'
  | 'PROTECTED_EXAM';

export interface ExamIntegrityEventPayload {
  sessionId: string;
  sessionType: ExamIntegritySessionType;
  eventType: ExamIntegrityEventType;
  metadata?: {
    targetElement?: string;
    keyCombo?: string;
    clientTimestamp?: number;
    url?: string;
  };
}

export interface ExamSuspensionState {
  isSuspended: boolean;
  suspendedUntil: string | null; // ISO Date String
  remainingSeconds: number;
  reason?: string;
  violationCount: number;
}

export interface ExamIntegrityResponse {
  status: 'OK' | 'WARNING' | 'SUSPENDED';
  action?: 'NONE' | 'WARNING' | 'SUSPENDED';
  message?: string;
  isConfirmedViolation: boolean;
  violationCount: number;
  warningIssued: boolean;
  warningMessage?: string;
  suspensionTriggered: boolean;
  suspension?: ExamSuspensionState;
  eventType: ExamIntegrityEventType;
  occurredAt: string;
}

export interface ExamIntegrityStatusDto {
  userId: string;
  isSuspended: boolean;
  suspendedUntil: string | null;
  remainingSeconds: number;
  activeSessionViolations: Record<string, number>;
}

// ─── Academic Performance & Improvement Types ──────────────────────────────────
export type SubjectClassification = 'CORE' | 'SUPPORTING' | 'GENERAL' | 'UNRELATED';
export type SubjectTrend = 'IMPROVING' | 'DECLINING' | 'CONSISTENTLY_WEAK' | 'ONE_TIME_DIP' | 'STRONG';
export type MarksheetStatus = 'DRAFT' | 'VERIFIED' | 'ANALYZED' | 'ERROR';
export type AcademicPerformanceCategory = 'Strong' | 'Moderate' | 'Needs Improvement' | 'Attention Required';

export interface MarksheetSubjectDto {
  id?: string;
  marksheetId?: string;
  subjectCode?: string | null;
  subjectName: string;
  normalizedSubject: string;
  marksObtained?: number | null;
  maxMarks?: number | null;
  percentage: number;
  grade?: string | null;
  credits?: number | null;
  classification: SubjectClassification;
  isBacklog?: boolean;
  isPassed?: boolean;
}

export interface UploadedMarksheetDto {
  id: string;
  studentProfileId: string;
  semester: number;
  academicYear: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: MarksheetStatus;
  sgpa?: number | null;
  totalCredits?: number | null;
  extractionNotes?: string | null;
  subjects: MarksheetSubjectDto[];
  createdAt: string;
  updatedAt: string;
}

export interface AcademicRadarSkillDto {
  pillar: string;
  skill: string;
  performance: number; // 0 - 100
  benchmark: number; // Target score e.g. 75
  category: AcademicPerformanceCategory;
  relevance: SubjectClassification;
  subjectCount: number;
}

export interface CrossSemesterTrendDto {
  subjectName: string;
  normalizedSubject: string;
  classification: SubjectClassification;
  trend: SubjectTrend;
  trendScoreDelta: number; // e.g. +16% or -21%
  semesterScores: { semester: number; percentage: number; grade?: string | null }[];
  summary: string;
}

export interface WeakSubjectDto {
  subjectName: string;
  normalizedSubject: string;
  classification: SubjectClassification;
  performancePercentage: number;
  grade?: string | null;
  priorityScore: number; // e.g. 126
  trend: SubjectTrend;
  status: AcademicPerformanceCategory;
  reasonForSelection: string;
  isBacklog?: boolean;
}

export interface RoadmapStageItem {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  topics: string[];
  actionableTasks: string[];
  completed?: boolean;
}

export interface PersonalizedRoadmapDto {
  subject: string;
  normalizedSubject: string;
  priorityRank: number;
  currentPerformance: number;
  targetPerformance: number;
  stages: {
    foundation: RoadmapStageItem;
    conceptBuilding: RoadmapStageItem;
    guidedPractice: RoadmapStageItem;
    advancedPractice: RoadmapStageItem;
    assessment: RoadmapStageItem;
    mastery: RoadmapStageItem;
  };
}

export interface BookRecommendationDto {
  subject: string;
  title: string;
  author: string;
  edition?: string;
  difficulty: 'Beginner' | 'Standard Academic' | 'Advanced Reference';
  topicsCovered: string[];
  whyRecommended: string;
  publisher?: string;
}

export interface CourseRecommendationDto {
  subject: string;
  courseName: string;
  provider: 'NPTEL' | 'Coursera' | 'edX' | 'MIT OpenCourseWare' | 'freeCodeCamp' | 'Stanford Online' | 'SkillBridge Partner';
  url: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  topics: string[];
  whyRecommended: string;
  isFree: boolean;
  rating: number;
  duration?: string;
}

export interface AcademicAnalysisDto {
  id?: string;
  studentProfileId: string;
  overallPercentage: number;
  domainPercentage: number;
  coreDomainPercentage: number;
  semestersAnalyzed: number;
  totalSubjects: number;
  academicStatus: string;
  hasCriticalWeakness: boolean;
  radarData: AcademicRadarSkillDto[];
  trends: CrossSemesterTrendDto[];
  weakSubjects: WeakSubjectDto[];
  roadmaps: PersonalizedRoadmapDto[];
  bookRecommendations: BookRecommendationDto[];
  courseRecommendations: CourseRecommendationDto[];
  advancedMasteryTracks?: {
    trackName: string;
    description: string;
    challenges: string[];
    certifications: string[];
  }[];
  unrelatedSubjectsIgnored?: {
    subjectName: string;
    percentage: number;
    reason: string;
  }[];
  isDemo?: boolean;
  source?: 'REAL_MARKSHEET' | 'DEMO_DATASET' | string;
  demoStudentName?: string;
  externalStudentId?: string;
  demoBranch?: string;
  demoDomain?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DemoDatasetStatsDto {
  totalRecords: number;
  uniqueStudents: number;
  uniqueBranches: number;
  uniqueDomains: number;
  uniqueSkills: number;
  uniqueSkillCategories?: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
}

export interface DemoStudentSkillDto {
  skill: string;
  skillCategory: string;
  score: number;
}

export interface DemoStudentDto {
  externalStudentId: string;
  studentName: string;
  domain: string;
  branch: string;
  skills: DemoStudentSkillDto[];
  averageScore: number;
  lowestSkill: { skill: string; score: number };
  highestSkill: { skill: string; score: number };
}

export interface PracticeQuestionItemDto {
  id: string;
  subject: string;
  topic: string;
  type: 'MCQ' | 'CONCEPTUAL' | 'PROBLEM_SOLVING' | 'CODING';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  question: string;
  options?: string[];
  correctAnswer: string | number; // index or text
  explanation: string;
  codeSnippet?: string;
  hint?: string;
}

export interface PracticeSubmissionDto {
  subject: string;
  topic: string;
  answers: {
    questionId: string;
    selectedAnswer: string | number;
  }[];
}

export interface PracticeResultDto {
  subject: string;
  topic: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  questionResults: {
    questionId: string;
    question: string;
    selectedAnswer: string | number;
    correctAnswer: string | number;
    isCorrect: boolean;
    explanation: string;
  }[];
  weakTopics: string[];
  recommendedNextStudy: string[];
}

/* ─── INDUSTRY DEMO DATASET DTOs ─────────────────────────────────────────── */

export interface IndustryDemoStatsDto {
  totalRecords: number;
  uniqueCandidates: number;
  dataSourcesCount: number;
  universitiesCount: number;
  branchesCount: number;
  skillsCount: number;
  skillCategoriesCount: number;
  sourceDomainsCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  universities: string[];
  dataSources: string[];
  branches: string[];
  skills: string[];
}

export interface IndustryDemoCandidateSkillDto {
  skill: string;
  skillCategory: string;
  skillScore: number;
}

export interface IndustryDemoCandidateDto {
  id: string;
  externalStudentId: string;
  studentName: string;
  university: string;
  branch: string;
  sourceDomain?: string | null;
  derivedDomain: string;
  averageScore: number;
  sourceDataset: string;
  skills: IndustryDemoCandidateSkillDto[];
  matchScore?: number;
  skillCoverageRatio?: string;
  stage?: string;
  knownSkills?: Array<{ skill: string; score: number }>;
  missingSkills?: string[];
}

export interface IndustryDemoOpportunityDto {
  id: string;
  title: string;
  companyName: string;
  roleType: string;
  location: string;
  department: string;
  requiredSkills: string[];
  description: string;
  minScoreThreshold: number;
  applicantCount: number;
}

export interface IndustryDemoComparisonResultDto {
  advisoryRanking: Array<{
    candidateId: string;
    candidateName: string;
    externalStudentId: string;
    university: string;
    branch: string;
    matchScore: number;
    skillCoverageRatio: string;
    knownSkillScore: number;
    advisoryReason: string;
  }>;
  advisorySummary: string;
  topStrengths: Record<string, string[]>;
  topGaps: Record<string, string[]>;
  disclaimer: string;
}

export interface IndustryDemoAnalyticsDto {
  totalCandidates: number;
  totalOpportunities: number;
  totalApplications: number;
  shortlistedCount: number;
  assessmentCount: number;
  interviewCount: number;
  hiredCount: number;
  averageSkillScore: number;
  universityDistribution: Array<{ university: string; count: number; averageScore: number }>;
  branchDistribution: Array<{ branch: string; count: number; averageScore: number }>;
  skillSupply: Array<{ skill: string; candidateCount: number; averageScore: number; category: string }>;
  funnelStages: Array<{ stage: string; count: number; conversionRate: number }>;
}



