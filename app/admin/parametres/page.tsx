"use client";
import { useState, useEffect } from "react";

export default function ParametresPage() {
  const [settings, setSettings] = useState({
    etablissement_nom: "CMA de Boromo",
    consultation_frais: "1250",
    certificat_frais: "2000",
    consultation_validite_jours: "10",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => {
      setSettings(prev => ({ ...prev, ...d }));
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      setMessage({ type: "success", text: "Paramètres enregistrés avec succès" });
    } else {
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde" });
    }
    setSaving(false);
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  if (loading) return <div className="p-8 text-gray-400">Chargement...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>
        <p className="text-gray-500 text-sm mt-1">Configuration de l'établissement</p>
      </div>

      {message.text && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">Informations de l'établissement</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'établissement</label>
            <input
              type="text"
              value={settings.etablissement_nom}
              onChange={e => setSettings(s => ({ ...s, etablissement_nom: e.target.value }))}
              className="input-field"
              required
            />
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">Tarification (FCFA)</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frais de consultation (FCFA)</label>
              <input
                type="number"
                value={settings.consultation_frais}
                onChange={e => setSettings(s => ({ ...s, consultation_frais: e.target.value }))}
                className="input-field"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frais de certificat médical (FCFA)</label>
              <input
                type="number"
                value={settings.certificat_frais}
                onChange={e => setSettings(s => ({ ...s, certificat_frais: e.target.value }))}
                className="input-field"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validité de la consultation (jours)</label>
              <input
                type="number"
                value={settings.consultation_validite_jours}
                onChange={e => setSettings(s => ({ ...s, consultation_validite_jours: e.target.value }))}
                className="input-field"
                min="1"
                max="365"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Le patient peut reconsulter gratuitement durant cette période.</p>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary px-8">
          {saving ? "Enregistrement..." : "Enregistrer les paramètres"}
        </button>
      </form>
    </div>
  );
}
