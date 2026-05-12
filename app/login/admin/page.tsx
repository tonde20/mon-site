"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function Illustration() {
  return (
    <svg viewBox="0 0 480 680" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <pattern id="ag" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="480" height="680" fill="url(#ag)"/>

      {/* Background blobs */}
      <circle cx="60"  cy="100" r="220" fill="rgba(255,255,255,0.025)"/>
      <circle cx="440" cy="620" r="250" fill="rgba(255,255,255,0.02)"/>

      {/* HOSPITAL BUILDING */}
      {/* Main body */}
      <rect x="115" y="295" width="250" height="320" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="4" rx="2"/>
      {/* Roof gable */}
      <polygon points="95,295 385,295 385,240 240,158 95,240"
        fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="4"/>
      {/* Tower above roof */}
      <rect x="195" y="195" width="90" height="98" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3"/>
      {/* Medical cross on tower */}
      <g fill="rgba(255,255,255,0.5)">
        <rect x="231" y="162" width="14" height="44" rx="2"/>
        <rect x="217" y="176" width="44" height="14" rx="2"/>
      </g>
      {/* Windows row 1 */}
      <g fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5">
        <rect x="143" y="325" width="48" height="48" rx="4"/>
        <rect x="216" y="325" width="48" height="48" rx="4"/>
        <rect x="289" y="325" width="48" height="48" rx="4"/>
      </g>
      {/* Windows row 2 */}
      <g fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="2">
        <rect x="143" y="400" width="48" height="48" rx="4"/>
        <rect x="289" y="400" width="48" height="48" rx="4"/>
      </g>
      {/* Door */}
      <rect x="212" y="530" width="56" height="85" rx="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
      <circle cx="258" cy="575" r="4" fill="rgba(255,255,255,0.25)"/>

      {/* BAR CHART – bottom left */}
      <g fill="rgba(255,255,255,0.25)">
        <rect x="22" y="548" width="24" height="67"/>
        <rect x="56" y="514" width="24" height="101"/>
        <rect x="90" y="530" width="24" height="85"/>
      </g>
      <line x1="14" y1="617" x2="126" y2="617" stroke="rgba(255,255,255,0.28)" strokeWidth="2"/>

      {/* NETWORK GRAPH – top right */}
      <g fill="rgba(255,255,255,0.3)">
        <circle cx="415" cy="118" r="10"/>
        <circle cx="458" cy="175" r="8"/>
        <circle cx="398" cy="195" r="8"/>
        <circle cx="445" cy="245" r="7"/>
      </g>
      <g stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none">
        <line x1="415" y1="118" x2="458" y2="175"/>
        <line x1="458" y1="175" x2="398" y2="195"/>
        <line x1="398" y1="195" x2="445" y2="245"/>
        <line x1="415" y1="118" x2="398" y2="195"/>
      </g>

      {/* Decorative cross accents */}
      <g fill="rgba(255,255,255,0.08)">
        <rect x="438" y="390" width="9" height="28" rx="2"/><rect x="429" y="399" width="28" height="9" rx="2"/>
        <rect x="28"  y="195" width="9" height="28" rx="2"/><rect x="19"  y="204" width="28" height="9" rx="2"/>
      </g>
    </svg>
  );
}

export default function AdminLoginPage() {
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
        body: JSON.stringify({ role: "admin", identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Identifiants incorrects"); setLoading(false); return; }
      router.push("/admin");
    } catch { setError("Erreur réseau"); setLoading(false); }
  };

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Panneau gauche – illustration ── */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col items-center justify-center"
        style={{ background: "linear-gradient(155deg,#042f2e 0%,#0f4c48 50%,#0d6b63 100%)" }}>
        <Illustration />

        <div className="relative z-10 text-center px-14 max-w-md">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-3">Administration</h2>
          <p className="text-white/55 text-[0.93rem] leading-relaxed">
            Gérez le personnel médical, les patients, les finances et les paramètres du système.
          </p>

          <div className="mt-10 space-y-3 text-left max-w-xs mx-auto">
            {["Gestion du personnel médical", "Registre des patients", "Suivi des recettes", "Paramètres du système"].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(94,234,212,0.2)", border: "1px solid rgba(94,234,212,0.4)" }}>
                  <svg className="w-3 h-3 text-teal-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-md" style={{ background: "#0d9488" }}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Administration</h1>
            <p className="text-gray-400 text-sm mt-0.5">{etablissement}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom d'utilisateur</label>
              <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
                className="input-field" placeholder="admin" required autoFocus/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input-field" placeholder="••••••••" required/>
            </div>
            {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-3 text-[0.95rem] mt-1 text-white font-medium rounded-lg transition-all shadow-sm"
              style={{ background: loading ? "#5eead4" : "#0d9488" }}>
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p className="mt-6 text-xs text-gray-300 text-center">
            Démo : <span className="text-gray-400">admin / admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
