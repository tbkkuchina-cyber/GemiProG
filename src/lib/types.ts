// ダクトの種別定義
export enum DuctPartType {
  Straight = 'STRAIGHT',
  Elbow90 = 'ELBOW_90',
  Elbow45 = 'ELBOW_45', // 将来用
  Reducer = 'REDUCER',  // 追加
  Tee = 'TEE',          // 追加
  Cap = 'CAP',          // 将来用
  Damper = 'DAMPER',    // 将来用
}

export interface AnyDuctPart {
  id: string;
  type: DuctPartType;
  system: string;
  diameter: number;
  points: { x: number; y: number }[];
  length?: number;   // 直管用
  rotation?: number; // 役物用
  // 以下、役物固有プロパティ
  diameter2?: number; // レジューサの出口径
}

export interface FlangeSpec {
  diameter: number;
  holeCount: number;
  boltSize: string;
}

export interface TakeoffResult {
  straightStock: Record<number, number>;
  flangeCounts: Record<number, number>;
  totalBolts: number;
  totalGasketLen: number;
}