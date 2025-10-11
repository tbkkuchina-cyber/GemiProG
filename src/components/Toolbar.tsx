'use client';

import React from 'react';
import { useAppStore } from '@/store/store';

export const Toolbar = () => {
  const togglePalette = useAppStore((state) => state.togglePalette);
  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-md p-2 flex items-center z-10">
      <button onClick={togglePalette} title="パレット開閉" className="p-2 rounded-md hover:bg-gray-200">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>
      </button>
      <h1 className="font-semibold text-lg ml-4">GemiProG</h1>
    </header>
  );
};
