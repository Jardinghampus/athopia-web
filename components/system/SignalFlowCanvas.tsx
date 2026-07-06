'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ACTIVE_EDGES,
  LAYER_COLORS,
  LAYER_LABELS,
  SYSTEM_NODES,
  type SystemNode,
} from '@/lib/system/architecture-map'

interface Particle {
  edgeIdx: number
  t: number
  speed: number
}

function nodeAt(nodes: SystemNode[], id: string) {
  return nodes.find((n) => n.id === id)!
}

export function SignalFlowCanvas({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const sizeRef = useRef({ w: 800, h: 500 })

  const initParticles = useCallback(() => {
    particlesRef.current = ACTIVE_EDGES.flatMap((_, i) =>
      Array.from({ length: 2 }, () => ({
        edgeIdx: i,
        t: Math.random(),
        speed: 0.002 + Math.random() * 0.003,
      }))
    )
  }, [])

  useEffect(() => {
    initParticles()
  }, [initParticles])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      sizeRef.current = { w: rect.width, h: rect.height }
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const draw = () => {
      const { w, h } = sizeRef.current
      ctx.clearRect(0, 0, w, h)

      // subtle grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      for (let i = 1; i < 4; i++) {
        const x = (w * i) / 4
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }

      // layer labels
      ctx.font = '10px system-ui,sans-serif'
      ctx.fillStyle = 'rgba(161,161,170,0.6)'
      const layers = [
        { x: 0.08, label: 'Ingest' },
        { x: 0.28, label: 'OS' },
        { x: 0.52, label: 'DB' },
        { x: 0.78, label: 'Web' },
      ]
      for (const l of layers) {
        ctx.fillText(l.label, l.x * w - 16, 18)
      }

      // edges
      for (let i = 0; i < ACTIVE_EDGES.length; i++) {
        const e = ACTIVE_EDGES[i]
        const a = nodeAt(SYSTEM_NODES, e.from)
        const b = nodeAt(SYSTEM_NODES, e.to)
        const ax = a.x * w
        const ay = a.y * h
        const bx = b.x * w
        const by = b.y * h
        const mx = (ax + bx) / 2
        const my = (ay + by) / 2 - 30

        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.quadraticCurveTo(mx, my, bx, by)
        ctx.strokeStyle = `hsla(${e.hue ?? 145}, 60%, 45%, 0.25)`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // particles
      for (const p of particlesRef.current) {
        p.t += p.speed
        if (p.t > 1) p.t -= 1
        const e = ACTIVE_EDGES[p.edgeIdx]
        const a = nodeAt(SYSTEM_NODES, e.from)
        const b = nodeAt(SYSTEM_NODES, e.to)
        const ax = a.x * w
        const ay = a.y * h
        const bx = b.x * w
        const by = b.y * h
        const mx = (ax + bx) / 2
        const my = (ay + by) / 2 - 30
        const t = p.t
        const px = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * mx + t * t * bx
        const py = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * my + t * t * by

        ctx.beginPath()
        ctx.arc(px, py, 3, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${e.hue ?? 145}, 80%, 60%, 0.9)`
        ctx.fill()
      }

      // nodes
      for (const n of SYSTEM_NODES) {
        const nx = n.x * w
        const ny = n.y * h
        const r = n.id === 'supabase' ? 28 : 22
        const active = selectedId === n.id || hoverId === n.id
        const color = LAYER_COLORS[n.layer]

        ctx.beginPath()
        ctx.arc(nx, ny, r + (active ? 6 : 0), 0, Math.PI * 2)
        ctx.fillStyle = active ? `${color}33` : 'transparent'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(nx, ny, r, 0, Math.PI * 2)
        ctx.fillStyle = '#18181b'
        ctx.fill()
        ctx.strokeStyle = active ? color : `${color}99`
        ctx.lineWidth = active ? 2.5 : 1.5
        ctx.stroke()

        ctx.font = `600 ${n.id === 'supabase' ? 11 : 10}px system-ui,sans-serif`
        ctx.fillStyle = active ? '#fff' : '#e4e4e7'
        ctx.textAlign = 'center'
        ctx.fillText(n.short, nx, ny + 4)
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [selectedId, hoverId])

  const hitTest = (clientX: number, clientY: number) => {
    const wrap = wrapRef.current
    if (!wrap) return null
    const rect = wrap.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const w = rect.width
    const h = rect.height

    for (const n of [...SYSTEM_NODES].reverse()) {
      const nx = n.x * w
      const ny = n.y * h
      const r = n.id === 'supabase' ? 28 : 22
      if ((x - nx) ** 2 + (y - ny) ** 2 <= (r + 8) ** 2) return n.id
    }
    return null
  }

  return (
    <div
      ref={wrapRef}
      className="relative w-full aspect-[16/10] min-h-[320px] rounded-2xl border border-border bg-zinc-950 overflow-hidden cursor-crosshair"
      onClick={(e) => {
        const id = hitTest(e.clientX, e.clientY)
        onSelect(id === selectedId ? null : id)
      }}
      onMouseMove={(e) => setHoverId(hitTest(e.clientX, e.clientY))}
      onMouseLeave={() => setHoverId(null)}
    >
      <canvas ref={canvasRef} className="absolute inset-0" aria-hidden />
      <p className="absolute bottom-3 left-3 text-[10px] text-zinc-500 pointer-events-none">
        Klicka en nod · Signaler animeras längs pipelinen
      </p>
    </div>
  )
}

export function NodeDetailPanel({
  nodeId,
  onClose,
}: {
  nodeId: string | null
  onClose: () => void
}) {
  if (!nodeId) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        Välj en nod i kartan för att se repo, filer och var AI ska felsöka.
      </div>
    )
  }

  const node = SYSTEM_NODES.find((n) => n.id === nodeId)
  if (!node) return null

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 animate-in fade-in duration-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className="text-[10px] font-bold uppercase tracking-wide"
            style={{ color: LAYER_COLORS[node.layer] }}
          >
            {LAYER_LABELS[node.layer]} · {node.repo}
          </span>
          <h2 className="text-lg font-semibold text-foreground mt-1">{node.label}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Stäng
        </button>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{node.description}</p>

      {node.aiEntry && (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2 text-xs text-amber-200/90">
          <strong className="text-amber-400">AI fix:</strong> {node.aiEntry}
        </div>
      )}

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Nyckelfiler
        </p>
        <ul className="space-y-1">
          {node.files.map((f) => (
            <li key={f} className="font-mono text-xs text-pitch/90">
              {f}
            </li>
          ))}
        </ul>
      </div>

      {node.docSlug && (
        <a
          href={`/system/docs/${node.docSlug}`}
          className="inline-flex text-sm font-medium text-pitch hover:underline"
        >
          Läs fullständig feature-doc →
        </a>
      )}
    </div>
  )
}
