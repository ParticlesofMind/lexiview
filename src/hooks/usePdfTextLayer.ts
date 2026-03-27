import { useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export interface TextToken {
  text: string
  x: number
  y: number
  width: number
  height: number
  pageIndex: number
}

export interface PageData {
  tokens: TextToken[]
  viewport: { width: number; height: number }
}

export function usePdfTextLayer() {
  const [pages, setPages] = useState<PageData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const loadPdf = useCallback(async (file: File) => {
    setIsProcessing(true)
    setPages([])

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const pageResults: PageData[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const scale = 1.5
      const viewport = page.getViewport({ scale })
      const textContent = await page.getTextContent()

      const tokens: TextToken[] = []

      for (const item of textContent.items) {
        if (!('str' in item) || !item.str.trim()) continue

        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform)
        const x = tx[4]
        const y = tx[5]
        const height = Math.abs(item.transform[3]) * scale
        const width = item.width * scale

        // Split into word tokens
        const words = item.str.split(/(\s+)/)
        let currentX = x
        const charWidth = width / (item.str.length || 1)

        for (const word of words) {
          if (!word.trim()) {
            currentX += word.length * charWidth
            continue
          }
          tokens.push({
            text: word,
            x: currentX,
            y: y - height,
            width: word.length * charWidth,
            height,
            pageIndex: i - 1,
          })
          currentX += word.length * charWidth
        }
      }

      pageResults.push({
        tokens,
        viewport: { width: viewport.width, height: viewport.height },
      })
    }

    setPages(pageResults)
    setIsProcessing(false)
  }, [])

  return { pages, isProcessing, loadPdf }
}
