import { useEffect, useState } from 'react'
import { getSession, getParticipantByDevice, joinSession } from '../lib/appwriteQuizBackend'

export function JoinSessionView({ sessionId }: { sessionId: string }) {
  const [nickname, setNickname] = useState('')
  const [quizTitle, setQuizTitle] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [existingNickname, setExistingNickname] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [session, participant] = await Promise.all([
          getSession(sessionId),
          getParticipantByDevice(sessionId),
        ])

        if (cancelled) return
        setQuizTitle(session.quizTitle)
        if (participant) {
          setExistingNickname(participant.nickname)
          setNickname(participant.nickname)
        }
      } catch (error) {
        if (cancelled) return
        setErrorMessage(error instanceof Error ? error.message : 'Could not load session.')
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  const onJoin = async () => {
    if (!nickname.trim()) return

    setIsJoining(true)
    setErrorMessage(null)

    try {
      await joinSession(sessionId, nickname)
      window.location.hash = `/play/${sessionId}`
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not join session.')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f5f5f0] dark:bg-[#0f0f0f]">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md border border-[#0f0f0f]/20 dark:border-[#f5f5f0]/20 bg-[#f5f5f0]/88 dark:bg-[#0f0f0f]/82 p-6 sm:p-8">
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#2563eb] mb-2">
            Join Session
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold leading-tight text-[#0f0f0f] dark:text-[#f5f5f0]">
            {quizTitle || `Session ${sessionId}`}
          </h1>
          <p className="mt-3 text-sm text-[#0f0f0f]/70 dark:text-[#f5f5f0]/70">
            Enter a nickname to join the live quiz from your phone.
          </p>

          {existingNickname && (
            <p className="mt-3 text-sm text-[#166534] dark:text-[#86efac]">
              Returning player detected: {existingNickname}
            </p>
          )}

          <label className="mt-5 flex flex-col gap-2">
            <span className="text-xs font-mono uppercase tracking-widest opacity-60 dark:text-[#f5f5f0]">
              Your nickname
            </span>
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="Ada, Leo, Mia..."
              className="border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-3 py-3 text-sm"
            />
          </label>

          {errorMessage && (
            <p className="mt-4 text-sm text-[#b91c1c] dark:text-[#fca5a5]">{errorMessage}</p>
          )}

          <button
            type="button"
            onClick={onJoin}
            disabled={isJoining || !nickname.trim()}
            className="mt-5 w-full px-4 py-3 border border-[#2563eb] bg-[#2563eb] text-white text-xs font-mono uppercase tracking-widest disabled:opacity-60"
          >
            {isJoining ? 'Joining...' : 'Join ->'}
          </button>
        </div>
      </div>
    </div>
  )
}
