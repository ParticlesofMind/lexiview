import { useState } from 'react'
import type { DictionaryEntry } from '../types/dictionary'
import { useAppStore } from '../store/useAppStore'
import { getUiCopy } from '../lib/i18n'

interface Props {
  entry: DictionaryEntry
}

export function WordEntry({ entry }: Props) {
  const [etymologyOpen, setEtymologyOpen] = useState(false)
  const { selectedLanguage } = useAppStore()
  const copy = getUiCopy(selectedLanguage)

  const phonetic = entry.phonetics.find((p) => p.text)?.text
  const audioUrl = entry.phonetics.find((p) => p.audio)?.audio

  const simplified = (text: string) => {
    const clean = text.replace(/\s+/g, ' ').trim()
    const sentence = clean.split(/[.;:]/)[0] ?? clean
    return sentence.length > 140 ? `${sentence.slice(0, 137)}...` : sentence
  }

  const playPronunciation = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      void audio.play()
      return
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(entry.word)
      utterance.lang = entry.language === 'de' ? 'de-DE' : entry.language === 'fr' ? 'fr-FR' : 'en-US'
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="font-[var(--reader-font-family,serif)]">
      {/* Headword + badge */}
      <div className="flex items-baseline gap-3 mb-2">
        <h1
          className="text-3xl font-bold text-[#0f0f0f] dark:text-[#f5f5f0]"
          style={{ fontFamily: 'var(--reader-font-family, serif)' }}
        >
          {entry.word}
        </h1>
        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border border-[#2563eb] text-[#2563eb]">
          {entry.language.toUpperCase()}
        </span>
      </div>

      {/* Phonetics */}
      {(phonetic || audioUrl) && (
        <div className="mb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest opacity-50 dark:text-[#f5f5f0] mb-1">
            {copy.pronunciation}
          </p>
          <div className="flex items-center gap-2">
            {phonetic && <p className="text-sm text-[#0f0f0f]/60 dark:text-[#f5f5f0]/60 font-mono">{phonetic}</p>}
            <button
              onClick={playPronunciation}
              className="text-[10px] font-mono uppercase tracking-widest border border-[#0f0f0f]/25 dark:border-[#f5f5f0]/25 px-2 py-1 text-[#0f0f0f] dark:text-[#f5f5f0] hover:border-[#2563eb] hover:text-[#2563eb] transition-colors"
            >
              {copy.playAudio}
            </button>
          </div>
        </div>
      )}

      {entry.quickMeaning && (
        <div className="mb-4 border border-[#0f0f0f]/15 dark:border-[#f5f5f0]/20 p-3 bg-[#f8f7f2] dark:bg-[#111]">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#2563eb] mb-1">
            {copy.quickMeaning}
          </p>
          <p className="text-sm leading-relaxed text-[#0f0f0f]/80 dark:text-[#f5f5f0]/80">
            {entry.quickMeaning}
          </p>
        </div>
      )}

      {entry.imageUrl && (
        <figure className="mb-5 border border-[#0f0f0f]/12 dark:border-[#f5f5f0]/18 bg-[#f8f7f1] dark:bg-[#101010] p-2">
          <img src={entry.imageUrl} alt={`${copy.imageForWord}: ${entry.word}`} className="w-full h-48 object-cover" loading="lazy" />
          {entry.imageSource && (
            <figcaption className="mt-1 text-[10px] font-mono uppercase tracking-widest opacity-45 dark:text-[#f5f5f0]">
              {copy.imageForWord}: {entry.imageSource}
            </figcaption>
          )}
        </figure>
      )}

      {/* Genus / Plural (German) */}
      {entry.genus && (
        <p className="text-xs font-mono mb-3 opacity-60 dark:text-[#f5f5f0]">
          {entry.genus}{entry.plural ? ` · Pl: ${entry.plural}` : ''}
        </p>
      )}

      {/* Meanings */}
      {entry.meanings.slice(0, 2).map((meaning, mi) => (
        <div key={mi} className="mb-5">
          <p className="text-xs font-mono uppercase tracking-widest text-[#2563eb] mb-2">
            {meaning.partOfSpeech}
          </p>

          <ol className="space-y-3">
            {meaning.definitions.slice(0, 2).map((def, di) => (
              <li key={di} className="flex gap-2">
                <span className="text-xs font-mono opacity-40 mt-0.5 shrink-0 dark:text-[#f5f5f0]">
                  {di + 1}.
                </span>
                <div>
                  <p
                    className="text-sm leading-relaxed text-[#0f0f0f] dark:text-[#f5f5f0]"
                    style={{
                      fontSize: 'var(--reader-font-size, 16px)',
                      lineHeight: 'var(--reader-line-height, 1.6)',
                      letterSpacing: 'var(--reader-letter-spacing, 0px)',
                    }}
                  >
                    {simplified(def.definition)}
                  </p>
                  {def.example && (
                    <p className="text-sm italic opacity-50 mt-1 dark:text-[#f5f5f0]">
                      "{simplified(def.example)}"
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {/* Synonyms */}
          {meaning.synonyms.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              <span className="text-[10px] font-mono uppercase opacity-40 mr-1 dark:text-[#f5f5f0]">syn</span>
              {meaning.synonyms.slice(0, 8).map((s) => (
                <span
                  key={s}
                  className="text-[10px] px-1.5 py-0.5 border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 text-[#0f0f0f] dark:text-[#f5f5f0] font-mono"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {meaning.antonyms.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="text-[10px] font-mono uppercase opacity-40 mr-1 dark:text-[#f5f5f0]">ant</span>
              {meaning.antonyms.slice(0, 8).map((s) => (
                <span
                  key={s}
                  className="text-[10px] px-1.5 py-0.5 border border-[#0f0f0f]/20 dark:border-[#f5f5f0]/20 opacity-60 dark:text-[#f5f5f0] font-mono"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Etymology */}
      {entry.etymology && (
        <div className="border-t border-[#0f0f0f]/10 dark:border-[#f5f5f0]/10 pt-3 mt-2">
          <button
            onClick={() => setEtymologyOpen((v) => !v)}
            className="text-[10px] font-mono uppercase tracking-widest opacity-50 hover:opacity-100 dark:text-[#f5f5f0] transition-opacity"
          >
            {etymologyOpen ? '▲' : '▼'} {copy.etymology}
          </button>
          {etymologyOpen && (
            <p className="mt-2 text-xs leading-relaxed opacity-60 dark:text-[#f5f5f0]">
              {entry.etymology}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
