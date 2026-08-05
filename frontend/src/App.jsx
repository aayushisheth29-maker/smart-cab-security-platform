import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Login from './Login';
import Signup from './Signup';
import Help from './Help'; 
import BookRide from './BookRide';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BookRide />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/help" element={<Help />} />
        
        {/* ⭐ NEW: Your Smart Cab Radar & Booking Page! */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;