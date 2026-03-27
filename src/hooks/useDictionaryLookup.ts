import { useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { DictionaryEntry, Meaning } from '../types/dictionary'

// Only use unambiguous script/character signals for detection
const GERMAN_CHARS = /[äöüÄÖÜß]/
const FRENCH_CHARS = /[éèêëàâîïôùûüçœæÉÈÊËÀÂÎÏÔÙÛÜÇŒÆ]/

type Lang = 'en' | 'de' | 'fr'

function detectLanguage(word: string, override: 'en' | 'de' | 'fr' | 'auto'): Lang {
  if (override !== 'auto') return override
  if (GERMAN_CHARS.test(word)) return 'de'
  if (FRENCH_CHARS.test(word)) return 'fr'
  return 'en'
}

// Free Dictionary API supports: en, fr, de, es, it, ja, ko, ru, ar, tr, hi, pt-BR
async function fetchFromFreeDict(word: string, lang: Lang): Promise<DictionaryEntry | null> {
  const res = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/${lang}/${encodeURIComponent(word)}`
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
    language: lang,
  }
}

async function fetchGerman(word: string): Promise<DictionaryEntry | null> {
  // Try Free Dictionary API first (supports 'de')
  const fromFreeDict = await fetchFromFreeDict(word, 'de')
  if (fromFreeDict) return fromFreeDict

  // Fallback: Wiktionary REST API
  const res = await fetch(
    `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`
  )
  if (!res.ok) return null
  const data = await res.json()
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

  return { word, phonetics: [], meanings, language: 'de' }
}

export function useDictionaryLookup() {
  const { selectedLanguage, setDictionaryEntry, setIsLoading } = useAppStore()

  const lookup = useCallback(
    async (word: string) => {
      const lang = detectLanguage(word, selectedLanguage)
      setIsLoading(true)
      setDictionaryEntry(null)

      try {
        let entry: DictionaryEntry | null = null

        if (lang === 'de') {
          entry = await fetchGerman(word)
        } else {
          // en and fr both use Free Dictionary API
          entry = await fetchFromFreeDict(word, lang)
        }

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
