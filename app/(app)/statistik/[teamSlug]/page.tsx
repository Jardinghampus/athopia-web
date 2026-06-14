import { redirect } from "next/navigation";

export default async function StatistikTeamRedirect({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  redirect(`/lag/${teamSlug}/statistik`);
}
