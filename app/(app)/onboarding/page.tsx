import { redirect } from "next/navigation";
// Route har flyttats till (onboarding)/onboarding för helskärmslayout
export default function OldOnboardingPage() {
  redirect("/onboarding");
}
