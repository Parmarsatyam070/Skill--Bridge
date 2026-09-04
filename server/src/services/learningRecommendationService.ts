import { prisma } from '../config/prisma.js';
import { SmartLearningResource, LearningCategory, LearningHubSearchResponse } from '../../../shared/types.js';

export interface RawLearningResource {
  topicTag: string;
  domain?: string;
  category: LearningCategory;
  type: string;
  title: string;
  url: string;
  provider: string;
  description: string;
  isFree: boolean;
  rating: number;
  difficulty?: string;
  authorityScore: number;
  tags: string[];
  thumbnailUrl?: string;
}

export const AUTHENTIC_LEARNING_RESOURCES: RawLearningResource[] = [
  // ─── DYNAMIC PROGRAMMING ──────────────────────────────────────────
  {
    topicTag: 'Dynamic Programming',
    category: 'recommended',
    type: 'youtube_playlist',
    title: 'NeetCode Dynamic Programming Complete Course',
    url: 'https://www.youtube.com/playlist?list=PLot-Xpze53lcvx_71GtxZkbhAkd46CX3N',
    provider: 'NeetCode',
    description: 'Visual, step-by-step masterclass on 1D/2D DP, memoization vs tabulation, knapsack patterns, and state transitions.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 98,
    tags: ['dp', '1d-dp', '2d-dp', 'knapsack', 'algorithms'],
  },
  {
    topicTag: 'Dynamic Programming',
    category: 'videos',
    type: 'youtube_video',
    title: 'MIT 6.006: Dynamic Programming I - Memoization & Subproblems',
    url: 'https://www.youtube.com/watch?v=OQ5jsbhAv_M',
    provider: 'MIT OpenCourseWare (Erik Demaine)',
    description: 'World-renowned lecture by Prof. Erik Demaine breaking down the 5-step systematic DP framework.',
    isFree: true,
    rating: 5.0,
    difficulty: 'Advanced',
    authorityScore: 100,
    tags: ['mit', 'algorithms', 'memoization'],
  },
  {
    topicTag: 'Dynamic Programming',
    category: 'courses',
    type: 'course',
    title: 'Grokking Dynamic Programming Patterns for Coding Interviews',
    url: 'https://www.designgurus.io/course/grokking-dynamic-programming',
    provider: 'Design Gurus',
    description: 'Systematic classification of the 6 fundamental DP patterns with visual mental models.',
    isFree: false,
    rating: 4.8,
    difficulty: 'Intermediate',
    authorityScore: 92,
    tags: ['coding-interviews', 'patterns', 'knapsack'],
  },
  {
    topicTag: 'Dynamic Programming',
    category: 'documentation',
    type: 'doc',
    title: 'GeeksforGeeks Dynamic Programming Comprehensive Guide',
    url: 'https://www.geeksforgeeks.org/dynamic-programming/',
    provider: 'GeeksforGeeks',
    description: 'Extensive theoretical foundations, time/space complexity derivations, and categorized practice questions.',
    isFree: true,
    rating: 4.7,
    difficulty: 'All Levels',
    authorityScore: 90,
    tags: ['guide', 'reference', 'complexity'],
  },
  {
    topicTag: 'Dynamic Programming',
    category: 'articles',
    type: 'article',
    title: 'Demystifying Dynamic Programming - FreeCodeCamp',
    url: 'https://www.freecodecamp.org/news/demystifying-dynamic-programming-3ef712023dad/',
    provider: 'freeCodeCamp',
    description: 'An intuitive, beginner-friendly walkthrough turning recursive exponential code into O(N) linear time.',
    isFree: true,
    rating: 4.8,
    difficulty: 'Beginner',
    authorityScore: 88,
    tags: ['recursion', 'optimization', 'tutorial'],
  },
  {
    topicTag: 'Dynamic Programming',
    category: 'practice',
    type: 'practice_hub',
    title: 'CSES Dynamic Programming Problem Set',
    url: 'https://cses.fi/problemset/list/',
    provider: 'CSES (University of Helsinki)',
    description: '19 classic, high-purity DP benchmark problems from Coin Combinations to Book Shop and Removal Game.',
    isFree: true,
    rating: 5.0,
    difficulty: 'Intermediate',
    authorityScore: 99,
    tags: ['cses', 'competitive-programming', 'problemset'],
  },
  {
    topicTag: 'Dynamic Programming',
    category: 'projects',
    type: 'github_repo',
    title: 'TheAlgorithms/JavaScript - Dynamic Programming Implementations',
    url: 'https://github.com/TheAlgorithms/JavaScript/tree/master/Dynamic-Programming',
    provider: 'TheAlgorithms (GitHub)',
    description: 'Open-source verified reference implementations of 40+ classic DP algorithms in clean JavaScript & TypeScript.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 95,
    tags: ['open-source', 'github', 'implementations'],
  },
  {
    topicTag: 'Dynamic Programming',
    category: 'books',
    type: 'book',
    title: 'Introduction to Algorithms (CLRS) - Chapter 15: Dynamic Programming',
    url: 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/',
    provider: 'MIT Press',
    description: 'The golden standard textbook treatment on optimal substructure, overlapping subproblems, and matrix-chain multiplication.',
    isFree: false,
    rating: 5.0,
    difficulty: 'Advanced',
    authorityScore: 100,
    tags: ['clrs', 'textbook', 'academic'],
  },
  {
    topicTag: 'Dynamic Programming',
    category: 'interview_prep',
    type: 'guide',
    title: 'LeetCode 75 DP Curated Study Plan',
    url: 'https://leetcode.com/studyplan/leetcode-75/',
    provider: 'LeetCode',
    description: 'Essential high-yield DP questions frequently asked in Google, Amazon, Meta, and Microsoft technical loops.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 96,
    tags: ['interview-prep', 'faang', 'leetcode-75'],
  },

  // ─── GRAPH ALGORITHMS ─────────────────────────────────────────────
  {
    topicTag: 'Graph Algorithms',
    category: 'recommended',
    type: 'youtube_video',
    title: 'Graph Algorithms for Technical Interviews - FreeCodeCamp',
    url: 'https://www.youtube.com/watch?v=tWVWeAqZ0WU',
    provider: 'freeCodeCamp (Alvin Zablan)',
    description: 'Comprehensive 2-hour crash course covering BFS, DFS, connected components, shortest path, and island counting.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Beginner',
    authorityScore: 97,
    tags: ['graphs', 'bfs', 'dfs', 'interview-prep'],
  },
  {
    topicTag: 'Graph Algorithms',
    category: 'videos',
    type: 'youtube_playlist',
    title: 'Striver Graph Series A-to-Z',
    url: 'https://www.youtube.com/playlist?list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn',
    provider: 'takeUforward (Striver)',
    description: '50+ video masterclass covering topological sorting, Dijkstra, Bellman-Ford, Floyd-Warshall, and Prim/Kruskal MST.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 96,
    tags: ['striver', 'takeuforward', 'dijkstra', 'mst'],
  },
  {
    topicTag: 'Graph Algorithms',
    category: 'documentation',
    type: 'doc',
    title: 'CP-Algorithms: Complete Graph Theory Reference',
    url: 'https://cp-algorithms.com/graph/breadth-first-search.html',
    provider: 'CP-Algorithms',
    description: 'Deep mathematical foundations, rigorous proofs, and competitive programming templates for advanced graph algorithms.',
    isFree: true,
    rating: 5.0,
    difficulty: 'Advanced',
    authorityScore: 99,
    tags: ['cp-algorithms', 'advanced', 'proofs'],
  },
  {
    topicTag: 'Graph Algorithms',
    category: 'practice',
    type: 'practice_hub',
    title: 'CSES Graph Algorithms Problem Set',
    url: 'https://cses.fi/problemset/list/',
    provider: 'CSES',
    description: '36 classic graph benchmark challenges: Counting Rooms, Labyrinth, Message Route, Round Trip, Flight Discount.',
    isFree: true,
    rating: 5.0,
    difficulty: 'Intermediate',
    authorityScore: 99,
    tags: ['cses', 'graph-problems'],
  },
  {
    topicTag: 'Graph Algorithms',
    category: 'interview_prep',
    type: 'guide',
    title: 'Blind 75 Essential Graph Problems',
    url: 'https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions',
    provider: 'Blind 75',
    description: 'The definitive list of must-solve graph interview questions with frequency breakdown across tier-1 tech companies.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 95,
    tags: ['blind-75', 'faang'],
  },

  // ─── REACT & FRONTEND ─────────────────────────────────────────────
  {
    topicTag: 'React',
    category: 'recommended',
    type: 'website',
    title: 'Official React Documentation & Deep Dives',
    url: 'https://react.dev/',
    provider: 'React Core Team',
    description: 'Interactive mental model tutorials, Hooks reference, Server Components, and concurrency architecture.',
    isFree: true,
    rating: 5.0,
    difficulty: 'All Levels',
    authorityScore: 100,
    tags: ['official', 'react', 'hooks', 'frontend'],
  },
  {
    topicTag: 'React',
    category: 'videos',
    type: 'youtube_channel',
    title: 'Jack Herrington - Modern React & Full-Stack Architecture',
    url: 'https://www.youtube.com/@jherr',
    provider: 'Jack Herrington',
    description: 'Deep architectural walkthroughs of React 19, Server Actions, state machines, and microfrontends.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 94,
    tags: ['react-19', 'nextjs', 'architecture'],
  },
  {
    topicTag: 'React',
    category: 'courses',
    type: 'course',
    title: 'Epic React by Kent C. Dodds',
    url: 'https://epicreact.dev/',
    provider: 'Kent C. Dodds',
    description: 'The most thorough advanced React course covering performance profiling, custom hooks, and testing.',
    isFree: false,
    rating: 4.9,
    difficulty: 'Advanced',
    authorityScore: 96,
    tags: ['testing', 'performance', 'advanced'],
  },
  {
    topicTag: 'React',
    category: 'articles',
    type: 'article',
    title: 'A Complete Guide to useEffect - Dan Abramov',
    url: 'https://overreacted.io/a-complete-guide-to-useeffect/',
    provider: 'Overreacted (Dan Abramov)',
    description: 'The quintessential deep dive into React synchronization, dependency arrays, and closure stale states.',
    isFree: true,
    rating: 5.0,
    difficulty: 'Intermediate',
    authorityScore: 99,
    tags: ['useeffect', 'closures', 'dan-abramov'],
  },
  {
    topicTag: 'React',
    category: 'interview_prep',
    type: 'guide',
    title: 'GreatFrontEnd React Coding Interview Questions',
    url: 'https://www.greatfrontend.com/questions/react',
    provider: 'GreatFrontEnd',
    description: 'Production-grade UI component challenges frequently asked in Frontend Engineering interviews (Meta, Stripe, Uber).',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 96,
    tags: ['frontend-interview', 'components', 'meta-prep'],
  },

  // ─── SYSTEM DESIGN ────────────────────────────────────────────────
  {
    topicTag: 'System Design',
    category: 'recommended',
    type: 'github_repo',
    title: 'System Design Primer by Donne Martin',
    url: 'https://github.com/donnemartin/system-design-primer',
    provider: 'Donne Martin (GitHub #1 System Design Resource)',
    description: 'Over 270k stars on GitHub: An immense, structured guide to scalability, databases, caching, microservices, and interview questions.',
    isFree: true,
    rating: 5.0,
    difficulty: 'All Levels',
    authorityScore: 100,
    tags: ['scalability', 'microservices', 'caching', 'sharding'],
  },
  {
    topicTag: 'System Design',
    category: 'videos',
    type: 'youtube_channel',
    title: 'ByteByteGo - Alex Xu System Design Visuals',
    url: 'https://www.youtube.com/@ByteByteGo',
    provider: 'Alex Xu (ByteByteGo)',
    description: 'Animated, high-density explanations of distributed caches, rate limiters, payment systems, and video streaming architectures.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 97,
    tags: ['alex-xu', 'distributed-systems', 'visual-architecture'],
  },
  {
    topicTag: 'System Design',
    category: 'books',
    type: 'book',
    title: 'Designing Data-Intensive Applications (DDIA) by Martin Kleppmann',
    url: 'https://dataintensive.net/',
    provider: "O'Reilly Media",
    description: 'The undisputed bible of distributed data systems: replication, partitioning, transactions, consensus, and stream processing.',
    isFree: false,
    rating: 5.0,
    difficulty: 'Advanced',
    authorityScore: 100,
    tags: ['ddia', 'kleppmann', 'distributed-data'],
  },

  // ─── MACHINE LEARNING & DEEP LEARNING ─────────────────────────────
  {
    topicTag: 'Machine Learning',
    category: 'recommended',
    type: 'course',
    title: 'Machine Learning Specialization by Andrew Ng',
    url: 'https://www.deeplearning.ai/courses/machine-learning-specialization/',
    provider: 'DeepLearning.AI / Stanford',
    description: 'Foundational ML course covering linear regression, logistic regression, decision trees, XGBoost, and neural networks.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Beginner',
    authorityScore: 100,
    tags: ['andrew-ng', 'stanford', 'supervised-learning'],
  },
  {
    topicTag: 'Machine Learning',
    category: 'videos',
    type: 'youtube_channel',
    title: 'StatQuest with Josh Starmer',
    url: 'https://www.youtube.com/@statquest',
    provider: 'StatQuest',
    description: 'Crystal-clear visual breakdowns of statistics, gradient descent, PCA, random forests, and transformer attention.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Beginner',
    authorityScore: 98,
    tags: ['statistics', 'visuals', 'intuition'],
  },
  {
    topicTag: 'Deep Learning',
    category: 'courses',
    type: 'course',
    title: 'Practical Deep Learning for Coders (Fast.ai)',
    url: 'https://course.fast.ai/',
    provider: 'Fast.ai (Jeremy Howard)',
    description: 'Top-down hands-on deep learning curriculum building production computer vision and NLP models with PyTorch.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 97,
    tags: ['pytorch', 'fastai', 'transformers'],
  },
  {
    topicTag: 'Deep Learning',
    category: 'documentation',
    type: 'doc',
    title: 'PyTorch Official Tutorials & Documentation',
    url: 'https://pytorch.org/tutorials/',
    provider: 'PyTorch Official',
    description: 'Step-by-step guides for tensor manipulation, autograd, model training, TorchScript, and distributed GPU training.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 99,
    tags: ['pytorch', 'official', 'tensors'],
  },

  // ─── SQL & DATABASES ──────────────────────────────────────────────
  {
    topicTag: 'SQL',
    category: 'recommended',
    type: 'website',
    title: 'SQLBolt - Interactive SQL Lessons',
    url: 'https://sqlbolt.com/',
    provider: 'SQLBolt',
    description: 'Browser-based interactive exercises teaching SELECT queries, JOINs, aggregations, subqueries, and table constraints.',
    isFree: true,
    rating: 4.8,
    difficulty: 'Beginner',
    authorityScore: 92,
    tags: ['interactive', 'sql-basics', 'joins'],
  },
  {
    topicTag: 'SQL',
    category: 'documentation',
    type: 'doc',
    title: 'PostgreSQL Official Documentation & Manual',
    url: 'https://www.postgresql.org/docs/current/',
    provider: 'PostgreSQL Global Development Group',
    description: 'The comprehensive official manual covering indexing strategies (B-tree, GIN, GiST), MVCC, CTEs, and query planner optimization.',
    isFree: true,
    rating: 5.0,
    difficulty: 'Intermediate',
    authorityScore: 100,
    tags: ['postgresql', 'indexes', 'acid'],
  },
  {
    topicTag: 'SQL',
    category: 'practice',
    type: 'practice_hub',
    title: 'LeetCode Database 50 Study Plan',
    url: 'https://leetcode.com/studyplan/top-sql-50/',
    provider: 'LeetCode',
    description: 'Top 50 most frequently asked SQL interview questions from window functions to CTEs and multi-table aggregations.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 96,
    tags: ['sql-interview', 'window-functions'],
  },

  // ─── PYTHON & JAVA ────────────────────────────────────────────────
  {
    topicTag: 'Python',
    category: 'documentation',
    type: 'doc',
    title: 'Official Python 3 Documentation & Tutorial',
    url: 'https://docs.python.org/3/tutorial/',
    provider: 'Python Software Foundation',
    description: 'The authoritative reference for Python core syntax, standard libraries, data structures, generators, and async programming.',
    isFree: true,
    rating: 5.0,
    difficulty: 'All Levels',
    authorityScore: 100,
    tags: ['python', 'official', 'reference'],
  },
  {
    topicTag: 'Java',
    category: 'documentation',
    type: 'doc',
    title: 'Oracle Java Documentation & Developer Guides',
    url: 'https://docs.oracle.com/en/java/',
    provider: 'Oracle',
    description: 'Official Java SE developer documentation covering JVM memory models, garbage collection, Collections Framework, and concurrency.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 100,
    tags: ['java', 'jvm', 'concurrency', 'collections'],
  },

  // ─── OPERATING SYSTEMS & COMPUTER NETWORKS ────────────────────────
  {
    topicTag: 'Operating Systems',
    category: 'books',
    type: 'book',
    title: 'Operating Systems: Three Easy Pieces (OSTEP)',
    url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
    provider: 'University of Wisconsin-Madison (Remzi & Andrea Arpaci-Dusseau)',
    description: 'The premier modern textbook on Virtualization, Concurrency, and Persistence — freely available online.',
    isFree: true,
    rating: 5.0,
    difficulty: 'Intermediate',
    authorityScore: 99,
    tags: ['ostep', 'processes', 'threads', 'virtual-memory'],
  },
  {
    topicTag: 'Computer Networks',
    category: 'courses',
    type: 'course',
    title: 'Computer Networking: A Top-Down Approach (Kurose & Ross Interactive)',
    url: 'https://gaia.cs.umass.edu/kurose_ross/online_lectures.htm',
    provider: 'UMass Amherst',
    description: 'Interactive lectures and Wireshark lab simulations covering TCP/IP, DNS, HTTP/3, congestion control, and routing.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 98,
    tags: ['networking', 'tcp-ip', 'wireshark'],
  },

  // ─── CLOUD & DEVOPS ───────────────────────────────────────────────
  {
    topicTag: 'Cloud',
    category: 'documentation',
    type: 'doc',
    title: 'AWS Well-Architected Framework & Whitepapers',
    url: 'https://aws.amazon.com/architecture/well-architected/',
    provider: 'Amazon Web Services',
    description: 'The six architectural pillars for designing reliable, secure, cost-optimized, and performant cloud architectures.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 99,
    tags: ['aws', 'cloud', 'architecture', 'security'],
  },
  {
    topicTag: 'DevOps',
    category: 'documentation',
    type: 'doc',
    title: 'Kubernetes Official Documentation & Interactive Tutorials',
    url: 'https://kubernetes.io/docs/home/',
    provider: 'Cloud Native Computing Foundation (CNCF)',
    description: 'Official guides for container orchestration, Pods, Services, Ingress controllers, Helm charts, and cluster networking.',
    isFree: true,
    rating: 5.0,
    difficulty: 'Intermediate',
    authorityScore: 100,
    tags: ['kubernetes', 'docker', 'containers', 'cncf'],
  },
  {
    topicTag: 'Cybersecurity',
    category: 'documentation',
    type: 'doc',
    title: 'OWASP Top 10 Web Application Security Risks',
    url: 'https://owasp.org/www-project-top-ten/',
    provider: 'OWASP Foundation',
    description: 'Standard security awareness document for developers: SQL injection, broken authentication, SSRF, and security misconfigurations.',
    isFree: true,
    rating: 5.0,
    difficulty: 'Intermediate',
    authorityScore: 100,
    tags: ['security', 'owasp', 'vulnerabilities'],
  },
];

