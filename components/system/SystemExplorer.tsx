'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Cpu, Database, Radio } from 'lucide-react'
import { NodeDetailPanel, SignalFlowCanvas } from '@/components/system/SignalFlowCanvas'
import { FEATURE_DOCS } from '@/lib/system/architecture-map'

export function SystemExplorer() {
  const [selectedId, setSelectedId] = useState<string | null>('supabase')

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-pitch text-xs font-semibold uppercase tracking-wide">
          <Radio className="h-4 w-4" />
          Athopia System
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
          Så rör sig signalerna
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Från RSS och Sportmonks via athopia-os till Supabase — och ut till feed, brief och match.
          Klicka en nod för ritning, filer och var en AI-agent ska börja felsöka.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <SignalFlowCanvas selectedId={selectedId} onSelect={setSelectedId} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { icon: Radio, label: 'Ingest', color: '#378ADD' },
              { icon: Cpu, label: 'athopia-os', color: '#BA7517' },
              { icon: Database, label: 'Supabase', color: '#1D9E75' },
              { icon: BookOpen, label: 'athopia-web', color: '#7F77DD' },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="rounded-lg border border-border/60 bg-card/50 px-3 py-2"
              >
                <Icon className="h-4 w-4 mx-auto mb-1" style={{ color }} />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <NodeDetailPanel nodeId={selectedId} onClose={() => setSelectedId(null)} />

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Feature-docs
            </h3>
            <ul className="space-y-2">
              {Object.values(FEATURE_DOCS).map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/system/docs/${d.slug}`}
                    className="text-sm text-foreground/90 hover:text-pitch transition-colors"
                  >
                    {d.title}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/system/docs"
              className="mt-3 inline-block text-xs text-pitch hover:underline"
            >
              All dokumentation →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
