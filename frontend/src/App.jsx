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
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
      <FloatingHelp />
    </Router>
  );
}

export default App;
