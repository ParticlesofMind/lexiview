import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { getUiCopy } from '../lib/i18n'
import {
  generateQuiz,
  getOllamaBaseUrl,
  getOllamaRuntimeConfig,
  getOllamaModel,
  regenerateQuestion,
  saveOllamaRuntimeConfig,
  testOllamaConnection,
} from '../lib/quizGenerator'
import type { GeneratedQuiz, QuizQuestion, QuizType, SessionParticipant } from '../types/dictionary'

const QUIZ_LANGUAGES = ['German', 'English', 'French', 'Italian', 'Spanish'] as const
const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const OPTION_COUNTS = [2, 3, 4] as const
const QUESTION_LABELS = ['A', 'B', 'C', 'D'] as const
const SAMPLE_NICKNAMES = [
  'Mia',
  'Noah',
  'Lina',
  'Elias',
  'Sofia',
  'Leo',
  'Emma',
  'Milan',
  'Zoe',
  'Nora',
]

type DraftQuestion = QuizQuestion

function buildBlankQuestion(optionCount: number, position: number): DraftQuestion {
  const labels = QUESTION_LABELS.slice(0, optionCount)

  return {
    position,
    prompt: '',
    options: labels.map((label) => ({
      label,
      text: '',
    })),
    correct_answer: labels[0],
    explanation: '',
  }
}

function createParticipants(): SessionParticipant[] {
  return SAMPLE_NICKNAMES.slice(0, 6).map((nickname, index) => ({
    id: `participant-${index + 1}`,
    nickname,
    score: 0,
  }))
}

function normalizeQuizPositions(quiz: GeneratedQuiz): GeneratedQuiz {
  return {
    ...quiz,
    questions: quiz.questions.map((question, index) => ({
      ...question,
      position: index + 1,
    })),
  }
}

