
import React, { useState } from 'react';
import { geminiService } from '../services/gemini';
import { persistenceService } from '../services/persistence';
import { RagEntry } from '../types';

const RagManager: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [board, setBoard] = useState<'CBSE' | 'AP' | 'Telangana'>('CBSE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [entries, setEntries] = useState<RagEntry[]>(persistenceService.getAllRagEntries());
  const [status, setStatus] = useState('');

  const handleResearch = async () => {
    if (!subject) return;
    setIsProcessing(true);
    setStatus(`Researching ${subject} for ${board} board...`);
    
    try {
      const data = await geminiService.researchSubject(subject, board);
      const newEntry: RagEntry = {
        id: Date.now().toString(),
        subject: data.subject!,
        board: data.board!,
        content: data.content!,
        sourceUrls: data.sourceUrls!,
        timestamp: Date.now()
      };
      
      persistenceService.saveRagEntry(newEntry);
      setEntries(persistenceService.getAllRagEntries());
      setSubject('');
      setStatus('Successfully indexed to RAG DB!');
    } catch (error) {
      console.error(error);
      setStatus('Research failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl">🔍</div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Syllabus RAG Indexer</h3>
            <p className="text-sm text-slate-500">Add syllabus and solutions to the global knowledge base.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subject / Topic</label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Class 10 Physics Motion"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Education Board</label>
            <select 
              value={board}
              onChange={(e) => setBoard(e.target.value as any)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="CBSE">CBSE</option>
              <option value="AP">Andhra Pradesh</option>
              <option value="Telangana">Telangana</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleResearch}
          disabled={isProcessing || !subject}
          className="mt-6 w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300"
        >
          {isProcessing ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : 'Run Batch Job: Scrape & Index'}
        </button>

        {status && <p className="mt-4 text-center text-xs font-semibold text-indigo-500 animate-pulse">{status}</p>}
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-slate-800 px-2">Knowledge Base Index ({entries.length})</h4>
        <div className="grid grid-cols-1 gap-4">
          {entries.map(entry => (
            <div key={entry.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase">{entry.board}</span>
                  <h5 className="font-bold text-slate-800 mt-1">{entry.subject}</h5>
                </div>
                <span className="text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-3">{entry.content}</p>
              <div className="flex flex-wrap gap-2">
                {entry.sourceUrls.slice(0, 3).map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md hover:underline truncate max-w-[150px]">
                    🌐 {new URL(url).hostname}
                  </a>
                ))}
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="text-center py-12 bg-slate-100/50 rounded-3xl border border-dashed border-slate-300 text-slate-400">
              No entries in RAG database yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RagManager;
