import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { getUiCopy } from '../lib/i18n'
import { useAppStore } from '../store/useAppStore'
import {
  finishSession,
  getQuiz,
  getSession,
  listAnswers,
  listParticipants,
  revealSessionQuestion,
  setSessionLeaderboard,
  startSessionQuestion,
  subscribeToSessionChanges,
  type AnswerRecord,
  type ParticipantRecord,
  type QuizRecord,
  type SessionRecord,
} from '../lib/appwriteQuizBackend'

const OPTION_STYLES: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: 'bg-[#e53935] text-white',
  B: 'bg-[#1e88e5] text-white',
  C: 'bg-[#fbc02d] text-[#111111]',
  D: 'bg-[#43a047] text-white',
}

export function HostSessionView({ sessionId }: { sessionId: string }) {
  const { selectedLanguage } = useAppStore()
  const copy = getUiCopy(selectedLanguage)
  const [session, setSession] = useState<SessionRecord | null>(null)
  const [quiz, setQuiz] = useState<QuizRecord | null>(null)
  const [participants, setParticipants] = useState<ParticipantRecord[]>([])
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isMutating, setIsMutating] = useState(false)

  const refresh = async () => {
    const sessionRecord = await getSession(sessionId)
    const [quizRecord, participantList, answerList] = await Promise.all([
      getQuiz(sessionRecord.quizId),
      listParticipants(sessionId),
      listAnswers(sessionId, sessionRecord.currentQuestionIndex),
    ])

    setSession(sessionRecord)
    setQuiz(quizRecord)
    setParticipants(participantList)
    setAnswers(answerList)
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        await refresh()
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Could not load host session.')
        }
      }
    }

    void load()
    const unsubscribe = subscribeToSessionChanges(sessionId, () => {
      void load()
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [sessionId])

  useEffect(() => {
    if (!session?.joinUrl) return

    void QRCode.toDataURL(session.joinUrl, {
      width: 360,
      margin: 2,
      color: {
        dark: '#0f0f1a',
        light: '#f5f5f0',
      },
    }).then(setQrCodeDataUrl)
  }, [session?.joinUrl])

  useEffect(() => {
    if (!session || session.status !== 'question' || !session.questionStartedAt) {
      setRemainingSeconds(session?.timePerQuestion ?? 0)
      return
    }

    const updateRemaining = () => {
      const elapsedMs = Date.now() - new Date(session.questionStartedAt as string).getTime()
      const nextRemaining = Math.max(0, session.timePerQuestion - Math.floor(elapsedMs / 1000))
      setRemainingSeconds(nextRemaining)
    }

    updateRemaining()
    const timer = window.setInterval(updateRemaining, 250)
    return () => window.clearInterval(timer)
  }, [session])

  const sortedParticipants = useMemo(() => {
    return [...participants].sort((left, right) => right.score - left.score)
  }, [participants])

  const currentQuestion = quiz?.questions[session?.currentQuestionIndex ?? 0] || null
  const answerCount = answers.length
  const progress = session?.timePerQuestion ? Math.max(0, Math.min(1, remainingSeconds / session.timePerQuestion)) : 0
  const circumference = 2 * Math.PI * 52
  const strokeOffset = circumference * (1 - progress)

  const runAction = async (action: () => Promise<void>) => {
    setIsMutating(true)
    setErrorMessage(null)

    try {
      await action()
      await refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not update session.')
    } finally {
      setIsMutating(false)
    }
  }

  if (!session || !quiz) {
    return (
      <section className="flex-1 flex items-center justify-center p-6 bg-[#0f0f1a] text-white">
        <p>{errorMessage || 'Loading session...'}</p>
      </section>
    )
  }

  return (
    <section className="flex-1 overflow-y-auto bg-[#0f0f1a] text-white">
      <div className="max-w-6xl mx-auto px-5 py-8 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#4cc9f0]">{copy.presenterView}</p>
            <h1 className="mt-1 text-2xl sm:text-4xl font-semibold">{session.quizTitle}</h1>
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-white/60">
            Host: {session.hostName}
          </div>
        </div>

        {session.status === 'lobby' && (
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 items-stretch">
            <div className="rounded-[32px] bg-white text-[#0f0f1a] p-6 sm:p-8 min-h-[420px] flex flex-col items-center justify-center">
              {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="Session QR code" className="w-full max-w-[320px] rounded-[24px]" />}
              <p className="mt-5 text-xs font-mono uppercase tracking-[0.18em] text-[#2563eb]">{copy.joinLink}</p>
              <p className="mt-2 text-sm sm:text-lg font-medium break-all text-center">{session.joinUrl}</p>
              <p className="mt-5 text-xs font-mono uppercase tracking-[0.18em] text-[#2563eb]">{copy.sessionCode}</p>
              <p className="mt-2 text-3xl sm:text-5xl font-black tracking-[0.24em]">{session.joinCode}</p>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#4cc9f0]">{copy.participants}</p>
              <h2 className="mt-3 text-3xl font-semibold">{participants.length}</h2>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                    {participant.nickname}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => runAction(async () => {
                  await startSessionQuestion(session.id, 0)
                })}
                disabled={isMutating || participants.length === 0}
                className="mt-6 w-full px-4 py-4 rounded-2xl bg-[#2563eb] text-white text-xs font-mono uppercase tracking-widest disabled:opacity-60"
              >
                {copy.startQuiz}
              </button>
            </div>
          </div>
        )}

        {session.status === 'question' && session.currentQuestion && currentQuestion && (
          <div className="grid gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#4cc9f0]">
                  {copy.questionLabel} {session.currentQuestion.position} / {quiz.questions.length}
                </p>
                <h2 className="mt-2 text-3xl sm:text-5xl font-semibold max-w-4xl">{session.currentQuestion.prompt}</h2>
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
                  <p className="mt-1 text-2xl font-semibold">{answerCount} / {participants.length}</p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {session.currentQuestion.options.map((option) => (
                <div key={option.label} className={`rounded-[28px] p-6 min-h-[140px] ${OPTION_STYLES[option.label]}`}>
                  <p className="text-xs font-mono uppercase tracking-[0.18em]">{option.label}</p>
                  <p className="mt-3 text-xl sm:text-2xl font-semibold leading-snug">{option.text}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => runAction(async () => {
                  await revealSessionQuestion(session.id)
                })}
                disabled={isMutating}
                className="px-5 py-3 rounded-2xl border border-white/20 text-xs font-mono uppercase tracking-widest disabled:opacity-60"
              >
                {copy.revealAnswer}
              </button>
            </div>
          </div>
        )}

        {session.status === 'reveal' && currentQuestion && session.reveal && (
          <div className="grid gap-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#4cc9f0]">Reveal</p>
              <h2 className="mt-2 text-3xl sm:text-5xl font-semibold max-w-4xl">{currentQuestion.prompt}</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {currentQuestion.options.map((option) => {
                const total = participants.length || 1
                const votes = session.reveal?.distribution[option.label] ?? 0
                const voteShare = Math.round((votes / total) * 100)
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
                      <p className="text-sm font-semibold">{votes} votes</p>
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
              <p className="mt-3 text-lg text-white/85">{session.reveal.explanation}</p>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => runAction(async () => {
                  await setSessionLeaderboard(session.id)
                })}
                disabled={isMutating}
                className="px-5 py-3 rounded-2xl border border-white/20 text-xs font-mono uppercase tracking-widest disabled:opacity-60"
              >
                {copy.showLeaderboard}
              </button>
              <button
                type="button"
                onClick={() => runAction(async () => {
                  if (session.currentQuestionIndex >= quiz.questions.length - 1) {
                    await finishSession(session.id)
                  } else {
                    await startSessionQuestion(session.id, session.currentQuestionIndex + 1)
                  }
                })}
                disabled={isMutating}
                className="px-5 py-3 rounded-2xl bg-[#2563eb] text-white text-xs font-mono uppercase tracking-widest disabled:opacity-60"
              >
                {session.currentQuestionIndex >= quiz.questions.length - 1 ? copy.finishQuiz : copy.nextQuestion}
              </button>
            </div>
          </div>
        )}

        {session.status === 'leaderboard' && (
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
                onClick={() => runAction(async () => {
                  if (session.currentQuestionIndex >= quiz.questions.length - 1) {
                    await finishSession(session.id)
                  } else {
                    await startSessionQuestion(session.id, session.currentQuestionIndex + 1)
                  }
                })}
                disabled={isMutating}
                className="px-5 py-3 rounded-2xl bg-[#2563eb] text-white text-xs font-mono uppercase tracking-widest disabled:opacity-60"
              >
                {session.currentQuestionIndex >= quiz.questions.length - 1 ? copy.finishQuiz : copy.nextQuestion}
              </button>
            </div>
          </div>
        )}

        {session.status === 'finished' && (
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#4cc9f0]">Finished</p>
            <h2 className="mt-2 text-3xl sm:text-5xl font-semibold">{session.quizTitle}</h2>
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
          </div>
        )}

        {errorMessage && (
          <p className="mt-4 text-sm text-[#fca5a5]">{errorMessage}</p>
        )}
      </div>
    </section>
  )
}
