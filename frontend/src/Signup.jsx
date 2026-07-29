import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    // For now, after they click sign up, we will send them to the login page
    navigate('/login'); 
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create Account</h2>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Full Name</label>
            <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Email Address</label>
            <input type="email" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" placeholder="Enter your email" />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Create Password</label>
            <input type="password" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" placeholder="Create a strong password" />
          </div>
          <button type="submit" className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition">
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          Already have an account? <Link to="/login" className="text-black font-bold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;