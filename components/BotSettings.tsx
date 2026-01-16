
import React from 'react';
import { BotSettings as BotSettingsType } from '../types';

interface Props {
  settings: BotSettingsType;
  onUpdate: (settings: BotSettingsType) => void;
}

const BotSettings: React.FC<Props> = ({ settings, onUpdate }) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <h3 className="font-semibold text-slate-700 flex items-center gap-2">
        <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">⚙️</span>
        Mentor Configuration
      </h3>
      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Bot Name</label>
        <input
          type="text"
          value={settings.name}
          onChange={(e) => onUpdate({ ...settings, name: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          placeholder="E.g. Mentor Mark"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Persona</label>
        <div className="grid grid-cols-3 gap-2">
          {(['friend', 'mentor', 'teacher'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onUpdate({ ...settings, personality: p })}
              className={`px-2 py-2 text-sm rounded-lg capitalize transition-colors ${
                settings.personality === p
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BotSettings;
