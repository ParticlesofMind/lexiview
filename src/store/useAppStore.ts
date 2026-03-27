import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppView,
  DictionaryEntry,
  ReaderSettings,
  SavedWord,
  UserProfile,
} from '../types/dictionary'

interface AppStore {
  pdfFile: File | null
  selectedWord: string | null
  selectedLanguage: 'en' | 'de' | 'fr' | 'auto'
  dictionaryEntry: DictionaryEntry | null
  savedWords: SavedWord[]
  isLoading: boolean
  settings: ReaderSettings
  activeView: AppView
  currentUser: UserProfile | null
  setPdfFile: (file: File | null) => void
  setSelectedWord: (word: string | null) => void
  setSelectedLanguage: (lang: 'en' | 'de' | 'fr' | 'auto') => void
  setDictionaryEntry: (entry: DictionaryEntry | null) => void
  saveWord: (entry: DictionaryEntry) => void
  removeSavedWord: (word: string, language: 'en' | 'de' | 'fr') => void
  setIsLoading: (loading: boolean) => void
  updateSettings: (settings: Partial<ReaderSettings>) => void
  setActiveView: (view: AppView) => void
  signInLocally: (username: string) => void
  signOutLocally: () => void
}

function deriveReadingLevel(savedWordsCount: number): UserProfile['readingLevel'] {
  if (savedWordsCount >= 40) return 'advanced'
  if (savedWordsCount >= 15) return 'intermediate'
  return 'beginner'
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
      activeView: 'dashboard',
      currentUser: null,
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

          const nextSavedWords = [
            {
              word: entry.word,
              language: entry.language,
              savedAt: new Date().toISOString(),
              entry,
            },
            ...state.savedWords,
          ]

          return {
            savedWords: nextSavedWords,
            currentUser: state.currentUser
              ? {
                  ...state.currentUser,
                  readingLevel: deriveReadingLevel(nextSavedWords.length),
                }
              : null,
          }
        }),
      removeSavedWord: (word, language) =>
        set((state) => {
          const nextSavedWords = state.savedWords.filter(
            (saved) =>
              !(saved.word.toLowerCase() === word.toLowerCase() && saved.language === language)
          )

          return {
            savedWords: nextSavedWords,
            currentUser: state.currentUser
              ? {
                  ...state.currentUser,
                  readingLevel: deriveReadingLevel(nextSavedWords.length),
                }
              : null,
          }
        }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
      setActiveView: (view) => set({ activeView: view }),
      signInLocally: (username) =>
        set((state) => ({
          currentUser: {
            username: username.trim(),
            joinedAt: new Date().toISOString(),
            readingLevel: deriveReadingLevel(state.savedWords.length),
          },
          activeView: 'dashboard',
        })),
      signOutLocally: () =>
        set({
          currentUser: null,
          activeView: 'dashboard',
          selectedWord: null,
          dictionaryEntry: null,
        }),
    }),
    {
      name: 'lexiview-settings',
      partialize: (state) => ({
        settings: state.settings,
        selectedLanguage: state.selectedLanguage,
        selectedWord: state.selectedWord,
        dictionaryEntry: state.dictionaryEntry,
        savedWords: state.savedWords,
        currentUser: state.currentUser,
        activeView: state.activeView,
      }),
    }
  )
)
