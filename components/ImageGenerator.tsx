
import React, { useState } from 'react';
import { Sparkles, Monitor, Layout, ArrowRight } from 'lucide-react';
import { Resolution, AspectRatio } from '../types';

interface ImageGeneratorProps {
  onGenerate: (prompt: string, resolution: Resolution, aspectRatio: AspectRatio) => void;
  isLoading: boolean;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onGenerate, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<Resolution>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [showResMenu, setShowResMenu] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onGenerate(prompt, resolution, aspectRatio);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto animate-fade-in">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-4 focus-within:border-banana-500/50 transition-all shadow-xl backdrop-blur-sm">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to create..."
            className="w-full h-24 bg-transparent border-none outline-none text-white resize-none placeholder:text-slate-600 text-sm md:text-base"
            disabled={isLoading}
          />
          
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-700/50 mt-2">
            <div className="flex items-center gap-2">
              {/* Aspect Ratio Picker */}
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                {(['1:1', '16:9', '9:16'] as AspectRatio[]).map((ar) => (
                  <button
                    key={ar}
                    type="button"
                    onClick={() => setAspectRatio(ar)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${aspectRatio === ar ? 'bg-banana-500 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {ar}
                  </button>
                ))}
              </div>

              {/* Resolution Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowResMenu(!showResMenu)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-white flex items-center gap-2 transition-colors min-w-[70px] justify-center"
                >
                  <Monitor className="w-3 h-3" />
                  <span className="text-[10px] font-bold">{resolution}</span>
                </button>
                
                {showResMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-32 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-50">
                    {['1K', '2K', '4K'].map((res) => (
                      <button
                        key={res}
                        type="button"
                        onClick={() => { setResolution(res as Resolution); setShowResMenu(false); }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 ${resolution === res ? 'text-banana-400 font-bold' : 'text-slate-300'}`}
                      >
                        <span>{res}</span>
                        {res !== '1K' && <span className="text-[8px] px-1 bg-banana-500/20 text-banana-400 rounded">PRO</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className={`
                flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs transition-all
                ${prompt.trim() && !isLoading 
                  ? 'bg-gradient-to-r from-banana-500 to-banana-600 text-white shadow-lg shadow-banana-500/30 hover:scale-105 active:scale-95' 
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
              `}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
