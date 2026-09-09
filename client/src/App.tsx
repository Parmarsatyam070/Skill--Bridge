import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ScrollRestorationManager } from './components/ScrollRestorationManager';

// Code-split Authenticated Console Layout (isolates ConsoleLayout + 25+ Lucide icons from landing page)
const AuthenticatedConsoleLayout = React.lazy(() => import('./components/AuthenticatedConsoleLayout'));

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

// Code-split Opportunity Hub Pages
const OpportunityHubPage = React.lazy(() => import('./pages/opportunities/OpportunityHubPage').then(m => ({ default: m.OpportunityHubPage })));
const OpportunityDetailPage = React.lazy(() => import('./pages/opportunities/OpportunityDetailPage').then(m => ({ default: m.OpportunityDetailPage })));

// Code-split Talent Assessment Pages (Phase 5)
const TalentAssessmentsPage = React.lazy(() => import('./pages/assessments/TalentAssessmentsPage').then(m => ({ default: m.TalentAssessmentsPage })));
const AssessmentDetailPage = React.lazy(() => import('./pages/assessments/AssessmentDetailPage').then(m => ({ default: m.AssessmentDetailPage })));
const AssessmentTakingPage = React.lazy(() => import('./pages/assessments/AssessmentTakingPage').then(m => ({ default: m.AssessmentTakingPage })));
const AssessmentResultPage = React.lazy(() => import('./pages/assessments/AssessmentResultPage').then(m => ({ default: m.AssessmentResultPage })));

// Code-split AI Interview Pages (Phase 6)
const AIInterviewPage = React.lazy(() => import('./pages/interviews/AIInterviewPage').then(m => ({ default: m.AIInterviewPage })));
const InterviewSessionPage = React.lazy(() => import('./pages/interviews/InterviewSessionPage').then(m => ({ default: m.InterviewSessionPage })));
const InterviewResultPage = React.lazy(() => import('./pages/interviews/InterviewResultPage').then(m => ({ default: m.InterviewResultPage })));

