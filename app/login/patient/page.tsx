"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function Illustration() {
  return (
    <svg viewBox="0 0 480 680" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <pattern id="pg" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="480" height="680" fill="url(#pg)"/>

      {/* Background blobs */}
      <circle cx="80"  cy="120" r="240" fill="rgba(255,255,255,0.025)"/>
      <circle cx="430" cy="580" r="220" fill="rgba(255,255,255,0.02)"/>

      {/* ECG/pulse line */}
      <polyline points="0,330 110,330 155,230 200,430 245,290 285,330 480,330"
        fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>

      {/* LARGE HEART (outer) */}
      <path d="M 240 590 Q 25 440 58 255 Q 80 125 168 138 Q 210 144 240 200 Q 270 144 312 138 Q 400 125 422 255 Q 455 440 240 590 Z"
        fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4"/>

      {/* HEART (main) */}
      <path d="M 240 500 Q 90 380 115 245 Q 132 158 196 165 Q 225 168 240 215 Q 255 168 284 165 Q 348 158 365 245 Q 390 380 240 500 Z"
        fill="none" stroke="white" strokeWidth="9" opacity="0.72"/>

      {/* Caring hands – two arcing curves at the bottom */}
      <path d="M 20 640 Q 120 568 240 578 Q 360 568 460 640"
        fill="none" stroke="white" strokeWidth="7" strokeLinecap="round" opacity="0.35"/>
      <path d="M 0 665 Q 110 590 240 600 Q 370 590 480 665"
        fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.2"/>

      {/* Small cross accents */}
      <g fill="rgba(255,255,255,0.18)">
        <rect x="43"  y="490" width="12" height="36" rx="3"/><rect x="31"  y="502" width="36" height="12" rx="3"/>
      </g>
      <g fill="rgba(255,255,255,0.10)">
        <rect x="418" y="148" width="9"  height="28" rx="2"/><rect x="409" y="157" width="28" height="9"  rx="2"/>
      </g>

      {/* Floating dots */}
      <circle cx="60"  cy="355" r="5" fill="white" opacity="0.15"/>
      <circle cx="38"  cy="385" r="3" fill="white" opacity="0.10"/>
      <circle cx="435" cy="310" r="5" fill="white" opacity="0.15"/>
      <circle cx="455" cy="345" r="3" fill="white" opacity="0.10"/>
    </svg>
  );
}

export default function PatientLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [etablissement, setEtablissement] = useState("CMA de Boromo");

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(s => {
      if (s.etablissement_nom) setEtablissement(s.etablissement_nom);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "patient", identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Code ou mot de passe incorrect"); setLoading(false); return; }
      router.push("/patient");
    } catch { setError("Erreur réseau"); setLoading(false); }
  };

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Panneau gauche – illustration ── */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col items-center justify-center"
        style={{ background: "linear-gradient(155deg,#172554 0%,#1e3a8a 50%,#1d4ed8 100%)" }}>
        <Illustration />

        <div className="relative z-10 text-center px-14 max-w-md">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-3">Espace Patient</h2>
          <p className="text-white/55 text-[0.93rem] leading-relaxed">
            Consultez vos prescriptions, résultats d'examens et gérez vos rendez-vous médicaux en toute sécurité.
          </p>

          <div className="mt-10 space-y-3 text-left max-w-xs mx-auto">
            {["Mes ordonnances en PDF", "Mes demandes d'examens", "Historique des consultations", "Gestion des rendez-vous"].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(147,197,253,0.2)", border: "1px solid rgba(147,197,253,0.4)" }}>
                  <svg className="w-3 h-3 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <span className="text-white/60 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-5 left-0 right-0 text-center">
          <p className="text-white/25 text-xs">{etablissement}</p>
        </div>
      </div>

      {/* ── Panneau droit – formulaire ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-10 overflow-y-auto">
        <div className="w-full max-w-sm">
          <Link href="/" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-8 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Retour à l'accueil
          </Link>

          <div className="mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Connexion Patient</h1>
            <p className="text-gray-400 text-sm mt-0.5">{etablissement}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Code patient</label>
              <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
                className="input-field font-mono" placeholder="PAT-000001" required autoFocus/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input-field" placeholder="••••••••" required/>
            </div>
            {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-3 text-[0.95rem] mt-1 text-white font-medium rounded-lg transition-all shadow-sm"
              style={{ background: loading ? "#93c5fd" : "#2563eb" }}>
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p className="mt-6 text-xs text-gray-300 text-center">
            Démo : <span className="text-gray-400">PAT-000001 / patient123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
