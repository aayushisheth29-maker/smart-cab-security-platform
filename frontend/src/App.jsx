import React, { lazy, Suspense } from 'react';
import TrackRide from './TrackRide';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Login from './Login';
import Signup from './Signup';
import Help from './Help';
import BookRide from './BookRide';
import MyRides from './MyRides';
import SafetyCenter from './SafetyCenter';
import AdminDashboard from './AdminDashboard';
import I18nLoader from './I18nLoader';
import FloatingHelp from './HelpAssistant';

const RouteLabApp = lazy(() => import('../route-preview/App'));

class RouteLabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Route Lab Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f7f6] p-6 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-200">
            <h2 className="text-2xl font-black text-slate-900 mb-2">🧭 Route Lab</h2>
            <p className="text-slate-600 text-sm mb-6">
              There was a problem loading the Route Lab interface.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 text-white font-bold py-3.5 px-6 rounded-2xl hover:bg-slate-800 transition"
            >
              Reload Route Lab
            </button>
            <a
              href="/"
              className="inline-block mt-4 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ← Back to Booking
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('App Error Caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
          <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-700">
            <h2 className="text-2xl font-black text-white mb-2">🛡️ Smart Security AI Cab</h2>
            <p className="text-slate-400 text-sm mb-6">
              The page encountered a translation or rendering reload.
            </p>
            <button
              onClick={() => {
                document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                window.location.reload();
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl transition"
            >
              Reload Page
            </button>
            <a
              href="/"
              className="inline-block mt-4 text-xs font-bold text-slate-400 hover:text-white"
            >
              ← Return to Dashboard
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// 🔒 OWNER PORTAL MODE — used by the SECOND, private Vercel project
// (e.g. https://owner.smart-security-cab.com). That project sets
// VITE_OWNER_MODE=true → the app renders ONLY the Owner Portal: no rider
// navbar, no ride booking, no floating rider help, no links to rider pages.
// Same backend, same admin key — just a private door.
const OWNER_MODE = import.meta.env.VITE_OWNER_MODE === 'true';

function App() {
  if (OWNER_MODE) {
    // AdminDashboard uses React Router (Link), so it must stay INSIDE the
    // Router even in owner mode.
    return (
      <GlobalErrorBoundary>
        <Router>
          <I18nLoader />
          <Routes>
            <Route path="/*" element={<AdminDashboard />} />
          </Routes>
        </Router>
      </GlobalErrorBoundary>
    );
  }
  return (
    <GlobalErrorBoundary>
      <Router>
        <I18nLoader />
        <Routes>
          <Route path="/" element={<BookRide />} />
          <Route path="/track/:linkId" element={<TrackRide />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/help" element={<Help />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rides" element={<MyRides />} />
          <Route path="/safety" element={<SafetyCenter />} />
          <Route
            path="/route-lab"
            element={
              <RouteLabErrorBoundary>
                <Suspense
                  fallback={
                    <div className="min-h-screen flex items-center justify-center bg-[#f5f7f6] font-bold text-slate-700">
                      Loading Route Intelligence Lab…
                    </div>
                  }
                >
                  <RouteLabApp />
                </Suspense>
              </RouteLabErrorBoundary>
            }
          />
          {/* 🔒 OWNER / FLEET PORTAL — PRIVATE. Not linked anywhere in the rider
              app (no button, no footer link). Only reachable by typing the URL:
              /owner  (alias /admin for older saved bookmarks). The admin key
              gate protects it. Riders never see this page in navigation. */}
          <Route path="/owner" element={<AdminDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
        <FloatingHelp />
      </Router>
    </GlobalErrorBoundary>
  );
}

export default App;
