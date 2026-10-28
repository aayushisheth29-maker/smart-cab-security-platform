import React, { lazy, Suspense } from 'react';
import TrackRide from './TrackRide';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import Login from './Login';
import Signup from './Signup';
import Help from './Help';
import BookRide from './BookRide';
import MyRides from './MyRides';
import SafetyCenter from './SafetyCenter';
import AdminDashboard from './AdminDashboard';
import DriverDashboard from './DriverDashboard';
import SplitFareView from './SplitFareView';
import CorporateBillingModal from './CorporateBillingModal';
import I18nLoader from './I18nLoader';
import FloatingHelp from './HelpAssistant';

function CorporateRouteWrapper() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <CorporateBillingModal
        isOpen={true}
        onClose={() => navigate('/')}
      />
    </div>
  );
}

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
            <div className="space-y-2">
              <button
                onClick={() => {
                  try {
                    sessionStorage.removeItem('smartcab_pending_booking');
                  } catch (e) {}
                  this.setState({ hasError: false, error: null });
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl transition"
              >
                Continue to Booking
              </button>
              <button
                onClick={() => {
                  document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  window.location.reload();
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 px-6 rounded-2xl transition text-xs"
              >
                Reload Page
              </button>
            </div>
            <a
              href="/"
              onClick={() => {
                try {
                  sessionStorage.removeItem('smartcab_pending_booking');
                } catch (e) {}
                this.setState({ hasError: false, error: null });
              }}
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

// 🔒 AUTOMATIC PORTAL DETECTOR (Environment Variable OR Hostname)
// Detects if the current domain is dedicated to Owner or Driver portal.
// E.g.:
// - https://smart-cab-owner-portal.vercel.app  -> Auto Owner Mode
// - https://smart-cab-driver-portal.vercel.app -> Auto Driver Mode
const currentHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';

const OWNER_MODE = import.meta.env.VITE_OWNER_MODE === 'true' || 
                   currentHost.includes('owner') || 
                   currentHost.startsWith('admin.');

const DRIVER_MODE = import.meta.env.VITE_DRIVER_MODE === 'true' || 
                    currentHost.includes('driver');

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
  if (DRIVER_MODE) {
    return (
      <GlobalErrorBoundary>
        <Router>
          <I18nLoader />
          <Routes>
            <Route path="/*" element={<DriverDashboard />} />
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
          <Route path="/split/:splitId" element={<SplitFareView />} />
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
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/corporate" element={<CorporateRouteWrapper />} />
        </Routes>
        <FloatingHelp />
      </Router>
    </GlobalErrorBoundary>
  );
}

export default App;
