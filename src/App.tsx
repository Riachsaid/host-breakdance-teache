import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ReportPage from './pages/ReportPage';
import History from './pages/History';
import Auth from './pages/Auth';
import { isLoggedIn } from './utils/authStore';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function RoutePage({ children }: { children: React.ReactNode }) {
  const nodeRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={nodeRef} className="animate-route-enter">
      {children}
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(() => isLoggedIn());
  useEffect(() => {
    setAuthed(isLoggedIn());
  }, []);
  if (!authed) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-deep selection:bg-neon-cyan/20 selection:text-white">
      <ScrollToTop />

      <Routes location={location} key={location.pathname}>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoutePage>
                <Dashboard />
              </RoutePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/report/:id"
          element={
            <ProtectedRoute>
              <RoutePage>
                <ReportPage />
              </RoutePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <RoutePage>
                <History />
              </RoutePage>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
