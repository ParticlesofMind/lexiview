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

function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer()
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result)
        return
      }
      reject(new TypeError('Failed to read blob as ArrayBuffer'))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}

function splitIntoWordTokens(text: string): string[] {
  return text.match(/\S+/g) ?? []
}

let textMeasureCanvas: HTMLCanvasElement | null = null

function getTextMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null
  if (!textMeasureCanvas) {
    textMeasureCanvas = document.createElement('canvas')
  }
  return textMeasureCanvas.getContext('2d')
}

function getMeasuredSegmentWidths(
  segments: string[],
  totalWidth: number,
  fontSize: number,
  fontFamily?: string
): number[] {
  if (!segments.length || totalWidth <= 0) return []

  const ctx = getTextMeasureContext()
  if (!ctx) {
    const fullLength = segments.join('').length || 1
    return segments.map((segment) => (segment.length / fullLength) * totalWidth)
  }

  ctx.font = `${Math.max(fontSize, 1)}px ${fontFamily ?? 'serif'}`
  const measured = segments.map((segment) => ctx.measureText(segment).width)
  const measuredTotal = measured.reduce((sum, width) => sum + width, 0)

  if (!measuredTotal) {
    const fullLength = segments.join('').length || 1
    return segments.map((segment) => (segment.length / fullLength) * totalWidth)
  }

  return measured.map((width) => (width / measuredTotal) * totalWidth)
}

export function usePdfTextLayer() {
  const [pages, setPages] = useState<PageData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const loadPdf = useCallback(async (file: File) => {
    setIsProcessing(true)
    setPages([])

    try {
      const arrayBuffer = await readBlobAsArrayBuffer(file)
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const pageResults: PageData[] = []

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const scale = 1.5
        const viewport = page.getViewport({ scale })
        const textContent = await page.getTextContent()
        const contentStyles = textContent.styles as Record<string, { fontFamily?: string }>

        const tokens: TextToken[] = []

        for (const item of textContent.items) {
          if (!('str' in item) || !item.str) continue

          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform)
          const x = tx[4]
          const y = tx[5]
          const width = Math.max(item.width * scale, 0)
          const height = Math.max(Math.hypot(tx[2], tx[3]), 0)
          const itemText = item.str
          const wordParts = splitIntoWordTokens(itemText)

          if (wordParts.length <= 1 || width === 0) {
            tokens.push({
              text: itemText,
              x,
              y: y - height,
              width,
              height,
              pageIndex: i - 1,
            })
            continue
          }

          const segments = itemText.match(/\S+|\s+/g) ?? [itemText]
          const fontName = 'fontName' in item ? item.fontName : undefined
          const fontFamily = fontName ? contentStyles?.[fontName]?.fontFamily : undefined
          const segmentWidths = getMeasuredSegmentWidths(segments, width, height, fontFamily)
          let cursorX = x

          for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
            const part = segments[segmentIndex]
            const partWidth = segmentWidths[segmentIndex] ?? 0

            if (/\S/.test(part)) {
              tokens.push({
                text: part,
                x: cursorX,
                y: y - height,
                width: partWidth,
                height,
                pageIndex: i - 1,
              })
            }

            cursorX += partWidth
          }
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
