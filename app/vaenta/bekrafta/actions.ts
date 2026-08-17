"use server";

import { redirect } from "next/navigation";
import { confirmWaitlistToken } from "@/lib/waitlist/confirm";

export async function confirmWaitlistAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const outcome = await confirmWaitlistToken(token);
  redirect(`/vaenta/bekrafta?done=${outcome}`);
}
