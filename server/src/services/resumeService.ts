import { jsPDF } from 'jspdf';
import { prisma } from '../config/prisma.js';
import { isLlmConfigured, generateLlmText } from './llmService.js';

/**
 * Generates structured AI resume data by pulling verified skill scores,
 * completed courses, projects, and custom input.
 */
export async function generateResumeContent(
  studentProfileId: string,
  customInput?: { careerObjective?: string; additionalAchievements?: string[]; projects?: any[] }
) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: {
      user: true,
      skillScores: { include: { skill: true } },
      enrollments: {
        where: { status: 'completed' },
        include: { course: { include: { provider: true } } }
      }
    }
  });

  if (!student) throw new Error('Student profile not found');

  const topSkills = student.skillScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(ss => ss.skill.name);

  // Parse structured JSON arrays from profile if available
  const parseJson = (str: string | null, defaultValue: any) => {
    if (!str) return defaultValue;
    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  };

  const experiences = parseJson(student.experiencesJson, []);
  const educations = parseJson(student.educationsJson, [
    {
      degree: 'B.Tech in Computer Science & Engineering',
      institution: student.institution || 'University',
      duration: '2022 - 2026',
      score: student.cgpa ? `CGPA: ${student.cgpa}/10` : 'First Class Honors',
    }
  ]);
  const projects = parseJson(student.projectsJson, [
    {
      title: `${student.targetDomain || 'Full-Stack'} Architecture Platform`,
      description: 'Engineered high-performance web service featuring automated state synchronization and robust API endpoints.',
      techStack: ['TypeScript', 'Node.js', 'React', 'Docker'],
      githubUrl: student.githubUsername ? `https://github.com/${student.githubUsername}/platform-core` : undefined,
    }
  ]);
  const responsibilities = parseJson(student.responsibilitiesJson, []);
  const socials = parseJson(student.socialsJson, {
    github: student.githubUsername ? `https://github.com/${student.githubUsername}` : undefined,
    linkedin: student.linkedinUrl || undefined,
  });

  let summary = student.bio || customInput?.careerObjective ||
    `Results-driven ${student.targetDomain || 'Software'} engineer with strong fundamentals and hands-on proficiency across modern engineering tools. Demonstrated problem solver with industry-aligned skill vectors and verified platform achievements.`;

  if (isLlmConfigured()) {
    try {
      const generated = await generateLlmText({
        systemPrompt: 'You are an expert ATS resume writer. Write a concise, impactful 2-3 sentence professional resume summary tailored for student tech roles.',
        prompt: `Candidate Name: ${student.user.name}\nTarget Domain: ${student.targetDomain || 'Software Engineering'}\nTop Verified Skills: ${topSkills.join(', ')}\nInstitution: ${student.institution || 'Engineering College'}\nObjective: ${customInput?.careerObjective || ''}`,
      });
      if (generated && generated.trim().length > 20) {
        summary = generated.trim();
      }
    } catch {
      // Gracefully retain default summary
    }
  }

  return {
    fullName: student.user.name,
    headline: student.headline || (student.targetDomain ? `Aspiring ${student.targetDomain} Specialist` : 'Software Developer'),
    email: student.user.email,
    phone: student.user.phone || '+91 98765 43210',
    location: student.location || 'India',
    summary,
    skills: topSkills.length > 0 ? topSkills : ['TypeScript', 'React.js', 'Node.js', 'PostgreSQL', 'Docker'],
    verifiedSkills: student.skillScores.map(ss => ({ name: ss.skill.name, score: ss.score, category: ss.skill.category })),
    educations,
    experiences,
    responsibilities,
    projects,
    socials,
  };
}

/**
 * Generates a clean, ATS-compliant downloadable PDF binary buffer using jsPDF.
 */
