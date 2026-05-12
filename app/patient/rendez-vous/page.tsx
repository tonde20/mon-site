"use client";
import { useState, useEffect } from "react";

const STATUTS: Record<string, string> = { en_attente: "En attente", confirme: "Confirmé", annule: "Annulé", effectue: "Effectué" };
const STATUT_COLORS: Record<string, string> = { en_attente: "badge-yellow", confirme: "badge-green", annule: "badge-red", effectue: "badge-blue" };

export default function PatientRendezVous() {
  const [rdvs, setRdvs] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ doctor_id: "", date_heure: "", motif: "" });
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchAll = async () => {
    setLoading(true);
    const [rdvRes, docRes] = await Promise.all([fetch("/api/rendez-vous"), fetch("/api/doctors")]);
    if (rdvRes.ok) setRdvs(await rdvRes.json());
    if (docRes.ok) setDoctors(await docRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/rendez-vous", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMessage({ type: "success", text: "Rendez-vous demandé avec succès. Vous serez confirmé prochainement." });
      setShowForm(false);
      setForm({ doctor_id: "", date_heure: "", motif: "" });
      fetchAll();
    } else {
      setMessage({ type: "error", text: "Erreur lors de la prise de rendez-vous" });
    }
  };

  const minDate = new Date();
  minDate.setMinutes(minDate.getMinutes() + 30);
  const minDateStr = minDate.toISOString().slice(0, 16);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mes rendez-vous</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez vos rendez-vous médicaux</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Prendre un rendez-vous
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Demande de rendez-vous</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Choisir un médecin *</label>
                <select value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))} className="input-field" required>
                  <option value="">— Sélectionner un médecin —</option>
                  {doctors.filter(d => d.actif).map(d => (
                    <option key={d.id} value={d.id}>Dr. {d.prenom} {d.nom} — {d.specialite}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure souhaitées *</label>
                <input type="datetime-local" value={form.date_heure} onChange={e => setForm(f => ({ ...f, date_heure: e.target.value }))} className="input-field" min={minDateStr} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif de la consultation</label>
                <input type="text" value={form.motif} onChange={e => setForm(f => ({ ...f, motif: e.target.value }))} className="input-field" placeholder="Suivi, douleur, fièvre..." />
              </div>
              <p className="text-xs text-gray-400">Votre demande sera examinée par le médecin qui confirmera ou proposera un autre créneau.</p>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Demander le rendez-vous</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400">Chargement...</div>
      ) : rdvs.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p>Vous n'avez aucun rendez-vous programmé.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4">Prendre un premier rendez-vous</button>
        </div>
      ) : (
        <div className="space-y-3">
          {rdvs.map((rdv: any) => (
            <div key={rdv.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-gray-800">
                      {new Date(rdv.date_heure).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {new Date(rdv.date_heure).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Dr. {rdv.doctor_prenom} {rdv.doctor_nom} — {rdv.doctor_specialite || ""}</p>
                  {rdv.motif && <p className="text-xs text-gray-400 mt-0.5">{rdv.motif}</p>}
                  {rdv.notes && <p className="text-xs text-blue-600 mt-0.5 italic">{rdv.notes}</p>}
                </div>
                <span className={STATUT_COLORS[rdv.statut]}>{STATUTS[rdv.statut]}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
