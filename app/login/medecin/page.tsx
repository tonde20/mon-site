"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function Illustration() {
  return (
    <svg viewBox="0 0 480 680" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {/* Subtle grid */}
      <defs>
        <pattern id="mg" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="480" height="680" fill="url(#mg)"/>

      {/* Large background circles */}
      <circle cx="400" cy="80"  r="260" fill="rgba(255,255,255,0.025)"/>
      <circle cx="60"  cy="620" r="300" fill="rgba(255,255,255,0.018)"/>

      {/* ECG heartbeat line */}
      <polyline points="0,360 110,360 155,255 200,465 245,315 285,360 480,360"
        fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>

      {/* STETHOSCOPE */}
      {/* Headset arc */}
      <path d="M 148 195 Q 240 120 332 195" fill="none" stroke="white" strokeWidth="13" strokeLinecap="round" opacity="0.78"/>
      {/* Left arm */}
      <path d="M 148 195 L 140 245 Q 132 295 185 325 Q 230 348 240 385"
        fill="none" stroke="white" strokeWidth="13" strokeLinecap="round" opacity="0.78"/>
      {/* Right arm */}
      <path d="M 332 195 L 340 245 Q 348 295 295 325 Q 250 348 240 385"
        fill="none" stroke="white" strokeWidth="13" strokeLinecap="round" opacity="0.78"/>
      {/* Tubing curve down */}
      <path d="M 240 385 Q 215 455 238 530 Q 258 595 308 618 Q 350 638 362 598"
        fill="none" stroke="white" strokeWidth="13" strokeLinecap="round" opacity="0.78"/>
      {/* Ear pieces */}
      <circle cx="140" cy="183" r="24" fill="none" stroke="white" strokeWidth="11" opacity="0.78"/>
      <circle cx="340" cy="183" r="24" fill="none" stroke="white" strokeWidth="11" opacity="0.78"/>
      {/* Diaphragm (chest piece) */}
      <circle cx="358" cy="572" r="62" fill="none" stroke="white" strokeWidth="10" opacity="0.78"/>
      <circle cx="358" cy="572" r="43" fill="none" stroke="white" strokeWidth="4"  opacity="0.38"/>
      <circle cx="358" cy="572" r="20" fill="white" opacity="0.08"/>

      {/* Medical crosses */}
      <g fill="rgba(255,255,255,0.14)">
        <rect x="42"  y="130" width="14" height="44" rx="3"/><rect x="28"  y="144" width="44" height="14" rx="3"/>
      </g>
      <g fill="rgba(255,255,255,0.08)">
        <rect x="408" y="440" width="10" height="30" rx="2"/><rect x="398" y="450" width="30" height="10" rx="2"/>
      </g>

      {/* Decorative dots */}
      <circle cx="430" cy="260" r="5" fill="white" opacity="0.18"/>
      <circle cx="450" cy="295" r="3" fill="white" opacity="0.12"/>
      <circle cx="55"  cy="290" r="4" fill="white" opacity="0.15"/>
      <circle cx="35"  cy="320" r="3" fill="white" opacity="0.10"/>
    </svg>
  );
}

export default function MedecinLoginPage() {
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
        body: JSON.stringify({ role: "medecin", identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Identifiants incorrects"); setLoading(false); return; }
      router.push("/medecin");
    } catch { setError("Erreur réseau"); setLoading(false); }
  };

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Panneau gauche – illustration ── */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col items-center justify-center"
        style={{ background: "linear-gradient(155deg,#052e16 0%,#064e3b 55%,#065f46 100%)" }}>
        <Illustration />

        {/* Overlay content */}
        <div className="relative z-10 text-center px-14 max-w-md">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-3">Espace Médecin</h2>
          <p className="text-white/55 text-[0.93rem] leading-relaxed">
            Accédez aux dossiers médicaux, saisissez vos consultations et générez vos documents officiels.
          </p>

          <div className="mt-10 space-y-3 text-left max-w-xs mx-auto">
            {["Dossiers médicaux partagés", "Prescriptions & examens PDF", "Certificats officiels", "Gestion des rendez-vous"].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(74,222,128,0.2)", border: "1px solid rgba(74,222,128,0.4)" }}>
                  <svg className="w-3 h-3 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Connexion Médecin</h1>
            <p className="text-gray-400 text-sm mt-0.5">{etablissement}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom d'utilisateur</label>
              <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
                className="input-field" placeholder="medecin1" required autoFocus/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input-field" placeholder="••••••••" required/>
            </div>
            {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[0.95rem] mt-1">
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p className="mt-6 text-xs text-gray-300 text-center">
            Démo : <span className="text-gray-400">medecin1 / medecin1123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
