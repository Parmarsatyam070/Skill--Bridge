import { prisma } from '../config/prisma.js';

export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function getYesterdayDateString(): string {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() - 1);
  return now.toISOString().split('T')[0];
}

/**
 * Checks if the student has submitted at least one practice set today
 */
export async function hasCompletedPracticeSetToday(userIdOrStudentId: string): Promise<boolean> {
  const today = getTodayDateString();
  const startOfDay = new Date(`${today}T00:00:00.000Z`);

  const student = await prisma.studentProfile.findFirst({
    where: {
      OR: [{ id: userIdOrStudentId }, { userId: userIdOrStudentId }],
    },
    select: { id: true },
  });

  if (!student) return false;

  const count = await prisma.assessmentAttempt.count({
    where: {
      studentId: student.id,
      submittedAt: {
        gte: startOfDay,
      },
    },
  });

  return count > 0;
}

/**
 * Record user daily activity (for contribution heatmap) and retrieve current streak state.
 * NOTE: Merely opening the app logs activity, but DOES NOT advance the streak without a submitted set.
 */
export async function recordDailyActivity(userId: string) {
  const today = getTodayDateString();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, currentStreak: true, longestStreak: true, lastActiveDate: true },
  });

  if (!user) return null;

  // Check if already logged today in ActivityLog
  const existingLog = await prisma.activityLog.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (existingLog) {
    // 5-minute debounce rate limiter for incrementing daily action count
    const timeSinceLastAction = Date.now() - new Date(existingLog.loggedInAt).getTime();
    if (timeSinceLastAction >= 5 * 60 * 1000) {
      await prisma.activityLog.update({
        where: { id: existingLog.id },
        data: {
          count: existingLog.count + 1,
          loggedInAt: new Date(),
        },
      });
    }
  } else {
    // Create new activity log for today
    await prisma.activityLog.create({
      data: {
        userId,
        date: today,
        count: 1,
      },
    });
  }

  const completedPractice = await hasCompletedPracticeSetToday(userId);

  return {
    currentStreak: user.currentStreak || 0,
    longestStreak: user.longestStreak || 0,
    lastActiveDate: user.lastActiveDate,
    activeToday: completedPractice,
    practiceCompletedToday: completedPractice,
  };
}

/**
 * Triggered whenever a student submits an AssessmentAttempt.
 * Atomically increments their streak once per day upon real practice set completion.
 */
export async function recordPracticeSetSubmissionStreak(studentId: string) {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: { user: true },
  });

  if (!student) return null;
  const user = student.user;

  // Ensure ActivityLog is updated
  await prisma.activityLog.upsert({
    where: {
      userId_date: {
        userId: user.id,
        date: today,
      },
    },
    update: {
      count: { increment: 1 },
      loggedInAt: new Date(),
    },
    create: {
      userId: user.id,
      date: today,
      count: 1,
    },
  });

  // Check if streak was already advanced today
  if (user.lastActiveDate === today) {
    return {
      currentStreak: user.currentStreak || 1,
      longestStreak: user.longestStreak || 1,
      lastActiveDate: today,
      activeToday: true,
      newStreakAwarded: false,
    };
  }

  // Check if user was active yesterday (i.e. lastActiveDate was yesterday)
  const wasActiveYesterday = user.lastActiveDate === yesterday;
  const newCurrentStreak = wasActiveYesterday ? (user.currentStreak || 0) + 1 : 1;
  const newLongestStreak = Math.max(user.longestStreak || 0, newCurrentStreak);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActiveDate: today,
    },
  });

  // Create an in-app celebration notification
  await prisma.inAppNotification.create({
    data: {
      userId: user.id,
      title: `🔥 Daily Practice Completed! ${newCurrentStreak}-Day Streak Active`,
      message: `Great job! You completed today's practice set and advanced your learning streak to ${newCurrentStreak} days.`,
      type: 'DAILY_PRACTICE',
      link: '/skill-profile',
    },
  });

  return {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    lastActiveDate: today,
    activeToday: true,
    newStreakAwarded: true,
  };
}

/**
 * Computes authoritative GitHub-style activity contribution data for a user in a given year.
 */
