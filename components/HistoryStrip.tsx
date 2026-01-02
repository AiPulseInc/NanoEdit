import React from 'react';
import { EditHistoryItem } from '../types';
import { History, Clock } from 'lucide-react';

interface HistoryStripProps {
  items: EditHistoryItem[];
  activeId: string | null;
  onSelect: (item: EditHistoryItem) => void;
}

export const HistoryStrip: React.FC<HistoryStripProps> = ({ items, activeId, onSelect }) => {
  if (items.length === 0) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mt-2 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-2 text-xs text-slate-400 px-1">
        <History className="w-3 h-3" />
        <span className="font-medium uppercase tracking-wider">Edit History</span>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide snap-x">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className={`
              relative group flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 snap-start
              ${activeId === item.id 
                ? 'border-banana-500 shadow-md shadow-banana-500/20 scale-105 z-10' 
                : 'border-slate-700 hover:border-slate-500 opacity-70 hover:opacity-100'}
            `}
            title={item.prompt}
          >
            <img 
              src={item.imageUrl} 
              alt={item.prompt} 
              className="w-full h-full object-cover"
            />
            {activeId === item.id && (
              <div className="absolute inset-0 bg-banana-500/10 pointer-events-none" />
            )}
            {/* Tooltip on hover (desktop) */}
            <div className="absolute inset-x-0 bottom-0 bg-black/80 text-[8px] md:text-[10px] text-white p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
              {item.prompt}
            </div>
          </button>
        ))}
        
        {/* Spacer for right padding in scroll view */}
        <div className="w-2 flex-shrink-0" />
      </div>
    </div>
  );
};