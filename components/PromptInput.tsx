import React, { useState } from 'react';
import { Send, Wand2, Monitor, Settings2 } from 'lucide-react';
import { Resolution } from '../types';

interface PromptInputProps {
  onSubmit: (prompt: string, resolution: Resolution) => void;
  isLoading: boolean;
  onMaskModeSuggestion?: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, isLoading, onMaskModeSuggestion = false }) => {
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<Resolution>('1K');
  const [showResMenu, setShowResMenu] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt, resolution);
    }
  };

  const suggestions = onMaskModeSuggestion ? [
    "Make it red",
    "Remove this object",
    "Change to a cat",
    "Add flowers",
    "Make it brighter"
  ] : [
    "Remove background",
    "Cyberpunk city style",
    "Pencil sketch",
    "Add a cute robot",
    "Vintage polaroid"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === "Remove background") {
      // Optimized prompt for background removal
      setPrompt("Remove background, isolate subject, white background");
    } else {
      setPrompt(suggestion);
    }
  };

  const handleMagicEnhance = () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
        // If empty, provide a general enhancement prompt based on improving quality
        setPrompt("Enhance image quality, professional lighting, 4k resolution, highly detailed, sharp focus");
    } else {
        // If text exists, preserve intent and append quality modifiers
        setPrompt(`${trimmedPrompt}, professional studio lighting, 8k resolution, highly detailed, cinematic composition, masterpiece`);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-4">
      <form onSubmit={handleSubmit} className="relative group flex gap-2">
        {/* Main Input Container */}
        <div className="relative flex-1 flex items-center bg-slate-900 rounded-lg border border-slate-700 shadow-xl overflow-hidden focus-within:border-banana-500/50 transition-colors">
          <div className="pl-3 text-slate-500 hover:text-banana-400 cursor-pointer transition-colors" title="Magic Enhance" onClick={handleMagicEnhance}>
            <Wand2 className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={onMaskModeSuggestion ? "Describe how to change the selected area..." : "Describe your edit (e.g., 'Add fireworks')"}
            className="w-full bg-transparent border-none outline-none text-white px-3 py-3 focus:ring-0 placeholder:text-slate-600 text-[16px]"
            disabled={isLoading}
          />
        </div>

        {/* Resolution & Submit Controls */}
        <div className="flex gap-2">
           {/* Resolution Selector */}
           <div className="relative">
             <button
               type="button"
               onClick={() => setShowResMenu(!showResMenu)}
               className="h-full px-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 flex items-center gap-2 transition-colors min-w-[80px] justify-center"
               title="Output Resolution"
             >
               <Monitor className="w-4 h-4" />
               <span className="text-xs font-bold">{resolution}</span>
             </button>
             
             {showResMenu && (
               <div className="absolute bottom-full right-0 mb-2 w-32 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-20">
                 <div className="p-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider bg-slate-950/50 border-b border-slate-800">
                   Resolution
                 </div>
                 {['1K', '2K', '4K'].map((res) => (
                   <button
                     key={res}
                     type="button"
                     onClick={() => { setResolution(res as Resolution); setShowResMenu(false); }}
                     className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 ${resolution === res ? 'text-banana-400 font-bold' : 'text-slate-300'}`}
                   >
                     <span>{res}</span>
                     {res !== '1K' && <span className="text-[9px] px-1 bg-banana-500/20 text-banana-400 rounded">PRO</span>}
                   </button>
                 ))}
               </div>
             )}
             {/* Backdrop to close menu */}
             {showResMenu && <div className="fixed inset-0 z-10" onClick={() => setShowResMenu(false)} />}
           </div>

           {/* Submit Button */}
           <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className={`
                px-4 rounded-lg flex items-center justify-center transition-all duration-200
                ${prompt.trim() && !isLoading 
                  ? 'bg-banana-500 text-slate-900 hover:bg-banana-400 shadow-md shadow-banana-500/20' 
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
              `}
            >
              <Send className="w-5 h-5" />
            </button>
        </div>
      </form>

      {/* Quick suggestions */}
      <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={isLoading}
            className={`
              text-[10px] px-2.5 py-1 rounded-full border transition-all
              ${onMaskModeSuggestion 
                ? 'bg-banana-500/10 border-banana-500/30 text-banana-200 hover:bg-banana-500/20' 
                : index === 0 && !onMaskModeSuggestion // Highlight the first item (Remove Background) specially
                  ? 'bg-slate-800 text-banana-400 border-banana-500/30 hover:bg-banana-500/10 hover:border-banana-400'
                  : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-banana-500/50 hover:text-banana-200 hover:bg-slate-800'}
            `}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};