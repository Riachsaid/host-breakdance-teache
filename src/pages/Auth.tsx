import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, loginUser } from '../utils/authStore';

type AuthMode = 'signin' | 'signup';

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const switchMode = useCallback(() => {
    setMode(m => (m === 'signin' ? 'signup' : 'signin'));
    setError('');
    setSuccess('');
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccess('');

      if (!email.includes('@') || email.length < 5) {
        setError('Please enter a valid email address');
        return;
      }
      if (password.length < 4) {
        setError('Password must be at least 4 characters');
        return;
      }
      if (mode === 'signup' && password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      const ok =
        mode === 'signup'
          ? registerUser(email, password)
          : loginUser(email, password);

      if (ok) {
        setSuccess(
          mode === 'signup'
            ? 'Account created successfully!'
            : 'Welcome back!',
        );
        setTimeout(() => navigate('/'), 800);
      } else {
        setError('Registration failed. Please try again.');
      }
    },
    [email, password, confirmPassword, mode, navigate],
  );

  return (
    <div className="min-h-screen bg-deep flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-orbitron font-bold text-neon-cyan tracking-wide">
            GHOST
          </h1>
          <p className="text-text-secondary font-rajdhani text-sm mt-1 tracking-wide">
            Breakdance Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <div className="neon-card p-8">
          {/* Tabs */}
          <div className="flex mb-6 bg-surface rounded-lg p-1">
            <button
              onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 text-sm font-orbitron tracking-wider rounded-md transition-all ${
                mode === 'signup'
                  ? 'bg-white text-neon-cyan shadow-sm font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              SIGN UP
            </button>
            <button
              onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 text-sm font-orbitron tracking-wider rounded-md transition-all ${
                mode === 'signin'
                  ? 'bg-white text-neon-cyan shadow-sm font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              SIGN IN
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-orbitron tracking-wider text-text-secondary block mb-1.5">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-rajdhani text-text-primary placeholder:text-slate-300 outline-none transition-all focus:border-neon-cyan/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-orbitron tracking-wider text-text-secondary block mb-1.5">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 4 characters"
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-rajdhani text-text-primary placeholder:text-slate-300 outline-none transition-all focus:border-neon-cyan/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="text-xs font-orbitron tracking-wider text-text-secondary block mb-1.5">
                  CONFIRM PASSWORD
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-rajdhani text-text-primary placeholder:text-slate-300 outline-none transition-all focus:border-neon-cyan/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                />
              </div>
            )}

            {error && (
              <div className="text-sm text-neon-magenta font-rajdhani bg-neon-magenta/5 border border-neon-magenta/15 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-neon-green font-rajdhani bg-neon-green/5 border border-neon-green/15 rounded-lg px-3 py-2">
                {success}
              </div>
            )}

            <button type="submit" className="cyber-button w-full text-sm py-3">
              {mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={switchMode}
              className="text-xs font-orbitron text-text-secondary hover:text-neon-cyan transition-colors tracking-wider"
            >
              {mode === 'signup'
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-text-secondary/40 font-rajdhani mt-6">
          By continuing, you agree to Ghost's Terms of Service
        </p>
      </div>
    </div>
  );
}
