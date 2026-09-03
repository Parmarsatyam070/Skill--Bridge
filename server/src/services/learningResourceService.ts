import { prisma } from '../config/prisma.js';
import { LearningResource, LearningResourceType } from '../../../shared/types.js';

export interface SeedResourceItem {
  skillId?: string;
  topicTag: string;
  domain?: string;
  type: LearningResourceType;
  title: string;
  url: string;
  provider: string;
  description: string;
  isFree: boolean;
  rating?: number;
  thumbnailUrl?: string;
  displayOrder?: number;
}

export const CURATED_LEARNING_RESOURCES: SeedResourceItem[] = [
  // ─── DSA & CORE PROBLEM SOLVING ──────────────────────────────
  {
    skillId: 'skill-dsa',
    topicTag: 'DSA',
    domain: 'Full-Stack Web',
    type: 'youtube_channel',
    title: 'NeetCode DSA Roadmap & Problem Walkthroughs',
    url: 'https://www.youtube.com/@NeetCode',
    provider: 'NeetCode',
    description: 'Visual, intuitive explanations of Blind 75 and NeetCode 150 algorithms in Python & JavaScript.',
    isFree: true,
    rating: 4.9,
    displayOrder: 1,
  },
  {
    skillId: 'skill-dsa',
    topicTag: 'DSA',
    domain: 'Full-Stack Web',
    type: 'youtube_playlist',
    title: 'takeUforward A-to-Z DSA Playlist',
    url: 'https://www.youtube.com/@takeUforward',
    provider: 'takeUforward (Striver)',
    description: 'Complete data structures and algorithms masterclass from basics to advanced DP and graphs.',
    isFree: true,
    rating: 4.9,
    displayOrder: 2,
  },
  {
    skillId: 'skill-dsa',
    topicTag: 'DSA',
    domain: 'Full-Stack Web',
    type: 'website',
    title: 'GeeksforGeeks Complete DSA Guide',
    url: 'https://www.geeksforgeeks.org/dsa-tutorial-learn-data-structures-and-algorithms/',
    provider: 'GeeksforGeeks',
    description: 'Comprehensive tutorials, interactive practice problems, and complexity analysis for all data structures.',
    isFree: true,
    rating: 4.8,
    displayOrder: 3,
  },
  {
    skillId: 'skill-dsa',
    topicTag: 'Dynamic Programming',
    domain: 'Full-Stack Web',
    type: 'youtube_playlist',
    title: 'Dynamic Programming Master Series - NeetCode',
    url: 'https://www.youtube.com/playlist?list=PLot-Xpze53lcvx_71GtxZkbhAkd46CX3N',
    provider: 'NeetCode',
    description: 'Step-by-step breakdown of 1D and 2D DP patterns: memoization, tabulation, and state transitions.',
    isFree: true,
    rating: 4.9,
    displayOrder: 4,
  },
  {
    skillId: 'skill-dsa',
    topicTag: 'DSA',
    domain: 'Full-Stack Web',
    type: 'course',
    title: 'freeCodeCamp JavaScript Algorithms and Data Structures',
    url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/',
    provider: 'freeCodeCamp',
    description: 'Interactive certification curriculum covering OOP, functional programming, and algorithmic scripting.',
    isFree: true,
    rating: 4.9,
    displayOrder: 5,
  },

  // ─── FULL-STACK WEB (React, TypeScript, Node.js) ─────────────
  {
    skillId: 'skill-react',
    topicTag: 'React',
    domain: 'Full-Stack Web',
    type: 'website',
    title: 'Official React 18 & 19 Documentation & Deep Dives',
    url: 'https://react.dev/',
    provider: 'React Official Team',
    description: 'Hands-on interactive tutorial, Hooks reference, Server Components, and mental model architecture.',
    isFree: true,
    rating: 4.9,
    displayOrder: 1,
  },
  {
    skillId: 'skill-react',
    topicTag: 'React',
    domain: 'Full-Stack Web',
    type: 'youtube_playlist',
    title: 'Traversy Media Full React & Next.js Crash Course',
    url: 'https://www.youtube.com/@TraversyMedia',
    provider: 'Traversy Media',
    description: 'Project-based React, state management with Zustand/Redux, and full-stack API integration.',
    isFree: true,
    rating: 4.8,
    displayOrder: 2,
  },
  {
    skillId: 'skill-ts',
    topicTag: 'TypeScript',
    domain: 'Full-Stack Web',
    type: 'website',
    title: 'Total TypeScript Interactive Tutorials & Handbook',
    url: 'https://www.totaltypescript.com/tutorials',
    provider: 'Matt Pocock (Total TypeScript)',
    description: 'Master generics, template literal types, type narrowing, and production TypeScript patterns.',
    isFree: true,
    rating: 4.9,
    displayOrder: 3,
  },
  {
    skillId: 'skill-node',
    topicTag: 'Node.js',
    domain: 'Full-Stack Web',
    type: 'website',
    title: 'MDN Web Docs Express & Node.js Guide',
    url: 'https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs',
    provider: 'MDN Web Docs',
    description: 'Industry-standard backend web development guide with REST APIs, middleware, and SQLite/Postgres.',
    isFree: true,
    rating: 4.9,
    displayOrder: 4,
  },
  {
    skillId: 'skill-web',
    topicTag: 'Web Development',
    domain: 'Full-Stack Web',
    type: 'youtube_channel',
    title: 'Fireship 100-Second Code Explanations',
    url: 'https://www.youtube.com/@Fireship',
    provider: 'Fireship',
    description: 'Rapid, high-density overviews of modern frontend frameworks, backend engines, and database architectures.',
    isFree: true,
    rating: 4.9,
    displayOrder: 5,
  },

  // ─── AI / DATA SCIENCE & MACHINE LEARNING ─────────────────────
  {
    skillId: 'skill-ml',
    topicTag: 'Machine Learning',
    domain: 'AI/Data Science',
    type: 'course',
    title: 'Andrew Ng Machine Learning Specialization',
    url: 'https://www.deeplearning.ai/courses/machine-learning-specialization/',
    provider: 'DeepLearning.AI / Stanford',
    description: 'Foundational ML course covering supervised learning, neural networks, tree ensembles, and unsupervised ML.',
    isFree: true,
    rating: 4.9,
    displayOrder: 1,
  },
  {
    skillId: 'skill-ml',
    topicTag: 'Data Science',
    domain: 'AI/Data Science',
    type: 'youtube_channel',
    title: 'StatQuest with Josh Starmer',
    url: 'https://www.youtube.com/@statquest',
    provider: 'StatQuest',
    description: 'Clear, step-by-step visual breakdowns of statistics, regression, PCA, Transformers, and gradient descent.',
    isFree: true,
    rating: 4.9,
    displayOrder: 2,
  },
  {
    skillId: 'skill-python',
    topicTag: 'Python',
    domain: 'AI/Data Science',
    type: 'course',
    title: 'Practical Deep Learning for Coders (Fast.ai)',
    url: 'https://course.fast.ai/',
    provider: 'Fast.ai',
    description: 'Top-down, hands-on deep learning curriculum using PyTorch and Hugging Face Transformers.',
    isFree: true,
    rating: 4.9,
    displayOrder: 3,
  },
  {
    skillId: 'skill-ml',
    topicTag: 'Deep Learning',
    domain: 'AI/Data Science',
    type: 'youtube_playlist',
    title: '3Blue1Brown Neural Networks Chapter Series',
    url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi',
    provider: '3Blue1Brown',
    description: 'Geometric and mathematical intuition behind backpropagation, weight matrices, and loss functions.',
    isFree: true,
    rating: 5.0,
    displayOrder: 4,
  },

  // ─── CLOUD & DEVOPS ──────────────────────────────────────────
  {
    skillId: 'skill-cloud',
    topicTag: 'DevOps',
    domain: 'Cloud/DevOps',
    type: 'youtube_channel',
    title: 'TechWorld with Nana DevOps Bootcamp',
    url: 'https://www.youtube.com/@TechWorldwithNana',
    provider: 'TechWorld with Nana',
    description: 'Practical Docker, Kubernetes, CI/CD pipelines, Terraform, and Prometheus monitoring for engineers.',
    isFree: true,
    rating: 4.9,
    displayOrder: 1,
  },
  {
    skillId: 'skill-cloud',
    topicTag: 'Cloud Architecture',
    domain: 'Cloud/DevOps',
    type: 'website',
    title: 'AWS Free Tier & Well-Architected Framework',
    url: 'https://aws.amazon.com/free/',
    provider: 'Amazon Web Services',
    description: 'Official whitepapers, free hands-on labs, and architecture pillars for high availability and security.',
    isFree: true,
    rating: 4.8,
    displayOrder: 2,
  },
  {
    skillId: 'skill-devops',
    topicTag: 'Kubernetes',
    domain: 'Cloud/DevOps',
    type: 'website',
    title: 'KodeKloud DevOps Foundations',
    url: 'https://kodekloud.com/',
    provider: 'KodeKloud',
    description: 'Interactive browser-based labs for Linux commands, Docker containers, and Kubernetes pods.',
    isFree: false,
    rating: 4.8,
    displayOrder: 3,
  },

  // ─── UI/UX PRODUCT DESIGN ────────────────────────────────────
  {
    skillId: 'skill-uiux',
    topicTag: 'UI/UX',
    domain: 'UI/UX Product Design',
    type: 'website',
    title: 'Nielsen Norman Group Research Articles',
    url: 'https://www.nngroup.com/articles/',
    provider: 'Nielsen Norman Group (NN/g)',
    description: 'Evidence-based UX research, usability heuristics, design patterns, and accessibility guidelines.',
    isFree: true,
    rating: 4.9,
    displayOrder: 1,
  },
  {
    skillId: 'skill-figma',
    topicTag: 'Figma',
    domain: 'UI/UX Product Design',
    type: 'youtube_channel',
    title: 'Figma Official Design Systems & Tutorials',
    url: 'https://www.youtube.com/@Figma',
    provider: 'Figma Team',
    description: 'Auto-layout masterclass, design tokens, component variables, and interactive prototyping techniques.',
    isFree: true,
    rating: 4.9,
    displayOrder: 2,
  },
  {
    skillId: 'skill-uiux',
    topicTag: 'UI Design',
    domain: 'UI/UX Product Design',
    type: 'youtube_channel',
    title: 'DesignCourse UI/UX & Frontend Design',
    url: 'https://www.youtube.com/@DesignCourse',
    provider: 'DesignCourse',
    description: 'Practical UI critiques, color harmony, typography hierarchy, and micro-interaction animations.',
    isFree: true,
    rating: 4.8,
    displayOrder: 3,
  },

  // ─── QUANTITATIVE & APTITUDE ──────────────────────────────────
  {
    skillId: 'skill-aptitude',
    topicTag: 'Aptitude',
    domain: 'Aptitude',
    type: 'website',
    title: 'IndiaBIX Quantitative & Logical Aptitude',
    url: 'https://www.indiabix.com/',
    provider: 'IndiaBIX',
    description: 'Extensive question bank with formulas and step-by-step solutions for campus placement exams.',
    isFree: true,
    rating: 4.7,
    displayOrder: 1,
  },
  {
    skillId: 'skill-aptitude',
    topicTag: 'Aptitude',
    domain: 'Aptitude',
    type: 'youtube_channel',
    title: 'Feel Free to Learn Quantitative Aptitude',
    url: 'https://www.youtube.com/@FeelFreetoLearn',
    provider: 'Feel Free to Learn',
    description: 'Shortcut tricks, percentage calculations, time & work problems, and speed math for competitive tests.',
    isFree: true,
    rating: 4.8,
    displayOrder: 2,
  },
];

