"use client";
import { useState, useEffect } from "react";
import { genererRapportRecettes } from "@/lib/pdf";

export default function RecettesPage() {
  const [data, setData] = useState<any>({ paiements: [], totals: [], globalTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [etablissement, setEtablissement] = useState("CMA de Boromo");

  const fetchData = (deb = "", fin = "") => {
    setLoading(true);
    const params = new URLSearchParams();
    if (deb) params.set("date_debut", deb);
    if (fin) params.set("date_fin", fin);
    fetch(`/api/recettes?${params}`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  };

  useEffect(() => {
    fetchData();
    fetch("/api/settings").then(r => r.ok ? r.json() : null).then(s => { if (s?.etablissement_nom) setEtablissement(s.etablissement_nom); });
  }, []);

  const handleFilter = (e: React.FormEvent) => { e.preventDefault(); fetchData(dateDebut, dateFin); };

  const handleExportPDF = () => {
    genererRapportRecettes({ etablissement, paiements: data.paiements, totals: data.totals, globalTotal: data.globalTotal, dateDebut: dateDebut || undefined, dateFin: dateFin || undefined });
  };

  const typeLabel = (t: string) => t === "consultation" ? "Consultation" : t === "certificat" ? "Certificat" : t;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des recettes</h1>
        <p className="text-gray-500 text-sm mt-1">Suivi des paiements en FCFA</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card bg-primary-50 border-primary-100">
          <p className="text-sm text-primary-600">Total recettes</p>
          <p className="text-3xl font-bold text-primary-700 mt-1">{Number(data.globalTotal).toLocaleString()} FCFA</p>
        </div>
        {data.totals.map((t: any) => (
          <div key={t.type} className="card">
            <p className="text-sm text-gray-500">{typeLabel(t.type)}</p>
            <p className="text-2xl font-bold text-teal-600 mt-1">{Number(t.total).toLocaleString()} FCFA</p>
            <p className="text-xs text-gray-400 mt-1">{t.count} transaction(s)</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleFilter} className="mb-6 flex items-center gap-3 flex-wrap">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Du</label>
          <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="input-field w-auto" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Au</label>
          <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="input-field w-auto" />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary">Filtrer</button>
          <button type="button" onClick={() => { setDateDebut(""); setDateFin(""); fetchData(); }} className="btn-secondary">Tout afficher</button>
        </div>
        <button
          type="button"
          onClick={handleExportPDF}
          className="ml-auto flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Exporter PDF
        </button>
      </form>

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Date</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Patient</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Code</th>
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Type</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">Montant</th>
                </tr>
              </thead>
              <tbody>
                {data.paiements.map((p: any) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 text-gray-500">{new Date(p.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="py-3 px-3 font-medium">{p.patient_prenom} {p.patient_nom}</td>
                    <td className="py-3 px-3 font-mono text-xs text-primary-700">{p.patient_code}</td>
                    <td className="py-3 px-3">
                      <span className={p.type === "consultation" ? "badge-green" : "badge-blue"}>{typeLabel(p.type)}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-primary-700">{Number(p.montant).toLocaleString()} FCFA</td>
                  </tr>
                ))}
                {data.paiements.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400">Aucune recette trouvée</td></tr>
                )}
              </tbody>
              {data.paiements.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-primary-50">
                    <td colSpan={4} className="py-3 px-3 font-semibold text-primary-800">Total</td>
                    <td className="py-3 px-3 text-right font-bold text-primary-800 text-base">{Number(data.globalTotal).toLocaleString()} FCFA</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
