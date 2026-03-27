import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DictionaryEntry, ReaderSettings } from '../types/dictionary'

interface AppStore {
  pdfFile: File | null
  selectedWord: string | null
  selectedLanguage: 'en' | 'de' | 'fr' | 'auto'
  dictionaryEntry: DictionaryEntry | null
  isLoading: boolean
  settings: ReaderSettings
  setPdfFile: (file: File | null) => void
  setSelectedWord: (word: string | null) => void
  setSelectedLanguage: (lang: 'en' | 'de' | 'fr' | 'auto') => void
  setDictionaryEntry: (entry: DictionaryEntry | null) => void
  setIsLoading: (loading: boolean) => void
  updateSettings: (settings: Partial<ReaderSettings>) => void
}

const defaultSettings: ReaderSettings = {
  fontSize: 16,
  lineHeight: 1.6,
  letterSpacing: 0,
  fontFamily: 'serif',
  theme: 'light',
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      pdfFile: null,
      selectedWord: null,
      selectedLanguage: 'auto',
      dictionaryEntry: null,
      isLoading: false,
      settings: defaultSettings,
      setPdfFile: (file) => set({ pdfFile: file }),
      setSelectedWord: (word) => set({ selectedWord: word }),
      setSelectedLanguage: (lang: 'en' | 'de' | 'fr' | 'auto') => set({ selectedLanguage: lang }),
      setDictionaryEntry: (entry) => set({ dictionaryEntry: entry }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
    }),
    {
      name: 'lexiview-settings',
      partialize: (state) => ({ settings: state.settings, selectedLanguage: state.selectedLanguage }),
    }
  )
)
