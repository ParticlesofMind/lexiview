import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { getUiCopy, levelLabel } from '../lib/i18n'

const AUTO_SLIDE_MS = 5000

export function DashboardView() {
  const { selectedLanguage, currentUser, setActiveView } = useAppStore()
  const copy = getUiCopy(selectedLanguage)
  const [slideIndex, setSlideIndex] = useState(0)

  const slides = [
    {
      title: copy.slideReaderTitle,
      body: copy.slideReaderBody,
    },
    {
      title: copy.slideDictionaryTitle,
      body: copy.slideDictionaryBody,
    },
    {
      title: copy.slideRetentionTitle,
      body: copy.slideRetentionBody,
    },
  ]

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideIndex((idx) => (idx + 1) % slides.length)
    }, AUTO_SLIDE_MS)

    return () => window.clearInterval(timer)
  }, [slides.length])

  return (
    <section className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_12%_8%,rgba(37,99,235,0.12),transparent_36%),radial-gradient(circle_at_95%_12%,rgba(15,15,15,0.08),transparent_34%),linear-gradient(165deg,#f8f7f1,#ece9de)] dark:bg-[radial-gradient(circle_at_12%_8%,rgba(37,99,235,0.2),transparent_34%),radial-gradient(circle_at_95%_12%,rgba(245,245,240,0.12),transparent_36%),linear-gradient(165deg,#141414,#090909)]">
      <div className="max-w-6xl mx-auto px-5 py-8 sm:py-12">
        <div className="border border-[#0f0f0f]/20 dark:border-[#f5f5f0]/20 bg-[#f5f5f0]/88 dark:bg-[#0f0f0f]/82 p-6 sm:p-8">
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#2563eb] mb-2">
            {currentUser?.username}
          </p>
          <h1 className="text-2xl sm:text-4xl font-semibold leading-tight text-[#0f0f0f] dark:text-[#f5f5f0] mb-3">
            {copy.dashboardTitle}
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-[#0f0f0f]/70 dark:text-[#f5f5f0]/70 max-w-3xl">
            {copy.dashboardSubtitle}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveView('reader')}
              className="px-4 py-2 border border-[#2563eb] bg-[#2563eb] text-white text-xs font-mono uppercase tracking-widest hover:brightness-110 transition"
            >
              {copy.openReader}
            </button>
            <button
              onClick={() => setActiveView('wordbank')}
              className="px-4 py-2 border border-[#0f0f0f]/25 dark:border-[#f5f5f0]/25 text-xs font-mono uppercase tracking-widest text-[#0f0f0f] dark:text-[#f5f5f0] hover:border-[#2563eb] hover:text-[#2563eb] transition-colors"
            >
              {copy.openWordBank}
            </button>
            <button
              onClick={() => setActiveView('quizbuilder')}
              className="px-4 py-2 border border-[#0f0f0f]/25 dark:border-[#f5f5f0]/25 text-xs font-mono uppercase tracking-widest text-[#0f0f0f] dark:text-[#f5f5f0] hover:border-[#2563eb] hover:text-[#2563eb] transition-colors"
            >
              {copy.openQuizBuilder}
            </button>
            <span className="ml-auto self-center text-[10px] font-mono uppercase tracking-[0.2em] opacity-50 dark:text-[#f5f5f0]">
              {levelLabel(currentUser?.readingLevel ?? 'beginner', selectedLanguage)}
            </span>
          </div>
        </div>

        <div className="mt-7 overflow-x-auto pb-2">
          <div
            className="flex gap-4 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(calc(-${slideIndex} * (100% + 1rem)))` }}
          >
            {slides.map((slide) => (
              <article
                key={slide.title}
                className="min-w-full border border-[#0f0f0f]/14 dark:border-[#f5f5f0]/16 bg-[#f5f5f0]/76 dark:bg-[#0f0f0f]/76 p-6 sm:p-8"
              >
                <h2 className="text-xl sm:text-2xl font-semibold text-[#0f0f0f] dark:text-[#f5f5f0] mb-2">
                  {slide.title}
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-[#0f0f0f]/70 dark:text-[#f5f5f0]/70">
                  {slide.body}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          {slides.map((slide, idx) => (
            <button
              key={slide.title}
              onClick={() => setSlideIndex(idx)}
              className={`h-2 transition-all ${idx === slideIndex ? 'w-8 bg-[#2563eb]' : 'w-2 bg-[#0f0f0f]/25 dark:bg-[#f5f5f0]/25'}`}
              aria-label={slide.title}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
