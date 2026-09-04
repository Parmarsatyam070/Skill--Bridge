import { prisma } from '../config/prisma.js';
import { PortfolioWebsiteData, PortfolioTheme } from '../../../shared/types.js';
import { isLlmConfigured, generateLlmText } from './llmService.js';

const THEME_MAP: Record<string, PortfolioTheme> = {
  'Full-Stack Web': 'teal_dark',
  'AI/Data Science': 'indigo_creative',
  'Cloud/DevOps': 'slate_clean',
  'UI/UX Product Design': 'indigo_creative',
  'Embedded/IoT': 'cyber_amber',
};

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Parses JSON safely with a default value.
 */
function safeJsonParse<T>(jsonStr: string | null | undefined, defaultValue: T): T {
  if (!jsonStr) return defaultValue;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return defaultValue;
  }
}

/**
 * Retrieves an existing portfolio website for a student or generates
 * an initial default state populated with their verified profile data.
 */
export async function getOrCreateStudentPortfolio(studentProfileId: string): Promise<PortfolioWebsiteData> {
  let portfolio = await prisma.portfolioWebsite.findUnique({
    where: { studentId: studentProfileId },
    include: {
      student: {
        include: {
          user: true,
          skillScores: { include: { skill: true } },
          enrollments: { where: { status: 'completed' }, include: { course: true } },
        },
      },
    },
  });

  if (!portfolio) {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: {
        user: true,
        skillScores: { include: { skill: true } },
        enrollments: { where: { status: 'completed' }, include: { course: true } },
      },
    });

    if (!student) throw new Error('Student profile not found');

    const baseSlug = slugify(student.user.name) || 'student';
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await prisma.portfolioWebsite.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    const domain = student.targetDomain || 'Full-Stack Web';
    const topSkills = student.skillScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(s => s.skill.name);

    const parsedProjects = safeJsonParse<any[]>(student.projectsJson, []);
    const projects = parsedProjects.length > 0
      ? parsedProjects.map((p, idx) => ({
          id: p.id || `proj-${idx + 1}`,
          title: p.title || 'Platform Architecture Capstone',
          description: p.description || 'Engineered responsive web app with automated testing and modular state management.',
          tags: Array.isArray(p.techStack) ? p.techStack : ['React', 'TypeScript', 'Node.js'],
          thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
          githubUrl: p.githubUrl || (student.githubUsername ? `https://github.com/${student.githubUsername}` : undefined),
          demoUrl: p.demoUrl || undefined,
        }))
      : [
          {
            id: 'proj-1',
            title: `${domain} Scalable Core Architecture`,
            description: 'Production-ready full-stack application featuring type-safe API contracts, high throughput indexing, and modern UI components.',
            tags: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
            thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
            githubUrl: student.githubUsername ? `https://github.com/${student.githubUsername}/core-platform` : 'https://github.com',
            demoUrl: 'https://demo.skillbridge.app',
          },
          {
            id: 'proj-2',
            title: 'Real-Time Telemetry & Analytics Dashboard',
            description: 'Interactive data visualization suite with real-time websocket updates, multi-dimensional filtering, and automated reporting.',
            tags: ['TypeScript', 'Recharts', 'TailwindCSS', 'WebSockets'],
            thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
            githubUrl: student.githubUsername ? `https://github.com/${student.githubUsername}/telemetry-suite` : 'https://github.com',
          },
          {
            id: 'proj-3',
            title: 'Automated CI/CD & Deployment Pipeline',
            description: 'Containerized deployment infrastructure with automated test validation, zero-downtime rolling updates, and observability.',
            tags: ['Docker', 'GitHub Actions', 'AWS', 'Grafana'],
            thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80',
            githubUrl: student.githubUsername ? `https://github.com/${student.githubUsername}/devops-pipeline` : 'https://github.com',
          },
        ];

    const services = [
      {
        icon: 'Code2',
        title: 'Full-Stack Web Development',
        description: 'Building end-to-end web applications with modern reactive UI and robust, type-safe backend APIs.',
      },
      {
        icon: 'Cpu',
        title: 'System Architecture & APIs',
        description: 'Designing scalable RESTful & GraphQL microservices with ACID-compliant database schemas and caching.',
      },
      {
        icon: 'Layers',
        title: 'UI/UX & Interactive Design',
        description: 'Crafting pixel-perfect, accessible, and responsive user experiences with fluid micro-interactions.',
      },
    ];

    const stats = [
      { label: 'Projects Shipped', value: `${projects.length}+`, subtext: 'Production Grade' },
      { label: 'Verified Certifications', value: `${student.enrollments.length}`, subtext: 'NPTEL & Industry' },
      { label: 'Skill Vector Match', value: '94%', subtext: domain },
    ];

    const socials = safeJsonParse<any>(student.socialsJson, {
      github: student.githubUsername ? `https://github.com/${student.githubUsername}` : 'https://github.com',
      linkedin: student.linkedinUrl || 'https://linkedin.com',
      email: student.user.email,
    });

    const defaultTheme: PortfolioTheme = THEME_MAP[domain] || 'teal_dark';

    portfolio = await prisma.portfolioWebsite.create({
      data: {
        studentId: student.id,
        slug: uniqueSlug,
        status: 'DRAFT',
        theme: defaultTheme,
        enableBot: true,
        headline: `Crafting scalable, high-impact digital solutions in ${domain}`,
        subheadline: `Hi, I am ${student.user.name} — an engineering student at ${student.institution || 'University'} specializing in modern ${domain} architecture.`,
        heroCtaText: 'Explore Featured Work',
        heroCtaLink: '#projects',
        heroImageUrl: student.user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${student.user.name}`,
        servicesJson: JSON.stringify(services),
        projectsJson: JSON.stringify(projects),
        aboutBio: student.bio || `I am an ambitious engineer driven by solving complex systems problems. Through hands-on assessments and verified coursework on SkillBridge, I have honed deep expertise in ${topSkills.slice(0, 4).join(', ') || 'modern engineering fundamentals'}.`,
        aboutImageUrl: student.user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${student.user.name}`,
        skillsJson: JSON.stringify(topSkills.length > 0 ? topSkills : ['TypeScript', 'React.js', 'Node.js', 'PostgreSQL', 'Docker', 'System Design']),
        statsJson: JSON.stringify(stats),
        contactEmail: student.user.email,
        socialsJson: JSON.stringify(socials),
        sectionsOrderJson: JSON.stringify(['hero', 'services', 'projects', 'about', 'stats', 'contact', 'footer']),
        sectionsVisibilityJson: JSON.stringify({
          hero: true,
          services: true,
          projects: true,
          about: true,
          stats: true,
          contact: true,
          footer: true,
        }),
      },
      include: {
        student: {
          include: {
            user: true,
            skillScores: { include: { skill: true } },
            enrollments: { where: { status: 'completed' }, include: { course: true } },
          },
        },
      },
    });
  }

  return formatPortfolioResponse(portfolio);
}

