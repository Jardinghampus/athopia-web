export type DashTeam = {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

export type DashArticle = {
  id: string
  title: string
  slug: string
  summary: string | null
  image_url: string | null
  published_at: string
}

export type DashThread = {
  id: string
  title: string
  reply_count: number
  view_count: number
  created_at: string
}

export type DashStanding = {
  position: number
  team_name: string
  team_slug: string
  played: number
  points: number
  goal_diff: number
}

export type DashStatPoint = {
  label: string
  goals_for: number
  goals_against: number
}
