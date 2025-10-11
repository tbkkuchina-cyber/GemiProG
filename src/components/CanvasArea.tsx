'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/store';
import { StraightDuct } from '@/lib/objects';

export const CanvasArea = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const store = useAppStore();

    const getMousePos = useCallback((e: MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }, []);

    const screenToWorld = useCallback((screenPos: {x: number, y: number}) => {
        return {
            x: (screenPos.x - store.camera.x) / store.camera.zoom,
            y: (screenPos.y - store.camera.y) / store.camera.zoom
        };
    }, [store.camera]);

    // Drawing Effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !canvas.parentElement) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(store.camera.x, store.camera.y);
        ctx.scale(store.camera.zoom, store.camera.zoom);

        store.objects.forEach(obj => {
            ctx.fillStyle = '#1d4ed8';
            ctx.strokeStyle = '#1e3a8a';
            if (obj.type === 'StraightDuct') {
                 const duct = obj as unknown as StraightDuct;
                 ctx.fillRect(duct.x - duct.length / 2, duct.y - duct.diameter / 2, duct.length, duct.diameter);
                 ctx.strokeRect(duct.x - duct.length / 2, duct.y - duct.diameter / 2, duct.length, duct.diameter);
            }
        });
        ctx.restore();
    }, [store.objects, store.camera]);

    // Mouse Event Handlers
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleMouseDown = (e: MouseEvent) => {
            const screenPos = getMousePos(e);
            const worldPos = screenToWorld(screenPos);

            const target = store.objects.slice().reverse().find(obj => obj.isPointInside(worldPos.x, worldPos.y));

            if (target) {
                store.setInteractionMode('drag', target);
            } else {
                store.setInteractionMode('pan');
            }
            store.setInteractionStart(e.clientX, e.clientY);
        };

        const handleMouseUp = () => {
            store.setInteractionMode('none');
        };

        const handleMouseMove = (e: MouseEvent) => {
            const { interactionState, camera } = store;
            if (interactionState.mode === 'none') return;

            const dx = e.clientX - interactionState.startX;
            const dy = e.clientY - interactionState.startY;

            if (interactionState.mode === 'pan') {
                store.panCamera(dx, dy);
            } else if (interactionState.mode === 'drag' && interactionState.target) {
                store.updateObjectPosition(interactionState.target.id, dx / camera.zoom, dy / camera.zoom);
            }

            store.setInteractionStart(e.clientX, e.clientY);
        };

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const screenPos = getMousePos(e);
            store.zoomCamera(e.deltaY, screenPos);
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('wheel', handleWheel);

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, [getMousePos, screenToWorld, store]);

    return (
        <div className="flex-1 bg-gray-200 relative overflow-hidden min-h-0">
            <canvas ref={canvasRef} className="w-full h-full"></canvas>
        </div>
    );
};