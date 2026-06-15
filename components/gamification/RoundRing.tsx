'use client'

import { motion } from 'motion/react'

interface RoundRingProps {
  readMatchReport: boolean
  readStatistics: boolean
  readPreview: boolean
  roundNumber: number
  size?: number
}

export function RoundRing({
  readMatchReport,
  readStatistics,
  readPreview,
  roundNumber,
  size = 80,
}: RoundRingProps) {
  const isComplete = readMatchReport && readStatistics && readPreview
  const completedCount = [readMatchReport, readStatistics, readPreview].filter(Boolean).length

  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 8
  const segmentGap = 4
  const segmentAngle = (360 - 3 * segmentGap) / 3

  const segments = [
    { label: 'Rapport', done: readMatchReport, startDeg: -90 },
    { label: 'Statistik', done: readStatistics, startDeg: -90 + segmentAngle + segmentGap },
    { label: 'Preview', done: readPreview, startDeg: -90 + 2 * (segmentAngle + segmentGap) },
  ]

  function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function arcPath(startDeg: number, endDeg: number, r: number) {
    const start = polarToCartesian(cx, cy, r, startDeg)
    const end = polarToCartesian(cx, cy, r, endDeg)
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="overflow-visible">
        {segments.map((seg, i) => (
          <path
            key={`bg-${i}`}
            d={arcPath(seg.startDeg, seg.startDeg + segmentAngle, r)}
            fill="none"
            stroke="#1f1f1f"
            strokeWidth={6}
            strokeLinecap="round"
          />
        ))}

        {segments.map((seg, i) => (
          <motion.path
            key={`fg-${i}`}
            d={arcPath(seg.startDeg, seg.startDeg + segmentAngle, r)}
            fill="none"
            stroke={seg.done ? 'var(--color-pitch)' : 'transparent'}
            strokeWidth={6}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: seg.done ? 1 : 0 }}
            transition={{ duration: 0.6, delay: i * 0.15, ease: 'easeOut' }}
          />
        ))}

        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill={isComplete ? 'var(--color-pitch)' : '#888'}
          fontSize={size * 0.18}
          fontWeight="700"
          fontFamily="monospace"
        >
          {completedCount}/3
        </text>
        <text
          x={cx}
          y={cy + size * 0.14}
          textAnchor="middle"
          fill="#555"
          fontSize={size * 0.12}
        >
          Omg {roundNumber}
        </text>
      </svg>

      {isComplete && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xs text-pitch font-semibold tracking-wider uppercase"
        >
          Ring stängd ✓
        </motion.span>
      )}
    </div>
  )
}
