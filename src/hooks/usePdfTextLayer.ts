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

    try {
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
          if (!('str' in item) || !item.str) continue

          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform)
          const x = tx[4]
          const y = tx[5]
          const width = Math.max(item.width * scale, 0)
          const height = Math.max(Math.hypot(tx[2], tx[3]), 0)

          tokens.push({
            text: item.str,
            x,
            y: y - height,
            width,
            height,
            pageIndex: i - 1,
          })
        }

        pageResults.push({
          tokens,
          viewport: { width: viewport.width, height: viewport.height },
        })
      }

      setPages(pageResults)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  return { pages, isProcessing, loadPdf }
}
