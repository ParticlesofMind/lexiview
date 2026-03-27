import { useAppStore } from '../store/useAppStore'
import { WordEntry } from './WordEntry'

export function DictionaryPanel() {
  const { selectedWord, dictionaryEntry, isLoading } = useAppStore()

  if (!selectedWord) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#f5f5f0] dark:bg-[#0f0f0f] px-8">
        <p className="text-[10px] font-mono uppercase tracking-widest opacity-30 dark:text-[#f5f5f0] text-center">
          Double-click or select a word<br />to look it up
        </p>
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
          <WordEntry entry={dictionaryEntry} />
        )}
      </div>
    </div>
  )
}
