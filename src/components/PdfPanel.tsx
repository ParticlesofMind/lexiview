import { useRef, useState, useCallback, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { usePdfTextLayer } from '../hooks/usePdfTextLayer'
import { useDictionaryLookup } from '../hooks/useDictionaryLookup'
import {
  clearPersistedPdf,
  loadPersistedPdf,
  savePersistedPdf,
} from '../lib/pdfStorage'

function normalizeWord(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9äöüß'-]/gi, '').trim()
}

function tokenContainsWord(tokenText: string, word: string | null): boolean {
  if (!word) return false
  return tokenText
    .split(/\s+/)
    .map((part) => normalizeWord(part))
    .some((part) => part === word)
}

function isLikelyPdf(file: File): boolean {
  const normalizedType = file.type.toLowerCase()
  if (normalizedType === 'application/pdf') return true
  return file.name.toLowerCase().endsWith('.pdf')
}

export function PdfPanel() {
  const { pdfFile, setPdfFile, selectedWord, setSelectedWord, settings } = useAppStore()
  const { pages, isProcessing, loadPdf } = usePdfTextLayer()
  const { lookup } = useDictionaryLookup()
  const dropRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [activeWord, setActiveWord] = useState<string | null>(null)
  const [isRestoringPdf, setIsRestoringPdf] = useState(false)

  const resolveAndLookupWord = useCallback(
    (raw: string) => {
      const candidate = raw.trim().split(/\s+/)[0] ?? ''
      const normalized = normalizeWord(candidate)
      if (!normalized) return
      setActiveWord(normalized)
      setSelectedWord(normalized)
      lookup(normalized)
    },
    [setSelectedWord, lookup]
  )

  const handleFile = useCallback(
    async (file: File) => {
      if (!isLikelyPdf(file)) return

      setPdfFile(file)
      try {
        await savePersistedPdf(file)
      } catch {
        // Continue without persistence if IndexedDB storage fails.
      }

      try {
        await loadPdf(file)
      } catch {
        // Prevent unhandled rejections from surfacing browser-level errors.
        setPdfFile(null)
      }
    },
    [setPdfFile, loadPdf]
  )

  const clearPdf = useCallback(async () => {
    setPdfFile(null)
    await clearPersistedPdf()
  }, [setPdfFile])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) void handleFile(file)
    },
    [handleFile]
  )

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) void handleFile(file)
    },
    [handleFile]
  )

  const handleWordClick = useCallback(
    (tokenText: string) => {
      resolveAndLookupWord(tokenText)
      window.getSelection()?.removeAllRanges()
    },
    [resolveAndLookupWord]
  )

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    resolveAndLookupWord(selection.toString())
  }, [resolveAndLookupWord])

  useEffect(() => {
    setActiveWord(selectedWord)
  }, [selectedWord])

  useEffect(() => {
    if (pdfFile) return

    let mounted = true

    const restorePdf = async () => {
      setIsRestoringPdf(true)
      try {
        const restored = await loadPersistedPdf()
        if (!mounted || !restored) return
        setPdfFile(restored)
        await loadPdf(restored)
      } catch {
        // If IndexedDB is unavailable, the app still works with manual uploads.
      } finally {
        if (mounted) setIsRestoringPdf(false)
      }
    }

    void restorePdf()

    return () => {
      mounted = false
    }
  }, [pdfFile, setPdfFile, loadPdf])

  if (!pdfFile) {
    return (
      <div
        ref={dropRef}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center h-full border-r border-[#0f0f0f] dark:border-[#2a2a2a] transition-colors cursor-pointer
          ${isDragging ? 'bg-[#2563eb]/10' : 'bg-[#f5f5f0] dark:bg-[#0f0f0f]'}`}
      >
        <label className="flex flex-col items-center gap-4 cursor-pointer group">
          <div className={`w-20 h-20 border-2 flex items-center justify-center transition-colors
            ${isDragging
              ? 'border-[#2563eb] text-[#2563eb]'
              : 'border-[#0f0f0f] dark:border-[#f5f5f0] text-[#0f0f0f] dark:text-[#f5f5f0] group-hover:border-[#2563eb] group-hover:text-[#2563eb]'
            }`}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="font-mono text-sm uppercase tracking-widest dark:text-[#f5f5f0]">Drop PDF here</p>
            <p className="text-xs opacity-50 mt-1 dark:text-[#f5f5f0]">or click to browse</p>
            {isRestoringPdf && (
              <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 mt-2 dark:text-[#f5f5f0]">
                Restoring last PDF...
              </p>
            )}
          </div>
          <input type="file" accept=".pdf" className="hidden" onChange={onFileInput} />
        </label>
      </div>
    )
  }

  return (
    <div
      className="flex-1 overflow-y-auto border-r border-[#0f0f0f] dark:border-[#2a2a2a] bg-[radial-gradient(circle_at_top,_rgba(15,15,15,0.06),_rgba(245,245,240,0)_38%),linear-gradient(180deg,_#f7f6f1_0%,_#ece9df_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(245,245,240,0.08),_rgba(15,15,15,0)_40%),linear-gradient(180deg,_#111_0%,_#090909_100%)]"
      onMouseUp={handleMouseUp}
    >
      <div className="sticky top-0 z-20 flex justify-end px-3 py-2 bg-[#f5f5f0]/95 dark:bg-[#0f0f0f]/95 border-b border-[#0f0f0f]/10 dark:border-[#f5f5f0]/10 backdrop-blur-sm">
        <button
          onClick={() => void clearPdf()}
          className="text-[10px] font-mono uppercase tracking-widest border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 px-2 py-1 text-[#0f0f0f] dark:text-[#f5f5f0] hover:border-[#2563eb] hover:text-[#2563eb] transition-colors"
        >
          Clear PDF
        </button>
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center h-full">
          <p className="font-mono text-xs uppercase tracking-widest opacity-50 dark:text-[#f5f5f0] animate-pulse">
            Parsing PDF…
          </p>
        </div>
      )}

      {pages.map((page, pageIdx) => (
        <div
          key={pageIdx}
          className="relative mx-auto my-6 bg-white dark:bg-[#101010] border border-[#0f0f0f]/15 dark:border-[#f5f5f0]/15 rounded-[2px] shadow-[0_12px_28px_rgba(15,15,15,0.14),0_1px_0_rgba(15,15,15,0.2)] dark:shadow-[0_14px_30px_rgba(0,0,0,0.55),0_1px_0_rgba(255,255,255,0.08)]"
          style={{ width: page.viewport.width * settings.pdfZoom, height: page.viewport.height * settings.pdfZoom }}
        >
          {/* Page number */}
          <div className="absolute -top-5 left-0 text-[10px] font-mono opacity-30 dark:text-[#f5f5f0]">
            {pageIdx + 1}
          </div>

          {page.tokens.map((token, tokenIdx) => (
            <span
              key={tokenIdx}
              onDoubleClick={() => handleWordClick(token.text)}
              style={{
                position: 'absolute',
                left: token.x * settings.pdfZoom,
                top: token.y * settings.pdfZoom,
                width: token.width * settings.pdfZoom,
                height: token.height * settings.pdfZoom,
                fontSize: token.height * 0.88 * settings.pdfZoom,
                lineHeight: settings.lineHeight,
                cursor: 'pointer',
                userSelect: 'text',
                whiteSpace: 'pre',
                wordSpacing: '0px',
                fontKerning: 'normal',
                textRendering: 'optimizeLegibility',
                color: settings.theme === 'dark' ? '#f5f5f0' : '#0f0f0f',
                opacity: settings.pdfTextOpacity,
                letterSpacing: `calc(var(--reader-letter-spacing, 0px) * ${settings.pdfZoom})`,
                fontFamily: 'var(--reader-font-family, serif)',
                backgroundColor:
                  tokenContainsWord(token.text, activeWord)
                    ? 'rgba(37,99,235,0.15)'
                    : 'transparent',
                borderBottom:
                  tokenContainsWord(token.text, activeWord)
                    ? '1px solid #2563eb'
                    : 'none',
              }}
            >
              {token.text}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}
