import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { apiFetch, storeAuth } from './api';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      storeAuth(data);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-md w-full">
        <div className="flex items-center justify-center gap-2 mb-6">
          <ShieldCheck className="h-8 w-8 text-green-600" />
          <h2 className="text-3xl font-extrabold text-slate-900">Smart-AI-Cab</h2>
        </div>
        <h3 className="text-xl font-bold text-center mb-6">Welcome back</h3>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            ⚠️ {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-slate-700 font-semibold mb-2">Email Address</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-2">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="mt-6 text-center text-slate-500 text-sm">
          New to Smart-AI-Cab?{' '}
          <Link to="/signup" className="text-green-700 font-bold hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-3 text-center text-slate-400 text-xs">
          Demo account: aayushi@example.com / smartcab123
        </p>
      </div>
    </div>
  );
};

export default Login;
