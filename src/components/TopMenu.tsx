import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { getUiCopy, levelLabel } from '../lib/i18n'
import type { AppView } from '../types/dictionary'

function BoltIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  )
}

interface MenuButtonProps {
  active: boolean
  onClick: () => void
  children: string
}

function MenuButton({ active, onClick, children }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-xs font-mono uppercase tracking-widest border transition-colors ${
        active
          ? 'border-[#2563eb] bg-[#2563eb] text-white'
          : 'border-[#0f0f0f]/20 dark:border-[#f5f5f0]/25 text-[#0f0f0f] dark:text-[#f5f5f0] hover:border-[#2563eb] hover:text-[#2563eb]'
      }`}
    >
      {children}
    </button>
  )
}

export function TopMenu() {
  const [userOpen, setUserOpen] = useState(false)
  const {
    selectedLanguage,
    activeView,
    currentUser,
    setActiveView,
    signOutLocally,
  } = useAppStore()

  const copy = getUiCopy(selectedLanguage)

  const onNavigate = (view: AppView) => {
    setUserOpen(false)
    setActiveView(view)
  }

  return (
    <header className="relative border-b border-[#0f0f0f]/15 dark:border-[#f5f5f0]/15 bg-[#f5f5f0]/95 dark:bg-[#0f0f0f]/95 backdrop-blur-sm">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <button
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-2 text-[#0f0f0f] dark:text-[#f5f5f0] hover:text-[#2563eb] transition-colors"
        >
          <span className="inline-flex items-center justify-center w-7 h-7 border border-[#2563eb] text-[#2563eb]">
            <BoltIcon />
          </span>
          <span className="text-sm font-semibold tracking-wide">{copy.appName}</span>
        </button>

        <nav className="flex items-center gap-2">
          <MenuButton active={activeView === 'reader'} onClick={() => onNavigate('reader')}>
            {copy.reader}
          </MenuButton>
          <MenuButton active={activeView === 'wordbank'} onClick={() => onNavigate('wordbank')}>
            {copy.wordBank}
          </MenuButton>
        </nav>

        <div className="relative">
          <button
            onClick={() => setUserOpen((v) => !v)}
            className="px-3 py-2 border border-[#0f0f0f]/25 dark:border-[#f5f5f0]/25 text-xs font-mono uppercase tracking-widest text-[#0f0f0f] dark:text-[#f5f5f0] hover:border-[#2563eb] hover:text-[#2563eb] transition-colors"
          >
            {currentUser?.username ?? copy.user}
          </button>

          {userOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] min-w-[200px] bg-[#f5f5f0] dark:bg-[#101010] border border-[#0f0f0f]/20 dark:border-[#f5f5f0]/20 p-2 z-40 shadow-[0_8px_18px_rgba(0,0,0,0.14)]">
              <p className="text-[10px] font-mono uppercase tracking-widest opacity-50 px-2 py-1 dark:text-[#f5f5f0]">
                {levelLabel(currentUser?.readingLevel ?? 'beginner', selectedLanguage)}
              </p>
              <button
                onClick={() => {
                  signOutLocally()
                  setUserOpen(false)
                }}
                className="w-full text-left px-2 py-2 text-xs font-mono uppercase tracking-widest text-[#0f0f0f] dark:text-[#f5f5f0] hover:bg-[#2563eb] hover:text-white transition-colors"
              >
                {copy.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
