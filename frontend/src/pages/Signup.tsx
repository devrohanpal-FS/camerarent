import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { signup, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!name || !email || !password) {
      setLocalError('All fields are required.');
      return;
    }

    try {
      await signup(name, email, password);
      navigate('/');
    } catch {
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 gradient-bg">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/20 mx-auto mb-4">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 font-sans">
            Create an Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Register to rent high-end production equipment
          </p>
        </div>

        {(localError || error) && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-3 text-sm text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{localError || error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-slate-800 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-slate-800 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-slate-800 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white text-sm font-bold py-3 rounded-xl shadow-lg shadow-brand-500/25 hover:scale-[1.01] active:scale-[0.99] transition duration-200 cursor-pointer"
          >
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 hover:text-brand-700 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