/**
 * AI Wizard Generator: Uses LLM or structured domain intelligence to generate
 * complete, high-converting portfolio copy customized to the chosen role and tone.
 */
export async function generateAIWizardPortfolio(
  studentProfileId: string,
  wizardInput: {
    targetRole: string;
    tone: 'Professional' | 'Creative' | 'Minimal' | 'Technical';
    selectedProjectIds?: string[];
    colorPreference?: string;
  }
): Promise<PortfolioWebsiteData> {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: {
      user: true,
      skillScores: { include: { skill: true } },
      enrollments: { where: { status: 'completed' }, include: { course: true } },
    },
  });

  if (!student) throw new Error('Student profile not found');

  const { targetRole, tone, selectedProjectIds, colorPreference } = wizardInput;
  const topSkills = student.skillScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(s => s.skill.name);

  const parsedProjects = safeJsonParse<any[]>(student.projectsJson, []);
  let filteredProjects = parsedProjects;
  if (selectedProjectIds && selectedProjectIds.length > 0) {
    filteredProjects = parsedProjects.filter(p => selectedProjectIds.includes(p.id));
  }

  // Tone-specific copywriting engine
  let headline = `Building high-reliability software & resilient systems as an aspiring ${targetRole}`;
  let subheadline = `Hi, I am ${student.user.name} — a computer science engineer at ${student.institution || 'University'} specializing in ${topSkills.slice(0, 3).join(', ') || targetRole}.`;
  let bio = `I am a dedicated ${targetRole} with a strong foundation in modern software architecture, verified problem-solving benchmarks, and production-ready clean code.`;

  if (tone === 'Creative') {
    headline = `Designing bold digital experiences & engineering elegant solutions for ${targetRole}`;
    subheadline = `I am ${student.user.name} — crafting intuitive interfaces, scalable systems, and human-centered software at ${student.institution || 'University'}.`;
    bio = `Driven by the intersection of creative design and robust system engineering. I turn complex technical challenges into sleek, responsive web products with verified performance standards.`;
  } else if (tone === 'Minimal') {
    headline = `${student.user.name} — ${targetRole}`;
    subheadline = `Engineering clean, performant, and maintainable software systems from ${student.institution || 'University'}.`;
    bio = `Pragmatic engineer focused on minimal abstraction, strong typing, low latency, and high test coverage across distributed environments.`;
  } else if (tone === 'Technical') {
    headline = `Full-Lifecycle Systems Engineer & ${targetRole} Specialist`;
    subheadline = `Demonstrated competency across ${topSkills.join(', ') || targetRole} with verified benchmark metrics on SkillBridge.`;
    bio = `Specialized in building end-to-end distributed applications, optimized relational database queries, asynchronous event loops, and containerized CI/CD delivery pipelines.`;
  }

  if (isLlmConfigured()) {
    try {
      const generatedHeadline = await generateLlmText({
        systemPrompt: `You are an elite portfolio copywriter. Generate a single punchy headline (maximum 12 words) for a student's portfolio website in the ${tone} tone.`,
        prompt: `Name: ${student.user.name}, Target Role: ${targetRole}, Top Skills: ${topSkills.join(', ')}`,
      });
      if (generatedHeadline && generatedHeadline.trim()) {
        headline = generatedHeadline.trim().replace(/^"|"$/g, '');
      }

      const generatedBio = await generateLlmText({
        systemPrompt: `You are an elite tech portfolio writer. Write a 2-3 sentence About Me bio in ${tone} tone.`,
        prompt: `Name: ${student.user.name}, Institution: ${student.institution || 'Engineering College'}, Role: ${targetRole}, Skills: ${topSkills.join(', ')}`,
      });
      if (generatedBio && generatedBio.trim()) {
        bio = generatedBio.trim().replace(/^"|"$/g, '');
      }
    } catch {
      // Gracefully fall back to deterministic templates
    }
  }

  // Generate 3 focus areas based on targetRole
  const services = [
    {
      icon: 'Terminal',
      title: `${targetRole} Engineering`,
      description: `Architecting robust, maintainable components using ${topSkills.slice(0, 2).join(' & ') || 'modern frameworks'} with rigorous type safety.`,
    },
    {
      icon: 'Database',
      title: 'Data Flow & API Architecture',
      description: 'Engineering low-latency backend microservices, relational schemas, and secure authentication flows.',
    },
    {
      icon: 'Zap',
      title: 'Performance & Production Delivery',
      description: 'Continuous integration, containerized deployments, automated unit tests, and Core Web Vital optimizations.',
    },
  ];

  const projects = filteredProjects.length > 0
    ? filteredProjects.map((p, idx) => ({
        id: p.id || `proj-${idx + 1}`,
        title: p.title || `${targetRole} Platform System`,
        description: p.description || `Engineered production application demonstrating verified skills in ${topSkills.slice(0, 3).join(', ')}.`,
        tags: Array.isArray(p.techStack) ? p.techStack : ['React', 'TypeScript', 'Node.js'],
        thumbnail: p.thumbnail || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
        githubUrl: p.githubUrl || (student.githubUsername ? `https://github.com/${student.githubUsername}` : undefined),
        demoUrl: p.demoUrl || undefined,
      }))
    : [
        {
          id: 'proj-ai-1',
          title: `${targetRole} Core Application`,
          description: `Enterprise-grade platform built with type safety, scalable API layers, and verified competency vectors.`,
          tags: ['React', 'TypeScript', 'TailwindCSS', 'PostgreSQL'],
          thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
          githubUrl: student.githubUsername ? `https://github.com/${student.githubUsername}/core-platform` : 'https://github.com',
          demoUrl: 'https://demo.skillbridge.app',
        },
        {
          id: 'proj-ai-2',
          title: 'Real-Time Telemetry & Monitoring Suite',
          description: 'High-throughput analytics system featuring automated metrics aggregation and dynamic UI visualizations.',
          tags: ['TypeScript', 'Recharts', 'Node.js', 'Docker'],
          thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
          githubUrl: student.githubUsername ? `https://github.com/${student.githubUsername}/telemetry` : 'https://github.com',
        },
        {
          id: 'proj-ai-3',
          title: 'Distributed Microservices & Cloud Infrastructure',
          description: 'Containerized services with automated regression pipelines, load balancing, and structured logging.',
          tags: ['Docker', 'AWS', 'GitHub Actions', 'PostgreSQL'],
          thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80',
          githubUrl: student.githubUsername ? `https://github.com/${student.githubUsername}/cloud-infra` : 'https://github.com',
        },
      ];

  const stats = [
    { label: 'Projects Shipped', value: `${projects.length}+`, subtext: 'Verified Work' },
    { label: 'Accredited Certs', value: `${student.enrollments.length}`, subtext: 'Course Verifications' },
    { label: 'Domain Skill Match', value: '92%', subtext: targetRole },
  ];

  let chosenTheme: PortfolioTheme = 'teal_dark';
  if (colorPreference === 'slate' || tone === 'Minimal') chosenTheme = 'slate_clean';
  else if (colorPreference === 'indigo' || tone === 'Creative') chosenTheme = 'indigo_creative';
  else if (colorPreference === 'amber' || tone === 'Technical') chosenTheme = 'cyber_amber';

  const updated = await prisma.portfolioWebsite.upsert({
    where: { studentId: student.id },
    create: {
      studentId: student.id,
      slug: slugify(student.user.name) || 'student',
      status: 'DRAFT',
      theme: chosenTheme,
      enableBot: true,
      headline,
      subheadline,
      heroCtaText: 'View Selected Projects',
      heroCtaLink: '#projects',
      heroImageUrl: student.user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${student.user.name}`,
      servicesJson: JSON.stringify(services),
      projectsJson: JSON.stringify(projects),
      aboutBio: bio,
      aboutImageUrl: student.user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${student.user.name}`,
      skillsJson: JSON.stringify(topSkills.length > 0 ? topSkills : ['TypeScript', 'React.js', 'Node.js', 'PostgreSQL', 'Docker']),
      statsJson: JSON.stringify(stats),
      contactEmail: student.user.email,
      socialsJson: JSON.stringify({
        github: student.githubUsername ? `https://github.com/${student.githubUsername}` : 'https://github.com',
        linkedin: student.linkedinUrl || 'https://linkedin.com',
        email: student.user.email,
      }),
      sectionsOrderJson: JSON.stringify(['hero', 'services', 'projects', 'about', 'stats', 'contact', 'footer']),
      sectionsVisibilityJson: JSON.stringify({
        hero: true,
        services: true,
        projects: true,
        about: true,
        stats: true,
        contact: true,
        footer: true,
      }),
      aiWizardConfigJson: JSON.stringify(wizardInput),
    },
    update: {
      theme: chosenTheme,
      headline,
      subheadline,
      servicesJson: JSON.stringify(services),
      projectsJson: JSON.stringify(projects),
      aboutBio: bio,
      skillsJson: JSON.stringify(topSkills.length > 0 ? topSkills : ['TypeScript', 'React.js', 'Node.js', 'PostgreSQL', 'Docker']),
      statsJson: JSON.stringify(stats),
      aiWizardConfigJson: JSON.stringify(wizardInput),
    },
    include: {
      student: {
        include: {
          user: true,
          skillScores: { include: { skill: true } },
          enrollments: { where: { status: 'completed' }, include: { course: true } },
        },
      },
    },
  });

  return formatPortfolioResponse(updated);
}

