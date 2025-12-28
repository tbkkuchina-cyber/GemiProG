// ダクトの種別定義
export enum DuctPartType {
  Straight = 'STRAIGHT',
  Elbow90 = 'ELBOW_90',
  Elbow45 = 'ELBOW_45',
  AdjustableElbow = 'ADJUSTABLE_ELBOW',
  Reducer = 'REDUCER',
  Tee = 'TEE',
  TeeReducer = 'TEE_REDUCER',
  YBranch = 'Y_BRANCH',
  YBranchReducer = 'Y_BRANCH_REDUCER',
  Cap = 'CAP',
  Damper = 'DAMPER',
}

// 基本的な型
export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

// --- ダクト部品の型定義 ---

// 共通インターフェース
export interface IDuctPart {
  id: string;          // stringに変更済み
  groupId: string;     // stringに変更済み
  type: DuctPartType;
  x: number;           // 配置座標 X (ワールド座標)
  y: number;           // 配置座標 Y (ワールド座標)
  rotation: number;    // 回転角度 (度)
  diameter: number;    // 直径 (mm)
  name: string;        // 表示名
  systemName: string;  // 系統名 (例: SA, EA)
  isSelected: boolean; // 選択状態
  isFlipped: boolean;  // 反転状態
  points?: Point[];    // ★追加: 描画・スナップ用の座標点キャッシュ
}

// 直管
export interface StraightDuct extends IDuctPart {
  type: DuctPartType.Straight;
  length: number;
}

// エルボ (90度)
export interface Elbow90 extends IDuctPart {
  type: DuctPartType.Elbow90;
  legLength?: number; // 脚長 (ない場合はRから計算)
}

// 自在エルボ
export interface AdjustableElbow extends IDuctPart {
  type: DuctPartType.AdjustableElbow;
  angle: number; // 角度
  legLength?: number;
}

// レジューサ (変径)
export interface Reducer extends IDuctPart {
  type: DuctPartType.Reducer;
  diameter2: number; // 出口径
  length: number;
}

// チーズ (T管)
export interface Tee extends IDuctPart {
  type: DuctPartType.Tee;
  // 必要に応じて分岐情報を追加
}

// 異径チーズ
export interface TeeReducer extends IDuctPart {
  type: DuctPartType.TeeReducer;
  diameter2: number; // 主管出口
  diameter3: number; // 分岐管
  length: number;
  branchLength: number;
  intersectionOffset: number;
}

// Y管
export interface YBranch extends IDuctPart {
  type: DuctPartType.YBranch;
  angle: number;
  length: number;
  branchLength: number;
  intersectionOffset: number;
}

// 異径Y管
export interface YBranchReducer extends IDuctPart {
  type: DuctPartType.YBranchReducer;
  angle: number;
  length: number;
  branchLength: number;
  intersectionOffset: number;
  diameter2: number;
  diameter3: number;
}

// キャップ
export interface Cap extends IDuctPart {
  type: DuctPartType.Cap;
}

// ダンパー
export interface Damper extends IDuctPart {
  type: DuctPartType.Damper;
  length: number;
}

// ユニオン型 (すべての部品をまとめた型)
export type AnyDuctPart = 
  | StraightDuct 
  | Elbow90 
  | AdjustableElbow
  | Reducer 
  | Tee 
  | TeeReducer
  | YBranch
  | YBranchReducer
  | Cap 
  | Damper;


// --- UI・操作用の型定義 ---

export interface FittingItem {
  id: string;
  name: string;
  visible?: boolean; // 再度追加
  type: DuctPartType;
  diameter?: number;
  length?: number;
  // 役物用パラメータ
  angle?: number;
  legLength?: number;
  diameter2?: number;
  diameter3?: number;
  branchLength?: number;
  intersectionOffset?: number;
  // 描画用
  icon?: string;
}

export type Fittings = Record<string, FittingItem[]>; // 追加

// ドラッグ操作の状態
export interface DragState {
  isDragging: boolean;
  targetId: string | null; // stringに変更済み
  initialPositions: Map<string, Point> | null; // stringに変更済み
  offset: Point;
}

// スナップ結果
export interface SnapResult {
  dist: number;
  dx: number;
  dy: number;
  otherObj: AnyDuctPart | null;
}

// 寸法線
export interface Dimension {
  id: string;
  p1_objId: string; // stringに変更済み
  p1_pointId: number | string;
  p1_pointType: 'connector' | 'intersection';
  p2_objId: string; // stringに変更済み
  p2_pointId: number | string;
  p2_pointType: 'connector' | 'intersection';
  value: number;
  isManual?: boolean; // 手動追加かどうか
  isStraightRun?: boolean; // 追加
}

// スナップポイント定義
export interface SnapPoint extends Point {
  objId: string; // stringに変更済み
  pointId: number | string;
  pointType: 'connector' | 'intersection';
}

export interface Connector extends Point {
  id: number | string;
  angle: number;
  diameter: number;
  type?: 'main' | 'branch';
}

export interface IntersectionPoint extends Point {
  id: string | number;
}

export interface ConfirmModalContent {
  title: string;
  message: string;
}


export interface ConfirmModalContent {
  title: string;
  message: string;
}



// --- 積算・拾い出し用の型定義 ---

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