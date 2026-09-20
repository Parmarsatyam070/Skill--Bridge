-- DropForeignKey
ALTER TABLE "Collaboration" DROP CONSTRAINT "Collaboration_institutionId_fkey";

-- AlterTable
ALTER TABLE "Collaboration" ALTER COLUMN "institutionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "InstitutionProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