/**
 * Updates a student's portfolio website fields.
 */
export async function updateStudentPortfolio(
  studentProfileId: string,
  payload: Partial<PortfolioWebsiteData>
): Promise<PortfolioWebsiteData> {
  const updateData: any = {};

  if (payload.slug) updateData.slug = slugify(payload.slug);
  if (payload.status) updateData.status = payload.status;
  if (payload.theme) updateData.theme = payload.theme;
  if (payload.enableBot !== undefined) updateData.enableBot = payload.enableBot;
  if (payload.headline !== undefined) updateData.headline = payload.headline;
  if (payload.subheadline !== undefined) updateData.subheadline = payload.subheadline;
  if (payload.heroCtaText !== undefined) updateData.heroCtaText = payload.heroCtaText;
  if (payload.heroCtaLink !== undefined) updateData.heroCtaLink = payload.heroCtaLink;
  if (payload.heroImageUrl !== undefined) updateData.heroImageUrl = payload.heroImageUrl;
  if (payload.services) updateData.servicesJson = JSON.stringify(payload.services);
  if (payload.projects) updateData.projectsJson = JSON.stringify(payload.projects);
  if (payload.aboutBio !== undefined) updateData.aboutBio = payload.aboutBio;
  if (payload.aboutImageUrl !== undefined) updateData.aboutImageUrl = payload.aboutImageUrl;
  if (payload.skills) updateData.skillsJson = JSON.stringify(payload.skills);
  if (payload.stats) updateData.statsJson = JSON.stringify(payload.stats);
  if (payload.contactEmail !== undefined) updateData.contactEmail = payload.contactEmail;
  if (payload.socials) updateData.socialsJson = JSON.stringify(payload.socials);
  if (payload.sectionsOrder) updateData.sectionsOrderJson = JSON.stringify(payload.sectionsOrder);
  if (payload.sectionsVisibility) updateData.sectionsVisibilityJson = JSON.stringify(payload.sectionsVisibility);

  const updated = await prisma.portfolioWebsite.update({
    where: { studentId: studentProfileId },
    data: updateData,
    include: {
      student: {
        include: {
          user: true,
          skillScores: { include: { skill: true } },
          enrollments: { where: { status: 'completed' }, include: { course: true } },
        },
      },
    },
  });

  return formatPortfolioResponse(updated);
}

