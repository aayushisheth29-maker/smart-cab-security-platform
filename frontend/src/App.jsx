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

function App() {
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
