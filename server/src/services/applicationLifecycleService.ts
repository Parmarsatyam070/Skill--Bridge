import { prisma } from '../config/prisma.js';
import { ApplicationStatus } from '../../../shared/types.js';

// Default stage delay threshold (days) before a neutral "Stage Delay" is flagged
export const DEFAULT_STAGE_DELAY_THRESHOLD_DAYS = 14;
export const DEFAULT_STAGE_DELAY_DAYS = DEFAULT_STAGE_DELAY_THRESHOLD_DAYS;

/**
 * Normalizes any legacy or canonical status string to its canonical uppercase representation.
 */
export function normalizeStatus(status: string): string {
  if (!status) return 'APPLIED';
  const clean = status.trim().toLowerCase();
  switch (clean) {
    case 'applied':
      return 'APPLIED';
    case 'under_review':
      return 'UNDER_REVIEW';
    case 'shortlisted':
      return 'SHORTLISTED';
    case 'assessment':
      return 'ASSESSMENT';
    case 'interview':
    case 'interview_scheduled':
      return 'INTERVIEW_SCHEDULED';
    case 'interview_completed':
      return 'INTERVIEW_COMPLETED';
    case 'offered':
      return 'OFFERED';
    case 'hired':
    case 'accepted':
      return 'ACCEPTED';
    case 'rejected':
      return 'REJECTED';
    case 'withdrawn':
      return 'WITHDRAWN';
    case 'on_hold':
      return 'ON_HOLD';
    default:
      return status.toUpperCase();
  }
}

/**
 * Converts a canonical status to the legacy lowercase status expected by older components.
 */
export function toLegacyStatus(canonical: string): ApplicationStatus {
  switch (canonical) {
    case 'APPLIED':
      return 'applied';
    case 'UNDER_REVIEW':
      return 'under_review';
    case 'SHORTLISTED':
      return 'shortlisted';
    case 'ASSESSMENT':
      return 'assessment';
    case 'INTERVIEW_SCHEDULED':
      return 'interview';
    case 'INTERVIEW_COMPLETED':
      return 'interview_completed';
    case 'OFFERED':
      return 'offered';
    case 'ACCEPTED':
      return 'hired';
    case 'REJECTED':
      return 'rejected';
    case 'WITHDRAWN':
      return 'withdrawn';
    case 'ON_HOLD':
      return 'on_hold';
    default:
      return (canonical.toLowerCase() as ApplicationStatus);
  }
}

/**
 * Human-readable labels for each canonical status.
 */
export function getStatusLabel(status: string): string {
  const norm = normalizeStatus(status);
  switch (norm) {
    case 'APPLIED':
      return 'Applied';
    case 'UNDER_REVIEW':
      return 'Under Review';
    case 'SHORTLISTED':
      return 'Shortlisted';
    case 'ASSESSMENT':
      return 'Assessment Round';
    case 'INTERVIEW_SCHEDULED':
      return 'Interview Scheduled';
    case 'INTERVIEW_COMPLETED':
      return 'Interview Completed';
    case 'OFFERED':
      return 'Offer Extended';
    case 'ACCEPTED':
      return 'Offer Accepted';
    case 'REJECTED':
      return 'Not Selected';
    case 'WITHDRAWN':
      return 'Withdrawn';
    case 'ON_HOLD':
      return 'On Hold';
    default:
      return norm;
  }
}

