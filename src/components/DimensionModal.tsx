'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { useSetAtom } from 'jotai';
import { addDimensionAtom, updateStraightDuctLengthAtom } from '@/lib/jotai-store';
import { Dimension, SnapPoint } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface DimensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  // contentには、新規作成時の情報か、既存寸法の編集情報が入ります
  content: {
    p1?: SnapPoint; // 新規作成用
    p2?: SnapPoint; // 新規作成用
    currentValue?: number; // 編集用
    ductToUpdateId?: string; // 長さを変更すべきダクトのID
    isManual?: boolean;
  } | null;
}

const DimensionModal = ({ isOpen, onClose, content }: DimensionModalProps) => {
  const addDimension = useSetAtom(addDimensionAtom);
  const updateStraightDuctLength = useSetAtom(updateStraightDuctLengthAtom);
  
  const [distance, setDistance] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && content) {
      const val = content.currentValue || 0;
      setDistance(val);
      setInputValue(val.toFixed(0));
      // モーダルが開いたらフォーカス
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, content]);

  if (!isOpen || !content) return null;

  const isUpdatingDuct = !!content.ductToUpdateId;

  const handleConfirm = () => {
    const val = parseFloat(inputValue);
    if (isNaN(val) || val <= 0) {
      alert("有効な数値を入力してください");
      return;
    }

    if (isUpdatingDuct && content.ductToUpdateId) {
      // 直管の長さを更新するアクションを実行
      updateStraightDuctLength({ id: content.ductToUpdateId, length: val });
    } else if (content.p1 && content.p2) {
      // 新規の手動寸法線を追加する場合（CanvasAreaで実装済みだが、ここでも対応可能にしておく）
      // 今回のCanvasArea実装ではクリックで即追加しているため、ここは予備ロジック
    }

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-lg font-bold">
            {isUpdatingDuct ? 'ダクト長さ変更' : '寸法値の確認'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            距離 / 長さ (mm)
          </label>
          <input 
            ref={inputRef}
            type="number" 
            value={inputValue} 
            onChange={(e) => {
                setInputValue(e.target.value);
                setDistance(parseFloat(e.target.value));
            }} 
            onKeyDown={handleKeyDown} 
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-right font-mono text-lg"
            autoFocus
          />
          {isUpdatingDuct && (
            <p className="text-xs text-gray-500 mt-2">
              ※数値を変更すると、選択した直管の長さが更新されます。
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-bold shadow-sm"
          >
            確定
          </button>
        </div>
      </div>
    </div>
  );
};

export default DimensionModal;