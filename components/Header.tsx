import React from 'react';
import { Sparkles, Zap } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full py-3 px-4 md:px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-br from-banana-400 to-banana-600 rounded-lg shadow-lg shadow-banana-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              NanoEdit
            </h1>
            <p className="text-[10px] text-banana-400 font-medium tracking-wide leading-none">
              POWERED BY GEMINI NANO BANANA
            </p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
          <Sparkles className="w-3 h-3 text-banana-400" />
          <span>Multimodal Editing</span>
        </div>
      </div>
    </header>
  );
};