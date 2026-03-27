import { useAppStore } from '../store/useAppStore'
import { getUiCopy } from '../lib/i18n'

export function WordBankView() {
  const { selectedLanguage, savedWords, removeSavedWord, setSelectedWord, setDictionaryEntry, setActiveView } = useAppStore()
  const copy = getUiCopy(selectedLanguage)

  return (
    <section className="flex-1 overflow-y-auto bg-[#f5f5f0] dark:bg-[#0f0f0f] px-5 py-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-[#0f0f0f] dark:text-[#f5f5f0] mb-1">{copy.wordBank}</h1>
        <p className="text-xs font-mono uppercase tracking-widest opacity-45 dark:text-[#f5f5f0] mb-5">
          {copy.savedWords}: {savedWords.length}
        </p>

        {savedWords.length === 0 && (
          <div className="border border-dashed border-[#0f0f0f]/25 dark:border-[#f5f5f0]/25 p-6 text-sm opacity-65 dark:text-[#f5f5f0]">
            {copy.wordBankEmpty}
          </div>
        )}

        {savedWords.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedWords.map((saved) => (
              <article
                key={`${saved.language}:${saved.word}`}
                className="border border-[#0f0f0f]/15 dark:border-[#f5f5f0]/20 p-3 bg-[#f8f7f1] dark:bg-[#111]"
              >
                <button
                  onClick={() => {
                    setSelectedWord(saved.word)
                    setDictionaryEntry(saved.entry)
                    setActiveView('reader')
                  }}
                  className="text-left w-full"
                >
                  <h2 className="text-lg text-[#0f0f0f] dark:text-[#f5f5f0] font-semibold">{saved.word}</h2>
                  <p className="text-[10px] mt-1 font-mono uppercase tracking-widest opacity-50 dark:text-[#f5f5f0]">
                    {saved.language}
                  </p>
                  {saved.entry.quickMeaning && (
                    <p className="mt-2 text-sm text-[#0f0f0f]/75 dark:text-[#f5f5f0]/75 line-clamp-3">
                      {saved.entry.quickMeaning}
                    </p>
                  )}
                </button>

                <button
                  onClick={() => removeSavedWord(saved.word, saved.language)}
                  className="mt-3 text-[10px] font-mono uppercase tracking-widest text-[#0f0f0f]/60 dark:text-[#f5f5f0]/60 hover:text-[#2563eb] transition-colors"
                >
                  {copy.remove}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
