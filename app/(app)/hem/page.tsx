import { redirect } from "next/navigation";

// Liga-översikten bor nu på /allsvenskan (nav: Mitt lag / Allsvenskan / Matcher / Mer).
// /hem behålls som alias för gamla bokmärken och inlänkar.
export default function HemPage() {
  redirect("/allsvenskan");
}
