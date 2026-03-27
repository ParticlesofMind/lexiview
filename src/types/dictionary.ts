export interface Phonetic {
  text?: string
  audio?: string
}

export interface Definition {
  definition: string
  example?: string
  synonyms: string[]
  antonyms: string[]
}

export interface Meaning {
  partOfSpeech: string
  definitions: Definition[]
  synonyms: string[]
  antonyms: string[]
}

export interface DictionaryEntry {
  word: string
  phonetics: Phonetic[]
  meanings: Meaning[]
  etymology?: string
  language: 'en' | 'de' | 'fr'
  quickMeaning?: string
  imageUrl?: string
  imageSource?: string
  // German-specific
  genus?: string
  plural?: string
}

export interface ReaderSettings {
  fontSize: number
  lineHeight: number
  letterSpacing: number
  fontFamily: 'serif' | 'sans' | 'mono'
  theme: 'light' | 'dark'
  pdfZoom: number
  pdfTextOpacity: number
}

export interface SavedWord {
  word: string
  language: 'en' | 'de' | 'fr'
  savedAt: string
  sourceTitle: string
  entry: DictionaryEntry
}

export type AppView = 'dashboard' | 'reader' | 'wordbank' | 'quizbuilder'

export type QuizLanguage = 'German' | 'English' | 'French' | 'Italian' | 'Spanish'
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type QuizType =
  | 'vocabulary'
  | 'grammar'
  | 'comprehension'
  | 'translation'
  | 'fill_in_the_blank'
  | 'error_detection'

export interface QuizBuilderConfig {
  language: QuizLanguage
  languageLevel: CefrLevel
  topic: string
  quizType: QuizType
  questionCount: number
  optionsPerQuestion: 2 | 3 | 4
  timePerQuestion: number
  title: string
}

export interface QuizOption {
  label: 'A' | 'B' | 'C' | 'D'
  text: string
}

export interface QuizQuestion {
  position: number
  prompt: string
  options: QuizOption[]
  correct_answer: 'A' | 'B' | 'C' | 'D'
  explanation: string
}

export interface GeneratedQuiz {
  title: string
  questions: QuizQuestion[]
}

export interface UserProfile {
  username: string
  joinedAt: string
  readingLevel: 'beginner' | 'intermediate' | 'advanced'
}
