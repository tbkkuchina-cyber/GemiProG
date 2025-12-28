import { RefObject, useCallback, useEffect, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { v4 as uuidv4 } from 'uuid';
import { 
  cameraAtom, 
  modeAtom, 
  objectsAtom, 
  selectedObjectIdAtom, 
  dragStateAtom,
  pendingActionAtom,
  isPanningAtom,
  addDimensionAtom,
  updateStraightDuctLengthAtom,
  drawingScaleAtom
} from '@/lib/jotai-store';
import { 
  AnyDuctPart, 
  DuctPartType, 
  Point, 
  SnapResult,
  StraightDuct,
  FittingItem
} from '@/lib/types';
import { 
  screenToWorld, 
  getSnapPoints, 
  distance, 
  createDuctPart 
} from '@/lib/duct-calculations';

const CONNECT_DISTANCE = 15;

export const useCanvasInteraction = (canvasRef: RefObject<HTMLDivElement>) => {
  const [camera, setCamera] = useAtom(cameraAtom);
  const [mode, setMode] = useAtom(modeAtom);
  const [objects, setObjects] = useAtom(objectsAtom);
  // ID型変更に対応: string | null
  const [selectedObjectId, setSelectedObjectId] = useAtom(selectedObjectIdAtom);
  const [dragState, setDragState] = useAtom(dragStateAtom);
  const [pendingAction, setPendingAction] = useAtom(pendingActionAtom);
  const setIsPanning = useSetAtom(isPanningAtom);
  
  // 履歴保存用（簡易）
  const saveState = useCallback(() => {
    // 将来的にundo/redoを実装
  }, []);

  // スナップ計算
  const findBestSnap = useCallback((draggedGroupId: string, currentObjects: AnyDuctPart[]): SnapResult => {
    let bestSnap: SnapResult = { dist: Infinity, dx: 0, dy: 0, otherObj: null };
    const snapDist = CONNECT_DISTANCE / camera.zoom;
    const draggedObjects = currentObjects.filter(o => o.groupId === draggedGroupId);
    
    for (const draggedObj of draggedObjects) {
      const draggedModel = createDuctPart(draggedObj);
      if (!draggedModel) continue;
      
      const draggedSnaps = getSnapPoints(draggedModel);
      
      // 他のオブジェクトとの距離判定
      for (const otherObj of currentObjects) {
        if (otherObj.groupId === draggedGroupId) continue; // 同じグループは除外
        
        const otherModel = createDuctPart(otherObj);
        if (!otherModel) continue;
        
        const otherSnaps = getSnapPoints(otherModel);
        
        for (const ds of draggedSnaps) {
          for (const os of otherSnaps) {
            const distSq = (ds.x - os.x) ** 2 + (ds.y - os.y) ** 2;
            if (distSq < snapDist * snapDist && distSq < bestSnap.dist) {
              bestSnap = {
                dist: distSq,
                dx: os.x - ds.x,
                dy: os.y - ds.y,
                otherObj: otherObj
              };
            }
          }
        }
      }
    }
    return bestSnap;
  }, [camera.zoom]);

  // マウスダウン処理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const worldPoint = screenToWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top }, canvasRef.current!, camera);

    if (mode === 'pan' || e.button === 1 || e.shiftKey) {
      setIsPanning(true);
      return;
    }

    // ヒットテスト (簡易判定)
    let clickedObject: AnyDuctPart | null = null;
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (distance(worldPoint, {x: obj.x, y: obj.y}) < (obj.diameter || 200) / 2) {
        clickedObject = obj;
        break;
      }
    }

    if (clickedObject) {
      setSelectedObjectId(clickedObject.id); // string IDをセット
      
      const initialPositions = new Map<string, Point>();
      objects.forEach(obj => {
        if (obj.groupId === clickedObject!.groupId) {
          initialPositions.set(obj.id, { x: obj.x, y: obj.y });
        }
      });

      setDragState({
        isDragging: true,
        targetId: clickedObject.id,
        initialPositions,
        offset: worldPoint
      });
    } else {
      setSelectedObjectId(null);
    }
  }, [camera, mode, objects, setIsPanning, setDragState, setSelectedObjectId, canvasRef]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const worldPoint = screenToWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top }, canvasRef.current!, camera);

    if (dragState.isDragging && dragState.targetId && dragState.initialPositions) {
      const dx = worldPoint.x - dragState.offset.x;
      const dy = worldPoint.y - dragState.offset.y;

      const movedObjects = objects.map(obj => {
        if (dragState.initialPositions!.has(obj.id)) {
          const initPos = dragState.initialPositions!.get(obj.id)!;
          return { ...obj, x: initPos.x + dx, y: initPos.y + dy };
        }
        return obj;
      });

      const targetObj = movedObjects.find(o => o.id === dragState.targetId);
      let snapDx = 0, snapDy = 0;
      if (targetObj) {
        const snapResult = findBestSnap(targetObj.groupId, movedObjects);
        if (snapResult.otherObj) {
          snapDx = snapResult.dx;
          snapDy = snapResult.dy;
        }
      }

      const newObjects = objects.map(obj => {
        if (dragState.initialPositions!.has(obj.id)) {
          const initPos = dragState.initialPositions!.get(obj.id)!;
          return { 
            ...obj, 
            x: initPos.x + dx + snapDx, 
            y: initPos.y + dy + snapDy 
          };
        }
        return obj;
      });

      setObjects(newObjects);
    }
  }, [camera, dragState, objects, findBestSnap, setObjects, canvasRef]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState(prev => ({ ...prev, isDragging: false, initialPositions: null, targetId: null }));
      saveState();
    }
    setIsPanning(false);
  }, [dragState.isDragging, setDragState, setIsPanning, saveState]);

  // --- タッチ操作ハンドラ (簡易実装) ---
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // タッチ対応が必要な場合はここに実装 (handleMouseDownと同様)
  }, []);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // タッチ対応が必要な場合はここに実装 (handleMouseMoveと同様)
  }, []);

  const handleTouchEnd = useCallback(() => {
    // タッチ対応が必要な場合はここに実装 (handleMouseUpと同様)
  }, []);


  // --- パレットからのドロップ処理 ---
  useEffect(() => {
    if (!pendingAction) return;

    if (pendingAction === 'add-straight-duct-at-center') {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const centerScreen = { x: rect.width / 2, y: rect.height / 2 };
        const worldCenter = screenToWorld(centerScreen, canvasRef.current!, camera);
        
        const systemNameInput = document.getElementById('system-name') as HTMLInputElement | null;
        const diameterInput = document.getElementById('custom-diameter') as HTMLInputElement | null;
        
        const systemName = systemNameInput?.value || 'SA-1';
        const diameter = diameterInput ? parseInt(diameterInput.value, 10) : 200;

        const newDuct: StraightDuct = {
            id: uuidv4(),
            groupId: uuidv4(),
            type: DuctPartType.Straight,
            x: worldCenter.x,
            y: worldCenter.y,
            length: 400,
            diameter: diameter,
            name: `直管 φ${diameter}`,
            rotation: 0,
            systemName: systemName,
            isSelected: true,
            isFlipped: false
        };

        setObjects(prev => [...prev, newDuct]);
        setSelectedObjectId(newDuct.id);
        saveState();
        setPendingAction(null);
    }
  }, [pendingAction, camera, canvasRef, setObjects, setSelectedObjectId, saveState, setPendingAction]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const itemJson = e.dataTransfer.getData('application/json');
    if (!itemJson) return;

    try {
        const item = JSON.parse(itemJson) as FittingItem;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const worldPoint = screenToWorld(screenPoint, canvasRef.current!, camera);

        const systemNameInput = document.getElementById('system-name') as HTMLInputElement | null;
        const diameterInput = document.getElementById('custom-diameter') as HTMLInputElement | null;
        
        const systemName = systemNameInput?.value || 'SA-1';
        const defaultDiameter = diameterInput ? parseInt(diameterInput.value, 10) : 200;

        const baseProps = {
            id: uuidv4(),
            groupId: uuidv4(),
            x: worldPoint.x,
            y: worldPoint.y,
            rotation: 0,
            isSelected: true,
            isFlipped: false,
            systemName: systemName,
            name: item.name || 'Unnamed',
            diameter: item.diameter || defaultDiameter
        };

        let newPart: AnyDuctPart;

        switch (item.type) {
            case DuctPartType.Straight:
                newPart = { ...baseProps, type: DuctPartType.Straight, length: item.length || 400 } as StraightDuct;
                break;
            case DuctPartType.Elbow90:
                newPart = { ...baseProps, type: DuctPartType.Elbow90, legLength: item.legLength || baseProps.diameter } as AnyDuctPart;
                break;
            case DuctPartType.Reducer:
                newPart = { ...baseProps, type: DuctPartType.Reducer, length: item.length || 300, diameter2: item.diameter2 || (baseProps.diameter - 50) } as AnyDuctPart;
                break;
            case DuctPartType.Tee:
                newPart = { ...baseProps, type: DuctPartType.Tee } as AnyDuctPart;
                break;
            // その他の型も同様に追加...
            default:
                // デフォルトは直管扱いなど、安全策
                newPart = { ...baseProps, type: DuctPartType.Straight, length: 400 } as StraightDuct;
                break;
        }

        setObjects(prev => [...prev, newPart]);
        setSelectedObjectId(newPart.id);
        saveState();

    } catch (err) {
        console.error("Drop failed:", err);
    }
  }, [camera, canvasRef, setObjects, setSelectedObjectId, saveState]);


  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart: () => {}, 
    handleTouchMove: () => {},
    handleTouchEnd: () => {},
    handleDragOver,
    handleDrop
  };
};