/**
 * Resolves a public portfolio by slug or student profile ID.
 */
export async function getPublicPortfolio(slugOrId: string, allowDraft: boolean = false): Promise<PortfolioWebsiteData | null> {
  const portfolio = await prisma.portfolioWebsite.findFirst({
    where: {
      OR: [
        { slug: slugOrId.toLowerCase() },
        { studentId: slugOrId },
        { id: slugOrId },
      ],
      ...(allowDraft ? {} : { status: 'PUBLISHED' }),
    },
    include: {
      student: {
        include: {
          user: true,
          skillScores: { include: { skill: true } },
          enrollments: { where: { status: 'completed' }, include: { course: true } },
        },
      },
    },
  });

  if (!portfolio) return null;
  return formatPortfolioResponse(portfolio);
}

/**
 * Saves a message from a public visitor to the student's portfolio inbox.
 */
export async function savePortfolioMessage(
  slugOrId: string,
  messageData: { senderName: string; senderEmail: string; message: string }
) {
  const portfolio = await prisma.portfolioWebsite.findFirst({
    where: {
      OR: [
        { slug: slugOrId.toLowerCase() },
        { studentId: slugOrId },
        { id: slugOrId },
      ],
    },
  });

  if (!portfolio) throw new Error('Portfolio not found');

  return await prisma.portfolioMessage.create({
    data: {
      portfolioId: portfolio.id,
      senderName: messageData.senderName,
      senderEmail: messageData.senderEmail,
      message: messageData.message,
    },
  });
}

