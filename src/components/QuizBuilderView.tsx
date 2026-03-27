import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { getUiCopy } from '../lib/i18n'
import type { QuizType } from '../types/dictionary'

const QUIZ_LANGUAGES = ['German', 'English', 'French', 'Italian', 'Spanish'] as const
const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const OPTION_COUNTS = [2, 3, 4] as const

export function QuizBuilderView() {
  const { selectedLanguage, quizBuilderConfig, updateQuizBuilderConfig } = useAppStore()
  const copy = getUiCopy(selectedLanguage)
  const [isGenerating, setIsGenerating] = useState(false)

  const quizTypeLabels: Record<QuizType, string> = {
    vocabulary: copy.vocabulary,
    grammar: copy.grammar,
    comprehension: copy.comprehension,
    translation: copy.translation,
    fill_in_the_blank: copy.fillInTheBlank,
    error_detection: copy.errorDetection,
  }

  const onGenerate = () => {
    setIsGenerating(true)
    window.setTimeout(() => {
      setIsGenerating(false)
    }, 900)
  }

  return (
    <section className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_8%_10%,rgba(37,99,235,0.14),transparent_34%),radial-gradient(circle_at_88%_4%,rgba(15,15,15,0.1),transparent_32%),linear-gradient(165deg,#f8f7f1,#ece9de)] dark:bg-[radial-gradient(circle_at_8%_10%,rgba(37,99,235,0.2),transparent_34%),radial-gradient(circle_at_88%_4%,rgba(245,245,240,0.12),transparent_32%),linear-gradient(165deg,#141414,#090909)]">
      <div className="max-w-4xl mx-auto px-5 py-8 sm:py-12">
        <div className="border border-[#0f0f0f]/20 dark:border-[#f5f5f0]/20 bg-[#f5f5f0]/88 dark:bg-[#0f0f0f]/82 p-6 sm:p-8">
          <h1 className="text-2xl sm:text-4xl font-semibold leading-tight text-[#0f0f0f] dark:text-[#f5f5f0] mb-3">
            {copy.quizBuilderTitle}
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-[#0f0f0f]/70 dark:text-[#f5f5f0]/70 max-w-3xl">
            {copy.quizBuilderSubtitle}
          </p>

          <div className="mt-8 border border-[#0f0f0f]/14 dark:border-[#f5f5f0]/16 bg-[#f5f5f0]/76 dark:bg-[#0f0f0f]/76 p-4 sm:p-6">
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#2563eb] mb-4">
              {copy.generatorOptions}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0]">
                  {copy.quizLanguage}
                </span>
                <select
                  value={quizBuilderConfig.language}
                  onChange={(e) => updateQuizBuilderConfig({ language: e.target.value as (typeof QUIZ_LANGUAGES)[number] })}
                  className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-2 text-sm"
                >
                  {QUIZ_LANGUAGES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0]">
                  {copy.cefrLevel}
                </span>
                <select
                  value={quizBuilderConfig.languageLevel}
                  onChange={(e) => updateQuizBuilderConfig({ languageLevel: e.target.value as (typeof CEFR_LEVELS)[number] })}
                  className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-2 text-sm"
                >
                  {CEFR_LEVELS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0]">
                  {copy.topic}
                </span>
                <input
                  value={quizBuilderConfig.topic}
                  onChange={(e) => updateQuizBuilderConfig({ topic: e.target.value })}
                  placeholder={copy.topicPlaceholder}
                  className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-2 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0]">
                  {copy.quizType}
                </span>
                <select
                  value={quizBuilderConfig.quizType}
                  onChange={(e) => updateQuizBuilderConfig({ quizType: e.target.value as QuizType })}
                  className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-2 text-sm"
                >
                  {Object.entries(quizTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0]">
                  {copy.numberOfQuestions}
                </span>
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={quizBuilderConfig.questionCount}
                  onChange={(e) => {
                    const next = Number(e.target.value)
                    const clamped = Number.isNaN(next) ? 10 : Math.min(30, Math.max(3, next))
                    updateQuizBuilderConfig({ questionCount: clamped })
                  }}
                  className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-2 text-sm"
                />
              </label>

              <fieldset className="flex flex-col gap-2">
                <legend className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0] mb-1">
                  {copy.optionsPerQuestion}
                </legend>
                <div className="flex gap-2">
                  {OPTION_COUNTS.map((count) => {
                    const active = quizBuilderConfig.optionsPerQuestion === count
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => updateQuizBuilderConfig({ optionsPerQuestion: count })}
                        className={`px-4 py-2 border text-sm transition-colors ${
                          active
                            ? 'border-[#2563eb] bg-[#2563eb] text-white'
                            : 'border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 hover:border-[#2563eb]'
                        }`}
                      >
                        {count}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0]">
                  {copy.timePerQuestion}
                </span>
                <input
                  type="range"
                  min={10}
                  max={60}
                  value={quizBuilderConfig.timePerQuestion}
                  onChange={(e) => updateQuizBuilderConfig({ timePerQuestion: Number(e.target.value) })}
                  className="accent-[#2563eb]"
                />
                <span className="text-xs opacity-60 dark:text-[#f5f5f0]">{quizBuilderConfig.timePerQuestion}s</span>
              </label>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0]">
                  {copy.titleOptional}
                </span>
                <input
                  value={quizBuilderConfig.title}
                  onChange={(e) => updateQuizBuilderConfig({ title: e.target.value })}
                  placeholder={copy.titlePlaceholder}
                  className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-2 text-sm"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating || quizBuilderConfig.topic.trim().length === 0}
              className="mt-6 w-full px-4 py-3 border border-[#2563eb] bg-[#2563eb] text-white text-xs font-mono uppercase tracking-widest hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isGenerating ? `${copy.generateQuiz}...` : copy.generateQuiz}
            </button>

            {isGenerating && (
              <div className="mt-4 grid gap-3" aria-live="polite">
                <div className="h-16 animate-pulse bg-[#0f0f0f]/8 dark:bg-[#f5f5f0]/10" />
                <div className="h-16 animate-pulse bg-[#0f0f0f]/8 dark:bg-[#f5f5f0]/10" />
                <div className="h-16 animate-pulse bg-[#0f0f0f]/8 dark:bg-[#f5f5f0]/10" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