/**
 * Deterministic State Machine Transition Rules
 */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  APPLIED: ['UNDER_REVIEW', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW_SCHEDULED', 'REJECTED', 'WITHDRAWN', 'ON_HOLD'],
  UNDER_REVIEW: ['SHORTLISTED', 'ASSESSMENT', 'INTERVIEW_SCHEDULED', 'OFFERED', 'REJECTED', 'WITHDRAWN', 'ON_HOLD'],
  SHORTLISTED: ['ASSESSMENT', 'INTERVIEW_SCHEDULED', 'OFFERED', 'REJECTED', 'WITHDRAWN', 'ON_HOLD'],
  ASSESSMENT: ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'REJECTED', 'WITHDRAWN', 'ON_HOLD'],
  INTERVIEW_SCHEDULED: ['INTERVIEW_COMPLETED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'ON_HOLD'],
  INTERVIEW_COMPLETED: ['INTERVIEW_SCHEDULED', 'OFFERED', 'ACCEPTED', 'REJECTED', 'ON_HOLD'],
  OFFERED: ['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'ON_HOLD'],
  ACCEPTED: ['ON_HOLD'], // Terminal state; only administrative on-hold
  REJECTED: ['UNDER_REVIEW', 'SHORTLISTED'], // Administrative re-evaluation
  WITHDRAWN: [], // Final terminal state
  ON_HOLD: ['UNDER_REVIEW', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW_SCHEDULED', 'OFFERED', 'REJECTED', 'WITHDRAWN'],
};

/**
 * Validates whether a state transition is permitted for a given user role.
 */
export function validateStatusTransition(
  fromStatus: string,
  toStatus: string,
  userRole: string
): { valid: boolean; error?: string } {
  const normFrom = normalizeStatus(fromStatus);
  const normTo = normalizeStatus(toStatus);

  if (normFrom === normTo) {
    return { valid: true };
  }

  // Student permissions: may only withdraw an active application
  if (userRole === 'STUDENT') {
    if (normTo === 'WITHDRAWN') {
      const withdrawable = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW_SCHEDULED', 'ON_HOLD'];
      if (withdrawable.includes(normFrom)) {
        return { valid: true };
      }
      return { valid: false, error: `Cannot withdraw an application that is already in '${getStatusLabel(normFrom)}' stage.` };
    }
    return { valid: false, error: 'Students cannot modify recruitment stages. You may only withdraw your application.' };
  }

  // Institution Admin permissions: oversight role, cannot alter recruiter hiring decisions directly
  if (userRole === 'INSTITUTION_ADMIN') {
    return {
      valid: false,
      error: 'Institution Admins have read-only oversight of the application pipeline. Stage transitions must be initiated by the hiring recruiter or candidate.',
    };
  }

  // Recruiter permissions: follow state machine
  const allowed = ALLOWED_TRANSITIONS[normFrom] || [];
  if (!allowed.includes(normTo)) {
    return {
      valid: false,
      error: `Invalid stage transition from '${getStatusLabel(normFrom)}' to '${getStatusLabel(normTo)}'. Allowed next stages: ${allowed.map(getStatusLabel).join(', ')}.`,
    };
  }

  return { valid: true };
}

/**
 * Executes an application status transition with history logging and notifications.
 */
export async function transitionApplicationStatus(params: {
  applicationId: string;
  toStatus: string;
  user: { id: string; role: string; name?: string; studentProfileId?: string; industryProfileId?: string };
  notes?: string;
  interviewDetails?: any;
  hiredDetails?: any;
}) {
  const { applicationId, toStatus, user, notes, interviewDetails, hiredDetails } = params;

  // 1. Fetch current application with student and listing details
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      student: { include: { user: true } },
      internship: { include: { industry: true } },
      opportunity: { include: { company: true } },
    },
  });

  if (!app) {
    throw new Error('Application not found.');
  }

  // 2. Authorize actor
  if (user.role === 'STUDENT') {
    if (app.studentId !== user.studentProfileId) {
      throw new Error('Forbidden: You can only manage your own applications.');
    }
  } else if (user.role === 'INDUSTRY') {
    const oppCompanyId = app.opportunity?.companyId;
    const internCompanyId = app.internship?.industryId;
    const isOwner = user.industryProfileId && (user.industryProfileId === oppCompanyId || user.industryProfileId === internCompanyId);
    if (!isOwner) {
      throw new Error('Forbidden: You can only update candidates for opportunities posted by your company.');
    }
  } else if (user.role !== 'ADMIN') {
    throw new Error('Forbidden: Unauthorized role for status transition.');
  }

  // 3. Validate transition
  const normFrom = normalizeStatus(app.status);
  const normTo = normalizeStatus(toStatus);
  const validation = validateStatusTransition(normFrom, normTo, user.role);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 4. Prepare update payloads
  const legacyStatus = toLegacyStatus(normTo);
  const updateData: any = {
    status: legacyStatus, // Preserves legacy compatibility in database
  };

  if (interviewDetails) {
    updateData.interviewDetailsJson = JSON.stringify({
      ...interviewDetails,
      updatedAt: new Date().toISOString(),
    });
  }

  if (hiredDetails) {
    updateData.hiredDetailsJson = JSON.stringify({
      ...hiredDetails,
      hiredAt: new Date().toISOString(),
    });
  }

  // 5. Execute in database transaction: update app + write history record
  const result = await prisma.$transaction(async tx => {
    const updatedApp = await tx.application.update({
      where: { id: applicationId },
      data: updateData,
      include: {
        internship: { include: { industry: true } },
        opportunity: { include: { company: true } },
        resume: true,
      },
    });

    const historyRecord = await tx.applicationHistory.create({
      data: {
        applicationId,
        fromStatus: normFrom,
        toStatus: normTo,
        changedByUserId: user.id,
        changedByRole: user.role,
        notes: notes || null,
        metadataJson: interviewDetails || hiredDetails ? JSON.stringify({ interviewDetails, hiredDetails }) : null,
      },
    });

    return { updatedApp, historyRecord };
  });

  // 6. In-App Notifications for important stage transitions
  try {
    const studentUserId = app.student?.user?.id;
    const oppTitle = app.opportunity?.title || app.internship?.title || 'Requisition';
    const companyName = app.opportunity?.company?.companyName || app.internship?.industry?.companyName || 'Company';

    if (studentUserId) {
      let notifyTitle = '';
      let notifyMessage = '';
      let notifyType: 'INFO' | 'SUCCESS' | 'WARNING' | 'ACTION_REQUIRED' = 'INFO';

      switch (normTo) {
        case 'SHORTLISTED':
          notifyTitle = 'Application Shortlisted! 🎉';
          notifyMessage = `Congratulations! You have been shortlisted for ${oppTitle} at ${companyName}.`;
          notifyType = 'SUCCESS';
          break;
        case 'INTERVIEW_SCHEDULED':
          notifyTitle = 'Interview Scheduled 📅';
          notifyMessage = `An interview has been scheduled for ${oppTitle} with ${companyName}. Check your applications tab for timing.`;
          notifyType = 'ACTION_REQUIRED';
          break;
        case 'INTERVIEW_COMPLETED':
          notifyTitle = 'Interview Round Completed ✅';
          notifyMessage = `Your interview for ${oppTitle} at ${companyName} has been logged as completed.`;
          notifyType = 'INFO';
          break;
        case 'OFFERED':
          notifyTitle = 'Placement Offer Received! 🌟';
          notifyMessage = `Exciting news! ${companyName} has extended an offer for ${oppTitle}.`;
          notifyType = 'SUCCESS';
          break;
        case 'ACCEPTED':
          notifyTitle = 'Offer Acceptance Confirmed 🎓';
          notifyMessage = `Your acceptance for ${oppTitle} at ${companyName} has been recorded.`;
          notifyType = 'SUCCESS';
          break;
        case 'REJECTED':
          notifyTitle = 'Application Update';
          notifyMessage = `The hiring team for ${oppTitle} at ${companyName} has updated your status. Keep honing your skills!`;
          notifyType = 'INFO';
          break;
      }

      if (notifyTitle) {
        await prisma.inAppNotification.create({
          data: {
            userId: studentUserId,
            title: notifyTitle,
            message: notifyMessage,
            type: notifyType,
            link: '/student/applications',
          },
        });
      }
    }
  } catch (err) {
    console.error('Failed to dispatch in-app notification:', err);
  }

  return result;
}

