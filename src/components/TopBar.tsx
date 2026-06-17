import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthEmail, logoutUser } from '../utils/authStore';

export default function TopBar() {
  const navigate = useNavigate();
  const [email] = useState(() => getAuthEmail());

  const handleSignOut = () => {
    logoutUser();
    navigate('/auth');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <span className="text-xl font-orbitron font-bold text-neon-cyan">GHOST</span>
          <span className="text-[10px] text-neon-magenta font-orbitron -ml-1 mt-2">BETA</span>
        </button>
        <nav className="flex items-center gap-4">
          <button
            onClick={() => navigate('/history')}
            className="text-xs font-orbitron text-text-secondary hover:text-neon-cyan transition-colors"
          >
            PAST RESULTS
          </button>
          {email && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <span className="text-[10px] font-rajdhani text-text-secondary max-w-[120px] truncate">
                {email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-[9px] font-orbitron text-text-secondary/50 hover:text-neon-magenta transition-colors tracking-wider"
              >
                EXIT
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
