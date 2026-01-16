
import React from 'react';
import { UserProfile } from '../types';

interface Props {
  user: UserProfile;
}

const AnalyticsPanel: React.FC<Props> = ({ user }) => {
  const { analytics } = user;
  
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">Learning Analytics</h3>
        <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-md">LIVE DATA</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Messages</p>
          <p className="text-2xl font-bold text-indigo-600">{analytics.totalMessages}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Quizzes Taken</p>
          <p className="text-2xl font-bold text-amber-600">{analytics.quizScores.length}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Language Engagement</p>
        <div className="space-y-2">
          {Object.entries(analytics.languagePreference).map(([lang, count]) => (
            <div key={lang} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="capitalize">{lang === 'hi' ? 'Hindi' : lang === 'te' ? 'Telugu' : 'English'}</span>
                <span>{count} interactions</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-1000" 
                  // Fix: Cast count to number and handle potential division by zero to resolve TypeScript error
                  style={{ width: `${Math.min(100, ((count as number) / (analytics.totalMessages || 1)) * 100)}%` }}
                />
              </div>
            </div>
          ))}
          {Object.keys(analytics.languagePreference).length === 0 && (
            <p className="text-xs text-slate-400 italic">No language data yet...</p>
          )}
        </div>
      </div>

      <div className="bg-indigo-900 rounded-2xl p-4 text-white">
        <p className="text-[10px] font-bold text-indigo-300 uppercase mb-1">Sarthi's Insight</p>
        <p className="text-xs italic leading-relaxed">
          "You are engaging most with trilingual STEM topics. Your pace is improving!"
        </p>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
