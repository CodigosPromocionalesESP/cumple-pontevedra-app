import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  nickname: string | null;
  setNickname: (name: string) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      nickname: null,
      setNickname: (name) => set({ nickname: name }),
      logout: () => set({ nickname: null }),
    }),
    {
      name: 'cumple-storage',
    }
  )
);
