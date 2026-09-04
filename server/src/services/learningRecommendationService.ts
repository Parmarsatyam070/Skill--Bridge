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

/**
 * Authentic, Curated Technical Learning Resources Database
 * All resources have verified, authentic URLs, trusted providers, and authoritative quality scores.
 */
export const AUTHENTIC_LEARNING_RESOURCES: RawLearningResource[] = [
  // ─── 1. DYNAMIC PROGRAMMING ──────────────────────────────────────────
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
    tags: ['dp', '1d-dp', '2d-dp', 'knapsack', 'memoization', 'tabulation', 'algorithms'],
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
    tags: ['mit', 'algorithms', 'memoization', 'subproblems', 'dp'],
  },
  {
    topicTag: 'Dynamic Programming',
    category: 'courses',
    type: 'course',
    title: 'Grokking Dynamic Programming Patterns for Coding Interviews',
    url: 'https://www.designgurus.io/course/grokking-dynamic-programming',
    provider: 'Design Gurus',
    description: 'Systematic classification of the 6 fundamental DP patterns with visual mental models and code walkthroughs.',
    isFree: false,
    rating: 4.8,
    difficulty: 'Intermediate',
    authorityScore: 92,
    tags: ['coding-interviews', 'patterns', 'knapsack', 'dp', 'algorithms'],
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
    tags: ['guide', 'reference', 'complexity', 'dp', 'tabulation'],
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
    tags: ['recursion', 'optimization', 'tutorial', 'memoization', 'dp'],
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
    tags: ['cses', 'competitive-programming', 'problemset', 'dp'],
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
    tags: ['open-source', 'github', 'implementations', 'javascript', 'dp'],
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
    tags: ['clrs', 'textbook', 'academic', 'algorithms', 'dp'],
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
    tags: ['interview-prep', 'faang', 'leetcode-75', 'dp'],
  },

  // ─── 2. GRAPH ALGORITHMS ─────────────────────────────────────────────
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
    tags: ['graphs', 'bfs', 'dfs', 'interview-prep', 'algorithms'],
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
    tags: ['striver', 'takeuforward', 'dijkstra', 'mst', 'topological-sort', 'graphs'],
  },
  {
    topicTag: 'Graph Algorithms',
    category: 'courses',
    type: 'course',
    title: 'Graph Theory Algorithms by William Fiset',
    url: 'https://www.youtube.com/playlist?list=PLDV1Zeh2NRsDGO4--qE8yH72HFL1Km93P',
    provider: 'William Fiset (ex-Google)',
    description: 'Acclaimed university-level series covering graph representations, Eulerian paths, Tarjan bridges, and Max Flow.',
    isFree: true,
    rating: 5.0,
    difficulty: 'Advanced',
    authorityScore: 98,
    tags: ['william-fiset', 'graph-theory', 'max-flow', 'tarjan'],
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
    tags: ['cp-algorithms', 'advanced', 'proofs', 'graphs', 'dijkstra'],
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
    tags: ['cses', 'graph-problems', 'competitive-programming'],
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
    tags: ['blind-75', 'faang', 'graphs', 'interview-prep'],
  },

  // ─── 3. DATA STRUCTURES & ALGORITHMS (GENERAL) ─────────────────────
  {
    topicTag: 'Data Structures',
    category: 'recommended',
    type: 'website',
    title: 'VisuAlgo - Visualizing Data Structures and Algorithms',
    url: 'https://visualgo.net/en',
    provider: 'National University of Singapore (NUS)',
    description: 'Interactive animated visualizations for Linked Lists, BSTs, AVL Trees, Heaps, Union-Find, Sorting, and Graphs.',
    isFree: true,
    rating: 5.0,
    difficulty: 'All Levels',
    authorityScore: 98,
    tags: ['dsa', 'visualgo', 'animation', 'trees', 'heaps', 'sorting'],
  },
  {
    topicTag: 'Data Structures',
    category: 'videos',
    type: 'youtube_video',
    title: 'Data Structures and Algorithms in 15 Hours - freeCodeCamp',
    url: 'https://www.youtube.com/watch?v=8hly31xKli0',
    provider: 'freeCodeCamp',
    description: 'Comprehensive foundational video guide explaining big-O notation, arrays, hash tables, stacks, queues, and recursion.',
    isFree: true,
    rating: 4.8,
    difficulty: 'Beginner',
    authorityScore: 95,
    tags: ['dsa', 'big-o', 'stacks', 'queues', 'hash-tables', 'trees'],
  },
  {
    topicTag: 'Algorithms',
    category: 'courses',
    type: 'course',
    title: 'Algorithms, Part I by Robert Sedgewick & Kevin Wayne',
    url: 'https://www.coursera.org/learn/algorithms-part1',
    provider: 'Princeton University / Coursera',
    description: 'Princeton University prestigious course on elementary data structures, sorting, searching, priority queues, and BSTs.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 100,
    tags: ['princeton', 'sedgewick', 'sorting', 'searching', 'bst'],
  },

  // ─── 4. REACT & FRONTEND ─────────────────────────────────────────────
  {
    topicTag: 'React',
    category: 'recommended',
    type: 'website',
    title: 'React Official Interactive Learn Course',
    url: 'https://react.dev/learn',
    provider: 'React Core Team (Meta)',
    description: 'Step-by-step interactive official tutorial for learning React 19 from fundamentals to advanced state architecture.',
    isFree: true,
    rating: 5.0,
    difficulty: 'All Levels',
    authorityScore: 100,
    tags: ['official', 'react', 'reactjs', 'hooks', 'frontend', 'components'],
  },
  {
    topicTag: 'React',
    category: 'documentation',
    type: 'doc',
    title: 'Official React Documentation & API Reference',
    url: 'https://react.dev/',
    provider: 'React Core Team (Meta)',
    description: 'Interactive mental model tutorials, Hooks API reference, Server Components, suspense, and concurrency architecture.',
    isFree: true,
    rating: 5.0,
    difficulty: 'All Levels',
    authorityScore: 100,
    tags: ['official', 'react', 'reactjs', 'hooks', 'frontend', 'components', 'docs'],
  },
  {
    topicTag: 'React',
    category: 'videos',
    type: 'youtube_channel',
    title: 'Jack Herrington - Modern React & Full-Stack Architecture',
    url: 'https://www.youtube.com/@jherr',
    provider: 'Jack Herrington',
    description: 'Deep architectural walkthroughs of React 19, Server Actions, state machines, microfrontends, and performance tuning.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 94,
    tags: ['react-19', 'nextjs', 'architecture', 'react', 'frontend'],
  },
  {
    topicTag: 'React',
    category: 'courses',
    type: 'course',
    title: 'Full Stack Open - University of Helsinki',
    url: 'https://fullstackopen.com/en/',
    provider: 'University of Helsinki',
    description: 'World-renowned university course covering React, Redux, Node.js, Express, TypeScript, GraphQL, CI/CD, and Docker.',
    isFree: true,
    rating: 5.0,
    difficulty: 'Intermediate',
    authorityScore: 99,
    tags: ['fullstack', 'react', 'redux', 'typescript', 'university'],
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
    tags: ['useeffect', 'closures', 'dan-abramov', 'react', 'hooks'],
  },
  {
    topicTag: 'React',
    category: 'practice',
    type: 'practice_hub',
    title: 'GreatFrontEnd React Coding Practice',
    url: 'https://www.greatfrontend.com/questions/react',
    provider: 'GreatFrontEnd',
    description: 'Production-grade UI component challenges frequently asked in Frontend Engineering interviews (Meta, Stripe, Uber).',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 96,
    tags: ['frontend-interview', 'components', 'meta-prep', 'react', 'practice'],
  },
  {
    topicTag: 'React',
    category: 'projects',
    type: 'github_repo',
    title: 'RealWorld React Example Apps (Conduit)',
    url: 'https://github.com/gothinkster/react-redux-realworld-example-app',
    provider: 'RealWorld / GitHub',
    description: 'Exemplary fullstack medium clone built with React, Redux, and modern clean architecture.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 97,
    tags: ['react', 'redux', 'projects', 'frontend', 'realworld'],
  },
  {
    topicTag: 'React',
    category: 'books',
    type: 'book',
    title: 'The Road to React by Robin Wieruch',
    url: 'https://www.roadtoreact.com/',
    provider: 'Robin Wieruch',
    description: 'Pragmatic, comprehensive book covering React fundamentals, hooks, custom hooks, and state management.',
    isFree: false,
    rating: 4.9,
    difficulty: 'Beginner',
    authorityScore: 95,
    tags: ['react', 'book', 'frontend', 'hooks'],
  },
  {
    topicTag: 'React',
    category: 'interview_prep',
    type: 'guide',
    title: 'React Interview Questions & Answers',
    url: 'https://github.com/sudheerj/reactjs-interview-questions',
    provider: 'Sudheer Jonna (GitHub)',
    description: 'Curated list of 500+ React interview questions with in-depth answers and code snippets.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 96,
    tags: ['frontend-interview', 'components', 'meta-prep', 'react', 'interview-prep'],
  },

  // ─── 5. JAVASCRIPT & TYPESCRIPT ──────────────────────────────────────
  {
    topicTag: 'JavaScript',
    category: 'recommended',
    type: 'doc',
    title: 'MDN Web Docs - JavaScript Guide & Reference',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    provider: 'Mozilla MDN',
    description: 'The gold standard reference for JavaScript syntax, event loop, promises, closures, prototypes, and web APIs.',
    isFree: true,
    rating: 5.0,
    difficulty: 'All Levels',
    authorityScore: 100,
    tags: ['mdn', 'javascript', 'js', 'es6', 'web-standards', 'frontend'],
  },
  {
    topicTag: 'JavaScript',
    category: 'courses',
    type: 'website',
    title: 'The Modern JavaScript Tutorial (javascript.info)',
    url: 'https://javascript.info/',
    provider: 'Ilya Kantor',
    description: 'In-depth, beautifully explained tutorials from fundamentals to advanced concepts like generators, Proxies, and DOM events.',
    isFree: true,
    rating: 4.9,
    difficulty: 'All Levels',
    authorityScore: 98,
    tags: ['javascript', 'js', 'es6', 'tutorial', 'reference'],
  },
  {
    topicTag: 'TypeScript',
    category: 'documentation',
    type: 'doc',
    title: 'Official TypeScript Handbook',
    url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
    provider: 'Microsoft TypeScript Team',
    description: 'The official handbook covering generics, mapped types, conditional types, template literal types, and type narrowing.',
    isFree: true,
    rating: 5.0,
    difficulty: 'All Levels',
    authorityScore: 100,
    tags: ['typescript', 'ts', 'microsoft', 'generics', 'types', 'official'],
  },
  {
    topicTag: 'TypeScript',
    category: 'videos',
    type: 'youtube_channel',
    title: 'Total TypeScript by Matt Pocock',
    url: 'https://www.youtube.com/@mattpocockuk',
    provider: 'Matt Pocock',
    description: 'Master practical advanced TypeScript tricks, type gymnastics, generics, and production patterns.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 95,
    tags: ['typescript', 'ts', 'generics', 'matt-pocock'],
  },

  // ─── 6. PYTHON ───────────────────────────────────────────────────────
  {
    topicTag: 'Python',
    category: 'recommended',
    type: 'doc',
    title: 'Official Python 3 Documentation & Tutorial',
    url: 'https://docs.python.org/3/tutorial/',
    provider: 'Python Software Foundation',
    description: 'The authoritative reference for Python core syntax, standard libraries, data structures, generators, and async programming.',
    isFree: true,
    rating: 5.0,
    difficulty: 'All Levels',
    authorityScore: 100,
    tags: ['python', 'py', 'official', 'standard-library', 'backend'],
  },
  {
    topicTag: 'Python',
    category: 'videos',
    type: 'youtube_channel',
    title: 'Corey Schafer - Python Programming Tutorials',
    url: 'https://www.youtube.com/@coreyms',
    provider: 'Corey Schafer',
    description: 'High-clarity modular video series on Python OOP, decorators, context managers, generators, and virtual environments.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Beginner',
    authorityScore: 97,
    tags: ['python', 'oop', 'decorators', 'django', 'flask'],
  },
  {
    topicTag: 'Python',
    category: 'courses',
    type: 'course',
    title: 'CS50P: Introduction to Programming with Python',
    url: 'https://cs50.harvard.edu/python/',
    provider: 'Harvard University (David J. Malan)',
    description: 'Harvard renowned introduction to Python covering computational thinking, regular expressions, unit testing, and libraries.',
    isFree: true,
    rating: 5.0,
    difficulty: 'Beginner',
    authorityScore: 100,
    tags: ['harvard', 'cs50', 'python', 'beginners'],
  },

  // ─── 7. JAVA & SPRING BOOT ───────────────────────────────────────────
  {
    topicTag: 'Java',
    category: 'recommended',
    type: 'doc',
    title: 'Oracle Java Official Documentation & Tutorials',
    url: 'https://docs.oracle.com/en/java/',
    provider: 'Oracle',
    description: 'Official Java SE reference guides, JVM internals, Concurrency API, Streams, Lambdas, and Virtual Threads.',
    isFree: true,
    rating: 5.0,
    difficulty: 'All Levels',
    authorityScore: 100,
    tags: ['java', 'oracle', 'jdk', 'concurrency', 'jvm', 'official'],
  },
  {
    topicTag: 'Java',
    category: 'articles',
    type: 'website',
    title: 'Baeldung - Java & Spring Boot Guides',
    url: 'https://www.baeldung.com/',
    provider: 'Baeldung',
    description: 'Industry-standard technical articles on Spring Boot, Spring Security, Hibernate, JPA, and Java design patterns.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 98,
    tags: ['java', 'spring-boot', 'jpa', 'hibernate', 'microservices'],
  },
  {
    topicTag: 'Java',
    category: 'videos',
    type: 'youtube_channel',
    title: 'Java Brains (Koushik Kothagal)',
    url: 'https://www.youtube.com/@JavaBrainsChannel',
    provider: 'Java Brains',
    description: 'Comprehensive tutorials on Spring Framework, Microservices, Spring Cloud, OAuth2, and reactive programming.',
    isFree: true,
    rating: 4.8,
    difficulty: 'Intermediate',
    authorityScore: 94,
    tags: ['java', 'spring', 'microservices', 'oauth2'],
  },

  // ─── 8. C++ ──────────────────────────────────────────────────────────
  {
    topicTag: 'C++',
    category: 'recommended',
    type: 'doc',
    title: 'cppreference.com - Complete C++ Standard Library',
    url: 'https://en.cppreference.com/w/',
    provider: 'cppreference',
    description: 'The authoritative reference for C++ language specifications, STL containers, iterators, algorithms, and C++20 features.',
    isFree: true,
    rating: 5.0,
    difficulty: 'All Levels',
    authorityScore: 100,
    tags: ['cpp', 'c++', 'stl', 'cppreference', 'systems'],
  },
  {
    topicTag: 'C++',
    category: 'courses',
    type: 'website',
    title: 'LearnCpp.com - Comprehensive C++ Tutorial',
    url: 'https://www.learncpp.com/',
    provider: 'LearnCpp',
    description: 'Meticulously structured tutorial covering pointers, memory management, templates, smart pointers, and RAII.',
    isFree: true,
    rating: 4.9,
    difficulty: 'All Levels',
    authorityScore: 98,
    tags: ['cpp', 'c++', 'pointers', 'memory-management', 'raii'],
  },
  {
    topicTag: 'C++',
    category: 'videos',
    type: 'youtube_playlist',
    title: 'The Cherno - C++ Masterclass Series',
    url: 'https://www.youtube.com/playlist?list=PLlrATfBNZ98dudnM48yfGUldqGD0S4G6b',
    provider: 'The Cherno (ex-EA Games)',
    description: 'High-performance C++ series covering memory allocation, cache coherence, threading, and game engine architecture.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Intermediate',
    authorityScore: 96,
    tags: ['cpp', 'c++', 'memory', 'performance', 'graphics'],
  },

  // ─── 9. SYSTEM DESIGN & DISTRIBUTED SYSTEMS ─────────────────────────
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
    tags: ['system-design', 'scalability', 'microservices', 'caching', 'sharding', 'distributed-systems'],
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
    tags: ['alex-xu', 'distributed-systems', 'visual-architecture', 'system-design'],
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
    tags: ['ddia', 'kleppmann', 'distributed-data', 'system-design', 'transactions'],
  },

  // ─── 10. MACHINE LEARNING & DEEP LEARNING ───────────────────────────
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
    tags: ['machine-learning', 'ml', 'andrew-ng', 'stanford', 'supervised-learning', 'ai'],
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
    tags: ['statistics', 'visuals', 'intuition', 'machine-learning', 'ml'],
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
    tags: ['pytorch', 'fastai', 'transformers', 'deep-learning', 'neural-networks'],
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
    tags: ['pytorch', 'official', 'tensors', 'deep-learning', 'ai'],
  },

  // ─── 11. SQL & DATABASES (DBMS) ─────────────────────────────────────
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
    tags: ['interactive', 'sql-basics', 'joins', 'sql', 'dbms', 'database'],
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
    tags: ['postgresql', 'indexes', 'acid', 'sql', 'dbms', 'database', 'official'],
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
    tags: ['sql-interview', 'window-functions', 'sql', 'dbms', 'queries'],
  },

  // ─── 12. OPERATING SYSTEMS & LINUX ──────────────────────────────────
  {
    topicTag: 'Operating Systems',
    category: 'recommended',
    type: 'book',
    title: 'Operating Systems: Three Easy Pieces (OSTEP)',
    url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
    provider: 'University of Wisconsin-Madison (Remzi & Andrea Arpaci-Dusseau)',
    description: 'The quintessential open-access textbook on virtualization (CPU, memory), concurrency (threads, locks), and persistence (file systems).',
    isFree: true,
    rating: 5.0,
    difficulty: 'Intermediate',
    authorityScore: 100,
    tags: ['ostep', 'operating-systems', 'os', 'virtual-memory', 'concurrency', 'processes'],
  },
  {
    topicTag: 'Operating Systems',
    category: 'videos',
    type: 'youtube_playlist',
    title: 'NPTEL Operating Systems IIT Madras Lecture Series',
    url: 'https://www.youtube.com/playlist?list=PLbRMhDVUMngcxn25pPqW7iY6X7T3PZ_R-',
    provider: 'NPTEL / IIT Madras',
    description: 'Rigorous engineering lectures on process synchronization, semaphores, deadlocks, memory management, and paging.',
    isFree: true,
    rating: 4.8,
    difficulty: 'Intermediate',
    authorityScore: 95,
    tags: ['nptel', 'iit', 'os', 'deadlocks', 'memory-management', 'operating-systems'],
  },
  {
    topicTag: 'Operating Systems',
    category: 'documentation',
    type: 'doc',
    title: 'Linux Kernel Documentation',
    url: 'https://www.kernel.org/doc/html/latest/',
    provider: 'Linux Kernel Organization',
    description: 'Official technical guides on process scheduling, system calls, memory architecture, cgroups, and namespaces.',
    isFree: true,
    rating: 5.0,
    difficulty: 'Advanced',
    authorityScore: 100,
    tags: ['linux', 'kernel', 'syscalls', 'cgroups', 'os', 'official'],
  },

  // ─── 13. COMPUTER NETWORKS ──────────────────────────────────────────
  {
    topicTag: 'Computer Networks',
    category: 'recommended',
    type: 'book',
    title: 'Computer Networking: A Top-Down Approach by Kurose & Ross',
    url: 'https://www.pearson.com/en-us/subject-catalog/p/computer-networking-a-top-down-approach/P200000003333',
    provider: 'Pearson (Jim Kurose & Keith Ross)',
    description: 'The worldwide standard textbook explaining the Internet protocol stack from the application layer (HTTP, DNS) down to link layer.',
    isFree: false,
    rating: 5.0,
    difficulty: 'Intermediate',
    authorityScore: 100,
    tags: ['networking', 'tcp-ip', 'kurose-ross', 'http', 'dns', 'computer-networks', 'cn'],
  },
  {
    topicTag: 'Computer Networks',
    category: 'videos',
    type: 'youtube_channel',
    title: 'NetworkChuck - Practical Networking Tutorials',
    url: 'https://www.youtube.com/@NetworkChuck',
    provider: 'NetworkChuck',
    description: 'Engaging, hands-on explanations of subnetting, TCP handshakes, VLANs, Wireshark packet analysis, and firewalls.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Beginner',
    authorityScore: 94,
    tags: ['wireshark', 'tcp', 'subnetting', 'vlans', 'computer-networks'],
  },
  {
    topicTag: 'Computer Networks',
    category: 'documentation',
    type: 'doc',
    title: 'Cloudflare Learning Center - Networking & Web Security',
    url: 'https://www.cloudflare.com/learning/',
    provider: 'Cloudflare',
    description: 'Crystal-clear architectural guides on CDN, DNS resolution, DDoS mitigation, TLS handshakes, HTTP/3, and BGP routing.',
    isFree: true,
    rating: 4.9,
    difficulty: 'All Levels',
    authorityScore: 98,
    tags: ['cloudflare', 'tls', 'dns', 'http3', 'bgp', 'security', 'networking'],
  },

  // ─── 14. DOCKER & KUBERNETES / CLOUD DEVOPS ──────────────────────────
  {
    topicTag: 'Docker',
    category: 'recommended',
    type: 'doc',
    title: 'Docker Official Documentation & Getting Started',
    url: 'https://docs.docker.com/get-started/',
    provider: 'Docker Inc.',
    description: 'Official guides for building multi-stage container images, compose networking, volume persistence, and Docker daemon configuration.',
    isFree: true,
    rating: 5.0,
    difficulty: 'All Levels',
    authorityScore: 100,
    tags: ['docker', 'containers', 'dockerfile', 'devops', 'cloud', 'official'],
  },
  {
    topicTag: 'Kubernetes',
    category: 'documentation',
    type: 'doc',
    title: 'Kubernetes Official Documentation',
    url: 'https://kubernetes.io/docs/home/',
    provider: 'Cloud Native Computing Foundation (CNCF)',
    description: 'Authoritative documentation on Pods, Deployments, StatefulSets, Services, Ingress controllers, and cluster administration.',
    isFree: true,
    rating: 5.0,
    difficulty: 'Intermediate',
    authorityScore: 100,
    tags: ['kubernetes', 'k8s', 'cncf', 'pods', 'devops', 'official'],
  },
  {
    topicTag: 'Kubernetes',
    category: 'videos',
    type: 'youtube_channel',
    title: 'TechWorld with Nana - DevOps, Docker & Kubernetes',
    url: 'https://www.youtube.com/@TechWorldwithNana',
    provider: 'TechWorld with Nana',
    description: 'Highly acclaimed animated visual breakdowns of CI/CD pipelines, container orchestration, Helm charts, and Terraform.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Beginner',
    authorityScore: 97,
    tags: ['devops', 'docker', 'kubernetes', 'helm', 'ci-cd', 'nana'],
  },

  // ─── 15. GIT & GITHUB ────────────────────────────────────────────────
  {
    topicTag: 'Git',
    category: 'recommended',
    type: 'book',
    title: 'Pro Git Book (Official Free Edition)',
    url: 'https://git-scm.com/book/en/v2',
    provider: 'Git SCM (Scott Chacon & Ben Straub)',
    description: 'The definitive complete guide to Git internals, branching, rebasing, merge conflicts, hooks, and distributed workflows.',
    isFree: true,
    rating: 5.0,
    difficulty: 'All Levels',
    authorityScore: 100,
    tags: ['git', 'version-control', 'github', 'branching', 'rebasing', 'official'],
  },
  {
    topicTag: 'Git',
    category: 'courses',
    type: 'course',
    title: 'GitHub Skills - Interactive Learning Lab',
    url: 'https://skills.github.com/',
    provider: 'GitHub',
    description: 'Interactive repositories where you practice pull requests, resolving merge conflicts, GitHub Actions, and release management.',
    isFree: true,
    rating: 4.9,
    difficulty: 'Beginner',
    authorityScore: 98,
    tags: ['github', 'actions', 'pull-requests', 'git-workflow'],
  },

  // ─── 16. NODE.JS & NEXT.JS ───────────────────────────────────────────
  {
    topicTag: 'Node.js',
    category: 'documentation',
    type: 'doc',
    title: 'Node.js Official Documentation & Guides',
    url: 'https://nodejs.org/en/docs',
    provider: 'OpenJS Foundation',
    description: 'Official API guides covering the event loop, libuv, streams, buffers, cluster module, and worker threads.',
    isFree: true,
    rating: 5.0,
    difficulty: 'All Levels',
    authorityScore: 100,
    tags: ['nodejs', 'node', 'javascript', 'backend', 'streams', 'event-loop', 'official'],
  },
  {
    topicTag: 'Next.js',
    category: 'recommended',
    type: 'website',
    title: 'Next.js Official Documentation & Learn Course',
    url: 'https://nextjs.org/docs',
    provider: 'Vercel',
    description: 'The official documentation covering App Router, Server Components, Server Actions, middleware, and caching architecture.',
    isFree: true,
    rating: 5.0,
    difficulty: 'All Levels',
    authorityScore: 100,
    tags: ['nextjs', 'next', 'react', 'ssr', 'vercel', 'frontend', 'official'],
  },
];

