
import React from 'react';

interface HeaderProps {
  onClear: () => void;
}

const Header: React.FC<HeaderProps> = ({ onClear }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🌸</span>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">智能识花</h1>
        <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-500 rounded-full uppercase tracking-wider">
          AI Pro
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={onClear}
          className="p-2 text-gray-400 hover:text-[#059669] hover:bg-emerald-50 rounded-lg transition-colors duration-200"
          title="清除"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
        </button>
        <button 
          className="p-2 text-gray-400 hover:text-[#059669] hover:bg-emerald-50 rounded-lg transition-colors duration-200"
          title="关于"
          onClick={() => alert("智能识花 v1.0\n基于最先进的 AI 技术，为您探索自然的奥秘。")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
