import { create } from 'zustand'
import type { MoodType, VisibilityType } from '@/types'

interface JournalDraft {
  title: string;
  content: string;
  mood: MoodType | null;
  photos: string[];
  tags: string[];
  visibility: VisibilityType;
  location: { name: string; lat?: number; lng?: number } | null;
}

interface JournalStore {
  draft: JournalDraft;
  setDraft: (updates: Partial<JournalDraft>) => void;
  resetDraft: () => void;
}

const initialDraft: JournalDraft = {
  title: '',
  content: '',
  mood: null,
  photos: [],
  tags: [],
  visibility: 'private',
  location: null,
};

export const useJournalStore = create<JournalStore>()((set) => ({
  draft: { ...initialDraft },
  setDraft: (updates) =>
    set((state) => ({
      draft: { ...state.draft, ...updates },
    })),
  resetDraft: () => set({ draft: { ...initialDraft } }),
}))