export function renderResumePdf(resumeContent: any, template: string = 'modern_clean'): Buffer {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 40;

  // Header Colors based on template
  const isModern = template === 'modern_clean' || template === 'modern';
  const isTechnical = template === 'technical_ats';
  const isAcademic = template === 'classic_academic';

  const primaryColor = isModern ? [47, 140, 130] : isTechnical ? [30, 41, 59] : isAcademic ? [180, 83, 9] : [15, 23, 42];

  // Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(resumeContent.fullName || 'Student Name', 40, y);
  y += 18;

  // Headline
  if (resumeContent.headline) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(resumeContent.headline, 40, y);
    y += 14;
  }

  // Contact info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const contactLine = [
    resumeContent.email,
    resumeContent.phone,
    resumeContent.location,
    resumeContent.socials?.linkedin ? `LinkedIn: ${resumeContent.socials.linkedin}` : null,
    resumeContent.socials?.github ? `GitHub: ${resumeContent.socials.github}` : null,
  ].filter(Boolean).join('  •  ');

  doc.text(contactLine, 40, y);
  y += 15;

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(40, y, pageWidth - 40, y);
  y += 18;

  // Helper Section Header
  const printSectionHeader = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(title.toUpperCase(), 40, y);
    y += 4;
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1.5);
    doc.line(40, y, 120, y);
    y += 14;
  };

  // 1. Professional Summary
  if (resumeContent.summary) {
    printSectionHeader('Professional Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    const splitSummary = doc.splitTextToSize(resumeContent.summary || '', pageWidth - 80);
    doc.text(splitSummary, 40, y);
    y += splitSummary.length * 12 + 12;
  }

  // 2. Skills
  if (resumeContent.skills && resumeContent.skills.length > 0) {
    printSectionHeader('Skills & Competencies');
    const skillsList = resumeContent.skills.join('  •  ');
    const splitSkills = doc.splitTextToSize(skillsList, pageWidth - 80);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(47, 140, 130);
    doc.text(splitSkills, 40, y);
    y += splitSkills.length * 12 + 12;
  }

  // 3. Work Experience
  if (resumeContent.experiences && resumeContent.experiences.length > 0) {
    printSectionHeader('Work Experience');
    for (const exp of resumeContent.experiences) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(exp.title || 'Role', 40, y);

      if (exp.duration) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        const durWidth = doc.getTextWidth(exp.duration);
        doc.text(exp.duration, pageWidth - 40 - durWidth, y);
      }
      y += 12;

      if (exp.company) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(exp.company, 40, y);
        y += 11;
      }

      if (exp.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const splitDesc = doc.splitTextToSize(exp.description, pageWidth - 80);
        doc.text(splitDesc, 40, y);
        y += splitDesc.length * 11 + 8;
      }
    }
  }

  // 4. Education
  if (resumeContent.educations && resumeContent.educations.length > 0) {
    printSectionHeader('Education');
    for (const edu of resumeContent.educations) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(edu.degree || 'Degree', 40, y);

      if (edu.duration) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        const durWidth = doc.getTextWidth(edu.duration);
        doc.text(edu.duration, pageWidth - 40 - durWidth, y);
      }
      y += 12;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`${edu.institution}${edu.score ? `  (Score: ${edu.score})` : ''}`, 40, y);
      y += 14;
    }
  }

  // 5. Technical Projects
  if (resumeContent.projects && resumeContent.projects.length > 0) {
    printSectionHeader('Technical Projects');
    for (const proj of resumeContent.projects) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(proj.title || 'Project', 40, y);
      y += 12;

      if (proj.techStack) {
        const stackStr = Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Tech Stack: ${stackStr}`, 40, y);
        y += 11;
      }

      if (proj.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const splitDesc = doc.splitTextToSize(proj.description, pageWidth - 80);
        doc.text(splitDesc, 40, y);
        y += splitDesc.length * 11 + 8;
      }
    }
  }

  // Output as Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

/**
 * Keyword skill extraction helper for uploaded resumes
 */
export async function parseResumeForSkills(text: string): Promise<string[]> {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C', 'Go', 'Rust',
    'React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Express', 'NestJS',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Prisma', 'TypeORM',
    'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Linux', 'Git', 'CI/CD',
    'GraphQL', 'REST API', 'TailwindCSS', 'Figma', 'System Design', 'Algorithms',
    'Machine Learning', 'Data Science', 'PyTorch', 'TensorFlow', 'NLP'
  ];

  const matched = commonSkills.filter(skill =>
    new RegExp(`\\b${skill.replace('.', '\\.')}\\b`, 'i').test(text)
  );

  return matched;
}
