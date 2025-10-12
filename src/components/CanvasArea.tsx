'use client';

import { DuctPart } from '@/lib/duct-objects';
import { Camera, PaletteItemData } from '@/types';
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DuctCanvasProps {
  objects: DuctPart[];
  camera: Camera;
  setCamera: React.Dispatch<React.SetStateAction<Camera>>;
  onObjectMove: (id: number, x: number, y: number) => void;
  onAddObject: (item: PaletteItemData, x: number, y: number) => void;
  selectedObjectId: number | null;
  onSelectObject: (id: number | null, clickPos?: {x: number, y: number}) => void;
}

interface DragInfo { isDragging: boolean; target: DuctPart | null; offsetX: number; offsetY: number; }

const DuctCanvas: React.FC<DuctCanvasProps> = ({ objects, camera, setCamera, onObjectMove, onAddObject, selectedObjectId, onSelectObject }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragInfo, setDragInfo] = useState<DragInfo>({ isDragging: false, target: null, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) { canvas.width = parent.clientWidth; canvas.height = parent.clientHeight; }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const drawGrid = () => {
      const gridSize = 50; ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1 / camera.zoom;
      const xStart = Math.floor((camera.x - (canvas.width / 2) / camera.zoom) / gridSize) * gridSize;
      const xEnd = Math.ceil((camera.x + (canvas.width / 2) / camera.zoom) / gridSize) * gridSize;
      const yStart = Math.floor((camera.y - (canvas.height / 2) / camera.zoom) / gridSize) * gridSize;
      const yEnd = Math.ceil((camera.y + (canvas.height / 2) / camera.zoom) / gridSize) * gridSize;
      ctx.beginPath();
      for (let x = xStart; x <= xEnd; x += gridSize) { ctx.moveTo(x, yStart); ctx.lineTo(x, yEnd); }
      for (let y = yStart; y <= yEnd; y += gridSize) { ctx.moveTo(xStart, y); ctx.lineTo(xEnd, y); } 
      ctx.stroke();
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-camera.x, -camera.y);
      drawGrid();
      if (Array.isArray(objects)) {
        objects.forEach((obj) => obj.draw(ctx, camera));
      }
      ctx.restore();
    };
    draw();
  }, [objects, camera]);

  const getWorldMousePos = (e: React.MouseEvent | React.DragEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldX = (screenX - canvas.width / 2) / camera.zoom + camera.x;
    const worldY = (screenY - canvas.height / 2) / camera.zoom + camera.y;
    return { x: worldX, y: worldY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const worldPos = getWorldMousePos(e);
    const targetObject = Array.isArray(objects) ? [...objects].reverse().find((obj) => obj.isPointInside(worldPos.x, worldPos.y)) : undefined;
    if (targetObject) {
      if (targetObject.id === selectedObjectId) {
        onSelectObject(targetObject.id, { x: e.clientX, y: e.clientY });
      } else {
        onSelectObject(targetObject.id);
      }
      setDragInfo({ isDragging: true, target: targetObject, offsetX: worldPos.x - targetObject.x, offsetY: worldPos.y - targetObject.y });
    } else {
      onSelectObject(null);
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      e.currentTarget.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragInfo.isDragging && dragInfo.target) {
      const worldPos = getWorldMousePos(e);
      onObjectMove(dragInfo.target.id, worldPos.x - dragInfo.offsetX, worldPos.y - dragInfo.offsetY);
    } else if (isPanning) {
      const dx = (e.clientX - panStart.x) / camera.zoom;
      const dy = (e.clientY - panStart.y) / camera.zoom;
      setCamera((prev) => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUpOrLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDragInfo({ isDragging: false, target: null, offsetX: 0, offsetY: 0 });
    setIsPanning(false);
    e.currentTarget.style.cursor = 'grab';
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    setCamera((prev) => {
      const newZoom = e.deltaY < 0 ? prev.zoom * zoomFactor : prev.zoom / zoomFactor;
      const clampedZoom = Math.max(0.1, Math.min(newZoom, 10));
      return { ...prev, zoom: clampedZoom };
    });
  }, [setCamera]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);
  
  const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => e.preventDefault();
  const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;
      const item: PaletteItemData = JSON.parse(data);
      const worldPos = getWorldMousePos(e);
      onAddObject(item, worldPos.x, worldPos.y);
    } catch (err) { console.error("Drop failed:", err); }
  };

  return (
    <div className="flex-1 bg-gray-200 relative overflow-hidden">
      <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUpOrLeave} onMouseLeave={handleMouseUpOrLeave} onDragOver={handleDragOver} onDrop={handleDrop} onContextMenu={(e) => e.preventDefault()} style={{ cursor: 'grab' }} />
    </div>
  );
};
export default DuctCanvas;
