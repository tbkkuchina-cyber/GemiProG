import { atom } from 'jotai';
import { 
  AnyDuctPart, Camera, Point, Fittings, ConfirmModalContent, 
  Dimension, SnapPoint, FittingItem, DuctPartType, 
  DragState, StraightDuct, Connector, IntersectionPoint, TakeoffResult 
} from './types';
import { getDefaultFittings } from './default-fittings';
import { createDuctPart } from './duct-models';
import { performTakeoff } from './duct-calculations';
import { v4 as uuidv4 } from 'uuid';

// --- 初期値と定数 ---
const INITIAL_CAMERA: Camera = { x: 0, y: 0, zoom: 1 };

// --- Basic Atoms ---
export const objectsAtom = atom<AnyDuctPart[]>([]);
export const dimensionsAtom = atom<Dimension[]>([]); // ★寸法線用のAtom
export const cameraAtom = atom<Camera>(INITIAL_CAMERA);
export const modeAtom = atom<'select' | 'pan'>('select');
export const activeToolAtom = atom<'select' | 'straight' | 'dimension'>('select'); // ★ツール定義

export const selectedObjectIdAtom = atom<string | null>(null);
export const currentDiameterAtom = atom<number>(200);

// --- History / Undo / Redo ---
const historyAtom = atom<{ objects: AnyDuctPart[], dimensions: Dimension[] }[]>([]);
const historyIndexAtom = atom<number>(-1);

// 状態保存アクション
export const saveStateAtom = atom(
  null,
  (get, set) => {
    const current = {
      objects: get(objectsAtom),
      dimensions: get(dimensionsAtom)
    };
    
    const history = get(historyAtom);
    const index = get(historyIndexAtom);
    
    // 現在のインデックス以降を切り捨てて新しい状態を追加
    const newHistory = history.slice(0, index + 1);
    newHistory.push(current);
    
    // 履歴制限 (例: 50ステップ)
    if (newHistory.length > 50) newHistory.shift();
    
    set(historyAtom, newHistory);
    set(historyIndexAtom, newHistory.length - 1);
  }
);

export const undoAtom = atom(
  null,
  (get, set) => {
    const index = get(historyIndexAtom);
    if (index > 0) {
      const prevIndex = index - 1;
      const prevState = get(historyAtom)[prevIndex];
      set(objectsAtom, prevState.objects);
      set(dimensionsAtom, prevState.dimensions);
      set(historyIndexAtom, prevIndex);
    }
  }
);

export const redoAtom = atom(
  null,
  (get, set) => {
    const index = get(historyIndexAtom);
    const history = get(historyAtom);
    if (index < history.length - 1) {
      const nextIndex = index + 1;
      const nextState = history[nextIndex];
      set(objectsAtom, nextState.objects);
      set(dimensionsAtom, nextState.dimensions);
      set(historyIndexAtom, nextIndex);
    }
  }
);

export const canUndoAtom = atom((get) => get(historyIndexAtom) > 0);
export const canRedoAtom = atom((get) => get(historyIndexAtom) < get(historyAtom).length - 1);

// --- Dimension Actions ---
export const allDimensionsAtom = atom((get) => get(dimensionsAtom));

export const addDimensionAtom = atom(
  null,
  (get, set, newDim: Dimension) => {
    set(dimensionsAtom, (prev) => [...prev, newDim]);
    set(saveStateAtom);
  }
);

// --- Drawing Interaction Atoms ---
export const drawingStartPointAtom = atom<Point | null>(null);
export const drawingEndPointAtom = atom<Point | null>(null);
export const isPanningAtom = atom<boolean>(false);
export const dragStateAtom = atom<DragState>({
  isDragging: false,
  targetId: null,
  initialPositions: null,
  offset: { x: 0, y: 0 },
});

// --- Background / Calibration ---
export const backgroundImageAtom = atom<HTMLImageElement | null>(null);
export const backgroundConfigAtom = atom({
  x: 0, y: 0, opacity: 0.4, scale: 1.0
});
export const drawingScaleAtom = atom<number>(1.0); // 1px = 1mm
export const calibrationModeAtom = atom<boolean>(false);
export const calibrationPointsAtom = atom<Point[]>([]);

// --- Palette / Modals ---
export const isPaletteOpenAtom = atom<boolean>(true);
export const fittingsAtom = atom<Fittings>(getDefaultFittings());

// Fittings Modal
export const isFittingsModalOpenAtom = atom<boolean>(false);
export const openFittingsModalAtom = atom(null, (get, set) => set(isFittingsModalOpenAtom, true));
export const closeFittingsModalAtom = atom(null, (get, set) => set(isFittingsModalOpenAtom, false));
export const saveFittingsAtom = atom(null, (get, set, newFittings: Fittings) => {
  set(fittingsAtom, newFittings);
  // ローカルストレージ保存などはここで行う
});
export const loadFittingsAtom = atom(null, (get, set) => {
  // 必要ならロード処理
});

