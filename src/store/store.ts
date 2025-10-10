import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { StraightDuct } from '@/lib/objects';
import { AppState, AppActions } from '@/lib/types';

export const useAppStore = create<AppState & AppActions>()(immer((set, get) => ({
  objects: [],
  camera: { x: 0, y: 0, zoom: 1 },
  isPaletteOpen: true,
  nextId: 0,
  interactionState: {
    mode: 'none',
    target: null,
    startX: 0,
    startY: 0,
  },

  // --- Actions ---
  addObject: (partType, options) => {
    const { nextId } = get();
    let newObject;
    switch (partType) {
        case 'StraightDuct':
            newObject = new StraightDuct(0, 0, options);
            break;
        default:
            return;
    }
    newObject.id = nextId;
    set(state => {
      state.objects.push(newObject);
      state.nextId++;
    });
  },

  updateObjectPosition: (id, dx, dy) => {
    set(state => {
      const obj = state.objects.find(o => o.id === id);
      if (obj) {
        obj.x += dx;
        obj.y += dy;
      }
    });
  },

  panCamera: (dx, dy) => {
    set(state => {
      state.camera.x += dx;
      state.camera.y += dy;
    });
  },

  zoomCamera: (delta, mousePos) => {
    const { camera } = get();
    const zoomIntensity = 0.1;
    const normalizedDelta = Math.sign(delta);
    const zoomFactor = Math.exp(normalizedDelta * zoomIntensity);

    const newZoom = Math.max(0.1, Math.min(camera.zoom / zoomFactor, 10));
    
    const worldX_before = (mousePos.x - camera.x) / camera.zoom;
    const worldY_before = (mousePos.y - camera.y) / camera.zoom;
    
    const newX = mousePos.x - worldX_before * newZoom;
    const newY = mousePos.y - worldY_before * newZoom;

    set(state => {
      state.camera.x = newX;
      state.camera.y = newY;
      state.camera.zoom = newZoom;
    });
  },

  setInteractionMode: (mode, target) => {
    set(state => {
      state.interactionState.mode = mode;
      state.interactionState.target = target || null;
    });
  },

  setInteractionStart: (x, y) => {
    set(state => {
      state.interactionState.startX = x;
      state.interactionState.startY = y;
    });
  },

  togglePalette: () => {
    set(state => {
      state.isPaletteOpen = !state.isPaletteOpen;
    });
  },
})));
