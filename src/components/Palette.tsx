'use client';

import React, { useState } from 'react';
import { PaletteItemData } from '@/types';

const paletteItems: PaletteItemData[] = [
  { type: 'StraightDuct', name: 'D150 直管', defaultOptions: { length: 300, diameter: 150 } },
  { type: 'Elbow90', name: 'D150 90°エルボ', defaultOptions: { legLength: 150, diameter: 150 } },
];

interface PaletteProps {
  onAddStraightPipe: (options: { systemName: string; diameter: number; }) => void;
}

const Palette: React.FC<PaletteProps> = ({ onAddStraightPipe }) => {
  const [systemName, setSystemName] = useState('SA-1');
  const [diameter, setDiameter] = useState(100);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: PaletteItemData) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
  };

  const handleAddClick = () => {
    if (diameter > 0) {
      onAddStraightPipe({ systemName, diameter });
    }
  };

  return (
    // ★ 複雑な order- クラスを削除し、サイズ指定に特化
    <aside className="w-full md:w-64 bg-pink-300 shadow-lg p-4 flex flex-col flex-shrink-0">
      <div className="mb-6 border-b pb-4">
        <div className="space-y-2">
          <div><input type="text" value={systemName} onChange={(e) => setSystemName(e.target.value)} className="w-full p-2 border rounded-md" placeholder="系統名"/></div>
          <div><input type="number" value={diameter} onChange={(e) => setDiameter(parseInt(e.target.value, 10))} step="25" min="25" className="w-full p-2 border rounded-md" placeholder="直径 (mm)"/></div>
          <button onClick={handleAddClick} className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700">直管を追加</button>
        </div>
      </div>
      <div className="mb-6 border-b pb-4">
         <button className="w-full bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300">継手管理</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {paletteItems.map((item, index) => (
          <div key={index} className="p-2 border rounded-md shadow-sm cursor-grab text-center bg-gray-50 hover:bg-indigo-100" draggable={true} onDragStart={(e) => handleDragStart(e, item)}>
            <p className="text-sm font-medium">{item.name}</p>
          </div>
        ))}
      </div>
    </aside>
  );
};
export default Palette;
