'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Stage, Layer, Line, Circle, Text, Group, Image as KonvaImage } from 'react-konva';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { v4 as uuidv4 } from 'uuid';
import {
  cameraAtom, modeAtom, objectsAtom,
  backgroundImageAtom, backgroundConfigAtom, drawingScaleAtom,
  calibrationModeAtom, calibrationPointsAtom,
  activeToolAtom, drawingStartPointAtom, drawingEndPointAtom,
  saveStateAtom, currentDiameterAtom, selectedObjectIdAtom,
  allDimensionsAtom, addDimensionAtom, // ★追加
  isDimensionModalOpenAtom, dimensionModalContentAtom // ★追加
} from '@/lib/jotai-store';
import { DuctPartType, FittingItem, AnyDuctPart, StraightDuct, Point, Dimension } from '@/lib/types';
import { screenToWorld, distance, getSnapPoints, createDuctPart } from '@/lib/duct-calculations';
import { getPointForDim } from '@/lib/canvas-utils'; // ★追加

const SNAP_THRESHOLD = 15;

// --- サブコンポーネント: 個別のダクト描画 (変更なし) ---
const DuctObjectRenderer = ({ part, isSelected, drawingScale, zoom, onSelect, onDragStart, onDragMove, onDragEnd }: any) => {
  // ... (前回のコードと同じ内容) ...
  const strokeWidth = (part.diameter / drawingScale) * 0.8;
  const getDuctColor = (diameter: number) => {
    if (diameter <= 150) return '#4CAF50'; 
    if (diameter <= 250) return '#2196F3'; 
    return '#FFC107'; 
  };
  const color = getDuctColor(part.diameter);
  const draggable = true;

  if (part.type === DuctPartType.Straight) {
    const pts = part.points || [];
    if (pts.length < 2) return null;
    return (
      <Group 
        id={part.id}
        onClick={(e) => onSelect(e, part)} 
        onTap={(e) => onSelect(e, part)}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      >
        <Line
          points={pts.flatMap((p: any) => [p.x, p.y])}
          stroke={color} strokeWidth={strokeWidth} opacity={0.9} lineCap="round"
          shadowColor={isSelected ? '#fff' : 'transparent'} shadowBlur={10}
        />
        <Line points={pts.flatMap((p: any) => [p.x, p.y])} stroke="white" strokeWidth={1/zoom} dash={[10, 5]} />
        <Circle x={pts[0].x} y={pts[0].y} radius={3/zoom} fill="yellow" />
        <Circle x={pts[1].x} y={pts[1].y} radius={3/zoom} fill="yellow" />
        <Text 
          x={(pts[0].x + pts[1].x) / 2} y={(pts[0].y + pts[1].y) / 2} 
          text={`φ${part.diameter} L${part.length}`} fontSize={12/zoom} fill="white" stroke="black" strokeWidth={0.5}
        />
      </Group>
    );
  }

  const p = part.points && part.points[0] ? part.points[0] : { x: part.x, y: part.y };
  
  return (
    <Group
      id={part.id}
      x={p.x} y={p.y} 
      rotation={part.rotation || 0}
      onClick={(e) => onSelect(e, part)} 
      onTap={(e) => onSelect(e, part)}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    >
      <Circle radius={(part.diameter/drawingScale)/2} fill={color} opacity={0.8} />
      {isSelected && <Circle radius={(part.diameter/drawingScale)/2 + 2} stroke="#fff" strokeWidth={2} />}
      <Text text={part.type} fontSize={10/zoom} fill="white" x={-10} y={-5} />
    </Group>
  );
};

