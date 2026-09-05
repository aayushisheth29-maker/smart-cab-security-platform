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
      <Router>
        <I18nLoader />
        <Routes>
          <Route path="/*" element={<AdminDashboard />} />
        </Routes>
      </Router>
    );
  }
  return (
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
        {/* 🔒 OWNER / FLEET PORTAL — PRIVATE. Not linked anywhere in the rider
            app (no button, no footer link). Only reachable by typing the URL:
            /owner  (alias /admin for older saved bookmarks). The admin key
            gate protects it. Riders never see this page in navigation. */}
        <Route path="/owner" element={<AdminDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
      <FloatingHelp />
    </Router>
  );
}

export default App;
