import { useEffect, useMemo, useState } from 'react'
import {
  getAnswer,
  getParticipantByDevice,
  getSession,
  listParticipants,
  submitAnswer,
  subscribeToSessionChanges,
  type AnswerRecord,
  type ParticipantRecord,
  type SessionRecord,
} from '../lib/appwriteQuizBackend'

const OPTION_STYLES: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: 'bg-[#e53935] text-white',
  B: 'bg-[#1e88e5] text-white',
  C: 'bg-[#fbc02d] text-[#111111]',
  D: 'bg-[#43a047] text-white',
}

export function PlaySessionView({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<SessionRecord | null>(null)
  const [participant, setParticipant] = useState<ParticipantRecord | null>(null)
  const [participants, setParticipants] = useState<ParticipantRecord[]>([])
  const [answer, setAnswer] = useState<AnswerRecord | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    const refresh = async () => {
      try {
        const [sessionRecord, participantRecord, participantList] = await Promise.all([
          getSession(sessionId),
          getParticipantByDevice(sessionId),
          listParticipants(sessionId),
        ])

        if (cancelled) return

        setSession(sessionRecord)
        setParticipant(participantRecord)
        setParticipants(participantList)

        if (participantRecord) {
          const nextAnswer = await getAnswer(
            sessionId,
            sessionRecord.currentQuestionIndex,
            participantRecord.id
          )
          if (!cancelled) {
            setAnswer(nextAnswer)
          }
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Could not load play session.')
        }
      }
    }

    void refresh()
    const unsubscribe = subscribeToSessionChanges(sessionId, () => {
      void refresh()
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [sessionId])

  const ranking = useMemo(() => {
    return [...participants].sort((left, right) => right.score - left.score)
  }, [participants])

  const participantRank = participant
    ? ranking.findIndex((entry) => entry.id === participant.id) + 1
    : null

  const onSubmitAnswer = async (choice: 'A' | 'B' | 'C' | 'D') => {
    if (!participant || !session) return

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const nextAnswer = await submitAnswer({
        sessionId,
        participant,
        choice,
      })
      setAnswer(nextAnswer)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not submit answer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0f0f1a] text-white">
        <div className="flex-1 flex items-center justify-center p-6">Loading session...</div>
      </div>
    )
  }

  if (!participant) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0f0f1a] text-white">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md rounded-[28px] border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-lg font-semibold">You have not joined this session on this device yet.</p>
            <button
              type="button"
              onClick={() => {
                window.location.hash = `/join/${sessionId}`
              }}
              className="mt-4 px-4 py-3 rounded-2xl bg-[#2563eb] text-white text-xs font-mono uppercase tracking-widest"
            >
              Go to join
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0f0f1a] text-white">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-md mx-auto">
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#4cc9f0]">
            {participant.nickname}
          </p>
          <h1 className="mt-2 text-2xl font-semibold">{session.quizTitle}</h1>

          {session.status === 'lobby' && (
            <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-lg font-semibold">Waiting for the teacher to start...</p>
            </div>
          )}

          {session.status === 'question' && session.currentQuestion && (
            <div className="mt-6 grid gap-4">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#4cc9f0]">
                  Question {session.currentQuestion.position}
                </p>
                <h2 className="mt-3 text-2xl font-semibold leading-snug">{session.currentQuestion.prompt}</h2>
              </div>

              <div className="grid gap-3">
                {session.currentQuestion.options.map((option) => {
                  const isLocked = Boolean(answer)
                  const isSelected = answer?.choice === option.label
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => onSubmitAnswer(option.label)}
                      disabled={isLocked || isSubmitting}
                      className={`rounded-[24px] p-5 min-h-[92px] text-left disabled:opacity-70 ${OPTION_STYLES[option.label]} ${isSelected ? 'ring-4 ring-white/60' : ''}`}
                    >
                      <p className="text-xs font-mono uppercase tracking-[0.18em]">{option.label}</p>
                      <p className="mt-2 text-xl font-semibold">{option.text}</p>
                    </button>
                  )
                })}
              </div>

              {answer && (
                <p className="text-center text-sm text-[#86efac]">Answer locked in.</p>
              )}
            </div>
          )}

          {session.status === 'reveal' && (
            <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#4cc9f0]">Reveal</p>
              <p className="mt-3 text-lg font-semibold">
                {answer?.isCorrect ? 'Correct answer.' : 'Not this time.'}
              </p>
              {typeof answer?.pointsAwarded === 'number' && (
                <p className="mt-2 text-sm text-white/75">Points: {answer.pointsAwarded}</p>
              )}
              {session.reveal && (
                <>
                  <p className="mt-4 text-sm text-white/75">Correct answer: {session.reveal.correctAnswer}</p>
                  <p className="mt-2 text-sm text-white/75">{session.reveal.explanation}</p>
                </>
              )}
            </div>
          )}

          {session.status === 'leaderboard' && (
            <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#4cc9f0]">Leaderboard</p>
              <p className="mt-3 text-lg font-semibold">Current rank: {participantRank || '-'}</p>
              <p className="mt-2 text-sm text-white/75">
                Score: {ranking.find((entry) => entry.id === participant.id)?.score ?? 0}
              </p>
              <div className="mt-5 grid gap-3">
                {ranking.slice(0, 3).map((entry, index) => (
                  <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
                    <span>{index + 1}. {entry.nickname}</span>
                    <span>{entry.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {session.status === 'finished' && (
            <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#4cc9f0]">Finished</p>
              <p className="mt-3 text-lg font-semibold">Final rank: {participantRank || '-'}</p>
              <p className="mt-2 text-sm text-white/75">
                Final score: {ranking.find((entry) => entry.id === participant.id)?.score ?? 0}
              </p>
            </div>
          )}

          {errorMessage && (
            <p className="mt-4 text-sm text-[#fca5a5]">{errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  )
}
