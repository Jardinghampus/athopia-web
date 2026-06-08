export interface FanLeague {
  id: string
  team_slug: string
  team_name: string
  team_color: string
}

export interface UserLeagueMembership {
  id: string
  clerk_user_id: string
  league_id: string
  joined_at: string
  fan_leagues: FanLeague
}

export interface FootballIQ {
  iq_score: number
  weekly_iq: number
  weekly_rank: number | null
  league_rank: number | null
  articles_read: number
  articles_read_fully: number
  predictions_made: number
  predictions_correct: number
  matches_covered: number
}

export interface RoundRingProgress {
  round_id: string
  round_number: number
  read_match_report: boolean
  read_statistics: boolean
  read_preview: boolean
  ring_completed: boolean
  completed_at: string | null
}

export interface MatchCard {
  id: string
  match_id: string
  home_team: string
  away_team: string
  match_date: string
  prediction_outcome: 'home' | 'draw' | 'away' | null
  prediction_home_goals: number | null
  prediction_away_goals: number | null
  is_revealed: boolean
  outcome_correct: boolean | null
  score_correct: boolean | null
  is_rare_outcome: boolean
  badge_earned: string | null
  iq_points_earned: number
  actual_home_goals: number | null
  actual_away_goals: number | null
}

export interface SeasonStreak {
  current_streak: number
  longest_streak: number
  last_completed_round: number | null
  freeze_tokens: number
  freeze_used_rounds: number[]
}

export interface UserBadge {
  badge_slug: string
  badge_name: string
  badge_description: string
  earned_at: string
}

export interface GamificationState {
  league: UserLeagueMembership | null
  iq: FootballIQ | null
  currentRoundRing: RoundRingProgress | null
  streak: SeasonStreak | null
  recentCards: MatchCard[]
  badges: UserBadge[]
  isLoading: boolean
}

export const IQ_POINTS = {
  ARTICLE_READ_PARTIAL: 1,
  ARTICLE_READ_FULL: 3,
  PREDICTION_MADE: 2,
  PREDICTION_OUTCOME_CORRECT: 5,
  PREDICTION_SCORE_EXACT: 15,
  ROUND_RING_COMPLETE: 10,
} as const

export type ArticleType = 'match_report' | 'statistics' | 'preview' | 'summary'
