import { useEffect } from 'react'
import { SettingsBar } from './components/SettingsBar'
import { PdfPanel } from './components/PdfPanel'
import { DictionaryPanel } from './components/DictionaryPanel'
import { TopMenu } from './components/TopMenu'
import { DashboardView } from './components/DashboardView'
import { AuthGate } from './components/AuthGate'
import { WordBankView } from './components/WordBankView'
import { QuizBuilderView } from './components/QuizBuilderView'
import { useAppStore } from './store/useAppStore'

export default function App() {
  const { settings, activeView, currentUser } = useAppStore()

  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [settings.theme])

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