/**
 * Seeds the comprehensive Smart Learning Hub database into SQLite.
 */
export async function seedSmartLearningResources(): Promise<number> {
  const currentCount = await prisma.learningResource.count();
  if (currentCount >= AUTHENTIC_LEARNING_RESOURCES.length) {
    return currentCount;
  }

  console.log(`🌱 Seeding ${AUTHENTIC_LEARNING_RESOURCES.length} authentic Smart Learning Hub resources...`);

  for (const item of AUTHENTIC_LEARNING_RESOURCES) {
    const existing = await prisma.learningResource.findFirst({
      where: { title: item.title, provider: item.provider },
    });

    if (!existing) {
      await prisma.learningResource.create({
        data: {
          topicTag: item.topicTag,
          domain: item.domain || 'All Domains',
          category: item.category,
          type: item.type,
          title: item.title,
          url: item.url,
          provider: item.provider,
          description: item.description,
          isFree: item.isFree,
          rating: item.rating,
          difficulty: item.difficulty || 'All Levels',
          authorityScore: item.authorityScore,
          tagsJson: JSON.stringify(item.tags),
          thumbnailUrl: item.thumbnailUrl,
        },
      });
    }
  }

  const finalCount = await prisma.learningResource.count();
  return finalCount;
}

/**
 * Searches and categorizes learning resources with ranking, relevance scoring, and deduplication.
 */
