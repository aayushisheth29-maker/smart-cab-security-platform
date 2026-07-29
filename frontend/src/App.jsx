import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup'; // ⭐ NEW: Imported Signup
import BookRide from './BookRide';

function App() {
  return (
    <Router>
      <Routes>
        {/* The main homepage is your BookRide page */}
        <Route path="/" element={<BookRide />} />
        
        {/* The login page */}
        <Route path="/login" element={<Login />} />
        
        {/* ⭐ NEW: The sign up page */}
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;