export async function getUserActivityHeatmap(userId: string, year: number = 2026) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, createdAt: true, currentStreak: true, longestStreak: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const logs = await prisma.activityLog.findMany({
    where: {
      userId,
      date: {
        startsWith: `${year}-`,
      },
    },
    orderBy: { date: 'asc' },
  });

  // Calculate stats server-side
  const totalSubmissions = logs.reduce((acc, log) => acc + (log.count > 0 ? 1 : 0), 0);
  const currentStreak = user.currentStreak || 0;
  const longestStreak = user.longestStreak || 0;

  // Calculate active rate (% of days active since account creation)
  const createdDate = new Date(user.createdAt);
  const now = new Date();
  const diffDays = Math.max(1, Math.ceil(Math.abs(now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
  const allLogsCount = await prisma.activityLog.count({ where: { userId } });
  const activeRate = `${Math.min(100, (allLogsCount / diffDays) * 100).toFixed(1)}%`;

  // Map each log to its 5-step green shading level:
  // 0 -> level 0 (near white / lightest gray)
  // 1 -> level 1 (lightest green)
  // 2 -> level 2 (light-medium green)
  // 3 -> level 3 (medium-dark green)
  // 4+ -> level 4 (darkest green)
  const mappedLogs = logs.map(l => {
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (l.count >= 4) level = 4;
    else if (l.count === 3) level = 3;
    else if (l.count === 2) level = 2;
    else if (l.count >= 1) level = 1;

    return {
      date: l.date,
      count: l.count,
      level,
    };
  });

  return {
    year,
    totalSubmissions,
    currentStreak,
    longestStreak,
    activeRate,
    logs: mappedLogs,
  };
}

/**
 * Calculate dynamic competency points, rank tier, and badges from real activity
 */
export async function calculateStudentActivityPoints(studentId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      skillScores: true,
      enrollments: true,
      applications: true,
      resumes: true,
    },
  });

  if (!student) {
    return {
      totalPoints: 0,
      totalBadges: 0,
      level: 1,
      progressToNextLevel: 0,
      badges: [],
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  // 1. Skill assessment points (2.5 pts per score percentage)
  let skillPoints = 0;
  for (const ss of student.skillScores) {
    skillPoints += Math.round(ss.score * 2.5); // e.g. 80 score -> 200 pts
  }

  // 2. Course completions & enrollments
  let coursePoints = 0;
  for (const enr of student.enrollments) {
    if (enr.status === 'completed') {
      coursePoints += 150;
    } else {
      coursePoints += 30;
    }
  }

  // 3. Internship applications
  const appPoints = student.applications.length * 50;

  // 4. Resume creation
  const resumePoints = student.resumes.length * 75;

  // 5. Daily activity streak bonuses
  const streak = student.user.currentStreak || 0;
  let streakBonus = 0;
  if (streak >= 100) streakBonus += 1000;
  else if (streak >= 30) streakBonus += 350;
  else if (streak >= 7) streakBonus += 100;
  else if (streak >= 3) streakBonus += 30;

  // Total points
  const totalPoints = skillPoints + coursePoints + appPoints + resumePoints + streakBonus;

  // Calculate Level (Level 1 starts at 0, goes up every 350 pts)
  const level = Math.max(1, Math.min(10, Math.floor(totalPoints / 350) + 1));
  const pointsInCurrentLevel = totalPoints % 350;
  const progressToNextLevel = Math.min(100, Math.round((pointsInCurrentLevel / 350) * 100));

  // Determine unlocked badges based on actual achievements
  const badges: { id: string; name: string; icon: string; description: string; unlocked: boolean }[] = [
    {
      id: 'badge-first-step',
      name: 'Pioneer Sign-in',
      icon: 'Sparkles',
      description: 'Created a verified SkillBridge career profile',
      unlocked: true,
    },
    {
      id: 'badge-assessed',
      name: 'Skill Evaluated',
      icon: 'Award',
      description: 'Completed skill assessment and benchmarked scores',
      unlocked: student.skillScores.length > 0,
    },
    {
      id: 'badge-streak-7',
      name: '7-Day Hot Streak',
      icon: 'Flame',
      description: 'Maintained 7 consecutive days of active platform learning',
      unlocked: (student.user.longestStreak || 0) >= 7,
    },
    {
      id: 'badge-course-learner',
      name: 'Curriculum Scholar',
      icon: 'BookOpen',
      description: 'Enrolled in accredited NPTEL / SWAYAM partner courses',
      unlocked: student.enrollments.length > 0,
    },
    {
      id: 'badge-applicant',
      name: 'Industry Contender',
      icon: 'Briefcase',
      description: 'Submitted an application for verified industry internship',
      unlocked: student.applications.length > 0,
    },
    {
      id: 'badge-resume-pro',
      name: 'ATS Resume Architect',
      icon: 'FileText',
      description: 'Generated a standardized industry resume via AI engine',
      unlocked: student.resumes.length > 0,
    },
  ];

  const totalBadges = badges.filter(b => b.unlocked).length;

  return {
    totalPoints,
    totalBadges,
    level,
    progressToNextLevel,
    badges,
    currentStreak: student.user.currentStreak || 0,
    longestStreak: student.user.longestStreak || 0,
  };
}