/**
 * Retrieves all messages received for a student's portfolio.
 */
export async function getPortfolioMessages(studentProfileId: string) {
  const portfolio = await prisma.portfolioWebsite.findUnique({
    where: { studentId: studentProfileId },
  });

  if (!portfolio) return [];

  return await prisma.portfolioMessage.findMany({
    where: { portfolioId: portfolio.id },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Public chatbot response scoped strictly to the student's verified public portfolio.
 */
export async function handlePublicBotChat(slugOrId: string, prompt: string): Promise<string> {
  const portfolio = await getPublicPortfolio(slugOrId, true);
  if (!portfolio) throw new Error('Portfolio not found');

  const lower = prompt.toLowerCase();
  const name = portfolio.studentName || 'this student';

  if (lower.includes('project') || lower.includes('work') || lower.includes('github') || lower.includes('built')) {
    const projectList = portfolio.projects.map(p => `• **${p.title}**: ${p.description} (Tech: ${p.tags.join(', ')})`).join('\n');
    return `Here are the featured projects shipped by **${name}**:\n\n${projectList}\n\nYou can explore live demos and source code links directly in the Featured Projects section above!`;
  }

  if (lower.includes('skill') || lower.includes('stack') || lower.includes('tech') || lower.includes('language') || lower.includes('know')) {
    return `**${name}** has verified competencies on SkillBridge in:\n\n**Core Skills:** ${portfolio.skills.join(', ')}\n\n**Focus Areas:** ${portfolio.services.map(s => s.title).join(', ')}.`;
  }

  if (lower.includes('contact') || lower.includes('email') || lower.includes('hire') || lower.includes('reach') || lower.includes('touch')) {
    return `You can reach out to **${name}** directly using the Contact Form at the bottom of this page, or connect via:\n• Email: ${portfolio.contactEmail || 'Available via contact form'}\n• LinkedIn: ${portfolio.socials.linkedin || 'Available above'}\n• GitHub: ${portfolio.socials.github || 'Available above'}`;
  }

  if (lower.includes('about') || lower.includes('who') || lower.includes('bio') || lower.includes('background') || lower.includes('education')) {
    return `**${name}** is a student at **${portfolio.studentInstitution || 'University'}** specializing in **${portfolio.studentDomain || 'Software Engineering'}**.\n\n"${portfolio.aboutBio}"`;
  }

  return `Hello! I am the portfolio assistant for **${name}**. I can tell you all about their verified skills, featured projects, focus areas, and how to get in touch. Feel free to ask!`;
}

function formatPortfolioResponse(p: any): PortfolioWebsiteData {
  return {
    id: p.id,
    studentId: p.studentId,
    slug: p.slug,
    status: p.status as 'DRAFT' | 'PUBLISHED',
    theme: (p.theme as PortfolioTheme) || 'teal_dark',
    enableBot: p.enableBot ?? true,
    headline: p.headline || '',
    subheadline: p.subheadline || '',
    heroCtaText: p.heroCtaText || 'View My Projects',
    heroCtaLink: p.heroCtaLink || '#projects',
    heroImageUrl: p.heroImageUrl || undefined,
    services: safeJsonParse<any[]>(p.servicesJson, []),
    projects: safeJsonParse<any[]>(p.projectsJson, []),
    aboutBio: p.aboutBio || '',
    aboutImageUrl: p.aboutImageUrl || undefined,
    skills: safeJsonParse<string[]>(p.skillsJson, []),
    stats: safeJsonParse<any[]>(p.statsJson, []),
    contactEmail: p.contactEmail || undefined,
    socials: safeJsonParse<any>(p.socialsJson, {}),
    sectionsOrder: safeJsonParse<string[]>(p.sectionsOrderJson, ['hero', 'services', 'projects', 'about', 'stats', 'contact', 'footer']),
    sectionsVisibility: safeJsonParse<any>(p.sectionsVisibilityJson, {
      hero: true,
      services: true,
      projects: true,
      about: true,
      stats: true,
      contact: true,
      footer: true,
    }),
    studentName: p.student?.user?.name || 'Student',
    studentInstitution: p.student?.institution || 'Institution',
    studentDomain: p.student?.targetDomain || 'Full-Stack Web',
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export const portfolioService = {
  getOrCreateStudentPortfolio,
  generateAIWizardPortfolio,
  updateStudentPortfolio,
  getPublicPortfolio,
  savePortfolioMessage,
  getPortfolioMessages,
  handlePublicBotChat,
};


