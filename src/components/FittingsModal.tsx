'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useState, useRef } from "react";
import { X, Plus, Trash2, Save, RotateCcw } from "lucide-react";
import { FittingItem, DuctPartType } from "@/lib/types";
import {
  isFittingsModalOpenAtom,
  closeFittingsModalAtom,
  fittingsAtom,
  saveFittingsAtom
} from '@/lib/jotai-store';
import { getDefaultFittings } from '@/lib/default-fittings';

// カテゴリごとの設定項目定義
const PART_TYPES = {
    [DuctPartType.Straight]: { label: '直管', props: ['diameter', 'length'] },
    [DuctPartType.Elbow90]: { label: '90°エルボ', props: ['diameter', 'legLength'] },
    [DuctPartType.AdjustableElbow]: { label: '45°/自由エルボ', props: ['diameter', 'angle', 'legLength'] },
    [DuctPartType.Reducer]: { label: 'レジューサー', props: ['diameter', 'diameter2', 'length'] },
    [DuctPartType.TeeReducer]: { label: 'T管', props: ['diameter', 'diameter2', 'diameter3', 'length', 'branchLength'] },
    [DuctPartType.YBranchReducer]: { label: 'Y管', props: ['diameter', 'diameter2', 'diameter3', 'length', 'branchLength', 'angle'] },
    [DuctPartType.Damper]: { label: 'ダンパー', props: ['diameter', 'length'] },
    [DuctPartType.Cap]: { label: 'キャップ', props: ['diameter'] },
};

