import { useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { DictionaryEntry, Meaning } from '../types/dictionary'

const GERMAN_PATTERN = /[äöüÄÖÜß]|(ung|heit|keit|schaft|lich|isch|ig|en|er|es|em)\b/

function detectLanguage(word: string, override: 'en' | 'de' | 'auto'): 'en' | 'de' {
  if (override !== 'auto') return override
  return GERMAN_PATTERN.test(word) ? 'de' : 'en'
}

async function fetchEnglish(word: string): Promise<DictionaryEntry | null> {
  const res = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
  )
  if (!res.ok) return null
  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) return null
  const entry = data[0]
  return {
    word: entry.word,
    phonetics: entry.phonetics ?? [],
    meanings: entry.meanings ?? [],
    etymology: undefined,
    language: 'en',
  }
}

async function fetchGerman(word: string): Promise<DictionaryEntry | null> {
  // Use Wiktionary REST API (English Wiktionary, German section)
  const res = await fetch(
    `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`
  )
  if (!res.ok) return null
  const data = await res.json()

  // Try to find German definitions
  const deDefs = data.de
  if (!deDefs || deDefs.length === 0) return null

  const meanings: Meaning[] = deDefs.map((def: { partOfSpeech: string; definitions: { definition: string; example?: string }[] }) => ({
    partOfSpeech: def.partOfSpeech ?? '',
    definitions: (def.definitions ?? []).map((d: { definition: string; example?: string }) => ({
      definition: d.definition?.replace(/<[^>]+>/g, '') ?? '',
      example: d.example?.replace(/<[^>]+>/g, ''),
      synonyms: [],
      antonyms: [],
    })),
    synonyms: [],
    antonyms: [],
  }))

  return {
    word,
    phonetics: [],
    meanings,
    language: 'de',
  }
}

export function useDictionaryLookup() {
  const { selectedLanguage, setDictionaryEntry, setIsLoading } = useAppStore()

  const lookup = useCallback(
    async (word: string) => {
      const lang = detectLanguage(word, selectedLanguage)
      setIsLoading(true)
      setDictionaryEntry(null)

      try {
        const entry = lang === 'en' ? await fetchEnglish(word) : await fetchGerman(word)
        setDictionaryEntry(entry)
      } catch {
        setDictionaryEntry(null)
      } finally {
        setIsLoading(false)
      }
    },
    [selectedLanguage, setDictionaryEntry, setIsLoading]
  )

  return { lookup }
}
