'use client';

import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { FittingItem, DuctPartType } from "@/lib/types";
import { addObjectAtom, saveStateAtom, cameraAtom } from '@/lib/jotai-store';
import { screenToWorld } from '@/lib/duct-calculations';
import { v4 as uuidv4 } from 'uuid';

interface PaletteItemProps {
  item: FittingItem;
  type?: string;
}

const PaletteItem = ({ item }: PaletteItemProps) => {
  // ドラッグ開始時の処理
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex flex-col items-center justify-center p-2 bg-white border border-gray-200 rounded cursor-grab hover:shadow-md active:cursor-grabbing transition-all select-none"
      title={item.name}
    >
      <div className="text-xl mb-1 text-indigo-600 font-bold">
        {/* 簡易アイコン表示: 文字列ではなくEnumと比較する */}
        {item.type === DuctPartType.Straight && '━'}
        {item.type === DuctPartType.Elbow90 && 'Lr'}
        {item.type === DuctPartType.Reducer && '><'}
        {item.type === DuctPartType.Tee && 'T'}
        {item.type === DuctPartType.Cap && 'C'}
        {item.type === DuctPartType.Damper && 'D'}
        
        {/* 未定義のアイコンの場合 */}
        {![
          DuctPartType.Straight, 
          DuctPartType.Elbow90, 
          DuctPartType.Reducer, 
          DuctPartType.Tee, 
          DuctPartType.Cap, 
          DuctPartType.Damper
        ].includes(item.type) && '?'}
      </div>
      <div className="text-xs font-medium text-gray-700 text-center line-clamp-2 w-full">
        {item.name}
      </div>
      <div className="text-[10px] text-gray-500">
        φ{item.diameter}
      </div>
    </div>
  );
};

export default PaletteItem;