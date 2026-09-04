import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RoleGate } from './components/RoleGate';
import { ConsoleLayout } from './components/ConsoleLayout';

// Public Campus Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { PublicPortfolioPage } from './pages/PublicPortfolioPage';
import { PublicPortfolioSite } from './pages/portfolio/PublicPortfolioSite';
import { PortfolioBuilderPage } from './pages/portfolio/PortfolioBuilderPage';

// User Profile Dashboard & Resume Builder
import { CareerProfileDashboard } from './pages/profile/CareerProfileDashboard';
import { CareerResumeBuilder } from './pages/resumes/CareerResumeBuilder';

// Student Console Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { SkillProfilePage } from './pages/student/SkillProfilePage';
import { AssessmentPage } from './pages/student/AssessmentPage';
import { ReportCardPage } from './pages/student/ReportCardPage';
import { InternshipsPage } from './pages/student/InternshipsPage';
import { CoursesPage } from './pages/student/CoursesPage';
import { LearningResourcesPage } from './pages/student/LearningResourcesPage';
import { StudentPortfolioEdit } from './pages/student/StudentPortfolioEdit';

// Industry Console Pages
import { IndustryDashboard } from './pages/industry/IndustryDashboard';
import { PostJobPage } from './pages/industry/PostJobPage';
import { ApplicantsPage } from './pages/industry/ApplicantsPage';

// Academician Console Pages
import { AcademicianDashboard } from './pages/academician/AcademicianDashboard';
import { AcademicOpportunitiesPage } from './pages/academician/AcademicOpportunitiesPage';

// Institution Console Pages
import { InstitutionDashboard } from './pages/institution/InstitutionDashboard';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Campus Theme Pages & Shareable Personal Portfolios */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route path="/p/:username" element={<PublicPortfolioSite />} />
        <Route path="/portfolio/:studentId" element={<PublicPortfolioSite />} />

        {/* User Profile Dashboard in Unified Console Layout */}
        <Route
          path="/profile"
          element={
            <RoleGate allowedRoles={['STUDENT', 'INDUSTRY', 'ACADEMICIAN', 'INSTITUTION_ADMIN']}>
              <ConsoleLayout>
                <CareerProfileDashboard />
              </ConsoleLayout>
            </RoleGate>
          }
        />

        {/* Resume Builder Interface in Unified Console Layout */}
        <Route
          path="/resume-builder"
          element={
            <RoleGate allowedRoles={['STUDENT']}>
              <ConsoleLayout>
                <CareerResumeBuilder />
              </ConsoleLayout>
            </RoleGate>
          }
        />
        <Route
          path="/resumes"
          element={
            <RoleGate allowedRoles={['STUDENT']}>
              <ConsoleLayout>
                <CareerResumeBuilder />
              </ConsoleLayout>
            </RoleGate>
          }
        />

        {/* Authenticated Student Console Routes */}
        <Route
          path="/dashboard"
          element={
            <RoleGate allowedRoles={['STUDENT']}>
              <ConsoleLayout>
                <StudentDashboard />
              </ConsoleLayout>
            </RoleGate>
          }
        />
        <Route
          path="/skill-profile"
          element={
            <RoleGate allowedRoles={['STUDENT']}>
              <ConsoleLayout>
                <SkillProfilePage />
              </ConsoleLayout>
            </RoleGate>
          }
        />
        <Route
          path="/assessment"
          element={
            <RoleGate allowedRoles={['STUDENT']}>
              <ConsoleLayout>
                <AssessmentPage />
              </ConsoleLayout>
            </RoleGate>
          }
        />
        <Route
          path="/report-card"
          element={
            <RoleGate allowedRoles={['STUDENT']}>
              <ConsoleLayout>
                <ReportCardPage />
              </ConsoleLayout>
            </RoleGate>
          }
        />
        <Route
          path="/internships"
          element={
            <RoleGate allowedRoles={['STUDENT']}>
              <ConsoleLayout>
                <InternshipsPage />
              </ConsoleLayout>
            </RoleGate>
          }
        />
        <Route
          path="/courses"
          element={
            <RoleGate allowedRoles={['STUDENT']}>
              <ConsoleLayout>
                <CoursesPage />
              </ConsoleLayout>
            </RoleGate>
          }
        />
        <Route
          path="/learn"
          element={
            <RoleGate allowedRoles={['STUDENT']}>
              <ConsoleLayout>
                <LearningResourcesPage />
              </ConsoleLayout>
            </RoleGate>
          }
        />
        <Route
          path="/portfolio"
          element={
            <RoleGate allowedRoles={['STUDENT']}>
              <ConsoleLayout>
                <PortfolioBuilderPage />
              </ConsoleLayout>
            </RoleGate>
          }
        />
        <Route
          path="/portfolio-builder"
          element={
            <RoleGate allowedRoles={['STUDENT']}>
              <ConsoleLayout>
                <PortfolioBuilderPage />
              </ConsoleLayout>
            </RoleGate>
          }
        />
        <Route
          path="/portfolio-settings"
          element={
            <RoleGate allowedRoles={['STUDENT']}>
              <ConsoleLayout>
                <StudentPortfolioEdit />
              </ConsoleLayout>
            </RoleGate>
          }
        />

        {/* Authenticated Industry Recruiter Routes */}
        <Route
          path="/industry/dashboard"
          element={
            <RoleGate allowedRoles={['INDUSTRY']}>
              <ConsoleLayout>
                <IndustryDashboard />
              </ConsoleLayout>
            </RoleGate>
          }
        />
        <Route
          path="/industry/post-job"
          element={
            <RoleGate allowedRoles={['INDUSTRY']}>
              <ConsoleLayout>
                <PostJobPage />
              </ConsoleLayout>
            </RoleGate>
          }
        />
        <Route
          path="/industry/applicants/:jobId"
          element={
            <RoleGate allowedRoles={['INDUSTRY']}>
              <ConsoleLayout>
                <ApplicantsPage />
              </ConsoleLayout>
            </RoleGate>
          }
        />

        {/* Authenticated Academician Routes */}
        <Route
          path="/academician/dashboard"
          element={
            <RoleGate allowedRoles={['ACADEMICIAN']}>
              <ConsoleLayout>
                <AcademicianDashboard />
              </ConsoleLayout>
            </RoleGate>
          }
        />
        <Route
          path="/academician/opportunities"
          element={
            <RoleGate allowedRoles={['ACADEMICIAN']}>
              <ConsoleLayout>
                <AcademicOpportunitiesPage />
              </ConsoleLayout>
            </RoleGate>
          }
        />

        {/* Authenticated Institution Admin Routes */}
        <Route
          path="/institution/dashboard"
          element={
            <RoleGate allowedRoles={['INSTITUTION_ADMIN']}>
              <ConsoleLayout>
                <InstitutionDashboard />
              </ConsoleLayout>
            </RoleGate>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/profile" replace />} />
      </Routes>
    </AuthProvider>
  );
};
