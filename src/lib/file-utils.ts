import { AnyDuctPart, TakeoffResult } from './types';

// 現在の日時を文字列で取得 (ファイル名用)
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
};

// --- 1. CSVエクスポート機能 ---
export const exportToCSV = (result: TakeoffResult) => {
  const rows = [];
  
  // ヘッダー
  rows.push(['区分', '品名', '仕様/サイズ', '数量', '単位']);

  // 直管データ
  Object.entries(result.straightStock).forEach(([d, count]) => {
    rows.push(['直管', '直管ダクト (4m定尺)', `φ${d}`, count, '本']);
  });

  // フランジデータ
  Object.entries(result.flangeCounts).forEach(([d, count]) => {
    rows.push(['副資材', '丸フランジ', `φ${d}`, count, '枚']);
  });

  // その他副資材
  rows.push(['副資材', 'ボルト・ナット', '規格品', result.totalBolts, '組']);
  rows.push(['副資材', 'ガスケット', 'パッキン材', result.totalGasketLen.toFixed(1), 'm']);

  // CSV文字列の生成 (BOM付きUTF-8でExcel文字化け防止)
  const csvContent = rows.map(e => e.join(',')).join('\n');
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // ダウンロードリンクの生成とクリック
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `duct_takeoff_${getTimestamp()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- 2. プロジェクト保存 (JSON) ---
export const saveProjectToJson = (objects: AnyDuctPart[]) => {
  const dataStr = JSON.stringify(objects, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `duct_project_${getTimestamp()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

// --- 3. プロジェクト読み込み (JSON) ---
export const loadProjectFromJson = (file: File): Promise<AnyDuctPart[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const objects = JSON.parse(json) as AnyDuctPart[];
        // 簡易的なバリデーション (配列かどうかチェック)
        if (Array.isArray(objects)) {
          resolve(objects);
        } else {
          reject(new Error("Invalid file format"));
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};
