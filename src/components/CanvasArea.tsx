'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic'; // next/dynamicをインポート
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { v4 as uuidv4 } from 'uuid';
import { 
  cameraAtom, modeAtom, objectsAtom, 
  backgroundImageAtom, backgroundConfigAtom, drawingScaleAtom,
  calibrationModeAtom, calibrationPointsAtom,
  activeToolAtom, drawingStartPointAtom, drawingEndPointAtom,
  saveStateAtom, currentDiameterAtom 
} from '@/lib/jotai-store';
import { DuctPartType } from '@/lib/types';

// react-konva のコンポーネントをクライアントサイドでのみロード
const Stage = dynamic(() => import('react-konva').then(mod => mod.Stage), { ssr: false });
const Layer = dynamic(() => import('react-konva').then(mod => mod.Layer), { ssr: false });
const Line = dynamic(() => import('react-konva').then(mod => mod.Line), { ssr: false });
const Circle = dynamic(() => import('react-konva').then(mod => mod.Circle), { ssr: false });
const Text = dynamic(() => import('react-konva').then(mod => mod.Text), { ssr: false });
const Group = dynamic(() => import('react-konva').then(mod => mod.Group), { ssr: false });
const Arc = dynamic(() => import('react-konva').then(mod => mod.Arc), { ssr: false });
const KonvaImage = dynamic(() => import('react-konva').then(mod => mod.Image), { ssr: false });

// --- サブコンポーネント: 個別のダクト描画を担当 ---
const DuctObjectRenderer = ({ part, isSelected, drawingScale, zoom, onSelect }: any) => {
  const strokeWidth = (part.diameter / drawingScale) * 0.8;
  
  const getDuctColor = (diameter: number) => {
    if (diameter <= 150) return '#4CAF50'; 
    if (diameter <= 250) return '#2196F3'; 
    return '#FFC107'; 
  };
  const color = getDuctColor(part.diameter);

  // 1. 直管 (Straight)
  if (part.type === DuctPartType.Straight) {
    return (
      <Group onClick={(e) => onSelect(e, part)} onTap={(e) => onSelect(e, part)}>
        <Line
          points={part.points.flatMap((p: any) => [p.x, p.y])}
          stroke={color} strokeWidth={strokeWidth} opacity={0.9} lineCap="round"
          shadowColor={isSelected ? '#fff' : 'transparent'} shadowBlur={10}
        />
        <Line points={part.points.flatMap((p: any) => [p.x, p.y])} stroke="white" strokeWidth={1/zoom} dash={[10, 5]} />
        <Circle x={part.points[0].x} y={part.points[0].y} radius={3/zoom} fill="yellow" />
        <Circle x={part.points[1].x} y={part.points[1].y} radius={3/zoom} fill="yellow" />
        <Text 
          x={(part.points[0].x + part.points[1].x) / 2} y={(part.points[0].y + part.points[1].y) / 2} 
          text={`φ${part.diameter} L${part.length}`} fontSize={12/zoom} fill="white" stroke="black" strokeWidth={0.5}
        />
      </Group>
    );
  }

  // 2. エルボ (Elbow90)
  if (part.type === DuctPartType.Elbow90) {
    const radiusPx = (part.diameter / drawingScale);
    return (
      <Group
        x={part.points[0].x} y={part.points[0].y} rotation={part.rotation || 0}
        onClick={(e) => onSelect(e, part)} onTap={(e) => onSelect(e, part)}
      >
        <Arc
          innerRadius={radiusPx * 0.5} outerRadius={radiusPx * 1.5} angle={90}
          fill={color} opacity={0.9} shadowColor={isSelected ? '#fff' : 'transparent'} shadowBlur={10}
        />
        <Text x={radiusPx * 0.5} y={radiusPx * 0.5} text={`φ${part.diameter} EL`} fontSize={10/zoom} fill="white" rotation={-45} />
      </Group>
    );
  }

  // 3. レジューサ (Reducer) - 台形描画
  if (part.type === DuctPartType.Reducer) {
    const w1 = (part.diameter / drawingScale); // 入口幅
    const w2 = ((part.diameter2 || part.diameter * 0.75) / drawingScale); // 出口幅
    const len = (300 / drawingScale); // 既定長さ300mm相当
    
    return (
      <Group
        x={part.points[0].x} y={part.points[0].y} rotation={part.rotation || 0}
        onClick={(e) => onSelect(e, part)} onTap={(e) => onSelect(e, part)}
      >
        {/* 台形を描画 (Lineで閉じた形状を作る) */}
        <Line
          points={[
            0, -w1/2,  // 左上
            len, -w2/2, // 右上
            len, w2/2,  // 右下
            0, w1/2    // 左下
          ]}
          closed
          fill={color} opacity={0.9} stroke="white" strokeWidth={1/zoom}
          shadowColor={isSelected ? '#fff' : 'transparent'} shadowBlur={10}
        />
        <Text x={len/2} y={-10/zoom} text={`R ${part.diameter}x${part.diameter2||'?'}`} fontSize={10/zoom} fill="white" />
      </Group>
    );
  }

  // 4. T管 (Tee)
  if (part.type === DuctPartType.Tee) {
    const mainW = (part.diameter / drawingScale);
    const len = (400 / drawingScale); // 全長
    const branchLen = (200 / drawingScale); // 分岐長さ
    
    return (
      <Group
        x={part.points[0].x} y={part.points[0].y} rotation={part.rotation || 0}
        onClick={(e) => onSelect(e, part)} onTap={(e) => onSelect(e, part)}
      >
        {/* 主管 */}
        <Line
          points={[-len/2, 0, len/2, 0]}
          stroke={color} strokeWidth={mainW} lineCap="butt"
          shadowColor={isSelected ? '#fff' : 'transparent'} shadowBlur={10}
        />
        {/* 分岐管 */}
        <Line
          points={[0, 0, 0, branchLen]}
          stroke={color} strokeWidth={mainW} lineCap="butt"
        />
        <Text x={0} y={0} text={`Tee φ${part.diameter}`} fontSize={10/zoom} fill="white" />
      </Group>
    );
  }

  return null;
};

