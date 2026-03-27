import { useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { DictionaryEntry, Meaning } from '../types/dictionary'

// Only use unambiguous script/character signals for detection
const GERMAN_CHARS = /[äöüÄÖÜß]/
const FRENCH_CHARS = /[éèêëàâîïôùûüçœæÉÈÊËÀÂÎÏÔÙÛÜÇŒÆ]/

type Lang = 'en' | 'de' | 'fr'

function simplifyText(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  const sentence = clean.split(/[.;:]/)[0] ?? clean
  return sentence.length > 140 ? `${sentence.slice(0, 137)}...` : sentence
}

function isLikelyNoun(partOfSpeech: string): boolean {
  const value = partOfSpeech.toLowerCase()
  return (
    value.includes('noun') ||
    value.includes('substantiv') ||
    value.includes('nom') ||
    value.includes('n.')
  )
}

function isLikelyAdjective(partOfSpeech: string): boolean {
  const value = partOfSpeech.toLowerCase()
  return (
    value.includes('adjective') ||
    value.includes('adjektiv') ||
    value.includes('adjectif') ||
    value.includes('adj.')
  )
}

function imageHint(word: string, meanings: Meaning[]): string {
  const hasAdj = meanings.some((meaning) => isLikelyAdjective(meaning.partOfSpeech ?? ''))
  if (hasAdj) return `${word} facial expression comparison`
  return word
}

async function fetchWikipediaImage(word: string, lang: Lang) {
  const endpoint = `https://${lang}.wikipedia.org/w/api.php?action=query&origin=*&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=640&titles=${encodeURIComponent(word)}`
  const res = await fetch(endpoint)
  if (!res.ok) return { imageUrl: undefined, imageSource: undefined }
  const data = await res.json()
  const pages = data?.query?.pages
  if (!pages) return { imageUrl: undefined, imageSource: undefined }
  const firstPage = Object.values(pages)[0] as { thumbnail?: { source?: string } } | undefined

  return {
    imageUrl: firstPage?.thumbnail?.source,
    imageSource: firstPage?.thumbnail?.source ? 'Wikipedia' : undefined,
  }
}

async function fetchWikimediaSearchImage(query: string, lang: Lang) {
  const searchEndpoint = `https://${lang}.wikipedia.org/w/api.php?action=query&origin=*&format=json&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1`
  const searchRes = await fetch(searchEndpoint)
  if (!searchRes.ok) return { imageUrl: undefined, imageSource: undefined }
  const searchData = await searchRes.json()
  const firstTitle = searchData?.query?.search?.[0]?.title as string | undefined
  if (!firstTitle) return { imageUrl: undefined, imageSource: undefined }
  return fetchWikipediaImage(firstTitle, lang)
}

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
  const meanings = (entry.meanings ?? []).map((meaning: Meaning) => ({
    ...meaning,
    definitions: (meaning.definitions ?? []).slice(0, 3).map((def) => ({
      ...def,
      definition: simplifyText(def.definition ?? ''),
      example: def.example ? simplifyText(def.example) : undefined,
      synonyms: (def.synonyms ?? []).slice(0, 6),
      antonyms: (def.antonyms ?? []).slice(0, 6),
    })),
    synonyms: (meaning.synonyms ?? []).slice(0, 8),
    antonyms: (meaning.antonyms ?? []).slice(0, 8),
  }))

  const quickMeaning = meanings[0]?.definitions?.[0]?.definition
  const shouldFetchImage = meanings.some(
    (meaning: Meaning) =>
      isLikelyNoun(meaning.partOfSpeech ?? '') || isLikelyAdjective(meaning.partOfSpeech ?? '')
  )
  let image = shouldFetchImage ? await fetchWikipediaImage(entry.word ?? word, lang) : undefined
  if (shouldFetchImage && !image?.imageUrl) {
    image = await fetchWikimediaSearchImage(imageHint(entry.word ?? word, meanings), lang)
  }

  return {
    word: entry.word,
    phonetics: entry.phonetics ?? [],
    meanings,
    quickMeaning,
    imageUrl: image?.imageUrl,
    imageSource: image?.imageSource,
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
    definitions: (def.definitions ?? []).slice(0, 3).map((d: { definition: string; example?: string }) => ({
      definition: simplifyText(d.definition?.replace(/<[^>]+>/g, '') ?? ''),
      example: d.example ? simplifyText(d.example.replace(/<[^>]+>/g, '')) : undefined,
      synonyms: [],
      antonyms: [],
    })),
    synonyms: [],
    antonyms: [],
  }))

  const quickMeaning = meanings[0]?.definitions?.[0]?.definition
  const shouldFetchImage = meanings.some(
    (meaning) =>
      isLikelyNoun(meaning.partOfSpeech ?? '') || isLikelyAdjective(meaning.partOfSpeech ?? '')
  )
  let image = shouldFetchImage ? await fetchWikipediaImage(word, 'de') : undefined
  if (shouldFetchImage && !image?.imageUrl) {
    image = await fetchWikimediaSearchImage(imageHint(word, meanings), 'de')
  }

  return {
    word,
    phonetics: [],
    meanings,
    quickMeaning,
    imageUrl: image?.imageUrl,
    imageSource: image?.imageSource,
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
