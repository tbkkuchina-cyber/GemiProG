import { RefObject, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { 
  objectsAtom, 
  cameraAtom, 
  modeAtom, 
  selectedObjectIdAtom, // 追加
  allDimensionsAtom
} from '@/lib/jotai-store';
import { 
  drawGrid, 
  drawObjects, 
  drawAllSnapPoints, 
  drawMeasureTool, 
  drawDimensions 
} from '@/lib/canvas-utils';

export const useCanvas = (canvasRef: RefObject<HTMLCanvasElement>) => {
  const objects = useAtomValue(objectsAtom);
  const camera = useAtomValue(cameraAtom);
  const mode = useAtomValue(modeAtom);
  const selectedObjectId = useAtomValue(selectedObjectIdAtom); // 選択中のIDを取得
  const dimensions = useAtomValue(allDimensionsAtom);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスサイズに合わせて描画領域をクリア
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 描画設定の保存
    ctx.save();

    // 背景（グリッド）を描画
    // ★修正: 引数に canvasWidth, canvasHeight を追加
    drawGrid(ctx, camera, canvasWidth, canvasHeight);

    // ダクトオブジェクトの描画
    // ★修正: 第4引数に selectedObjectId を追加
    drawObjects(ctx, objects, camera, selectedObjectId);

    // デバッグ用: スナップポイントの表示（必要に応じてON/OFF）
    // drawAllSnapPoints(ctx, objects, camera);

    // 寸法線の描画
    drawDimensions(ctx, dimensions, objects, camera);

    // 計測ツールの描画 (モードがmeasureの場合など)
    // if (mode === 'measure') {
    //   // 計測ツールの描画ロジックが必要ならここに記述
    //   // drawMeasureTool(...)
    // }

    ctx.restore();

  }, [objects, camera, mode, selectedObjectId, dimensions, canvasRef]); // 依存配列に追加
};