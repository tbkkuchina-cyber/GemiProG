'use client';

import React, { useRef } from 'react';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import { 
  ZoomIn, ZoomOut, RefreshCw, Trash2, Ruler, RotateCcw, RotateCw, 
  Printer, Download, PanelLeft, Save, FolderOpen, ImagePlus, ScanLine,
  PenTool, MousePointer2 
} from 'lucide-react';
import { 
  cameraAtom, setCameraAtom, isClearCanvasModalOpenAtom, modeAtom, 
  undoAtom, redoAtom, canUndoAtom, canRedoAtom, 
  isPaletteOpenAtom, objectsAtom, saveStateAtom,
  backgroundImageAtom, backgroundConfigAtom, calibrationModeAtom, calibrationPointsAtom,
  activeToolAtom, openConfirmModalAtom, clearCanvasAtom,
  openFittingsModalAtom, takeoffResultAtom
} from '@/lib/jotai-store';
import { saveProjectToJson, loadProjectFromJson, exportToCSV } from '@/lib/file-utils';

const Toolbar = () => {
  const [activeTool, setActiveTool] = useAtom(activeToolAtom);
  const [mode, setMode] = useAtom(modeAtom);
  
  const camera = useAtomValue(cameraAtom);
  const setCamera = useSetAtom(setCameraAtom);
  
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);
  const canUndo = useAtomValue(canUndoAtom);
  const canRedo = useAtomValue(canRedoAtom);
  
  const [isPaletteOpen, setIsPaletteOpen] = useAtom(isPaletteOpenAtom);
  
  const objects = useAtomValue(objectsAtom);
  const setObjects = useSetAtom(objectsAtom);
  const saveState = useSetAtom(saveStateAtom);

  const setBgImage = useSetAtom(backgroundImageAtom);
  const setBgConfig = useSetAtom(backgroundConfigAtom);
  
  const [isCalibrating, setIsCalibrating] = useAtom(calibrationModeAtom);
  
  const openConfirm = useSetAtom(openConfirmModalAtom);
  const clearCanvas = useSetAtom(clearCanvasAtom);
  const openFittings = useSetAtom(openFittingsModalAtom);
  const takeoffResult = useAtomValue(takeoffResultAtom);

  // ファイル操作Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleZoomIn = () => setCamera({ zoom: camera.zoom * 1.2 });
  const handleZoomOut = () => setCamera({ zoom: camera.zoom / 1.2 });
  const handleResetZoom = () => setCamera({ x: 0, y: 0, zoom: 1 });

  const handleClear = () => {
    openConfirm({
        title: '全消去',
        message: 'キャンバスの内容をすべて消去しますか？この操作は取り消せません。',
        onConfirm: clearCanvas
    });
  };

  const handleSave = () => saveProjectToJson(objects);
  
  const handleLoadClick = () => fileInputRef.current?.click();
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      try {
        const loadedObjects = await loadProjectFromJson(e.target.files[0]);
        setObjects(loadedObjects);
        saveState();
      } catch (err) {
        alert('ファイルの読み込みに失敗しました');
      }
    }
    e.target.value = '';
  };

  const handleImageLoadClick = () => bgInputRef.current?.click();
  const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        setBgImage(img);
        // 画像の中心をキャンバス中央へ
        setBgConfig(prev => ({ ...prev, x: -img.width/2, y: -img.height/2 }));
      };
    }
    e.target.value = '';
  };

  const startCalibration = () => {
    if (!useAtomValue(backgroundImageAtom)) {
      alert('先に背景図面を読み込んでください');
      return;
    }
    setIsCalibrating(true);
    alert('図面上の既知の距離（例：スケールバー）の両端を2回クリックしてください');
  };

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 justify-between shadow-sm z-20">
      
      {/* Left: Tools */}
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => setIsPaletteOpen(!isPaletteOpen)} 
          className={`p-2 rounded-md hover:bg-gray-100 ${isPaletteOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600'}`}
          title="パレット切替"
        >
          <PanelLeft size={20} />
        </button>
        
        <div className="h-6 w-px bg-gray-300 mx-2"></div>

        {/* 選択ツール */}
        <button 
          onClick={() => { setActiveTool('select'); setMode('select'); }}
          className={`p-2 rounded-md hover:bg-gray-100 ${activeTool === 'select' ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500' : 'text-gray-600'}`}
          title="選択モード (V)"
        >
          <MousePointer2 size={20} />
        </button>

        {/* 直管ツール */}
        <button 
          onClick={() => { setActiveTool('straight'); setMode('select'); }}
          className={`p-2 rounded-md hover:bg-gray-100 ${activeTool === 'straight' ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500' : 'text-gray-600'}`}
          title="直管描画 (P)"
        >
          <PenTool size={20} />
        </button>

        {/* ★追加: 寸法ツール */}
        <button 
          onClick={() => { setActiveTool('dimension'); setMode('select'); }}
          className={`p-2 rounded-md hover:bg-gray-100 ${activeTool === 'dimension' ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500' : 'text-gray-600'}`}
          title="寸法線追加 (M)"
        >
          <Ruler size={20} />
        </button>

        <div className="h-6 w-px bg-gray-300 mx-2"></div>

        {/* 図面操作 */}
        <button onClick={handleImageLoadClick} className="p-2 rounded-md hover:bg-gray-100 text-gray-600" title="背景図面読込">
          <ImagePlus size={20} />
        </button>
        <button 
          onClick={startCalibration} 
          className={`p-2 rounded-md hover:bg-gray-100 ${isCalibrating ? 'bg-yellow-100 text-yellow-700 animate-pulse' : 'text-gray-600'}`}
          title="縮尺設定"
        >
          <ScanLine size={20} />
        </button>
        <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgChange} />

      </div>

      {/* Center: Edit Actions */}
      <div className="flex items-center space-x-2">
        <button onClick={undo} disabled={!canUndo} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-30 text-gray-600">
          <RotateCcw size={18} />
        </button>
        <button onClick={redo} disabled={!canRedo} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-30 text-gray-600">
          <RotateCw size={18} />
        </button>
        <button onClick={handleClear} className="p-2 rounded-md hover:bg-red-50 text-red-500" title="全消去">
          <Trash2 size={18} />
        </button>
      </div>

      {/* Right: Zoom & File */}
      <div className="flex items-center space-x-2">
        <button onClick={handleZoomOut} className="p-2 rounded-md hover:bg-gray-100 text-gray-600"><ZoomOut size={18} /></button>
        <span className="text-xs text-gray-500 w-12 text-center">{Math.round(camera.zoom * 100)}%</span>
        <button onClick={handleZoomIn} className="p-2 rounded-md hover:bg-gray-100 text-gray-600"><ZoomIn size={18} /></button>
        <button onClick={handleResetZoom} className="p-2 rounded-md hover:bg-gray-100 text-gray-600"><RefreshCw size={18} /></button>
        
        <div className="h-6 w-px bg-gray-300 mx-2"></div>

        <button onClick={() => openFittings()} className="p-2 rounded-md hover:bg-gray-100 text-gray-600" title="部材設定">
          <span className="font-bold text-xs border border-gray-400 rounded px-1">SET</span>
        </button>

        <button onClick={() => exportToCSV(takeoffResult)} className="p-2 rounded-md hover:bg-green-50 text-green-600" title="CSV出力">
          <FileSpreadsheetIcon />
        </button>

        <button onClick={handleSave} className="p-2 rounded-md hover:bg-gray-100 text-blue-600" title="保存">
          <Save size={18} />
        </button>
        <button onClick={handleLoadClick} className="p-2 rounded-md hover:bg-gray-100 text-blue-600" title="開く">
          <FolderOpen size={18} />
        </button>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
      </div>
    </div>
  );
};

// 簡易アイコンコンポーネント
const FileSpreadsheetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/>
  </svg>
);

export default Toolbar;