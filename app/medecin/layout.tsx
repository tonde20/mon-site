import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import MedecinSidebarWrapper from "./MedecinSidebarWrapper";

export default function MedecinLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session || session.role !== "medecin") redirect("/login");

  const db = getDb();
  const settings = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const settingsMap: Record<string, string> = {};
  settings.forEach(s => { settingsMap[s.key] = s.value; });
  const etablissement = settingsMap.etablissement_nom || "CMA de Boromo";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MedecinSidebarWrapper userName={session.nom} etablissement={etablissement} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
