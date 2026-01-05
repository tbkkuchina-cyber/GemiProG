'use client';

import React from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import PaletteItem from "./PaletteItem";
import { 
  fittingsAtom, 
  pendingActionAtom, 
  openFittingsModalAtom,
  currentDiameterAtom,
  objectsAtom,
  saveStateAtom
} from '@/lib/jotai-store';
import TakeoffPanel from './TakeoffPanel';
import { DuctPartType } from '@/lib/types';
import { Plus, RotateCw } from 'lucide-react';

const Palette = () => {
  const fittings = useAtomValue(fittingsAtom);
  const setPendingAction = useSetAtom(pendingActionAtom);
  const openFittingsModal = useSetAtom(openFittingsModalAtom);
  
  const [currentDiameter, setCurrentDiameter] = useAtom(currentDiameterAtom);
  const [objects, setObjects] = useAtom(objectsAtom);
  const saveState = useSetAtom(saveStateAtom);

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200 w-72 flex-shrink-0 z-10 shadow-inner overflow-hidden">
      
      {/* 1. 直径設定パネル */}
      <div className="p-4 bg-white border-b border-gray-200 shadow-sm">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          現在の口径 (mm)
        </label>
        <div className="flex items-center space-x-2">
          <input 
            type="number" 
            value={currentDiameter}
            onChange={(e) => setCurrentDiameter(Number(e.target.value))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
        </div>
      </div>

      {/* 2. 部材リスト (スクロール領域) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* クイックアクション */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            クイック操作
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPendingAction('add-straight-duct-at-center')}
              className="flex items-center justify-center gap-1 bg-white border border-dashed border-gray-400 text-gray-600 p-2 rounded hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-600 transition-all text-xs font-bold"
            >
              <Plus size={14} />
              直管追加
            </button>
            <button 
              className="flex items-center justify-center gap-1 bg-white border border-gray-300 text-gray-600 p-2 rounded hover:bg-gray-100 text-xs"
              onClick={() => {
                setObjects(prev => {
                  if(prev.length===0) return prev;
                  const newArr = [...prev];
                  const last = newArr[newArr.length-1];
                  last.rotation = (last.rotation || 0) + 90;
                  return newArr;
                });
                saveState();
              }}
            >
              <RotateCw size={14} />
              直近を回転
            </button>
          </div>
        </div>

        {/* カテゴリ別部材 */}
        {Object.entries(fittings).map(([category, items]) => (
          <div key={category}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {category}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {items.filter(item => item.visible !== false).map((item) => (
                <PaletteItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
        
        {/* 積算結果表示 */}
        <div className="pt-4 border-t border-gray-200">
           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
             リアルタイム積算
           </h3>
           <TakeoffPanel />
        </div>
      </div>
    </div>
  );
};

export default Palette;