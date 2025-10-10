'use client';

import React from 'react';
import { Toolbar } from '@/components/Toolbar';
import { Palette } from '@/components/Palette';
import { CanvasArea } from '@/components/CanvasArea';
import { useAppStore } from '@/store/store';

const Page = () => {
  const isPaletteOpen = useAppStore((state) => state.isPaletteOpen);

  return (
    <div className="flex flex-col md:flex-row w-screen h-screen bg-gray-100 text-gray-800">
      <main className="flex-1 flex flex-col relative">
        <Toolbar />
        <CanvasArea />
      </main>
      {isPaletteOpen && <Palette />}
    </div>
  );
};

export default Page;
