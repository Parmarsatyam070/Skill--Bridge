import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SkillBridge database with multi-domain competency catalog & assessment modules...');

  // Clean existing records in correct foreign key order
  await prisma.inAppNotification.deleteMany({});
  await prisma.learningResource.deleteMany({});
  await prisma.portfolioMessage.deleteMany({});
  await prisma.portfolioWebsite.deleteMany({});
  await prisma.assessmentAttempt.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.listeningPassage.deleteMany({});
  await prisma.practiceSet.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.resume.deleteMany({});
  await prisma.internship.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.courseProvider.deleteMany({});
  await prisma.studentSkillScore.deleteMany({});
  await prisma.studentDomain.deleteMany({});
  await prisma.domainSkillRequirement.deleteMany({});
  await prisma.skillBenchmark.deleteMany({});
  await prisma.domain.deleteMany({});
  await prisma.skill.deleteMany({});
  await prisma.academicOpportunity.deleteMany({});
  await prisma.externalIntegration.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.industryProfile.deleteMany({});
  await prisma.academicianProfile.deleteMany({});
  await prisma.institutionProfile.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Skills across all 5 domains
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

  // 2. Seed Domains with Market Salary Benchmarks
  const domainsData = [
    {
      id: 'domain-web',
      name: 'Full-Stack Web',
      slug: 'fullstack-web',
      description: 'Modern reactive web applications, scalable backend APIs, relational databases, and distributed system design.',
      avgSalaryINR: 1150000, // ₹11.5 LPA
      icon: 'Code',
      requirements: [
        { skillId: 'skill-react', benchmarkScore: 85, displayOrder: 1 },
        { skillId: 'skill-ts', benchmarkScore: 80, displayOrder: 2 },
        { skillId: 'skill-node', benchmarkScore: 80, displayOrder: 3 },
        { skillId: 'skill-sql', benchmarkScore: 75, displayOrder: 4 },
        { skillId: 'skill-system-design', benchmarkScore: 70, displayOrder: 5 },
        { skillId: 'skill-problem-solving', benchmarkScore: 75, displayOrder: 6 },
        { skillId: 'skill-communication', benchmarkScore: 80, displayOrder: 7 },
      ]
    },
    {
      id: 'domain-ai',
      name: 'AI/Data Science',
      slug: 'ai-data-science',
      description: 'Predictive modeling, deep learning architectures, Large Language Models, vector search, and statistical intelligence.',
      avgSalaryINR: 1380000, // ₹13.8 LPA
      icon: 'Brain',
      requirements: [
        { skillId: 'skill-python', benchmarkScore: 90, displayOrder: 1 },
        { skillId: 'skill-ml', benchmarkScore: 85, displayOrder: 2 },
        { skillId: 'skill-pytorch', benchmarkScore: 80, displayOrder: 3 },
        { skillId: 'skill-nlp', benchmarkScore: 75, displayOrder: 4 },
        { skillId: 'skill-sql', benchmarkScore: 75, displayOrder: 5 },
        { skillId: 'skill-statistics', benchmarkScore: 80, displayOrder: 6 },
        { skillId: 'skill-communication', benchmarkScore: 75, displayOrder: 7 },
      ]
    },
    {
      id: 'domain-cloud',
      name: 'Cloud/DevOps',
      slug: 'cloud-devops',
      description: 'Cloud infrastructure orchestration, automated CI/CD deployment pipelines, containerization, and high availability.',
      avgSalaryINR: 1250000, // ₹12.5 LPA
      icon: 'Cloud',
      requirements: [
        { skillId: 'skill-docker', benchmarkScore: 85, displayOrder: 1 },
        { skillId: 'skill-k8s', benchmarkScore: 80, displayOrder: 2 },
        { skillId: 'skill-aws', benchmarkScore: 80, displayOrder: 3 },
        { skillId: 'skill-cicd', benchmarkScore: 85, displayOrder: 4 },
        { skillId: 'skill-monitoring', benchmarkScore: 75, displayOrder: 5 },
        { skillId: 'skill-communication', benchmarkScore: 75, displayOrder: 6 },
      ]
    },
    {
      id: 'domain-uiux',
      name: 'UI/UX Product Design',
      slug: 'uiux-product-design',
      description: 'Human-centered user experience, scalable design system tokens, high-fidelity Figma prototypes, and usability testing.',
      avgSalaryINR: 980000, // ₹9.8 LPA
      icon: 'Palette',
      requirements: [
        { skillId: 'skill-figma', benchmarkScore: 90, displayOrder: 1 },
        { skillId: 'skill-design-systems', benchmarkScore: 85, displayOrder: 2 },
        { skillId: 'skill-ux-research', benchmarkScore: 80, displayOrder: 3 },
        { skillId: 'skill-visual-design', benchmarkScore: 80, displayOrder: 4 },
        { skillId: 'skill-usability-testing', benchmarkScore: 75, displayOrder: 5 },
        { skillId: 'skill-communication', benchmarkScore: 85, displayOrder: 6 },
      ]
    },
    {
      id: 'domain-iot',
      name: 'Embedded/IoT',
      slug: 'embedded-iot',
      description: 'Real-time firmware engineering, bare-metal C/C++, FreeRTOS multitasking, sensor integration, and low-power IoT telemetry.',
      avgSalaryINR: 1060000, // ₹10.6 LPA
      icon: 'Cpu',
      requirements: [
        { skillId: 'skill-embedded-c', benchmarkScore: 90, displayOrder: 1 },
        { skillId: 'skill-mcu', benchmarkScore: 80, displayOrder: 2 },
        { skillId: 'skill-rtos', benchmarkScore: 80, displayOrder: 3 },
        { skillId: 'skill-iot-protocols', benchmarkScore: 80, displayOrder: 4 },
        { skillId: 'skill-circuit-design', benchmarkScore: 75, displayOrder: 5 },
        { skillId: 'skill-communication', benchmarkScore: 70, displayOrder: 6 },
      ]
    }
  ];

  for (const dom of domainsData) {
    const { requirements, ...domainRecord } = dom;
    const createdDomain = await prisma.domain.create({ data: domainRecord });

    for (const req of requirements) {
      await prisma.domainSkillRequirement.create({
        data: {
          domainId: createdDomain.id,
          skillId: req.skillId,
          benchmarkScore: req.benchmarkScore,
          displayOrder: req.displayOrder,
        }
      });

      await prisma.skillBenchmark.create({
        data: {
          domain: dom.name,
          skillId: req.skillId,
          benchmarkScore: req.benchmarkScore,
          displayOrder: req.displayOrder,
        }
      });
    }
  }

  // 3. Seed Course Providers
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

  // 4. Seed Partner Courses
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

  // 5. Seed Users & Profiles
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
          bio: 'Passionate Computer Science engineering undergraduate at Delhi Technological University with strong foundational expertise in Full-Stack web architecture, distributed systems, and applied machine learning. Experienced in designing resilient TypeScript backend microservices, modern React interfaces, and vector matching mathematical engines.',
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

  // Seed Rahul Verma (rahul.verma@vit.edu)
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

  // Seed Industry Recruiter
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

  // Seed Academician
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

  // Seed Institution Admin
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

  // 6. Seed Student Skill Scores for Satyam Singh
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

  // 7. Seed Enrollments
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

  // 8. Seed Internships
  const internship1 = await prisma.internship.create({
    data: {
      industryId: userIndustry.industryProfile!.id,
      title: 'Full-Stack Software Engineering Intern',
      description: 'Join our cloud platform team building high-performance TypeScript microservices and responsive React interfaces. Work alongside senior architects on scalable backend systems.',
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

  // 9. Seed Practice Sets for ALL 5 Domains + Dedicated Aptitude Module
  console.log('📝 Seeding Practice Sets and Question Pools...');

  // 9A. Full-Stack Web Sets (1-3)
  const setWeb1 = await prisma.practiceSet.create({
    data: {
      id: 'set-web-1',
      domainName: 'Full-Stack Web',
      type: 'domain',
      title: 'Practice Set 1: React 18, State & Component Architecture',
      description: 'Core React 18 concurrent features, hydration, state synchronization, and component hierarchy evaluation.',
      timeLimitMinutes: 15,
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
      timeLimitMinutes: 15,
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
      timeLimitMinutes: 20,
      passingScorePct: 65.0,
      difficulty: 'Advanced',
      displayOrder: 3,
    },
  });

  // 9B. AI / Data Science Sets (1-3)
  const setAi1 = await prisma.practiceSet.create({
    data: {
      id: 'set-ai-1',
      domainName: 'AI/Data Science',
      type: 'domain',
      title: 'Practice Set 1: Python Vectorization & Statistical Inference',
      description: 'NumPy/Pandas vectorized computation, probability distributions, hypothesis testing, and p-values.',
      timeLimitMinutes: 15,
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
      timeLimitMinutes: 15,
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
      timeLimitMinutes: 20,
      passingScorePct: 65.0,
      difficulty: 'Advanced',
      displayOrder: 3,
    },
  });

  // 9C. Cloud / DevOps Sets (1-3)
  const setCloud1 = await prisma.practiceSet.create({
    data: {
      id: 'set-cloud-1',
      domainName: 'Cloud/DevOps',
      type: 'domain',
      title: 'Practice Set 1: Docker Containers & Multi-Stage Builds',
      description: 'Container isolation, Dockerfile layer caching, non-root user execution, and image minimization.',
      timeLimitMinutes: 15,
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
      timeLimitMinutes: 15,
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
      timeLimitMinutes: 20,
      passingScorePct: 65.0,
      difficulty: 'Advanced',
      displayOrder: 3,
    },
  });

  // 9D. UI/UX Product Design Sets (1-3)
  const setUi1 = await prisma.practiceSet.create({
    data: {
      id: 'set-ui-1',
      domainName: 'UI/UX Product Design',
      type: 'domain',
      title: 'Practice Set 1: Usability Heuristics & User Flow Research',
      description: 'Nielsen Norman 10 heuristics, cognitive load reduction, user persona journey mapping, and wireframing.',
      timeLimitMinutes: 15,
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
      timeLimitMinutes: 15,
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
      timeLimitMinutes: 20,
      passingScorePct: 65.0,
      difficulty: 'Advanced',
      displayOrder: 3,
    },
  });

  // 9E. Embedded / IoT Sets (1-3)
  const setIot1 = await prisma.practiceSet.create({
    data: {
      id: 'set-iot-1',
      domainName: 'Embedded/IoT',
      type: 'domain',
      title: 'Practice Set 1: Embedded C, Pointers & Volatile Memory',
      description: 'Hardware register mapping, bitwise manipulation, interrupt service routines, and memory alignment.',
      timeLimitMinutes: 15,
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
      timeLimitMinutes: 15,
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
      timeLimitMinutes: 20,
      passingScorePct: 65.0,
      difficulty: 'Advanced',
      displayOrder: 3,
    },
  });

  // 9F. Aptitude: Quantitative Maths (Sets 1-3)
  const setQuant1 = await prisma.practiceSet.create({
    data: {
      id: 'set-quant-1',
      domainName: 'Quantitative Aptitude',
      type: 'aptitude_quant',
      title: 'Practice Set 1: Arithmetic, Percentages & Profit-Loss',
      description: 'Percentages, simple & compound interest, profit-loss margins, and average calculations.',
      timeLimitMinutes: 15,
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
      timeLimitMinutes: 15,
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
      timeLimitMinutes: 20,
      passingScorePct: 65.0,
      difficulty: 'Advanced',
      displayOrder: 3,
    },
  });

  // 9G. Aptitude: English Reading (Sets 1-2)
  const setEnglishRead1 = await prisma.practiceSet.create({
    data: {
      id: 'set-eng-read-1',
      domainName: 'English Reading',
      type: 'aptitude_english_reading',
      title: 'Practice Set 1: Technical Innovation & Core Comprehension',
      description: 'Reading comprehension passages with inference-based questions, vocabulary in context, and tone analysis.',
      timeLimitMinutes: 15,
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
      timeLimitMinutes: 15,
      passingScorePct: 60.0,
      difficulty: 'Intermediate',
      displayOrder: 2,
    },
  });

  // 9H. Aptitude: English Voice-Based Listening (Passages 1-2 & Sets 1-2)
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
      timeLimitMinutes: 12,
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
      timeLimitMinutes: 12,
      passingScorePct: 60.0,
      difficulty: 'Intermediate',
      displayOrder: 2,
    },
  });

  // 10. Seed Questions (MCQ + Written with AI Rubrics)
  const allQuestions = [
    // ────────────── Full-Stack Web Set 1 ──────────────
    {
      domain: 'Full-Stack Web',
      skillId: 'skill-react',
      practiceSetId: setWeb1.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'In React 18+, which hook is specifically designed to defer updating a non-urgent part of the UI to keep user typing responsive?',
      optionsJson: JSON.stringify([
        { id: 'opt-w1-1', text: 'useDeferredValue', isCorrect: true },
        { id: 'opt-w1-2', text: 'useCallback', isCorrect: false },
        { id: 'opt-w1-3', text: 'useMemo', isCorrect: false },
        { id: 'opt-w1-4', text: 'useLayoutEffect', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'useDeferredValue accepts a value and returns a new copy of the value that will defer to more urgent updates.',
    },
    {
      domain: 'Full-Stack Web',
      skillId: 'skill-react',
      practiceSetId: setWeb1.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'What is the primary benefit of React Server Components (RSC) compared to traditional client-side rendering?',
      optionsJson: JSON.stringify([
        { id: 'opt-w1-2a', text: 'Zero bundle size on the client for server-only dependencies and direct database access', isCorrect: true },
        { id: 'opt-w1-2b', text: 'Automatic WebSocket connection pooling on port 8080', isCorrect: false },
        { id: 'opt-w1-2c', text: 'Disabling CSS cascade specificity rules globally', isCorrect: false },
        { id: 'opt-w1-2d', text: 'Replacing all React hooks with plain global variables', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'RSC execute only on the server, meaning their dependencies do not add to the JavaScript bundle sent to the client.',
    },
    {
      domain: 'Full-Stack Web',
      skillId: 'skill-react',
      practiceSetId: setWeb1.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'When using useEffect with an empty dependency array `[]`, when is the cleanup return function executed?',
      optionsJson: JSON.stringify([
        { id: 'opt-w1-3a', text: 'When the component unmounts from the DOM', isCorrect: true },
        { id: 'opt-w1-3b', text: 'After every state change in any parent component', isCorrect: false },
        { id: 'opt-w1-3c', text: 'Before the initial render takes place', isCorrect: false },
        { id: 'opt-w1-3d', text: 'Only when window resize event fires', isCorrect: false },
      ]),
      weight: 1.0,
      explanation: 'With an empty dependency array, the cleanup function runs when the component unmounts.',
    },
    {
      domain: 'Full-Stack Web',
      skillId: 'skill-react',
      practiceSetId: setWeb1.id,
      type: 'technical',
      questionType: 'written',
      prompt: 'Explain the mechanism of React Virtual DOM Reconciliation. How does React determine which DOM nodes need to be updated efficiently, and why is key prop critical in lists?',
      optionsJson: JSON.stringify([]),
      weight: 2.0,
      expectedAnswerRubric: 'Virtual DOM diffing algorithm, Fiber tree, O(n) heuristic complexity, key prop identification, minimizing real DOM mutations',
    },
    {
      domain: 'Full-Stack Web',
      skillId: 'skill-react',
      practiceSetId: setWeb1.id,
      type: 'technical',
      questionType: 'coding',
      prompt: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
      optionsJson: JSON.stringify([]),
      weight: 3.0,
      starterCode: `function twoSum(nums, target) {\n  // Implement your O(N) hash map solution here\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) {\n      return [map.get(comp), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
      testCasesJson: JSON.stringify([
        { id: 'tc-web1-1', input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]', isHidden: false, explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
        { id: 'tc-web1-2', input: '[3, 2, 4], 6', expectedOutput: '[1, 2]', isHidden: false, explanation: 'nums[1] + nums[2] = 2 + 4 = 6' },
        { id: 'tc-web1-3', input: '[3, 3], 6', expectedOutput: '[0, 1]', isHidden: true },
      ]),
      constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.',
      inputFormat: 'nums: number[], target: number',
      outputFormat: '[number, number]',
      externalLinksJson: JSON.stringify([
        { platform: 'LeetCode', topic: 'Two Pointers & Hash Map', url: 'https://leetcode.com/tag/hash-table/' },
        { platform: 'GeeksforGeeks', topic: 'Two Sum Problem', url: 'https://www.geeksforgeeks.org/dsa/hashing/' },
      ]),
    },

    // ────────────── Full-Stack Web Set 2 ──────────────
    {
      domain: 'Full-Stack Web',
      skillId: 'skill-ts',
      practiceSetId: setWeb2.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'Which TypeScript utility type constructs a type with all properties of T set to optional except for specified keys K?',
      optionsJson: JSON.stringify([
        { id: 'opt-w2-1', text: 'Omit<Partial<T>, K>', isCorrect: false },
        { id: 'opt-w2-2', text: 'Partial<T> & Pick<T, K>', isCorrect: true },
        { id: 'opt-w2-3', text: 'Required<Pick<T, K>>', isCorrect: false },
        { id: 'opt-w2-4', text: 'Readonly<T>', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'Partial<T> & Pick<T, K> keeps K as required while making the rest optional.',
    },
    {
      domain: 'Full-Stack Web',
      skillId: 'skill-node',
      practiceSetId: setWeb2.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'What happens if an unhandled promise rejection occurs in a modern Node.js service (v16+)?',
      optionsJson: JSON.stringify([
        { id: 'opt-w2-2a', text: 'The process terminates with a non-zero exit code by default', isCorrect: true },
        { id: 'opt-w2-2b', text: 'Node logs a warning and continues execution normally', isCorrect: false },
        { id: 'opt-w2-2c', text: 'The event loop pauses indefinitely', isCorrect: false },
        { id: 'opt-w2-2d', text: 'Node automatically retries the rejected promise twice', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'Modern Node.js versions crash the process on unhandled promise rejections unless caught.',
    },
    {
      domain: 'Full-Stack Web',
      skillId: 'skill-sql',
      practiceSetId: setWeb2.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'In PostgreSQL, which index type is most suitable for indexing JSONB columns with arbitrary key-value lookups?',
      optionsJson: JSON.stringify([
        { id: 'opt-w2-3a', text: 'GIN (Generalized Inverted Index)', isCorrect: true },
        { id: 'opt-w2-3b', text: 'B-Tree Index', isCorrect: false },
        { id: 'opt-w2-3c', text: 'Hash Index', isCorrect: false },
        { id: 'opt-w2-3d', text: 'BRIN Index', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'GIN indexes allow fast containment and key existence lookups in JSONB columns.',
    },
    {
      domain: 'Full-Stack Web',
      skillId: 'skill-sql',
      practiceSetId: setWeb2.id,
      type: 'technical',
      questionType: 'written',
      prompt: 'Describe the ACID properties in relational database transactions. Provide a practical web application scenario where an Isolation anomaly (like a dirty read or phantom read) could cause business failure if transactions are not handled properly.',
      optionsJson: JSON.stringify([]),
      weight: 2.0,
      expectedAnswerRubric: 'Atomicity, Consistency, Isolation, Durability, banking/e-commerce inventory concurrency, transaction isolation levels (Read Committed vs Serializable)',
    },

    // ────────────── Full-Stack Web Set 3 ──────────────
    {
      domain: 'Full-Stack Web',
      skillId: 'skill-system-design',
      practiceSetId: setWeb3.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'Which caching strategy guarantees that database updates and cache updates are atomic by writing to cache first and persisting asynchronously to DB?',
      optionsJson: JSON.stringify([
        { id: 'opt-w3-1', text: 'Write-Back (Write-Behind)', isCorrect: true },
        { id: 'opt-w3-2', text: 'Write-Through', isCorrect: false },
        { id: 'opt-w3-3', text: 'Cache-Aside', isCorrect: false },
        { id: 'opt-w3-4', text: 'Read-Through', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'Write-back writes to cache immediately and asynchronously persists to disk/database, maximizing write throughput.',
    },
    {
      domain: 'Full-Stack Web',
      skillId: 'skill-system-design',
      practiceSetId: setWeb3.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'In a distributed system, what does the CAP theorem state regarding Network Partitions (P)?',
      optionsJson: JSON.stringify([
        { id: 'opt-w3-2a', text: 'When a network partition occurs, the system must trade off between strict Consistency (C) and high Availability (A)', isCorrect: true },
        { id: 'opt-w3-2b', text: 'A system can achieve 100% Consistency, 100% Availability, and 100% Partition tolerance simultaneously', isCorrect: false },
        { id: 'opt-w3-2c', text: 'Partitions only occur when using SQL databases and never on NoSQL', isCorrect: false },
        { id: 'opt-w3-2d', text: 'Latency is always zero if encryption is disabled', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'Under network partitions, a system cannot be both strictly consistent and fully available across all nodes.',
    },
    {
      domain: 'Full-Stack Web',
      skillId: 'skill-communication',
      practiceSetId: setWeb3.id,
      type: 'soft',
      questionType: 'mcq',
      prompt: 'When submitting a complex Pull Request with architectural changes, what is the best practice to ensure smooth team review?',
      optionsJson: JSON.stringify([
        { id: 'opt-w3-3a', text: 'Provide architectural context, design tradeoffs, before/after snapshots, and testing steps', isCorrect: true },
        { id: 'opt-w3-3b', text: 'Merge immediately and explain on Slack if questions arise', isCorrect: false },
        { id: 'opt-w3-3c', text: 'Leave description empty to force reviewers to parse every line of raw code', isCorrect: false },
        { id: 'opt-w3-3d', text: 'Break changes into 100 single-line commits with ambiguous messages', isCorrect: false },
      ]),
      weight: 1.0,
      explanation: 'Clear documentation with design tradeoffs accelerates review velocity and catches bugs.',
    },
    {
      domain: 'Full-Stack Web',
      skillId: 'skill-system-design',
      practiceSetId: setWeb3.id,
      type: 'technical',
      questionType: 'written',
      prompt: 'Design a scalable Rate Limiter service for a public REST API handling 100,000 requests/sec. Discuss the Token Bucket vs Sliding Window Log algorithms, Redis data structures used, and handling distributed clock drift.',
      optionsJson: JSON.stringify([]),
      weight: 2.5,
      expectedAnswerRubric: 'Token Bucket / Sliding Window Counter, Redis sorted sets (ZADD/ZREMRANGEBYSCORE) or Lua script atomicity, distributed race conditions, 429 Too Many Requests header response',
    },

    // ────────────── AI / Data Science Sets ──────────────
    {
      domain: 'AI/Data Science',
      skillId: 'skill-python',
      practiceSetId: setAi1.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'In NumPy, why is vectorized array broadcasting significantly faster than standard Python for-loops over lists?',
      optionsJson: JSON.stringify([
        { id: 'opt-a1-1', text: 'NumPy executes continuous C memory buffer operations utilizing CPU SIMD vector instructions and avoiding Python interpreter bytecode overhead', isCorrect: true },
        { id: 'opt-a1-2', text: 'NumPy compiles Python code to JavaScript V8 engine bytecode', isCorrect: false },
        { id: 'opt-a1-3', text: 'NumPy automatically distributes array slices across cloud GPUs via SSH', isCorrect: false },
        { id: 'opt-a1-4', text: 'NumPy stores all numbers as ASCII string bytes', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'Vectorized operations run in compiled C with contiguous memory and SIMD instructions.',
    },
    {
      domain: 'AI/Data Science',
      skillId: 'skill-statistics',
      practiceSetId: setAi1.id,
      type: 'core',
      questionType: 'mcq',
      prompt: 'In hypothesis testing, what does a p-value of 0.03 strictly indicate when testing at alpha = 0.05?',
      optionsJson: JSON.stringify([
        { id: 'opt-a1-2a', text: 'There is a 3% probability of observing test results at least as extreme as the sample data assuming the Null Hypothesis (H0) is true, leading to rejection of H0', isCorrect: true },
        { id: 'opt-a1-2b', text: 'There is a 97% chance the alternative hypothesis is false', isCorrect: false },
        { id: 'opt-a1-2c', text: 'The dataset has 3% corrupted outliers', isCorrect: false },
        { id: 'opt-a1-2d', text: 'The model has 97% training accuracy', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'p-value is P(observed data or more extreme | H0 is true). Since 0.03 < 0.05, we reject the null hypothesis.',
    },
    {
      domain: 'AI/Data Science',
      skillId: 'skill-ml',
      practiceSetId: setAi1.id,
      type: 'technical',
      questionType: 'written',
      prompt: 'Explain the Bias-Variance Tradeoff in machine learning. How do high bias and high variance manifest in training vs validation curves, and what techniques (regularization, ensemble methods, data collection) alleviate each?',
      optionsJson: JSON.stringify([]),
      weight: 2.0,
      expectedAnswerRubric: 'Underfitting vs Overfitting, training loss vs validation loss divergence, L1/L2 regularization, dropout, bagging/boosting, cross-validation',
    },
    // ────────────── AI / Data Science Set 2 ──────────────
    {
      domain: 'AI/Data Science',
      skillId: 'skill-ml',
      practiceSetId: setAi2.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'Which metric is most appropriate for evaluating a binary classification model on a severely imbalanced fraud detection dataset (99.9% negative class)?',
      optionsJson: JSON.stringify([
        { id: 'opt-a2-1', text: 'Standard Accuracy', isCorrect: false },
        { id: 'opt-a2-2', text: 'Precision-Recall AUC (PR-AUC) or F1-Score', isCorrect: true },
        { id: 'opt-a2-3', text: 'Mean Squared Error (MSE)', isCorrect: false },
        { id: 'opt-a2-4', text: 'R-Squared Score', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'PR-AUC focuses on the minority positive class without being inflated by true negatives.',
    },
    {
      domain: 'AI/Data Science',
      skillId: 'skill-pytorch',
      practiceSetId: setAi2.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'In PyTorch, why is it mandatory to call `optimizer.zero_grad()` before `loss.backward()` in a standard training loop?',
      optionsJson: JSON.stringify([
        { id: 'opt-a2-2a', text: 'PyTorch accumulates gradients in `.grad` buffers on subsequent backward passes instead of overwriting them', isCorrect: true },
        { id: 'opt-a2-2b', text: 'To delete model weights from GPU VRAM', isCorrect: false },
        { id: 'opt-a2-2c', text: 'To reset the learning rate scheduler to 0', isCorrect: false },
        { id: 'opt-a2-2d', text: 'To convert floating point tensors to integers', isCorrect: false },
      ]),
      weight: 1.4,
      explanation: 'Gradient accumulation requires zeroing gradients before computing fresh derivatives.',
    },
    // ────────────── AI / Data Science Set 3 ──────────────
    {
      domain: 'AI/Data Science',
      skillId: 'skill-nlp',
      practiceSetId: setAi3.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'In Transformer architectures, what is the mathematical time and memory complexity of standard full Self-Attention with respect to sequence length N?',
      optionsJson: JSON.stringify([
        { id: 'opt-a3-1', text: 'O(N) - Linear', isCorrect: false },
        { id: 'opt-a3-2', text: 'O(N log N) - Log-Linear', isCorrect: false },
        { id: 'opt-a3-3', text: 'O(N^2) - Quadratic due to query-key dot product matrix', isCorrect: true },
        { id: 'opt-a3-4', text: 'O(1) - Constant time', isCorrect: false },
      ]),
      weight: 1.4,
      explanation: 'The attention matrix QK^T computes dot products for all pairs of N tokens, giving O(N^2) complexity.',
    },
    {
      domain: 'AI/Data Science',
      skillId: 'skill-nlp',
      practiceSetId: setAi3.id,
      type: 'technical',
      questionType: 'written',
      prompt: 'Describe the core architecture of Retrieval-Augmented Generation (RAG). How do vector embeddings, chunking strategies, and re-ranking improve LLM generation accuracy over pure prompt engineering?',
      optionsJson: JSON.stringify([]),
      weight: 2.5,
      expectedAnswerRubric: 'Vector embeddings, chunking overlap, cosine similarity retrieval, vector database (Pinecone/Milvus), cross-encoder re-ranking, mitigating hallucinations',
    },

    // ────────────── Cloud / DevOps Sets ──────────────
    {
      domain: 'Cloud/DevOps',
      skillId: 'skill-docker',
      practiceSetId: setCloud1.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'Why are Multi-Stage Docker builds strongly recommended in production containerization pipelines?',
      optionsJson: JSON.stringify([
        { id: 'opt-c1-1', text: 'They separate build-time compilers and devDependencies from runtime images, producing minimal, secure attack-surface containers', isCorrect: true },
        { id: 'opt-c1-2', text: 'They allow running Windows and Linux containers in a single kernel thread', isCorrect: false },
        { id: 'opt-c1-3', text: 'They disable container root filesystem isolation', isCorrect: false },
        { id: 'opt-c1-4', text: 'They automatically publish images directly to public Docker Hub without credentials', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'Multi-stage builds leave compiler toolchains behind, drastically shrinking final image sizes.',
    },
    {
      domain: 'Cloud/DevOps',
      skillId: 'skill-k8s',
      practiceSetId: setCloud2.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'In Kubernetes, what is the primary difference between a Deployment and a StatefulSet?',
      optionsJson: JSON.stringify([
        { id: 'opt-c2-1', text: 'StatefulSets provide persistent, unique network identities (pod-0, pod-1) and stable dedicated persistent volume bindings; Deployments are stateless and interchangeable', isCorrect: true },
        { id: 'opt-c2-2', text: 'Deployments only run on master nodes while StatefulSets run on worker nodes', isCorrect: false },
        { id: 'opt-c2-3', text: 'StatefulSets cannot be scaled horizontally', isCorrect: false },
        { id: 'opt-c2-4', text: 'Deployments do not support rolling update strategies', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'StatefulSets are designed for stateful workloads requiring stable network IDs and storage volume claims.',
    },
    {
      domain: 'Cloud/DevOps',
      skillId: 'skill-aws',
      practiceSetId: setCloud3.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'Which AWS architecture pattern provides maximum high availability and fault tolerance across a region?',
      optionsJson: JSON.stringify([
        { id: 'opt-c3-1', text: 'Application Load Balancer distributing traffic across Auto Scaling Groups deployed in multiple Availability Zones (Multi-AZ)', isCorrect: true },
        { id: 'opt-c3-2', text: 'A single large EC2 instance deployed in a single subnet with 100 Elastic IPs', isCorrect: false },
        { id: 'opt-c3-3', text: 'Disabling VPC security groups and opening all inbound ports to 0.0.0.0/0', isCorrect: false },
        { id: 'opt-c3-4', text: 'Hosting everything on a single EBS root volume without snapshots', isCorrect: false },
      ]),
      weight: 1.4,
      explanation: 'Multi-AZ deployments ensure that failure of an entire data center does not bring down the application.',
    },
    {
      domain: 'Cloud/DevOps',
      skillId: 'skill-cicd',
      practiceSetId: setCloud3.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'What is the purpose of GitOps tools like ArgoCD or Flux in modern Kubernetes delivery pipelines?',
      optionsJson: JSON.stringify([
        { id: 'opt-c4-1', text: 'Declaratively reconcile live cluster state with desired manifest state stored in version-controlled Git repositories', isCorrect: true },
        { id: 'opt-c4-2', text: 'To automatically delete developer branch repositories after 24 hours', isCorrect: false },
        { id: 'opt-c4-3', text: 'To replace Kubernetes RBAC with basic HTTP auth', isCorrect: false },
        { id: 'opt-c4-4', text: 'To compile C++ code inside the Kubernetes API server', isCorrect: false },
      ]),
      weight: 1.3,
      explanation: 'GitOps uses Git as the single source of truth for declarative infrastructure and applications.',
    },
    {
      domain: 'Cloud/DevOps',
      skillId: 'skill-monitoring',
      practiceSetId: setCloud3.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'What are the 4 Golden Signals of Site Reliability Engineering (SRE) monitoring defined by Google?',
      optionsJson: JSON.stringify([
        { id: 'opt-c5-1', text: 'Latency, Traffic, Errors, and Saturation', isCorrect: true },
        { id: 'opt-c5-2', text: 'CPU, RAM, Disk, and Network Interface Packets', isCorrect: false },
        { id: 'opt-c5-3', text: 'Lines of Code, Pull Requests, Commits, and Issues', isCorrect: false },
        { id: 'opt-c5-4', text: 'Revenue, Churn, NPS Score, and Pageviews', isCorrect: false },
      ]),
      weight: 1.3,
      explanation: 'Google SRE handbook defines Latency, Traffic, Errors, and Saturation as the four golden monitoring signals.',
    },

    // ────────────── UI/UX Product Design Sets ──────────────
    {
      domain: 'UI/UX Product Design',
      skillId: 'skill-figma',
      practiceSetId: setUi1.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'In Figma, what is the architectural advantage of using Design Tokens mapped to Variables over hardcoded hex codes?',
      optionsJson: JSON.stringify([
        { id: 'opt-u1-1', text: 'Enables semantic theming (light/dark mode, brand variants) and automated token synchronization with CSS/Tailwind codebase', isCorrect: true },
        { id: 'opt-u1-2', text: 'Automatically exports raster JPEG images at 10x compression', isCorrect: false },
        { id: 'opt-u1-3', text: 'Disables vector Bézier curve editing in prototype frames', isCorrect: false },
        { id: 'opt-u1-4', text: 'Prevents other designers from viewing the canvas file', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'Design tokens provide semantic abstractions that sync cleanly between Figma and codebases.',
    },
    {
      domain: 'UI/UX Product Design',
      skillId: 'skill-ux-research',
      practiceSetId: setUi1.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'Which research method is most effective for discovering why users drop off during an e-commerce checkout flow?',
      optionsJson: JSON.stringify([
        { id: 'opt-u2-1', text: 'Moderated usability testing with think-aloud protocol combined with funnel analytics drop-off telemetry', isCorrect: true },
        { id: 'opt-u2-2', text: 'Asking the product manager what their personal aesthetic preference is', isCorrect: false },
        { id: 'opt-u2-3', text: 'Sending a 50-question multiple choice survey with no compensation', isCorrect: false },
        { id: 'opt-u2-4', text: 'Changing the button color randomly without tracking analytics', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'Think-aloud usability testing reveals the underlying cognitive blockers causing drop-offs.',
    },
    {
      domain: 'UI/UX Product Design',
      skillId: 'skill-usability-testing',
      practiceSetId: setUi2.id,
      type: 'core',
      questionType: 'mcq',
      prompt: 'According to WCAG 2.2 Level AA accessibility guidelines, what is the minimum required contrast ratio for normal body text against its background?',
      optionsJson: JSON.stringify([
        { id: 'opt-u3-1', text: '4.5:1 (or 3:1 for large text >= 18pt/24px bold)', isCorrect: true },
        { id: 'opt-u3-2', text: '1.5:1', isCorrect: false },
        { id: 'opt-u3-3', text: '10:1 strictly for all elements', isCorrect: false },
        { id: 'opt-u3-4', text: '2:1', isCorrect: false },
      ]),
      weight: 1.4,
      explanation: 'WCAG AA requires 4.5:1 contrast for normal body text.',
    },
    {
      domain: 'UI/UX Product Design',
      skillId: 'skill-design-systems',
      practiceSetId: setUi3.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'What constitutes an Atomic Design methodology hierarchy?',
      optionsJson: JSON.stringify([
        { id: 'opt-u4-1', text: 'Atoms -> Molecules -> Organisms -> Templates -> Pages', isCorrect: true },
        { id: 'opt-u4-2', text: 'Pixels -> Vectors -> SVGs -> Bitmaps -> HTML', isCorrect: false },
        { id: 'opt-u4-3', text: 'Header -> Hero -> Footer -> Sidebar -> Modal', isCorrect: false },
        { id: 'opt-u4-4', text: 'Design -> Prototype -> Test -> Deploy -> Repeat', isCorrect: false },
      ]),
      weight: 1.3,
      explanation: 'Brad Frost Atomic Design breaks interfaces into Atoms, Molecules, Organisms, Templates, and Pages.',
    },
    {
      domain: 'UI/UX Product Design',
      skillId: 'skill-visual-design',
      practiceSetId: setUi3.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'What is the primary role of typographic scale and hierarchy in dashboard interface design?',
      optionsJson: JSON.stringify([
        { id: 'opt-u5-1', text: 'To establish clear cognitive scanning paths and direct user attention to critical data metrics and primary actions first', isCorrect: true },
        { id: 'opt-u5-2', text: 'To use as many different decorative script fonts as possible', isCorrect: false },
        { id: 'opt-u5-3', text: 'To make all labels identical in weight and size', isCorrect: false },
        { id: 'opt-u5-4', text: 'To fill up whitespace so no empty margins remain', isCorrect: false },
      ]),
      weight: 1.3,
      explanation: 'Visual hierarchy guides the user eye to primary KPIs and actions rapidly.',
    },

    // ────────────── Embedded / IoT Sets ──────────────
    {
      domain: 'Embedded/IoT',
      skillId: 'skill-embedded-c',
      practiceSetId: setIot1.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'Why must hardware peripheral register pointers in Embedded C be qualified with the "volatile" keyword?',
      optionsJson: JSON.stringify([
        { id: 'opt-e1-1', text: 'To prevent the compiler optimizer from caching register reads into CPU registers when hardware changes them asynchronously', isCorrect: true },
        { id: 'opt-e1-2', text: 'To allocate the variable in external Flash memory instead of SRAM', isCorrect: false },
        { id: 'opt-e1-3', text: 'To make the pointer read-only for security', isCorrect: false },
        { id: 'opt-e1-4', text: 'To automatically enable hardware interrupt vector routing', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'Volatile tells the compiler that the memory location can be modified by hardware outside of program control.',
    },
    {
      domain: 'Embedded/IoT',
      skillId: 'skill-rtos',
      practiceSetId: setIot2.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'In FreeRTOS, how is Priority Inversion (where a low-priority task blocks a high-priority task holding a shared resource) resolved?',
      optionsJson: JSON.stringify([
        { id: 'opt-e2-1', text: 'Priority Inheritance mechanism temporarily elevating the low-priority task holding the mutex to the blocked task priority', isCorrect: true },
        { id: 'opt-e2-2', text: 'Terminating the high-priority task immediately', isCorrect: false },
        { id: 'opt-e2-3', text: 'Disabling all hardware interrupts globally until system reboot', isCorrect: false },
        { id: 'opt-e2-4', text: 'Converting all tasks to round-robin time slicing with equal priority', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'Priority inheritance raises the mutex holder to the priority of the highest priority task waiting for it.',
    },
    {
      domain: 'Embedded/IoT',
      skillId: 'skill-mcu',
      practiceSetId: setIot2.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'When streaming high-frequency ADC sensor samples to memory on an ARM Cortex microcontroller, which method minimizes CPU load?',
      optionsJson: JSON.stringify([
        { id: 'opt-e3-1', text: 'Direct Memory Access (DMA) circular buffer transfers triggering an interrupt only on half/full transfer', isCorrect: true },
        { id: 'opt-e3-2', text: 'Tight while(1) busy-wait polling loop checking ADC ready flags', isCorrect: false },
        { id: 'opt-e3-3', text: 'Software floating-point emulation in user space', isCorrect: false },
        { id: 'opt-e3-4', text: 'Writing samples to EEPROM over 9600-baud software UART', isCorrect: false },
      ]),
      weight: 1.4,
      explanation: 'DMA offloads byte transfers entirely from the CPU core.',
    },
    {
      domain: 'Embedded/IoT',
      skillId: 'skill-iot-protocols',
      practiceSetId: setIot3.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'In MQTT telemetry for low-power battery-operated IoT devices, what is the tradeoff between QoS 0 and QoS 1?',
      optionsJson: JSON.stringify([
        { id: 'opt-e4-1', text: 'QoS 0 is fire-and-forget (lowest energy/bandwidth, no delivery guarantee); QoS 1 guarantees arrival at least once with PUBACK handshake', isCorrect: true },
        { id: 'opt-e4-2', text: 'QoS 0 encrypts data with TLS 1.3 while QoS 1 sends cleartext', isCorrect: false },
        { id: 'opt-e4-3', text: 'QoS 1 only works over UDP sockets', isCorrect: false },
        { id: 'opt-e4-4', text: 'QoS 0 requires persistent 2-way TCP keepalive handshakes every 50ms', isCorrect: false },
      ]),
      weight: 1.3,
      explanation: 'QoS 0 uses minimal network energy, whereas QoS 1 adds acknowledgement handshakes.',
    },
    {
      domain: 'Embedded/IoT',
      skillId: 'skill-circuit-design',
      practiceSetId: setIot3.id,
      type: 'technical',
      questionType: 'mcq',
      prompt: 'Why are pull-up resistors required on both SDA and SCL lines of an I2C communication bus?',
      optionsJson: JSON.stringify([
        { id: 'opt-e5-1', text: 'I2C devices use open-drain/open-collector outputs that can only pull the lines low, requiring resistors to pull them high', isCorrect: true },
        { id: 'opt-e5-2', text: 'To act as low-pass anti-aliasing filters for analog signals', isCorrect: false },
        { id: 'opt-e5-3', text: 'To convert 12V automotive power down to 3.3V logic', isCorrect: false },
        { id: 'opt-e5-4', text: 'To prevent ESD shocks when plugging in USB cables', isCorrect: false },
      ]),
      weight: 1.3,
      explanation: 'Open drain lines cannot drive a logic HIGH, so external pull-up resistors restore the idle HIGH bus voltage.',
    },

    // ────────────── Quantitative Aptitude Sets ──────────────
    {
      domain: 'Quantitative Aptitude',
      skillId: 'skill-problem-solving',
      practiceSetId: setQuant1.id,
      type: 'aptitude',
      questionType: 'mcq',
      prompt: 'A retailer buys an item at ₹1,200 and marks it up by 40%. If they then offer a discount of 15% to a customer, what is the net profit percentage made on the cost price?',
      optionsJson: JSON.stringify([
        { id: 'opt-q1-1', text: '19.0%', isCorrect: true },
        { id: 'opt-q1-2', text: '25.0%', isCorrect: false },
        { id: 'opt-q1-3', text: '18.5%', isCorrect: false },
        { id: 'opt-q1-4', text: '21.0%', isCorrect: false },
      ]),
      weight: 1.0,
      explanation: 'Marked Price = 1200 * 1.40 = 1680. Selling Price = 1680 * 0.85 = 1428. Net profit = (1428 - 1200) / 1200 = 228 / 1200 = 19%.',
    },
    {
      domain: 'Quantitative Aptitude',
      skillId: 'skill-problem-solving',
      practiceSetId: setQuant1.id,
      type: 'aptitude',
      questionType: 'mcq',
      prompt: 'If the salary of an engineer is first increased by 20% and then decreased by 20%, what is the overall net change in the engineer salary?',
      optionsJson: JSON.stringify([
        { id: 'opt-q1-2a', text: '4% decrease', isCorrect: true },
        { id: 'opt-q1-2b', text: '0% (No change)', isCorrect: false },
        { id: 'opt-q1-2c', text: '2% decrease', isCorrect: false },
        { id: 'opt-q1-2d', text: '4% increase', isCorrect: false },
      ]),
      weight: 1.0,
      explanation: 'Net change = x + y + (xy/100) = 20 - 20 - (400/100) = -4% (a 4% decrease).',
    },
    {
      domain: 'Quantitative Aptitude',
      skillId: 'skill-problem-solving',
      practiceSetId: setQuant1.id,
      type: 'aptitude',
      questionType: 'mcq',
      prompt: 'A sum of ₹8,000 invested at compound interest compounded annually amounts to ₹9,261 in 3 years. What is the annual interest rate?',
      optionsJson: JSON.stringify([
        { id: 'opt-q1-3a', text: '5%', isCorrect: true },
        { id: 'opt-q1-3b', text: '6%', isCorrect: false },
        { id: 'opt-q1-3c', text: '4.5%', isCorrect: false },
        { id: 'opt-q1-3d', text: '7.5%', isCorrect: false },
      ]),
      weight: 1.0,
      explanation: 'A = P(1 + r/100)^3 => 9261/8000 = (1 + r/100)^3 => (21/20)^3 = (1 + r/100)^3 => 1 + r/100 = 1.05 => r = 5%.',
    },
    {
      domain: 'Quantitative Aptitude',
      skillId: 'skill-problem-solving',
      practiceSetId: setQuant2.id,
      type: 'aptitude',
      questionType: 'mcq',
      prompt: 'Two trains 140 m and 160 m long are running towards each other on parallel tracks at speeds of 60 km/h and 48 km/h respectively. How many seconds will they take to cross each other completely?',
      optionsJson: JSON.stringify([
        { id: 'opt-q2-1', text: '10 seconds', isCorrect: true },
        { id: 'opt-q2-2', text: '12 seconds', isCorrect: false },
        { id: 'opt-q2-3', text: '8 seconds', isCorrect: false },
        { id: 'opt-q2-4', text: '15 seconds', isCorrect: false },
      ]),
      weight: 1.0,
      explanation: 'Total distance = 140 + 160 = 300 m. Relative speed = 60 + 48 = 108 km/h = 108 * (5/18) = 30 m/s. Time = 300 / 30 = 10 seconds.',
    },
    {
      domain: 'Quantitative Aptitude',
      skillId: 'skill-problem-solving',
      practiceSetId: setQuant3.id,
      type: 'aptitude',
      questionType: 'mcq',
      prompt: 'A bag contains 5 red balls, 4 blue balls, and 3 green balls. If 2 balls are drawn at random without replacement, what is the probability that both balls are of the same color?',
      optionsJson: JSON.stringify([
        { id: 'opt-q3-1', text: '19/66', isCorrect: true },
        { id: 'opt-q3-2', text: '1/3', isCorrect: false },
        { id: 'opt-q3-3', text: '23/66', isCorrect: false },
        { id: 'opt-q3-4', text: '5/22', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'Total balls = 12. Total pairs = 12C2 = 66. Favorable = 5C2 (red) + 4C2 (blue) + 3C2 (green) = 10 + 6 + 3 = 19. Probability = 19/66.',
    },

    // ────────────── English Reading Section ──────────────
    {
      domain: 'English Reading',
      skillId: 'skill-communication',
      practiceSetId: setEnglishRead1.id,
      type: 'aptitude',
      questionType: 'mcq',
      passageText: 'The acceleration of automated machine intelligence across software development has redefined the baseline expectations of engineering competency. While rudimentary syntax generation and repetitive boilerplate code are increasingly delegated to generative language models, the premium on human discernment, system-level trade-off analysis, and security verification has surged dramatically. Modern developers are no longer evaluated solely on lines of code produced, but on their capacity to formulate rigorous problem constraints, orchestrate heterogeneous cloud services, and audit AI-generated code for silent edge-case vulnerabilities.',
      prompt: 'According to the passage, what is the primary consequence of AI-driven code generation on the software engineering profession?',
      optionsJson: JSON.stringify([
        { id: 'opt-er1-1', text: 'It shifts the evaluation metric toward problem formulation, system trade-off analysis, and security verification rather than rote syntax generation', isCorrect: true },
        { id: 'opt-er1-2', text: 'It renders all human software engineers obsolete within enterprise organizations', isCorrect: false },
        { id: 'opt-er1-3', text: 'It increases reliance on manual punch card programming systems', isCorrect: false },
        { id: 'opt-er1-4', text: 'It eliminates the need for unit testing and code review pipelines', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'The passage highlights that human discernment, constraint formulation, and security auditing have surged in importance.',
    },
    {
      domain: 'English Reading',
      skillId: 'skill-communication',
      practiceSetId: setEnglishRead1.id,
      type: 'aptitude',
      questionType: 'mcq',
      passageText: 'The acceleration of automated machine intelligence across software development has redefined the baseline expectations of engineering competency. While rudimentary syntax generation and repetitive boilerplate code are increasingly delegated to generative language models, the premium on human discernment, system-level trade-off analysis, and security verification has surged dramatically. Modern developers are no longer evaluated solely on lines of code produced, but on their capacity to formulate rigorous problem constraints, orchestrate heterogeneous cloud services, and audit AI-generated code for silent edge-case vulnerabilities.',
      prompt: 'As used in the passage, which word is closest in meaning to "discernment"?',
      optionsJson: JSON.stringify([
        { id: 'opt-er1-2', text: 'Judgment and critical perception', isCorrect: true },
        { id: 'opt-er1-2b', text: 'Careless disregard', isCorrect: false },
        { id: 'opt-er1-2c', text: 'Mechanical repetition', isCorrect: false },
        { id: 'opt-er1-2d', text: 'Arbitrary guessing', isCorrect: false },
      ]),
      weight: 1.0,
      explanation: 'Discernment refers to the ability to judge well and perceive keen insights.',
    },

    // ────────────── English Voice-Based Listening Section ──────────────
    {
      domain: 'English Listening',
      skillId: 'skill-communication',
      practiceSetId: setEnglishListen1.id,
      listeningPassageId: passage1.id,
      type: 'aptitude',
      questionType: 'mcq',
      prompt: 'According to the speaker in the audio lecture, what is the key tipping point where monolithic architectures encounter severe bottlenecks?',
      optionsJson: JSON.stringify([
        { id: 'opt-el1-1', text: 'When transaction volume exceeds ten million daily active requests, causing database lock contention and unified release delays', isCorrect: true },
        { id: 'opt-el1-2', text: 'When the development team upgrades to Python 3.12', isCorrect: false },
        { id: 'opt-el1-3', text: 'When the server switches from HTTP/2 to HTTP/1.1', isCorrect: false },
        { id: 'opt-el1-4', text: 'When all database indexes are deleted by administrators', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'The audio explicitly states: "as transaction volume surges past ten million daily active requests, database lock contention and unified release cycles become severe bottlenecks."',
    },
    {
      domain: 'English Listening',
      skillId: 'skill-communication',
      practiceSetId: setEnglishListen1.id,
      listeningPassageId: passage1.id,
      type: 'aptitude',
      questionType: 'mcq',
      prompt: 'What engineering challenges does the speaker emphasize must be rigorously handled when implementing decoupled microservices?',
      optionsJson: JSON.stringify([
        { id: 'opt-el1-2', text: 'Eventual consistency and distributed tracing across services', isCorrect: true },
        { id: 'opt-el1-2b', text: 'Manual punch card memory indexing', isCorrect: false },
        { id: 'opt-el1-2c', text: 'Disabling all asynchronous message queues', isCorrect: false },
        { id: 'opt-el1-2d', text: 'Forcing all services onto a single monolithic database server', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'The audio concludes: "engineers must rigorously handle eventual consistency and distributed tracing."',
    },
    {
      domain: 'English Listening',
      skillId: 'skill-communication',
      practiceSetId: setEnglishListen2.id,
      listeningPassageId: passage2.id,
      type: 'aptitude',
      questionType: 'mcq',
      prompt: 'In the keynote audio, how does Retrieval-Augmented Generation (RAG) prevent factual hallucinations in Large Language Models?',
      optionsJson: JSON.stringify([
        { id: 'opt-el2-1', text: 'By retrieving relevant document passages via vector cosine similarity and injecting them directly into the prompt context window', isCorrect: true },
        { id: 'opt-el2-2', text: 'By increasing the temperature hyperparameter to 2.0', isCorrect: false },
        { id: 'opt-el2-3', text: 'By removing all source citations from model responses', isCorrect: false },
        { id: 'opt-el2-4', text: 'By retraining the base neural network weights from scratch on every user query', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'The audio explains: "semantic cosine similarity retrieves the top relevant context passages and injects them into the model context window."',
    },
    // ────────────── English Listening Passage 3 ──────────────
    {
      domain: 'English Listening',
      skillId: 'skill-communication',
      practiceSetId: setEnglishListen1.id,
      listeningPassageId: passage3.id,
      type: 'aptitude',
      questionType: 'mcq',
      prompt: 'According to the lecture audio on edge infrastructure, what major benefit does local telemetry pre-processing provide for networks?',
      optionsJson: JSON.stringify([
        { id: 'opt-el3-1', text: 'Saves over eighty percent of backbone network bandwidth and achieves sub-ten-millisecond latency', isCorrect: true },
        { id: 'opt-el3-2', text: 'Eliminates the need for any central database storage permanently', isCorrect: false },
        { id: 'opt-el3-3', text: 'Converts all IoT sensor data into human voice recordings', isCorrect: false },
        { id: 'opt-el3-4', text: 'Requires all devices to restart every fifteen minutes', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'The audio explains: "networks save over eighty percent of backbone bandwidth and achieve sub-ten-millisecond latency."',
    },
    {
      domain: 'English Listening',
      skillId: 'skill-system-design',
      practiceSetId: setEnglishListen1.id,
      listeningPassageId: passage3.id,
      type: 'aptitude',
      questionType: 'mcq',
      prompt: 'How does hash-based horizontal database sharding prevent single-node IO bottlenecks during high-throughput central writes?',
      optionsJson: JSON.stringify([
        { id: 'opt-el3-2', text: 'By distributing partition keys evenly across multiple physical database cluster nodes', isCorrect: true },
        { id: 'opt-el3-2b', text: 'By deleting all primary keys upon insert', isCorrect: false },
        { id: 'opt-el3-2c', text: 'By storing all records on a single flash drive', isCorrect: false },
        { id: 'opt-el3-2d', text: 'By disabling all write locks and allowing corrupted reads', isCorrect: false },
      ]),
      weight: 1.5,
      explanation: 'The lecture states: "hash-based horizontal sharding prevents single-node IO bottlenecks by distributing partition keys evenly across physical clusters."',
    },
  ];

  for (const q of allQuestions) {
    await prisma.question.create({ data: q });
  }

  // 11. Seed Historical Assessment Attempts for Demo Student (Satyam Singh)
  if (userDemo.studentProfile) {
    const demoStudentId = userDemo.studentProfile.id;

    // Past attempt 1: Full-Stack Web Set 1 (Initial attempt - 82%)
    await prisma.assessmentAttempt.create({
      data: {
        studentId: demoStudentId,
        practiceSetId: setWeb1.id,
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
          {
            prompt: 'Explain the mechanism of React Virtual DOM Reconciliation.',
            questionType: 'written',
            userAnswer: 'React maintains a Virtual DOM tree representation in memory. When state updates, it generates a new tree and uses a heuristic O(n) diffing algorithm in the Fiber reconciler to compute minimal DOM mutations.',
            score: 1.8,
            maxScore: 2.0,
            aiFeedback: 'AI-Evaluated (90%): Excellent architectural explanation covering Fiber tree, O(n) heuristic diffing, and key props.',
          },
        ]),
        skillBreakdownJson: JSON.stringify([
          { skillId: 'skill-react', skillName: 'React.js', previousScore: 65, newScore: 80, delta: 15 },
        ]),
      },
    });

    // Past attempt 2: Full-Stack Web Set 1 (Retake attempt - 95%)
    await prisma.assessmentAttempt.create({
      data: {
        studentId: demoStudentId,
        practiceSetId: setWeb1.id,
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
          {
            prompt: 'What is the primary benefit of React Server Components (RSC)?',
            questionType: 'mcq',
            userAnswer: 'Zero bundle size on the client for server-only dependencies and direct database access',
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

    // Past attempt 3: Quantitative Aptitude Set 1 (88%)
    await prisma.assessmentAttempt.create({
      data: {
        studentId: demoStudentId,
        practiceSetId: setQuant1.id,
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

    // Past attempt 4: English Listening Set 1 (78%)
    await prisma.assessmentAttempt.create({
      data: {
        studentId: demoStudentId,
        practiceSetId: setEnglishListen1.id,
        startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000),
        timeSpentSeconds: 480,
        score: 78.0,
        passed: true,
        answersJson: JSON.stringify({
          'opt-el1-1': 'opt-el1-1',
        }),
        aiGradingNotesJson: JSON.stringify([
          {
            prompt: 'According to the speaker in the audio lecture, what is the key tipping point where monolithic architectures encounter severe bottlenecks?',
            questionType: 'mcq',
            userAnswer: 'When transaction volume exceeds ten million daily active requests',
            isCorrect: true,
            score: 1.5,
            maxScore: 1.5,
            explanation: 'Correct choice!',
          },
        ]),
        skillBreakdownJson: JSON.stringify([
          { skillId: 'skill-communication', skillName: 'Technical Communication', previousScore: 60, newScore: 75, delta: 15 },
        ]),
      },
    });
  }

  // 12. Seed Published Portfolio Websites & Visitor Messages for Satyam Singh & Rahul Verma
  if (userDemo.studentProfile) {
    const portfolioDemo = await prisma.portfolioWebsite.create({
      data: {
        studentId: userDemo.studentProfile.id,
        slug: 'satyam-singh',
        status: 'PUBLISHED',
        theme: 'teal_dark',
        enableBot: true,
        headline: 'Crafting resilient distributed web systems & vector intelligence platforms',
        subheadline: 'Hi, I am Satyam Singh — Computer Science undergraduate at Delhi Technological University. Specialized in high-throughput TypeScript backends, modern React interfaces, and production-grade software architectures.',
        heroCtaText: 'Explore Featured Projects',
        heroCtaLink: '#projects',
        heroImageUrl: userDemo.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        servicesJson: JSON.stringify([
          {
            icon: 'Code2',
            title: 'Full-Stack Web Architecture',
            description: 'Building end-to-end web applications with modern reactive UI, type-safe API contracts, and robust state management.',
          },
          {
            icon: 'Cpu',
            title: 'Distributed Systems & Microservices',
            description: 'Designing low-latency backend microservices with ACID database transactions, caching strategies, and message queues.',
          },
          {
            icon: 'Brain',
            title: 'Applied AI & Vector Engines',
            description: 'Developing mathematical vector matching algorithms, RAG knowledge retrieval, and intelligent assistant integrations.',
          },
        ]),
        projectsJson: JSON.stringify([
          {
            id: 'proj-demo-1',
            title: 'SkillBridge — Academia-Industry Collaboration Platform',
            description: 'Enterprise full-stack collaboration platform featuring an authoritative vector matching engine, ATS resume generation, and verified skill calibration.',
            tags: ['React', 'TypeScript', 'Node.js', 'Prisma', 'TailwindCSS'],
            thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
            githubUrl: 'https://github.com/satyamsingh/skillbridge',
            demoUrl: 'https://skillbridge.dev',
          },
          {
            id: 'proj-demo-2',
            title: 'HyperCache — Distributed In-Memory Key-Value Store',
            description: 'Engineered an in-memory caching engine in C++ with LRU eviction policies, async replication, and thread-safe concurrent read/write locks.',
            tags: ['C++', 'Concurrency', 'Sockets', 'Benchmarking'],
            thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
            githubUrl: 'https://github.com/satyamsingh/hypercache',
          },
          {
            id: 'proj-demo-3',
            title: 'Autonomous Telemetry Pipeline & Observability Dashboard',
            description: 'Real-time metrics streaming pipeline processing 50k events/sec with automated anomaly detection and Prometheus alerts.',
            tags: ['Docker', 'Grafana', 'TypeScript', 'WebSockets'],
            thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80',
            githubUrl: 'https://github.com/satyamsingh/telemetry-pipeline',
          },
        ]),
        aboutBio: 'Passionate Computer Science engineering undergraduate at Delhi Technological University with strong foundational expertise in Full-Stack web architecture, distributed systems, and applied machine learning. Experienced in designing resilient TypeScript backend microservices, modern React interfaces, and vector matching mathematical engines. Actively building open-source projects and eager to collaborate on high-impact scalable engineering challenges.',
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

  if (userStudent1.studentProfile) {
    await prisma.portfolioWebsite.create({
      data: {
        studentId: userStudent1.studentProfile.id,
        slug: 'rahul-verma',
        status: 'PUBLISHED',
        theme: 'indigo_creative',
        enableBot: true,
        headline: 'Designing high-converting UI components & robust web apps',
        subheadline: 'Hi, I am Rahul Verma — engineering student at VIT. Passionate about React, TypeScript, design tokens, and modern micro-interactions.',
        heroCtaText: 'View My Work',
        heroCtaLink: '#projects',
        heroImageUrl: userStudent1.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
        servicesJson: JSON.stringify([
          {
            icon: 'Code2',
            title: 'Frontend React Architecture',
            description: 'Building accessible, fluid web applications with React 18, TypeScript, and TailwindCSS.',
          },
          {
            icon: 'Layers',
            title: 'Design Systems & Tokens',
            description: 'Crafting responsive UI components with WCAG AA compliance and light/dark theme variables.',
          },
          {
            icon: 'Zap',
            title: 'Fast Prototyping & Web APIs',
            description: 'Integrating RESTful backends, auth flows, and real-time state synchronization.',
          },
        ]),
        projectsJson: JSON.stringify([
          {
            id: 'proj-rahul-1',
            title: 'FlowState — Interactive Kanban & Sprint Tracker',
            description: 'Responsive project management tool featuring drag-and-drop task boards, dynamic tag filters, and team collaboration.',
            tags: ['React', 'TypeScript', 'TailwindCSS'],
            thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
            githubUrl: 'https://github.com/rahul-verma-dev/flowstate',
          },
        ]),
        aboutBio: 'Frontend developer and TypeScript enthusiast at VIT building accessible web applications with clean design tokens.',
        skillsJson: JSON.stringify(['React.js', 'TypeScript', 'TailwindCSS', 'Figma', 'Node.js', 'Git']),
        statsJson: JSON.stringify([
          { label: 'Projects Shipped', value: '4+', subtext: 'Live on Web' },
          { label: 'Verified Certifications', value: '2', subtext: 'NPTEL' },
          { label: 'Domain Skill Match', value: '88%', subtext: 'Full-Stack Web' },
        ]),
        contactEmail: 'rahul.verma@vit.edu',
        socialsJson: JSON.stringify({
          github: 'https://github.com/rahul-verma-dev',
          linkedin: 'https://linkedin.com/in/rahulverma-vit',
          email: 'rahul.verma@vit.edu',
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
  }

  // 12. Seed Academic Opportunities
  const academicOps = [
    {
      id: 'opp-1',
      type: 'fdp',
      title: 'AICTE-HCL Faculty Development Program: Applied GenAI & LLM Architecture',
      description: 'A 5-day national immersion workshop for academicians to bridge industry LLM practices with university curricula. Includes hands-on GPU labs and syllabus modernization kits.',
      postedBy: 'HCLTech Innovation Labs & AICTE',
      deadline: '2026-09-30',
      status: 'OPEN',
    },
    {
      id: 'opp-2',
      type: 'research',
      title: 'Joint Industry-Academia Research: High-Throughput Edge AI for Autonomous Systems',
      description: 'Collaborative grant offering ₹15 Lakhs funding and compute credits for university researchers partnering with TechCorp Labs on edge inference acceleration.',
      postedBy: 'TechCorp Labs',
      deadline: '2026-10-15',
      status: 'OPEN',
    },
  ];

  for (const op of academicOps) {
    await prisma.academicOpportunity.create({ data: op });
  }

  // 13. Seed Curated Learning Resources Catalog
  const { seedDefaultLearningResources } = await import('../server/src/services/learningResourceService.js');
  await seedDefaultLearningResources();

  // 14. Seed In-App Notifications for Demo Students
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

  console.log('✅ Seed completed successfully with Practice Sets, Coding Problems, Learning Resources, and Notifications!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
