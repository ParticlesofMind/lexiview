import { useAppStore } from '../store/useAppStore'
import { WordEntry } from './WordEntry'

export function DictionaryPanel() {
  const {
    selectedWord,
    dictionaryEntry,
    isLoading,
    savedWords,
    saveWord,
    removeSavedWord,
    setSelectedWord,
    setDictionaryEntry,
  } = useAppStore()

  if (!selectedWord) {
    return (
      <div className="flex flex-col h-full bg-[#f5f5f0] dark:bg-[#0f0f0f] px-6 py-5 overflow-y-auto">
        <p className="text-[10px] font-mono uppercase tracking-widest opacity-30 dark:text-[#f5f5f0] text-center mb-6">
          Double-click or select a word<br />to look it up
        </p>

        {savedWords.length > 0 && (
          <div className="mt-auto">
            <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 dark:text-[#f5f5f0] mb-2">
              Saved words ({savedWords.length})
            </p>
            <div className="space-y-1">
              {savedWords.map((saved) => (
                <div
                  key={`${saved.language}:${saved.word}`}
                  className="flex items-center justify-between gap-2 border border-[#0f0f0f]/15 dark:border-[#f5f5f0]/20 px-2 py-1"
                >
                  <button
                    onClick={() => {
                      setSelectedWord(saved.word)
                      setDictionaryEntry(saved.entry)
                    }}
                    className="text-left text-sm text-[#0f0f0f] dark:text-[#f5f5f0] hover:text-[#2563eb] transition-colors"
                  >
                    {saved.word}
                    <span className="ml-2 text-[10px] font-mono uppercase opacity-50">{saved.language}</span>
                  </button>
                  <button
                    onClick={() => removeSavedWord(saved.word, saved.language)}
                    className="text-[10px] font-mono uppercase opacity-50 hover:opacity-100 dark:text-[#f5f5f0]"
                  >
                    remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#f5f5f0] dark:bg-[#0f0f0f] overflow-y-auto">
      <div className="px-6 py-5">
        {isLoading && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-[#2563eb] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-50 dark:text-[#f5f5f0]">
              Looking up "{selectedWord}"…
            </span>
          </div>
        )}

        {!isLoading && !dictionaryEntry && (
          <div>
            <p className="text-lg font-bold text-[#0f0f0f] dark:text-[#f5f5f0] mb-2">{selectedWord}</p>
            <p className="text-xs opacity-40 font-mono dark:text-[#f5f5f0]">No entry found.</p>
          </div>
        )}

        {!isLoading && dictionaryEntry && (
          <>
            <div className="flex items-center justify-end mb-3">
              <button
                onClick={() => saveWord(dictionaryEntry)}
                className="text-[10px] font-mono uppercase tracking-widest border border-[#2563eb] text-[#2563eb] px-2 py-1 hover:bg-[#2563eb] hover:text-white transition-colors"
              >
                Save word
              </button>
            </div>
            <WordEntry entry={dictionaryEntry} />
          </>
        )}

        {savedWords.length > 0 && (
          <div className="mt-8 border-t border-[#0f0f0f]/10 dark:border-[#f5f5f0]/10 pt-4">
            <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 dark:text-[#f5f5f0] mb-2">
              Saved words ({savedWords.length})
            </p>
            <div className="space-y-1">
              {savedWords.map((saved) => (
                <div
                  key={`${saved.language}:${saved.word}`}
                  className="flex items-center justify-between gap-2 border border-[#0f0f0f]/15 dark:border-[#f5f5f0]/20 px-2 py-1"
                >
                  <button
                    onClick={() => {
                      setSelectedWord(saved.word)
                      setDictionaryEntry(saved.entry)
                    }}
                    className="text-left text-sm text-[#0f0f0f] dark:text-[#f5f5f0] hover:text-[#2563eb] transition-colors"
                  >
                    {saved.word}
                    <span className="ml-2 text-[10px] font-mono uppercase opacity-50">{saved.language}</span>
                  </button>
                  <button
                    onClick={() => removeSavedWord(saved.word, saved.language)}
                    className="text-[10px] font-mono uppercase opacity-50 hover:opacity-100 dark:text-[#f5f5f0]"
                  >
                    remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
