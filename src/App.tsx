import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ComplianceProvider } from './context/ComplianceContext';
import { ToastProvider } from './components/ToastProvider';
import { SupportWidget } from './components/SupportWidget';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { GapAnalyzer } from './pages/GapAnalyzer';
import { SponsorGuardian } from './pages/SponsorGuardian';
import { TemplateLibrary } from './pages/Templates';
import { InspectionSimulator } from './pages/InspectionSimulator';
import { MockInspection } from './pages/MockInspection';
import { InterviewTraining } from './pages/InterviewTraining';
import { VisitingRights } from './pages/VisitingRights';
import { TrainingEVisa } from './pages/TrainingEVisa';
import { RegulatoryIntelligence } from './pages/RegulatoryIntelligence';
import { CQCAdvisor } from './pages/CQCAdvisor';
import { GovernanceDashboard } from './pages/Governance';
import { Pricing } from './pages/Pricing';
import { Settings } from './pages/Settings';
import { LandingPage } from './pages/LandingPage';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';

// ============ LOADING SCREEN ============
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTop: '3px solid #0ea5e9',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
        <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading ComplyFlow...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ============ PROTECTED ROUTE ============
function ProtectedRoute() {
  const { loading, isAuthenticated, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    // If authenticated but not onboarded, and not already on the setup page
    if (profile && !profile.onboarding_completed && location.pathname !== '/setup') {
      return <Navigate to="/setup" replace />;
    }
    return <Outlet />;
  }

  return <Navigate to="/login" replace />;
}

// ============ APP LAYOUT ============
function AppLayout() {
  return (
    <>
      <Navigation />
      <main>
        <Outlet />
      </main>
    </>
  );
}

// ============ ROUTES ============
function AppRoutes() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />}
      />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/setup" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cqc/gap-analysis" element={<GapAnalyzer />} />
          <Route path="/cqc/advisor" element={<CQCAdvisor />} />
          <Route path="/cqc/gap-analyzer" element={<Navigate to="/cqc/gap-analysis" replace />} />
          <Route path="/cqc" element={<Navigate to="/cqc/gap-analysis" replace />} />
          <Route path="/sponsor" element={<SponsorGuardian />} />
          <Route path="/resources" element={<RegulatoryIntelligence />} />
          <Route path="/templates" element={<TemplateLibrary />} />
          <Route path="/cqc/simulator" element={<InspectionSimulator />} />
          <Route path="/cqc/mock-inspection" element={<MockInspection />} />
          <Route path="/cqc/interview-training" element={<InterviewTraining />} />
          <Route path="/cqc/visiting-rights" element={<VisitingRights />} />
          <Route path="/governance" element={<GovernanceDashboard />} />
          <Route path="/training/evisa" element={<TrainingEVisa />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Public landing page */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
}

// ============ MAIN APP ============
function App() {
  return (
    <AuthProvider>
      <ComplianceProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
            <SupportWidget />
          </BrowserRouter>
        </ToastProvider>
      </ComplianceProvider>
    </AuthProvider>
  );
}

export default App;
