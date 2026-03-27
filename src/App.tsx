import { useEffect, useState } from 'react'
import { SettingsBar } from './components/SettingsBar'
import { PdfPanel } from './components/PdfPanel'
import { DictionaryPanel } from './components/DictionaryPanel'
import { TopMenu } from './components/TopMenu'
import { DashboardView } from './components/DashboardView'
import { AuthGate } from './components/AuthGate'
import { WordBankView } from './components/WordBankView'
import { QuizBuilderView } from './components/QuizBuilderView'
import { HostSessionView } from './components/HostSessionView'
import { JoinSessionView } from './components/JoinSessionView'
import { PlaySessionView } from './components/PlaySessionView'
import { useAppStore } from './store/useAppStore'

function getHashRoute() {
  if (typeof window === 'undefined') return ''
  return window.location.hash.replace(/^#/, '')
}

export default function App() {
  const { settings, activeView, currentUser } = useAppStore()
  const [hashRoute, setHashRoute] = useState(getHashRoute)

  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [settings.theme])

  useEffect(() => {
    const onHashChange = () => setHashRoute(getHashRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (hashRoute.startsWith('/join/')) {
    const sessionId = hashRoute.replace('/join/', '')
    return <JoinSessionView sessionId={sessionId} />
  }

  if (hashRoute.startsWith('/play/')) {
    const sessionId = hashRoute.replace('/play/', '')
    return <PlaySessionView sessionId={sessionId} />
  }

  if (hashRoute.startsWith('/session/')) {
    const sessionId = hashRoute.replace('/session/', '')

    if (!currentUser) {
      return <AuthGate />
    }

    return <HostSessionView sessionId={sessionId} />
  }

  if (!currentUser) {
    return <AuthGate />
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f5f5f0] dark:bg-[#0f0f0f]">
      <TopMenu />

      {activeView === 'dashboard' && <DashboardView />}

      {activeView === 'reader' && (
        <>
          <SettingsBar />
          <div className="flex flex-1 overflow-hidden flex-col sm:flex-row">
            <div className="sm:w-[55%] w-full flex flex-col overflow-hidden">
              <PdfPanel />
            </div>

            <div className="sm:w-[45%] w-full flex flex-col overflow-hidden border-l border-[#0f0f0f] dark:border-[#2a2a2a]">
              <DictionaryPanel />
            </div>
          </div>
        </>
      )}

      {activeView === 'wordbank' && <WordBankView />}

      {activeView === 'quizbuilder' && <QuizBuilderView />}
    </div>
  )
}
