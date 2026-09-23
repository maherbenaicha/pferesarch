"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import {
  User, Save, Plus, X, MapPin, BookOpen, Languages,
  Briefcase, Target, FileText, Clock, Star
} from "lucide-react";

interface Profile {
  id?: number;
  fullName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  location: string;
  targetCountries: string[];
  skills: string[];
  languages: string[];
  educationLevel: string;
  fieldOfStudy: string;
  availableFrom: string;
  durationMonths: number;
  cvContent: string;
  keywords: string[];
  excludeKeywords: string[];
  minMatchScore: number;
}

const DEFAULT_PROFILE: Profile = {
  fullName: "",
  email: "",
  phone: "",
  linkedinUrl: "",
  location: "",
  targetCountries: [],
  skills: [],
  languages: [],
  educationLevel: "",
  fieldOfStudy: "",
  availableFrom: "",
  durationMonths: 6,
  cvContent: "",
  keywords: [],
  excludeKeywords: [],
  minMatchScore: 60,
};

const EDUCATION_LEVELS = ["Bac+3 (Licence)", "Bac+4 (Master 1)", "Bac+5 (Master 2)", "Bac+5 (Ingénieur)", "Doctorat"];
const COUNTRIES = ["France", "Allemagne", "Espagne", "Pays-Bas", "Belgique", "Suisse", "Italie", "Portugal", "Suède", "Irlande", "Finlande", "Luxembourg"];

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
  };

  const remove = (t: string) => onChange(tags.filter((x) => x !== t));

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <button onClick={add} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full">
            {t}
            <button onClick={() => remove(t)} className="hover:text-blue-900">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: Profile & { error?: string }) => {
        if (data.error) { setSaveError(`Chargement impossible : ${data.error}`); return; }
        setProfile({
          ...DEFAULT_PROFILE,
          ...data,
          // Coerce null → "" for all string fields so controlled inputs stay controlled
          fullName: data.fullName ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          linkedinUrl: data.linkedinUrl ?? "",
          location: data.location ?? "",
          educationLevel: data.educationLevel ?? "",
          fieldOfStudy: data.fieldOfStudy ?? "",
          availableFrom: data.availableFrom ?? "",
          cvContent: data.cvContent ?? "",
          durationMonths: data.durationMonths ?? 6,
          minMatchScore: data.minMatchScore ?? 60,
          skills: Array.isArray(data.skills) ? data.skills : [],
          languages: Array.isArray(data.languages) ? data.languages : [],
          targetCountries: Array.isArray(data.targetCountries) ? data.targetCountries : [],
          keywords: Array.isArray(data.keywords) ? data.keywords : [],
          excludeKeywords: Array.isArray(data.excludeKeywords) ? data.excludeKeywords : [],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setProfile((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `Erreur ${res.status}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleCountry = (c: string) => {
    const tc = Array.isArray(profile.targetCountries) ? profile.targetCountries : [];
    set("targetCountries", tc.includes(c) ? tc.filter((x) => x !== c) : [...tc, c]);
  };

  if (loading) return <AppShell><div className="p-8 text-slate-500">Chargement...</div></AppShell>;

  return (
    <AppShell>
      <div className="p-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              Mon Profil
            </h1>
            <p className="text-slate-500 text-sm mt-1">Ces informations permettent à l&apos;IA de personnaliser la recherche</p>
            {saveError && <p className="text-red-600 text-sm mt-1">❌ Non sauvegardé : {saveError}</p>}
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Sauvegarde..." : saved ? "✓ Sauvegardé" : "Sauvegarder"}
          </button>
        </div>

        <div className="space-y-6">
          {/* Personal info */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-blue-500" />
              Informations personnelles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Nom complet", key: "fullName", placeholder: "Prénom Nom" },
                { label: "Email", key: "email", placeholder: "email@exemple.com" },
                { label: "Téléphone", key: "phone", placeholder: "+33 6 00 00 00 00" },
                { label: "URL LinkedIn", key: "linkedinUrl", placeholder: "https://linkedin.com/in/..." },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input
                    value={(profile[key as keyof Profile] as string) ?? ""}
                    onChange={(e) => set(key as keyof Profile, e.target.value as Profile[keyof Profile])}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-blue-500" />
              Formation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Niveau d&apos;études</label>
                <select
                  value={profile.educationLevel}
                  onChange={(e) => set("educationLevel", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Sélectionner...</option>
                  {EDUCATION_LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Domaine d&apos;études</label>
                <input
                  value={profile.fieldOfStudy}
                  onChange={(e) => set("fieldOfStudy", e.target.value)}
                  placeholder="Ex: Informatique, Finance, Data Science..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          {/* Skills */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-blue-500" />
              Compétences
            </h2>
            <TagInput
              tags={Array.isArray(profile.skills) ? profile.skills : []}
              onChange={(v) => set("skills", v)}
              placeholder="Ex: Python, React, Machine Learning..."
            />
          </section>

          {/* Languages */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Languages className="w-4 h-4 text-blue-500" />
              Langues
            </h2>
            <TagInput
              tags={Array.isArray(profile.languages) ? profile.languages : []}
              onChange={(v) => set("languages", v)}
              placeholder="Ex: Français (C2), Anglais (C1)..."
            />
          </section>

          {/* Search preferences */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-blue-500" />
              Critères de recherche
            </h2>

            <div className="space-y-5">
              {/* Countries */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Pays cibles
                </label>
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map((c) => {
                    const tc = Array.isArray(profile.targetCountries) ? profile.targetCountries : [];
                    const active = tc.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => toggleCountry(c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Disponible à partir du
                  </label>
                  <input
                    type="date"
                    value={profile.availableFrom}
                    onChange={(e) => set("availableFrom", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Durée souhaitée (mois)</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={profile.durationMonths}
                    onChange={(e) => set("durationMonths", parseInt(e.target.value) || 6)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Min score */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Score minimum de correspondance : <span className="text-blue-600 font-bold">{profile.minMatchScore}%</span>
                </label>
                <input
                  type="range"
                  min={30}
                  max={90}
                  step={5}
                  value={profile.minMatchScore}
                  onChange={(e) => set("minMatchScore", parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>30% (large)</span>
                  <span>90% (strict)</span>
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  <Briefcase className="w-3.5 h-3.5 inline mr-1" />
                  Mots-clés à inclure
                </label>
                <TagInput
                  tags={Array.isArray(profile.keywords) ? profile.keywords : []}
                  onChange={(v) => set("keywords", v)}
                  placeholder="Ex: IA, startup, finance..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Mots-clés à exclure
                </label>
                <TagInput
                  tags={Array.isArray(profile.excludeKeywords) ? profile.excludeKeywords : []}
                  onChange={(v) => set("excludeKeywords", v)}
                  placeholder="Ex: vente, commercial..."
                />
              </div>
            </div>
          </section>

          {/* CV */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-blue-500" />
              Contenu du CV (texte brut)
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Collez ici le texte de votre CV. L&apos;IA l&apos;utilisera pour adapter vos candidatures.
            </p>
            <textarea
              value={profile.cvContent}
              onChange={(e) => set("cvContent", e.target.value)}
              placeholder="Collez votre CV ici (formations, expériences, compétences, projets...)"
              rows={12}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-y"
            />
          </section>

          {/* Save button */}
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Sauvegarde en cours..." : saved ? "✓ Profil sauvegardé !" : "Sauvegarder le profil"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}