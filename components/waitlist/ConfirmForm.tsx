import { confirmWaitlistAction } from "@/app/vaenta/bekrafta/actions";

export function ConfirmForm({ token }: { token: string }) {
  return (
    <form action={confirmWaitlistAction} className="mt-8">
      <input type="hidden" name="token" value={token} />
      <button
        type="submit"
        className="w-full rounded-md bg-pitch px-4 py-2.5 font-medium text-white sm:w-auto"
      >
        Bekräfta min plats
      </button>
    </form>
  );
}