/**
 * Ensures learning resources are seeded in SQLite database
 */
export async function seedDefaultLearningResources(): Promise<number> {
  const count = await prisma.learningResource.count();
  if (count >= CURATED_LEARNING_RESOURCES.length) return count;

  for (const item of CURATED_LEARNING_RESOURCES) {
    const existing = await prisma.learningResource.findFirst({
      where: { title: item.title, provider: item.provider },
    });

    if (!existing) {
      await prisma.learningResource.create({
        data: item,
      });
    }
  }

  return await prisma.learningResource.count();
}

/**
 * Fetches learning resources with flexible search, domain, topic, and type filters
 */
export async function getLearningResources(filters: {
  domain?: string;
  skillId?: string;
  topicTag?: string;
  type?: string;
  isFree?: boolean;
  search?: string;
}): Promise<LearningResource[]> {
  // Ensure seeded first
  await seedDefaultLearningResources();

  const where: any = {};

  if (filters.domain && filters.domain !== 'All') {
    where.domain = filters.domain;
  }
  if (filters.skillId) {
    where.skillId = filters.skillId;
  }
  if (filters.topicTag && filters.topicTag !== 'All') {
    where.topicTag = { contains: filters.topicTag };
  }
  if (filters.type && filters.type !== 'All') {
    where.type = filters.type;
  }
  if (typeof filters.isFree === 'boolean') {
    where.isFree = filters.isFree;
  }
  if (filters.search && filters.search.trim().length > 0) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { provider: { contains: q } },
      { topicTag: { contains: q } },
    ];
  }

  const resources = await prisma.learningResource.findMany({
    where,
    orderBy: [{ displayOrder: 'asc' }, { rating: 'desc' }],
  });

  return resources.map(r => ({
    id: r.id,
    skillId: r.skillId || undefined,
    topicTag: r.topicTag,
    domain: r.domain || undefined,
    type: r.type as LearningResourceType,
    title: r.title,
    url: r.url,
    provider: r.provider,
    description: r.description,
    isFree: r.isFree,
    rating: r.rating || 4.8,
    thumbnailUrl: r.thumbnailUrl || undefined,
    displayOrder: r.displayOrder,
    createdAt: r.createdAt.toISOString(),
  }));
}

