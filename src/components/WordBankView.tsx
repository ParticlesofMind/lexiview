import { useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { getUiCopy } from '../lib/i18n'

type BankMode = 'practice' | 'test'

function firstDefinitions(defs: string[]) {
  return defs.slice(0, 3)
}

function cardDefinitions(saved: { entry: { meanings: { definitions: { definition: string }[] }[] } }) {
  return firstDefinitions(
    saved.entry.meanings
      .flatMap((meaning) => meaning.definitions.map((d) => d.definition))
      .filter(Boolean)
  )
}

function primaryWordType(saved: { entry: { meanings: { partOfSpeech: string }[] } }) {
  return saved.entry.meanings.find((meaning) => meaning.partOfSpeech)?.partOfSpeech ?? '-'
}

export function WordBankView() {
  const {
    selectedLanguage,
    savedWords,
    removeSavedWord,
    setSelectedWord,
    setDictionaryEntry,
    setActiveView,
  } = useAppStore()
  const copy = getUiCopy(selectedLanguage)
  const [mode, setMode] = useState<BankMode>('practice')
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({})
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, 'correct' | 'wrong'>>({})

  const groupedSets = useMemo(() => {
    return savedWords.reduce<Record<string, typeof savedWords>>((acc, saved) => {
      const source = saved.sourceTitle || copy.generalSet
      if (!acc[source]) acc[source] = []
      acc[source].push(saved)
      return acc
    }, {})
  }, [savedWords, copy.generalSet])

  const setEntries = Object.entries(groupedSets)

  return (
    <section className="flex-1 overflow-y-auto bg-[#f5f5f0] dark:bg-[#0f0f0f] px-5 py-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-[#0f0f0f] dark:text-[#f5f5f0] mb-1">{copy.wordBank}</h1>
        <p className="text-xs font-mono uppercase tracking-widest opacity-45 dark:text-[#f5f5f0] mb-5">
          {copy.savedWords}: {savedWords.length}
        </p>

        <div className="mb-5 flex items-center gap-2">
          <button
            onClick={() => setMode('practice')}
            className={`px-3 py-2 text-xs font-mono uppercase tracking-widest border transition-colors ${
              mode === 'practice'
                ? 'border-[#2563eb] bg-[#2563eb] text-white'
                : 'border-[#0f0f0f]/25 dark:border-[#f5f5f0]/25 text-[#0f0f0f] dark:text-[#f5f5f0] hover:border-[#2563eb] hover:text-[#2563eb]'
            }`}
          >
            {copy.practice}
          </button>
          <button
            onClick={() => setMode('test')}
            className={`px-3 py-2 text-xs font-mono uppercase tracking-widest border transition-colors ${
              mode === 'test'
                ? 'border-[#2563eb] bg-[#2563eb] text-white'
                : 'border-[#0f0f0f]/25 dark:border-[#f5f5f0]/25 text-[#0f0f0f] dark:text-[#f5f5f0] hover:border-[#2563eb] hover:text-[#2563eb]'
            }`}
          >
            {copy.test}
          </button>
          <span className="ml-auto text-[10px] font-mono uppercase tracking-widest opacity-45 dark:text-[#f5f5f0]">
            {copy.setsBySource}
          </span>
        </div>

        {savedWords.length === 0 && (
          <div className="border border-dashed border-[#0f0f0f]/25 dark:border-[#f5f5f0]/25 p-6 text-sm opacity-65 dark:text-[#f5f5f0]">
            {copy.wordBankEmpty}
          </div>
        )}

        {savedWords.length > 0 && (
          <div className="space-y-6">
            {setEntries.map(([sourceTitle, words]) => (
              <section key={sourceTitle} className="border border-[#0f0f0f]/15 dark:border-[#f5f5f0]/18 p-4 bg-[#f8f7f1] dark:bg-[#111]">
                <h2 className="text-lg font-semibold text-[#0f0f0f] dark:text-[#f5f5f0]">{sourceTitle}</h2>
                <p className="text-[10px] mt-1 mb-4 font-mono uppercase tracking-widest opacity-45 dark:text-[#f5f5f0]">
                  {copy.savedWords}: {words.length}
                </p>

                {mode === 'practice' && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {words.map((saved) => {
                      const cardKey = `${saved.sourceTitle}:${saved.language}:${saved.word}`
                      const flipped = flippedCards[cardKey] ?? false
                      const definitions = cardDefinitions(saved)

                      return (
                        <article
                          key={cardKey}
                          onClick={() =>
                            setFlippedCards((state) => ({
                              ...state,
                              [cardKey]: !flipped,
                            }))
                          }
                          className="cursor-pointer min-h-[190px] border border-[#0f0f0f]/20 dark:border-[#f5f5f0]/22 bg-[#f5f5f0] dark:bg-[#0f0f0f] p-3 transition-colors hover:border-[#2563eb]"
                        >
                          {!flipped && (
                            <div className="h-full flex flex-col justify-between">
                              <div>
                                <h3 className="text-2xl font-semibold text-[#0f0f0f] dark:text-[#f5f5f0]">{saved.word}</h3>
                                <p className="text-[10px] mt-1 font-mono uppercase tracking-widest opacity-50 dark:text-[#f5f5f0]">
                                  {saved.language}
                                </p>
                                {saved.entry.quickMeaning && (
                                  <p className="mt-3 text-sm leading-relaxed text-[#0f0f0f]/75 dark:text-[#f5f5f0]/75">
                                    {saved.entry.quickMeaning}
                                  </p>
                                )}
                              </div>

                              <p className="text-[10px] font-mono uppercase tracking-widest opacity-45 dark:text-[#f5f5f0]">
                                {copy.tapToFlip}
                              </p>
                            </div>
                          )}

                          {flipped && (
                            <div className="flex gap-3">
                              <div className="w-24 h-24 shrink-0 border border-[#0f0f0f]/15 dark:border-[#f5f5f0]/20 bg-[#ece9df] dark:bg-[#151515] overflow-hidden">
                                {saved.entry.imageUrl ? (
                                  <img
                                    src={saved.entry.imageUrl}
                                    alt={`${copy.imageForWord}: ${saved.word}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] font-mono uppercase opacity-40 dark:text-[#f5f5f0]">
                                    {copy.imageForWord}
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="text-[10px] font-mono uppercase tracking-widest text-[#2563eb] mb-1">
                                  {copy.wordType}
                                </p>
                                <p className="text-sm text-[#0f0f0f] dark:text-[#f5f5f0] mb-2">{primaryWordType(saved)}</p>

                                <p className="text-[10px] font-mono uppercase tracking-widest text-[#2563eb] mb-1">
                                  {copy.primaryDefinitions}
                                </p>
                                <ol className="space-y-1">
                                  {definitions.map((definition, idx) => (
                                    <li key={`${cardKey}:def:${idx}`} className="text-sm leading-snug text-[#0f0f0f]/80 dark:text-[#f5f5f0]/80">
                                      {idx + 1}. {definition}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            </div>
                          )}
                        </article>
                      )
                    })}
                  </div>
                )}

                {mode === 'test' && (
                  <div className="space-y-3">
                    <p className="text-sm text-[#0f0f0f]/70 dark:text-[#f5f5f0]/70">{copy.testInstruction}</p>

                    {words.map((saved) => {
                      const testKey = `${saved.sourceTitle}:${saved.language}:${saved.word}`
                      const clue = saved.entry.quickMeaning || cardDefinitions(saved)[0] || '-'
                      const result = results[testKey]

                      return (
                        <article key={testKey} className="border border-[#0f0f0f]/15 dark:border-[#f5f5f0]/18 p-3 bg-[#f5f5f0] dark:bg-[#0f0f0f]">
                          <p className="text-sm leading-relaxed text-[#0f0f0f]/80 dark:text-[#f5f5f0]/80">{clue}</p>

                          <div className="mt-2 flex flex-col sm:flex-row gap-2">
                            <input
                              value={answers[testKey] ?? ''}
                              onChange={(e) =>
                                setAnswers((state) => ({
                                  ...state,
                                  [testKey]: e.target.value,
                                }))
                              }
                              placeholder={copy.yourAnswer}
                              className="flex-1 border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-1.5 text-sm text-[#0f0f0f] dark:text-[#f5f5f0]"
                            />
                            <button
                              onClick={() => {
                                const guess = (answers[testKey] ?? '').trim().toLowerCase()
                                const target = saved.word.trim().toLowerCase()
                                setResults((state) => ({
                                  ...state,
                                  [testKey]: guess === target ? 'correct' : 'wrong',
                                }))
                              }}
                              className="px-3 py-1.5 text-xs font-mono uppercase tracking-widest border border-[#2563eb] text-[#2563eb] hover:bg-[#2563eb] hover:text-white transition-colors"
                            >
                              {copy.check}
                            </button>
                            <button
                              onClick={() =>
                                setAnswers((state) => ({
                                  ...state,
                                  [testKey]: saved.word,
                                }))
                              }
                              className="px-3 py-1.5 text-xs font-mono uppercase tracking-widest border border-[#0f0f0f]/25 dark:border-[#f5f5f0]/25 text-[#0f0f0f] dark:text-[#f5f5f0] hover:border-[#2563eb] hover:text-[#2563eb] transition-colors"
                            >
                              {copy.reveal}
                            </button>
                          </div>

                          {result && (
                            <p className={`mt-2 text-xs font-mono uppercase tracking-widest ${result === 'correct' ? 'text-[#2563eb]' : 'text-[#b45309] dark:text-[#fbbf24]'}`}>
                              {result === 'correct' ? copy.correct : copy.tryAgain}
                            </p>
                          )}

                          <div className="mt-3 flex items-center justify-between">
                            <button
                              onClick={() => {
                                setSelectedWord(saved.word)
                                setDictionaryEntry(saved.entry)
                                setActiveView('reader')
                              }}
                              className="text-[10px] font-mono uppercase tracking-widest text-[#0f0f0f]/65 dark:text-[#f5f5f0]/65 hover:text-[#2563eb] transition-colors"
                            >
                              {saved.word}
                            </button>

                            <button
                              onClick={() => removeSavedWord(saved.word, saved.language)}
                              className="text-[10px] font-mono uppercase tracking-widest text-[#0f0f0f]/60 dark:text-[#f5f5f0]/60 hover:text-[#2563eb] transition-colors"
                            >
                              {copy.remove}
                            </button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
