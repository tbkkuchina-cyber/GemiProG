import { DuctPart } from './objects';

export interface Camera {
    x: number;
    y: number;
    zoom: number;
}

export type InteractionMode = 'none' | 'pan' | 'drag';

export interface InteractionState {
    mode: InteractionMode;
    target: DuctPart | null;
    startX: number;
    startY: number;
}

export interface AppState {
    objects: DuctPart[];
    camera: Camera;
    isPaletteOpen: boolean;
    nextId: number;
    interactionState: InteractionState;
}

export interface AppActions {
    addObject: (partType: string, options: Record<string, unknown>) => void;
    updateObjectPosition: (id: number, dx: number, dy: number) => void;
    panCamera: (dx: number, dy: number) => void;
    zoomCamera: (delta: number, mousePos: {x: number, y: number}) => void;
    setInteractionMode: (mode: InteractionMode, target?: DuctPart | null) => void;
    setInteractionStart: (x: number, y: number) => void;
    togglePalette: () => void;
}
