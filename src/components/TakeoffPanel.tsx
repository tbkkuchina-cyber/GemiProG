'use client';

import { useAtomValue } from 'jotai';
import { takeoffResultAtom } from '@/lib/jotai-store';
import { exportToCSV } from '@/lib/file-utils';
import { FileSpreadsheet } from 'lucide-react';

const TakeoffPanel = () => {
  const result = useAtomValue(takeoffResultAtom);

  const hasData = Object.keys(result.straightStock).length > 0 || Object.keys(result.flangeCounts).length > 0;

  if (!hasData) {
    return (
      <div className="p-4 text-center text-gray-400 text-xs bg-gray-50 rounded border border-dashed border-gray-200 mt-2">
        ダクトを配置すると<br/>積算数量がここに表示されます
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-2">
      {/* 1. 直管 */}
      <div className="bg-white p-2 rounded border border-gray-200 text-xs shadow-sm">
        <h4 className="font-bold text-gray-600 mb-1 border-b pb-1">直管ダクト (4m)</h4>
        <ul>
          {Object.entries(result.straightStock).map(([d, count]) => (
            <li key={d} className="flex justify-between py-0.5">
              <span>φ{d}</span>
              <span className="font-mono font-bold">{count} 本</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 2. フランジ */}
      <div className="bg-white p-2 rounded border border-gray-200 text-xs shadow-sm">
        <h4 className="font-bold text-gray-600 mb-1 border-b pb-1">フランジ / 副資材</h4>
        <ul className="mb-2">
          {Object.entries(result.flangeCounts).map(([d, count]) => (
            <li key={d} className="flex justify-between py-0.5">
              <span>F φ{d}</span>
              <span className="font-mono">{count} 枚</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-gray-100 pt-1 text-gray-500">
           <div className="flex justify-between">
              <span>ボルト</span>
              <span className="font-mono">{result.totalBolts} 組</span>
           </div>
           <div className="flex justify-between">
              <span>パッキン</span>
              <span className="font-mono">{result.totalGasketLen.toFixed(1)} m</span>
           </div>
        </div>
      </div>

      {/* CSVボタン */}
      <button 
        onClick={() => exportToCSV(result)}
        className="w-full flex items-center justify-center gap-1 bg-green-600 text-white py-1.5 rounded hover:bg-green-700 transition-colors text-xs font-bold"
      >
        <FileSpreadsheet size={14} />
        CSV出力
      </button>
    </div>
  );
};

export default TakeoffPanel;