import { z } from 'zod';

export const RoleEnum = z.enum(['STUDENT', 'INDUSTRY', 'ACADEMICIAN', 'INSTITUTION_ADMIN']);

export const LoginSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  identifier: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterStudentSchema = z.object({
  role: z.literal('STUDENT'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  institution: z.string().min(2, 'Institution is required'),
  targetDomain: z.string().min(2, 'Target domain is required'),
  cgpa: z.number().min(0).max(10).optional(),
  bio: z.string().optional(),
});

export const RegisterIndustrySchema = z.object({
  role: z.literal('INDUSTRY'),
  companyName: z.string().min(2, 'Company name is required'),
  email: z.string().email('Please enter a corporate email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  companySize: z.string().optional(),
  industrySector: z.string().min(2, 'Industry sector is required'),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
});

export const RegisterAcademicianSchema = z.object({
  role: z.literal('ACADEMICIAN'),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter an institutional email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  institution: z.string().min(2, 'Institution name is required'),
  department: z.string().min(2, 'Department is required'),
  designation: z.string().min(2, 'Designation is required'),
});

export const RegisterAdminSchema = z.object({
  role: z.literal('INSTITUTION_ADMIN'),
  institutionName: z.string().min(2, 'Institution name is required'),
  email: z.string().email('Please enter an admin email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at semantic least 6 characters'),
  adminDesignation: z.string().min(2, 'Admin designation is required'),
});

export const RegisterSchema = z.discriminatedUnion('role', [
  RegisterStudentSchema,
  RegisterIndustrySchema,
  RegisterAcademicianSchema,
  RegisterAdminSchema,
]);

export const ForgotPasswordSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  identifier: z.string().optional(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().optional(),
  otp: z.string().optional(),
  identifier: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const SaveStudentProfileSchema = z.object({
  name: z.string().optional(),
  headline: z.string().optional(),
  location: z.string().optional(),
  institution: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  resumeFileName: z.string().optional(),
  technicalSkills: z.array(z.string()).optional(),
  softSkills: z.array(z.string()).optional(),
  experiences: z.array(z.any()).optional(),
  educations: z.array(z.any()).optional(),
  projects: z.array(z.any()).optional(),
  certificates: z.array(z.any()).optional(),
  responsibilities: z.array(z.any()).optional(),
  achievements: z.array(z.any()).optional(),
  socials: z.record(z.string(), z.string()).optional(),
});

export const PostInternshipSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  requiredSkills: z.array(
    z.object({
      skillId: z.string(),
      weight: z.number().min(1).max(5),
      minScore: z.number().min(0).max(100),
    })
  ).min(1, 'At least one required skill must be selected'),
  stipend: z.string().min(1, 'Stipend details required (e.g. ₹25,000/mo or Unpaid)'),
  location: z.string().min(2, 'Location is required'),
  workMode: z.enum(['REMOTE', 'HYBRID', 'ON_SITE']),
});

export const ApplyInternshipSchema = z.object({
  internshipId: z.string(),
  resumeId: z.string().optional(),
  coverNote: z.string().max(1000).optional(),
});

export const AssessmentSubmitSchema = z.object({
  domain: z.string(),
  answers: z.record(z.string(), z.string()), // questionId -> selectedOptionId
});

export const UpdateProfileSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  targetDomain: z.string().optional(),
  cgpa: z.number().min(0).max(10).optional(),
  gradYear: z.number().optional(),
  githubUsername: z.string().optional(),
  linkedinUrl: z.string().optional(),
});

export const PostAcademicOpportunitySchema = z.object({
  type: z.enum(['fdp', 'research', 'industrial_training']),
  title: z.string().min(5, 'Title is required'),
  description: z.string().min(20, 'Description is required'),
  deadline: z.string().optional(),
});

export const AddStudentDomainSchema = z.object({
  domainId: z.string().min(1, 'Domain ID or name is required'),
  initialSkillRatings: z.array(
    z.object({
      skillId: z.string(),
      score: z.number().min(0).max(100),
    })
  ).optional().default([]),
});

export const SavePortfolioWebsiteSchema = z.object({
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and dashes').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  theme: z.enum(['teal_dark', 'slate_clean', 'indigo_creative', 'cyber_amber']).optional(),
  enableBot: z.boolean().optional(),
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  heroCtaText: z.string().optional(),
  heroCtaLink: z.string().optional(),
  heroImageUrl: z.string().optional(),
  services: z.array(
    z.object({
      icon: z.string(),
      title: z.string(),
      description: z.string(),
    })
  ).optional(),
  projects: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
      thumbnail: z.string().optional(),
      githubUrl: z.string().optional(),
      demoUrl: z.string().optional(),
    })
  ).optional(),
  aboutBio: z.string().optional(),
  aboutImageUrl: z.string().optional(),
  skills: z.array(z.string()).optional(),
  stats: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      subtext: z.string().optional(),
    })
  ).optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  socials: z.object({
    github: z.string().optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    website: z.string().optional(),
    email: z.string().optional(),
  }).optional(),
  sectionsOrder: z.array(z.string()).optional(),
  sectionsVisibility: z.record(z.string(), z.boolean()).optional(),
  aiWizardConfig: z.record(z.string(), z.any()).optional(),
});

export const PortfolioContactMessageSchema = z.object({
  senderName: z.string().min(2, 'Name is required'),
  senderEmail: z.string().email('Valid email is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const AIWizardGenerateSchema = z.object({
  targetRole: z.string().min(2, 'Target role is required'),
  tone: z.enum(['Professional', 'Creative', 'Minimal', 'Technical']),
  selectedProjectIds: z.array(z.string()).optional().default([]),
  colorPreference: z.string().optional(),
});

export const StartAssessmentAttemptSchema = z.object({
  practiceSetId: z.string(),
});

export const SubmitPracticeSetSchema = z.object({
  practiceSetId: z.string(),
  timeSpentSeconds: z.number().optional().default(0),
  answers: z.record(z.string(), z.string()), // questionId -> answer string (optionId for mcq, text for written)
});