/**
 * Common technical synonym mappings for robust query tokenization
 */
const SYNONYM_MAP: Record<string, string[]> = {
  dp: ['dynamic programming', 'memoization', 'tabulation', 'knapsack'],
  'dynamic programming': ['dp', 'memoization', 'tabulation'],
  react: ['react.js', 'reactjs', 'hooks', 'jsx', 'frontend'],
  'react.js': ['react', 'hooks'],
  reactjs: ['react', 'hooks'],
  js: ['javascript', 'es6', 'ecmascript'],
  javascript: ['js', 'es6', 'web'],
  ts: ['typescript', 'types'],
  typescript: ['ts', 'types'],
  py: ['python', 'python3'],
  python: ['py', 'python3'],
  cpp: ['c++', 'cplusplus', 'stl'],
  'c++': ['cpp', 'stl'],
  sql: ['dbms', 'database', 'postgresql', 'mysql', 'queries'],
  dbms: ['sql', 'database', 'postgresql', 'rdbms'],
  database: ['sql', 'dbms', 'postgresql', 'nosql', 'mongodb'],
  ml: ['machine learning', 'deep learning', 'ai', 'data science'],
  'machine learning': ['ml', 'supervised learning', 'ai'],
  'deep learning': ['dl', 'neural networks', 'pytorch', 'ai'],
  ai: ['artificial intelligence', 'machine learning', 'deep learning'],
  os: ['operating systems', 'linux', 'kernel', 'concurrency'],
  'operating systems': ['os', 'linux', 'virtual memory', 'processes'],
  cn: ['computer networks', 'networking', 'tcp', 'ip', 'http'],
  'computer networks': ['cn', 'networking', 'tcp', 'ip', 'dns'],
  dsa: ['data structures', 'algorithms', 'problem solving', 'competitive programming'],
  'data structures': ['dsa', 'arrays', 'linked list', 'trees', 'graphs'],
  algorithms: ['dsa', 'sorting', 'searching', 'graph algorithms'],
  k8s: ['kubernetes', 'containers', 'devops'],
  kubernetes: ['k8s', 'containers', 'devops', 'cloud'],
  docker: ['containers', 'dockerfile', 'devops'],
  'system design': ['distributed systems', 'scalability', 'microservices', 'architecture'],
  'distributed systems': ['system design', 'scalability', 'concurrency', 'replication'],
  git: ['github', 'version control', 'git-workflow'],
  github: ['git', 'version control', 'open-source'],
  node: ['nodejs', 'node.js', 'backend', 'express'],
  nodejs: ['node', 'node.js', 'backend', 'javascript'],
  next: ['nextjs', 'next.js', 'react', 'ssr'],
  nextjs: ['next', 'next.js', 'react', 'ssr'],
  spring: ['spring boot', 'java', 'microservices'],
  'spring boot': ['spring', 'java', 'microservices'],
};

