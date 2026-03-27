import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppView,
  GeneratedQuiz,
  QuizQuestion,
  QuizSession,
  QuizBuilderConfig,
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
  quizBuilderConfig: QuizBuilderConfig
  generatedQuiz: GeneratedQuiz | null
  activeSession: QuizSession | null
  activeView: AppView
  currentUser: UserProfile | null
  setPdfFile: (file: File | null) => void
  setSelectedWord: (word: string | null) => void
  setSelectedLanguage: (lang: 'en' | 'de' | 'fr' | 'auto') => void
  setDictionaryEntry: (entry: DictionaryEntry | null) => void
  saveWord: (entry: DictionaryEntry, sourceTitle: string) => void
  removeSavedWord: (word: string, language: 'en' | 'de' | 'fr') => void
  setIsLoading: (loading: boolean) => void
  updateSettings: (settings: Partial<ReaderSettings>) => void
  updateQuizBuilderConfig: (settings: Partial<QuizBuilderConfig>) => void
  setGeneratedQuiz: (quiz: GeneratedQuiz | null) => void
  updateGeneratedQuizTitle: (title: string) => void
  updateGeneratedQuestion: (position: number, question: QuizQuestion) => void
  deleteGeneratedQuestion: (position: number) => void
  addGeneratedQuestion: (question: QuizQuestion) => void
  moveGeneratedQuestion: (position: number, direction: 'up' | 'down') => void
  setActiveSession: (session: QuizSession | null) => void
  updateActiveSession: (partial: Partial<QuizSession>) => void
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

const defaultQuizBuilderConfig: QuizBuilderConfig = {
  language: 'German',
  languageLevel: 'A2',
  topic: '',
  quizType: 'vocabulary',
  questionCount: 10,
  optionsPerQuestion: 4,
  timePerQuestion: 20,
  title: '',
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
      quizBuilderConfig: defaultQuizBuilderConfig,
      generatedQuiz: null,
      activeSession: null,
      activeView: 'dashboard',
      currentUser: null,
      setPdfFile: (file) => set({ pdfFile: file }),
      setSelectedWord: (word) => set({ selectedWord: word }),
      setSelectedLanguage: (lang: 'en' | 'de' | 'fr' | 'auto') => set({ selectedLanguage: lang }),
      setDictionaryEntry: (entry) => set({ dictionaryEntry: entry }),
      saveWord: (entry, sourceTitle) =>
        set((state) => {
          const alreadySaved = state.savedWords.some(
            (saved) =>
              saved.word.toLowerCase() === entry.word.toLowerCase() &&
              saved.language === entry.language &&
              saved.sourceTitle === sourceTitle
          )

          if (alreadySaved) return state

          const nextSavedWords = [
            {
              word: entry.word,
              language: entry.language,
              savedAt: new Date().toISOString(),
              sourceTitle,
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
      updateQuizBuilderConfig: (partial) =>
        set((state) => ({
          quizBuilderConfig: {
            ...state.quizBuilderConfig,
            ...partial,
          },
        })),
      setGeneratedQuiz: (quiz) => set({ generatedQuiz: quiz }),
      updateGeneratedQuizTitle: (title) =>
        set((state) =>
          state.generatedQuiz
            ? {
                generatedQuiz: {
                  ...state.generatedQuiz,
                  title,
                },
              }
            : state
        ),
      updateGeneratedQuestion: (position, question) =>
        set((state) => {
          if (!state.generatedQuiz) return state

          return {
            generatedQuiz: {
              ...state.generatedQuiz,
              questions: state.generatedQuiz.questions.map((entry) =>
                entry.position === position ? question : entry
              ),
            },
          }
        }),
      deleteGeneratedQuestion: (position) =>
        set((state) => {
          if (!state.generatedQuiz) return state

          const questions = state.generatedQuiz.questions
            .filter((entry) => entry.position !== position)
            .map((entry, index) => ({ ...entry, position: index + 1 }))

          return {
            generatedQuiz: {
              ...state.generatedQuiz,
              questions,
            },
          }
        }),
      addGeneratedQuestion: (question) =>
        set((state) => {
          if (!state.generatedQuiz) {
            return {
              generatedQuiz: {
                title: defaultQuizBuilderConfig.title,
                questions: [{ ...question, position: 1 }],
              },
            }
          }

          const nextQuestions = [
            ...state.generatedQuiz.questions,
            { ...question, position: state.generatedQuiz.questions.length + 1 },
          ]

          return {
            generatedQuiz: {
              ...state.generatedQuiz,
              questions: nextQuestions,
            },
          }
        }),
      moveGeneratedQuestion: (position, direction) =>
        set((state) => {
          if (!state.generatedQuiz) return state

          const items = [...state.generatedQuiz.questions]
          const currentIndex = items.findIndex((entry) => entry.position === position)

          if (currentIndex === -1) return state

          const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
          if (targetIndex < 0 || targetIndex >= items.length) return state

          const [moved] = items.splice(currentIndex, 1)
          items.splice(targetIndex, 0, moved)

          return {
            generatedQuiz: {
              ...state.generatedQuiz,
              questions: items.map((entry, index) => ({ ...entry, position: index + 1 })),
            },
          }
        }),
      setActiveSession: (session) => set({ activeSession: session }),
      updateActiveSession: (partial) =>
        set((state) =>
          state.activeSession
            ? {
                activeSession: {
                  ...state.activeSession,
                  ...partial,
                },
              }
            : state
        ),
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
        quizBuilderConfig: state.quizBuilderConfig,
        generatedQuiz: state.generatedQuiz,
        activeSession: state.activeSession,
        currentUser: state.currentUser,
        activeView: state.activeView,
      }),
    }
  )
)
