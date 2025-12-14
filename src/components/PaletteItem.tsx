'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { useRef } from 'react';
import { FittingItem, DuctPartType } from "@/lib/types";
import { addObjectAtom, saveStateAtom, cameraAtom } from '@/lib/jotai-store';
import { screenToWorld } from '@/lib/canvas-utils';

interface PaletteItemProps {
  item: FittingItem;
  type: string; // This is the category name
}

const PaletteItem = ({ item, type }: PaletteItemProps) => {
  const addObject = useSetAtom(addObjectAtom);
  const saveState = useSetAtom(saveStateAtom);
  const camera = useAtomValue(cameraAtom);
  
  const itemRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);

  // --- PC (Mouse) Drag & Drop ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.setData('text/plain', type);
  };

  // --- Mobile (Touch) Drag & Drop Logic ---
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const target = itemRef.current;
    if (!target) return;

    // 1. ゴースト要素（ドラッグ中の見た目）を作成
    const ghost = target.cloneNode(true) as HTMLDivElement;
    ghost.style.position = 'fixed';
    ghost.style.left = `${touch.clientX - target.offsetWidth / 2}px`;
    ghost.style.top = `${touch.clientY - target.offsetHeight / 2}px`;
    ghost.style.opacity = '0.8';
    ghost.style.pointerEvents = 'none'; // キャンバスを判定できるようにイベントを透過
    ghost.style.zIndex = '9999';
    ghost.style.transform = 'scale(1.1)'; 
    ghost.style.transition = 'none';
    ghost.style.backgroundColor = 'white'; // 背景色を確保
    
    document.body.appendChild(ghost);
    ghostRef.current = ghost;

    // 2. グローバルなタッチイベントリスナーを登録
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalTouchEnd);
  };

  const handleGlobalTouchMove = (e: TouchEvent) => {
    // スクロールを防止してドラッグ操作を優先
    if (e.cancelable) e.preventDefault();
    
    const touch = e.touches[0];
    const ghost = ghostRef.current;
    if (ghost) {
      ghost.style.left = `${touch.clientX - ghost.offsetWidth / 2}px`;
      ghost.style.top = `${touch.clientY - ghost.offsetHeight / 2}px`;
    }
  };

  const handleGlobalTouchEnd = (e: TouchEvent) => {
    // ゴーストを削除
    const ghost = ghostRef.current;
    if (ghost) {
      document.body.removeChild(ghost);
      ghostRef.current = null;
    }

    // イベントリスナーを解除
    window.removeEventListener('touchmove', handleGlobalTouchMove);
    window.removeEventListener('touchend', handleGlobalTouchEnd);

    // 3. ドロップ位置の判定
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    // ドロップ先がキャンバスかどうかを確認
    if (element && element.tagName === 'CANVAS') {
      const canvas = element as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      const screenPos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
      
      // スクリーン座標をワールド座標に変換
      const worldPos = screenToWorld(screenPos, canvas, camera);

      // --- オブジェクトの作成 (useCanvasInteraction.ts のロジックを流用) ---
      const systemNameInput = document.getElementById('system-name') as HTMLInputElement | null;
      const diameterInput = document.getElementById('custom-diameter') as HTMLInputElement | null;
      const systemName = systemNameInput?.value || 'SYS';
      const defaultDiameter = diameterInput ? parseInt(diameterInput.value, 10) : 100;

      let newPart: any = {
        id: Date.now(),
        groupId: Date.now(),
        x: worldPos.x,
        y: worldPos.y,
        rotation: 0,
        isSelected: false,
        isFlipped: false,
        systemName: systemName,
        name: item.name || 'Unnamed',
        type: item.type,
        diameter: item.diameter || defaultDiameter,
      };

      // タイプ別のプロパティ設定
      switch (item.type) {
          case DuctPartType.Straight: newPart.length = item.length || 400; break;
          case DuctPartType.Damper: newPart.length = item.length || 100; break;
          case DuctPartType.Elbow90: newPart.legLength = item.legLength; break;
          case DuctPartType.AdjustableElbow: newPart.legLength = item.legLength; newPart.angle = item.angle; break;
          case DuctPartType.TeeReducer: newPart.length = item.length; newPart.branchLength = item.branchLength; newPart.diameter2 = item.diameter2; newPart.diameter3 = item.diameter3; newPart.intersectionOffset = item.intersectionOffset; break;
          case DuctPartType.YBranch: newPart.length = item.length; newPart.angle = item.angle; newPart.branchLength = item.branchLength; newPart.intersectionOffset = item.intersectionOffset; break;
          case DuctPartType.YBranchReducer: newPart.length = item.length; newPart.angle = item.angle; newPart.branchLength = item.branchLength; newPart.intersectionOffset = item.intersectionOffset; newPart.diameter2 = item.diameter2; newPart.diameter3 = item.diameter3; break;
          case DuctPartType.Reducer: newPart.length = item.length; newPart.diameter2 = item.diameter2; break;
      }

      // ストアに追加して保存
      addObject(newPart);
      saveState();
    }
  };

  const Icon = () => {
    const color = '#60a5fa';
    let shape: React.ReactNode;

    switch (item.type) {
      case DuctPartType.Elbow90:
        shape = <path d="M5 45 V 5 H 45" stroke={color} strokeWidth="10" fill="none" />;
        break;
      case DuctPartType.AdjustableElbow:
        shape = <path d="M5 45 L 25 25 L 45 35" stroke={color} strokeWidth="10" fill="none" />;
        break;
      case DuctPartType.TeeReducer:
        shape = <path d="M5 25 H 45 M 25 25 V 5" stroke={color} strokeWidth="10" fill="none" />;
        break;
      case DuctPartType.YBranch:
      case DuctPartType.YBranchReducer:
        shape = <path d="M5 25 H 45 M 25 25 L 40 10" stroke={color} strokeWidth="8" fill="none" />;
        break;
      case DuctPartType.Damper:
        shape = <><rect x="5" y="20" width="40" height="10" fill={color} /><line x1="10" y1="25" x2="40" y2="25" stroke="#1e293b" strokeWidth="2" /></>;
        break;
      case DuctPartType.Reducer:
        shape = <path d="M5 15 L 45 20 L 45 30 L 5 35 Z" fill={color} />;
        break;
      case DuctPartType.Straight:
      default:
        shape = <rect x="5" y="20" width="40" height="10" fill={color} />;
        break;
    }

    return (
      <svg viewBox="0 0 50 50" className="w-12 h-12 mx-auto">
        {shape}
      </svg>
    );
  };

  return (
    <div
      ref={itemRef}
      draggable
      onDragStart={handleDragStart}
      onTouchStart={handleTouchStart} // ★ タッチイベントを追加
      className="bg-white p-2 border rounded-md shadow-sm cursor-pointer text-center hover:shadow-lg transition-shadow touch-none select-none"
      title={item.name}
    >
      <Icon />
      <p className="text-sm mt-1 font-medium truncate">{item.name}</p>
    </div>
  );
};

export default PaletteItem;