// --- ★修正: 寸法線レンダラー (イベント追加) ---
const DimensionRenderer = ({ dim, objects, zoom }: { dim: Dimension, objects: AnyDuctPart[], zoom: number }) => {
    const setIsModalOpen = useSetAtom(isDimensionModalOpenAtom); // ★追加
    const setModalContent = useSetAtom(dimensionModalContentAtom); // ★追加

    const p1 = getPointForDim(dim.p1_objId, dim.p1_pointType, String(dim.p1_pointId), objects);
    const p2 = getPointForDim(dim.p2_objId, dim.p2_pointType, String(dim.p2_pointId), objects);

    if (!p1 || !p2) return null;

    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;
    
    // ダブルクリック時のハンドラ
    const handleDblClick = (e: any) => {
        e.cancelBubble = true; // バブリング停止
        
        // 直管の長さを制御している寸法線かどうか判定
        // (簡易判定: p1とp2が同じオブジェクトIDなら、それは直管自身の長さ)
        const isSelfDimension = dim.p1_objId === dim.p2_objId;
        
        setModalContent({
            currentValue: dim.value,
            // 寸法線が直管自身の長さを表している場合、そのIDを渡して更新可能にする
            ductToUpdateId: isSelfDimension ? dim.p1_objId : undefined,
            isManual: dim.isManual
        });
        setIsModalOpen(true);
    };

    return (
        <Group 
            onDblClick={handleDblClick} // PC用
            onTap={handleDblClick}      // タッチ用 (ダブルタップ判定が必要だが簡易的にタップで代用可、または別途実装)
            onMouseEnter={(e) => { e.target.getStage()!.container().style.cursor = 'pointer'; }}
            onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = 'default'; }}
        >
            {/* ヒット判定用の透明な太い線 */}
            <Line points={[p1.x, p1.y, p2.x, p2.y]} stroke="transparent" strokeWidth={10/zoom} />
            
            {/* 可視線 */}
            <Line points={[p1.x, p1.y, p2.x, p2.y]} stroke="#3b82f6" strokeWidth={1.5/zoom} />
            <Circle x={p1.x} y={p1.y} radius={3/zoom} fill="#3b82f6" />
            <Circle x={p2.x} y={p2.y} radius={3/zoom} fill="#3b82f6" />
            
            {/* 数値ラベル */}
            <Group x={cx} y={cy}>
                {/* 背景（読みやすくするため） */}
                <Text 
                    text={`${Math.round(dim.value)}mm`} 
                    fontSize={12/zoom} 
                    fill="#1e3a8a" 
                    align="center"
                    verticalAlign="middle"
                    offsetX={20}
                    offsetY={6}
                    padding={2}
                    fillAfterStrokeEnabled={true}
                />
            </Group>
        </Group>
    );
};