// --- メインコンポーネント ---
const CanvasArea = () => {
  const [camera, setCamera] = useAtom(cameraAtom);
  const [mode, setMode] = useAtom(modeAtom);
  const [objects, setObjects] = useAtom(objectsAtom);
  const saveState = useSetAtom(saveStateAtom);
  
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

  useEffect(() => {
    setStageSize({ w: window.innerWidth, h: window.innerHeight });
    const handleResize = () => setStageSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getWorldPos = (stage: any) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };
    return {
      x: (pointer.x - stage.x()) / stage.scaleX(),
      y: (pointer.y - stage.y()) / stage.scaleY(),
    };
  };

  // --- イベントハンドラ ---

  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    const pos = getWorldPos(stage);

    // 1. キャリブレーション
    if (isCalibrating) {
      const newPoints = [...calibPoints, pos];
      setCalibPoints(newPoints);
      if (newPoints.length === 2) {
        const dx = newPoints[1].x - newPoints[0].x;
        const dy = newPoints[1].y - newPoints[0].y;
        const pixelDist = Math.sqrt(dx * dx + dy * dy);
        
        // requestAnimationFrameで遅延させないとpromptがイベントをブロックすることがあるため
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

    // 2. 作図開始
    if (activeTool === 'straight') {
      setDrawStart(pos);
      setDrawEnd(pos);
      return;
    }

    // 3. 選択解除
    if (e.target === stage) {
      setSelectedId(null);
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pos = getWorldPos(stage);
    setMousePos(pos);

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
    if (drawStart && drawEnd && activeTool === 'straight') {
      const dx = drawEnd.x - drawStart.x;
      const dy = drawEnd.y - drawStart.y;
      const distPx = Math.sqrt(dx * dx + dy * dy);

      if (distPx > 5) {
        const lengthMm = distPx * drawingScale;
        const newDuct: any = {
          id: uuidv4(),
          type: DuctPartType.Straight,
          system: 'SA',
          diameter: currentDiameter,
          length: Math.round(lengthMm),
          points: [drawStart, drawEnd]
        };
        setObjects([...objects, newDuct]);
        saveState();
      }
      setDrawStart(null);
      setDrawEnd(null);
    }
  };

  // ★ 修正: 以前のエラー原因だった handleWheel を定義
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const newScale = e.evt.deltaY > 0 ? camera.zoom / scaleBy : camera.zoom * scaleBy;
    setCamera({ ...camera, zoom: newScale });
  };

  const handleObjectClick = (e: any, part: any) => {
    e.cancelBubble = true;
    setSelectedId(part.id);
    // エルボの場合は回転させる
    if (part.type === DuctPartType.Elbow90 && activeTool === 'select') {
       const newObjects = objects.map((obj: any) => {
         if (obj.id === part.id) {
           return { ...obj, rotation: (obj.rotation || 0) + 90 };
         }
         return obj;
       });
       setObjects(newObjects);
    }
  };

  return (
    <div className={`flex-1 bg-gray-800 relative overflow-hidden ${activeTool === 'straight' ? 'cursor-crosshair' : ''}`}>
      <div className="absolute top-4 left-4 z-50 flex gap-2">
         {isCalibrating && <div className="bg-yellow-500 px-3 py-1 rounded shadow font-bold animate-pulse">縮尺設定中</div>}
         {activeTool === 'straight' && <div className="bg-blue-500 text-white px-3 py-1 rounded shadow font-bold">作図モード: φ{currentDiameter} (Shiftで直交)</div>}
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
        onWheel={handleWheel} // 定義した関数を使用
        onDragEnd={(e) => { if(!drawStart) setCamera({ ...camera, x: e.target.x(), y: e.target.y() }) }}
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

          {/* オブジェクト描画: サブコンポーネントを使用して記述ミスを防止 */}
          {objects.map((part: any) => (
            <DuctObjectRenderer
              key={part.id}
              part={part}
              isSelected={selectedId === part.id}
              drawingScale={drawingScale}
              zoom={camera.zoom}
              onSelect={handleObjectClick}
            />
          ))}

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
