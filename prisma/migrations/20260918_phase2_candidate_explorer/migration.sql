-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "institutionProfileId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ApplicationHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "notes" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CandidateRecommendation" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "recommendedBy" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECOMMENDED',
    "batchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SavedCandidateFilter" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filtersJson" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedCandidateFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CandidateTag" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CandidateNote" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ApplicationHistory_applicationId_idx" ON "ApplicationHistory"("applicationId");
CREATE INDEX IF NOT EXISTS "ApplicationHistory_createdAt_idx" ON "ApplicationHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CandidateRecommendation_institutionId_opportunityId_candidateId_key" ON "CandidateRecommendation"("institutionId", "opportunityId", "candidateId");
CREATE INDEX IF NOT EXISTS "CandidateRecommendation_institutionId_idx" ON "CandidateRecommendation"("institutionId");
CREATE INDEX IF NOT EXISTS "CandidateRecommendation_opportunityId_idx" ON "CandidateRecommendation"("opportunityId");
CREATE INDEX IF NOT EXISTS "CandidateRecommendation_candidateId_idx" ON "CandidateRecommendation"("candidateId");
CREATE INDEX IF NOT EXISTS "CandidateRecommendation_batchId_idx" ON "CandidateRecommendation"("batchId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SavedCandidateFilter_institutionId_idx" ON "SavedCandidateFilter"("institutionId");
CREATE INDEX IF NOT EXISTS "SavedCandidateFilter_createdBy_idx" ON "SavedCandidateFilter"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CandidateTag_institutionId_candidateId_tag_key" ON "CandidateTag"("institutionId", "candidateId", "tag");
CREATE INDEX IF NOT EXISTS "CandidateTag_institutionId_idx" ON "CandidateTag"("institutionId");
CREATE INDEX IF NOT EXISTS "CandidateTag_candidateId_idx" ON "CandidateTag"("candidateId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CandidateNote_institutionId_idx" ON "CandidateNote"("institutionId");
CREATE INDEX IF NOT EXISTS "CandidateNote_candidateId_idx" ON "CandidateNote"("candidateId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentProfile_institutionProfileId_fkey') THEN
        ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_institutionProfileId_fkey" FOREIGN KEY ("institutionProfileId") REFERENCES "InstitutionProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ApplicationHistory_applicationId_fkey') THEN
        ALTER TABLE "ApplicationHistory" ADD CONSTRAINT "ApplicationHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CandidateRecommendation_institutionId_fkey') THEN
        ALTER TABLE "CandidateRecommendation" ADD CONSTRAINT "CandidateRecommendation_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "InstitutionProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CandidateRecommendation_opportunityId_fkey') THEN
        ALTER TABLE "CandidateRecommendation" ADD CONSTRAINT "CandidateRecommendation_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CandidateRecommendation_candidateId_fkey') THEN
        ALTER TABLE "CandidateRecommendation" ADD CONSTRAINT "CandidateRecommendation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SavedCandidateFilter_institutionId_fkey') THEN
        ALTER TABLE "SavedCandidateFilter" ADD CONSTRAINT "SavedCandidateFilter_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "InstitutionProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CandidateTag_institutionId_fkey') THEN
        ALTER TABLE "CandidateTag" ADD CONSTRAINT "CandidateTag_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "InstitutionProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CandidateTag_candidateId_fkey') THEN
        ALTER TABLE "CandidateTag" ADD CONSTRAINT "CandidateTag_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CandidateNote_institutionId_fkey') THEN
        ALTER TABLE "CandidateNote" ADD CONSTRAINT "CandidateNote_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "InstitutionProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CandidateNote_candidateId_fkey') THEN
        ALTER TABLE "CandidateNote" ADD CONSTRAINT "CandidateNote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
