"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

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

function PrintOrdonnance({ patient, consultation, etablissement }: { patient: Patient; consultation: Consultation; etablissement: string }) {
  return (
    <div className="print-only p-8 text-sm">
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-xl font-bold">{etablissement}</h1>
        <p className="text-gray-600">ORDONNANCE MÉDICALE</p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
        <div>
          <p><strong>Patient:</strong> {patient.prenom} {patient.nom}</p>
          <p><strong>Code:</strong> {patient.code}</p>
          <p><strong>Né(e) le:</strong> {patient.date_naissance ? new Date(patient.date_naissance).toLocaleDateString("fr-FR") : "—"}</p>
        </div>
        <div className="text-right">
          <p><strong>Dr. {consultation.doctor_prenom} {consultation.doctor_nom}</strong></p>
          <p>Date: {new Date(consultation.date).toLocaleDateString("fr-FR")}</p>
          <p>Valide jusqu'au: {new Date(consultation.valide_jusqu).toLocaleDateString("fr-FR")}</p>
        </div>
      </div>
      {consultation.diagnostic && <p className="mb-4"><strong>Diagnostic:</strong> {consultation.diagnostic}</p>}
      <div className="mb-4">
        <p className="font-bold mb-2">PRESCRIPTION:</p>
        <ol className="list-decimal list-inside space-y-1">
          {consultation.prescriptions.map((p, i) => (
            <li key={i}><strong>{p.medicament}</strong> — {p.posologie} {p.duree && `— ${p.duree}`}</li>
          ))}
        </ol>
      </div>
      <div className="mt-8 text-right">
        <p>Signature et cachet du médecin</p>
        <div className="h-16" />
      </div>
    </div>
  );
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
      setMessage({ type: "success", text: "Certificat créé. Impression en cours..." });
      setTimeout(() => window.print(), 500);
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
    { key: "dossier", label: "Dossier médical" },
    { key: "nouvelle", label: "Nouvelle consultation" },
    { key: "certificat", label: "Certificat" },
    { key: "rdv", label: "Rendez-vous" },
  ];

  return (
    <div className="p-6">
      {selectedConsult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold">Détails de la consultation — {new Date(selectedConsult.date).toLocaleDateString("fr-FR")}</h3>
              <button onClick={() => setSelectedConsult(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Dr. {selectedConsult.doctor_prenom} {selectedConsult.doctor_nom}</p>
              {selectedConsult.motif && <div><p className="text-xs font-medium text-gray-500 uppercase">Motif</p><p>{selectedConsult.motif}</p></div>}
              {selectedConsult.diagnostic && <div><p className="text-xs font-medium text-gray-500 uppercase">Diagnostic</p><p>{selectedConsult.diagnostic}</p></div>}
              {(selectedConsult.tension || selectedConsult.temperature || selectedConsult.poids) && (
                <div className="grid grid-cols-3 gap-3">
                  {selectedConsult.tension && <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Tension</p><p className="font-medium">{selectedConsult.tension}</p></div>}
                  {selectedConsult.temperature && <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Température</p><p className="font-medium">{selectedConsult.temperature}°C</p></div>}
                  {selectedConsult.poids && <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Poids</p><p className="font-medium">{selectedConsult.poids} kg</p></div>}
                </div>
              )}
              {selectedConsult.prescriptions.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Prescriptions</p>
                  <div className="space-y-1">
                    {selectedConsult.prescriptions.map(p => (
                      <div key={p.id} className="bg-green-50 p-2 rounded text-sm"><span className="font-medium">{p.medicament}</span> — {p.posologie} {p.duree && `(${p.duree})`}</div>
                    ))}
                  </div>
                </div>
              )}
              {selectedConsult.examens.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Examens prescrits</p>
                  <div className="space-y-1">
                    {selectedConsult.examens.map(ex => (
                      <div key={ex.id} className="bg-blue-50 p-2 rounded text-sm"><span className="font-medium">{ex.type_examen}</span> {ex.description && `— ${ex.description}`}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => { setSelectedConsult(null); setTimeout(() => window.print(), 200); }} className="btn-primary text-sm">Imprimer l'ordonnance</button>
              <button onClick={() => setSelectedConsult(null)} className="btn-secondary text-sm">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Print area */}
      {selectedConsult && <PrintOrdonnance patient={patient} consultation={selectedConsult} etablissement={etablissement} />}

      {/* Patient header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 font-bold text-xl">
              {patient.prenom.charAt(0)}{patient.nom.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{patient.prenom} {patient.nom}</h1>
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                <span className="font-mono text-primary-700">{patient.code}</span>
                {age && <span>{age} ans</span>}
                <span>{patient.sexe === "M" ? "Masculin" : "Féminin"}</span>
                {patient.telephone && <span>📱 {patient.telephone}</span>}
              </div>
            </div>
          </div>
          <button onClick={() => router.push("/medecin")} className="btn-secondary text-sm no-print">← Retour</button>
        </div>
      </div>

      {message.text && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 no-print">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-primary-600 text-primary-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dossier tab */}
      {activeTab === "dossier" && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-700">Historique des consultations ({consultations.length})</h2>
          {consultations.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">Aucune consultation enregistrée pour ce patient</div>
          ) : consultations.map(c => (
            <div key={c.id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedConsult(c)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800">{new Date(c.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</span>
                    <span className="badge-green">Dr. {c.doctor_prenom} {c.doctor_nom}</span>
                  </div>
                  {c.motif && <p className="text-sm text-gray-600">Motif: {c.motif}</p>}
                  {c.diagnostic && <p className="text-sm text-gray-600">Diagnostic: {c.diagnostic}</p>}
                  <div className="flex gap-3 mt-2">
                    {c.prescriptions.length > 0 && <span className="text-xs text-primary-700 bg-primary-50 px-2 py-0.5 rounded">{c.prescriptions.length} prescription(s)</span>}
                    {c.examens.length > 0 && <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{c.examens.length} examen(s)</span>}
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          ))}

          {rendez_vous.length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold text-gray-700 mb-3">Rendez-vous</h2>
              {rendez_vous.map((rv: any) => (
                <div key={rv.id} className="card mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{new Date(rv.date_heure).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      <p className="text-xs text-gray-500">Dr. {rv.doctor_prenom} {rv.doctor_nom} — {rv.motif || "Sans motif précisé"}</p>
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

      {/* Nouvelle consultation tab */}
      {activeTab === "nouvelle" && (
        <form onSubmit={handleNewConsultation} className="space-y-6 max-w-3xl">
          <div className="card">
            <h3 className="font-medium text-gray-700 mb-4">Informations cliniques</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tension artérielle</label>
                <input type="text" value={consultForm.tension} onChange={e => setConsultForm(f => ({ ...f, tension: e.target.value }))} className="input-field" placeholder="120/80 mmHg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Température (°C)</label>
                <input type="text" value={consultForm.temperature} onChange={e => setConsultForm(f => ({ ...f, temperature: e.target.value }))} className="input-field" placeholder="37.5" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Poids (kg)</label>
                <input type="text" value={consultForm.poids} onChange={e => setConsultForm(f => ({ ...f, poids: e.target.value }))} className="input-field" placeholder="65" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Motif de consultation</label>
                <input type="text" value={consultForm.motif} onChange={e => setConsultForm(f => ({ ...f, motif: e.target.value }))} className="input-field" placeholder="Fièvre, douleur..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Diagnostic</label>
                <input type="text" value={consultForm.diagnostic} onChange={e => setConsultForm(f => ({ ...f, diagnostic: e.target.value }))} className="input-field" placeholder="Paludisme, grippe..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Observations</label>
                <textarea value={consultForm.notes} onChange={e => setConsultForm(f => ({ ...f, notes: e.target.value }))} className="input-field h-20 resize-none" placeholder="Observations supplémentaires..." />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-700">Prescriptions</h3>
              <button type="button" onClick={() => setConsultForm(f => ({ ...f, prescriptions: [...f.prescriptions, { medicament: "", posologie: "", duree: "" }] }))} className="text-primary-600 text-sm hover:text-primary-700 font-medium">+ Ajouter</button>
            </div>
            <div className="space-y-3">
              {consultForm.prescriptions.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input type="text" value={p.medicament} onChange={e => { const arr = [...consultForm.prescriptions]; arr[i].medicament = e.target.value; setConsultForm(f => ({ ...f, prescriptions: arr })); }} className="input-field col-span-4" placeholder="Médicament" />
                  <input type="text" value={p.posologie} onChange={e => { const arr = [...consultForm.prescriptions]; arr[i].posologie = e.target.value; setConsultForm(f => ({ ...f, prescriptions: arr })); }} className="input-field col-span-4" placeholder="Posologie" />
                  <input type="text" value={p.duree} onChange={e => { const arr = [...consultForm.prescriptions]; arr[i].duree = e.target.value; setConsultForm(f => ({ ...f, prescriptions: arr })); }} className="input-field col-span-3" placeholder="Durée" />
                  {i > 0 && <button type="button" onClick={() => setConsultForm(f => ({ ...f, prescriptions: f.prescriptions.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600 col-span-1 text-center">✕</button>}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-700">Examens demandés</h3>
              <button type="button" onClick={() => setConsultForm(f => ({ ...f, examens: [...f.examens, { type_examen: "", description: "" }] }))} className="text-primary-600 text-sm hover:text-primary-700 font-medium">+ Ajouter</button>
            </div>
            <div className="space-y-3">
              {consultForm.examens.map((ex, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input type="text" value={ex.type_examen} onChange={e => { const arr = [...consultForm.examens]; arr[i].type_examen = e.target.value; setConsultForm(f => ({ ...f, examens: arr })); }} className="input-field col-span-5" placeholder="Type d'examen" />
                  <input type="text" value={ex.description} onChange={e => { const arr = [...consultForm.examens]; arr[i].description = e.target.value; setConsultForm(f => ({ ...f, examens: arr })); }} className="input-field col-span-6" placeholder="Description / précisions" />
                  {i > 0 && <button type="button" onClick={() => setConsultForm(f => ({ ...f, examens: f.examens.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600 col-span-1 text-center">✕</button>}
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

      {/* Certificat tab */}
      {activeTab === "certificat" && (
        <form onSubmit={handleCertificat} className="max-w-xl space-y-4">
          <div className="card">
            <h3 className="font-medium text-gray-700 mb-4">Nouveau certificat médical</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de certificat</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenu du certificat</label>
                <textarea
                  value={certForm.contenu}
                  onChange={e => setCertForm(f => ({ ...f, contenu: e.target.value }))}
                  className="input-field h-32 resize-none"
                  placeholder="Je soussigné(e), Dr..., certifie que..."
                />
              </div>
              <p className="text-xs text-gray-400">Frais de certificat : 2 000 FCFA</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">Créer et imprimer</button>
            <button type="button" onClick={() => setActiveTab("dossier")} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {/* Rendez-vous tab */}
      {activeTab === "rdv" && (
        <form onSubmit={handleRdv} className="max-w-xl space-y-4">
          <div className="card">
            <h3 className="font-medium text-gray-700 mb-4">Programmer un rendez-vous</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Médecin *</label>
                <select value={rdvForm.doctor_id} onChange={e => setRdvForm(f => ({ ...f, doctor_id: e.target.value }))} className="input-field" required>
                  <option value="">— Sélectionner un médecin —</option>
                  {doctors.filter(d => d.actif).map(d => (
                    <option key={d.id} value={d.id}>Dr. {d.prenom} {d.nom} — {d.specialite}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure *</label>
                <input type="datetime-local" value={rdvForm.date_heure} onChange={e => setRdvForm(f => ({ ...f, date_heure: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
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
