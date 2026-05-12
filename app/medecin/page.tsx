"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MedecinDashboard() {
  const router = useRouter();
  const [patientCode, setPatientCode] = useState("");
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientCode.trim()) return;
    setSearching(true);
    setError("");
    const code = patientCode.trim().toUpperCase();
    const res = await fetch(`/api/patients/${code}`);
    setSearching(false);
    if (res.ok) {
      router.push(`/medecin/patient/${code}`);
    } else {
      setError("Patient non trouvé. Vérifiez le code.");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Espace Médecin</h1>
        <p className="text-gray-500 text-sm mt-1">Recherchez un patient par son code pour accéder à son dossier</p>
      </div>

      <div className="max-w-xl">
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Accès au dossier patient
          </h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code patient</label>
              <input
                type="text"
                value={patientCode}
                onChange={e => setPatientCode(e.target.value)}
                placeholder="Ex: PAT-000001"
                className="input-field text-lg font-mono"
                autoFocus
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={searching} className="btn-primary w-full py-3">
              {searching ? "Recherche..." : "Ouvrir le dossier"}
            </button>
          </form>
        </div>

        <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-100">
          <p className="text-sm text-primary-700 font-medium mb-2">Accès rapide</p>
          <p className="text-xs text-primary-600">Entrez le code du patient (format PAT-XXXXXX) pour visualiser son dossier médical complet : consultations antérieures, prescriptions, examens et rendez-vous.</p>
        </div>
      </div>
    </div>
  );
}
