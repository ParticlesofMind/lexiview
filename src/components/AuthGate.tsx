import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAppStore } from '../store/useAppStore'
import { getUiCopy } from '../lib/i18n'

export function AuthGate() {
  const { selectedLanguage, signInLocally } = useAppStore()
  const [username, setUsername] = useState('')
  const copy = getUiCopy(selectedLanguage)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const clean = username.trim()
    if (!clean) return
    signInLocally(clean)
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_10%_10%,rgba(37,99,235,0.14),transparent_38%),radial-gradient(circle_at_90%_20%,rgba(15,15,15,0.1),transparent_42%),linear-gradient(145deg,#f7f6f0,#ece8dc)] dark:bg-[radial-gradient(circle_at_10%_10%,rgba(37,99,235,0.26),transparent_34%),radial-gradient(circle_at_90%_20%,rgba(245,245,240,0.12),transparent_42%),linear-gradient(145deg,#131313,#090909)] flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-xl border border-[#0f0f0f]/20 dark:border-[#f5f5f0]/25 bg-[#f5f5f0]/90 dark:bg-[#0f0f0f]/85 backdrop-blur-sm p-6 sm:p-8"
      >
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#0f0f0f] dark:text-[#f5f5f0] mb-2">
          {copy.signInTitle}
        </h1>
        <p className="text-sm leading-relaxed text-[#0f0f0f]/70 dark:text-[#f5f5f0]/70 mb-6">
          {copy.signInBody}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={24}
            className="flex-1 border border-[#0f0f0f]/30 dark:border-[#f5f5f0]/30 bg-transparent px-3 py-2 text-sm text-[#0f0f0f] dark:text-[#f5f5f0]"
            placeholder={copy.usernamePlaceholder}
          />
          <button
            type="submit"
            className="px-4 py-2 border border-[#2563eb] bg-[#2563eb] text-white text-xs font-mono uppercase tracking-widest hover:brightness-110 transition"
          >
            {copy.continueButton}
          </button>
        </div>
      </form>
    </div>
  )
}
