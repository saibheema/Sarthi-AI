
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

  const determineRole = (email: string): 'student' | 'admin' => {
    const e = email.toLowerCase();
    return (e.includes('admin') || e.endsWith('@sarthi.ai')) ? 'admin' : 'student';
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await authService.signInWithGoogle();
      const role = determineRole(result.email);
      const profile: UserProfile = {
        id: result.uid,
        email: result.email,
        name: result.name,
        role,
        analytics: { totalSessions: 1, totalMessages: 0, quizScores: [], commonTopics: [], languagePreference: {} }
      };
      onAuth(profile);
    } catch (err) {
      setError('Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const uid = await authService.login(email, password);
        const role = determineRole(email);
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
        const role = determineRole(email);
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
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200">
        <div className="bg-indigo-600 p-10 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-[30px] flex items-center justify-center text-white text-4xl mx-auto mb-6 font-serif shadow-xl">S</div>
          <h2 className="text-3xl font-black tracking-tight">Sarthi AI</h2>
          <p className="text-indigo-100 text-sm mt-2 font-medium opacity-90">Your Trilingual Academic Guide</p>
        </div>

        <div className="p-8 space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Or with email</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 animate-shake">{error}</div>}
            
            {!isLogin && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium"
                  placeholder="e.g. Rahul Kumar"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium"
                placeholder="student@school.edu"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all mt-4 flex items-center justify-center text-sm uppercase tracking-wider"
            >
              {loading ? <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs text-slate-400 font-bold hover:text-indigo-600 transition-colors"
              >
                {isLogin ? "New here? Create a student account" : "Already registered? Sign in instead"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
