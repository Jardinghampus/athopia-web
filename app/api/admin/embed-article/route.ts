import { createClient } from '@supabase/supabase-js'
import { chunk, embedChunks } from '@/lib/ai/embedding'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: Request) {
  if (req.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) {
    return new Response('Forbidden', { status: 403 })
  }

  const { article_id } = await req.json()
  if (!article_id) return Response.json({ error: 'article_id krävs' }, { status: 400 })

  const db = getDb()
  const { data: article } = await db
    .from('articles')
    .select('id, title, content, summary')
    .eq('id', article_id)
    .single()

  if (!article) return Response.json({ error: 'Artikel ej hittad' }, { status: 404 })

  const text = [article.title, article.summary, article.content].filter(Boolean).join('\n\n')
  const chunks = chunk(text)
  const embedded = await embedChunks(chunks)

  // Delete old chunks first (idempotent re-embed)
  await db.from('embeddings').delete().eq('content_type', 'article').eq('content_id', article_id)

  const rows = embedded.map((e, i) => ({
    content_type: 'article',
    content_id: article_id,
    chunk_index: i,
    chunk_text: e.chunk,
    embedding: e.embedding,
    model: 'text-embedding-3-small',
  }))

  const { error } = await db.from('embeddings').insert(rows)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true, chunks: rows.length })
}
