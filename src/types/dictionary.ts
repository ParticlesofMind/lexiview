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
  entry: DictionaryEntry
}

export type AppView = 'dashboard' | 'reader' | 'wordbank'

export interface UserProfile {
  username: string
  joinedAt: string
  readingLevel: 'beginner' | 'intermediate' | 'advanced'
}