// Code-split Student Console Pages
const StudentDashboard = React.lazy(() => import('./pages/student/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const SkillProfilePage = React.lazy(() => import('./pages/student/SkillProfilePage').then(m => ({ default: m.SkillProfilePage })));
const AssessmentPage = React.lazy(() => import('./pages/student/AssessmentPage').then(m => ({ default: m.AssessmentPage })));
const DsaCodingPage = React.lazy(() => import('./pages/student/DsaCodingPage').then(m => ({ default: m.DsaCodingPage })));
const ReportCardPage = React.lazy(() => import('./pages/student/ReportCardPage').then(m => ({ default: m.ReportCardPage })));
const InternshipsPage = React.lazy(() => import('./pages/student/InternshipsPage').then(m => ({ default: m.InternshipsPage })));
const CoursesPage = React.lazy(() => import('./pages/student/CoursesPage').then(m => ({ default: m.CoursesPage })));
const LearningResourcesPage = React.lazy(() => import('./pages/student/LearningResourcesPage').then(m => ({ default: m.LearningResourcesPage })));
const AcademicPerformancePage = React.lazy(() => import('./pages/student/AcademicPerformancePage').then(m => ({ default: m.AcademicPerformancePage })));
const StudentPortfolioEdit = React.lazy(() => import('./pages/student/StudentPortfolioEdit').then(m => ({ default: m.StudentPortfolioEdit })));

// Code-split Industry Console Pages
const IndustryDashboard = React.lazy(() => import('./pages/industry/IndustryDashboard').then(m => ({ default: m.IndustryDashboard })));
const PostJobPage = React.lazy(() => import('./pages/industry/PostJobPage').then(m => ({ default: m.PostJobPage })));
const ApplicantsPage = React.lazy(() => import('./pages/industry/ApplicantsPage').then(m => ({ default: m.ApplicantsPage })));

// Code-split Academician Console Pages
const AcademicianDashboard = React.lazy(() => import('./pages/academician/AcademicianDashboard').then(m => ({ default: m.AcademicianDashboard })));

// Code-split Institution Console Pages
const InstitutionDashboard = React.lazy(() => import('./pages/institution/InstitutionDashboard').then(m => ({ default: m.InstitutionDashboard })));

// Code-split Collaboration Management Pages
const CollaborationsPage = React.lazy(() => import('./pages/collaborations/CollaborationsPage').then(m => ({ default: m.CollaborationsPage })));
const CollaborationDetailPage = React.lazy(() => import('./pages/collaborations/CollaborationDetailPage').then(m => ({ default: m.CollaborationDetailPage })));

// Code-split Intelligence Dashboard Pages
const IndustryIntelligencePage = React.lazy(() => import('./pages/intelligence/IndustryIntelligencePage').then(m => ({ default: m.IndustryIntelligencePage })));
const InstitutionIntelligencePage = React.lazy(() => import('./pages/intelligence/InstitutionIntelligencePage').then(m => ({ default: m.InstitutionIntelligencePage })));

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

          {/* User Profile & Opportunities Hub in Unified Console Layout (all authenticated roles) */}
          <Route element={<AuthenticatedConsoleLayout allowedRoles={['STUDENT', 'INDUSTRY', 'ACADEMICIAN', 'INSTITUTION_ADMIN']} />}>
            <Route path="/profile" element={<CareerProfileDashboard />} />
            <Route path="/opportunities" element={<OpportunityHubPage />} />
            <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
          </Route>

          {/* Talent Assessments Platform in Unified Console Layout (STUDENT & INDUSTRY) */}
          <Route element={<AuthenticatedConsoleLayout allowedRoles={['STUDENT', 'INDUSTRY']} />}>
            <Route path="/assessments" element={<TalentAssessmentsPage />} />
            <Route path="/assessments/:id" element={<AssessmentDetailPage />} />
            <Route path="/assessments/:id/result" element={<AssessmentResultPage />} />
            <Route path="/interviews" element={<AIInterviewPage />} />
            <Route path="/interviews/:id" element={<AIInterviewPage />} />
            <Route path="/interviews/:id/result" element={<InterviewResultPage />} />
          </Route>

          {/* Authenticated Student Console Routes */}
          <Route element={<AuthenticatedConsoleLayout allowedRoles={['STUDENT']} />}>
            <Route path="/interviews/:id/session" element={<InterviewSessionPage />} />
            <Route path="/assessments/:id/take" element={<AssessmentTakingPage />} />
            <Route path="/resume-builder" element={<CareerResumeBuilder />} />
            <Route path="/resumes" element={<CareerResumeBuilder />} />
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/skill-profile" element={<SkillProfilePage />} />
            <Route path="/assessment" element={<AssessmentPage />} />
            <Route path="/dsa" element={<DsaCodingPage />} />
            <Route path="/dsa/:slug" element={<DsaCodingPage />} />
            <Route path="/report-card" element={<ReportCardPage />} />
            <Route path="/academic-performance" element={<AcademicPerformancePage />} />
            <Route path="/internships" element={<InternshipsPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/learn" element={<LearningResourcesPage />} />
            <Route path="/portfolio" element={<PortfolioBuilderPage />} />
            <Route path="/portfolio-builder" element={<PortfolioBuilderPage />} />
            <Route path="/portfolio-settings" element={<StudentPortfolioEdit />} />
          </Route>

          {/* Authenticated Industry Recruiter Routes */}
          <Route element={<AuthenticatedConsoleLayout allowedRoles={['INDUSTRY']} />}>
            <Route path="/industry/dashboard" element={<IndustryDashboard />} />
            <Route path="/industry/intelligence" element={<IndustryIntelligencePage />} />
            <Route path="/industry/post-job" element={<PostJobPage />} />
            <Route path="/industry/applicants/:jobId" element={<ApplicantsPage />} />
          </Route>

          {/* Authenticated Academician Routes */}
          <Route element={<AuthenticatedConsoleLayout allowedRoles={['ACADEMICIAN']} />}>
            <Route path="/academician/dashboard" element={<AcademicianDashboard />} />
          </Route>

          {/* Authenticated Institution & Faculty Analytics Routes */}
          <Route element={<AuthenticatedConsoleLayout allowedRoles={['INSTITUTION_ADMIN', 'ACADEMICIAN']} />}>
            <Route path="/institution/dashboard" element={<InstitutionDashboard />} />
            <Route path="/institution/intelligence" element={<InstitutionIntelligencePage />} />
          </Route>

          {/* Authenticated Collaboration Management Routes (INDUSTRY, INSTITUTION_ADMIN) */}
          <Route element={<AuthenticatedConsoleLayout allowedRoles={['INDUSTRY', 'INSTITUTION_ADMIN']} />}>
            <Route path="/collaborations" element={<CollaborationsPage />} />
            <Route path="/collaborations/:id" element={<CollaborationDetailPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/profile" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
};
