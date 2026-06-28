/**
 * Backfill: embedda alla artiklar som saknas i embeddings-tabellen.
 * Kör: pnpm embed:articles
 * Idempotent — hoppar artiklar som redan har rader.
 */
import { createClient } from '@supabase/supabase-js'
import { chunk, embedChunks } from '../lib/ai/embedding'

const BATCH = 20

async function main() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Hämta redan embeddade article-IDs
  const { data: done_ids } = await db
    .from('embeddings')
    .select('content_id')
    .eq('content_type', 'article')
  const embedded = new Set((done_ids ?? []).map((r: { content_id: string }) => r.content_id))

  const { data: articles, error } = await db
    .from('articles')
    .select('id, title, summary, content')
    .eq('sport', 'football')

  if (error) { console.error(error); process.exit(1) }
  const pending = (articles ?? []).filter(a => !embedded.has(a.id))
  if (!pending.length) { console.log('Alla artiklar är redan embeddade.'); return }
  // rebind so the loop below works unchanged
  const articlesToEmbed = pending

  console.log(`Embeddar ${articlesToEmbed.length} artiklar i batchar om ${BATCH}…`)

  let done = 0
  for (let i = 0; i < articlesToEmbed.length; i += BATCH) {
    const batch = articlesToEmbed.slice(i, i + BATCH)
    for (const article of batch) {
      const text = [article.title, article.summary, article.content].filter(Boolean).join('\n\n')
      const chunks = chunk(text)
      const embedded = await embedChunks(chunks)
      const rows = embedded.map((e, idx) => ({
        content_type: 'article',
        content_id: article.id,
        chunk_index: idx,
        chunk_text: e.chunk,
        embedding: e.embedding,
        model: 'text-embedding-3-small',
      }))
      const { error: insertErr } = await db.from('embeddings').insert(rows)
      if (insertErr) console.error(`  ✗ ${article.id}: ${insertErr.message}`)
      else done++
    }
    console.log(`  ${done}/${articlesToEmbed.length} klara…`)
  }
  console.log(`✅ Backfill klar — ${done} artiklar embeddade.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
