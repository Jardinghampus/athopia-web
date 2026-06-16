import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { CreateThreadForm } from "./CreateThreadForm";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

async function getTeamId(slug: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("entities")
      .select("id")
      .eq("slug", slug)
      .eq("type", "team")
      .single();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

export const dynamic = 'force-dynamic';

export default async function NyTraadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await currentUser();

  if (!user) {
    redirect(`/sign-in?redirect_url=/lag/${slug}/forum/ny`);
  }

  const teamId = await getTeamId(slug);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-bold text-3xl text-foreground mb-8">NY TRÅD</h1>
      <CreateThreadForm
        slug={slug}
        teamId={teamId ?? ""}
        authorId={user.id}
        authorName={user.fullName ?? user.username ?? "Anonym"}
      />
    </div>
  );
}
