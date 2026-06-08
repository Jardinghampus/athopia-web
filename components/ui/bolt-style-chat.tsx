'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Plus, Lightbulb, Paperclip, Image, FileCode,
  ChevronDown, Check, Sparkles, Zap, Brain, Bolt,
  SendHorizontal, BarChart2, MessageSquare
} from 'lucide-react'

const PITCH = '#1D9E75'
const PITCH_RGB = '29, 158, 117'

interface Model {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  badge?: string
}

const models: Model[] = [
  { id: 'snabb', name: 'Snabb', description: 'Daglig briefing', icon: <Zap className="size-4 text-pitch-light" />, badge: 'Standard' },
  { id: 'djup', name: 'Djupanalys', description: 'Athletic-stil', icon: <Sparkles className="size-4 text-emerald-400" />, badge: 'PRO' },
  { id: 'statistik', name: 'Statistik', description: 'xG & data', icon: <BarChart2 className="size-4 text-cyan-400" /> },
  { id: 'forum', name: 'Forum', description: 'Lagdiskussion', icon: <MessageSquare className="size-4 text-purple-400" /> },
  { id: 'podcast', name: 'Podcast', description: 'Transkript & sök', icon: <Brain className="size-4 text-amber-400" /> },
]

function ModelSelector({ selectedModel = 'snabb', onModelChange }: {
  selectedModel?: string
  onModelChange?: (model: Model) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState(models.find(m => m.id === selectedModel) || models[0])

  const handleSelect = (model: Model) => {
    setSelected(model)
    setIsOpen(false)
    onModelChange?.(model)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 text-[#8a8a8f] hover:text-white hover:bg-white/5 active:scale-95"
      >
        {selected.icon}
        <span>{selected.name}</span>
        <ChevronDown className={`size-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 z-50 min-w-[220px] bg-[#1a1a1e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="p-1.5">
              <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#5a5a5f]">
                Välj läge
              </div>
              {models.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleSelect(model)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-all duration-150 ${
                    selected.id === model.id ? 'bg-white/10 text-white' : 'text-[#a0a0a5] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex-shrink-0">{model.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{model.name}</span>
                      {model.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          model.badge === 'PRO' ? 'bg-purple-500/20 text-purple-300' : 'bg-pitch/20 text-pitch-light'
                        }`}>
                          {model.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#6a6a6f]">{model.description}</span>
                  </div>
                  {selected.id === model.id && <Check className="size-4 text-pitch-light flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ChatInput({ onSend, placeholder = "Vad vill du veta om Allsvenskan?" }: {
  onSend?: (message: string) => void
  placeholder?: string
}) {
  const [message, setMessage] = useState('')
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [message])

  const handleSubmit = () => {
    if (message.trim()) {
      onSend?.(message)
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="relative w-full max-w-[680px] mx-auto">
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
      <div className="relative rounded-2xl bg-[#1e1e22] ring-1 ring-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_2px_20px_rgba(0,0,0,0.4)]">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full resize-none bg-transparent text-[15px] text-white placeholder-[#5a5a5f] px-5 pt-5 pb-3 focus:outline-none min-h-[80px] max-h-[200px]"
            style={{ height: '80px' }}
          />
        </div>

        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="flex items-center justify-center size-8 rounded-full bg-white/[0.08] hover:bg-white/[0.12] text-[#8a8a8f] hover:text-white transition-all duration-200 active:scale-95"
              >
                <Plus className={`size-4 transition-transform duration-200 ${showAttachMenu ? 'rotate-45' : ''}`} />
              </button>

              {showAttachMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
                  <div className="absolute bottom-full left-0 mb-2 z-50 bg-[#1a1a1e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="p-1.5 min-w-[180px]">
                      {[
                        { icon: <Paperclip className="size-4" />, label: 'Ladda upp fil' },
                        { icon: <Image className="size-4" />, label: 'Lägg till bild' },
                        { icon: <FileCode className="size-4" />, label: 'Importera data' },
                      ].map((item, i) => (
                        <button key={i} type="button" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#a0a0a5] hover:bg-white/5 hover:text-white transition-all duration-150">
                          {item.icon}
                          <span className="text-sm">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <ModelSelector />
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-[#6a6a6f] hover:text-white hover:bg-white/5 transition-all duration-200">
              <Lightbulb className="size-4" />
              <span className="hidden sm:inline">Planera</span>
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!message.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-[0_0_20px_rgba(29,158,117,0.3)]"
              style={{ backgroundColor: PITCH }}
            >
              <span className="hidden sm:inline">Fråga AI</span>
              <SendHorizontal className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RayBackground() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
      <div className="absolute inset-0 bg-[#0f0f0f]" />
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[4000px] h-[1800px] sm:w-[6000px]"
        style={{
          background: `radial-gradient(circle at center 800px, rgba(${PITCH_RGB}, 0.8) 0%, rgba(${PITCH_RGB}, 0.35) 14%, rgba(${PITCH_RGB}, 0.18) 18%, rgba(${PITCH_RGB}, 0.08) 22%, rgba(17, 17, 20, 0.2) 25%)`,
        }}
      />
      <div
        className="absolute top-[175px] left-1/2 w-[1600px] h-[1600px] sm:top-1/2 sm:w-[3043px] sm:h-[2865px]"
        style={{ transform: 'translate(-50%) rotate(180deg)' }}
      >
        <div className="absolute w-full h-full rounded-full -mt-[13px]" style={{ background: 'radial-gradient(43.89% 25.74% at 50.02% 97.24%, #111114 0%, #0f0f0f 100%)', border: '16px solid white', transform: 'rotate(180deg)', zIndex: 5 }} />
        <div className="absolute w-full h-full rounded-full bg-[#0f0f0f] -mt-[11px]" style={{ border: '23px solid #a8e6cf', transform: 'rotate(180deg)', zIndex: 4 }} />
        <div className="absolute w-full h-full rounded-full bg-[#0f0f0f] -mt-[8px]" style={{ border: '23px solid #6dd4a8', transform: 'rotate(180deg)', zIndex: 3 }} />
        <div className="absolute w-full h-full rounded-full bg-[#0f0f0f] -mt-[4px]" style={{ border: '23px solid #3dbd85', transform: 'rotate(180deg)', zIndex: 2 }} />
        <div className="absolute w-full h-full rounded-full bg-[#0f0f0f]" style={{ border: '20px solid #158A63', boxShadow: `0 -15px 24.8px rgba(${PITCH_RGB}, 0.6)`, transform: 'rotate(180deg)', zIndex: 1 }} />
      </div>
    </div>
  )
}

function AnnouncementBadge({ text, href = "#" }: { text: string; href?: string }) {
  const content = (
    <>
      <span className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none opacity-70 mix-blend-overlay" style={{ background: 'radial-gradient(ellipse at center top, rgba(255, 255, 255, 0.15) 0%, transparent 70%)' }} />
      <span className="absolute -top-px left-1/2 -translate-x-1/2 h-[2px] w-[100px] opacity-60" style={{ background: `linear-gradient(90deg, transparent 0%, rgba(${PITCH_RGB}, 0.8) 20%, rgba(37, 200, 143, 0.8) 50%, rgba(29, 158, 117, 0.8) 80%, transparent 100%)`, filter: 'blur(0.5px)' }} />
      <Bolt className="size-4 relative z-10 text-white" />
      <span className="relative z-10 text-white font-medium">{text}</span>
    </>
  )

  const className = "relative inline-flex items-center gap-2 px-5 py-2 min-h-[40px] rounded-full text-sm overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
  const style = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
    backdropFilter: 'blur(20px) saturate(140%)',
    boxShadow: 'inset 0 1px rgba(255,255,255,0.2), inset 0 -1px rgba(0,0,0,0.1), 0 8px 32px -8px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.08)',
  }

  return href !== '#' ? (
    <a href={href} className={className} style={style}>{content}</a>
  ) : (
    <button type="button" className={className} style={style}>{content}</button>
  )
}

function ImportButtons({ onImport }: { onImport?: (source: string) => void }) {
  return (
    <div className="flex items-center gap-4 justify-center flex-wrap">
      <span className="text-sm text-[#6a6a6f]">eller välj ditt lag</span>
      <div className="flex gap-2 flex-wrap justify-center">
        {[
          { id: 'aik', name: 'AIK' },
          { id: 'hammarby', name: 'Hammarby' },
          { id: 'malmo', name: 'Malmö FF' },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onImport?.(option.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 bg-[#0f0f0f] hover:bg-[#1a1a1e] text-[#8a8a8f] hover:text-white transition-all duration-200 active:scale-95"
          >
            <span>{option.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface BoltChatProps {
  title?: string
  subtitle?: string
  announcementText?: string
  announcementHref?: string
  placeholder?: string
  onSend?: (message: string) => void
  onImport?: (source: string) => void
  children?: React.ReactNode
}

export function BoltStyleChat({
  title = "Vad vill du",
  subtitle = "Nyheter, AI-sammanfattningar, statistik och forum — allt om Allsvenskan.",
  announcementText = "Nytt: AI-briefing kl 07:00 & 18:00",
  announcementHref = "#features",
  placeholder = "Vad vill du veta om Allsvenskan?",
  onSend,
  onImport,
  children,
}: BoltChatProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden bg-[#0f0f0f]">
      <RayBackground />
      {children}
      <div className="absolute top-[70px] z-20">
        <AnnouncementBadge text={announcementText} href={announcementHref} />
      </div>
      <div className="absolute top-[66%] left-1/2 sm:top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-full h-full overflow-hidden px-4 z-10">
        <div className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-1">
            {title}{' '}
            <span
              className="bg-clip-text text-transparent italic"
              style={{
                backgroundImage: `linear-gradient(to bottom, #25C48F, #1D9E75, white)`,
              }}
            >
              följa
            </span>
            {' '}idag?
          </h1>
          <p className="text-base font-semibold sm:text-lg text-[#8a8a8f]">{subtitle}</p>
        </div>

        <div className="w-full max-w-[700px] mb-6 sm:mb-8 mt-2">
          <ChatInput placeholder={placeholder} onSend={onSend} />
        </div>

        <ImportButtons onImport={onImport} />
      </div>
    </div>
  )
}
