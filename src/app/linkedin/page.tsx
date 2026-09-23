"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { Link2, Shield, Eye, EyeOff, Save, CheckCircle2, AlertTriangle, Info } from "lucide-react";

interface LinkedInData {
  id: number | null;
  email: string;
  passwordHint: string;
  isActive: boolean;
  lastConnected: string | null;
}

export default function LinkedInPage() {
  const [data, setData] = useState<LinkedInData>({ id: null, email: "", passwordHint: "", isActive: false, lastConnected: null });
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/linkedin")
      .then((r) => r.json())
      .then((d: LinkedInData) => setData({
        id: d.id ?? null,
        email: d.email ?? "",
        passwordHint: d.passwordHint ?? "",
        isActive: d.isActive ?? false,
        lastConnected: d.lastConnected ?? null,
      }))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/linkedin", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email, password, passwordHint: password ? "••••••••" : data.passwordHint, isActive: true }),
    });
    const updated = (await res.json()) as LinkedInData;
    setData(updated);
    setPassword("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  if (loading) return <AppShell><div className="p-8 text-slate-500">Chargement...</div></AppShell>;

  return (
    <AppShell>
      <div className="p-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Link2 className="w-6 h-6 text-blue-600" />
            Accès LinkedIn
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configurez l&apos;accès LinkedIn pour permettre à l&apos;agent de rechercher des offres
          </p>
        </div>

        {/* Security notice */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-800 font-semibold text-sm">Sécurité et confidentialité</p>
              <ul className="text-blue-700 text-sm mt-2 space-y-1.5 list-disc list-inside">
                <li>Vos identifiants sont stockés localement dans votre base de données</li>
                <li>L&apos;agent utilise uniquement la recherche publique LinkedIn Jobs</li>
                <li>Aucune action n&apos;est effectuée sans votre validation explicite</li>
                <li>Nous recommandons d&apos;utiliser un mot de passe d&apos;application LinkedIn</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className={`mb-6 rounded-2xl border p-4 flex items-center gap-3 ${data.isActive && data.email ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
          {data.isActive && data.email ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-emerald-800 font-semibold text-sm">LinkedIn configuré</p>
                <p className="text-emerald-600 text-xs mt-0.5">
                  Connecté avec {data.email}
                  {data.lastConnected && ` · Dernière connexion: ${new Date(data.lastConnected).toLocaleDateString("fr-FR")}`}
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-slate-700 font-semibold text-sm">LinkedIn non configuré</p>
                <p className="text-slate-500 text-xs mt-0.5">L&apos;agent utilisera la recherche publique uniquement</p>
              </div>
            </>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Identifiants LinkedIn</h2>

          {/* Google sign-in notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-amber-800 text-xs leading-relaxed">
              <p className="font-semibold mb-1">Vous utilisez LinkedIn avec Google ?</p>
              <p>
                Entrez simplement votre adresse email et laissez le champ mot de passe vide.
                L&apos;agent utilisera uniquement la <strong>recherche publique LinkedIn Jobs</strong> —
                aucune connexion à votre compte n&apos;est nécessaire.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email LinkedIn</label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
              placeholder="votre@email.com"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Mot de passe{" "}
              <span className="text-slate-400 font-normal">(optionnel — laisser vide si connexion via Google)</span>
              {data.passwordHint && <span className="text-slate-400 ml-2">(actuellement: {data.passwordHint})</span>}
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Laisser vide pour connexion Google ou pour ne pas modifier"
                className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            onClick={save}
            disabled={saving || !data.email}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Sauvegarde..." : saved ? "✓ Sauvegardé" : "Sauvegarder"}
          </button>
        </div>

        {/* How LinkedIn search works */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-blue-500" />
            Comment fonctionne la recherche LinkedIn ?
          </h2>
          <div className="space-y-3">
            {[
              {
                step: "1",
                title: "Recherche publique",
                desc: "L'agent utilise l'API publique de recherche LinkedIn Jobs pour trouver des offres de PFE correspondant à vos critères.",
              },
              {
                step: "2",
                title: "Filtrage intelligent",
                desc: "Les offres sont filtrées par type (stage/internship), localisation (Europe), et pertinence avec votre profil.",
              },
              {
                step: "3",
                title: "Analyse IA",
                desc: "Chaque offre est analysée par GPT-4 pour calculer un score de correspondance et préparer votre candidature.",
              },
              {
                step: "4",
                title: "Votre validation",
                desc: "Vous examinez chaque candidature préparée avant qu'elle ne soit envoyée. Vous avez le contrôle total.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GDPR notice */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-amber-700 text-xs leading-relaxed">
            <strong>Important:</strong> L&apos;utilisation automatisée de LinkedIn est soumise aux conditions d&apos;utilisation de la plateforme. 
            Cet outil respecte les limites de débit et n&apos;effectue que des recherches légitimes. 
            Vos données ne sont jamais partagées avec des tiers.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
