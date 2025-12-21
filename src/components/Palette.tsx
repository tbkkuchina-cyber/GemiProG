'use client';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import PaletteItem from "./PaletteItem";
// 修正: パスの先頭のスペースを削除しました (' @/lib/jotai-store')
import { fittingsAtom, addObjectAtom, openFittingsModalAtom, pendingActionAtom, isPaletteOpenAtom, currentDiameterAtom, objectsAtom, saveStateAtom } from '@/lib/jotai-store';
import TakeoffPanel from './TakeoffPanel';
import { v4 as uuidv4 } from 'uuid';
// 修正: パスの先頭のスペースを削除しました (' @/lib/types')
import { DuctPartType, AnyDuctPart } from '@/lib/types';
import { useState, useEffect } from 'react';

const Palette = () => {
  const fittings = useAtomValue(fittingsAtom);
  const setPendingAction = useSetAtom(pendingActionAtom);
  const openFittingsModal = useSetAtom(openFittingsModalAtom);
  const isPaletteOpen = useAtomValue(isPaletteOpenAtom);
  
  const [currentDiameter, setCurrentDiameter] = useAtom(currentDiameterAtom);
  const [objects, setObjects] = useAtom(objectsAtom);
  const saveState = useSetAtom(saveStateAtom);

  // 汎用的な追加関数
  const addPart = (type: DuctPartType, opts: any = {}) => {
    const newPart: AnyDuctPart = {
      id: uuidv4(),
      type,
      system: 'SA',
      diameter: currentDiameter,
      points: [{x: 400, y: 300}], // 中央付近
      rotation: 0,
      length: 0,
      ...opts
    };
    setObjects((prev) => [...prev, newPart]);
    saveState();
  };

  // UIレンダリング
  if (!isPaletteOpen) return null;

  return (
    <aside id="palette" className="w-full h-64 shrink-0 md:h-auto md:w-64 md:shrink-0 bg-white shadow-lg p-4 overflow-y-auto order-last md:order-first z-20">
      
      {/* 1. 共通設定 */}
      <div className="mb-4 border-b pb-4">
        <h3 className="text-xs font-bold text-gray-500 mb-2">基本設定</h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-400 block">系統名</label>
            <input type="text" defaultValue="SA-1" className="w-full p-1 border rounded text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block">基本直径 (mm)</label>
            <input 
              type="number" 
              value={currentDiameter}
              onChange={(e) => setCurrentDiameter(Number(e.target.value))}
              step="25" min="50"
              className="w-full p-1 border rounded font-bold text-lg text-indigo-700" 
            />
          </div>
        </div>
      </div>

      {/* 2. 部品追加ボタン */}
      <div className="mb-4 border-b pb-4">
        <h3 className="text-xs font-bold text-gray-500 mb-2">部品配置</h3>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setPendingAction('add-straight-duct-at-center')} className="btn-part">直管</button>
          <button onClick={() => addPart(DuctPartType.Elbow90)} className="btn-part">90°エルボ</button>
          <button onClick={() => addPart(DuctPartType.Tee)} className="btn-part">T管 (チーズ)</button>
          <button onClick={() => addPart(DuctPartType.Reducer, { diameter2: currentDiameter - 50 })} className="btn-part">レジューサ</button>
        </div>
      </div>

      {/* 3. プロパティ編集 (選択中のオブジェクト) */}
      <div className="mb-6 bg-gray-50 p-2 rounded border border-gray-200">
        <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          選択中の部材編集
        </h3>
        <div className="text-xs text-gray-400 mb-2">キャンバスでクリックした部材</div>
        
        {/* デモ用: 最後のオブジェクトを強制編集するUI */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-400">直径変更</label>
            <button 
              className="w-full bg-white border rounded px-1 py-1 text-xs hover:bg-gray-100"
              onClick={() => {
                setObjects(prev => {
                  if(prev.length===0) return prev;
                  const newArr = [...prev];
                  newArr[newArr.length-1].diameter = currentDiameter;
                  return newArr;
                });
              }}
            >
              反映
            </button>
          </div>
          <div>
            <label className="text-[10px] text-gray-400">回転</label>
            <button 
              className="w-full bg-white border rounded px-1 py-1 text-xs hover:bg-gray-100"
              onClick={() => {
                setObjects(prev => {
                  if(prev.length===0) return prev;
                  const newArr = [...prev];
                  const last = newArr[newArr.length-1];
                  last.rotation = (last.rotation || 0) + 90;
                  return newArr;
                });
              }}
            >
              +90°
            </button>
          </div>
        </div>
      </div>

      {/* 4. 積算パネル */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">積算結果</h3>
        <TakeoffPanel />
      </div>

      <style jsx>{`
        .btn-part {
          @apply bg-white border border-gray-300 text-gray-700 text-xs font-semibold py-2 px-1 rounded hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm;
        }
      `}</style>
    </aside>
  );
};

export default Palette;