import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import BookRide from './BookRide';

function App() {
  return (
    <Router>
      <Routes>
        {/* The main homepage is your BookRide page */}
        <Route path="/" element={<BookRide />} />
        
        {/* The login page will be at /login */}
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;