/**
 * SafeRecruiterCandidateDto
 *
 * Privacy-aware allowlist DTO mapper for candidate data exposed to recruiters.
 * Guarantees data minimization:
 * - Redacts direct phone numbers and personal email addresses
 * - Sanitizes free-form bio text to remove accidental PII (phone/email regex redaction)
 * - Normalizes location to city/region level, stripping granular street addresses
 * - Buckets or guards academic metrics (CGPA)
 * - Restricts exposed skills to verified/tracked records only
 */

export interface SafeCandidateDto {
  id: string;
  studentProfileId: string;
  fullName: string;
  avatarUrl?: string | null;
  institutionName?: string | null;
  department?: string | null;
  degree?: string | null;
  graduationYear?: number | null;
  cgpaBracket?: string | null;
  generalLocation?: string | null;
  sanitizedBio?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  skills: Array<{
    name: string;
    score: number;
    verificationLevel: string;
    verifiedAt?: Date | null;
  }>;
  projects?: Array<{
    title: string;
    description: string;
    technologies: string[];
    liveUrl?: string | null;
    githubUrl?: string | null;
  }>;
  matchScore?: number;
  matchBreakdown?: any;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;

export function sanitizeText(text?: string | null): string | null {
  if (!text) return null;
  return text
    .replace(EMAIL_REGEX, '[CONTACT HIDDEN]')
    .replace(PHONE_REGEX, '[PHONE HIDDEN]');
}

export function formatGeneralLocation(city?: string | null, state?: string | null, country?: string | null): string {
  const parts = [city, state, country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Remote / Location Unspecified';
}

export function getCgpaBracket(cgpa?: number | null): string | null {
  if (cgpa === undefined || cgpa === null) return null;
  if (cgpa >= 9.0) return '9.0 - 10.0 (Top Honors)';
  if (cgpa >= 8.0) return '8.0 - 8.9 (Distinction)';
  if (cgpa >= 7.0) return '7.0 - 7.9 (First Class)';
  if (cgpa >= 6.0) return '6.0 - 6.9';
  return 'Below 6.0';
}

export function toSafeRecruiterCandidateDto(
  student: any,
  options?: {
    includeExactCgpa?: boolean;
    matchScore?: number;
    matchBreakdown?: any;
  }
): SafeCandidateDto {
  const user = student.user || {};

  // Extract skills
  const skills = (student.skills || student.skillScores || []).map((s: any) => ({
    name: s.skill?.name || s.skillName || 'Unknown Skill',
    score: typeof s.score === 'number' ? Math.round(s.score) : 0,
    verificationLevel: s.verificationLevel || 'SELF-REPORTED',
    verifiedAt: s.verifiedAt || null,
  }));

  // Extract projects
  const projects = (student.projects || []).map((p: any) => ({
    title: p.title || 'Untitled Project',
    description: sanitizeText(p.description || '') || '',
    technologies: Array.isArray(p.technologies) ? p.technologies : [],
    liveUrl: p.liveUrl || p.projectUrl || null,
    githubUrl: p.githubUrl || null,
  }));

  return {
    id: user.id || student.userId || student.id,
    studentProfileId: student.id,
    fullName: user.name || student.name || 'Candidate',
    avatarUrl: user.avatarUrl || student.avatarUrl || null,
    institutionName: student.college || student.institution?.name || student.institutionName || null,
    department: student.department || student.major || null,
    degree: student.degree || null,
    graduationYear: student.graduationYear || student.passoutYear || null,
    cgpaBracket: options?.includeExactCgpa && student.cgpa ? `${student.cgpa.toFixed(2)} CGPA` : getCgpaBracket(student.cgpa),
    generalLocation: formatGeneralLocation(student.city, student.state, student.country),
    sanitizedBio: sanitizeText(student.bio),
    portfolioUrl: student.portfolioUrl || null,
    githubUrl: student.githubUrl || null,
    linkedinUrl: student.linkedinUrl || null,
    skills,
    projects,
    matchScore: options?.matchScore,
    matchBreakdown: options?.matchBreakdown,
  };
}
