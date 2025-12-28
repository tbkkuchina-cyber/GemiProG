import { AnyDuctPart, Point, Camera, DuctPartType, Dimension } from './types';
import { createDuctPart, getSnapPoints } from './duct-calculations';

// ==========================================
// 描画関数 (Drawing Functions)
// ==========================================

// グリッドの描画
export const drawGrid = (ctx: CanvasRenderingContext2D, camera: Camera, canvasWidth: number, canvasHeight: number) => {
  const gridSize = 50; // グリッド間隔
  const scaledGrid = gridSize * camera.zoom;
  
  const startX = Math.floor(-camera.x / scaledGrid) * scaledGrid + camera.x;
  const startY = Math.floor(-camera.y / scaledGrid) * scaledGrid + camera.y;

  ctx.beginPath();
  ctx.strokeStyle = '#e5e7eb'; // 薄いグレー
  ctx.lineWidth = 1;

  // 縦線
  for (let x = startX; x < canvasWidth; x += scaledGrid) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
  }

  // 横線
  for (let y = startY; y < canvasHeight; y += scaledGrid) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
  }

  ctx.stroke();
};

// オブジェクトの描画
export const drawObjects = (
  ctx: CanvasRenderingContext2D, 
  objects: AnyDuctPart[], 
  camera: Camera, 
  selectedId: string | null
) => {
  // ワールド座標 -> スクリーン座標変換ヘルパー
  const w2s = (x: number, y: number) => ({
    x: x * camera.zoom + camera.x,
    y: y * camera.zoom + camera.y
  });

  objects.forEach(obj => {
    ctx.save();
    const isSelected = obj.id === selectedId;
    ctx.strokeStyle = isSelected ? '#2563eb' : '#374151'; // 選択時は青、通常は濃いグレー
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (obj.type === DuctPartType.Straight && obj.points && obj.points.length >= 2) {
      // 直管の描画
      const p1 = w2s(obj.points[0].x, obj.points[0].y);
      const p2 = w2s(obj.points[1].x, obj.points[1].y);
      
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // 中心線やラベルなどの装飾（簡易）
      if (camera.zoom > 0.5) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px sans-serif';
        const cx = (p1.x + p2.x) / 2;
        const cy = (p1.y + p2.y) / 2;
        ctx.fillText(`L:${obj.length}`, cx + 5, cy - 5);
      }

    } else if (obj.points && obj.points.length > 0) {
      // その他の役物（エルボなど）の簡易描画
      const p = w2s(obj.points[0].x, obj.points[0].y);
      ctx.beginPath();
      
      if (obj.type === DuctPartType.Elbow90) {
        ctx.arc(p.x, p.y, (obj.diameter || 200) * camera.zoom / 2, 0, Math.PI * 2);
      } else {
        ctx.rect(p.x - 5, p.y - 5, 10, 10);
      }
      ctx.stroke();
    }

    ctx.restore();
  });
};

// スナップポイントの描画（デバッグ用・操作中用）
export const drawAllSnapPoints = (
  ctx: CanvasRenderingContext2D,
  objects: AnyDuctPart[],
  camera: Camera
) => {
  const w2s = (x: number, y: number) => ({
    x: x * camera.zoom + camera.x,
    y: y * camera.zoom + camera.y
  });

  ctx.save();
  ctx.fillStyle = 'rgba(239, 68, 68, 0.5)'; // 赤色・半透明
  
  objects.forEach(obj => {
    const snaps = getSnapPoints(obj);
    snaps.forEach(p => {
      const sp = w2s(p.x, p.y);
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  ctx.restore();
};

// 計測ツールの描画
export const drawMeasureTool = (
  ctx: CanvasRenderingContext2D,
  p1: Point | null,
  p2: Point | null,
  camera: Camera
) => {
  if (!p1 || !p2) return;
  
  const w2s = (x: number, y: number) => ({
    x: x * camera.zoom + camera.x,
    y: y * camera.zoom + camera.y
  });

  const s1 = w2s(p1.x, p1.y);
  const s2 = w2s(p2.x, p2.y);

  ctx.save();
  ctx.strokeStyle = '#8b5cf6'; // 紫色
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1.5;
  
  ctx.beginPath();
  ctx.moveTo(s1.x, s1.y);
  ctx.lineTo(s2.x, s2.y);
  ctx.stroke();
  
  // 距離表示
  const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  const cx = (s1.x + s2.x) / 2;
  const cy = (s1.y + s2.y) / 2;
  
  ctx.fillStyle = '#8b5cf6';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`${Math.round(dist)}mm`, cx + 10, cy);
  
  ctx.restore();
};

// 寸法線の描画
export const drawDimensions = (
  ctx: CanvasRenderingContext2D,
  dimensions: Dimension[],
  objects: AnyDuctPart[],
  camera: Camera
) => {
  // 必要であればここに寸法線描画ロジックを実装
  // 今回はビルドを通すために空の関数として定義（または簡易実装）
};


// ==========================================
// 計算・ユーティリティ関数 (Math/Utility Functions)
// ==========================================

// 寸法線に関連するポイントを取得
export function getPointForDim(
  objId: string, 
  pointType: 'connector' | 'intersection', 
  pointId: string, // stringに変更
  objects: AnyDuctPart[]
): Point | null {
  const obj = objects.find(o => o.id === objId);
  if (!obj) return null;

  const model = createDuctPart(obj);
  if (!model) return null;

  if (pointType === 'connector' && model.points) {
    const idx = typeof pointId === 'number' ? pointId : parseInt(pointId, 10);
    if (model.points[idx]) {
      return model.points[idx];
    }
  }
  return { x: obj.x || 0, y: obj.y || 0 };
}

// 2点の中点
export const getMidPoint = (p1: Point, p2: Point): Point => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
};

// ベクトルの正規化
export const normalize = (p: Point): Point => {
  const len = Math.sqrt(p.x * p.x + p.y * p.y);
  return len === 0 ? { x: 0, y: 0 } : { x: p.x / len, y: p.y / len };
};

// 法線ベクトルを取得
export const getNormal = (p1: Point, p2: Point): Point => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return normalize({ x: -dy, y: dx });
};