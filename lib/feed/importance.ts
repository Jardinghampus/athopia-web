export type ImportanceTier = 'breaking' | 'major' | 'normal' | 'noise'

export function mapImportanceTier(
  score: number | null,
  pushPriority?: string | null
): ImportanceTier | null {
  if (pushPriority === 'breaking') return 'breaking'
  if (score === null) return null
  if (score >= 0.85) return 'breaking'
  if (score >= 0.70) return 'major'
  if (score >= 0.50) return 'normal'
  return 'noise'
}
