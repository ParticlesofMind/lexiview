import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'

export function SettingsBar() {
  const [expanded, setExpanded] = useState(false)
  const { settings, selectedLanguage, updateSettings, setSelectedLanguage } = useAppStore()

  const fontFamilyMap = {
    serif: '"Georgia", serif',
    sans: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
  }

  return (
    <div className="border-b border-[#0f0f0f] bg-[#f5f5f0] dark:bg-[#0f0f0f] dark:border-[#2a2a2a]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-mono uppercase tracking-widest text-[#0f0f0f] dark:text-[#f5f5f0] hover:bg-[#e8e8e0] dark:hover:bg-[#1a1a1a] transition-colors"
      >
        <span>LexiView</span>
        <span className="text-[10px]">{expanded ? '▲ Settings' : '▼ Settings'}</span>
      </button>

      <div
        className="overflow-hidden transition-all duration-150 ease-in-out"
        style={{ maxHeight: expanded ? '200px' : '0px' }}
      >
        <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs dark:text-[#f5f5f0]">
          {/* Font Size */}
          <label className="flex flex-col gap-1">
            <span className="font-mono uppercase tracking-wide opacity-60">Font size</span>
            <input
              type="range"
              min={12}
              max={24}
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
              className="accent-[#2563eb]"
            />
            <span className="opacity-60">{settings.fontSize}px</span>
          </label>

          {/* Line Height */}
          <label className="flex flex-col gap-1">
            <span className="font-mono uppercase tracking-wide opacity-60">Line height</span>
            <input
              type="range"
              min={120}
              max={220}
              value={Math.round(settings.lineHeight * 100)}
              onChange={(e) => updateSettings({ lineHeight: Number(e.target.value) / 100 })}
              className="accent-[#2563eb]"
            />
            <span className="opacity-60">{settings.lineHeight.toFixed(1)}</span>
          </label>

          {/* Letter Spacing */}
          <label className="flex flex-col gap-1">
            <span className="font-mono uppercase tracking-wide opacity-60">Letter spacing</span>
            <input
              type="range"
              min={-10}
              max={30}
              value={Math.round(settings.letterSpacing * 10)}
              onChange={(e) => updateSettings({ letterSpacing: Number(e.target.value) / 10 })}
              className="accent-[#2563eb]"
            />
            <span className="opacity-60">{settings.letterSpacing}px</span>
          </label>

          {/* Font Family */}
          <label className="flex flex-col gap-1">
            <span className="font-mono uppercase tracking-wide opacity-60">Font</span>
            <select
              value={settings.fontFamily}
              onChange={(e) =>
                updateSettings({ fontFamily: e.target.value as 'serif' | 'sans' | 'mono' })
              }
              className="border border-[#0f0f0f] dark:border-[#f5f5f0] bg-transparent px-1 py-0.5"
            >
              <option value="serif">Serif</option>
              <option value="sans">Sans</option>
              <option value="mono">Mono</option>
            </select>
          </label>

          {/* Language */}
          <label className="flex flex-col gap-1">
            <span className="font-mono uppercase tracking-wide opacity-60">Language</span>
            <select
              value={selectedLanguage}
              onChange={(e) =>
                setSelectedLanguage(e.target.value as 'en' | 'de' | 'auto')
              }
              className="border border-[#0f0f0f] dark:border-[#f5f5f0] bg-transparent px-1 py-0.5"
            >
              <option value="auto">Auto</option>
              <option value="en">EN</option>
              <option value="de">DE</option>
            </select>
          </label>

          {/* Theme */}
          <label className="flex flex-col gap-1">
            <span className="font-mono uppercase tracking-wide opacity-60">Theme</span>
            <button
              onClick={() =>
                updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' })
              }
              className="border border-[#0f0f0f] dark:border-[#f5f5f0] px-2 py-0.5 text-left hover:bg-[#2563eb] hover:text-white hover:border-[#2563eb] transition-colors"
            >
              {settings.theme === 'light' ? 'Light' : 'Dark'}
            </button>
          </label>
        </div>
      </div>

      {/* CSS vars injected inline on root via App.tsx */}
      <style>{`
        :root {
          --reader-font-size: ${settings.fontSize}px;
          --reader-line-height: ${settings.lineHeight};
          --reader-letter-spacing: ${settings.letterSpacing}px;
          --reader-font-family: ${fontFamilyMap[settings.fontFamily]};
        }
      `}</style>
    </div>
  )
}
