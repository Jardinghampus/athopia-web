'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { GamificationState } from '@/lib/gamification/types'

export function useGamification(): GamificationState {
  const { user, isLoaded } = useUser()
  const [state, setState] = useState<GamificationState>({
    league: null,
    iq: null,
    currentRoundRing: null,
    streak: null,
    recentCards: [],
    badges: [],
    isLoading: true,
  })

  useEffect(() => {
    if (!isLoaded || !user) {
      setState(prev => ({ ...prev, isLoading: false }))
      return
    }

    const supabase = createClient()

    async function fetchAll() {
      const [league, iq, streak, cards, badges] = await Promise.all([
        supabase
          .from('user_league_memberships')
          .select('*, fan_leagues(*)')
          .eq('clerk_user_id', user!.id)
          .single(),
        supabase
          .from('user_football_iq')
          .select('*')
          .eq('clerk_user_id', user!.id)
          .single(),
        supabase
          .from('user_season_streak')
          .select('*')
          .eq('clerk_user_id', user!.id)
          .single(),
        supabase
          .from('match_cards')
          .select('*')
          .eq('clerk_user_id', user!.id)
          .order('match_date', { ascending: false })
          .limit(5),
        supabase
          .from('user_badges')
          .select('*')
          .eq('clerk_user_id', user!.id)
          .order('earned_at', { ascending: false }),
      ])

      const { data: activeRound } = await (supabase as any)
        .from('match_rounds')
        .select('*')
        .eq('is_active', true)
        .single()

      let currentRoundRing = null
      if (activeRound) {
        const { data: ring } = await (supabase as any)
          .from('round_ring_progress')
          .select('*')
          .eq('clerk_user_id', user!.id)
          .eq('round_id', activeRound.id)
          .single()
        currentRoundRing = ring
          ? { ...(ring as any), round_number: activeRound.round_number }
          : {
              round_id: activeRound.id,
              round_number: activeRound.round_number,
              read_match_report: false,
              read_statistics: false,
              read_preview: false,
              ring_completed: false,
              completed_at: null,
            }
      }

      setState({
        league: league.data as any,
        iq: iq.data as any,
        currentRoundRing,
        streak: streak.data as any,
        recentCards: cards.data ?? [],
        badges: badges.data ?? [],
        isLoading: false,
      })
    }

    fetchAll()

    const channel = supabase
      .channel('gamification')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_football_iq',
        filter: `clerk_user_id=eq.${user.id}`,
      }, (payload) => {
        setState(prev => ({ ...prev, iq: payload.new as any }))
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'match_cards',
        filter: `clerk_user_id=eq.${user.id}`,
      }, () => fetchAll())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, isLoaded])

  return state
}
