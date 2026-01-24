import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ComplianceProvider } from './context/ComplianceContext';
import { ToastProvider } from './components/ToastProvider';
import { SupportWidget } from './components/SupportWidget';
import { ProductionErrorBoundary } from './components/ProductionErrorBoundary';
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
import { CQCExport } from './pages/CQCExport';
import { EvidenceVault } from './pages/EvidenceVault'; // Re-saved to trigger indexing
import { LandingPage } from './pages/LandingPage';
import { IntelligenceHub } from './pages/IntelligenceHub';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Actions } from './pages/Actions';
import { TrendWatchdog } from './pages/TrendWatchdog';
import { StaffHeatmap } from './pages/StaffHeatmap';
import { SmartRota } from './pages/SmartRota';
import { CookieConsent } from './components/CookieConsent';

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

// ============ ANALYTICS TRACKER ============
function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    import('./lib/posthog').then(({ captureEvent }) => {
      captureEvent('$pageview');
    });
  }, [location]);

  return null;
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
      <Route path="/templates" element={<TemplateLibrary />} />
      <Route path="/resources" element={<RegulatoryIntelligence />} />
      {/* Blog Alias for SEO */}
      <Route path="/blog" element={<RegulatoryIntelligence />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={
          <ProductionErrorBoundary>
            <AppLayout />
          </ProductionErrorBoundary>
        }>
          <Route path="/setup" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cqc/gap-analysis" element={<GapAnalyzer />} />
          <Route path="/cqc/export" element={<CQCExport />} />
          <Route path="/cqc/evidence-vault" element={<EvidenceVault />} />
          <Route path="/cqc/advisor" element={<CQCAdvisor />} />
          <Route path="/cqc/gap-analyzer" element={<Navigate to="/cqc/gap-analysis" replace />} />
          <Route path="/cqc" element={<Navigate to="/cqc/gap-analysis" replace />} />
          <Route path="/sponsor" element={<SponsorGuardian />} />
          <Route path="/cqc/simulator" element={<InspectionSimulator />} />
          <Route path="/cqc/mock-inspection" element={<MockInspection />} />
          <Route path="/cqc/interview-training" element={<InterviewTraining />} />
          <Route path="/cqc/visiting-rights" element={<VisitingRights />} />
          <Route path="/governance" element={<GovernanceDashboard />} />
          <Route path="/actions" element={<Actions />} />
          <Route path="/trend-watchdog" element={<TrendWatchdog />} />
          <Route path="/training/heatmap" element={<StaffHeatmap />} />
          <Route path="/rota" element={<SmartRota />} />
          <Route path="/training/evisa" element={<TrainingEVisa />} />
          <Route path="/intelligence-hub" element={<IntelligenceHub />} />
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
    <ProductionErrorBoundary>
      <AuthProvider>
        <ComplianceProvider>
          <ToastProvider>
            <BrowserRouter>
              <PageTracker />
              <AppRoutes />
              <SupportWidget />
              <CookieConsent />
            </BrowserRouter>
          </ToastProvider>
        </ComplianceProvider>
      </AuthProvider>
    </ProductionErrorBoundary>
  );
}

export default App;
