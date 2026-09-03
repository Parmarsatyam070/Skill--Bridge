import { prisma } from '../config/prisma.js';
import { SkillCovered, StudentSkillScore } from '../../../shared/types.js';

/**
 * Marks a course enrollment as completed, updates StudentSkillScores with point gains,
 * and returns the updated skills and delta.
 */
export async function completeCourseEnrollment(studentProfileId: string, enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true }
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  if (enrollment.studentId !== studentProfileId) {
    throw new Error('Enrollment does not belong to this student');
  }

  if (enrollment.status === 'completed') {
    return { alreadyCompleted: true, enrollment };
  }

  // 1. Mark enrollment as completed
  const updatedEnrollment = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      status: 'completed',
      completedAt: new Date(),
    }
  });

  // 2. Parse skillsCovered and bump student's scores
  let skillsCovered: SkillCovered[] = [];
  try {
    skillsCovered = JSON.parse(enrollment.course.skillsCoveredJson);
  } catch {
    skillsCovered = [];
  }

  const updatedSkills: { skillId: string; previousScore: number; newScore: number; pointsGained: number }[] = [];

  for (const sc of skillsCovered) {
    const existing = await prisma.studentSkillScore.findUnique({
      where: {
        studentId_skillId: {
          studentId: studentProfileId,
          skillId: sc.skillId,
        }
      }
    });

    const previousScore = existing ? existing.score : 40;
    const pointsGained = sc.pointsGain || 15;
    const newScore = Math.min(100, Math.round(previousScore + pointsGained));

    await prisma.studentSkillScore.upsert({
      where: {
        studentId_skillId: {
          studentId: studentProfileId,
          skillId: sc.skillId,
        }
      },
      update: {
        score: newScore,
        updatedAt: new Date(),
      },
      create: {
        studentId: studentProfileId,
        skillId: sc.skillId,
        score: newScore,
      }
    });

    updatedSkills.push({
      skillId: sc.skillId,
      previousScore,
      newScore,
      pointsGained,
    });
  }

  return {
    enrollment: updatedEnrollment,
    updatedSkills,
  };
}

/**
 * Grades an assessment submission and updates the student's skill scores.
 */
export async function gradeAssessment(studentProfileId: string, domain: string, answers: Record<string, string>) {
  const questions = await prisma.question.findMany({
    where: { domain }
  });

  const skillPerformance: Record<string, { totalWeight: number; earnedWeight: number }> = {};

  for (const q of questions) {
    let options: { id: string; text: string; isCorrect: boolean }[] = [];
    try {
      options = JSON.parse(q.optionsJson);
    } catch {
      options = [];
    }

    const selectedOptionId = answers[q.id];
    const selectedOption = options.find(o => o.id === selectedOptionId);
    const isCorrect = selectedOption ? selectedOption.isCorrect : false;

    if (!skillPerformance[q.skillId]) {
      skillPerformance[q.skillId] = { totalWeight: 0, earnedWeight: 0 };
    }

    skillPerformance[q.skillId].totalWeight += q.weight;
    if (isCorrect) {
      skillPerformance[q.skillId].earnedWeight += q.weight;
    }
  }

  const updatedSkills: { skillId: string; score: number }[] = [];

  for (const [skillId, perf] of Object.entries(skillPerformance)) {
    const accuracy = perf.totalWeight > 0 ? (perf.earnedWeight / perf.totalWeight) : 0;
    
    // Map accuracy to a 0-100 skill score with baseline curve (e.g. 50 + accuracy * 45)
    const existing = await prisma.studentSkillScore.findUnique({
      where: {
        studentId_skillId: {
          studentId: studentProfileId,
          skillId,
        }
      }
    });

    const evaluatedScore = Math.round(50 + (accuracy * 45)); // 50 to 95 range on assessment
    const finalScore = existing ? Math.round((existing.score * 0.4) + (evaluatedScore * 0.6)) : evaluatedScore;

    await prisma.studentSkillScore.upsert({
      where: {
        studentId_skillId: {
          studentId: studentProfileId,
          skillId,
        }
      },
      update: {
        score: finalScore,
        updatedAt: new Date(),
      },
      create: {
        studentId: studentProfileId,
        skillId,
        score: finalScore,
      }
    });

    updatedSkills.push({ skillId, score: finalScore });
  }

  return {
    evaluatedCount: questions.length,
    updatedSkills,
  };
}

/**
 * Dynamically computes a student's verified digital portfolio from DB data.
 */
export async function getDerivedPortfolio(studentProfileId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: {
      user: true,
      skillScores: {
        include: { skill: true }
      },
      enrollments: {
        where: { status: 'completed' },
        include: {
          course: {
            include: { provider: true }
          }
        },
        orderBy: { completedAt: 'desc' }
      },
      applications: {
        include: {
          internship: {
            include: { industry: true }
          }
        }
      },
      resumes: {
        orderBy: { updatedAt: 'desc' }
      }
    }
  });

  if (!student) throw new Error('Student not found');

  // Fetch benchmark for student's target domain
  const benchmarks = await prisma.skillBenchmark.findMany({
    where: { domain: student.targetDomain },
    include: { skill: true }
  });

  return {
    studentId: student.id,
    name: student.user.name,
    email: student.user.email,
    avatarUrl: student.user.avatarUrl,
    institution: student.institution,
    targetDomain: student.targetDomain,
    cgpa: student.cgpa,
    bio: student.bio,
    gradYear: student.gradYear,
    githubUsername: student.githubUsername,
    linkedinUrl: student.linkedinUrl,
    skills: student.skillScores.map(ss => ({
      skillId: ss.skillId,
      name: ss.skill.name,
      category: ss.skill.category,
      score: ss.score,
    })),
    benchmarks: benchmarks.map(b => ({
      skillId: b.skillId,
      name: b.skill.name,
      benchmarkScore: b.benchmarkScore,
    })),
    completedCourses: student.enrollments.map(e => ({
      courseId: e.courseId,
      title: e.course.title,
      provider: e.course.provider.name,
      providerLogo: e.course.provider.logoUrl,
      externalUrl: e.course.externalUrl,
      completedAt: e.completedAt,
    })),
    verifiedCredentialsCount: student.enrollments.length + student.skillScores.filter(s => s.score >= 75).length,
    recentApplications: student.applications.map(a => ({
      id: a.id,
      internshipTitle: a.internship.title,
      companyName: a.internship.industry.companyName,
      status: a.status,
      matchScoreAtApply: a.matchScoreAtApply,
      appliedAt: a.appliedAt,
    })),
    latestResume: student.resumes[0] || null,
  };
}