const FittingsModal = () => {
  const isOpen = useAtomValue(isFittingsModalOpenAtom);
  const close = useSetAtom(closeFittingsModalAtom);
  const currentFittings = useAtomValue(fittingsAtom);
  const saveFittings = useSetAtom(saveFittingsAtom);

  // ローカル編集用ステート
  const [localFittings, setLocalFittings] = useState(currentFittings);
  const [activeTab, setActiveTab] = useState<string>(Object.keys(currentFittings)[0] || '90°エルボ');

  useEffect(() => {
    if (isOpen) {
      setLocalFittings(JSON.parse(JSON.stringify(currentFittings)));
    }
  }, [isOpen, currentFittings]);

  if (!isOpen) return null;

  const handleInputChange = (category: string, index: number, field: string, value: any) => {
    setLocalFittings(prev => {
        const next = { ...prev };
        const items = [...next[category]];
        items[index] = { ...items[index], [field]: value };
        
        // 名前を自動更新 (任意)
        if (field.startsWith('diameter')) {
            const d1 = items[index].diameter;
            const d2 = (items[index] as any).diameter2;
            const d3 = (items[index] as any).diameter3;
            let name = `D${d1}`;
            if (d2) name += `-${d2}`;
            if (d3) name += `-${d3}`;
            items[index].name = name;
        }
        
        next[category] = items;
        return next;
    });
  };

  const handleDelete = (category: string, index: number) => {
    if(!confirm('この部材設定を削除しますか？')) return;
    setLocalFittings(prev => {
        const next = { ...prev };
        next[category] = prev[category].filter((_, i) => i !== index);
        return next;
    });
  };

  const handleAdd = (category: string) => {
    setLocalFittings(prev => {
        const next = { ...prev };
        const items = next[category];
        if (items.length > 0) {
            // 最後のアイテムをコピー
            const newItem = { ...items[items.length - 1], id: `custom-${Date.now()}` };
            next[category] = [...items, newItem];
        } else {
            // 新規作成 (デフォルト値)
            // ※簡易実装: 既存リストが空の場合の処理は今回は割愛
        }
        return next;
    });
  };

  const handleSave = () => {
      saveFittings(localFittings);
      close();
  };

  const handleReset = () => {
      if(!confirm('初期設定に戻しますか？すべてのカスタム設定が失われます。')) return;
      setLocalFittings(getDefaultFittings());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            部材パラメータ設定
          </h2>
          <button onClick={close} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar (Tabs) */}
            <div className="w-48 bg-gray-50 border-r overflow-y-auto">
                {Object.keys(localFittings).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${
                            activeTab === cat 
                            ? 'bg-white border-indigo-500 text-indigo-700' 
                            : 'border-transparent text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">{activeTab}</h3>
                    <button 
                        onClick={() => handleAdd(activeTab)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 text-sm font-bold"
                    >
                        <Plus size={16} /> 追加
                    </button>
                </div>

                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-3 py-2">表示名</th>
                            <th className="px-3 py-2">口径 (mm)</th>
                            <th className="px-3 py-2">長さ/他 (mm)</th>
                            <th className="px-3 py-2 w-10">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {localFittings[activeTab]?.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="p-2">
                                    <input 
                                        type="text" 
                                        value={item.name}
                                        onChange={(e) => handleInputChange(activeTab, idx, 'name', e.target.value)}
                                        className="w-full border-gray-300 rounded text-sm p-1 border"
                                    />
                                </td>
                                <td className="p-2">
                                    <div className="flex gap-1 items-center">
                                        <input 
                                            type="number" 
                                            value={item.diameter}
                                            onChange={(e) => handleInputChange(activeTab, idx, 'diameter', Number(e.target.value))}
                                            className="w-16 border rounded p-1"
                                            title="主口径"
                                        />
                                        {(item as any).diameter2 !== undefined && (
                                            <>
                                                <span className="text-gray-400">-</span>
                                                <input 
                                                    type="number" 
                                                    value={(item as any).diameter2}
                                                    onChange={(e) => handleInputChange(activeTab, idx, 'diameter2', Number(e.target.value))}
                                                    className="w-16 border rounded p-1"
                                                    title="第2口径"
                                                />
                                            </>
                                        )}
                                        {(item as any).diameter3 !== undefined && (
                                            <>
                                                <span className="text-gray-400">-</span>
                                                <input 
                                                    type="number" 
                                                    value={(item as any).diameter3}
                                                    onChange={(e) => handleInputChange(activeTab, idx, 'diameter3', Number(e.target.value))}
                                                    className="w-16 border rounded p-1"
                                                    title="第3口径"
                                                />
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="p-2">
                                    <div className="flex gap-2 text-xs text-gray-500 items-center">
                                        {(item as any).length !== undefined && (
                                            <div className="flex flex-col">
                                                <span>L</span>
                                                <input type="number" value={(item as any).length} onChange={(e) => handleInputChange(activeTab, idx, 'length', Number(e.target.value))} className="w-14 border rounded p-1 text-black" />
                                            </div>
                                        )}
                                        {(item as any).legLength !== undefined && (
                                            <div className="flex flex-col">
                                                <span>足長</span>
                                                <input type="number" value={(item as any).legLength} onChange={(e) => handleInputChange(activeTab, idx, 'legLength', Number(e.target.value))} className="w-14 border rounded p-1 text-black" />
                                            </div>
                                        )}
                                        {(item as any).branchLength !== undefined && (
                                            <div className="flex flex-col">
                                                <span>枝長</span>
                                                <input type="number" value={(item as any).branchLength} onChange={(e) => handleInputChange(activeTab, idx, 'branchLength', Number(e.target.value))} className="w-14 border rounded p-1 text-black" />
                                            </div>
                                        )}
                                        {(item as any).angle !== undefined && (
                                            <div className="flex flex-col">
                                                <span>角度</span>
                                                <input type="number" value={(item as any).angle} onChange={(e) => handleInputChange(activeTab, idx, 'angle', Number(e.target.value))} className="w-14 border rounded p-1 text-black" />
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="p-2 text-center">
                                    <button 
                                        onClick={() => handleDelete(activeTab, idx)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between rounded-b-lg">
          <button 
            onClick={handleReset}
            className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded text-sm"
          >
            <RotateCcw size={16} /> 初期値に戻す
          </button>
          
          <div className="flex gap-3">
            <button onClick={close} className="px-5 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium">
                キャンセル
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow-md font-bold">
                <Save size={18} /> 保存して閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FittingsModal;