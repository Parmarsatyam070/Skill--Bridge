-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "opportunityId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "internshipId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StudentSkillScore" ADD COLUMN     "verificationEvidenceJson" TEXT,
ADD COLUMN     "verificationLevel" TEXT NOT NULL DEFAULT 'SELF-REPORTED',
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SkillAlias" (
    "id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'JOB',
    "industry" TEXT,
    "location" TEXT NOT NULL DEFAULT 'Remote',
    "remote" BOOLEAN NOT NULL DEFAULT true,
    "workMode" TEXT NOT NULL DEFAULT 'REMOTE',
    "experienceLevel" TEXT NOT NULL DEFAULT 'ENTRY',
    "educationRequirements" TEXT,
    "stipend" TEXT,
    "duration" TEXT,
    "applicationDeadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunitySkill" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "skillName" TEXT,
    "proficiencyLevel" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "weight" INTEGER NOT NULL DEFAULT 3,
    "minScore" DOUBLE PRECISION NOT NULL DEFAULT 70.0,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OpportunitySkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateMatch" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "eligibility" BOOLEAN NOT NULL DEFAULT true,
    "ineligibilityReason" TEXT,
    "algorithmVersion" TEXT NOT NULL DEFAULT 'v2.0-7factor',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "breakdownJson" TEXT NOT NULL,
    "matchedSkillsJson" TEXT NOT NULL,
    "missingSkillsJson" TEXT NOT NULL,
    "strengthsJson" TEXT NOT NULL,
    "weaknessesJson" TEXT NOT NULL,
    "recommendationsJson" TEXT NOT NULL,
    "explanation" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedOpportunity" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 45,
    "passingScorePct" DOUBLE PRECISION NOT NULL DEFAULT 70.0,
    "requiredSkillsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "skillId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'MCQ',
    "prompt" TEXT NOT NULL,
    "optionsJson" TEXT,
    "rubric" TEXT,
    "starterCode" TEXT,
    "testCasesJson" TEXT,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSubmission" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "technicalScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "skillScoreBreakdownJson" TEXT,
    "answersJson" TEXT NOT NULL,
    "feedbackJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT,
    "candidateId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TECHNICAL',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "questionsJson" TEXT,
    "transcriptJson" TEXT,
    "evaluationJson" TEXT,
    "overallScore" DOUBLE PRECISION,
    "recommendation" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collaboration" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'WORKSHOP',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skillsJson" TEXT,
    "targetDepartment" TEXT,
    "proposedDate" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "initiatedByRole" TEXT NOT NULL DEFAULT 'INDUSTRY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collaboration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaborationMessage" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollaborationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillDemandSnapshot" (
    "id" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'technical',
    "demandCount" INTEGER NOT NULL DEFAULT 0,
    "demandPct" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "trendDirection" TEXT NOT NULL DEFAULT 'STABLE',
    "difficultyRating" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "source" TEXT NOT NULL DEFAULT 'SkillBridge Internal Demand',
    "snapshotDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillDemandSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadataJson" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SkillAlias_alias_key" ON "SkillAlias"("alias");

-- CreateIndex
CREATE INDEX "SkillAlias_alias_idx" ON "SkillAlias"("alias");

-- CreateIndex
CREATE INDEX "Opportunity_companyId_idx" ON "Opportunity"("companyId");

-- CreateIndex
CREATE INDEX "Opportunity_type_idx" ON "Opportunity"("type");

-- CreateIndex
CREATE INDEX "Opportunity_status_idx" ON "Opportunity"("status");

-- CreateIndex
CREATE INDEX "Opportunity_createdAt_idx" ON "Opportunity"("createdAt");

-- CreateIndex
CREATE INDEX "OpportunitySkill_opportunityId_idx" ON "OpportunitySkill"("opportunityId");

-- CreateIndex
CREATE INDEX "OpportunitySkill_skillId_idx" ON "OpportunitySkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunitySkill_opportunityId_skillId_key" ON "OpportunitySkill"("opportunityId", "skillId");

-- CreateIndex
CREATE INDEX "CandidateMatch_opportunityId_score_idx" ON "CandidateMatch"("opportunityId", "score");

-- CreateIndex
CREATE INDEX "CandidateMatch_candidateId_idx" ON "CandidateMatch"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateMatch_candidateId_opportunityId_key" ON "CandidateMatch"("candidateId", "opportunityId");

-- CreateIndex
CREATE INDEX "SavedOpportunity_studentId_idx" ON "SavedOpportunity"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedOpportunity_studentId_opportunityId_key" ON "SavedOpportunity"("studentId", "opportunityId");

-- CreateIndex
CREATE INDEX "Assessment_opportunityId_idx" ON "Assessment"("opportunityId");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_assessmentId_idx" ON "AssessmentQuestion"("assessmentId");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_assessmentId_studentId_idx" ON "AssessmentSubmission"("assessmentId", "studentId");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_studentId_idx" ON "AssessmentSubmission"("studentId");

-- CreateIndex
CREATE INDEX "InterviewSession_opportunityId_idx" ON "InterviewSession"("opportunityId");

-- CreateIndex
CREATE INDEX "InterviewSession_candidateId_idx" ON "InterviewSession"("candidateId");

-- CreateIndex
CREATE INDEX "InterviewSession_recruiterId_idx" ON "InterviewSession"("recruiterId");

-- CreateIndex
CREATE INDEX "InterviewSession_status_idx" ON "InterviewSession"("status");

-- CreateIndex
CREATE INDEX "Collaboration_institutionId_idx" ON "Collaboration"("institutionId");

-- CreateIndex
CREATE INDEX "Collaboration_companyId_idx" ON "Collaboration"("companyId");

-- CreateIndex
CREATE INDEX "Collaboration_status_idx" ON "Collaboration"("status");

-- CreateIndex
CREATE INDEX "CollaborationMessage_collaborationId_idx" ON "CollaborationMessage"("collaborationId");

-- CreateIndex
CREATE INDEX "SkillDemandSnapshot_demandCount_idx" ON "SkillDemandSnapshot"("demandCount");

-- CreateIndex
CREATE INDEX "SkillDemandSnapshot_snapshotDate_idx" ON "SkillDemandSnapshot"("snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "SkillDemandSnapshot_skillName_snapshotDate_key" ON "SkillDemandSnapshot"("skillName", "snapshotDate");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "Application_studentId_idx" ON "Application"("studentId");

-- CreateIndex
CREATE INDEX "Application_internshipId_idx" ON "Application"("internshipId");

-- CreateIndex
CREATE INDEX "Application_opportunityId_idx" ON "Application"("opportunityId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillAlias" ADD CONSTRAINT "SkillAlias_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "IndustryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunitySkill" ADD CONSTRAINT "OpportunitySkill_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunitySkill" ADD CONSTRAINT "OpportunitySkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateMatch" ADD CONSTRAINT "CandidateMatch_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateMatch" ADD CONSTRAINT "CandidateMatch_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "IndustryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "InstitutionProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "IndustryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationMessage" ADD CONSTRAINT "CollaborationMessage_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationMessage" ADD CONSTRAINT "CollaborationMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
