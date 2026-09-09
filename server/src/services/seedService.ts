import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedDefaultLearningResources } from './learningResourceService.js';
import { seedDSAQuestionsIfEmpty } from './questionSelectionService.js';
import { seedSmartLearningResources } from './learningRecommendationService.js';
import { practiceQuestionCatalog } from './practiceQuestionCatalog.js';

/**
 * Seeds core reference catalog tables (Domains, Skills, Courses, PracticeSets, Questions, Learning Resources).
 * Can be safely executed without deleting registered user accounts or their historical attempts if users exist.
 */
export async function seedCatalog(prisma: PrismaClient) {
  console.log('🌱 Seeding SkillBridge Core Reference Catalog...');

  // 1. Clean reference tables
  await prisma.learningResource.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.listeningPassage.deleteMany({});
  await prisma.practiceSet.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.courseProvider.deleteMany({});
  await prisma.domainSkillRequirement.deleteMany({});
  await prisma.skillBenchmark.deleteMany({});
  await prisma.domain.deleteMany({});
  await prisma.skill.deleteMany({});

  // 2. Seed Skills across all 5 domains
  const skillsData = [
    // Full-Stack Web
    { id: 'skill-react', name: 'React.js', category: 'technical', description: 'Component lifecycle, hooks, concurrent rendering, and state management' },
    { id: 'skill-ts', name: 'TypeScript', category: 'technical', description: 'Static typing, generics, interfaces, and strict compiler configs' },
    { id: 'skill-node', name: 'Node.js & Express', category: 'technical', description: 'Asynchronous event loop, REST APIs, and middleware pipelines' },
    { id: 'skill-sql', name: 'PostgreSQL & SQL', category: 'technical', description: 'Relational schemas, indexes, joins, and ACID transactions' },
    { id: 'skill-graphql', name: 'GraphQL & APIs', category: 'technical', description: 'Schema definition, queries, mutations, and Apollo client' },
    { id: 'skill-system-design', name: 'System Design & Architecture', category: 'core', description: 'Scalability, microservices, load balancing, caching, and rate limiting' },
    
    // AI & Data Science
    { id: 'skill-python', name: 'Python for Data Science', category: 'technical', description: 'NumPy, Pandas, vectorized operations, and data wrangling' },
    { id: 'skill-ml', name: 'Machine Learning Fundamentals', category: 'technical', description: 'Scikit-learn, regression, classification, clustering, evaluation metrics' },
    { id: 'skill-pytorch', name: 'Deep Learning & PyTorch', category: 'technical', description: 'Tensors, autograd, neural architectures, CNNs, Transformers' },
    { id: 'skill-nlp', name: 'NLP & LLMs', category: 'technical', description: 'Embeddings, prompt engineering, RAG, and fine-tuning' },
    { id: 'skill-statistics', name: 'Applied Statistics & Probability', category: 'core', description: 'Hypothesis testing, distributions, Bayes theorem, confidence intervals' },

    // Cloud & DevOps
    { id: 'skill-docker', name: 'Docker & Containerization', category: 'technical', description: 'Containerization, Dockerfile optimization, multi-stage builds' },
    { id: 'skill-k8s', name: 'Kubernetes Orchestration', category: 'technical', description: 'Pods, services, deployments, ingress, and configmaps' },
    { id: 'skill-aws', name: 'AWS Cloud Architecture', category: 'technical', description: 'EC2, S3, RDS, Lambda, IAM, and VPC networking' },
    { id: 'skill-cicd', name: 'CI/CD Pipelines & Automation', category: 'technical', description: 'GitHub Actions, automated test suites, artifact packaging, releases' },
    { id: 'skill-terraform', name: 'Terraform & IaC', category: 'technical', description: 'Infrastructure as Code, state management, and provider modules' },
    { id: 'skill-monitoring', name: 'Monitoring & Observability', category: 'technical', description: 'Prometheus, Grafana, distributed tracing, alerting, and SRE metrics' },

    // UI/UX Product Design
    { id: 'skill-figma', name: 'Figma & Interactive Prototyping', category: 'technical', description: 'Auto-layout, interactive components, design tokens, and prototyping' },
    { id: 'skill-design-systems', name: 'Design Systems & Tokens', category: 'technical', description: 'Component libraries, accessibility standards, and token architecture' },
    { id: 'skill-ux-research', name: 'User Research & Wireframing', category: 'technical', description: 'Usability testing, user journeys, personas, and low-fi wireframes' },
    { id: 'skill-visual-design', name: 'Visual Design & Typography', category: 'technical', description: 'Color harmony, typographic hierarchy, responsive layouts, micro-interactions' },
    { id: 'skill-usability-testing', name: 'Usability Testing & Heuristics', category: 'core', description: 'Nielsen Norman heuristics, cognitive walkthroughs, accessibility audits' },

    // Embedded / IoT
    { id: 'skill-embedded-c', name: 'Embedded C & C++', category: 'technical', description: 'Memory management, pointers, registers, and hardware abstraction' },
    { id: 'skill-mcu', name: 'Microcontrollers & Hardware Interfacing', category: 'technical', description: 'ARM Cortex, GPIO, interrupts, DMA, and bootloaders' },
    { id: 'skill-rtos', name: 'FreeRTOS & Concurrency', category: 'technical', description: 'Task scheduling, mutexes, semaphores, queues, and ISR handling' },
    { id: 'skill-iot-protocols', name: 'IoT Protocols (MQTT/BLE/CoAP)', category: 'technical', description: 'Sensor interfacing, MQTT brokers, BLE advertising, and low-power telemetry' },
    { id: 'skill-circuit-design', name: 'Circuit Design & Sensors', category: 'technical', description: 'I2C, SPI, UART, analog-digital conversion, and PCB schematics' },

    // Core & Soft Skills
    { id: 'skill-problem-solving', name: 'Problem Solving & DSA', category: 'core', description: 'Data structures, algorithm complexity, dynamic programming, graphs' },
    { id: 'skill-communication', name: 'Technical Communication', category: 'soft', description: 'Documentation, peer code reviews, stakeholder presentations, cross-functional collaboration' },
    { id: 'skill-agile', name: 'Agile & Team Collaboration', category: 'soft', description: 'Scrum workflows, sprint planning, Git branching, PR etiquette' },
  ];

  for (const s of skillsData) {
    await prisma.skill.create({ data: s });
  }

  // 3. Seed Domains with Market Salary Benchmarks
  const domainsData = [
    {
      id: 'domain-web',
      name: 'Full-Stack Web',
      slug: 'fullstack-web',
      description: 'Modern reactive web applications, scalable backend APIs, relational databases, and distributed system design.',
      avgSalaryINR: 1150000,
      icon: 'Code',
      requirements: [
        { skillId: 'skill-react', benchmarkScore: 85, displayOrder: 1 },
        { skillId: 'skill-ts', benchmarkScore: 80, displayOrder: 2 },
        { skillId: 'skill-node', benchmarkScore: 80, displayOrder: 3 },
        { skillId: 'skill-sql', benchmarkScore: 75, displayOrder: 4 },
        { skillId: 'skill-graphql', benchmarkScore: 70, displayOrder: 5 },
        { skillId: 'skill-system-design', benchmarkScore: 75, displayOrder: 6 },
        { skillId: 'skill-problem-solving', benchmarkScore: 80, displayOrder: 7 },
        { skillId: 'skill-communication', benchmarkScore: 75, displayOrder: 8 },
      ],
    },
    {
      id: 'domain-ai',
      name: 'AI/Data Science',
      slug: 'ai-data-science',
      description: 'Applied machine learning, deep learning, NLP, statistical inference, and large language model architectures.',
      avgSalaryINR: 1420000,
      icon: 'Brain',
      requirements: [
        { skillId: 'skill-python', benchmarkScore: 90, displayOrder: 1 },
        { skillId: 'skill-ml', benchmarkScore: 85, displayOrder: 2 },
        { skillId: 'skill-pytorch', benchmarkScore: 80, displayOrder: 3 },
        { skillId: 'skill-nlp', benchmarkScore: 75, displayOrder: 4 },
        { skillId: 'skill-statistics', benchmarkScore: 85, displayOrder: 5 },
        { skillId: 'skill-problem-solving', benchmarkScore: 80, displayOrder: 6 },
        { skillId: 'skill-communication', benchmarkScore: 75, displayOrder: 7 },
      ],
    },
    {
      id: 'domain-cloud',
      name: 'Cloud/DevOps',
      slug: 'cloud-devops',
      description: 'Container orchestration, infrastructure as code, continuous delivery pipelines, and resilient cloud architecture.',
      avgSalaryINR: 1280000,
      icon: 'Cloud',
      requirements: [
        { skillId: 'skill-docker', benchmarkScore: 85, displayOrder: 1 },
        { skillId: 'skill-k8s', benchmarkScore: 80, displayOrder: 2 },
        { skillId: 'skill-aws', benchmarkScore: 80, displayOrder: 3 },
        { skillId: 'skill-cicd', benchmarkScore: 75, displayOrder: 4 },
        { skillId: 'skill-terraform', benchmarkScore: 70, displayOrder: 5 },
        { skillId: 'skill-monitoring', benchmarkScore: 75, displayOrder: 6 },
        { skillId: 'skill-system-design', benchmarkScore: 80, displayOrder: 7 },
      ],
    },
    {
      id: 'domain-design',
      name: 'UI/UX Product Design',
      slug: 'ui-ux-design',
      description: 'User-centered design systems, responsive micro-interactions, Figma component architecture, and accessibility.',
      avgSalaryINR: 980000,
      icon: 'Palette',
      requirements: [
        { skillId: 'skill-figma', benchmarkScore: 90, displayOrder: 1 },
        { skillId: 'skill-design-systems', benchmarkScore: 85, displayOrder: 2 },
        { skillId: 'skill-ux-research', benchmarkScore: 80, displayOrder: 3 },
        { skillId: 'skill-visual-design', benchmarkScore: 85, displayOrder: 4 },
        { skillId: 'skill-usability-testing', benchmarkScore: 80, displayOrder: 5 },
        { skillId: 'skill-communication', benchmarkScore: 85, displayOrder: 6 },
      ],
    },
    {
      id: 'domain-iot',
      name: 'Embedded/IoT',
      slug: 'embedded-iot',
      description: 'Firmware development, ARM Cortex architecture, FreeRTOS concurrency, IoT telemetry, and low-power hardware.',
      avgSalaryINR: 1050000,
      icon: 'Cpu',
      requirements: [
        { skillId: 'skill-embedded-c', benchmarkScore: 90, displayOrder: 1 },
        { skillId: 'skill-mcu', benchmarkScore: 85, displayOrder: 2 },
        { skillId: 'skill-rtos', benchmarkScore: 80, displayOrder: 3 },
        { skillId: 'skill-iot-protocols', benchmarkScore: 75, displayOrder: 4 },
        { skillId: 'skill-circuit-design', benchmarkScore: 75, displayOrder: 5 },
        { skillId: 'skill-problem-solving', benchmarkScore: 80, displayOrder: 6 },
      ],
    },
  ];

  for (const d of domainsData) {
    const { requirements, ...domainData } = d;
    await prisma.domain.create({ data: domainData });

    for (const r of requirements) {
      await prisma.domainSkillRequirement.create({
        data: {
          domainId: d.id,
          skillId: r.skillId,
          benchmarkScore: r.benchmarkScore,
          displayOrder: r.displayOrder,
        },
      });

      await prisma.skillBenchmark.create({
        data: {
          domain: d.name,
          skillId: r.skillId,
          benchmarkScore: r.benchmarkScore,
          displayOrder: r.displayOrder,
        },
      });
    }
  }

  // 4. Seed Course Providers
  const providers = [
    { id: 'prov-nptel', name: 'NPTEL (IITs & IISc)', logoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100&auto=format&fit=crop&q=80', baseUrl: 'https://nptel.ac.in', isVerified: true },
    { id: 'prov-swayam', name: 'SWAYAM (Govt of India)', logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=100&auto=format&fit=crop&q=80', baseUrl: 'https://swayam.gov.in', isVerified: true },
    { id: 'prov-hcl', name: 'HCL TechBee & GUVI', logoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=80', baseUrl: 'https://www.hcltechbee.com', isVerified: true },
    { id: 'prov-coursera', name: 'Coursera Industry Certifications', logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=80', baseUrl: 'https://www.coursera.org', isVerified: true },
    { id: 'prov-upgrad', name: 'upGrad Enterprise Tech', logoUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=100&auto=format&fit=crop&q=80', baseUrl: 'https://www.upgrad.com', isVerified: true },
  ];

  for (const p of providers) {
    await prisma.courseProvider.create({ data: p });
  }

  // 5. Seed Partner Courses
  const coursesData = [
    {
      id: 'course-ts-mastery',
      providerId: 'prov-hcl',
      title: 'HCL GUVI: Enterprise TypeScript & Design Patterns',
      description: 'Master advanced TypeScript generics, type narrowing, conditional types, and architectural patterns.',
      skillsCoveredJson: JSON.stringify([{ skillId: 'skill-ts', pointsGain: 20 }, { skillId: 'skill-react', pointsGain: 10 }]),
      externalUrl: 'https://www.guvi.in/courses/web-development/typescript',
      duration: '4 Weeks (20 hrs)',
      level: 'Intermediate',
    },
    {
      id: 'course-nptel-dsa',
      providerId: 'prov-nptel',
      title: 'NPTEL: Data Structures & Algorithms by IIT Madras',
      description: 'Rigorous algorithmic thinking, dynamic programming, graph algorithms, and formal complexity analysis.',
      skillsCoveredJson: JSON.stringify([{ skillId: 'skill-problem-solving', pointsGain: 25 }, { skillId: 'skill-system-design', pointsGain: 15 }]),
      externalUrl: 'https://nptel.ac.in/courses/106/106/106106127/',
      duration: '8 Weeks (40 hrs)',
      level: 'Advanced',
    },
    {
      id: 'course-node-graphql',
      providerId: 'prov-coursera',
      title: 'IBM: Scalable Microservices with Node.js & GraphQL',
      description: 'Build high-throughput REST and GraphQL APIs with Node.js, Express, Apollo Server, and PostgreSQL database pooling.',
      skillsCoveredJson: JSON.stringify([{ skillId: 'skill-node', pointsGain: 20 }, { skillId: 'skill-sql', pointsGain: 10 }]),
      externalUrl: 'https://www.coursera.org/professional-certificates/ibm-backend-javascript-developer',
      duration: '5 Weeks (25 hrs)',
      level: 'Intermediate',
    },
    {
      id: 'course-swayam-ml',
      providerId: 'prov-swayam',
      title: 'SWAYAM: Applied Machine Learning & Statistical Inference',
      description: 'Government certified foundational ML program covering Scikit-learn, statistical evaluation, feature selection, and data modeling.',
      skillsCoveredJson: JSON.stringify([{ skillId: 'skill-ml', pointsGain: 20 }, { skillId: 'skill-python', pointsGain: 15 }, { skillId: 'skill-statistics', pointsGain: 15 }]),
      externalUrl: 'https://swayam.gov.in/explorer?category=Computer_Science',
      duration: '8 Weeks (30 hrs)',
      level: 'Intermediate',
    },
  ];

  for (const c of coursesData) {
    await prisma.course.create({ data: c });
  }

  // 6. Seed Practice Sets
  const setWeb1 = await prisma.practiceSet.create({
    data: {
      id: 'set-web-1',
      domainName: 'Full-Stack Web',
      type: 'domain',
      title: 'Practice Set 1: React 18, State & Component Architecture',
      description: 'Core React 18 concurrent features, hydration, state synchronization, and component hierarchy evaluation.',
      timeLimitMinutes: 25,
      passingScorePct: 60.0,
      difficulty: 'Beginner',
      displayOrder: 1,
    },
  });

  const setWeb2 = await prisma.practiceSet.create({
    data: {
      id: 'set-web-2',
      domainName: 'Full-Stack Web',
      type: 'domain',
      title: 'Practice Set 2: TypeScript, Node.js & Database Layer',
      description: 'Strict type safety, asynchronous event loop, REST/GraphQL schemas, and PostgreSQL index optimization.',
      timeLimitMinutes: 25,
      passingScorePct: 60.0,
      difficulty: 'Intermediate',
      displayOrder: 2,
    },
  });

  const setWeb3 = await prisma.practiceSet.create({
    data: {
      id: 'set-web-3',
      domainName: 'Full-Stack Web',
      type: 'domain',
      title: 'Practice Set 3: High-Scale Distributed Web Architecture',
      description: 'Enterprise caching strategies, microservices decoupling, rate limiting, and system resilience.',
      timeLimitMinutes: 25,
      passingScorePct: 65.0,
      difficulty: 'Advanced',
      displayOrder: 3,
    },
  });

  const setAi1 = await prisma.practiceSet.create({
    data: {
      id: 'set-ai-1',
      domainName: 'AI/Data Science',
      type: 'domain',
      title: 'Practice Set 1: Python Vectorization & Statistical Inference',
      description: 'NumPy/Pandas vectorized computation, probability distributions, hypothesis testing, and p-values.',
      timeLimitMinutes: 25,
      passingScorePct: 60.0,
      difficulty: 'Beginner',
      displayOrder: 1,
    },
  });

  const setAi2 = await prisma.practiceSet.create({
    data: {
      id: 'set-ai-2',
      domainName: 'AI/Data Science',
      type: 'domain',
      title: 'Practice Set 2: Machine Learning Models & Feature Engineering',
      description: 'Supervised/unsupervised algorithms, regularization techniques, hyperparameter tuning, and ROC-AUC metrics.',
      timeLimitMinutes: 25,
      passingScorePct: 60.0,
      difficulty: 'Intermediate',
      displayOrder: 2,
    },
  });

  const setAi3 = await prisma.practiceSet.create({
    data: {
      id: 'set-ai-3',
      domainName: 'AI/Data Science',
      type: 'domain',
      title: 'Practice Set 3: Deep Learning, PyTorch & LLM Architectures',
      description: 'Multi-head self-attention, backpropagation through time, embedding vector spaces, and RAG pipelines.',
      timeLimitMinutes: 25,
      passingScorePct: 65.0,
      difficulty: 'Advanced',
      displayOrder: 3,
    },
  });

  const setCloud1 = await prisma.practiceSet.create({
    data: {
      id: 'set-cloud-1',
      domainName: 'Cloud/DevOps',
      type: 'domain',
      title: 'Practice Set 1: Docker Containers & Multi-Stage Builds',
      description: 'Container isolation, Dockerfile layer caching, non-root user execution, and image minimization.',
      timeLimitMinutes: 25,
      passingScorePct: 60.0,
      difficulty: 'Beginner',
      displayOrder: 1,
    },
  });

  const setCloud2 = await prisma.practiceSet.create({
    data: {
      id: 'set-cloud-2',
      domainName: 'Cloud/DevOps',
      type: 'domain',
      title: 'Practice Set 2: Kubernetes Orchestration & Cluster Networking',
      description: 'Pods, Deployments, Services, ConfigMaps, Ingress controllers, and persistent storage claims.',
      timeLimitMinutes: 25,
      passingScorePct: 60.0,
      difficulty: 'Intermediate',
      displayOrder: 2,
    },
  });

  const setCloud3 = await prisma.practiceSet.create({
    data: {
      id: 'set-cloud-3',
      domainName: 'Cloud/DevOps',
      type: 'domain',
      title: 'Practice Set 3: CI/CD Pipelines, AWS Architecture & IaC',
      description: 'Automated deployment pipelines, AWS IAM zero-trust policies, and Terraform state management.',
      timeLimitMinutes: 25,
      passingScorePct: 65.0,
      difficulty: 'Advanced',
      displayOrder: 3,
    },
  });

  const setUi1 = await prisma.practiceSet.create({
    data: {
      id: 'set-ui-1',
      domainName: 'UI/UX Product Design',
      type: 'domain',
      title: 'Practice Set 1: Usability Heuristics & User Flow Research',
      description: 'Nielsen Norman 10 heuristics, cognitive load reduction, user persona journey mapping, and wireframing.',
      timeLimitMinutes: 25,
      passingScorePct: 60.0,
      difficulty: 'Beginner',
      displayOrder: 1,
    },
  });

  const setUi2 = await prisma.practiceSet.create({
    data: {
      id: 'set-ui-2',
      domainName: 'UI/UX Product Design',
      type: 'domain',
      title: 'Practice Set 2: Figma Interactive Prototyping & Layouts',
      description: 'Auto-layout constraints, interactive component states, variable tokens, and motion transitions.',
      timeLimitMinutes: 25,
      passingScorePct: 60.0,
      difficulty: 'Intermediate',
      displayOrder: 2,
    },
  });

  const setUi3 = await prisma.practiceSet.create({
    data: {
      id: 'set-ui-3',
      domainName: 'UI/UX Product Design',
      type: 'domain',
      title: 'Practice Set 3: Enterprise Design Systems & Accessibility (a11y)',
      description: 'WCAG 2.2 AA standards, color contrast compliance, semantic ARIA hierarchy, and multi-brand token systems.',
      timeLimitMinutes: 25,
      passingScorePct: 65.0,
      difficulty: 'Advanced',
      displayOrder: 3,
    },
  });

  const setIot1 = await prisma.practiceSet.create({
    data: {
      id: 'set-iot-1',
      domainName: 'Embedded/IoT',
      type: 'domain',
      title: 'Practice Set 1: Embedded C, Pointers & Volatile Memory',
      description: 'Hardware register mapping, bitwise manipulation, interrupt service routines, and memory alignment.',
      timeLimitMinutes: 25,
      passingScorePct: 60.0,
      difficulty: 'Beginner',
      displayOrder: 1,
    },
  });

  const setIot2 = await prisma.practiceSet.create({
    data: {
      id: 'set-iot-2',
      domainName: 'Embedded/IoT',
      type: 'domain',
      title: 'Practice Set 2: Microcontrollers, FreeRTOS & Concurrency',
      description: 'ARM Cortex architecture, DMA streaming, priority inversion mutexes, and FreeRTOS task scheduling.',
      timeLimitMinutes: 25,
      passingScorePct: 60.0,
      difficulty: 'Intermediate',
      displayOrder: 2,
    },
  });

  const setIot3 = await prisma.practiceSet.create({
    data: {
      id: 'set-iot-3',
      domainName: 'Embedded/IoT',
      type: 'domain',
      title: 'Practice Set 3: IoT Protocols (MQTT/BLE) & Circuit Design',
      description: 'Low-power sensor sleep cycles, MQTT QoS telemetry, I2C/SPI bus pull-up calculations, and RF power budget.',
      timeLimitMinutes: 25,
      passingScorePct: 65.0,
      difficulty: 'Advanced',
      displayOrder: 3,
    },
  });

  // Aptitude sets
  const setQuant1 = await prisma.practiceSet.create({
    data: {
      id: 'set-quant-1',
      domainName: 'Quantitative Aptitude',
      type: 'aptitude_quant',
      title: 'Practice Set 1: Arithmetic, Percentages & Profit-Loss',
      description: 'Percentages, simple & compound interest, profit-loss margins, and average calculations.',
      timeLimitMinutes: 25,
      passingScorePct: 60.0,
      difficulty: 'Beginner',
      displayOrder: 1,
    },
  });

  const setQuant2 = await prisma.practiceSet.create({
    data: {
      id: 'set-quant-2',
      domainName: 'Quantitative Aptitude',
      type: 'aptitude_quant',
      title: 'Practice Set 2: Ratios, Speed-Time-Distance & Work',
      description: 'Ratios and proportions, relative speed, time and work equations, and mixture-alligation problems.',
      timeLimitMinutes: 25,
      passingScorePct: 60.0,
      difficulty: 'Intermediate',
      displayOrder: 2,
    },
  });

  const setQuant3 = await prisma.practiceSet.create({
    data: {
      id: 'set-quant-3',
      domainName: 'Quantitative Aptitude',
      type: 'aptitude_quant',
      title: 'Practice Set 3: Probability, Permutations & Data Interpretation',
      description: 'Combinatorics, conditional probability, bar graphs, pie charts, and numerical logic analysis.',
      timeLimitMinutes: 25,
      passingScorePct: 65.0,
      difficulty: 'Advanced',
      displayOrder: 3,
    },
  });

  const setEnglishRead1 = await prisma.practiceSet.create({
    data: {
      id: 'set-eng-read-1',
      domainName: 'English Reading',
      type: 'aptitude_english_reading',
      title: 'Practice Set 1: Technical Innovation & Core Comprehension',
      description: 'Reading comprehension passages with inference-based questions, vocabulary in context, and tone analysis.',
      timeLimitMinutes: 25,
      passingScorePct: 60.0,
      difficulty: 'Intermediate',
      displayOrder: 1,
    },
  });

  const setEnglishRead2 = await prisma.practiceSet.create({
    data: {
      id: 'set-eng-read-2',
      domainName: 'English Reading',
      type: 'aptitude_english_reading',
      title: 'Practice Set 2: Enterprise Systems & Sentence Correction',
      description: 'Advanced comprehension passage, grammar rules, subject-verb agreement, and error identification.',
      timeLimitMinutes: 25,
      passingScorePct: 60.0,
      difficulty: 'Intermediate',
      displayOrder: 2,
    },
  });

  // Listening Passages
  const passage1 = await prisma.listeningPassage.create({
    data: {
      id: 'passage-voice-1',
      title: 'Architectural Transition: Monolith to Event-Driven Microservices',
      audioText: 'Good morning engineering cohort. Today we analyze why large scale platforms migrate from monolithic architectures to event-driven microservices. While a monolith offers simple initial deployments, as transaction volume surges past ten million daily active requests, database lock contention and unified release cycles become severe bottlenecks. By decomposing core services into independent domain boundaries connected via asynchronous message queues, teams achieve decoupled failure domains and horizontal scaling. However, engineers must rigorously handle eventual consistency and distributed tracing.',
      transcript: 'Good morning engineering cohort. Today we analyze why large scale platforms migrate from monolithic architectures to event-driven microservices. While a monolith offers simple initial deployments, as transaction volume surges past ten million daily active requests, database lock contention and unified release cycles become severe bottlenecks. By decomposing core services into independent domain boundaries connected via asynchronous message queues, teams achieve decoupled failure domains and horizontal scaling. However, engineers must rigorously handle eventual consistency and distributed tracing.',
      durationSeconds: 45,
    },
  });

  const passage2 = await prisma.listeningPassage.create({
    data: {
      id: 'passage-voice-2',
      title: 'AI Safety, Alignment & Retrieval-Augmented Generation',
      audioText: 'In our keynote today on applied artificial intelligence, we examine Retrieval-Augmented Generation, commonly known as RAG. Traditional Large Language Models are prone to factual hallucinations when queried on private enterprise data. RAG overcomes this by converting authoritative company documents into high-dimensional vector embeddings stored in a vector database. When a prompt arrives, semantic cosine similarity retrieves the top relevant context passages and injects them into the model context window, ensuring grounded, verifiable answers with source citations.',
      transcript: 'In our keynote today on applied artificial intelligence, we examine Retrieval-Augmented Generation, commonly known as RAG. Traditional Large Language Models are prone to factual hallucinations when queried on private enterprise data. RAG overcomes this by converting authoritative company documents into high-dimensional vector embeddings stored in a vector database. When a prompt arrives, semantic cosine similarity retrieves the top relevant context passages and injects them into the model context window, ensuring grounded, verifiable answers with source citations.',
      durationSeconds: 50,
    },
  });

  const passage3 = await prisma.listeningPassage.create({
    data: {
      id: 'passage-voice-3',
      title: 'High-Performance Edge Computing & Distributed Database Sharding',
      audioText: 'In our discussion on distributed infrastructure, we explore why real-time IoT systems deploy edge computation nodes near industrial sensors. By pre-processing telemetry data at local edge gateways, networks save over eighty percent of backbone bandwidth and achieve sub-ten-millisecond latency. Furthermore, when writing to central databases, hash-based horizontal sharding prevents single-node IO bottlenecks by distributing partition keys evenly across physical clusters.',
      transcript: 'In our discussion on distributed infrastructure, we explore why real-time IoT systems deploy edge computation nodes near industrial sensors. By pre-processing telemetry data at local edge gateways, networks save over eighty percent of backbone bandwidth and achieve sub-ten-millisecond latency. Furthermore, when writing to central databases, hash-based horizontal sharding prevents single-node IO bottlenecks by distributing partition keys evenly across physical clusters.',
      durationSeconds: 48,
    },
  });

  const setEnglishListen1 = await prisma.practiceSet.create({
    data: {
      id: 'set-eng-listen-1',
      domainName: 'English Listening',
      type: 'aptitude_english_listening',
      title: 'Practice Set 1: System Architecture Audio Comprehension (2 Plays Max)',
      description: 'Listen carefully to the engineering lecture audio clip. You have strictly 2 plays allowed to answer all attached comprehension questions.',
      timeLimitMinutes: 25,
      passingScorePct: 60.0,
      difficulty: 'Intermediate',
      displayOrder: 1,
    },
  });

  const setEnglishListen2 = await prisma.practiceSet.create({
    data: {
      id: 'set-eng-listen-2',
      domainName: 'English Listening',
      type: 'aptitude_english_listening',
      title: 'Practice Set 2: AI Safety & RAG Keynote Comprehension (2 Plays Max)',
      description: 'Listen carefully to the AI keynote audio clip. You have strictly 2 plays allowed to answer all attached comprehension questions.',
      timeLimitMinutes: 25,
      passingScorePct: 60.0,
      difficulty: 'Intermediate',
      displayOrder: 2,
    },
  });

  // 7. Seed Questions (390 authentic questions across all 18 domain/aptitude sets + reading & listening)
  await prisma.question.createMany({ data: practiceQuestionCatalog });

  // 8. Seed Curated Learning Resources Catalog & DSA Questions
  await seedDefaultLearningResources();
  await seedSmartLearningResources();
  await seedDSAQuestionsIfEmpty();

  console.log('✅ Catalog tables seeded successfully.');
}

/**
 * Seeds Indian Universities and Colleges dataset for autocomplete type-ahead.
 * ISOLATED & PURELY ADDITIVE: Uses upsert and never deletes existing user or attempt records.
 */
export async function seedInstitutions(prisma: PrismaClient) {
  console.log('🌱 [SkillBridge Seed] Seeding Indian Universities & Colleges Autocomplete Dataset...');
  const institutions = [
    // IITs
    { name: 'Indian Institute of Technology, Bombay (IIT Bombay)', code: 'IITB', state: 'Maharashtra', type: 'IIT' },
    { name: 'Indian Institute of Technology, Delhi (IIT Delhi)', code: 'IITD', state: 'Delhi', type: 'IIT' },
    { name: 'Indian Institute of Technology, Madras (IIT Madras)', code: 'IITM', state: 'Tamil Nadu', type: 'IIT' },
    { name: 'Indian Institute of Technology, Kanpur (IIT Kanpur)', code: 'IITK', state: 'Uttar Pradesh', type: 'IIT' },
    { name: 'Indian Institute of Technology, Kharagpur (IIT Kharagpur)', code: 'IITKGP', state: 'West Bengal', type: 'IIT' },
    { name: 'Indian Institute of Technology, Roorkee (IIT Roorkee)', code: 'IITR', state: 'Uttarakhand', type: 'IIT' },
    { name: 'Indian Institute of Technology, Guwahati (IIT Guwahati)', code: 'IITG', state: 'Assam', type: 'IIT' },
    { name: 'Indian Institute of Technology, Hyderabad (IIT Hyderabad)', code: 'IITH', state: 'Telangana', type: 'IIT' },
    { name: 'Indian Institute of Technology, BHU Varanasi (IIT BHU)', code: 'IITBHU', state: 'Uttar Pradesh', type: 'IIT' },
    { name: 'Indian Institute of Technology, Indore (IIT Indore)', code: 'IITI', state: 'Madhya Pradesh', type: 'IIT' },
    { name: 'Indian Institute of Technology, Gandhinagar (IIT Gandhinagar)', code: 'IITGN', state: 'Gujarat', type: 'IIT' },
    { name: 'Indian Institute of Technology, Ropar (IIT Ropar)', code: 'IITRPR', state: 'Punjab', type: 'IIT' },
    { name: 'Indian Institute of Technology, Patna (IIT Patna)', code: 'IITP', state: 'Bihar', type: 'IIT' },
    { name: 'Indian Institute of Technology, Bhubaneswar (IIT Bhubaneswar)', code: 'IITBBS', state: 'Odisha', type: 'IIT' },
    { name: 'Indian Institute of Technology, Jodhpur (IIT Jodhpur)', code: 'IITJ', state: 'Rajasthan', type: 'IIT' },
    { name: 'Indian Institute of Technology, Mandi (IIT Mandi)', code: 'IITMND', state: 'Himachal Pradesh', type: 'IIT' },
    { name: 'Indian Institute of Technology, Palakkad (IIT Palakkad)', code: 'IITPKD', state: 'Kerala', type: 'IIT' },
    { name: 'Indian Institute of Technology, Tirupati (IIT Tirupati)', code: 'IITTPT', state: 'Andhra Pradesh', type: 'IIT' },
    { name: 'Indian Institute of Technology, ISMB Dhanbad (IIT ISM)', code: 'IITISM', state: 'Jharkhand', type: 'IIT' },
    { name: 'Indian Institute of Technology, Bhilai (IIT Bhilai)', code: 'IITBH', state: 'Chhattisgarh', type: 'IIT' },
    { name: 'Indian Institute of Technology, Goa (IIT Goa)', code: 'IITGOA', state: 'Goa', type: 'IIT' },
    { name: 'Indian Institute of Technology, Jammu (IIT Jammu)', code: 'IITJMU', state: 'Jammu & Kashmir', type: 'IIT' },
    { name: 'Indian Institute of Technology, Dharwad (IIT Dharwad)', code: 'IITDWD', state: 'Karnataka', type: 'IIT' },

    // NITs & IIITs
    { name: 'National Institute of Technology, Trichy (NIT Trichy)', code: 'NITT', state: 'Tamil Nadu', type: 'NIT' },
    { name: 'National Institute of Technology, Surathkal (NITK Surathkal)', code: 'NITK', state: 'Karnataka', type: 'NIT' },
    { name: 'National Institute of Technology, Warangal (NIT Warangal)', code: 'NITW', state: 'Telangana', type: 'NIT' },
    { name: 'National Institute of Technology, Calicut (NIT Calicut)', code: 'NITC', state: 'Kerala', type: 'NIT' },
    { name: 'National Institute of Technology, Rourkela (NIT Rourkela)', code: 'NITRKL', state: 'Odisha', type: 'NIT' },
    { name: 'National Institute of Technology, Kurukshetra (NIT Kurukshetra)', code: 'NITKKR', state: 'Haryana', type: 'NIT' },
    { name: 'National Institute of Technology, Durgapur (NIT Durgapur)', code: 'NITDGP', state: 'West Bengal', type: 'NIT' },
    { name: 'National Institute of Technology, Silchar (NIT Silchar)', code: 'NITS', state: 'Assam', type: 'NIT' },
    { name: 'National Institute of Technology, Jaipur (MNIT Jaipur)', code: 'MNITJ', state: 'Rajasthan', type: 'NIT' },
    { name: 'National Institute of Technology, Allahabad (MNNIT Allahabad)', code: 'MNNITA', state: 'Uttar Pradesh', type: 'NIT' },
    { name: 'National Institute of Technology, Nagpur (VNIT Nagpur)', code: 'VNITN', state: 'Maharashtra', type: 'NIT' },
    { name: 'National Institute of Technology, Surat (SVNIT Surat)', code: 'SVNITS', state: 'Gujarat', type: 'NIT' },
    { name: 'National Institute of Technology, Jalandhar (NIT Jalandhar)', code: 'NITJ', state: 'Punjab', type: 'NIT' },
    { name: 'National Institute of Technology, Hamirpur (NIT Hamirpur)', code: 'NITH', state: 'Himachal Pradesh', type: 'NIT' },
    { name: 'National Institute of Technology, Bhopal (MANIT Bhopal)', code: 'MANITB', state: 'Madhya Pradesh', type: 'NIT' },
    { name: 'National Institute of Technology, Patna (NIT Patna)', code: 'NITP', state: 'Bihar', type: 'NIT' },
    { name: 'National Institute of Technology, Raipur (NIT Raipur)', code: 'NITR', state: 'Chhattisgarh', type: 'NIT' },
    { name: 'National Institute of Technology, Srinagar (NIT Srinagar)', code: 'NITSGR', state: 'Jammu & Kashmir', type: 'NIT' },
    { name: 'National Institute of Technology, Agartala (NIT Agartala)', code: 'NITA', state: 'Tripura', type: 'NIT' },
    { name: 'National Institute of Technology, Meghalaya (NIT Meghalaya)', code: 'NITM', state: 'Meghalaya', type: 'NIT' },
    { name: 'National Institute of Technology, Puducherry (NIT PY)', code: 'NITPY', state: 'Puducherry', type: 'NIT' },
    { name: 'National Institute of Technology, Goa (NIT Goa)', code: 'NITG', state: 'Goa', type: 'NIT' },
    { name: 'National Institute of Technology, Delhi (NIT Delhi)', code: 'NITD', state: 'Delhi', type: 'NIT' },
    { name: 'International Institute of Information Technology, Hyderabad (IIIT Hyderabad)', code: 'IIITH', state: 'Telangana', type: 'IIIT' },
    { name: 'International Institute of Information Technology, Bangalore (IIIT Bangalore)', code: 'IIITB', state: 'Karnataka', type: 'IIIT' },
    { name: 'Indraprastha Institute of Information Technology, Delhi (IIIT Delhi)', code: 'IIITD', state: 'Delhi', type: 'IIIT' },
    { name: 'Indian Institute of Information Technology, Allahabad (IIIT Allahabad)', code: 'IIITA', state: 'Uttar Pradesh', type: 'IIIT' },
    { name: 'ABV-Indian Institute of Information Technology & Management, Gwalior (IIITM Gwalior)', code: 'IIITMG', state: 'Madhya Pradesh', type: 'IIIT' },

    // Premier Institutions & Universities (Delhi, North India)
    { name: 'Delhi Technological University (DTU)', code: 'DTU', state: 'Delhi', type: 'STATE' },
    { name: 'Netaji Subhas University of Technology (NSUT)', code: 'NSUT', state: 'Delhi', type: 'STATE' },
    { name: 'University of Delhi (DU)', code: 'DU', state: 'Delhi', type: 'CENTRAL' },
    { name: 'Jamia Millia Islamia (JMI)', code: 'JMI', state: 'Delhi', type: 'CENTRAL' },
    { name: 'Jawaharlal Nehru University (JNU)', code: 'JNU', state: 'Delhi', type: 'CENTRAL' },
    { name: 'Guru Gobind Singh Indraprastha University (GGSIPU / IPU)', code: 'GGSIPU', state: 'Delhi', type: 'STATE' },
    { name: 'Indira Gandhi Delhi Technical University for Women (IGDTUW)', code: 'IGDTUW', state: 'Delhi', type: 'STATE' },
    { name: 'BITS Pilani (Birla Institute of Technology and Science)', code: 'BITS', state: 'Rajasthan', type: 'DEEMED' },
    { name: 'BITS Pilani - Goa Campus', code: 'BITS-GOA', state: 'Goa', type: 'DEEMED' },
    { name: 'BITS Pilani - Hyderabad Campus', code: 'BITS-HYD', state: 'Telangana', type: 'DEEMED' },
    { name: 'Thapar Institute of Engineering and Technology (TIET Patiala)', code: 'TIET', state: 'Punjab', type: 'DEEMED' },
    { name: 'Panjab University (PU Chandigarh)', code: 'PU', state: 'Chandigarh', type: 'STATE' },
    { name: 'Chandigarh University (CU)', code: 'CU', state: 'Punjab', type: 'PRIVATE' },
    { name: 'Lovely Professional University (LPU)', code: 'LPU', state: 'Punjab', type: 'PRIVATE' },

    // South India Universities & Colleges
    { name: 'Anna University, Chennai', code: 'ANNA', state: 'Tamil Nadu', type: 'STATE' },
    { name: 'College of Engineering, Guindy (CEG Anna University)', code: 'CEG', state: 'Tamil Nadu', type: 'STATE' },
    { name: 'VIT University, Vellore (Vellore Institute of Technology)', code: 'VIT', state: 'Tamil Nadu', type: 'DEEMED' },
    { name: 'VIT Chennai', code: 'VITC', state: 'Tamil Nadu', type: 'DEEMED' },
    { name: 'SRM Institute of Science and Technology, Kattankulathur', code: 'SRM', state: 'Tamil Nadu', type: 'DEEMED' },
    { name: 'Amrita Vishwa Vidyapeetham, Coimbatore', code: 'AMRITA', state: 'Tamil Nadu', type: 'DEEMED' },
    { name: 'PSG College of Technology, Coimbatore', code: 'PSG', state: 'Tamil Nadu', type: 'PRIVATE' },
    { name: 'SASTRA Deemed University, Thanjavur', code: 'SASTRA', state: 'Tamil Nadu', type: 'DEEMED' },
    { name: 'SSN College of Engineering, Chennai', code: 'SSN', state: 'Tamil Nadu', type: 'PRIVATE' },
    { name: 'Visvesvaraya Technological University (VTU Belagavi)', code: 'VTU', state: 'Karnataka', type: 'STATE' },
    { name: 'B.M.S. College of Engineering (BMSCE Bangalore)', code: 'BMSCE', state: 'Karnataka', type: 'PRIVATE' },
    { name: 'R.V. College of Engineering (RVCE Bangalore)', code: 'RVCE', state: 'Karnataka', type: 'PRIVATE' },
    { name: 'Ramaiah Institute of Technology (MSRIT Bangalore)', code: 'MSRIT', state: 'Karnataka', type: 'PRIVATE' },
    { name: 'PES University, Bangalore', code: 'PESU', state: 'Karnataka', type: 'PRIVATE' },
    { name: 'Manipal Academy of Higher Education (MAHE / MIT Manipal)', code: 'MAHE', state: 'Karnataka', type: 'DEEMED' },
    { name: 'Christ University, Bangalore', code: 'CHRIST', state: 'Karnataka', type: 'DEEMED' },
    { name: 'JNTU Hyderabad (Jawaharlal Nehru Technological University)', code: 'JNTUH', state: 'Telangana', type: 'STATE' },
    { name: 'JNTU Kakinada', code: 'JNTUK', state: 'Andhra Pradesh', type: 'STATE' },
    { name: 'CBIT Hyderabad (Chaitanya Bharathi Institute of Technology)', code: 'CBIT', state: 'Telangana', type: 'PRIVATE' },
    { name: 'VNR Vignana Jyothi Institute of Engineering and Technology', code: 'VNRVJIET', state: 'Telangana', type: 'PRIVATE' },
    { name: 'APJ Abdul Kalam Technological University (KTU Kerala)', code: 'KTU', state: 'Kerala', type: 'STATE' },
    { name: 'College of Engineering Trivandrum (CET)', code: 'CET', state: 'Kerala', type: 'STATE' },
    { name: 'Model Engineering College, Thrikkakara (MEC Kochi)', code: 'MEC', state: 'Kerala', type: 'STATE' },

    // West India Universities & Colleges
    { name: 'University of Mumbai', code: 'MU', state: 'Maharashtra', type: 'STATE' },
    { name: 'Savitribai Phule Pune University (SPPU / Pune University)', code: 'SPPU', state: 'Maharashtra', type: 'STATE' },
    { name: 'College of Engineering Pune (COEP Technological University)', code: 'COEP', state: 'Maharashtra', type: 'STATE' },
    { name: 'Veermata Jijabai Technological Institute (VJTI Mumbai)', code: 'VJTI', state: 'Maharashtra', type: 'STATE' },
    { name: 'Sardar Patel Institute of Technology (SPIT Mumbai)', code: 'SPIT', state: 'Maharashtra', type: 'PRIVATE' },
    { name: 'K.J. Somaiya College of Engineering, Mumbai', code: 'KJSCE', state: 'Maharashtra', type: 'PRIVATE' },
    { name: 'Vishwakarma Institute of Technology (VIT Pune)', code: 'VITP', state: 'Maharashtra', type: 'PRIVATE' },
    { name: 'NMIMS University, Mumbai (MPSTME)', code: 'NMIMS', state: 'Maharashtra', type: 'DEEMED' },
    { name: 'Symbiosis International University, Pune (SIT)', code: 'SIU', state: 'Maharashtra', type: 'DEEMED' },
    { name: 'Gujarat Technological University (GTU Ahmedabad)', code: 'GTU', state: 'Gujarat', type: 'STATE' },
    { name: 'Dhirubhai Ambani Institute of Information and Communication Technology (DA-IICT Gandhinagar)', code: 'DAIICT', state: 'Gujarat', type: 'PRIVATE' },
    { name: 'Nirma University, Ahmedabad', code: 'NIRMA', state: 'Gujarat', type: 'PRIVATE' },

    // East & Central India Universities & Colleges
    { name: 'Jadavpur University, Kolkata', code: 'JU', state: 'West Bengal', type: 'STATE' },
    { name: 'University of Calcutta', code: 'CU-KOL', state: 'West Bengal', type: 'STATE' },
    { name: 'Maulana Abul Kalam Azad University of Technology (MAKAUT WB)', code: 'MAKAUT', state: 'West Bengal', type: 'STATE' },
    { name: 'Indian Institute of Engineering Science and Technology, Shibpur (IIEST Shibpur)', code: 'IIEST', state: 'West Bengal', type: 'CENTRAL' },
    { name: 'Heritage Institute of Technology, Kolkata', code: 'HITK', state: 'West Bengal', type: 'PRIVATE' },
    { name: 'IEM Kolkata (Institute of Engineering & Management)', code: 'IEM', state: 'West Bengal', type: 'PRIVATE' },
    { name: 'KIIT Deemed to be University, Bhubaneswar', code: 'KIIT', state: 'Odisha', type: 'DEEMED' },
    { name: 'Siksha O Anusandhan (SOA University), Bhubaneswar', code: 'SOA', state: 'Odisha', type: 'DEEMED' },
    { name: 'VSSUT Burla (Veer Surendra Sai University of Technology)', code: 'VSSUT', state: 'Odisha', type: 'STATE' },
    { name: 'Birla Institute of Technology, Mesra (BIT Mesra Ranchi)', code: 'BITM', state: 'Jharkhand', type: 'DEEMED' },
    { name: 'Banaras Hindu University (BHU), Varanasi', code: 'BHU', state: 'Uttar Pradesh', type: 'CENTRAL' },
    { name: 'Aligarh Muslim University (AMU)', code: 'AMU', state: 'Uttar Pradesh', type: 'CENTRAL' },
    { name: 'Dr. A.P.J. Abdul Kalam Technical University (AKTU Lucknow)', code: 'AKTU', state: 'Uttar Pradesh', type: 'STATE' },
    { name: 'Harcourt Butler Technical University (HBTU Kanpur)', code: 'HBTU', state: 'Uttar Pradesh', type: 'STATE' },
    { name: 'Madan Mohan Malaviya University of Technology (MMMUT Gorakhpur)', code: 'MMMUT', state: 'Uttar Pradesh', type: 'STATE' },
    { name: 'Amity University, Noida', code: 'AMITY', state: 'Uttar Pradesh', type: 'PRIVATE' },
    { name: 'Shiv Nadar University, Greater Noida', code: 'SNU', state: 'Uttar Pradesh', type: 'PRIVATE' },
    { name: 'Bennett University, Greater Noida', code: 'BENNETT', state: 'Uttar Pradesh', type: 'PRIVATE' },
  ];

  let count = 0;
  for (const inst of institutions) {
    await prisma.institution.upsert({
      where: { name: inst.name },
      update: {
        code: inst.code,
        state: inst.state,
        type: inst.type,
      },
      create: {
        name: inst.name,
        code: inst.code,
        state: inst.state,
        type: inst.type,
      },
    });
    count++;
  }
  console.log(`✅ [SkillBridge Seed] Seeded ${count} Indian universities and colleges successfully.`);
}


/**
 * Seeds demo accounts, student profiles, past attempts, and sample applications.
 * Only intended to be run when populating demo environments or on empty databases.
 */
export async function seedDemoUsers(prisma: PrismaClient) {
  console.log('🌱 Seeding Demo Users and Profile Scaffolding...');

  // Clean user and attempt records
  await prisma.inAppNotification.deleteMany({});
  await prisma.portfolioMessage.deleteMany({});
  await prisma.portfolioWebsite.deleteMany({});
  await prisma.assessmentAttempt.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.resume.deleteMany({});
  await prisma.internship.deleteMany({});
  await prisma.studentSkillScore.deleteMany({});
  await prisma.studentDomain.deleteMany({});
  await prisma.externalIntegration.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.industryProfile.deleteMany({});
  await prisma.academicianProfile.deleteMany({});
  await prisma.institutionProfile.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // Student 1: Satyam Singh
  const userDemo = await prisma.user.create({
    data: {
      email: 'demo@skillbridge.app',
      phone: '+91 98765 00000',
      passwordHash,
      name: 'Satyam Singh',
      role: 'STUDENT',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      currentStreak: 7,
      longestStreak: 14,
      lastActiveDate: new Date().toISOString().split('T')[0],
      studentProfile: {
        create: {
          institution: 'Delhi Technological University',
          targetDomain: 'Full-Stack Web',
          cgpa: 8.9,
          bio: 'Passionate Computer Science engineering undergraduate at Delhi Technological University with strong foundational expertise in Full-Stack web architecture, distributed systems, and applied machine learning.',
          gradYear: 2027,
          githubUsername: 'satyamsingh',
          linkedinUrl: 'https://linkedin.com/in/satyamsingh',
          headline: 'Full-Stack Software Engineer & ML Systems Specialist',
          location: 'New Delhi, India',
          resumeFileName: 'Satyam Singh-resume.pdf',
          experiencesJson: JSON.stringify([
            {
              id: 'exp-1',
              title: 'Full-Stack Engineering Intern',
              company: 'TechCorp India',
              duration: 'May 2025 - Jul 2025 (3 mos)',
              location: 'Bengaluru, Karnataka (Hybrid)',
              description: 'Architected high-throughput REST APIs and real-time dashboard microservices. Optimized PostgreSQL database queries by 35%.',
              skills: ['React.js', 'Node.js', 'PostgreSQL', 'Docker', 'Redis'],
            },
          ]),
          educationsJson: JSON.stringify([
            {
              id: 'edu-1',
              degree: 'B.Tech in Computer Science and Engineering',
              institution: 'Delhi Technological University',
              duration: '2023 - 2027',
              score: '8.9 / 10.0 CGPA',
              skills: ['Data Structures & Algorithms', 'Operating Systems', 'Database Management', 'Computer Networks'],
            },
          ]),
          projectsJson: JSON.stringify([
            {
              id: 'proj-1',
              title: 'SkillBridge — Academia-Industry Collaboration Platform',
              description: 'Enterprise full-stack collaboration platform featuring an authoritative vector matching engine, ATS resume generation, and verified skill calibration.',
              techStack: ['React', 'TypeScript', 'Node.js', 'Prisma', 'TailwindCSS', 'Vitest'],
              demoUrl: 'https://skillbridge.dev',
              githubUrl: 'https://github.com/satyamsingh/skillbridge',
            },
            {
              id: 'proj-2',
              title: 'HyperCache — Distributed In-Memory Key-Value Store',
              description: 'Engineered an in-memory caching engine in C++ with LRU eviction policies, async replication, and thread-safe concurrent read/write locks.',
              techStack: ['C++', 'Concurrency', 'Sockets', 'Benchmarking'],
              githubUrl: 'https://github.com/satyamsingh/hypercache',
            },
          ]),
          certificatesJson: JSON.stringify([
            {
              id: 'cert-1',
              title: 'HCL GUVI: Enterprise TypeScript & Design Patterns',
              issuer: 'HCL TechBee & GUVI',
              issueDate: 'Jun 2025',
              credentialUrl: 'https://www.guvi.in/certificate?id=GUVI-TS-89421',
            },
          ]),
          socialsJson: JSON.stringify({
            github: 'https://github.com/satyamsingh',
            linkedin: 'https://linkedin.com/in/satyamsingh',
            email: 'satyam.singh@dtu.ac.in',
            website: 'https://skillbridge.app/p/satyam-singh',
          }),
        },
      },
    },
    include: { studentProfile: true },
  });

  // Student 2: Rahul Verma
  const userStudent1 = await prisma.user.create({
    data: {
      email: 'rahul.verma@vit.edu',
      passwordHash: await bcrypt.hash('Student@123456', 10),
      name: 'Rahul Verma',
      role: 'STUDENT',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
      currentStreak: 4,
      longestStreak: 9,
      lastActiveDate: new Date().toISOString().split('T')[0],
      studentProfile: {
        create: {
          institution: 'Vellore Institute of Technology (VIT)',
          targetDomain: 'Full-Stack Web',
          cgpa: 8.7,
          bio: 'Frontend developer and TypeScript enthusiast building accessible web applications.',
          gradYear: 2026,
          githubUsername: 'rahul-verma-dev',
          linkedinUrl: 'https://linkedin.com/in/rahulverma-vit',
          headline: 'Full-Stack Web Developer & UI Designer',
          location: 'Vellore, Tamil Nadu',
          socialsJson: JSON.stringify({
            github: 'https://github.com/rahul-verma-dev',
            linkedin: 'https://linkedin.com/in/rahulverma-vit',
            email: 'rahul.verma@vit.edu',
          }),
        },
      },
    },
    include: { studentProfile: true },
  });

  // Recruiter
  const userIndustry = await prisma.user.create({
    data: {
      email: 'recruiter@techcorp.com',
      passwordHash: await bcrypt.hash('Company@123456', 10),
      name: 'Priya Sundaram',
      role: 'INDUSTRY',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
      industryProfile: {
        create: {
          companyName: 'TechCorp Labs',
          website: 'https://techcorp.com',
          companySize: '500-1000 employees',
          industrySector: 'Enterprise Software & Cloud Platforms',
          verified: true,
        },
      },
    },
    include: { industryProfile: true },
  });

  // Academician
  await prisma.user.create({
    data: {
      email: 'dr.sharma@iitd.ac.in',
      passwordHash: await bcrypt.hash('Faculty@123456', 10),
      name: 'Dr. Rajesh Sharma',
      role: 'ACADEMICIAN',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
      academicianProfile: {
        create: {
          institution: 'IIT Delhi',
          department: 'Computer Science and Engineering',
          designation: 'Professor & Head of Research',
        },
      },
    },
  });

  // Institution Admin
  await prisma.user.create({
    data: {
      email: 'admin@skillbridge.edu',
      passwordHash: await bcrypt.hash('Admin@123456', 10),
      name: 'Dr. Anand Raman',
      role: 'INSTITUTION_ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      institutionProfile: {
        create: {
          institutionName: 'SkillBridge Consortium',
          adminDesignation: 'Director of Academic Affairs',
        },
      },
    },
  });

  // Student skill scores
  const satyamScores = [
    { skillId: 'skill-react', score: 88 },
    { skillId: 'skill-ts', score: 84 },
    { skillId: 'skill-node', score: 82 },
    { skillId: 'skill-sql', score: 78 },
    { skillId: 'skill-system-design', score: 76 },
    { skillId: 'skill-problem-solving', score: 85 },
    { skillId: 'skill-communication', score: 82 },
  ];

  for (const s of satyamScores) {
    await prisma.studentSkillScore.create({
      data: {
        studentId: userDemo.studentProfile!.id,
        skillId: s.skillId,
        score: s.score,
      },
    });
  }

  // Enrollments
  await prisma.enrollment.create({
    data: {
      studentId: userDemo.studentProfile!.id,
      courseId: 'course-ts-mastery',
      status: 'completed',
      completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: userDemo.studentProfile!.id,
      courseId: 'course-nptel-dsa',
      status: 'completed',
      completedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
  });

  // Internship
  await prisma.internship.create({
    data: {
      industryId: userIndustry.industryProfile!.id,
      title: 'Full-Stack Software Engineering Intern',
      description: 'Join our cloud platform team building high-performance TypeScript microservices and responsive React interfaces.',
      requiredSkillsJson: JSON.stringify([
        { skillId: 'skill-react', weight: 5, minScore: 75 },
        { skillId: 'skill-ts', weight: 5, minScore: 75 },
        { skillId: 'skill-node', weight: 4, minScore: 70 },
        { skillId: 'skill-sql', weight: 4, minScore: 65 },
        { skillId: 'skill-system-design', weight: 3, minScore: 60 },
      ]),
      stipend: '₹45,000/month',
      location: 'Bengaluru, India',
      workMode: 'HYBRID',
      status: 'OPEN',
    },
  });

  // Assessment Attempts
  if (userDemo.studentProfile) {
    const demoStudentId = userDemo.studentProfile.id;

    await prisma.assessmentAttempt.create({
      data: {
        studentId: demoStudentId,
        practiceSetId: 'set-web-1',
        startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000),
        timeSpentSeconds: 720,
        score: 82.0,
        passed: true,
        answersJson: JSON.stringify({
          'opt-w1-1': 'opt-w1-1',
          'opt-w1-2a': 'opt-w1-2a',
        }),
        aiGradingNotesJson: JSON.stringify([
          {
            prompt: 'In React 18+, which hook is specifically designed to defer updating a non-urgent part of the UI?',
            questionType: 'mcq',
            userAnswer: 'useDeferredValue',
            isCorrect: true,
            score: 1.5,
            maxScore: 1.5,
            explanation: 'Correct choice! useDeferredValue defers non-urgent render updates.',
          },
        ]),
        skillBreakdownJson: JSON.stringify([
          { skillId: 'skill-react', skillName: 'React.js', previousScore: 65, newScore: 80, delta: 15 },
        ]),
      },
    });

    await prisma.assessmentAttempt.create({
      data: {
        studentId: demoStudentId,
        practiceSetId: 'set-web-1',
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
        timeSpentSeconds: 600,
        score: 95.0,
        passed: true,
        answersJson: JSON.stringify({
          'opt-w1-1': 'opt-w1-1',
          'opt-w1-2a': 'opt-w1-2a',
          'opt-w1-3a': 'opt-w1-3a',
        }),
        aiGradingNotesJson: JSON.stringify([
          {
            prompt: 'In React 18+, which hook is specifically designed to defer updating a non-urgent part of the UI?',
            questionType: 'mcq',
            userAnswer: 'useDeferredValue',
            isCorrect: true,
            score: 1.5,
            maxScore: 1.5,
            explanation: 'Correct choice!',
          },
        ]),
        skillBreakdownJson: JSON.stringify([
          { skillId: 'skill-react', skillName: 'React.js', previousScore: 80, newScore: 92, delta: 12 },
        ]),
      },
    });

    await prisma.assessmentAttempt.create({
      data: {
        studentId: demoStudentId,
        practiceSetId: 'set-quant-1',
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 1000),
        timeSpentSeconds: 840,
        score: 88.0,
        passed: true,
        answersJson: JSON.stringify({
          'opt-q1-1': 'opt-q1-1',
          'opt-q1-2a': 'opt-q1-2a',
        }),
        aiGradingNotesJson: JSON.stringify([
          {
            prompt: 'A retailer buys an item at ₹1,200 and marks it up by 40%...',
            questionType: 'mcq',
            userAnswer: '19.0%',
            isCorrect: true,
            score: 1.0,
            maxScore: 1.0,
            explanation: 'Correct choice!',
          },
        ]),
        skillBreakdownJson: JSON.stringify([
          { skillId: 'skill-problem-solving', skillName: 'Problem Solving & DSA', previousScore: 70, newScore: 82, delta: 12 },
        ]),
      },
    });
  }

  // Portfolio websites
  if (userDemo.studentProfile) {
    const portfolioDemo = await prisma.portfolioWebsite.create({
      data: {
        studentId: userDemo.studentProfile.id,
        slug: 'satyam-singh',
        status: 'PUBLISHED',
        theme: 'teal_dark',
        enableBot: true,
        headline: 'Crafting resilient distributed web systems & vector intelligence platforms',
        subheadline: 'Hi, I am Satyam Singh — Computer Science undergraduate at Delhi Technological University.',
        heroCtaText: 'Explore Featured Projects',
        heroCtaLink: '#projects',
        heroImageUrl: userDemo.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        servicesJson: JSON.stringify([
          {
            icon: 'Code2',
            title: 'Full-Stack Web Architecture',
            description: 'Building end-to-end web applications with modern reactive UI and type-safe API contracts.',
          },
          {
            icon: 'Cpu',
            title: 'Distributed Systems & Microservices',
            description: 'Engineering high-throughput Node.js & Go services with PostgreSQL, Redis, and event streaming.',
          },
          {
            icon: 'Layers',
            title: 'Applied Machine Learning & Vector Math',
            description: 'Integrating PyTorch models, vector embeddings, and mathematical recommendation pipelines.',
          },
        ]),
        projectsJson: JSON.stringify([
          {
            id: 'proj-demo-1',
            title: 'SkillBridge — Unified Academia-Industry Ecosystem',
            description: 'Full-stack platform with real-time vector matching algorithms and verified skill calibration.',
            tags: ['React', 'TypeScript', 'Node.js', 'Prisma', 'TailwindCSS'],
            thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
            githubUrl: 'https://github.com/satyamsingh/skillbridge',
            demoUrl: 'https://skillbridge.dev',
          },
        ]),
        aboutBio: 'Passionate Computer Science engineering undergraduate at Delhi Technological University with strong foundational expertise in Full-Stack web architecture, distributed systems, and applied machine learning.',
        aboutImageUrl: userDemo.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        skillsJson: JSON.stringify(['TypeScript', 'React.js', 'Node.js', 'PostgreSQL', 'Docker', 'GraphQL', 'System Design', 'Vitest']),
        statsJson: JSON.stringify([
          { label: 'Projects Shipped', value: '6+', subtext: 'Production Grade' },
          { label: 'Verified Certifications', value: '4', subtext: 'NPTEL & Industry' },
          { label: 'Domain Skill Match', value: '94%', subtext: 'Full-Stack Web' },
        ]),
        contactEmail: 'satyam.singh@dtu.ac.in',
        socialsJson: JSON.stringify({
          github: 'https://github.com/satyamsingh',
          linkedin: 'https://linkedin.com/in/satyamsingh',
          email: 'satyam.singh@dtu.ac.in',
          website: 'https://skillbridge.app/p/satyam-singh',
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
      },
    });

    await prisma.portfolioMessage.create({
      data: {
        portfolioId: portfolioDemo.id,
        senderName: 'Vikram Mehta',
        senderEmail: 'vikram.mehta@techcorp.com',
        message: 'Hi Satyam, impressed with your SkillBridge architecture and verified skill vectors. We have an opening for a Full-Stack Engineering Intern at TechCorp Labs.',
        read: false,
      },
    });
  }

  // In-app notifications
  const demoUsers = await prisma.user.findMany({ where: { role: 'STUDENT' } });
  for (const u of demoUsers) {
    await prisma.inAppNotification.createMany({
      data: [
        {
          userId: u.id,
          title: "🎯 Today's Practice Pending",
          message: "Complete at least 1 practice set today to keep your streak active and prevent skill radar decay.",
          type: 'DAILY_PRACTICE',
          link: '/assessment',
          read: false,
        },
        {
          userId: u.id,
          title: "💡 Learning Resource Recommendations Ready",
          message: "New curated DSA and Full-Stack Web study resources are available to close your domain skill gaps.",
          type: 'RESOURCE_RECOMMENDATION',
          link: '/learn',
          read: false,
        },
      ],
    });
  }

  console.log('✅ Demo users and profiles seeded successfully.');
}
