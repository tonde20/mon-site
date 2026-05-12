"use client";
import { useState, useEffect } from "react";
import { genererOrdonnance, genererExamens } from "@/lib/pdf";

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default function PatientPrescriptions() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [etablissement, setEtablissement] = useState("CMA de Boromo");

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

  if (loading) return <div className="p-8 text-gray-400">Chargement...</div>;
  if (!data) return <div className="p-8 text-red-500">Erreur</div>;

  const { patient, consultations } = data;
  const consultationsAvecDocs = consultations.filter((c: any) => c.prescriptions?.length > 0 || c.examens?.length > 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Mes prescriptions et examens</h1>
        <p className="text-gray-500 text-sm mt-1">{consultationsAvecDocs.length} consultation(s) avec documents</p>
      </div>

      {consultationsAvecDocs.length === 0 ? (
        <div className="card text-center py-14 text-gray-400">Aucune prescription ou examen enregistré</div>
      ) : (
        <div className="space-y-4">
          {consultationsAvecDocs.map((c: any) => {
            const isActive = new Date(c.valide_jusqu) >= new Date();
            return (
              <div key={c.id} className={`card ${isActive ? "border-l-4 border-l-primary-500" : "opacity-80"}`}>
                {/* En-tête de la consultation */}
                <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">
                        {new Date(c.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                      </span>
                      {isActive
                        ? <span className="badge-green">Active</span>
                        : <span className="badge-gray">Expirée</span>}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Dr. {c.doctor_prenom} {c.doctor_nom}</p>
                  </div>

                  {/* Boutons PDF séparés */}
                  <div className="flex flex-wrap gap-2">
                    {c.prescriptions?.length > 0 && (
                      <button
                        onClick={() => genererOrdonnance({ etablissement, patient, consultation: c })}
                        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors shadow-sm"
                      >
                        <DownloadIcon />
                        Ordonnance PDF
                      </button>
                    )}
                    {c.examens?.length > 0 && (
                      <button
                        onClick={() => genererExamens({ etablissement, patient, consultation: c })}
                        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors shadow-sm"
                      >
                        <DownloadIcon />
                        Examens PDF
                      </button>
                    )}
                  </div>
                </div>

                {/* Contenu */}
                <div className="grid md:grid-cols-2 gap-4">
                  {c.prescriptions?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full inline-block" />
                        Médicaments ({c.prescriptions.length})
                      </p>
                      <div className="space-y-1.5">
                        {c.prescriptions.map((p: any) => (
                          <div key={p.id} className="bg-primary-50 border border-primary-100 px-3 py-2 rounded-lg text-sm">
                            <span className="font-medium text-primary-800">{p.medicament}</span>
                            {p.posologie && <span className="text-gray-600"> — {p.posologie}</span>}
                            {p.duree && <span className="text-gray-400 text-xs"> ({p.duree})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {c.examens?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full inline-block" />
                        Examens ({c.examens.length})
                      </p>
                      <div className="space-y-1.5">
                        {c.examens.map((ex: any) => (
                          <div key={ex.id} className="bg-teal-50 border border-teal-100 px-3 py-2 rounded-lg text-sm">
                            <span className="font-medium text-teal-800">{ex.type_examen}</span>
                            {ex.description && <span className="text-gray-600"> — {ex.description}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
