import { getUserPlan } from "@/lib/user-plan";
import { canAccess } from "@/lib/access-rules";
import { ForumSummaryPopup } from "@/components/ForumSummaryPopup";

/** Visa global forum-digest-popup endast för PRO+ (annars FOMO-läcka). */
export async function ForumSummaryPopupGate() {
  const plan = await getUserPlan();
  if (!canAccess("forumSummary", plan)) return null;
  return <ForumSummaryPopup />;
}
