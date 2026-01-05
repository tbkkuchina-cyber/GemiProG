import { AnyDuctPart, Point, Camera, DuctPartType, Dimension } from './types';
import { createDuctPart } from './duct-models';
import { getSnapPoints } from './duct-calculations';

// ==========================================
// 描画関数 (Drawing Functions)
// ==========================================

// グリッドの描画
export const drawGrid = (ctx: CanvasRenderingContext2D, camera: Camera, canvasWidth: number, canvasHeight: number) => {
  const gridSize = 50;
  const scaledGrid = gridSize * camera.zoom;
  
  const startX = Math.floor(-camera.x / scaledGrid) * scaledGrid + camera.x;
  const startY = Math.floor(-camera.y / scaledGrid) * scaledGrid + camera.y;

  ctx.beginPath();
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;

  for (let x = startX; x < canvasWidth; x += scaledGrid) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
  }

  for (let y = startY; y < canvasHeight; y += scaledGrid) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
  }

  ctx.stroke();
};

// オブジェクトの描画（Konvaを使用するため、この関数は背景描画やCanvas API直接利用時用ですが、型整合のため残します）
export const drawObjects = (
  ctx: CanvasRenderingContext2D, 
  objects: AnyDuctPart[], 
  camera: Camera, 
  selectedId: string | null
) => {
    // React-Konva移行に伴い、実処理は CanvasArea.tsx 側に移譲されていますが、
    // 将来的な画像エクスポートなどで Canvas API を直接使う場合のために残しておきます。
    // 現時点では何もしなくてOKです。
};

// 全スナップポイントの描画 (デバッグ用)
export const drawAllSnapPoints = (
  ctx: CanvasRenderingContext2D, 
  objects: AnyDuctPart[], 
  camera: Camera
) => {
  objects.forEach(obj => {
    const snaps = getSnapPoints(obj);
    snaps.forEach(p => {
      const screenPos = worldToScreen(p, camera);
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'red';
      ctx.fill();
    });
  });
};

// 計測ツールの描画
export const drawMeasureTool = (
  ctx: CanvasRenderingContext2D,
  p1: Point,
  p2: Point,
  camera: Camera
) => {
  const s1 = worldToScreen(p1, camera);
  const s2 = worldToScreen(p2, camera);

  ctx.beginPath();
  ctx.strokeStyle = '#f59e0b'; // Amber-500
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.moveTo(s1.x, s1.y);
  ctx.lineTo(s2.x, s2.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // 距離テキスト
  const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  const cx = (s1.x + s2.x) / 2;
  const cy = (s1.y + s2.y) / 2;

  ctx.save();
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 14px sans-serif';
  ctx.shadowColor = 'white';
  ctx.shadowBlur = 4;
  ctx.fillText(`${Math.round(dist)}mm`, cx + 10, cy);
  ctx.restore();
};

// ★★★ 実装追加: 寸法線の描画 ★★★
export const drawDimensions = (
  ctx: CanvasRenderingContext2D,
  dimensions: Dimension[],
  objects: AnyDuctPart[],
  camera: Camera
) => {
  dimensions.forEach(dim => {
    // 始点と終点の座標を取得
    const p1 = getPointForDim(dim.p1_objId, dim.p1_pointType, String(dim.p1_pointId), objects);
    const p2 = getPointForDim(dim.p2_objId, dim.p2_pointType, String(dim.p2_pointId), objects);

    if (!p1 || !p2) return;

    const s1 = worldToScreen(p1, camera);
    const s2 = worldToScreen(p2, camera);

    // 描画設定
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6'; // Blue-500
    ctx.lineWidth = 1.5;
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.stroke();

    // 端点の矢印（簡易）
    const drawArrow = (x: number, y: number) => {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
    };
    drawArrow(s1.x, s1.y);
    drawArrow(s2.x, s2.y);

    // 数値テキスト
    const cx = (s1.x + s2.x) / 2;
    const cy = (s1.y + s2.y) / 2;
    
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.font = '12px sans-serif';
    
    const text = `${Math.round(dim.value)}mm`;
    const metrics = ctx.measureText(text);
    const padding = 4;
    
    // 背景矩形
    ctx.fillRect(
        cx - metrics.width / 2 - padding, 
        cy - 8 - padding, 
        metrics.width + padding * 2, 
        16 + padding * 2
    );
    ctx.strokeRect(
        cx - metrics.width / 2 - padding, 
        cy - 8 - padding, 
        metrics.width + padding * 2, 
        16 + padding * 2
    );

    ctx.fillStyle = '#1e3a8a'; // Blue-900
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
    ctx.restore();
  });
};

// ==========================================
// 計算・ユーティリティ関数
// ==========================================

// ワールド座標 -> 画面座標
const worldToScreen = (point: Point, camera: Camera): Point => {
  return {
    x: point.x * camera.zoom + camera.x,
    y: point.y * camera.zoom + camera.y
  };
};

// 寸法線に関連するポイントを取得
export function getPointForDim(
  objId: string, 
  pointType: 'connector' | 'intersection', 
  pointId: string, 
  objects: AnyDuctPart[]
): Point | null {
  const obj = objects.find(o => o.id === objId);
  if (!obj) return null;

  const model = createDuctPart(obj);
  if (!model) return null;

  if (pointType === 'connector') {
    // 直管の両端や継手の接続点
    const connectors = model.getConnectors();
    const idx = typeof pointId === 'number' ? pointId : parseInt(pointId, 10);
    const conn = connectors.find(c => c.id === idx);
    if (conn) return { x: conn.x, y: conn.y };
    
    // 直管のpointsプロパティをフォールバックとして使用
    if (obj.type === DuctPartType.Straight && obj.points && obj.points[idx]) {
        return obj.points[idx];
    }
  } else {
    // 交点（中心点など）
    const intersections = model.getIntersectionPoints();
    const inter = intersections.find(i => String(i.id) === pointId);
    if (inter) return { x: inter.x, y: inter.y };
  }
  
  // 取得できない場合はオブジェクトの中心を返す
  return { x: obj.x || 0, y: obj.y || 0 };
}

// 2点の中点
export const getMidPoint = (p1: Point, p2: Point): Point => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
};