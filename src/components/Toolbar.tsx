'use client';

import React from 'react';

interface ToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onZoomIn, onZoomOut, onResetView }) => {
  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-md p-2 flex items-center justify-between z-10">
      <div className="flex items-center flex-wrap gap-x-1 md:gap-x-2 gap-y-1">
        <button title="元に戻す" className="p-2 rounded-md hover:bg-gray-200 opacity-50 cursor-not-allowed">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h12a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H7.5"/><path d="m6 12 3-3-3-3"/></svg>
        </button>
        <button title="やり直す" className="p-2 rounded-md hover:bg-gray-200 opacity-50 cursor-not-allowed">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 9H9a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h7.5"/><path d="m18 12-3-3 3-3"/></svg>
        </button>
        <div className="h-6 w-px bg-gray-300"></div>
        <button onClick={onZoomIn} title="ズームイン" className="p-2 rounded-md hover:bg-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>
        </button>
        <button onClick={onZoomOut} title="ズームアウト" className="p-2 rounded-md hover:bg-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/></svg>
        </button>
        <button onClick={onResetView} title="ビューをリセット" className="p-2 rounded-md hover:bg-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/></svg>
        </button>
      </div>
    </header>
  );
};
export default Toolbar;