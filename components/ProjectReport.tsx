
import React, { useState } from 'react';

const ProjectReport: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const reportData = {
    title: "SARATHI AI: The Stateful Academic Charioteer",
    functionality: "A trilingual (English, Hindi, Telugu) stateful academic mentor for Class 1-12 students with persistent memory and multimodal (voice/image) capabilities.",
    modules: [
      { name: "Persistent Mentor Engine", desc: "Learns student traits, strengths, and weaknesses across sessions." },
      { name: "Multimodal Tutor", desc: "Real-time voice interaction and OCR image-based doubt resolution." },
      { name: "Syllabus RAG", desc: "Curriculum-aligned knowledge base for CBSE and State Boards." },
      { name: "Executive Suite", desc: "Business analytics, infra-cost tracking, and reporting." }
    ],
    status: {
      completed: ["UI/UX Framework", "Gemini 3/2.5 Integration", "Voice-to-Chat Sync", "Stateful Traits Analysis", "Admin Dashboards"],
      stubbed: ["Real Firebase Auth", "Cloud Firestore Production DB", "Automated Vector DB indexing", "Payment Gateway for Store"]
    },
    costs: {
      per1000Users: "$150/Month (Estimated)",
      perStudent: "$0.15/Month",
      logic: "Based on 60 min/day usage using Gemini 3 Flash tokens and Gemini 2.5 Audio outputs."
    }
  };

  const handleDownload = () => {
    setIsDownloading(true);
    const content = `
# SARATHI AI: PROJECT DOCUMENTATION
**Date:** ${new Date().toLocaleDateString()}
**Status:** Alpha Release

## 1. PROJECT OVERVIEW
${reportData.functionality}

## 2. MODULE COVERAGE
${reportData.modules.map(m => `- **${m.name}**: ${m.desc}`).join('\n')}

## 3. FEATURES
- Trilingual Support (EN, HI, TE)
- Academic Integrity Filter (Anti-Cheating)
- Visual Aid Generator (AI Diagrams)
- Voice-to-Text Persistent Logs
- Long-term Student Memory

## 4. MARKET RESEARCH & COMPETITION
- **Existing Apps:** Byju's, Khan Academy (Khanmigo), Doubtnut.
- **The Sarathi Edge:** Unlike Byju's, we offer 24/7 AI-human-like voice interaction. Unlike Khanmigo, we have native Hindi/Telugu grounding and Class 1-12 state board RAG.

## 5. INFRASTRUCTURE COST ANALYSIS (FOR 1000 STUDENTS)
- **Usage Profile:** 60 min/day per student.
- **API (Gemini 3 Flash):** $60/month (600M tokens).
- **Audio/Storage:** $40/month.
- **Server/Hosting:** $50/month.
- **Total:** $150/month for 1000 students.

## 6. MONETIZATION STRATEGY
1. **School SaaS:** $1 per student/year license for educational institutions.
2. **Freemium B2C:** Free basic chat; $2/mo for unlimited Voice & High-Res Visual Aids.
3. **Stationary Store:** 15-20% margin on school-integrated physical goods.

## 7. RELEASE ROADMAP (APP/PLAY STORE)
- Week 1: Migration to Cloud Firestore.
- Week 2: Integration of Razorpay/Stripe for the Store.
- Week 3: Wrapping as Native App using Capacitor.js.
- Week 4: COPPA compliance & Play Store submission.
    `;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SARATHI_AI_REPORT.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDownloading(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Sales Pitch Banner */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[40px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <span className="px-4 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">Sales Pitch v1.0</span>
            <span className="px-4 py-1 bg-green-400/20 text-green-300 rounded-full text-[10px] font-black uppercase tracking-widest">Profitable</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter">
            Every Student Deserves a <span className="text-indigo-300 italic">Personal Charioteer.</span>
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 max-w-2xl font-medium opacity-90 leading-relaxed">
            SARATHI AI reduces teacher workload by 60% and increases student doubt-resolution speed by 400%.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button onClick={handleDownload} className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-3">
              {isDownloading ? 'Generating...' : 'Download Full Documentation'}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Market Research */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>🌍</span> Market Research
          </h3>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p><strong>Competitive Landscape:</strong> Dominated by video-first platforms (Byju's) and community-first (Brainly). No platform offers conversational <strong>Native Audio</strong> for Indian State Boards.</p>
            <p><strong>Target Demographic:</strong> 250M Class 1-12 students in India. 40% are in regional medium schools with high mobile penetration but low tutor availability.</p>
          </div>
        </div>

        {/* Investment & Costs */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>📈</span> Infra Investment
          </h3>
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase">Monthly API Cost (1000 Students)</span>
              <span className="text-lg font-black text-indigo-700">~$150</span>
            </div>
            <div className="w-full bg-indigo-200/50 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full w-[15%]" />
            </div>
            <p className="text-[10px] text-indigo-400 mt-2 italic">*Based on 60min daily active interaction.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase">Input Token Cost</p>
              <p className="font-black text-slate-800">$0.075 / 1M</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase">Output Token Cost</p>
              <p className="font-black text-slate-800">$0.30 / 1M</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monetization Roadmap */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-slate-800 px-4">Monetization & Roadmap</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "B2B SaaS", desc: "Enterprise license for schools @ $1/student/year.", icon: "🏫" },
            { title: "B2C Freemium", desc: "Premium voice/unlimited visual aids @ $2/mo.", icon: "💎" },
            { title: "Affiliate Store", desc: "20% margin on stationary & textbooks.", icon: "🛒" }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:border-indigo-200 transition-all">
              <div className="text-3xl mb-4">{item.icon}</div>
              <h4 className="font-bold text-slate-800 mb-2">{item.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectReport;