/**
 * Retrieves 2-3 curated learning resources (e.g. 1 YouTube + 1 Website/Course) for an identified skill gap
 */
export async function getRecommendedResourcesForSkill(
  skillIdOrName: string,
  limit: number = 3
): Promise<LearningResource[]> {
  await seedDefaultLearningResources();

  const normalized = skillIdOrName.toLowerCase();

  // Search by exact skillId, topic tag, or matching words
  let resources = await prisma.learningResource.findMany({
    where: {
      OR: [
        { skillId: skillIdOrName },
        { topicTag: { contains: skillIdOrName } },
        { title: { contains: skillIdOrName } },
      ],
    },
    take: limit * 2,
  });

  // Fallback matching
  if (resources.length === 0) {
    if (normalized.includes('react') || normalized.includes('web') || normalized.includes('js') || normalized.includes('ts')) {
      resources = await prisma.learningResource.findMany({ where: { domain: 'Full-Stack Web' }, take: limit });
    } else if (normalized.includes('data') || normalized.includes('ai') || normalized.includes('ml') || normalized.includes('python')) {
      resources = await prisma.learningResource.findMany({ where: { domain: 'AI/Data Science' }, take: limit });
    } else if (normalized.includes('cloud') || normalized.includes('devops') || normalized.includes('docker') || normalized.includes('aws')) {
      resources = await prisma.learningResource.findMany({ where: { domain: 'Cloud/DevOps' }, take: limit });
    } else if (normalized.includes('design') || normalized.includes('ui') || normalized.includes('ux') || normalized.includes('figma')) {
      resources = await prisma.learningResource.findMany({ where: { domain: 'UI/UX Product Design' }, take: limit });
    } else {
      resources = await prisma.learningResource.findMany({ where: { topicTag: 'DSA' }, take: limit });
    }
  }

  // Ensure balance: prioritize distinct types (e.g. YouTube + Website)
  const distinctTypes = new Set<string>();
  const balanced: typeof resources = [];

  for (const r of resources) {
    if (!distinctTypes.has(r.type) && balanced.length < limit) {
      distinctTypes.add(r.type);
      balanced.push(r);
    }
  }

  // Fill remaining if needed
  for (const r of resources) {
    if (balanced.length < limit && !balanced.some(b => b.id === r.id)) {
      balanced.push(r);
    }
  }

  return balanced.map(r => ({
    id: r.id,
    skillId: r.skillId || undefined,
    topicTag: r.topicTag,
    domain: r.domain || undefined,
    type: r.type as LearningResourceType,
    title: r.title,
    url: r.url,
    provider: r.provider,
    description: r.description,
    isFree: r.isFree,
    rating: r.rating || 4.8,
    thumbnailUrl: r.thumbnailUrl || undefined,
    displayOrder: r.displayOrder,
    createdAt: r.createdAt.toISOString(),
  }));
}
