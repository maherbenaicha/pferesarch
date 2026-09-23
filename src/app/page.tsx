import { getPool } from "@/db";
import type { Profile, SearchSession, Offer, Application, ApplicationStatus, SearchStatus } from "@/db/schema";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import Link from "next/link";
import {
  Search,
  Briefcase,
  Send,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Bot,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const pool = await getPool();

  const [profileResult, sessionResult, offerResult, appResult] = await Promise.all([
    pool.request().query("SELECT TOP 1 * FROM profiles ORDER BY id"),
    pool.request().query("SELECT TOP 5 * FROM search_sessions ORDER BY id DESC"),
    pool.request().query("SELECT id, status, match_score FROM offers"),
    pool.request().query("SELECT id, status FROM applications"),
  ]);

  const profileRow = profileResult.recordset[0] as Record<string, unknown> | undefined;
  const profile: Partial<Profile> | undefined = profileRow
    ? {
        fullName: profileRow["full_name"] as string,
        fieldOfStudy: profileRow["field_of_study"] as string | null,
        skills: profileRow["skills"] as string | null,
      }
    : undefined;

  const sessionRows: SearchSession[] = sessionResult.recordset.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: row["id"] as number,
      status: row["status"] as SearchStatus | null,
      offersFound: row["offers_found"] as number | null,
      offersAnalyzed: row["offers_analyzed"] as number | null,
      sources: row["sources"] as string | null,
      log: row["log"] as string | null,
      startedAt: row["started_at"] as Date | null,
      finishedAt: row["finished_at"] as Date | null,
    };
  });

  const offerRows: Pick<Offer, "id" | "status" | "matchScore">[] =
    offerResult.recordset.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: row["id"] as number,
        status: row["status"] as ApplicationStatus | null,
        matchScore: row["match_score"] as number | null,
      };
    });

  const appRows: Pick<Application, "id" | "status">[] =
    appResult.recordset.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: row["id"] as number,
        status: row["status"] as ApplicationStatus | null,
      };
    });

  const totalOffers = offerRows.length;
  const pendingOffers = offerRows.filter((o) => o.status === "pending_review").length;
  const approvedOffers = offerRows.filter((o) => o.status === "approved").length;
  const sentApps = appRows.length;
  const interviews = appRows.filter((a) => a.status === "interview").length;

  const avgScore =
    offerRows.length > 0
      ? Math.round(offerRows.reduce((s, o) => s + (o.matchScore ?? 0), 0) / offerRows.length)
      : 0;

  // skills est stocké en JSON string ex: '["React","Node.js"]'
  let skillsArray: string[] = [];
  try {
    if (profile?.skills) skillsArray = JSON.parse(profile.skills) as string[];
  } catch { /* ignore */ }

  const isProfileComplete =
    profile && profile.fullName && profile.fieldOfStudy && skillsArray.length > 0;

  return (
    <AppShell>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Bonjour{profile?.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""} 👋
              </h1>
          <p className="text-slate-500 text-sm">
            Votre agent IA de recherche de PFE en Europe
            {(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY) && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                🤖 IA connectée
              </span>
            )}
          </p>
            </div>
          </div>
        </div>

        {/* Alert if profile not complete */}
        {!isProfileComplete && (
          <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-amber-800 font-semibold text-sm">Profil incomplet</p>
              <p className="text-amber-700 text-sm mt-0.5">
                Complétez votre profil pour que l&apos;agent IA puisse lancer une recherche personnalisée.
              </p>
            </div>
            <Link
              href="/profile"
              className="text-sm bg-amber-500 text-white px-4 py-1.5 rounded-lg hover:bg-amber-600 transition-colors font-medium whitespace-nowrap"
            >
              Compléter →
            </Link>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard label="Offres trouvées" value={totalOffers} icon={Briefcase} color="blue" sub="au total" />
          <StatCard label="En attente" value={pendingOffers} icon={Clock} color="amber" sub="à valider" />
          <StatCard label="Approuvées" value={approvedOffers} icon={CheckCircle2} color="green" sub="par vous" />
          <StatCard label="Candidatures" value={sentApps} icon={Send} color="purple" sub="envoyées" />
          <StatCard label="Entretiens" value={interviews} icon={TrendingUp} color="pink" sub="obtenus" />
          <StatCard label="Score moyen" value={`${avgScore}%`} icon={Zap} color="slate" sub="de correspondance" />
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              Actions rapides
            </h2>
            <div className="space-y-3">
              <Link
                href="/search"
                className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90 transition-opacity group"
              >
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5" />
                  <div>
                    <p className="font-semibold text-sm">Lancer une recherche</p>
                    <p className="text-blue-100 text-xs">L&apos;IA cherche pour vous</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/offers?status=pending_review"
                className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-semibold text-sm text-amber-800">Valider les offres</p>
                    <p className="text-amber-600 text-xs">{pendingOffers} offre(s) à examiner</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/applications"
                className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Send className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="font-semibold text-sm text-emerald-800">Suivre mes candidatures</p>
                    <p className="text-emerald-600 text-xs">{sentApps} candidature(s)</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Last sessions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-500" />
              Dernières recherches
            </h2>
            {sessionRows.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Aucune recherche lancée</p>
                <Link href="/search" className="text-blue-600 text-sm hover:underline mt-1 inline-block">
                  Lancer la première →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {sessionRows.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          s.status === "running" ? "bg-blue-500 animate-pulse" :
                          s.status === "done" ? "bg-emerald-500" :
                          s.status === "error" ? "bg-red-500" : "bg-slate-400"
                        }`} />
                        <span className="text-sm font-medium text-slate-700 capitalize">{s.status}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 ml-4">
                        {s.offersAnalyzed ?? 0} offre(s) retenue(s) · Session #{s.id}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {s.startedAt ? new Date(s.startedAt).toLocaleDateString("fr-FR") : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            Comment fonctionne l&apos;agent ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Recherche", desc: "L'IA génère des requêtes et scrape LinkedIn, Indeed, WTTJ..." },
              { step: "2", title: "Analyse", desc: "Chaque offre est scorée et comparée à votre profil" },
              { step: "3", title: "Préparation", desc: "CV adapté, lettre de motivation et message LinkedIn générés" },
              { step: "4", title: "Validation", desc: "Vous validez avant tout envoi. Contrôle total gardé." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {step}
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">{title}</p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
