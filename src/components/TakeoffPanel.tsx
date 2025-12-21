'use client';

import { useAtomValue } from 'jotai';
import { takeoffResultAtom } from '@/lib/jotai-store';
import { exportToCSV } from '@/lib/file-utils'; // 追加
import { Calculator, Hammer, ScrollText, FileSpreadsheet } from 'lucide-react';

const TakeoffPanel = () => {
  const result = useAtomValue(takeoffResultAtom);

  const hasData = Object.keys(result.straightStock).length > 0 || Object.keys(result.flangeCounts).length > 0;

  if (!hasData) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        ダクトを配置すると<br/>積算結果がここに表示されます
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* --- CSVエクスポートボタン (追加) --- */}
      <button 
        onClick={() => exportToCSV(result)}
        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm font-bold shadow-sm"
      >
        <FileSpreadsheet size={18} />
        CSV形式で書き出し
      </button>

      {/* 直管定尺計算 */}
      <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
        <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center">
          <ScrollText size={16} className="mr-2" />
          直管 (4m定尺換算)
        </h4>
        <ul className="text-sm space-y-1">
          {Object.entries(result.straightStock).map(([d, count]) => (
            <li key={d} className="flex justify-between border-b border-blue-100 pb-1 last:border-0">
              <span>φ{d}</span>
              <span className="font-bold">{count} 本</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 副資材集計 */}
      <div className="bg-amber-50 p-3 rounded-md border border-amber-100">
        <h4 className="font-bold text-amber-800 text-sm mb-2 flex items-center">
          <Hammer size={16} className="mr-2" />
          副資材 (概算)
        </h4>
        
        <div className="mb-3">
          <p className="text-xs text-amber-700 font-semibold mb-1">フランジ (合計)</p>
          <ul className="text-sm space-y-1 pl-2">
            {Object.entries(result.flangeCounts).map(([d, count]) => (
              <li key={d} className="flex justify-between">
                <span>φ{d}</span>
                <span>{count} 枚</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-between text-sm border-t border-amber-200 pt-2">
          <span>ボルト総数:</span>
          <span className="font-bold">{result.totalBolts} 個</span>
        </div>
        <div className="flex justify-between text-sm pt-1">
          <span>パッキン:</span>
          <span className="font-bold">{result.totalGasketLen.toFixed(1)} m</span>
        </div>
      </div>

    </div>
  );
};

export default TakeoffPanel;