import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RoleGate } from './components/RoleGate';
import { ConsoleLayout } from './components/ConsoleLayout';
import { ScrollRestorationManager } from './components/ScrollRestorationManager';

// Code-split Public Campus Pages
const LandingPage = React.lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const OAuthCallbackPage = React.lazy(() => import('./pages/OAuthCallbackPage').then(m => ({ default: m.OAuthCallbackPage })));
const PublicPortfolioSite = React.lazy(() => import('./pages/portfolio/PublicPortfolioSite').then(m => ({ default: m.PublicPortfolioSite })));
const PortfolioBuilderPage = React.lazy(() => import('./pages/portfolio/PortfolioBuilderPage').then(m => ({ default: m.PortfolioBuilderPage })));
const SliderTestPage = React.lazy(() => import('./pages/SliderTestPage').then(m => ({ default: m.SliderTestPage })));

// Code-split Profile & Resume Builder
const CareerProfileDashboard = React.lazy(() => import('./pages/profile/CareerProfileDashboard').then(m => ({ default: m.CareerProfileDashboard })));
const CareerResumeBuilder = React.lazy(() => import('./pages/resumes/CareerResumeBuilder').then(m => ({ default: m.CareerResumeBuilder })));

// Code-split Student Console Pages
const StudentDashboard = React.lazy(() => import('./pages/student/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const SkillProfilePage = React.lazy(() => import('./pages/student/SkillProfilePage').then(m => ({ default: m.SkillProfilePage })));
const AssessmentPage = React.lazy(() => import('./pages/student/AssessmentPage').then(m => ({ default: m.AssessmentPage })));
const DsaCodingPage = React.lazy(() => import('./pages/student/DsaCodingPage').then(m => ({ default: m.DsaCodingPage })));
const ReportCardPage = React.lazy(() => import('./pages/student/ReportCardPage').then(m => ({ default: m.ReportCardPage })));
const InternshipsPage = React.lazy(() => import('./pages/student/InternshipsPage').then(m => ({ default: m.InternshipsPage })));
const CoursesPage = React.lazy(() => import('./pages/student/CoursesPage').then(m => ({ default: m.CoursesPage })));
const LearningResourcesPage = React.lazy(() => import('./pages/student/LearningResourcesPage').then(m => ({ default: m.LearningResourcesPage })));
const StudentPortfolioEdit = React.lazy(() => import('./pages/student/StudentPortfolioEdit').then(m => ({ default: m.StudentPortfolioEdit })));

// Code-split Industry Console Pages
const IndustryDashboard = React.lazy(() => import('./pages/industry/IndustryDashboard').then(m => ({ default: m.IndustryDashboard })));
const PostJobPage = React.lazy(() => import('./pages/industry/PostJobPage').then(m => ({ default: m.PostJobPage })));
const ApplicantsPage = React.lazy(() => import('./pages/industry/ApplicantsPage').then(m => ({ default: m.ApplicantsPage })));

// Code-split Academician Console Pages
const AcademicianDashboard = React.lazy(() => import('./pages/academician/AcademicianDashboard').then(m => ({ default: m.AcademicianDashboard })));
const AcademicOpportunitiesPage = React.lazy(() => import('./pages/academician/AcademicOpportunitiesPage').then(m => ({ default: m.AcademicOpportunitiesPage })));

// Code-split Institution Console Pages
const InstitutionDashboard = React.lazy(() => import('./pages/institution/InstitutionDashboard').then(m => ({ default: m.InstitutionDashboard })));

// Full-screen dark fallback for cold loads & root-level public transitions
const RootDarkFallback: React.FC = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-[#0b0f19]">
    <div className="flex flex-col items-center gap-3 text-cyan-400 font-mono text-xs">
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-slate-400 tracking-wider">CALIBRATING SYSTEM...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ScrollRestorationManager />
      <Suspense fallback={<RootDarkFallback />}>
        <Routes>
          {/* Public Campus Theme Pages & Shareable Personal Portfolios */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/test-sliders" element={<SliderTestPage />} />
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
            path="/assessments"
            element={<Navigate to="/assessment" replace />}
          />
          <Route
            path="/dsa"
            element={
              <RoleGate allowedRoles={['STUDENT']}>
                <ConsoleLayout>
                  <DsaCodingPage />
                </ConsoleLayout>
              </RoleGate>
            }
          />
          <Route
            path="/dsa/:slug"
            element={
              <RoleGate allowedRoles={['STUDENT']}>
                <ConsoleLayout>
                  <DsaCodingPage />
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
      </Suspense>
    </AuthProvider>
  );
};

