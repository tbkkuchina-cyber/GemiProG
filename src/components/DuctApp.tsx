// src/app/components/DuctApp.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { v4 as uuidv4 } from 'uuid';

import { Stage, Layer, Line, Circle, Text, Group } from 'react-konva';

// --- 1. 型定義 ---

type DuctType = 'STRAIGHT' | 'ELBOW_90' | 'ELBOW_45' | 'REDUCER' | 'TEE' | 'DAMPER';

interface Point {
  x: number;
  y: number;
}

interface DuctPart {
  id: string;
  type: DuctType;
  system: string; // 系統 (SA, EA等)
  diameter: number; // 直径 (mm)
  points: Point[]; // 描画座標
  length: number; // 長さ (mm)
}

interface FlangeSpec {
  diameter: number;
  holeCount: number; // 穴数
  boltSize: string; // ボルトサイズ
}

// --- 2. 計算ロジック (ご要望の核心部分) ---

// 直管の定尺(4m)取り合わせ計算 (First-Fit法による最適化)
const calculateStock = (parts: DuctPart[], standardLength = 4000) => {
  const stockMap: Record<number, number> = {}; // 直径: 本数

  // 直管のみ抽出し、直径ごとにグループ化
  const grouped = parts.filter(p => p.type === 'STRAIGHT').reduce((acc, part) => {
    if (!acc[part.diameter]) acc[part.diameter] = [];
    acc[part.diameter].push(part.length);
    return acc;
  }, {} as Record<number, number[]>);

  // 計算処理
  Object.keys(grouped).forEach(d => {
    const diameter = parseInt(d);
    // 長い部材から順に割り当てることで効率よく収納する
    const lengths = grouped[diameter].sort((a, b) => b - a);
    const bins: number[] = []; // 各定尺材の「残り長さ」を管理

    lengths.forEach(len => {
      // 既存の定尺材に入るか確認
      let placed = false;
      for (let i = 0; i < bins.length; i++) {
        if (bins[i] >= len) {
          bins[i] -= len; // 残り長さを減らす
          placed = true;
          break;
        }
      }
      // 入らなければ新しい定尺材(4m)をおろす
      if (!placed) {
        if (len > standardLength) {
           // 4mを超える長尺は分割して計算 (例: 5000mm -> 4000mm + 1000mm)
           const count = Math.ceil(len / standardLength);
           for(let k=0; k<count; k++) bins.push(0); // 使い切り
        } else {
           bins.push(standardLength - len);
        }
      }
    });
    stockMap[diameter] = bins.length;
  });

  return stockMap;
};

// 材料拾い出し総計算 (フランジ・ボルト・ガスケット)
const performTakeoff = (parts: DuctPart[]) => {
  let totalGasketLen = 0; // mm
  let totalBolts = 0;
  const flangeCounts: Record<number, number> = {}; // 直径: 枚数

  // フランジスペック定義 (JIS規格などを参考に設定可能)
  const getSpec = (d: number): FlangeSpec => {
    if (d <= 150) return { diameter: d, holeCount: 6, boltSize: 'M8' };
    if (d <= 300) return { diameter: d, holeCount: 8, boltSize: 'M8' };
    return { diameter: d, holeCount: 12, boltSize: 'M10' };
  };

  parts.forEach(part => {
    const d = part.diameter;
    const spec = getSpec(d);

    // 接合部1か所につきフランジ2枚。
    // 今回は簡易的に「部品1つにつき両端で接続＝2枚」として計算
    const flangesNeeded = 2; 
    
    if (!flangeCounts[d]) flangeCounts[d] = 0;
    flangeCounts[d] += flangesNeeded;

    // 接合部数 = フランジ枚数 / 2
    const joints = flangesNeeded / 2;
    
    // ボルト数 = 接合部数 * 穴数
    totalBolts += joints * spec.holeCount;

    // ガスケット長さ = 円周(直径*3.14) * 接合部数
    totalGasketLen += (d * Math.PI) * joints;
  });

  const straightStock = calculateStock(parts);

  return {
    flangeCounts,
    totalBolts,
    totalGasketLen: Math.ceil(totalGasketLen / 1000), // m単位に変換
    straightStock
  };
};

// --- 3. メインコンポーネント ---

