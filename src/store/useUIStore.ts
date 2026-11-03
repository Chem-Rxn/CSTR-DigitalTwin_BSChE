// src/store/useUIStore.ts
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

export type TabId = 'flow' | 'thermo' | 'pid';
export type CameraPreset = 'iso' | 'front' | 'top' | 'coil';
export type ModalId = 'none' | 'save' | 'load';

interface UIState {
  tab: TabId;
  camera: CameraPreset;
  modal: ModalId;
  pidHighlight: boolean;
  setTab: (t: TabId) => void;
  setCamera: (c: CameraPreset) => void;
  setModal: (m: ModalId) => void;
  flashPid: () => void;
}

let flashTimer: ReturnType<typeof setTimeout> | undefined;

export const useUIStore = create<UIState>()(
  devtools(
    subscribeWithSelector((set) => ({
      tab: 'flow', camera: 'iso', modal: 'none', pidHighlight: false,
      setTab: (tab) => set({ tab }),
      setCamera: (camera) => set({ camera }),
      setModal: (modal) => set({ modal }),
      flashPid: () => {
        set({ tab: 'pid', pidHighlight: true });
        clearTimeout(flashTimer);
        flashTimer = setTimeout(() => set({ pidHighlight: false }), 2500);
      },
    })),
    { name: 'ui' }
  )
);