export function QuizBuilderView() {
  const {
    selectedLanguage,
    quizBuilderConfig,
    generatedQuiz,
    updateQuizBuilderConfig,
    setGeneratedQuiz,
    updateGeneratedQuizTitle,
    updateGeneratedQuestion,
    deleteGeneratedQuestion,
    addGeneratedQuestion,
    moveGeneratedQuestion,
    setActiveSession,
    setActiveView,
  } = useAppStore()

  const copy = getUiCopy(selectedLanguage)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [regeneratingPosition, setRegeneratingPosition] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<DraftQuestion | null>(null)
  const [ollamaSettings, setOllamaSettings] = useState(getOllamaRuntimeConfig)

  const quizTypeLabels: Record<QuizType, string> = {
    vocabulary: copy.vocabulary,
    grammar: copy.grammar,
    comprehension: copy.comprehension,
    translation: copy.translation,
    fill_in_the_blank: copy.fillInTheBlank,
    error_detection: copy.errorDetection,
  }

  const onGenerate = async () => {
    setErrorMessage(null)
    setConnectionMessage(null)
    setIsGenerating(true)

    try {
      const result = normalizeQuizPositions(await generateQuiz(quizBuilderConfig))
      setGeneratedQuiz(result)

      if (!quizBuilderConfig.title.trim()) {
        updateQuizBuilderConfig({ title: result.title })
      }
    } catch (error) {
      const fallbackMessage = 'Could not generate quiz right now. Check API key/network and try again.'
      setErrorMessage(error instanceof Error ? error.message : fallbackMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const onRegenerateSingle = async (question: QuizQuestion) => {
    setErrorMessage(null)
    setConnectionMessage(null)
    setRegeneratingPosition(question.position)

    try {
      const replacement = await regenerateQuestion(quizBuilderConfig, question)
      updateGeneratedQuestion(question.position, replacement)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not regenerate question.')
    } finally {
      setRegeneratingPosition(null)
    }
  }

  const onAddBlankQuestion = () => {
    setErrorMessage(null)
    setConnectionMessage(null)
    addGeneratedQuestion(
      buildBlankQuestion(
        quizBuilderConfig.optionsPerQuestion,
        (generatedQuiz?.questions.length ?? 0) + 1
      )
    )
  }

  const onLaunchSession = () => {
    if (!generatedQuiz || generatedQuiz.questions.length === 0) {
      setErrorMessage(copy.noQuizGenerated)
      return
    }

    const sessionId = `session-${Math.random().toString(36).slice(2, 8)}`
    const shortCode = sessionId.slice(-6).toUpperCase()
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'

    setActiveSession({
      id: sessionId,
      quizTitle: generatedQuiz.title,
      joinUrl: `${origin}/join/${sessionId}`,
      shortCode,
      status: 'lobby',
      currentQuestionIndex: 0,
      questionStartedAt: null,
      participants: createParticipants(),
    })
    setActiveView('quizsession')
  }

  const onTestConnection = async () => {
    setErrorMessage(null)
    setConnectionMessage(null)
    setIsTestingConnection(true)

    try {
      const result = await testOllamaConnection()
      const status = result.modelAvailable ? copy.ollamaReachable : copy.ollamaModelMissing
      setConnectionMessage(`${status} ${result.baseUrl} -> ${result.model}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not reach Ollama.')
    } finally {
      setIsTestingConnection(false)
    }
  }

  const onSaveOllamaSettings = () => {
    saveOllamaRuntimeConfig(ollamaSettings)
    setConnectionMessage(copy.ollamaSettingsSaved)
    setErrorMessage(null)
  }

  return (
    <section className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_8%_10%,rgba(37,99,235,0.14),transparent_34%),radial-gradient(circle_at_88%_4%,rgba(15,15,15,0.1),transparent_32%),linear-gradient(165deg,#f8f7f1,#ece9de)] dark:bg-[radial-gradient(circle_at_8%_10%,rgba(37,99,235,0.2),transparent_34%),radial-gradient(circle_at_88%_4%,rgba(245,245,240,0.12),transparent_32%),linear-gradient(165deg,#141414,#090909)]">
      <div className="max-w-5xl mx-auto px-5 py-8 sm:py-12">
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

            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border border-[#0f0f0f]/12 dark:border-[#f5f5f0]/12 p-4">
              <div className="sm:col-span-3">
                <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#2563eb] mb-2">
                  {copy.ollamaSettings}
                </p>
                <p className="text-xs text-[#0f0f0f]/60 dark:text-[#f5f5f0]/60">
                  {copy.hostedOllamaHint}
                </p>
              </div>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0]">{copy.ollamaBaseUrl}</span>
                <input
                  value={ollamaSettings.baseUrl}
                  onChange={(e) => setOllamaSettings((current) => ({ ...current, baseUrl: e.target.value }))}
                  placeholder="http://192.168.1.100:11434"
                  className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-2 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0]">{copy.ollamaModel}</span>
                <input
                  value={ollamaSettings.model}
                  onChange={(e) => setOllamaSettings((current) => ({ ...current, model: e.target.value }))}
                  placeholder="llama3.1:8b"
                  className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-2 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1 sm:col-span-3">
                <span className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0]">{copy.ollamaApiKey}</span>
                <input
                  type="password"
                  value={ollamaSettings.apiKey}
                  onChange={(e) => setOllamaSettings((current) => ({ ...current, apiKey: e.target.value }))}
                  placeholder="Optional bearer token"
                  className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-2 text-sm"
                />
              </label>

              <div className="sm:col-span-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onSaveOllamaSettings}
                  className="px-4 py-3 border border-[#0f0f0f]/25 dark:border-[#f5f5f0]/25 text-xs font-mono uppercase tracking-widest hover:border-[#2563eb] hover:text-[#2563eb] transition-colors"
                >
                  {copy.saveOllamaSettings}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0]">{copy.quizLanguage}</span>
                <select
                  value={quizBuilderConfig.language}
                  onChange={(e) => updateQuizBuilderConfig({ language: e.target.value as (typeof QUIZ_LANGUAGES)[number] })}
                  className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-2 text-sm"
                >
                  {QUIZ_LANGUAGES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0]">{copy.cefrLevel}</span>
                <select
                  value={quizBuilderConfig.languageLevel}
                  onChange={(e) => updateQuizBuilderConfig({ languageLevel: e.target.value as (typeof CEFR_LEVELS)[number] })}
                  className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-2 text-sm"
                >
                  {CEFR_LEVELS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0]">{copy.topic}</span>
                <input
                  value={quizBuilderConfig.topic}
                  onChange={(e) => updateQuizBuilderConfig({ topic: e.target.value })}
                  placeholder={copy.topicPlaceholder}
                  className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-2 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0]">{copy.quizType}</span>
                <select
                  value={quizBuilderConfig.quizType}
                  onChange={(e) => updateQuizBuilderConfig({ quizType: e.target.value as QuizType })}
                  className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-2 text-sm"
                >
                  {Object.entries(quizTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0]">{copy.numberOfQuestions}</span>
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
                <legend className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0] mb-1">{copy.optionsPerQuestion}</legend>
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
                <span className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0]">{copy.timePerQuestion}</span>
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
                <span className="text-xs font-mono uppercase tracking-widest opacity-65 dark:text-[#f5f5f0]">{copy.titleOptional}</span>
                <input
                  value={quizBuilderConfig.title}
                  onChange={(e) => {
                    updateQuizBuilderConfig({ title: e.target.value })
                    if (generatedQuiz) {
                      updateGeneratedQuizTitle(e.target.value)
                    }
                  }}
                  placeholder={copy.titlePlaceholder}
                  className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-2 text-sm"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onGenerate}
                disabled={isGenerating || quizBuilderConfig.topic.trim().length === 0}
                className="px-4 py-3 border border-[#2563eb] bg-[#2563eb] text-white text-xs font-mono uppercase tracking-widest hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isGenerating ? `${copy.generateQuiz}...` : copy.generateQuiz}
              </button>

              <button
                type="button"
                onClick={onTestConnection}
                disabled={isTestingConnection}
                className="px-4 py-3 border border-[#0f0f0f]/25 dark:border-[#f5f5f0]/25 text-xs font-mono uppercase tracking-widest hover:border-[#2563eb] hover:text-[#2563eb] disabled:opacity-60 transition-colors"
              >
                {isTestingConnection ? copy.testingOllama : copy.testOllama}
              </button>

              <button
                type="button"
                onClick={onGenerate}
                disabled={isGenerating || quizBuilderConfig.topic.trim().length === 0}
                className="px-4 py-3 border border-[#0f0f0f]/25 dark:border-[#f5f5f0]/25 text-xs font-mono uppercase tracking-widest hover:border-[#2563eb] hover:text-[#2563eb] disabled:opacity-60 transition-colors"
              >
                {copy.regenerateAll}
              </button>

              <button
                type="button"
                onClick={onAddBlankQuestion}
                className="px-4 py-3 border border-[#0f0f0f]/25 dark:border-[#f5f5f0]/25 text-xs font-mono uppercase tracking-widest hover:border-[#2563eb] hover:text-[#2563eb] transition-colors"
              >
                {copy.addQuestion}
              </button>

              <button
                type="button"
                onClick={onLaunchSession}
                disabled={!generatedQuiz || generatedQuiz.questions.length === 0}
                className="px-4 py-3 border border-[#0f0f0f]/25 dark:border-[#f5f5f0]/25 text-xs font-mono uppercase tracking-widest hover:border-[#2563eb] hover:text-[#2563eb] disabled:opacity-50 transition-colors"
              >
                {copy.launchSession}
              </button>
            </div>

            {isGenerating && (
              <div className="mt-4 grid gap-3" aria-live="polite">
                <div className="h-16 animate-pulse bg-[#0f0f0f]/8 dark:bg-[#f5f5f0]/10" />
                <div className="h-16 animate-pulse bg-[#0f0f0f]/8 dark:bg-[#f5f5f0]/10" />
                <div className="h-16 animate-pulse bg-[#0f0f0f]/8 dark:bg-[#f5f5f0]/10" />
              </div>
            )}

            {errorMessage && (
              <p className="mt-4 text-sm text-[#b91c1c] dark:text-[#fca5a5]" role="alert">{errorMessage}</p>
            )}

            {connectionMessage && (
              <p className="mt-4 text-sm text-[#166534] dark:text-[#86efac]" role="status">{connectionMessage}</p>
            )}

            <p className="mt-3 text-xs text-[#0f0f0f]/55 dark:text-[#f5f5f0]/55">
              Ollama endpoint: {getOllamaBaseUrl()} | model: {getOllamaModel()}
            </p>

            {!generatedQuiz && !isGenerating && (
              <p className="mt-6 text-sm text-[#0f0f0f]/65 dark:text-[#f5f5f0]/65">{copy.noQuizGenerated}</p>
            )}

            {generatedQuiz && (
              <div className="mt-6 border-t border-[#0f0f0f]/12 dark:border-[#f5f5f0]/12 pt-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-[#2563eb]">{copy.generatedQuiz}</p>
                    <h2 className="mt-1 text-lg sm:text-xl font-semibold text-[#0f0f0f] dark:text-[#f5f5f0]">{generatedQuiz.title}</h2>
                  </div>
                  <p className="text-xs font-mono uppercase tracking-widest opacity-60 dark:text-[#f5f5f0]">
                    {generatedQuiz.questions.length} questions
                  </p>
                </div>

                <div className="mt-4 grid gap-3 max-h-[52vh] overflow-y-auto pr-1">
                  {generatedQuiz.questions.map((question) => (
                    <article
                      key={`q-${question.position}`}
                      className="border border-[#0f0f0f]/16 dark:border-[#f5f5f0]/18 bg-[#f5f5f0]/80 dark:bg-[#0f0f0f]/80 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-mono uppercase tracking-widest text-[#2563eb]">
                            {copy.questionLabel} {question.position}
                          </p>
                          <h3 className="mt-2 text-sm sm:text-base font-medium text-[#0f0f0f] dark:text-[#f5f5f0]">
                            {question.prompt || 'Untitled prompt'}
                          </h3>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => moveGeneratedQuestion(question.position, 'up')}
                            className="px-2 py-1 border border-[#0f0f0f]/20 dark:border-[#f5f5f0]/20 text-[10px] font-mono uppercase tracking-widest"
                          >
                            {copy.moveUp}
                          </button>
                          <button
                            type="button"
                            onClick={() => moveGeneratedQuestion(question.position, 'down')}
                            className="px-2 py-1 border border-[#0f0f0f]/20 dark:border-[#f5f5f0]/20 text-[10px] font-mono uppercase tracking-widest"
                          >
                            {copy.moveDown}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingQuestion({ ...question, options: question.options.map((option) => ({ ...option })) })}
                            className="px-2 py-1 border border-[#0f0f0f]/20 dark:border-[#f5f5f0]/20 text-[10px] font-mono uppercase tracking-widest"
                          >
                            {copy.editQuestion}
                          </button>
                          <button
                            type="button"
                            onClick={() => onRegenerateSingle(question)}
                            disabled={regeneratingPosition === question.position}
                            className="px-2 py-1 border border-[#0f0f0f]/20 dark:border-[#f5f5f0]/20 text-[10px] font-mono uppercase tracking-widest disabled:opacity-50"
                          >
                            {regeneratingPosition === question.position ? `${copy.regenerate}...` : copy.regenerate}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteGeneratedQuestion(question.position)}
                            className="px-2 py-1 border border-[#b91c1c]/30 text-[#b91c1c] text-[10px] font-mono uppercase tracking-widest"
                          >
                            {copy.deleteQuestion}
                          </button>
                        </div>
                      </div>

                      <ul className="mt-3 grid gap-2">
                        {question.options.map((option) => {
                          const isCorrect = option.label === question.correct_answer
                          return (
                            <li
                              key={option.label}
                              className={`border px-3 py-2 text-sm ${
                                isCorrect
                                  ? 'border-[#16a34a] bg-[#16a34a]/10 dark:bg-[#16a34a]/20'
                                  : 'border-[#0f0f0f]/16 dark:border-[#f5f5f0]/16'
                              }`}
                            >
                              <span className="font-mono text-xs mr-2">{option.label}</span>
                              {option.text || `${copy.optionLabel} ${option.label}`}
                              {isCorrect && <span className="ml-2 text-[#16a34a] font-semibold">({copy.correct.toLowerCase()})</span>}
                            </li>
                          )
                        })}
                      </ul>

                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-mono uppercase tracking-widest opacity-70 dark:text-[#f5f5f0]">
                          {copy.explanationLabel}
                        </summary>
                        <p className="mt-2 text-sm text-[#0f0f0f]/80 dark:text-[#f5f5f0]/80">
                          {question.explanation || 'No explanation yet.'}
                        </p>
                      </details>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl border border-[#0f0f0f]/20 dark:border-[#f5f5f0]/20 bg-[#f5f5f0] dark:bg-[#111111] p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#0f0f0f] dark:text-[#f5f5f0]">{copy.editQuestion}</h2>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-3 py-1 border border-[#0f0f0f]/20 dark:border-[#f5f5f0]/20 text-xs font-mono uppercase tracking-widest"
              >
                {copy.cancel}
              </button>
            </div>

            <div className="mt-4 grid gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-mono uppercase tracking-widest opacity-60 dark:text-[#f5f5f0]">Prompt</span>
                <textarea
                  value={editingQuestion.prompt}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, prompt: e.target.value })}
                  rows={3}
                  className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-2 text-sm"
                />
              </label>

              <div className="grid gap-3">
                {editingQuestion.options.map((option, index) => (
                  <label key={option.label} className="flex flex-col gap-1">
                    <span className="text-xs font-mono uppercase tracking-widest opacity-60 dark:text-[#f5f5f0]">{copy.optionLabel} {option.label}</span>
                    <input
                      value={option.text}
                      onChange={(e) => {
                        const options = editingQuestion.options.map((entry, optionIndex) =>
                          optionIndex === index ? { ...entry, text: e.target.value } : entry
                        )
                        setEditingQuestion({ ...editingQuestion, options })
                      }}
                      className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-2 text-sm"
                    />
                  </label>
                ))}
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-mono uppercase tracking-widest opacity-60 dark:text-[#f5f5f0]">{copy.correctAnswer}</span>
                <select
                  value={editingQuestion.correct_answer}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, correct_answer: e.target.value as DraftQuestion['correct_answer'] })}
                  className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-2 text-sm"
                >
                  {editingQuestion.options.map((option) => (
                    <option key={option.label} value={option.label}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-mono uppercase tracking-widest opacity-60 dark:text-[#f5f5f0]">{copy.explanationLabel}</span>
                <textarea
                  value={editingQuestion.explanation}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  rows={3}
                  className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-2 py-2 text-sm"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 border border-[#0f0f0f]/20 dark:border-[#f5f5f0]/20 text-xs font-mono uppercase tracking-widest"
              >
                {copy.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  updateGeneratedQuestion(editingQuestion.position, editingQuestion)
                  setEditingQuestion(null)
                }}
                className="px-4 py-2 border border-[#2563eb] bg-[#2563eb] text-white text-xs font-mono uppercase tracking-widest"
              >
                {copy.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
