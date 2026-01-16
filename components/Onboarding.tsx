
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface Props {
  onComplete: (user: UserProfile) => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isNew, setIsNew] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (isNew && !name)) return;
    
    onComplete({
      id: email.toLowerCase().trim(),
      name: name.trim() || 'Student',
      lastSeen: Date.now()
    });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-lg shadow-blue-200 font-serif">S</div>
          <h2 className="text-2xl font-bold text-slate-800">Namaste from Sarthi AI</h2>
          <p className="text-slate-500 text-sm mt-2">Identify yourself to begin your academic journey with your personal guide.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email / Student ID</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Enter your registered ID"
            />
          </div>

          {isNew && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="What should I call you?"
              />
            </div>
          )}

          <div className="flex items-center gap-2 py-2">
            <input 
              type="checkbox" 
              id="isNew" 
              checked={isNew} 
              onChange={(e) => setIsNew(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="isNew" className="text-sm text-slate-600 cursor-pointer">I am a new student</label>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            {isNew ? 'Register' : 'Connect to Sarthi'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
