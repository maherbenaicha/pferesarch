"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { Search, Play, RefreshCw, CheckCircle2, AlertCircle, Clock, Zap } from "lucide-react";

interface SearchSession {
  id: number;
  status: string;
  offersFound: number;
  offersAnalyzed: number;
  log: string;
  startedAt: string;
  finishedAt: string | null;
  sources: string[];
}

export default function SearchPage() {
  const [sessions, setSessions] = useState<SearchSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [activeSession, setActiveSession] = useState<SearchSession | null>(null);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const loadSessions = useCallback(async () => {
    const res = await fetch("/api/search");
    const data = (await res.json()) as SearchSession[];
    setSessions(data);
  }, []);

  const pollSession = useCallback(async (id: number) => {
    const res = await fetch(`/api/search/${id}`);
    const data = (await res.json()) as SearchSession;
    setActiveSession(data);

    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }

    if (data.status === "done" || data.status === "error") {
      if (pollRef.current) clearInterval(pollRef.current);
      await loadSessions();
      setLaunching(false);
    }
  }, [loadSessions]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (activeSessionId) {
      void pollSession(activeSessionId);
      pollRef.current = setInterval(() => void pollSession(activeSessionId), 2000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeSessionId, pollSession]);

  const launch = async () => {
    setLaunching(true);
    setError("");
    try {
      const res = await fetch("/api/search", { method: "POST" });
      const data = (await res.json()) as { sessionId?: number; error?: string };
      if (data.error) {
        setError(data.error);
        setLaunching(false);
      } else if (data.sessionId) {
        setActiveSessionId(data.sessionId);
      }
    } catch (err) {
      setError(String(err));
      setLaunching(false);
    }
  };

  const formatLog = (log: string) => {
    return log.split("\n").map((line, i) => {
      let cls = "";
      if (line.startsWith("✅") || line.startsWith("🎉")) cls = "log-success";
      else if (line.startsWith("❌")) cls = "log-error";
      else if (line.startsWith("🔍") || line.startsWith("🤖") || line.startsWith("📋")) cls = "log-info";
      else if (line.startsWith("⚠️") || line.startsWith("💡")) cls = "log-warn";
      return <span key={i} className={cls}>{line}{"\n"}</span>;
    });
  };

  const isRunning = activeSession?.status === "running" || launching;

  return (
    <AppShell>
      <div className="p-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-600" />
            Recherche IA de PFE
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            L&apos;agent IA recherche et analyse automatiquement des offres de PFE en Europe
          </p>
        </div>

        {/* Launch card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-7 mb-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <h2 className="font-bold text-lg">Lancer une nouvelle recherche</h2>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                L&apos;agent va générer des requêtes intelligentes, scraper LinkedIn, Indeed, 
                Welcome to the Jungle et ErasmusIntern, puis analyser chaque offre avec GPT-4.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {["LinkedIn", "Indeed", "WTTJ", "ErasmusIntern"].map((s) => (
                  <span key={s} className="text-xs px-2.5 py-1 bg-slate-700 rounded-full text-slate-300">{s}</span>
                ))}
              </div>
            </div>
            <button
              onClick={launch}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors disabled:opacity-60 flex-shrink-0 shadow-lg"
            >
              {isRunning ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> En cours...</>
              ) : (
                <><Play className="w-4 h-4" /> Démarrer</>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Active session */}
        {activeSession && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                {activeSession.status === "running" && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
                {activeSession.status === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {activeSession.status === "error" && <AlertCircle className="w-4 h-4 text-red-500" />}
                Session #{activeSession.id}
              </h3>
              <div className="flex gap-3 text-sm">
                <span className="text-slate-500">Trouvées: <strong className="text-slate-900">{activeSession.offersFound}</strong></span>
                <span className="text-slate-500">Retenues: <strong className="text-emerald-600">{activeSession.offersAnalyzed}</strong></span>
              </div>
            </div>

            {/* Log terminal */}
            <div className="terminal" ref={logRef}>
              {formatLog(activeSession.log ?? "")}
              {activeSession.status === "running" && (
                <span className="text-blue-400">
                  <span className="animate-pulse-dot">▋</span>
                </span>
              )}
            </div>

            {activeSession.status === "done" && (
              <div className="mt-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-emerald-800 font-semibold text-sm">Recherche terminée !</p>
                  <p className="text-emerald-700 text-sm">
                    {activeSession.offersAnalyzed} offre(s) correspondant à votre profil ont été trouvées et analysées.
                    <a href="/offers" className="text-emerald-600 font-bold ml-1 underline">Voir les offres →</a>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sessions history */}
        {sessions.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Historique des recherches
            </h3>
            <div className="space-y-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => { setActiveSession(s); setActiveSessionId(s.status === "running" ? s.id : null); }}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      s.status === "running" ? "bg-blue-500 animate-pulse" :
                      s.status === "done" ? "bg-emerald-500" :
                      s.status === "error" ? "bg-red-500" : "bg-slate-300"
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Session #{s.id}</p>
                      <p className="text-xs text-slate-400">
                        {s.offersFound ?? 0} trouvée(s) · {s.offersAnalyzed ?? 0} retenue(s)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">
                      {s.startedAt ? new Date(s.startedAt).toLocaleDateString("fr-FR") : "—"}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">{s.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