// --- メインコンポーネント ---
const CanvasArea = () => {
  const [camera, setCamera] = useAtom(cameraAtom);
  const [mode, setMode] = useAtom(modeAtom);
  const [objects, setObjects] = useAtom(objectsAtom);
  const dimensions = useAtomValue(allDimensionsAtom); // ★追加
  const addDimension = useSetAtom(addDimensionAtom); // ★追加
  const saveState = useSetAtom(saveStateAtom);
  const setSelectedObjectId = useSetAtom(selectedObjectIdAtom);
  
  const bgImage = useAtomValue(backgroundImageAtom);
  const bgConfig = useAtomValue(backgroundConfigAtom);
  const [drawingScale, setDrawingScale] = useAtom(drawingScaleAtom);
  const currentDiameter = useAtomValue(currentDiameterAtom);
  
  const [isCalibrating, setIsCalibrating] = useAtom(calibrationModeAtom);
  const [calibPoints, setCalibPoints] = useAtom(calibrationPointsAtom);

  const [activeTool, setActiveTool] = useAtom(activeToolAtom);
  const [drawStart, setDrawStart] = useAtom(drawingStartPointAtom);
  const [drawEnd, setDrawEnd] = useAtom(drawingEndPointAtom);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ w: 800, h: 600 });
  
  const [snapIndicator, setSnapIndicator] = useState<{x: number, y: number} | null>(null);

  // ★追加: 寸法作成用の一時ステート
  const [dimStartObj, setDimStartObj] = useState<{id: string, pointId: number|string} | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStageSize({ w: window.innerWidth, h: window.innerHeight });
      const handleResize = () => setStageSize({ w: window.innerWidth, h: window.innerHeight });
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const getWorldPos = (stage: any) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };
    return {
      x: (pointer.x - stage.x()) / stage.scaleX(),
      y: (pointer.y - stage.y()) / stage.scaleY(),
    };
  };

  // ... (handleDragOver, handleDrop は変更なし) ...
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemJson = e.dataTransfer.getData('application/json');
    if (!itemJson) return;

    try {
        const item = JSON.parse(itemJson) as FittingItem;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const worldPoint = screenToWorld(screenPoint, containerRef.current!, camera);

        const systemName = 'SA-1';
        const defaultDiameter = item.diameter || currentDiameter || 200;

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
            diameter: defaultDiameter
        };

        let newPart: AnyDuctPart;

        if (item.type === DuctPartType.Straight) {
             const len = item.length || 400;
             newPart = {
                ...baseProps,
                type: DuctPartType.Straight,
                length: len,
                points: [{x: worldPoint.x, y: worldPoint.y}, {x: worldPoint.x + len, y: worldPoint.y}]
            } as StraightDuct;
        } else {
            newPart = {
                ...baseProps,
                type: item.type,
                points: [{x: worldPoint.x, y: worldPoint.y}]
            } as AnyDuctPart;
        }

        setObjects((prev: AnyDuctPart[]) => [...prev, newPart]);
        setSelectedObjectId(newPart.id);
        saveState();
    } catch (err) {
        console.error("Drop failed:", err);
    }
  };


  // ... (handleObjectDragStart, handleObjectDragMove, handleObjectDragEnd は変更なし) ...
  const handleObjectDragStart = (e: any) => {
    const id = e.target.id();
    setSelectedId(id);
    setSelectedObjectId(id);
  };

  const handleObjectDragMove = (e: any) => {
    const target = e.target;
    const targetId = target.id();
    const pos = { x: target.x(), y: target.y() };
    
    let bestSnap: { x: number, y: number } | null = null;
    let minDidst = SNAP_THRESHOLD / camera.zoom;

    for (const obj of objects) {
      if (obj.id === targetId) continue;
      const snaps = getSnapPoints(obj);
      for (const sp of snaps) {
        const d = distance(pos, sp);
        if (d < minDidst) {
          minDidst = d;
          bestSnap = sp;
        }
      }
    }

    if (bestSnap) {
      target.position({ x: bestSnap.x, y: bestSnap.y });
      setSnapIndicator(bestSnap);
    } else {
      setSnapIndicator(null);
    }
  };


  const handleObjectDragEnd = (e: any) => {
    const target = e.target;
    const targetId = target.id();
    const finalPos = { x: target.x(), y: target.y() };
    setSnapIndicator(null);
    setObjects(prev => prev.map(obj => {
      if (obj.id === targetId) {
        if (obj.type === DuctPartType.Straight && obj.points) {
           const dx = finalPos.x;
           const dy = finalPos.y; 
           const newPoints = obj.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
           target.position({ x: 0, y: 0 });
           return { ...obj, points: newPoints };
        } else {
           return { ...obj, x: finalPos.x, y: finalPos.y };
        }
      }
      return obj;
    }));
    saveState();
  };


  // --- マウスイベントハンドラ (修正: 寸法ツール対応) ---

  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    const pos = getWorldPos(stage);

    // 1. 縮尺設定モード
    if (isCalibrating) {
      // ... (前回のコードと同じ) ...
      const newPoints = [...calibPoints, pos];
      setCalibPoints(newPoints);
      if (newPoints.length === 2) {
        const dx = newPoints[1].x - newPoints[0].x;
        const dy = newPoints[1].y - newPoints[0].y;
        const pixelDist = Math.sqrt(dx * dx + dy * dy);
        setTimeout(() => {
            const realDistStr = prompt(`実際の距離(mm)を入力:\n(Pixel: ${pixelDist.toFixed(1)}px)`);
            if (realDistStr) {
              const realDist = parseFloat(realDistStr);
              if (!isNaN(realDist) && realDist > 0) {
                setDrawingScale(realDist / pixelDist);
                alert(`縮尺設定完了: 1px = ${(realDist / pixelDist).toFixed(3)}mm`);
              }
            }
            setIsCalibrating(false);
            setCalibPoints([]);
        }, 10);
      }
      return;
    }

    // 2. 直管描画モード
    if (activeTool === 'straight') {
      setDrawStart(pos);
      setDrawEnd(pos);
      return;
    }

    // 3. ★追加: 寸法作成モード
    if (activeTool === 'dimension') {
        // クリックした場所に近いオブジェクトのスナップポイントを探す
        let clickedObjId: string | null = null;
        let clickedPointId: number | string = 0;
        let minDist = 20 / camera.zoom;

        objects.forEach(obj => {
            const snaps = getSnapPoints(obj);
            snaps.forEach((sp, idx) => {
                const d = distance(pos, sp);
                if (d < minDist) {
                    minDist = d;
                    clickedObjId = obj.id;
                    clickedPointId = idx;
                }
            });
        });

        if (clickedObjId) {
            if (!dimStartObj) {
                // 1点目セット
                setDimStartObj({ id: clickedObjId, pointId: clickedPointId });
            } else {
                // 2点目セット -> 寸法作成
                const p1 = getPointForDim(dimStartObj.id, 'connector', String(dimStartObj.pointId), objects);
                const p2 = getPointForDim(clickedObjId, 'connector', String(clickedPointId), objects);
                
                if (p1 && p2) {
                    const dist = distance(p1, p2) * drawingScale; // 実寸計算
                    const newDim: Dimension = {
                        id: uuidv4(),
                        p1_objId: dimStartObj.id,
                        p1_pointId: dimStartObj.pointId,
                        p1_pointType: 'connector',
                        p2_objId: clickedObjId!,
                        p2_pointId: clickedPointId,
                        p2_pointType: 'connector',
                        value: dist,
                        isManual: true
                    };
                    addDimension(newDim);
                }
                setDimStartObj(null); // リセット
            }
        } else {
            // 何もないところをクリックしたらキャンセル
            setDimStartObj(null);
        }
        return;
    }

    // 4. 選択解除
    if (e.target === stage) {
      setSelectedId(null);
      setSelectedObjectId(null);
      setDimStartObj(null);
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pos = getWorldPos(stage);
    setMousePos(pos);

    // 直管描画中のガイド更新
    if (drawStart) {
      if (e.evt.shiftKey) {
        const dx = Math.abs(pos.x - drawStart.x);
        const dy = Math.abs(pos.y - drawStart.y);
        if (dx > dy) {
          setDrawEnd({ x: pos.x, y: drawStart.y });
        } else {
          setDrawEnd({ x: drawStart.x, y: pos.y });
        }
      } else {
        setDrawEnd(pos);
      }
    }
  };

  const handleMouseUp = () => {
    // 直管の作成完了処理 (前回のコードと同じ) 
    if (drawStart && drawEnd && activeTool === 'straight') {
      const dx = drawEnd.x - drawStart.x;
      const dy = drawEnd.y - drawStart.y;
      const distPx = Math.sqrt(dx * dx + dy * dy);

      if (distPx > 5) {
        const lengthMm = distPx * drawingScale;
        const newDuct: StraightDuct = {
          id: uuidv4(),
          groupId: uuidv4(),
          type: DuctPartType.Straight,
          systemName: 'SA',
          name: 'Straight',
          diameter: currentDiameter,
          length: Math.round(lengthMm),
          x: drawStart.x, y: drawStart.y,
          rotation: 0,
          isSelected: false,
          isFlipped: false,
          points: [drawStart, drawEnd]
        };
        setObjects((prev: AnyDuctPart[]) => [...prev, newDuct]);
        saveState();
      }
      setDrawStart(null);
      setDrawEnd(null);
    }
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const newScale = e.evt.deltaY > 0 ? camera.zoom / scaleBy : camera.zoom * scaleBy;
    setCamera({ ...camera, zoom: newScale });
  };

  const handleObjectClick = (e: any, part: any) => {
    // 寸法モード中はオブジェクト選択しない（スナップを優先）
    if (activeTool === 'dimension') return; 
    
    e.cancelBubble = true;
    setSelectedId(part.id);
    setSelectedObjectId(part.id);
  };

  return (
    <div 
      ref={containerRef}
      className={`flex-1 bg-gray-800 relative overflow-hidden ${activeTool === 'straight' || activeTool === 'dimension' ? 'cursor-crosshair' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="absolute top-4 left-4 z-50 flex gap-2">
         {isCalibrating && <div className="bg-yellow-500 px-3 py-1 rounded shadow font-bold animate-pulse">縮尺設定中</div>}
         {activeTool === 'straight' && <div className="bg-blue-500 text-white px-3 py-1 rounded shadow font-bold">作図モード: φ{currentDiameter} (Shiftで直交)</div>}
         {activeTool === 'dimension' && <div className="bg-green-500 text-white px-3 py-1 rounded shadow font-bold">寸法モード: 2点をクリック {dimStartObj ? '(1点目選択済み)' : ''}</div>}
      </div>

      <Stage
        width={stageSize.w}
        height={stageSize.h}
        draggable={mode === 'pan' && !drawStart}
        x={camera.x}
        y={camera.y}
        scaleX={camera.zoom}
        scaleY={camera.zoom}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onDragEnd={(e) => { 
            if (e.target === e.target.getStage()) {
                if(!drawStart) setCamera({ ...camera, x: e.target.x(), y: e.target.y() });
            }
        }}
      >
        <Layer>
          {bgImage && (
            <KonvaImage
              image={bgImage}
              x={bgConfig.x}
              y={bgConfig.y}
              opacity={bgConfig.opacity}
              scaleX={bgConfig.scale}
              scaleY={bgConfig.scale}
            />
          )}

          <Group opacity={bgImage ? 0.3 : 1}>
             {Array.from({length: 40}).map((_, i) => (
                <Line key={`g-${i}`} points={[i*500 - 5000, -5000, i*500 - 5000, 5000]} stroke="#444" strokeWidth={1/camera.zoom} dash={[10, 10]} />
             ))}
             {Array.from({length: 40}).map((_, i) => (
                <Line key={`g2-${i}`} points={[-5000, i*500 - 5000, 5000, i*500 - 5000]} stroke="#444" strokeWidth={1/camera.zoom} dash={[10, 10]} />
             ))}
          </Group>

          {/* 部材の描画 */}
          {objects.map((part: any) => (
            <DuctObjectRenderer
              key={part.id}
              part={part}
              isSelected={selectedId === part.id}
              drawingScale={drawingScale}
              zoom={camera.zoom}
              onSelect={handleObjectClick}
              onDragStart={handleObjectDragStart}
              onDragMove={handleObjectDragMove}
              onDragEnd={handleObjectDragEnd}
            />
          ))}

          {/* ★追加: 寸法線の描画 */}
          {dimensions.map(dim => (
              <DimensionRenderer 
                  key={dim.id} 
                  dim={dim} 
                  objects={objects} 
                  zoom={camera.zoom} 
              />
          ))}

          {/* スナップガイド */}
          {snapIndicator && (
             <Circle 
               x={snapIndicator.x} 
               y={snapIndicator.y} 
               radius={8 / camera.zoom} 
               stroke="#FF00FF" 
               strokeWidth={2 / camera.zoom} 
               dash={[4, 2]} 
             />
          )}

          {/* 直管描画中のガイド */}
          {drawStart && drawEnd && (
            <Group>
               <Line
                 points={[drawStart.x, drawStart.y, drawEnd.x, drawEnd.y]}
                 stroke="cyan" strokeWidth={2/camera.zoom} dash={[5, 5]}
               />
               <Text 
                 x={drawEnd.x + 10} y={drawEnd.y + 10} 
                 text={`${(Math.sqrt(Math.pow(drawEnd.x-drawStart.x,2) + Math.pow(drawEnd.y-drawStart.y,2)) * drawingScale).toFixed(0)}mm`}
                 fill="cyan" fontSize={14/camera.zoom}
               />
            </Group>
          )}

          {isCalibrating && calibPoints.map((p, i) => (
             <Circle key={i} x={p.x} y={p.y} radius={5/camera.zoom} fill="red" />
          ))}

          {!drawStart && (
             <Circle x={mousePos.x} y={mousePos.y} radius={3/camera.zoom} stroke="lime" strokeWidth={1/camera.zoom} />
          )}

        </Layer>
      </Stage>
    </div>
  );
};

export default CanvasArea;