export async function searchLearningHub(
  queryOrParams: string | { query?: string; category?: string; domain?: string; isFree?: boolean; studentId?: string } = '',
  categoryParam: string = 'all'
): Promise<LearningHubSearchResponse> {
  await seedSmartLearningResources();

  let query = '';
  let category = categoryParam;
  let domain: string | undefined = undefined;
  let isFree: boolean | undefined = undefined;
  let studentId: string | undefined = undefined;

  if (typeof queryOrParams === 'object' && queryOrParams !== null) {
    query = queryOrParams.query || '';
    category = queryOrParams.category || categoryParam;
    domain = queryOrParams.domain;
    isFree = queryOrParams.isFree;
    studentId = queryOrParams.studentId;
  } else if (typeof queryOrParams === 'string') {
    query = queryOrParams;
  }

  const cleanQuery = query.trim().toLowerCase();

  const allDbResources = await prisma.learningResource.findMany({
    orderBy: [{ authorityScore: 'desc' }, { rating: 'desc' }],
  });

  const categories: Record<LearningCategory, SmartLearningResource[]> = {
    recommended: [],
    videos: [],
    courses: [],
    documentation: [],
    articles: [],
    practice: [],
    projects: [],
    books: [],
    interview_prep: [],
  };

  const seenUrls = new Set<string>();

  for (const r of allDbResources) {
    // Avoid duplicates
    if (seenUrls.has(r.url)) continue;

    let relevance = 50; // Base score
    const titleMatch = r.title.toLowerCase().includes(cleanQuery);
    const topicMatch = r.topicTag.toLowerCase().includes(cleanQuery);
    const descMatch = r.description.toLowerCase().includes(cleanQuery);

    if (cleanQuery) {
      if (titleMatch) relevance += 40;
      if (topicMatch) relevance += 35;
      if (descMatch) relevance += 15;

      // Skip completely irrelevant items if a specific query was requested
      if (!titleMatch && !topicMatch && !descMatch && cleanQuery.length > 2) {
        continue;
      }
    }

    if (r.isFree) relevance += 5;
    if (r.authorityScore) relevance += Math.round((r.authorityScore - 80) / 2);

    let tags: string[] = [];
    try { tags = r.tagsJson ? JSON.parse(r.tagsJson) : []; } catch { tags = []; }

    const cat = (r.category as LearningCategory) || 'recommended';

    if (category !== 'all' && cat !== category && category !== 'recommended') {
      continue;
    }

    const formatted: SmartLearningResource = {
      id: r.id,
      topicTag: r.topicTag,
      domain: r.domain || undefined,
      category: cat,
      type: r.type,
      title: r.title,
      url: r.url,
      provider: r.provider,
      description: r.description,
      isFree: r.isFree,
      rating: r.rating || 4.8,
      difficulty: r.difficulty || 'All Levels',
      authorityScore: r.authorityScore || 90,
      tags,
      thumbnailUrl: r.thumbnailUrl || undefined,
      relevanceScore: Math.round(relevance),
    };

    if (categories[cat]) {
      categories[cat].push(formatted);
      seenUrls.add(r.url);
    }
  }

  // Sort each category by relevanceScore descending
  let totalCount = 0;
  for (const catKey of Object.keys(categories) as LearningCategory[]) {
    categories[catKey].sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    totalCount += categories[catKey].length;
  }

  // Graceful fallback to top authoritative resources if query matched 0 items
  if (totalCount === 0) {
    for (const r of allDbResources.slice(0, 12)) {
      const cat = (r.category as LearningCategory) || 'recommended';
      const formatted: SmartLearningResource = {
        id: r.id,
        topicTag: r.topicTag,
        domain: r.domain || undefined,
        category: cat,
        type: r.type,
        title: r.title,
        url: r.url,
        provider: r.provider,
        description: r.description,
        isFree: r.isFree,
        rating: r.rating || 4.8,
        difficulty: r.difficulty || 'All Levels',
        authorityScore: r.authorityScore || 90,
        tags: [],
        thumbnailUrl: r.thumbnailUrl || undefined,
        relevanceScore: r.authorityScore || 85,
      };
      if (categories[cat]) {
        categories[cat].push(formatted);
      }
    }
    totalCount = Object.values(categories).reduce((sum, list) => sum + list.length, 0);
  }

  return {
    query,
    totalResults: totalCount,
    categories,
  };
}

