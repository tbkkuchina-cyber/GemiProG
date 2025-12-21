import { AnyDuctPart, DuctPartType, TakeoffResult, FlangeSpec } from './types';
import { createDuctPart } from './duct-models';

// 直管の定尺(4m)取り合わせ計算 (First-Fit法)
const calculateStock = (objects: AnyDuctPart[], standardLength = 4000) => {
  const stockMap: Record<number, number> = {}; 

  // 直管のみ抽出し、直径ごとにグループ化
  const grouped = objects
    .filter(obj => obj.type === DuctPartType.Straight)
    .reduce((acc, obj) => {
      // createDuctPartを経由して正確な長さを取得（またはobj.lengthを直接使用）
      const model = createDuctPart(obj);
      // StraightDuct型であることを確認して長さを取得
      const len = (model as any)?.length || 0;
      
      if (len > 0) {
        const d = obj.diameter;
        if (!acc[d]) acc[d] = [];
        acc[d].push(len);
      }
      return acc;
    }, {} as Record<number, number[]>);

  // 計算処理
  Object.keys(grouped).forEach(dKey => {
    const diameter = parseInt(dKey);
    // 長い部材から順に割り当て
    const lengths = grouped[diameter].sort((a, b) => b - a);
    const bins: number[] = []; // 各定尺材の「残り長さ」

    lengths.forEach(len => {
      let placed = false;
      for (let i = 0; i < bins.length; i++) {
        if (bins[i] >= len) {
          bins[i] -= len;
          placed = true;
          break;
        }
      }
      if (!placed) {
        if (len > standardLength) {
           const count = Math.ceil(len / standardLength);
           for(let k=0; k<count; k++) bins.push(0); 
        } else {
           bins.push(standardLength - len);
        }
      }
    });
    stockMap[diameter] = bins.length;
  });

  return stockMap;
};

// フランジスペック定義 (簡易マスタ)
const getFlangeSpec = (d: number): FlangeSpec => {
  if (d <= 150) return { diameter: d, holeCount: 6, boltSize: 'M8' };
  if (d <= 300) return { diameter: d, holeCount: 8, boltSize: 'M8' };
  if (d <= 500) return { diameter: d, holeCount: 12, boltSize: 'M10' };
  return { diameter: d, holeCount: 16, boltSize: 'M10' };
};

// 材料拾い出し総計算
export const performTakeoff = (objects: AnyDuctPart[]): TakeoffResult => {
  let totalGasketLen = 0; 
  let totalBolts = 0;
  const flangeCounts: Record<number, number> = {};

  objects.forEach(obj => {
    const d = obj.diameter;
    const spec = getFlangeSpec(d);

    // 接合部1か所につきフランジ2枚
    // 簡易ロジック: 部品1つにつき「両端」で接続が必要と仮定して算出
    // (ダンパーや直管は2箇所、キャップなら1箇所など、本来は詳細分岐が可能)
    const flangesNeeded = 2; 
    
    if (!flangeCounts[d]) flangeCounts[d] = 0;
    flangeCounts[d] += flangesNeeded;

    const joints = flangesNeeded / 2;
    totalBolts += joints * spec.holeCount;
    
    // ガスケット = 円周 * 接合部数
    totalGasketLen += (d * Math.PI) * joints;
  });

  const straightStock = calculateStock(objects);

  return {
    straightStock,
    flangeCounts,
    totalBolts,
    totalGasketLen: Math.ceil(totalGasketLen / 1000), // m単位
  };
};