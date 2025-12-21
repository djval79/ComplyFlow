import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ComplianceProvider } from './context/ComplianceContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { GapAnalyzer } from './pages/GapAnalyzer';
import { SponsorGuardian } from './pages/SponsorGuardian';
import { TemplateLibrary } from './pages/Templates';
import { InspectionSimulator } from './pages/InspectionSimulator';
import { VisitingRights } from './pages/VisitingRights';
import { TrainingEVisa } from './pages/TrainingEVisa';
import { RegulatoryIntelligence } from './pages/RegulatoryIntelligence';
import { GovernanceDashboard } from './pages/Governance';
import { Pricing } from './pages/Pricing';
import { Settings } from './pages/Settings';

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
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
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

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/setup" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cqc/gap-analysis" element={<GapAnalyzer />} />
          <Route path="/cqc/gap-analyzer" element={<Navigate to="/cqc/gap-analysis" replace />} />
          <Route path="/cqc" element={<Navigate to="/cqc/gap-analysis" replace />} />
          <Route path="/sponsor" element={<SponsorGuardian />} />
          <Route path="/resources" element={<RegulatoryIntelligence />} />
          <Route path="/templates" element={<TemplateLibrary />} />
          <Route path="/cqc/simulator" element={<InspectionSimulator />} />
          <Route path="/cqc/visiting-rights" element={<VisitingRights />} />
          <Route path="/governance" element={<GovernanceDashboard />} />
          <Route path="/training/evisa" element={<TrainingEVisa />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

// ============ MAIN APP ============
function App() {
  return (
    <AuthProvider>
      <ComplianceProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ComplianceProvider>
    </AuthProvider>
  );
}

export default App;
