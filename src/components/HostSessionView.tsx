import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { getUiCopy } from '../lib/i18n'
import { useAppStore } from '../store/useAppStore'
import type { QuizQuestion, QuizSessionStatus } from '../types/dictionary'

const OPTION_STYLES: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: 'bg-[#e53935] text-white',
  B: 'bg-[#1e88e5] text-white',
  C: 'bg-[#fbc02d] text-[#111111]',
  D: 'bg-[#43a047] text-white',
}

function scoreDelta(participantId: string, questionIndex: number) {
  const sum = `${participantId}-${questionIndex}`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return 300 + (sum % 700)
}

function answerForParticipant(participantId: string, question: QuizQuestion): 'A' | 'B' | 'C' | 'D' {
  const labels = question.options.map((option) => option.label)
  const seed = `${participantId}-${question.position}`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return labels[seed % labels.length]
}

export function HostSessionView() {
  const {
    selectedLanguage,
    quizBuilderConfig,
    generatedQuiz,
    activeSession,
    updateActiveSession,
    setActiveView,
  } = useAppStore()
  const copy = getUiCopy(selectedLanguage)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [remainingSeconds, setRemainingSeconds] = useState(quizBuilderConfig.timePerQuestion)

  const currentQuestion = generatedQuiz?.questions[activeSession?.currentQuestionIndex ?? 0]

  const distribution = useMemo(() => {
    if (!activeSession || !currentQuestion) {
      return { A: 0, B: 0, C: 0, D: 0 }
    }

    return activeSession.participants.reduce(
      (acc, participant) => {
        const answer = answerForParticipant(participant.id, currentQuestion)
        acc[answer] += 1
        return acc
      },
      { A: 0, B: 0, C: 0, D: 0 }
    )
  }, [activeSession, currentQuestion])

  useEffect(() => {
    if (!activeSession?.joinUrl) return

    void QRCode.toDataURL(activeSession.joinUrl, {
      width: 360,
      margin: 2,
      color: {
        dark: '#0f0f1a',
        light: '#f5f5f0',
      },
    }).then(setQrCodeDataUrl)
  }, [activeSession?.joinUrl])

  useEffect(() => {
    if (!activeSession || activeSession.status !== 'question' || !activeSession.questionStartedAt) {
      setRemainingSeconds(quizBuilderConfig.timePerQuestion)
      return
    }

    const updateRemaining = () => {
      const elapsedMs = Date.now() - new Date(activeSession.questionStartedAt as string).getTime()
      const nextRemaining = Math.max(
        0,
        quizBuilderConfig.timePerQuestion - Math.floor(elapsedMs / 1000)
      )
      setRemainingSeconds(nextRemaining)

      if (nextRemaining === 0 && activeSession.status === 'question') {
        updateActiveSession({ status: 'reveal' })
      }
    }

    updateRemaining()
    const timer = window.setInterval(updateRemaining, 250)
    return () => window.clearInterval(timer)
  }, [activeSession, quizBuilderConfig.timePerQuestion, updateActiveSession])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!activeSession || !generatedQuiz) return

      if (event.key === 'ArrowRight') {
        if (activeSession.status === 'lobby') {
          updateActiveSession({
            status: 'question',
            currentQuestionIndex: 0,
            questionStartedAt: new Date().toISOString(),
          })
          return
        }

        if (activeSession.status === 'question') {
          updateActiveSession({ status: 'reveal' })
          return
        }

        if (activeSession.status === 'reveal') {
          if (activeSession.currentQuestionIndex >= generatedQuiz.questions.length - 1) {
            updateActiveSession({ status: 'finished' })
          } else {
            const nextIndex = activeSession.currentQuestionIndex + 1
            const nextParticipants = activeSession.participants.map((participant) => {
              const points = answerForParticipant(participant.id, currentQuestion as QuizQuestion) === (currentQuestion as QuizQuestion).correct_answer
                ? scoreDelta(participant.id, activeSession.currentQuestionIndex)
                : 0

              return {
                ...participant,
                score: participant.score + points,
              }
            })

            updateActiveSession({
              status: nextIndex % 3 === 0 ? 'leaderboard' : 'question',
              currentQuestionIndex: nextIndex % 3 === 0 ? activeSession.currentQuestionIndex : nextIndex,
              questionStartedAt: nextIndex % 3 === 0 ? null : new Date().toISOString(),
              participants: nextParticipants,
            })
          }
          return
        }

        if (activeSession.status === 'leaderboard') {
          updateActiveSession({
            status: 'question',
            currentQuestionIndex: activeSession.currentQuestionIndex + 1,
            questionStartedAt: new Date().toISOString(),
          })
        }
      }

      if (event.key === 'ArrowLeft' && activeSession.currentQuestionIndex > 0) {
        updateActiveSession({
          status: 'question',
          currentQuestionIndex: activeSession.currentQuestionIndex - 1,
          questionStartedAt: new Date().toISOString(),
        })
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeSession, currentQuestion, generatedQuiz, updateActiveSession])

  if (!activeSession || !generatedQuiz) {
    return (
      <section className="flex-1 flex items-center justify-center p-6">
        <div className="border border-[#0f0f0f]/20 dark:border-[#f5f5f0]/20 bg-[#f5f5f0]/88 dark:bg-[#111111] p-6 text-center max-w-lg">
          <p className="text-sm text-[#0f0f0f]/70 dark:text-[#f5f5f0]/70">{copy.noQuizGenerated}</p>
          <button
            type="button"
            onClick={() => setActiveView('quizbuilder')}
            className="mt-4 px-4 py-2 border border-[#2563eb] bg-[#2563eb] text-white text-xs font-mono uppercase tracking-widest"
          >
            {copy.backToBuilder}
          </button>
        </div>
      </section>
    )
  }

  const sortedParticipants = [...activeSession.participants].sort((a, b) => b.score - a.score)
  const questionNumber = activeSession.currentQuestionIndex + 1
  const answerCount =
    activeSession.status === 'question'
      ? Math.min(activeSession.participants.length, Math.max(0, activeSession.participants.length - Math.floor(remainingSeconds / 3)))
      : activeSession.participants.length
  const progress = Math.max(0, Math.min(1, remainingSeconds / quizBuilderConfig.timePerQuestion))
  const circumference = 2 * Math.PI * 52
  const strokeOffset = circumference * (1 - progress)

  const startQuiz = () => {
    updateActiveSession({
      status: 'question',
      currentQuestionIndex: 0,
      questionStartedAt: new Date().toISOString(),
    })
  }

  const revealAnswer = () => {
    updateActiveSession({ status: 'reveal' })
  }

  const showLeaderboard = () => {
    if (!currentQuestion) return

    const nextParticipants = activeSession.participants.map((participant) => {
      const points = answerForParticipant(participant.id, currentQuestion) === currentQuestion.correct_answer
        ? scoreDelta(participant.id, activeSession.currentQuestionIndex)
        : 0

      return {
        ...participant,
        score: participant.score + points,
      }
    })

    updateActiveSession({
      status: 'leaderboard',
      participants: nextParticipants,
      questionStartedAt: null,
    })
  }

  const nextQuestion = () => {
    if (activeSession.currentQuestionIndex >= generatedQuiz.questions.length - 1) {
      updateActiveSession({ status: 'finished', questionStartedAt: null })
      return
    }

    updateActiveSession({
      status: 'question',
      currentQuestionIndex: activeSession.currentQuestionIndex + 1,
      questionStartedAt: new Date().toISOString(),
    })
  }

  return (
    <section className="flex-1 overflow-y-auto bg-[#0f0f1a] text-white">
      <div className="max-w-6xl mx-auto px-5 py-8 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#4cc9f0]">{copy.presenterView}</p>
            <h1 className="mt-1 text-2xl sm:text-4xl font-semibold">{activeSession.quizTitle}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveView('quizbuilder')}
              className="px-4 py-2 rounded-2xl border border-white/20 text-xs font-mono uppercase tracking-widest"
            >
              {copy.backToBuilder}
            </button>
          </div>
        </div>

        {activeSession.status === 'lobby' && (
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 items-stretch">
            <div className="rounded-[32px] bg-white text-[#0f0f1a] p-6 sm:p-8 min-h-[420px] flex flex-col items-center justify-center">
              {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="Session QR code" className="w-full max-w-[320px] rounded-[24px]" />}
              <p className="mt-5 text-xs font-mono uppercase tracking-[0.18em] text-[#2563eb]">{copy.joinLink}</p>
              <p className="mt-2 text-sm sm:text-lg font-medium break-all text-center">{activeSession.joinUrl}</p>
              <p className="mt-5 text-xs font-mono uppercase tracking-[0.18em] text-[#2563eb]">{copy.sessionCode}</p>
              <p className="mt-2 text-3xl sm:text-5xl font-black tracking-[0.24em]">{activeSession.shortCode}</p>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#4cc9f0]">{copy.participants}</p>
              <h2 className="mt-3 text-3xl font-semibold">{activeSession.participants.length}</h2>
              <p className="mt-2 text-sm text-white/70">{copy.hostReady} {copy.localSessionNote}</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {activeSession.participants.map((participant) => (
                  <div key={participant.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                    {participant.nickname}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={startQuiz}
                className="mt-6 w-full px-4 py-4 rounded-2xl bg-[#2563eb] text-white text-xs font-mono uppercase tracking-widest"
              >
                {copy.startQuiz}
              </button>
            </div>
          </div>
        )}

        {activeSession.status === 'question' && currentQuestion && (
          <div className="grid gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#4cc9f0]">
                  {copy.questionLabel} {questionNumber} / {generatedQuiz.questions.length}
                </p>
                <h2 className="mt-2 text-3xl sm:text-5xl font-semibold max-w-4xl">{currentQuestion.prompt}</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 120 120" className="w-28 h-28 -rotate-90">
                    <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,0.15)" strokeWidth="10" fill="none" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      stroke="#4cc9f0"
                      strokeWidth="10"
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold">{remainingSeconds}</div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono uppercase tracking-[0.18em] text-white/60">Answered</p>
                  <p className="mt-1 text-2xl font-semibold">{answerCount} / {activeSession.participants.length}</p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {currentQuestion.options.map((option) => (
                <div key={option.label} className={`rounded-[28px] p-6 min-h-[140px] ${OPTION_STYLES[option.label]}`}>
                  <p className="text-xs font-mono uppercase tracking-[0.18em]">{option.label}</p>
                  <p className="mt-3 text-xl sm:text-2xl font-semibold leading-snug">{option.text}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={revealAnswer}
                className="px-5 py-3 rounded-2xl border border-white/20 text-xs font-mono uppercase tracking-widest"
              >
                {copy.revealAnswer}
              </button>
            </div>
          </div>
        )}

        {activeSession.status === 'reveal' && currentQuestion && (
          <div className="grid gap-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#4cc9f0]">Reveal</p>
              <h2 className="mt-2 text-3xl sm:text-5xl font-semibold max-w-4xl">{currentQuestion.prompt}</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {currentQuestion.options.map((option) => {
                const total = activeSession.participants.length || 1
                const voteShare = Math.round((distribution[option.label] / total) * 100)
                const isCorrect = option.label === currentQuestion.correct_answer
                return (
                  <div
                    key={option.label}
                    className={`rounded-[28px] p-6 min-h-[170px] border ${
                      isCorrect ? 'border-[#22c55e] bg-[#22c55e]/18' : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-mono uppercase tracking-[0.18em]">{option.label}</p>
                      <p className="text-sm font-semibold">{distribution[option.label]} votes</p>
                    </div>
                    <p className="mt-3 text-xl font-semibold">{option.text}</p>
                    <div className="mt-5 h-3 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full ${isCorrect ? 'bg-[#22c55e]' : 'bg-[#4cc9f0]'}`} style={{ width: `${voteShare}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#4cc9f0]">{copy.explanationLabel}</p>
              <p className="mt-3 text-lg text-white/85">{currentQuestion.explanation}</p>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={showLeaderboard}
                className="px-5 py-3 rounded-2xl border border-white/20 text-xs font-mono uppercase tracking-widest"
              >
                {copy.showLeaderboard}
              </button>
              <button
                type="button"
                onClick={nextQuestion}
                className="px-5 py-3 rounded-2xl bg-[#2563eb] text-white text-xs font-mono uppercase tracking-widest"
              >
                {copy.nextQuestion}
              </button>
            </div>
          </div>
        )}

        {activeSession.status === 'leaderboard' && (
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#4cc9f0]">{copy.showLeaderboard}</p>
            <div className="mt-6 grid gap-3">
              {sortedParticipants.slice(0, 5).map((participant, index) => (
                <div key={participant.id} className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-full bg-[#2563eb] flex items-center justify-center font-bold">{index + 1}</span>
                    <span className="text-lg font-semibold">{participant.nickname}</span>
                  </div>
                  <span className="text-lg font-bold">{participant.score}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={nextQuestion}
                className="px-5 py-3 rounded-2xl bg-[#2563eb] text-white text-xs font-mono uppercase tracking-widest"
              >
                {copy.nextQuestion}
              </button>
            </div>
          </div>
        )}

        {activeSession.status === 'finished' && (
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#4cc9f0]">Finished</p>
            <h2 className="mt-2 text-3xl sm:text-5xl font-semibold">{activeSession.quizTitle}</h2>
            <div className="mt-6 grid gap-3">
              {sortedParticipants.map((participant, index) => (
                <div key={participant.id} className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-full bg-[#2563eb] flex items-center justify-center font-bold">{index + 1}</span>
                    <span className="text-lg font-semibold">{participant.nickname}</span>
                  </div>
                  <span className="text-lg font-bold">{participant.score}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => updateActiveSession({
                  status: 'lobby' as QuizSessionStatus,
                  currentQuestionIndex: 0,
                  questionStartedAt: null,
                  participants: activeSession.participants.map((participant) => ({ ...participant, score: 0 })),
                })}
                className="px-5 py-3 rounded-2xl border border-white/20 text-xs font-mono uppercase tracking-widest"
              >
                {copy.lobby}
              </button>
              <button
                type="button"
                onClick={() => setActiveView('quizbuilder')}
                className="px-5 py-3 rounded-2xl bg-[#2563eb] text-white text-xs font-mono uppercase tracking-widest"
              >
                {copy.backToBuilder}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
