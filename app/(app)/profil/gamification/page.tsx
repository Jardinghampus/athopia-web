export const dynamic = 'force-dynamic';
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { GamificationHub } from '@/components/gamification/GamificationHub'

export const metadata: Metadata = { title: 'Min statistik | Athopia' }

export default async function GamificationPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white mb-6">Din säsong</h1>
      <GamificationHub />
    </main>
  )
}
