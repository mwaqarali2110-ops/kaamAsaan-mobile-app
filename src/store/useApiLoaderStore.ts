import { create } from 'zustand';

type ApiLoaderState = {
  activeCount: number;
  label?: string;
  show: (label?: string) => void;
  hide: () => void;
};

// Ref-counted so overlapping calls (e.g. a mutation kicked off while another
// is still settling) don't let the first `hide()` close the overlay early.
export const useApiLoaderStore = create<ApiLoaderState>((set) => ({
  activeCount: 0,
  label: undefined,
  show: (label) =>
    set((state) => ({
      activeCount: state.activeCount + 1,
      label: label ?? state.label
    })),
  hide: () =>
    set((state) => {
      const activeCount = Math.max(0, state.activeCount - 1);
      return { activeCount, label: activeCount === 0 ? undefined : state.label };
    })
}));