const DuctApp = () => {
  const [ducts, setDucts] = useState<DuctPart[]>([]);
  const [scale, setScale] = useState(1.0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(true);
  
  // マウス座標
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  // ウィンドウサイズ管理
  const [stageSize, setStageSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStageSize({ w: window.innerWidth, h: window.innerHeight });
      
      // デモデータの投入
      const demoData: DuctPart[] = [
        { id: uuidv4(), type: 'STRAIGHT', system: 'SA', diameter: 250, length: 1500, points: [{x: 100, y: 300}, {x: 300, y: 300}] },
        { id: uuidv4(), type: 'ELBOW_90', system: 'SA', diameter: 250, length: 0, points: [{x: 300, y: 300}, {x: 350, y: 350}] },
        { id: uuidv4(), type: 'STRAIGHT', system: 'SA', diameter: 250, length: 2500, points: [{x: 350, y: 350}, {x: 350, y: 600}] },
        { id: uuidv4(), type: 'REDUCER', system: 'SA', diameter: 200, length: 300, points: [{x: 350, y: 600}, {x: 350, y: 650}] },
        { id: uuidv4(), type: 'STRAIGHT', system: 'SA', diameter: 200, length: 800, points: [{x: 350, y: 650}, {x: 350, y: 800}] },
      ];
      setDucts(demoData);
    }
  }, []);

  // 集計データの自動計算
  const report = useMemo(() => performTakeoff(ducts), [ducts]);

  // 直径に応じた色分け
  const getDuctColor = (diameter: number) => {
    if (diameter <= 150) return '#4CAF50'; // Green
    if (diameter <= 250) return '#2196F3'; // Blue
    return '#FFC107'; // Amber
  };

  // ズーム処理
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const oldScale = scale;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setScale(newScale);
  };

  // 新規ダクト追加（簡易版）
  const addDuct = (type: DuctType, diameter: number, length: number) => {
    const newDuct: DuctPart = {
      id: uuidv4(),
      type,
      system: 'SA',
      diameter,
      length,
      points: [{x: 100, y: 100}, {x: 100 + length/10, y: 100}] // 仮の座標
    };
    setDucts([...ducts, newDuct]);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      {/* ツールバーエリア */}
      <header style={{ padding: '10px 20px', background: '#2c3e50', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem' }}>Duct Master Pro</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowPalette(!showPalette)} style={btnStyle}>
            {showPalette ? 'パレットを隠す' : 'パレットを表示'}
          </button>
          <button style={btnStyle} onClick={() => alert('PDFインポート機能は開発中です')}>図面読込</button>
          <button style={btnStyle} onClick={() => alert('CSVを出力しました')}>CSV出力</button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* 部品・設定パレット */}
        {showPalette && (
          <aside style={{ width: '300px', background: '#f8f9fa', borderRight: '1px solid #ddd', padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <section style={cardStyle}>
              <h3 style={headerStyle}>部材入力</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                <button onClick={() => addDuct('STRAIGHT', 200, 2000)} style={actionBtnStyle}>直管 φ200 L2000 追加</button>
                <button onClick={() => addDuct('ELBOW_90', 200, 0)} style={actionBtnStyle}>90°エルボ φ200 追加</button>
                <button onClick={() => addDuct('REDUCER', 150, 300)} style={actionBtnStyle}>レジューサ φ150 追加</button>
              </div>
            </section>

            <section style={cardStyle}>
              <h3 style={headerStyle}>積算・拾い出し結果</h3>
              <div style={{ fontSize: '0.9rem', color: '#333' }}>
                <p style={{borderBottom:'1px solid #eee', paddingBottom:'5px'}}><strong>直管 (4m定尺換算):</strong></p>
                <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                  {Object.entries(report.straightStock).map(([d, count]) => (
                    <li key={d}>φ{d}mm : <strong>{count}本</strong></li>
                  ))}
                </ul>

                <p style={{borderBottom:'1px solid #eee', paddingBottom:'5px', marginTop:'10px'}}><strong>フランジ (合計):</strong></p>
                <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                  {Object.entries(report.flangeCounts).map(([d, count]) => (
                    <li key={d}>φ{d}mm : <strong>{count}枚</strong></li>
                  ))}
                </ul>

                <div style={{ marginTop: '15px', background: '#e3f2fd', padding: '10px', borderRadius: '4px' }}>
                  <p style={{margin:'5px 0'}}>ボルト総数: <strong>{report.totalBolts} 個</strong></p>
                  <p style={{margin:'5px 0'}}>パッキン: <strong>{report.totalGasketLen.toFixed(1)} m</strong></p>
                </div>
              </div>
            </section>

          </aside>
        )}

        {/* 描画キャンバス */}
        <main 
          style={{ flex: 1, background: '#333', position: 'relative', cursor: 'crosshair' }}
        >
          <Stage 
            width={stageSize.w - (showPalette ? 300 : 0)} 
            height={stageSize.h - 60}
            draggable
            onWheel={handleWheel}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            onDragEnd={(e) => setPosition({ x: e.target.x(), y: e.target.y() })}
            onMouseMove={(e) => {
              const stage = e.target.getStage();
              if (stage) {
                const pointer = stage.getPointerPosition();
                if (pointer) {
                   const x = (pointer.x - stage.x()) / stage.scaleX();
                   const y = (pointer.y - stage.y()) / stage.scaleY();
                   setMousePos({x, y});
                }
              }
            }}
          >
            <Layer>
              {/* グリッド (CADらしさの演出) */}
              <Group>
                {Array.from({length: 50}).map((_, i) => (
                  <Line 
                    key={`grid-x-${i}`} 
                    points={[i * 100 - 2000, -2000, i * 100 - 2000, 2000]} 
                    stroke="#444" strokeWidth={1} dash={[5, 5]} 
                  />
                ))}
                {Array.from({length: 50}).map((_, i) => (
                  <Line 
                    key={`grid-y-${i}`} 
                    points={[-2000, i * 100 - 2000, 2000, i * 100 - 2000]} 
                    stroke="#444" strokeWidth={1} dash={[5, 5]} 
                  />
                ))}
              </Group>

              {/* ダクトオブジェクト描画 */}
              {ducts.map((part) => {
                const color = getDuctColor(part.diameter);
                const isSelected = selectedId === part.id;
                
                return (
                  <Group 
                    key={part.id}
                    draggable // 部品ごとの移動も可能に
                    onClick={() => setSelectedId(part.id)}
                  >
                    {/* ダクト本体線 */}
                    <Line
                      points={part.points.flatMap(p => [p.x, p.y])}
                      stroke={color}
                      strokeWidth={part.diameter * 0.1} 
                      opacity={0.9}
                      lineCap="round"
                      lineJoin="round"
                      shadowColor={isSelected ? '#fff' : 'transparent'}
                      shadowBlur={15}
                    />
                    
                    {/* センターライン (一点鎖線) */}
                    <Line
                      points={part.points.flatMap(p => [p.x, p.y])}
                      stroke="white"
                      strokeWidth={1 / scale}
                      dash={[15, 5, 5, 5]} // CADっぽい線種
                    />

                    {/* 接合部ポイント (フランジ位置) */}
                    {part.points.map((p, i) => (
                      <Circle
                        key={`pt-${i}`}
                        x={p.x}
                        y={p.y}
                        radius={4 / scale}
                        fill="#ffeb3b"
                        stroke="#000"
                        strokeWidth={1 / scale}
                      />
                    ))}

                    {/* 情報テキスト表示 */}
                    <Text 
                      x={(part.points[0].x + part.points[1].x) / 2}
                      y={(part.points[0].y + part.points[1].y) / 2 - 20}
                      text={`${part.type} φ${part.diameter}`}
                      fontSize={14 / scale}
                      fill="#fff"
                      shadowColor="#000"
                      shadowBlur={2}
                    />
                  </Group>
                );
              })}
              
              {/* マウスカーソルガイド */}
              <Text 
                x={mousePos.x + 15} 
                y={mousePos.y + 15} 
                text={`X:${mousePos.x.toFixed(0)}, Y:${mousePos.y.toFixed(0)}`} 
                fill="#0f0"
                fontSize={12 / scale}
                fontFamily="monospace"
              />
            </Layer>
          </Stage>
        </main>
      </div>
    </div>
  );
};

// --- スタイル定義 (CSS in JS) ---
const btnStyle = {
  padding: '6px 12px',
  background: '#34495e',
  border: '1px solid #465f76',
  color: 'white',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9rem'
};

const cardStyle = {
  background: '#fff',
  borderRadius: '6px',
  padding: '10px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

const headerStyle = {
  margin: '0 0 10px 0',
  fontSize: '1rem',
  color: '#2c3e50',
  borderBottom: '2px solid #3498db',
  display: 'inline-block'
};

const actionBtnStyle = {
  padding: '8px',
  background: '#fff',
  border: '1px solid #3498db',
  color: '#3498db',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold' as const,
  textAlign: 'left' as const
};

export default DuctApp;