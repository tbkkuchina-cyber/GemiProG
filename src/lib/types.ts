// カメラ（視点）の状態を定義
export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

// ダクト部品の基本的なデータ構造
// （lib/duct-objects.tsのDuctPartクラスと対応）
export interface DuctPartOptions {
  id?: number;
  x?: number;
  y?: number;
  rotation?: number;
  diameter?: number;
  isSelected?: boolean;
  length?: number;
  systemName?: string;
  legLength?: number;
}

// パレットに表示するアイテムのデータ型を定義
export interface PaletteItemData {
  type: 'StraightDuct' | 'Elbow90';
  name: string;
  defaultOptions: DuctPartOptions;
}