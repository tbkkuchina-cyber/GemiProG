'use client';

import { useRef } from 'react';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import { 
  ZoomIn, ZoomOut, RefreshCw, Trash2, Ruler, RotateCcw, RotateCw, 
  Printer, Download, PanelLeft, Save, FolderOpen, ImagePlus, ScanLine,
  // アイコン追加
  PenTool, MousePointer2 
} from 'lucide-react';
import { 
  cameraAtom, setCameraAtom, isClearCanvasModalOpenAtom, modeAtom, 
  undoAtom, redoAtom, canUndoAtom, canRedoAtom, triggerScreenshotAtom, 
  isPaletteOpenAtom, objectsAtom, saveStateAtom,
  backgroundImageAtom, calibrationModeAtom, calibrationPointsAtom,
  // 追加
  activeToolAtom
} from '@/lib/jotai-store';
import { saveProjectToJson, loadProjectFromJson } from '@/lib/file-utils';

const Toolbar = () => {
  // ... (既存のフックはそのまま)
  const [mode, setMode] = useAtom(modeAtom);
  const camera = useAtomValue(cameraAtom);
  const setCamera = useSetAtom(setCameraAtom);
  const setIsClearModalOpen = useSetAtom(isClearCanvasModalOpenAtom);
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);
  const canUndo = useAtomValue(canUndoAtom);
  const canRedo = useAtomValue(canRedoAtom);
  const triggerScreenshot = useSetAtom(triggerScreenshotAtom);
  const [isPaletteOpen, setIsPaletteOpen] = useAtom(isPaletteOpenAtom);
  const objects = useAtomValue(objectsAtom);
  const setObjects = useSetAtom(objectsAtom);
  const saveState = useSetAtom(saveStateAtom);
  const setBackgroundImage = useSetAtom(backgroundImageAtom);
  const [isCalibrating, setIsCalibrating] = useAtom(calibrationModeAtom);
  const setCalibPoints = useSetAtom(calibrationPointsAtom);
  
  // ★★★ 追加: ツール切り替え ★★★
  const [activeTool, setActiveTool] = useAtom(activeToolAtom);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ... (既存のハンドラ関数群はそのまま)
  const handleZoomIn = () => setCamera({ ...camera, zoom: camera.zoom * 1.2 });
  const handleZoomOut = () => setCamera({ ...camera, zoom: camera.zoom / 1.2 });
  const handleResetView = () => setCamera({ x: 0, y: 0, zoom: 1 });
  const handleClearCanvas = () => setIsClearModalOpen(true);
  const handleToggleMeasureMode = () => setMode(mode === 'measure' ? 'pan' : 'measure');
  const handlePrint = () => window.print();
  const handleSaveProject = () => saveProjectToJson(objects);
  const handleLoadClick = () => fileInputRef.current?.click();
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => { /* 省略 */ };
  const handleImageLoadClick = () => imageInputRef.current?.click();
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* 省略 */ };
  const startCalibration = () => { setIsCalibrating(true); setCalibPoints([]); alert('縮尺設定モード: 2点クリック'); };

  // ツール切り替えハンドラ
  const setTool = (tool: string) => {
    setActiveTool(tool);
    // 作図中はパンモードを解除しないと操作しづらい
    if (tool === 'straight') setMode('pan'); 
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-md p-2 flex items-center justify-between z-10">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
      <input type="file" ref={imageInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />

      <div className="flex items-center flex-wrap gap-x-1 md:gap-x-2 gap-y-1">
        
        <button onClick={() => setIsPaletteOpen(!isPaletteOpen)} className={`p-2 rounded-md hover:bg-gray-200 ${!isPaletteOpen ? 'bg-gray-200' : ''}`}>
          <PanelLeft size={20} />
        </button>
        <div className="h-6 w-px bg-gray-300"></div>

        <button onClick={handleSaveProject} className="p-2 rounded-md hover:bg-gray-200 text-blue-600"><Save size={20} /></button>
        <button onClick={handleLoadClick} className="p-2 rounded-md hover:bg-gray-200 text-blue-600"><FolderOpen size={20} /></button>
        
        <div className="h-6 w-px bg-gray-300"></div>

        {/* ツール選択グループ */}
        <button 
          onClick={() => setTool('select')} 
          title="選択モード"
          className={`p-2 rounded-md hover:bg-gray-200 ${activeTool === 'select' ? 'bg-indigo-600 text-white shadow-inner' : 'text-gray-600'}`}
        >
          <MousePointer2 size={20} />
        </button>

        <button 
          onClick={() => setTool('straight')} 
          title="直管作図モード"
          className={`p-2 rounded-md hover:bg-gray-200 ${activeTool === 'straight' ? 'bg-indigo-600 text-white shadow-inner' : 'text-gray-600'}`}
        >
          <PenTool size={20} />
        </button>

        <div className="h-6 w-px bg-gray-300"></div>

        <button onClick={handleImageLoadClick} className="p-2 rounded-md hover:bg-gray-200 text-purple-600"><ImagePlus size={20} /></button>
        <button onClick={startCalibration} className={`p-2 rounded-md hover:bg-gray-200 ${isCalibrating ? 'bg-yellow-300 animate-pulse' : 'text-orange-600'}`}><ScanLine size={20} /></button>

        <div className="h-6 w-px bg-gray-300"></div>
        {/* Undo/Redo/Zoom/Clear/Print/Download は既存のまま */}
        <button onClick={undo} disabled={!canUndo} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"><RotateCcw size={20} /></button>
        <button onClick={redo} disabled={!canRedo} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"><RotateCw size={20} /></button>
        <div className="h-6 w-px bg-gray-300"></div>
        <button onClick={handleZoomIn} className="p-2 rounded-md hover:bg-gray-200"><ZoomIn size={20} /></button>
        <button onClick={handleZoomOut} className="p-2 rounded-md hover:bg-gray-200"><ZoomOut size={20} /></button>
        <button onClick={handleResetView} className="p-2 rounded-md hover:bg-gray-200"><RefreshCw size={20} /></button>
        <div className="h-6 w-px bg-gray-300"></div>
        <button onClick={handleClearCanvas} className="p-2 rounded-md hover:bg-gray-200 text-red-500"><Trash2 size={20} /></button>
      </div>
    </header>
  );
};

export default Toolbar;