import { AnyDuctPart, Point, Camera, DuctPartType, TakeoffResult } from './types';

// 2点間の距離
export const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// 画面座標からワールド座標への変換
export const screenToWorld = (screenPos: Point, canvas: HTMLElement, camera: Camera): Point => {
  return {
    x: (screenPos.x - camera.x) / camera.zoom,
    y: (screenPos.y - camera.y) / camera.zoom,
  };
};

// ダクトモデルの生成
export const createDuctPart = (part: AnyDuctPart): AnyDuctPart => {
  return part;
};

// スナップポイントの取得
export const getSnapPoints = (part: AnyDuctPart): Point[] => {
  if (!part.points || part.points.length === 0) {
    return [{ x: part.x || 0, y: part.y || 0 }];
  }
  // 直管の場合、両端
  if (part.type === DuctPartType.Straight && part.points.length >= 2) {
    return [part.points[0], part.points[1]];
  }
  // その他の形状も基本的にはpointsを返す
  return part.points;
};

// ★★★ 追加: 積算機能 (performTakeoff) ★★★
export const performTakeoff = (objects: AnyDuctPart[]): TakeoffResult => {
  const straightStock: Record<number, number> = {};
  const flangeCounts: Record<number, number> = {};
  let totalBolts = 0;
  let totalGasketLen = 0;

  objects.forEach(part => {
    // 1. 直管の集計
    if (part.type === DuctPartType.Straight && part.length) {
      const d = part.diameter;
      const count = straightStock[d] || 0;
      straightStock[d] = count + 1; 
    }

    // 2. フランジの集計 (接続箇所の数で概算)
    let flanges = 0;
    if (part.type === DuctPartType.Straight) flanges = 2;
    else if (part.type === DuctPartType.Elbow90) flanges = 2;
    else if (part.type === DuctPartType.Reducer) flanges = 2;
    else if (part.type === DuctPartType.Tee) flanges = 3;
    else if (part.type === DuctPartType.Cap) flanges = 1;

    if (flanges > 0) {
      flangeCounts[part.diameter] = (flangeCounts[part.diameter] || 0) + flanges;
      totalBolts += flanges * 8; // 仮: 1枚あたり8組
      totalGasketLen += (part.diameter * Math.PI / 1000) * flanges;
    }
  });

  return {
    straightStock,
    flangeCounts,
    totalBolts,
    totalGasketLen
  };
};