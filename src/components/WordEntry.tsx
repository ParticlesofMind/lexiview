import { useState } from 'react'
import type { DictionaryEntry } from '../types/dictionary'

interface Props {
  entry: DictionaryEntry
}

export function WordEntry({ entry }: Props) {
  const [etymologyOpen, setEtymologyOpen] = useState(false)

  const phonetic = entry.phonetics.find((p) => p.text)?.text

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
      {phonetic && (
        <p className="text-sm text-[#0f0f0f]/60 dark:text-[#f5f5f0]/60 mb-4 font-mono">{phonetic}</p>
      )}

      {/* Genus / Plural (German) */}
      {entry.genus && (
        <p className="text-xs font-mono mb-3 opacity-60 dark:text-[#f5f5f0]">
          {entry.genus}{entry.plural ? ` · Pl: ${entry.plural}` : ''}
        </p>
      )}

      {/* Meanings */}
      {entry.meanings.map((meaning, mi) => (
        <div key={mi} className="mb-5">
          <p className="text-xs font-mono uppercase tracking-widest text-[#2563eb] mb-2">
            {meaning.partOfSpeech}
          </p>

          <ol className="space-y-3">
            {meaning.definitions.map((def, di) => (
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
                    {def.definition}
                  </p>
                  {def.example && (
                    <p className="text-sm italic opacity-50 mt-1 dark:text-[#f5f5f0]">
                      "{def.example}"
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
            {etymologyOpen ? '▲' : '▼'} Etymology
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
