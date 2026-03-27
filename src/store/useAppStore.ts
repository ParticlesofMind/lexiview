import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DictionaryEntry, ReaderSettings, SavedWord } from '../types/dictionary'

interface AppStore {
  pdfFile: File | null
  selectedWord: string | null
  selectedLanguage: 'en' | 'de' | 'fr' | 'auto'
  dictionaryEntry: DictionaryEntry | null
  savedWords: SavedWord[]
  isLoading: boolean
  settings: ReaderSettings
  setPdfFile: (file: File | null) => void
  setSelectedWord: (word: string | null) => void
  setSelectedLanguage: (lang: 'en' | 'de' | 'fr' | 'auto') => void
  setDictionaryEntry: (entry: DictionaryEntry | null) => void
  saveWord: (entry: DictionaryEntry) => void
  removeSavedWord: (word: string, language: 'en' | 'de' | 'fr') => void
  setIsLoading: (loading: boolean) => void
  updateSettings: (settings: Partial<ReaderSettings>) => void
}

const defaultSettings: ReaderSettings = {
  fontSize: 16,
  lineHeight: 1.6,
  letterSpacing: 0,
  fontFamily: 'serif',
  theme: 'light',
  pdfZoom: 1,
  pdfTextOpacity: 1,
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      pdfFile: null,
      selectedWord: null,
      selectedLanguage: 'auto',
      dictionaryEntry: null,
      savedWords: [],
      isLoading: false,
      settings: defaultSettings,
      setPdfFile: (file) => set({ pdfFile: file }),
      setSelectedWord: (word) => set({ selectedWord: word }),
      setSelectedLanguage: (lang: 'en' | 'de' | 'fr' | 'auto') => set({ selectedLanguage: lang }),
      setDictionaryEntry: (entry) => set({ dictionaryEntry: entry }),
      saveWord: (entry) =>
        set((state) => {
          const alreadySaved = state.savedWords.some(
            (saved) =>
              saved.word.toLowerCase() === entry.word.toLowerCase() &&
              saved.language === entry.language
          )

          if (alreadySaved) return state

          return {
            savedWords: [
              {
                word: entry.word,
                language: entry.language,
                savedAt: new Date().toISOString(),
                entry,
              },
              ...state.savedWords,
            ],
          }
        }),
      removeSavedWord: (word, language) =>
        set((state) => ({
          savedWords: state.savedWords.filter(
            (saved) =>
              !(saved.word.toLowerCase() === word.toLowerCase() && saved.language === language)
          ),
        })),
      setIsLoading: (loading) => set({ isLoading: loading }),
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
    }),
    {
      name: 'lexiview-settings',
      partialize: (state) => ({
        settings: state.settings,
        selectedLanguage: state.selectedLanguage,
        selectedWord: state.selectedWord,
        dictionaryEntry: state.dictionaryEntry,
        savedWords: state.savedWords,
      }),
    }
  )
)
