'use client';

import React from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { RotateCw, FlipHorizontal, Trash2, Link2Off } from 'lucide-react';
import { DuctPartType } from '@/lib/types';
import {
  deleteSelectedObjectAtom,
  rotateSelectedObjectAtom,
  flipSelectedObjectAtom,
  disconnectSelectedObjectAtom,
  selectedObjectAtom,
  objectsAtom
} from '@/lib/jotai-store';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
}

const ContextMenu = ({ isOpen, position }: ContextMenuProps) => {
  const deleteSelectedObject = useSetAtom(deleteSelectedObjectAtom);
  const rotateSelectedObject = useSetAtom(rotateSelectedObjectAtom);
  const flipSelectedObject = useSetAtom(flipSelectedObjectAtom);
  const disconnectSelectedObject = useSetAtom(disconnectSelectedObjectAtom);
  const selectedObject = useAtomValue(selectedObjectAtom);
  const objects = useAtomValue(objectsAtom);

  if (!isOpen || !selectedObject) return null;

  // 反転可能な部材かどうか判定
  const isFlippable = selectedObject.type === DuctPartType.AdjustableElbow ||
    selectedObject.type === DuctPartType.TeeReducer ||
    selectedObject.type === DuctPartType.YBranch ||
    selectedObject.type === DuctPartType.YBranchReducer ||
    selectedObject.type === DuctPartType.Reducer;

  return (
    <div
      className="absolute bg-white shadow-lg rounded-md p-1 flex items-center space-x-1 z-50 border border-gray-200"
      style={{ left: position.x, top: position.y }}
    >
      <button 
        onClick={() => rotateSelectedObject()} 
        title="回転 (R)" 
        className="p-2 rounded-md hover:bg-gray-100 text-gray-700"
      >
        <RotateCw size={18} />
      </button>

      <button 
        onClick={() => flipSelectedObject()} 
        title="反転 (F)" 
        className={`p-2 rounded-md hover:bg-gray-100 text-gray-700 ${!isFlippable ? 'opacity-30 cursor-not-allowed' : ''}`} 
        disabled={!isFlippable}
      >
        <FlipHorizontal size={18} />
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1"></div>

      <button 
        onClick={() => disconnectSelectedObject()} 
        title="接続解除" 
        className="p-2 rounded-md hover:bg-gray-100 text-gray-700"
      >
        <Link2Off size={18} />
      </button>

      <button 
        onClick={() => deleteSelectedObject()} 
        title="削除 (Delete)" 
        className="p-2 rounded-md hover:bg-red-50 text-red-600"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default ContextMenu;