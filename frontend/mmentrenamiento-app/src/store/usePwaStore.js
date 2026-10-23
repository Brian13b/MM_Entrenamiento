import { create } from 'zustand';

export const usePwaStore = create((set) => ({
  deferredPrompt: null,
  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),
  clearPrompt: () => set({ deferredPrompt: null }),
}));