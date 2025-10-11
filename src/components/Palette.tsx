'use client';

import React, { useState } from 'react';
// import { useAppStore } from '@/store/store'; // Commented out for diagnosis


export const Palette = () => {
  // const { addObject, isPaletteOpen } = useAppStore(state => ({ addObject: state.addObject, isPaletteOpen: state.isPaletteOpen })); // Commented out for diagnosis
  const addObject = (partType: string, options: Record<string, unknown>) => { console.log('addObject called', partType, options); }; // No-op for diagnosis
  const isPaletteOpen = true; // Hardcoded for diagnosis
  const [diameter, setDiameter] = useState(100);

  if (!isPaletteOpen) return null;

  const handleAddDuct = () => {
    addObject('StraightDuct', { diameter, length: 300 });
  };

  return (
    <aside className="w-full md:w-64 bg-white shadow-lg p-4 order-first md:order-last">
      <h2 className="font-bold text-lg mb-4">部品パレット</h2>
      <div className="space-y-2">
        <div>
          <label htmlFor="diameter-input" className="block text-sm font-medium text-gray-700">直径 (mm)</label>
          <input 
            type="number" 
            id="diameter-input"
            value={diameter}
            onChange={(e) => setDiameter(parseInt(e.target.value, 10) || 0)}
            className="w-full p-2 mt-1 border rounded-md"
            step="25"
          />
        </div>
        <button 
          onClick={handleAddDuct}
          className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
        >
          直管を追加
        </button>
      </div>
    </aside>
  );
};