/**
 * Calculates days spent in the current stage and checks for stage delays.
 */
export function calculateStageDuration(app: {
  appliedAt: Date | string;
  updatedAt: Date | string;
  status: string;
  history?: { createdAt: Date | string; toStatus: string }[];
  thresholdDays?: number;
}) {
  const threshold = app.thresholdDays || DEFAULT_STAGE_DELAY_DAYS;
  const now = new Date().getTime();

  // Find when the application entered its current stage
  let stageEnteredAt = new Date(app.updatedAt || app.appliedAt).getTime();
  if (app.history && app.history.length > 0) {
    const latest = [...app.history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    if (latest) {
      stageEnteredAt = new Date(latest.createdAt).getTime();
    }
  }

  const diffMs = Math.max(0, now - stageEnteredAt);
  const daysInCurrentStage = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const normStatus = normalizeStatus(app.status);

  // Terminal states are not considered "delayed"
  const isTerminal = ['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(normStatus);
  const isStageDelayed = !isTerminal && daysInCurrentStage > threshold;

  return {
    daysInCurrentStage,
    isStageDelayed,
    delayThresholdDays: threshold,
  };
}

/**
 * Retrieves applications for an Institution Admin with verified affiliation,
 * server-side filtering, pagination, KPI aggregation, and bottleneck delay indicators.
 */
export async function getInstitutionApplications(params: {
  institutionProfileId: string;
  page?: number;
  limit?: number;
  company?: string;
  opportunity?: string;
  department?: string;
  batch?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  thresholdDays?: number;
}) {
  const {
    institutionProfileId,
    page = 1,
    limit = 15,
    company,
    opportunity,
    department,
    batch,
    status,
    search,
    sortBy = 'appliedAt',
    sortOrder = 'desc',
    thresholdDays = DEFAULT_STAGE_DELAY_THRESHOLD_DAYS,
  } = params;

  // 1. Verify institution affiliation
  const instProfile = await prisma.institutionProfile.findUnique({
    where: { id: institutionProfileId },
  });

  if (!instProfile) {
    throw new Error('Institution profile not found.');
  }

  // Safe auto-link: link unlinked students with exact matching institution name
  try {
    await prisma.studentProfile.updateMany({
      where: {
        institutionProfileId: null,
        institution: { equals: instProfile.institutionName, mode: 'insensitive' },
      },
      data: {
        institutionProfileId: instProfile.id,
      },
    });
  } catch (err) {
    // Non-fatal if update fails
  }

  // 2. Identify all student IDs associated with this institution
  // Tight affiliation: explicit foreign key, or unlinked with exact matching institution name
  const affiliatedStudents = await prisma.studentProfile.findMany({
    where: {
      OR: [
        { institutionProfileId: instProfile.id },
        {
          institutionProfileId: null,
          institution: { equals: instProfile.institutionName, mode: 'insensitive' },
        },
      ],
    },
    select: { id: true, targetDomain: true, gradYear: true },
  });

  const studentIds = affiliatedStudents.map(s => s.id);
  if (studentIds.length === 0) {
    return {
      applications: [],
      kpis: {
        totalApplications: 0,
        activeApplications: 0,
        shortlistedCount: 0,
        interviewCount: 0,
        offeredCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        withdrawnCount: 0,
        stageDelayedCount: 0,
      },
      total: 0,
      page,
      limit,
      totalPages: 0,
      companies: [],
      departments: [],
      batches: [],
    };
  }

  // 3. Build dynamic Where clause for applications
  const where: any = {
    studentId: { in: studentIds },
  };

  if (status && status !== 'ALL') {
    const norm = normalizeStatus(status);
    const legacy = toLegacyStatus(norm);
    where.status = { in: [norm, legacy, norm.toLowerCase(), norm.toUpperCase()] };
  }

  if (batch) {
    where.student = { ...where.student, gradYear: batch };
  }

  if (department && department !== 'ALL') {
    where.student = { ...where.student, targetDomain: department };
  }

  if (search && search.trim().length > 0) {
    const query = search.trim();
    where.student = {
      ...where.student,
      user: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
    };
  }

  if (company && company !== 'ALL') {
    where.OR = [
      { opportunity: { company: { companyName: { contains: company, mode: 'insensitive' } } } },
      { internship: { industry: { companyName: { contains: company, mode: 'insensitive' } } } },
    ];
  }

  if (opportunity && opportunity !== 'ALL') {
    where.OR = [
      { opportunity: { title: { contains: opportunity, mode: 'insensitive' } } },
      { internship: { title: { contains: opportunity, mode: 'insensitive' } } },
    ];
  }

  // 4. Compute Institution-wide KPIs from all affiliated applications
  const allAffiliatedApps = await prisma.application.findMany({
    where: { studentId: { in: studentIds } },
    select: {
      id: true,
      status: true,
      appliedAt: true,
      updatedAt: true,
      history: { select: { createdAt: true, toStatus: true } },
    },
  });

  let activeCount = 0;
  let shortlistedCount = 0;
  let interviewCount = 0;
  let offeredCount = 0;
  let acceptedCount = 0;
  let rejectedCount = 0;
  let withdrawnCount = 0;
  let stageDelayedCount = 0;

  allAffiliatedApps.forEach(a => {
    const norm = normalizeStatus(a.status);
    const isDelayed = calculateStageDuration({ ...a, thresholdDays }).isStageDelayed;
    if (isDelayed) stageDelayedCount++;

    switch (norm) {
      case 'SHORTLISTED':
        shortlistedCount++;
        activeCount++;
        break;
      case 'INTERVIEW_SCHEDULED':
      case 'INTERVIEW_COMPLETED':
        interviewCount++;
        activeCount++;
        break;
      case 'OFFERED':
        offeredCount++;
        activeCount++;
        break;
      case 'ACCEPTED':
        acceptedCount++;
        break;
      case 'REJECTED':
        rejectedCount++;
        break;
      case 'WITHDRAWN':
        withdrawnCount++;
        break;
      default:
        activeCount++;
    }
  });

  const total = await prisma.application.count({ where });

  // 5. Fetch Paginated Applications
  const skip = (page - 1) * limit;
  const applications = await prisma.application.findMany({
    where,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      student: {
        include: {
          user: { select: { name: true, email: true, avatarUrl: true } },
        },
      },
      opportunity: {
        include: {
          company: { select: { id: true, companyName: true, website: true } },
        },
      },
      internship: {
        include: {
          industry: { select: { id: true, companyName: true, website: true } },
        },
      },
      resume: { select: { id: true, title: true } },
      history: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  // 6. Format Items
  const formattedItems = applications.map((app: any) => {
    const norm = normalizeStatus(app.status);
    const { daysInCurrentStage, isStageDelayed, delayThresholdDays } = calculateStageDuration({ ...app, thresholdDays });

    const compName = app.opportunity?.company?.companyName || app.internship?.industry?.companyName || 'Company';
    const compId = app.opportunity?.companyId || app.internship?.industryId;
    const oppTitle = app.opportunity?.title || app.internship?.title || 'Application';
    const oppType = app.opportunity?.type || 'INTERNSHIP';

    let matchTier: 'high' | 'medium' | 'low' = 'medium';
    if (app.matchScoreAtApply >= 80) matchTier = 'high';
    else if (app.matchScoreAtApply < 50) matchTier = 'low';

    return {
      id: app.id,
      studentId: app.studentId,
      studentName: app.student?.user?.name || 'Student',
      studentEmail: app.student?.user?.email || '',
      avatarUrl: app.student?.user?.avatarUrl,
      department: app.student?.targetDomain || 'General',
      gradYear: app.student?.gradYear,
      cgpa: app.student?.cgpa,
      companyId: compId,
      companyName: compName,
      companyLogo: null,
      opportunityId: app.opportunityId || app.internshipId,
      opportunityTitle: oppTitle,
      opportunityType: oppType,
      status: app.status as ApplicationStatus,
      canonicalStatus: norm,
      matchScoreAtApply: app.matchScoreAtApply,
      currentMatchScore: app.matchScoreAtApply,
      matchTier,
      appliedAt: app.appliedAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      daysInCurrentStage,
      isStageDelayed,
      delayThresholdDays,
      resumeId: app.resumeId,
      resumeFileName: app.resume?.title || 'Resume.pdf',
      interviewDetails: parseJsonSafe(app.interviewDetailsJson),
      hiredDetails: parseJsonSafe(app.hiredDetailsJson),
      latestNote: app.history && app.history.length > 0 ? app.history[0]?.notes : null,
    };
  });

  // 7. Collect Unique Filter Options from Database
  const companiesSet = new Set<string>();
  const departmentsSet = new Set<string>();
  const batchesSet = new Set<number>();

  affiliatedStudents.forEach(s => {
    if (s.targetDomain) departmentsSet.add(s.targetDomain);
    if (s.gradYear) batchesSet.add(s.gradYear);
  });

  applications.forEach((a: any) => {
    const cName = a.opportunity?.company?.companyName || a.internship?.industry?.companyName;
    if (cName) companiesSet.add(cName);
  });

  return {
    applications: formattedItems,
    kpis: {
      totalApplications: allAffiliatedApps.length,
      activeApplications: activeCount,
      shortlistedCount,
      interviewCount,
      offeredCount,
      acceptedCount,
      rejectedCount,
      withdrawnCount,
      stageDelayedCount,
    },
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    companies: Array.from(companiesSet).sort(),
    departments: Array.from(departmentsSet).sort(),
    batches: Array.from(batchesSet).sort((a, b) => b - a),
  };
}

/**
 * Retrieves full chronologically sorted timeline for an application.
 */
export async function getApplicationTimeline(applicationId: string) {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      history: { orderBy: { createdAt: 'asc' } },
      student: { include: { user: { select: { name: true, role: true } } } },
      internship: { include: { industry: true } },
      opportunity: { include: { company: true } },
    },
  });

  if (!app) {
    throw new Error('Application not found.');
  }

  const events: any[] = [];
  let previousTimestamp = new Date(app.appliedAt).getTime();

  // Initial submission event
  events.push({
    status: 'applied',
    canonicalStatus: 'APPLIED',
    label: 'Application Submitted',
    timestamp: app.appliedAt.toISOString(),
    actor: app.student?.user?.name || 'Candidate',
    actorRole: 'STUDENT',
    notes: app.coverNote ? `Cover Note: ${app.coverNote}` : 'Application received and logged.',
    durationInPreviousStageDays: 0,
  });

  // Recorded history transitions
  app.history.forEach(h => {
    const eventTime = new Date(h.createdAt).getTime();
    const diffDays = Math.max(0, Math.floor((eventTime - previousTimestamp) / (1000 * 60 * 60 * 24)));
    previousTimestamp = eventTime;

    const norm = normalizeStatus(h.toStatus);
    events.push({
      status: toLegacyStatus(norm),
      canonicalStatus: norm,
      label: getStatusLabel(norm),
      timestamp: h.createdAt.toISOString(),
      actor: h.changedByRole === 'STUDENT' ? 'Candidate' : h.changedByRole === 'INDUSTRY' ? 'Hiring Recruiter' : 'Platform System',
      actorRole: h.changedByRole,
      notes: h.notes,
      metadata: parseJsonSafe(h.metadataJson),
      durationInPreviousStageDays: diffDays,
    });
  });

  // If status moved but no history record exists (pre-Phase-1 legacy data), append current state
  const normCurrent = normalizeStatus(app.status);
  const hasCurrentInHistory = events.some(e => e.canonicalStatus === normCurrent);
  if (!hasCurrentInHistory && normCurrent !== 'APPLIED') {
    const eventTime = new Date(app.updatedAt).getTime();
    const diffDays = Math.max(0, Math.floor((eventTime - previousTimestamp) / (1000 * 60 * 60 * 24)));
    events.push({
      status: toLegacyStatus(normCurrent),
      canonicalStatus: normCurrent,
      label: getStatusLabel(normCurrent),
      timestamp: app.updatedAt.toISOString(),
      actor: 'Hiring Recruiter',
      actorRole: 'INDUSTRY',
      notes: parseJsonSafe<any>(app.interviewDetailsJson)?.meetingLink ? 'Interview scheduled.' : null,
      metadata: parseJsonSafe<any>(app.interviewDetailsJson) || parseJsonSafe<any>(app.hiredDetailsJson),
      durationInPreviousStageDays: diffDays,
    });
  }

  return {
    applicationId: app.id,
    currentStatus: normCurrent,
    timeline: events,
  };
}

function parseJsonSafe<T>(jsonStr: string | null | undefined): T | null {
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}
