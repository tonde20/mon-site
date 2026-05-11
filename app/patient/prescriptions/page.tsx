"use client";
import { useState, useEffect, useRef } from "react";

export default function PatientPrescriptions() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [etablissement, setEtablissement] = useState("CMA de Boromo");
  const [selectedConsult, setSelectedConsult] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const [meRes, settRes] = await Promise.all([fetch("/api/auth/me"), fetch("/api/settings")]);
      if (!meRes.ok) return;
      const { user } = await meRes.json();
      if (settRes.ok) { const s = await settRes.json(); if (s.etablissement_nom) setEtablissement(s.etablissement_nom); }
      const patRes = await fetch(`/api/patients/${user.code}`);
      if (patRes.ok) setData(await patRes.json());
      setLoading(false);
    };
    fetchAll();
  }, []);

  const handlePrint = (consult: any) => {
    setSelectedConsult(consult);
    setTimeout(() => window.print(), 300);
  };

  if (loading) return <div className="p-8 text-gray-400">Chargement...</div>;
  if (!data) return <div className="p-8 text-red-500">Erreur</div>;

  const { patient, consultations } = data;
  const consultationsWithPrescriptions = consultations.filter((c: any) => c.prescriptions?.length > 0 || c.examens?.length > 0);

  return (
    <div className="p-8">
      {/* Print area */}
      {selectedConsult && (
        <div className="print-only" ref={printRef}>
          <div className="p-8 text-sm">
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
              <h1 className="text-xl font-bold">{etablissement}</h1>
              <p className="text-gray-600">ORDONNANCE MÉDICALE</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
              <div>
                <p><strong>Patient:</strong> {patient.prenom} {patient.nom}</p>
                <p><strong>Code:</strong> {patient.code}</p>
                {patient.date_naissance && <p><strong>Né(e) le:</strong> {new Date(patient.date_naissance).toLocaleDateString("fr-FR")}</p>}
              </div>
              <div className="text-right">
                <p><strong>Dr. {selectedConsult.doctor_prenom} {selectedConsult.doctor_nom}</strong></p>
                <p>Date: {new Date(selectedConsult.date).toLocaleDateString("fr-FR")}</p>
                {selectedConsult.valide_jusqu && <p>Valide jusqu'au: {new Date(selectedConsult.valide_jusqu).toLocaleDateString("fr-FR")}</p>}
              </div>
            </div>
            {selectedConsult.diagnostic && <p className="mb-4"><strong>Diagnostic:</strong> {selectedConsult.diagnostic}</p>}
            {selectedConsult.prescriptions?.length > 0 && (
              <div className="mb-4">
                <p className="font-bold mb-2 uppercase">Prescriptions:</p>
                <ol className="list-decimal list-inside space-y-1.5">
                  {selectedConsult.prescriptions.map((p: any, i: number) => (
                    <li key={i}><strong>{p.medicament}</strong> {p.posologie && `— ${p.posologie}`} {p.duree && `— ${p.duree}`}</li>
                  ))}
                </ol>
              </div>
            )}
            {selectedConsult.examens?.length > 0 && (
              <div className="mb-4">
                <p className="font-bold mb-2 uppercase">Examens demandés:</p>
                <ol className="list-decimal list-inside space-y-1">
                  {selectedConsult.examens.map((ex: any, i: number) => (
                    <li key={i}>{ex.type_examen} {ex.description && `— ${ex.description}`}</li>
                  ))}
                </ol>
              </div>
            )}
            <div className="mt-8 text-right border-t border-gray-300 pt-4">
              <p className="font-medium">Dr. {selectedConsult.doctor_prenom} {selectedConsult.doctor_nom}</p>
              <p className="text-xs text-gray-500">Signature et cachet</p>
              <div className="h-12" />
            </div>
          </div>
        </div>
      )}

      <div className="no-print">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Mes prescriptions et examens</h1>
          <p className="text-gray-500 text-sm mt-1">{consultationsWithPrescriptions.length} consultation(s) avec prescriptions</p>
        </div>

        {consultationsWithPrescriptions.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">Aucune prescription ou examen enregistré</div>
        ) : (
          <div className="space-y-4">
            {consultationsWithPrescriptions.map((c: any) => {
              const isActive = new Date(c.valide_jusqu) >= new Date();
              return (
                <div key={c.id} className={`card ${isActive ? "border-l-4 border-l-primary-400" : ""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{new Date(c.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</span>
                        {isActive ? <span className="badge-green">Active</span> : <span className="text-xs text-gray-400">Expirée</span>}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">Dr. {c.doctor_prenom} {c.doctor_nom}</p>
                      {c.diagnostic && <p className="text-sm text-gray-600 mt-1">Diagnostic: <span className="font-medium">{c.diagnostic}</span></p>}
                    </div>
                    <button onClick={() => handlePrint(c)} className="btn-secondary text-sm flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      Imprimer
                    </button>
                  </div>

                  {c.prescriptions?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Médicaments prescrits</p>
                      <div className="grid gap-2">
                        {c.prescriptions.map((p: any) => (
                          <div key={p.id} className="flex items-start gap-2 bg-green-50 p-2.5 rounded-lg text-sm">
                            <span className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium">{p.medicament}</span>
                              {p.posologie && <span className="text-gray-600"> — {p.posologie}</span>}
                              {p.duree && <span className="text-gray-500"> ({p.duree})</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {c.examens?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Examens prescrits</p>
                      <div className="grid gap-2">
                        {c.examens.map((ex: any) => (
                          <div key={ex.id} className="flex items-start gap-2 bg-blue-50 p-2.5 rounded-lg text-sm">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium">{ex.type_examen}</span>
                              {ex.description && <span className="text-gray-600"> — {ex.description}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
