import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default function Home() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");
  if (session.role === "medecin") redirect("/medecin");
  if (session.role === "patient") redirect("/patient");
  redirect("/login");
}
