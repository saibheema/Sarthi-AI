
import React, { useState } from 'react';
import { authService } from '../services/firebase';
import { UserProfile } from '../types';

interface Props {
  onAuth: (user: UserProfile) => void;
}

const Auth: React.FC<Props> = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const uid = await authService.login(email, password);
        const role: 'student' | 'admin' = email.toLowerCase().includes('admin') ? 'admin' : 'student';
        
        const mockProfile: UserProfile = {
          id: uid,
          email,
          name: name || email.split('@')[0],
          role,
          analytics: { totalSessions: 1, totalMessages: 0, quizScores: [], commonTopics: [], languagePreference: {} }
        };
        onAuth(mockProfile);
      } else {
        const uid = await authService.register(email, name);
        const role: 'student' | 'admin' = email.toLowerCase().includes('admin') ? 'admin' : 'student';

        const newProfile: UserProfile = {
          id: uid,
          email,
          name,
          role,
          analytics: { totalSessions: 1, totalMessages: 0, quizScores: [], commonTopics: [], languagePreference: {} }
        };
        onAuth(newProfile);
      }
    } catch (err) {
      setError('Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200">
        <div className="bg-indigo-600 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-4 font-serif">S</div>
          <h2 className="text-2xl font-bold">Sarthi AI Portal</h2>
          <p className="text-indigo-100 text-sm mt-1 opacity-80">Access your academic guide</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-500 text-xs rounded-lg border border-red-100">{error}</div>}
          
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                placeholder="Student/Admin Name"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
              placeholder="name@school.edu (use 'admin' in email for admin access)"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all mt-4 flex items-center justify-center"
          >
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
