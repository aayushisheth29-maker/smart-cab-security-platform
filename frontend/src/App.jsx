import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import Help from './Help'; // ⭐ NEW: Imported Help page
import BookRide from './BookRide';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BookRide />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* ⭐ NEW: The Help page */}
        <Route path="/help" element={<Help />} />
      </Routes>
    </Router>
  );
}

export default App;