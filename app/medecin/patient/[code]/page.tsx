"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { genererOrdonnance, genererCertificat } from "@/lib/pdf";

interface Prescription { id: number; medicament: string; posologie: string; duree: string; }
interface Examen { id: number; type_examen: string; description: string; resultat: string; }
interface Consultation {
  id: number; date: string; motif: string; diagnostic: string; notes: string;
  tension: string; temperature: string; poids: string; valide_jusqu: string; montant: number;
  doctor_nom: string; doctor_prenom: string;
  prescriptions: Prescription[]; examens: Examen[];
}
interface Patient {
  id: number; code: string; nom: string; prenom: string; date_naissance: string;
  sexe: string; telephone: string; adresse: string;
}

export default function PatientDossierPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [data, setData] = useState<{ patient: Patient; consultations: Consultation[]; rendez_vous: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dossier" | "nouvelle" | "certificat" | "rdv">("dossier");
  const [selectedConsult, setSelectedConsult] = useState<Consultation | null>(null);
  const [etablissement, setEtablissement] = useState("CMA de Boromo");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [doctors, setDoctors] = useState<any[]>([]);

  const [consultForm, setConsultForm] = useState({
    motif: "", diagnostic: "", notes: "", tension: "", temperature: "", poids: "",
    prescriptions: [{ medicament: "", posologie: "", duree: "" }],
    examens: [{ type_examen: "", description: "" }],
  });
  const [certForm, setCertForm] = useState({ type: "Médical", contenu: "" });
  const [rdvForm, setRdvForm] = useState({ doctor_id: "", date_heure: "", motif: "" });

  useEffect(() => {
    const fetchAll = async () => {
      const [patRes, settRes, docRes] = await Promise.all([
        fetch(`/api/patients/${code}`),
        fetch("/api/settings"),
        fetch("/api/doctors"),
      ]);
      if (patRes.ok) setData(await patRes.json());
      if (settRes.ok) { const s = await settRes.json(); if (s.etablissement_nom) setEtablissement(s.etablissement_nom); }
      if (docRes.ok) setDoctors(await docRes.json());
      setLoading(false);
    };
    fetchAll();
  }, [code]);

  const handleNewConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    const res = await fetch("/api/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: data.patient.id,
        ...consultForm,
        prescriptions: consultForm.prescriptions.filter(p => p.medicament),
        examens: consultForm.examens.filter(ex => ex.type_examen),
      }),
    });
    if (res.ok) {
      setMessage({ type: "success", text: "Consultation enregistrée avec succès" });
      setActiveTab("dossier");
      const updated = await fetch(`/api/patients/${code}`);
      if (updated.ok) setData(await updated.json());
      setConsultForm({ motif: "", diagnostic: "", notes: "", tension: "", temperature: "", poids: "", prescriptions: [{ medicament: "", posologie: "", duree: "" }], examens: [{ type_examen: "", description: "" }] });
    } else {
      setMessage({ type: "error", text: "Erreur lors de l'enregistrement" });
    }
  };

  const handleCertificat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    const res = await fetch("/api/certificats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: data.patient.id, ...certForm }),
    });
    if (res.ok) {
      const respData = await res.json();
      const meRes = await fetch("/api/auth/me");
      const { user } = await meRes.json();
      setMessage({ type: "success", text: "Certificat créé. Génération du PDF..." });
      genererCertificat({
        etablissement,
        patient: data.patient,
        certificat: {
          type: certForm.type,
          contenu: certForm.contenu,
          date: new Date().toISOString(),
          doctor_prenom: user.nom.replace('Dr. ', '').split(' ')[0],
          doctor_nom: user.nom.replace('Dr. ', '').split(' ').slice(1).join(' '),
        },
      });
      setCertForm({ type: "Médical", contenu: "" });
    } else {
      setMessage({ type: "error", text: "Erreur" });
    }
  };

  const handleRdv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    const res = await fetch("/api/rendez-vous", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: data.patient.id, ...rdvForm }),
    });
    if (res.ok) {
      setMessage({ type: "success", text: "Rendez-vous programmé" });
      setActiveTab("dossier");
      const updated = await fetch(`/api/patients/${code}`);
      if (updated.ok) setData(await updated.json());
    } else {
      setMessage({ type: "error", text: "Erreur" });
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Chargement du dossier...</div>;
  if (!data) return <div className="p-8"><p className="text-red-600">Patient non trouvé.</p><button onClick={() => router.push("/medecin")} className="btn-secondary mt-4">Retour</button></div>;

  const { patient, consultations, rendez_vous } = data;
  const age = patient.date_naissance ? Math.floor((Date.now() - new Date(patient.date_naissance).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;

  const tabs = [
    { key: "dossier",    label: "Dossier médical",      icon: "📋" },
    { key: "nouvelle",   label: "Nouvelle consultation", icon: "✏️" },
    { key: "certificat", label: "Certificat",            icon: "📄" },
    { key: "rdv",        label: "Rendez-vous",           icon: "📅" },
  ];

  return (
    <div className="p-6">
      {/* Modal détail consultation */}
      {selectedConsult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-primary-50 rounded-t-2xl">
              <div>
                <h3 className="font-semibold text-primary-900">Consultation du {new Date(selectedConsult.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</h3>
                <p className="text-sm text-primary-600">Dr. {selectedConsult.doctor_prenom} {selectedConsult.doctor_nom}</p>
              </div>
              <button onClick={() => setSelectedConsult(null)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white">✕</button>
            </div>
            <div className="p-6 space-y-5">
              {selectedConsult.motif && (
                <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Motif</p><p className="text-gray-700">{selectedConsult.motif}</p></div>
              )}
              {selectedConsult.diagnostic && (
                <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Diagnostic</p><p className="text-gray-800 font-medium">{selectedConsult.diagnostic}</p></div>
              )}
              {(selectedConsult.tension || selectedConsult.temperature || selectedConsult.poids) && (
                <div className="grid grid-cols-3 gap-3">
                  {selectedConsult.tension && <div className="bg-primary-50 p-3 rounded-xl text-center"><p className="text-xs text-primary-500 font-medium">Tension</p><p className="font-bold text-primary-800 mt-0.5">{selectedConsult.tension}</p></div>}
                  {selectedConsult.temperature && <div className="bg-orange-50 p-3 rounded-xl text-center"><p className="text-xs text-orange-500 font-medium">Température</p><p className="font-bold text-orange-800 mt-0.5">{selectedConsult.temperature}°C</p></div>}
                  {selectedConsult.poids && <div className="bg-blue-50 p-3 rounded-xl text-center"><p className="text-xs text-blue-500 font-medium">Poids</p><p className="font-bold text-blue-800 mt-0.5">{selectedConsult.poids} kg</p></div>}
                </div>
              )}
              {selectedConsult.prescriptions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-2">Prescriptions ({selectedConsult.prescriptions.length})</p>
                  <div className="space-y-1.5">
                    {selectedConsult.prescriptions.map(p => (
                      <div key={p.id} className="bg-primary-50 border border-primary-100 px-3 py-2 rounded-lg text-sm">
                        <span className="font-medium text-primary-800">{p.medicament}</span>
                        {p.posologie && <span className="text-gray-600"> — {p.posologie}</span>}
                        {p.duree && <span className="text-gray-400 text-xs"> ({p.duree})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedConsult.examens.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-2">Examens prescrits ({selectedConsult.examens.length})</p>
                  <div className="space-y-1.5">
                    {selectedConsult.examens.map(ex => (
                      <div key={ex.id} className="bg-teal-50 border border-teal-100 px-3 py-2 rounded-lg text-sm">
                        <span className="font-medium text-teal-800">{ex.type_examen}</span>
                        {ex.description && <span className="text-gray-600"> — {ex.description}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => genererOrdonnance({ etablissement, patient, consultation: selectedConsult })}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Télécharger l'ordonnance PDF
              </button>
              <button onClick={() => setSelectedConsult(null)} className="btn-secondary text-sm">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête patient */}
      <div className="card mb-6 bg-gradient-to-r from-primary-50 to-teal-50 border-primary-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md">
              {patient.prenom.charAt(0)}{patient.nom.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{patient.prenom} {patient.nom}</h1>
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                <span className="font-mono text-primary-700 font-semibold bg-primary-100 px-2 py-0.5 rounded">{patient.code}</span>
                {age && <span className="bg-white px-2 py-0.5 rounded border border-gray-200">{age} ans</span>}
                <span className="bg-white px-2 py-0.5 rounded border border-gray-200">{patient.sexe === "M" ? "Masculin" : "Féminin"}</span>
                {patient.telephone && <span>📱 {patient.telephone}</span>}
              </div>
            </div>
          </div>
          <button onClick={() => router.push("/medecin")} className="btn-secondary text-sm">← Retour</button>
        </div>
      </div>

      {message.text && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.type === "success" ? "✓" : "✕"} {message.text}
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab.key ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* Onglet Dossier */}
      {activeTab === "dossier" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-700">Historique des consultations <span className="text-gray-400 font-normal">({consultations.length})</span></h2>
          </div>
          {consultations.length === 0 ? (
            <div className="card text-center py-14 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p>Aucune consultation enregistrée pour ce patient</p>
              <button onClick={() => setActiveTab("nouvelle")} className="btn-primary mt-4 text-sm">Créer la première consultation</button>
            </div>
          ) : consultations.map(c => (
            <div key={c.id} className="card hover:shadow-md transition-all cursor-pointer border-l-4 border-l-primary-300 hover:border-l-primary-500" onClick={() => setSelectedConsult(c)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-gray-800">{new Date(c.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</span>
                    <span className="badge-green text-xs">Dr. {c.doctor_prenom} {c.doctor_nom}</span>
                  </div>
                  {c.motif && <p className="text-sm text-gray-500">Motif : {c.motif}</p>}
                  {c.diagnostic && <p className="text-sm text-gray-700 font-medium">Diagnostic : {c.diagnostic}</p>}
                  <div className="flex gap-2 mt-2">
                    {c.prescriptions.length > 0 && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">{c.prescriptions.length} prescription(s)</span>}
                    {c.examens.length > 0 && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">{c.examens.length} examen(s)</span>}
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          ))}

          {rendez_vous.length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold text-gray-700 mb-3">Rendez-vous <span className="text-gray-400 font-normal">({rendez_vous.length})</span></h2>
              {rendez_vous.map((rv: any) => (
                <div key={rv.id} className="card mb-3 border-l-4 border-l-amber-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{new Date(rv.date_heure).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Dr. {rv.doctor_prenom} {rv.doctor_nom} — {rv.motif || "Sans motif précisé"}</p>
                    </div>
                    <span className={rv.statut === "confirme" ? "badge-green" : rv.statut === "annule" ? "badge-red" : "badge-yellow"}>
                      {rv.statut === "confirme" ? "Confirmé" : rv.statut === "annule" ? "Annulé" : "En attente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Onglet Nouvelle consultation */}
      {activeTab === "nouvelle" && (
        <form onSubmit={handleNewConsultation} className="space-y-5 max-w-3xl">
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>Constantes vitales</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Tension artérielle</label><input type="text" value={consultForm.tension} onChange={e => setConsultForm(f => ({ ...f, tension: e.target.value }))} className="input-field" placeholder="120/80 mmHg" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Température (°C)</label><input type="text" value={consultForm.temperature} onChange={e => setConsultForm(f => ({ ...f, temperature: e.target.value }))} className="input-field" placeholder="37.5" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Poids (kg)</label><input type="text" value={consultForm.poids} onChange={e => setConsultForm(f => ({ ...f, poids: e.target.value }))} className="input-field" placeholder="65" /></div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>Consultation</h3>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Motif</label><input type="text" value={consultForm.motif} onChange={e => setConsultForm(f => ({ ...f, motif: e.target.value }))} className="input-field" placeholder="Fièvre, douleur..." /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Diagnostic</label><input type="text" value={consultForm.diagnostic} onChange={e => setConsultForm(f => ({ ...f, diagnostic: e.target.value }))} className="input-field" placeholder="Paludisme, grippe..." /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Notes / Observations</label><textarea value={consultForm.notes} onChange={e => setConsultForm(f => ({ ...f, notes: e.target.value }))} className="input-field h-20 resize-none" placeholder="Observations supplémentaires..." /></div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2"><span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>Prescriptions</h3>
              <button type="button" onClick={() => setConsultForm(f => ({ ...f, prescriptions: [...f.prescriptions, { medicament: "", posologie: "", duree: "" }] }))} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">+ Ajouter</button>
            </div>
            <div className="space-y-2">
              {consultForm.prescriptions.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input type="text" value={p.medicament} onChange={e => { const a = [...consultForm.prescriptions]; a[i].medicament = e.target.value; setConsultForm(f => ({ ...f, prescriptions: a })); }} className="input-field col-span-4" placeholder="Médicament" />
                  <input type="text" value={p.posologie} onChange={e => { const a = [...consultForm.prescriptions]; a[i].posologie = e.target.value; setConsultForm(f => ({ ...f, prescriptions: a })); }} className="input-field col-span-4" placeholder="Posologie" />
                  <input type="text" value={p.duree} onChange={e => { const a = [...consultForm.prescriptions]; a[i].duree = e.target.value; setConsultForm(f => ({ ...f, prescriptions: a })); }} className="input-field col-span-3" placeholder="Durée" />
                  {i > 0 && <button type="button" onClick={() => setConsultForm(f => ({ ...f, prescriptions: f.prescriptions.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600 col-span-1 text-center text-lg">×</button>}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2"><span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold">4</span>Examens demandés</h3>
              <button type="button" onClick={() => setConsultForm(f => ({ ...f, examens: [...f.examens, { type_examen: "", description: "" }] }))} className="text-sm text-teal-600 hover:text-teal-700 font-medium">+ Ajouter</button>
            </div>
            <div className="space-y-2">
              {consultForm.examens.map((ex, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input type="text" value={ex.type_examen} onChange={e => { const a = [...consultForm.examens]; a[i].type_examen = e.target.value; setConsultForm(f => ({ ...f, examens: a })); }} className="input-field col-span-5" placeholder="Type d'examen" />
                  <input type="text" value={ex.description} onChange={e => { const a = [...consultForm.examens]; a[i].description = e.target.value; setConsultForm(f => ({ ...f, examens: a })); }} className="input-field col-span-6" placeholder="Description / précisions" />
                  {i > 0 && <button type="button" onClick={() => setConsultForm(f => ({ ...f, examens: f.examens.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600 col-span-1 text-center text-lg">×</button>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary px-8">Enregistrer la consultation</button>
            <button type="button" onClick={() => setActiveTab("dossier")} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {/* Onglet Certificat */}
      {activeTab === "certificat" && (
        <form onSubmit={handleCertificat} className="max-w-xl space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4">Nouveau certificat médical</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de certificat</label>
                <select value={certForm.type} onChange={e => setCertForm(f => ({ ...f, type: e.target.value }))} className="input-field">
                  <option value="Médical">Certificat médical</option>
                  <option value="Aptitude">Certificat d'aptitude</option>
                  <option value="Inaptitude">Certificat d'inaptitude</option>
                  <option value="Décès">Certificat de décès</option>
                  <option value="Grossesse">Certificat de grossesse</option>
                  <option value="Repos">Certificat de repos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contenu du certificat</label>
                <textarea value={certForm.contenu} onChange={e => setCertForm(f => ({ ...f, contenu: e.target.value }))} className="input-field h-32 resize-none" placeholder="Détails du certificat..." />
              </div>
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Frais de certificat : 2 000 FCFA — Le PDF sera téléchargé automatiquement.
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Créer et télécharger PDF
            </button>
            <button type="button" onClick={() => setActiveTab("dossier")} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {/* Onglet Rendez-vous */}
      {activeTab === "rdv" && (
        <form onSubmit={handleRdv} className="max-w-xl space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4">Programmer un rendez-vous</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Médecin *</label>
                <select value={rdvForm.doctor_id} onChange={e => setRdvForm(f => ({ ...f, doctor_id: e.target.value }))} className="input-field" required>
                  <option value="">— Sélectionner un médecin —</option>
                  {doctors.filter(d => d.actif).map(d => (<option key={d.id} value={d.id}>Dr. {d.prenom} {d.nom} — {d.specialite}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date et heure *</label>
                <input type="datetime-local" value={rdvForm.date_heure} onChange={e => setRdvForm(f => ({ ...f, date_heure: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Motif</label>
                <input type="text" value={rdvForm.motif} onChange={e => setRdvForm(f => ({ ...f, motif: e.target.value }))} className="input-field" placeholder="Suivi, contrôle..." />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">Programmer le rendez-vous</button>
            <button type="button" onClick={() => setActiveTab("dossier")} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}
    </div>
  );
}
