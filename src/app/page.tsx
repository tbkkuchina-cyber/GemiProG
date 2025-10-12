'use client';

import ContextMenu from '@/components/ContextMenu';
import CanvasArea from '@/components/CanvasArea';
import { DuctPart, StraightDuct, Elbow90 } from '@/lib/objects';
import { Camera, PaletteItemData } from '@/types';
import { useEffect, useState } from 'react';
import Palette from '@/components/Palette';
import Toolbar from '@/components/Toolbar';

// Undo/Redoは一旦無効化し、最もシンプルな構成に戻します
interface ContextMenuState { visible: boolean; x: number; y: number; }

export default function Home() {
  const [objects, setObjects] = useState<DuctPart[]>([]);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 0.8 });
  const [nextId, setNextId] = useState(1);
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0 });

  useEffect(() => {
    setObjects([new StraightDuct(0, 0, 0, { length: 300, diameter: 150 })]);
  }, []);

  const handleSelectObject = (id: number | null, clickPos?: {x: number, y: number}) => {
    setObjects(currentObjects => 
      currentObjects.map(obj => {
        const newObj = obj.clone();
        newObj.isSelected = (obj.id === id);
        return newObj;
      })
    );
    setSelectedObjectId(id);
    if (id !== null && clickPos) {
      setContextMenu({ visible: true, x: clickPos.x + 10, y: clickPos.y + 10 });
    } else {
      setContextMenu({ visible: false, x: 0, y: 0 });
    }
  };

  const handleDeleteObject = () => {
    if (selectedObjectId === null) return;
    setObjects(objs => objs.filter(o => o.id !== selectedObjectId));
    handleSelectObject(null);
  };

  const handleRotateObject = () => {
    if (selectedObjectId === null) return;
    setObjects(currentObjects =>
      currentObjects.map(obj => {
        if (obj.id === selectedObjectId) {
          const newObj = obj.clone();
          newObj.rotate();
          return newObj;
        }
        return obj;
      })
    );
  };
  
  const handleObjectMove = (id: number, x: number, y: number) => {
    setObjects(currentObjects =>
      currentObjects.map(obj => {
        if (obj.id === id) {
          const newObj = obj.clone();
          newObj.x = x;
          newObj.y = y;
          return newObj;
        }
        return obj;
      })
    );
  };

  const handleAddObjectFromPalette = (item: PaletteItemData, x: number, y: number) => {
    const newId = nextId;
    let newObject: DuctPart | null = null;
    switch (item.type) {
      case 'StraightDuct': newObject = new StraightDuct(newId, x, y, item.defaultOptions); break;
      case 'Elbow90': newObject = new Elbow90(newId, x, y, item.defaultOptions); break;
    }
    if (newObject) {
      setObjects(current => [...current, newObject!]);
      setNextId(prev => prev + 1);
    }
  };
  
  const handleAddStraightPipeByClick = (options: { systemName: string; diameter: number; }) => {
    const newId = nextId;
    const newObject = new StraightDuct(newId, camera.x, camera.y, { ...options, length: 400 });
    setObjects(current => [...current, newObject]);
    setNextId(prev => prev + 1);
  };

  const handleZoomIn = () => setCamera(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 10) }));
  const handleZoomOut = () => setCamera(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.1) }));
  const handleResetView = () => setCamera({ x: 0, y: 0, zoom: 0.8 });

  return (
    <div className="w-screen h-screen bg-gray-100 text-gray-800 flex flex-col md:flex-row">
      <main className="flex-grow flex flex-col relative">
        <Toolbar
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
        />
        <CanvasArea
          objects={objects}
          camera={camera}
          setCamera={setCamera}
          onObjectMove={handleObjectMove}
          onAddObject={handleAddObjectFromPalette}
          selectedObjectId={selectedObjectId}
          onSelectObject={handleSelectObject}
        />
        {contextMenu.visible && selectedObjectId !== null && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onDelete={handleDeleteObject}
            onRotate={handleRotateObject}
          />
        )}
      </main>
      <Palette onAddStraightPipe={handleAddStraightPipeByClick} />
    </div>
  );
}