// Clear Canvas Modal
export const isClearCanvasModalOpenAtom = atom<boolean>(false);
export const openConfirmModalAtom = atom(null, (get, set, content: ConfirmModalContent & { onConfirm: () => void }) => {
    set(confirmModalContentAtom, content);
    set(confirmActionAtom, () => content.onConfirm);
    set(isConfirmModalOpenAtom, true);
});
export const clearCanvasAtom = atom(
  null,
  (get, set) => {
    set(objectsAtom, []);
    set(dimensionsAtom, []);
    set(saveStateAtom);
    set(selectedObjectIdAtom, null);
  }
);

// Context Menu
export const isContextMenuOpenAtom = atom<boolean>(false);
export const contextMenuPositionAtom = atom<{ x: number, y: number }>({ x: 0, y: 0 });
export const closeContextMenuAtom = atom(null, (get, set) => set(isContextMenuOpenAtom, false));

// Dimension Modal (Edit)
export const isDimensionModalOpenAtom = atom<boolean>(false);
export const dimensionModalContentAtom = atom<any>(null);
export const closeDimensionModalAtom = atom(null, (get, set) => {
  set(isDimensionModalOpenAtom, false);
  set(dimensionModalContentAtom, null);
});

// Confirm Modal
export const isConfirmModalOpenAtom = atom<boolean>(false);
export const closeConfirmModalAtom = atom(null, (get, set) => set(isConfirmModalOpenAtom, false));
export const confirmModalContentAtom = atom<ConfirmModalContent | null>(null);
export const confirmActionAtom = atom<(() => void) | null>(null);

// Notification
export const notificationAtom = atom<{ id: string, message: string } | null>(null);

// --- Derived Atoms (Calculations) ---
export const takeoffResultAtom = atom<TakeoffResult>((get) => {
  const objects = get(objectsAtom);
  return performTakeoff(objects);
});

export const selectedObjectAtom = atom((get) => {
  const id = get(selectedObjectIdAtom);
  if (!id) return null;
  return get(objectsAtom).find(o => o.id === id) || null;
});

// --- Action Atoms (Operations) ---
export const setCameraAtom = atom(
  null,
  (get, set, update: Partial<Camera>) => {
    set(cameraAtom, (prev) => ({ ...prev, ...update }));
  }
);

export const deleteSelectedObjectAtom = atom(
  null,
  (get, set) => {
    const selectedId = get(selectedObjectIdAtom);
    if (!selectedId) return;

    // オブジェクト削除
    set(objectsAtom, (prev) => prev.filter(o => o.id !== selectedId));
    // 関連する寸法線も削除
    set(dimensionsAtom, (prev) => prev.filter(d => d.p1_objId !== selectedId && d.p2_objId !== selectedId));
    
    set(selectedObjectIdAtom, null);
    set(saveStateAtom);
  }
);

export const rotateSelectedObjectAtom = atom(
  null,
  (get, set) => {
    const selectedId = get(selectedObjectIdAtom);
    if (!selectedId) return;

    set(objectsAtom, (prev) => prev.map(obj => {
      if (obj.id === selectedId) {
        const newRot = (obj.rotation + 45) % 360;
        return { ...obj, rotation: newRot };
      }
      return obj;
    }));
    set(saveStateAtom);
  }
);

export const flipSelectedObjectAtom = atom(
  null,
  (get, set) => {
    const selectedId = get(selectedObjectIdAtom);
    if (!selectedId) return;

    set(objectsAtom, (prev) => prev.map(obj => {
      if (obj.id === selectedId) {
        return { ...obj, isFlipped: !obj.isFlipped };
      }
      return obj;
    }));
    set(saveStateAtom);
  }
);

export const disconnectSelectedObjectAtom = atom(
  null,
  (get, set) => {
      // 接続解除ロジック（今回は位置を少しずらす簡易実装）
      const selectedId = get(selectedObjectIdAtom);
      if (!selectedId) return;
      
      set(objectsAtom, prev => prev.map(obj => {
          if (obj.id === selectedId) {
              return { ...obj, x: obj.x + 10, y: obj.y + 10 };
          }
          return obj;
      }));
      set(saveStateAtom);
  }
);

// Placeholder for missing atoms mentioned in imports
export const pendingActionAtom = atom<string | null>(null);
export const addObjectAtom = atom(null, (get, set, obj: AnyDuctPart) => {
    set(objectsAtom, prev => [...prev, obj]);
    set(saveStateAtom);
});
export const updateStraightDuctLengthAtom = atom(null, (get, set, {id, length}: {id: string, length: number}) => {
    set(objectsAtom, prev => prev.map(o => o.id === id && o.type === DuctPartType.Straight ? {...o, length} : o));
    set(saveStateAtom);
});