/**
 * Returns personalized learning resources for a user based on their weak topics in DSA attempts and skill scores.
 */
export async function getPersonalizedRecommendations(
  studentId: string
): Promise<SmartLearningResource[] & { personalizedWeakTopics?: string[]; categories?: Record<LearningCategory, SmartLearningResource[]>; recommendations?: SmartLearningResource[] }> {
  await seedSmartLearningResources();

  // 1. Identify weak areas from DSA attempts
  const attempts = await prisma.dSAAttempt.findMany({
    where: { studentId },
    include: { question: true },
  });

  const topicFails: Record<string, number> = {};
  for (const a of attempts) {
    if (a.status === 'FAILED' || a.status === 'ATTEMPTED') {
      topicFails[a.question.topic] = (topicFails[a.question.topic] || 0) + 1;
    }
  }

  // 2. Identify weak areas from StudentSkillScore
  const skillScores = await prisma.studentSkillScore.findMany({
    where: { studentId },
    include: { skill: true },
  });

  const lowSkills = skillScores.filter((s) => s.score < 60).map((s) => s.skill.name);

  const identifiedWeakTopics = Array.from(
    new Set([...Object.keys(topicFails), ...lowSkills])
  );

  // Default fallback weak areas if user is brand new
  const queryTopics = identifiedWeakTopics.length > 0 ? identifiedWeakTopics : ['Dynamic Programming', 'Graph Algorithms', 'React'];

  // Search across top weak topics
  const combinedResults = await searchLearningHub(queryTopics[0] || 'Dynamic Programming');
  let recs = (combinedResults.categories.recommended && combinedResults.categories.recommended.length > 0)
    ? combinedResults.categories.recommended
    : Object.values(combinedResults.categories).flat();

  if (recs.length === 0) {
    const all = await prisma.learningResource.findMany({ take: 6 });
    recs = all.map(r => ({
      id: r.id,
      topicTag: r.topicTag,
      domain: r.domain || undefined,
      category: (r.category as LearningCategory) || 'recommended',
      type: r.type,
      title: r.title,
      url: r.url,
      provider: r.provider,
      description: r.description,
      isFree: r.isFree,
      rating: r.rating || 4.8,
      difficulty: r.difficulty || 'All Levels',
      authorityScore: r.authorityScore || 90,
      tags: [],
      thumbnailUrl: r.thumbnailUrl || undefined,
      relevanceScore: 90,
    }));
  }

  const list: any = Array.from(recs);
  list.personalizedWeakTopics = queryTopics;
  list.categories = combinedResults.categories;
  list.query = queryTopics[0];
  list.totalResults = list.length;
  list.recommendations = list;

  return list;
}

export const searchResources = searchLearningHub;

export const learningRecommendationService = {
  searchLearningHub,
  searchResources,
  getPersonalizedRecommendations,
  seedSmartLearningResources,
};

export default learningRecommendationService;