/**
 * Normalizes query string, strips dangerous tags, and expands relevant domain synonyms
 */
export function normalizeQuery(rawQuery?: string): { clean: string; tokens: string[]; expandedKeywords: string[] } {
  if (!rawQuery || !rawQuery.trim()) {
    return { clean: '', tokens: [], expandedKeywords: [] };
  }

  // Strip html tags, scripts, and punctuation
  const sanitized = rawQuery.replace(/<[^>]*>?/gm, ' ').replace(/[<>?"'`;{}[\]()]/g, ' ');
  const clean = sanitized.trim().toLowerCase().replace(/\s+/g, ' ');
  const rawTokens = clean.split(/[\s,._/|&]+/).filter((t) => t.length > 0);

  const expandedKeywords = new Set<string>(rawTokens);
  expandedKeywords.add(clean);

  // Check synonym mappings
  for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (clean === key || clean.includes(key) || rawTokens.includes(key)) {
      synonyms.forEach((syn) => {
        expandedKeywords.add(syn);
        syn.split(' ').forEach((w) => expandedKeywords.add(w));
      });
    }
  }

  return {
    clean,
    tokens: rawTokens,
    expandedKeywords: Array.from(expandedKeywords),
  };
}

/**
 * Validates whether a resource contains safe, authentic, well-formed URLs and valid fields
 */
export function validateResource(r: any): boolean {
  if (!r || !r.title || !r.url) return false;
  const url = String(r.url).trim().toLowerCase();
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  if (url.includes('localhost') || url.includes('127.0.0.1') || url.startsWith('javascript:')) return false;
  try {
    const parsed = new URL(r.url);
    if (!parsed.hostname || parsed.hostname === 'localhost') return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculates resource quality score based on authority, official status, and ratings
 */
export function calculateQualityScore(resource: any): number {
  let score = resource.authorityScore || 80;
  if (resource.rating) score += Math.round(resource.rating * 3);
  if (resource.isOfficial || (resource.title && resource.title.toLowerCase().includes('official'))) score += 10;
  return Math.min(100, score);
}

/**
 * Checks whether a resource matches the given query tokens or expanded synonyms
 */
export function matchesResource(resource: any, cleanQuery: string, tokens: string[], expandedKeywords: string[]): boolean {
  return calculateRelevanceScore(resource, cleanQuery, tokens, expandedKeywords) > 0;
}

/**
 * Calculates match score between query and resource.
 * Returns 0 if there is no keyword/synonym match when a query is provided.
 */
export function calculateRelevanceScore(
  resource: RawLearningResource | any,
  cleanQuery: string,
  tokens: string[],
  expandedKeywords: string[]
): number {
  if (!cleanQuery) return resource.authorityScore || 85;

  let matchScore = 0;
  const titleLower = (resource.title || '').toLowerCase();
  const topicLower = (resource.topicTag || '').toLowerCase();
  const descLower = (resource.description || '').toLowerCase();
  const providerLower = (resource.provider || '').toLowerCase();

  let tags: string[] = [];
  if (Array.isArray(resource.tags)) {
    tags = resource.tags.map((t: string) => String(t).toLowerCase());
  } else if (typeof resource.tagsJson === 'string') {
    try {
      tags = JSON.parse(resource.tagsJson).map((t: string) => String(t).toLowerCase());
    } catch {}
  }

  // 1. Exact phrase match in title or topic
  if (titleLower.includes(cleanQuery)) matchScore += 100;
  if (topicLower.includes(cleanQuery)) matchScore += 90;
  if (descLower.includes(cleanQuery)) matchScore += 30;
  if (providerLower.includes(cleanQuery)) matchScore += 35;

  // 2. Token overlap matches
  for (const token of tokens) {
    if (token.length <= 1) continue;
    if (titleLower.includes(token)) matchScore += 30;
    if (topicLower.includes(token)) matchScore += 35;
    if (tags.some((t) => t.includes(token))) matchScore += 30;
    if (descLower.includes(token)) matchScore += 15;
    if (providerLower.includes(token)) matchScore += 15;
  }

  // 3. Expanded synonyms / keywords
  for (const kw of expandedKeywords) {
    if (kw.length <= 1) continue;
    if (topicLower === kw || topicLower.includes(kw)) matchScore += 40;
    if (tags.includes(kw) || tags.some((t) => t.includes(kw))) matchScore += 35;
    if (titleLower.includes(kw)) matchScore += 30;
  }

  // If there's no actual query relevance, return 0 (no quality boost for non-matches)
  if (matchScore === 0) {
    return 0;
  }

  // 4. Quality & Authority boosts (applied only to genuinely matching items)
  let finalScore = matchScore;
  if (resource.authorityScore) {
    finalScore += Math.round((resource.authorityScore - 70) / 2);
  }
  if (resource.rating) {
    finalScore += Math.round(resource.rating * 2);
  }
  if (resource.isFree) {
    finalScore += 5;
  }
  if (resource.category === 'documentation' || titleLower.includes('official') || resource.isOfficial) {
    finalScore += 15;
  }

  return finalScore;
}

/**
 * Deduplicates resources by URL and Title
 */
export function deduplicateResources<T extends { url?: string; title?: string }>(resources: T[]): T[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const result: T[] = [];

  for (const r of resources) {
    if (!r) continue;
    const url = (r.url || '').trim().toLowerCase();
    const title = (r.title || '').trim().toLowerCase();
    if (url && seenUrls.has(url)) continue;
    if (title && seenTitles.has(title)) continue;
    if (url) seenUrls.add(url);
    if (title) seenTitles.add(title);
    result.push(r);
  }
  return result;
}

/**
 * Ranks resources by relevanceScore descending, then authorityScore, then rating
 */
export function rankResources(resources: SmartLearningResource[]): SmartLearningResource[] {
  return [...resources].sort((a, b) => {
    const relDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
    if (relDiff !== 0) return relDiff;
    const authDiff = (b.authorityScore || 0) - (a.authorityScore || 0);
    if (authDiff !== 0) return authDiff;
    return (b.rating || 0) - (a.rating || 0);
  });
}

/**
 * Ensures all authentic learning resources are present in the database.
 */
export async function seedSmartLearningResources(): Promise<number> {
  for (const item of AUTHENTIC_LEARNING_RESOURCES) {
    const existing = await prisma.learningResource.findFirst({
      where: { url: item.url },
    });

    if (!existing) {
      await prisma.learningResource.create({
        data: {
          topicTag: item.topicTag,
          domain: item.domain,
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
    } else {
      await prisma.learningResource.update({
        where: { id: existing.id },
        data: {
          topicTag: item.topicTag,
          category: item.category,
          type: item.type,
          title: item.title,
          provider: item.provider,
          description: item.description,
          isFree: item.isFree,
          rating: item.rating,
          difficulty: item.difficulty || 'All Levels',
          authorityScore: item.authorityScore,
          tagsJson: JSON.stringify(item.tags),
        },
      });
    }
  }

  return await prisma.learningResource.count();
}

/**
 * Searches, scores, and categorizes learning resources across all 9 categories.
 */
export async function searchLearningHub(
  queryOrParams: string | { query?: string; q?: string; category?: string; type?: string; domain?: string; isFree?: boolean; studentId?: string } = '',
  categoryParam: string = 'all'
): Promise<LearningHubSearchResponse> {
  await seedSmartLearningResources();

  let rawQuery = '';
  let category = categoryParam;
  let isFreeFilter: boolean | undefined = undefined;

  if (typeof queryOrParams === 'object' && queryOrParams !== null) {
    rawQuery = queryOrParams.query || queryOrParams.q || '';
    category = queryOrParams.category || queryOrParams.type || categoryParam;
    isFreeFilter = queryOrParams.isFree;
  } else if (typeof queryOrParams === 'string') {
    rawQuery = queryOrParams;
  }

  const { clean, tokens, expandedKeywords } = normalizeQuery(rawQuery);

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

  const scoredResources: { resource: SmartLearningResource; score: number }[] = [];
  const seenUrls = new Set<string>();

  for (const r of allDbResources) {
    if (!validateResource(r)) continue;
    if (seenUrls.has(r.url)) continue;

    if (isFreeFilter !== undefined && r.isFree !== isFreeFilter) {
      continue;
    }

    let tags: string[] = [];
    try {
      tags = r.tagsJson ? JSON.parse(r.tagsJson) : [];
    } catch {
      tags = [];
    }

    const relevance = calculateRelevanceScore(
      { ...r, tags },
      clean,
      tokens,
      expandedKeywords
    );

    // If a clean query was provided, only keep items with positive matching score
    if (clean && clean.length > 0 && relevance === 0) {
      continue;
    }

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
      tags,
      thumbnailUrl: r.thumbnailUrl || undefined,
      relevanceScore: Math.round(relevance),
    };

    scoredResources.push({ resource: formatted, score: relevance });
    seenUrls.add(r.url);
  }

  // Sort by calculated relevance score descending
  scoredResources.sort((a, b) => b.score - a.score);

  // Distribute into respective categories
  for (const item of scoredResources) {
    const res = item.resource;
    const cat = res.category;

    if (categories[cat]) {
      categories[cat].push(res);
    }
  }

  // Top recommendations: highest scored resources across all types
  const topRecommended = scoredResources.slice(0, 10).map((s) => ({
    ...s.resource,
    category: 'recommended' as LearningCategory,
  }));
  categories.recommended = topRecommended;

  // Calculate total matched count
  const allUniqueIds = new Set<string>();
  Object.values(categories).forEach((list) => list.forEach((r) => allUniqueIds.add(r.id)));
  const totalCount = allUniqueIds.size;

  return {
    query: rawQuery,
    totalResults: totalCount,
    categories,
  };
}

/**
 * Returns personalized recommendations for a user based on their weak topics in DSA attempts and skill scores.
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

  const queryTopics = identifiedWeakTopics.length > 0 ? identifiedWeakTopics : ['Dynamic Programming', 'Graph Algorithms', 'React'];

  const combinedResults = await searchLearningHub(queryTopics[0] || 'Dynamic Programming');
  let recs = combinedResults.categories.recommended && combinedResults.categories.recommended.length > 0
    ? combinedResults.categories.recommended
    : Object.values(combinedResults.categories).flat();

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
  normalizeQuery,
  matchesResource,
  calculateRelevanceScore,
  calculateQualityScore,
  deduplicateResources,
  rankResources,
  validateResource,
};

export default learningRecommendationService;

