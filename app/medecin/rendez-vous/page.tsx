"use client";
import { useState, useEffect } from "react";

const STATUTS = { en_attente: "En attente", confirme: "Confirmé", annule: "Annulé", effectue: "Effectué" };
const STATUT_COLORS: Record<string, string> = {
  en_attente: "badge-yellow", confirme: "badge-green", annule: "badge-red", effectue: "badge-blue"
};

export default function MedecinRendezVousPage() {
  const [rdvs, setRdvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRdvs = () => {
    setLoading(true);
    fetch("/api/rendez-vous").then(r => r.json()).then(d => { setRdvs(d); setLoading(false); });
  };

  useEffect(() => { fetchRdvs(); }, []);

  const handleStatutChange = async (id: number, statut: string) => {
    await fetch(`/api/rendez-vous/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    fetchRdvs();
  };

  const groupedRdvs = rdvs.reduce((acc: Record<string, any[]>, rdv) => {
    const date = new Date(rdv.date_heure).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    if (!acc[date]) acc[date] = [];
    acc[date].push(rdv);
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Mes rendez-vous</h1>
        <p className="text-gray-500 text-sm mt-1">{rdvs.length} rendez-vous enregistré(s)</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Chargement...</div>
      ) : Object.keys(groupedRdvs).length === 0 ? (
        <div className="card text-center py-12 text-gray-400">Aucun rendez-vous programmé</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedRdvs).map(([date, rdvsDate]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{date}</h2>
              <div className="space-y-3">
                {rdvsDate.map((rdv: any) => (
                  <div key={rdv.id} className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-gray-800">
                            {new Date(rdv.date_heure).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className={STATUT_COLORS[rdv.statut]}>{STATUTS[rdv.statut as keyof typeof STATUTS]}</span>
                        </div>
                        <p className="text-sm text-gray-700">{rdv.patient_prenom} {rdv.patient_nom} <span className="text-primary-700 font-mono text-xs">({rdv.patient_code})</span></p>
                        {rdv.motif && <p className="text-xs text-gray-500 mt-0.5">{rdv.motif}</p>}
                      </div>
                      <div className="flex gap-2">
                        {rdv.statut === "en_attente" && (
                          <>
                            <button onClick={() => handleStatutChange(rdv.id, "confirme")} className="btn-primary text-xs py-1.5 px-3">Confirmer</button>
                            <button onClick={() => handleStatutChange(rdv.id, "annule")} className="btn-danger text-xs py-1.5 px-3">Annuler</button>
                          </>
                        )}
                        {rdv.statut === "confirme" && (
                          <button onClick={() => handleStatutChange(rdv.id, "effectue")} className="btn-secondary text-xs py-1.5 px-3">Marquer effectué</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
