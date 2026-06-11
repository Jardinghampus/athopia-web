import { redirect } from "next/navigation";

// /priser → vidarebefordra till /prenumerera (befintlig prissida)
export default function PriserPage() {
  redirect("/prenumerera");
}
