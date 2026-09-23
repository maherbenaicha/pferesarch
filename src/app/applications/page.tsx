"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { cn, statusBadge, statusLabel } from "@/lib/utils";
import { Send, Building2, MapPin, Calendar, ChevronDown } from "lucide-react";

interface ApplicationRow {
  application: {
    id: number;
    offerId: number | null;
    status: string | null;
    sentAt: string | null;
    followUpAt: string | null;
    notes: string | null;
    response: string | null;
  };
  offer: {
    id: number;
    title: string;
    company: string;
    location: string | null;
    matchScore: number | null;
  } | null;
}

const STATUS_OPTIONS = [
  { value: "sent", label: "Envoyée" },
  { value: "followed_up", label: "Relancée" },
  { value: "interview", label: "Entretien" },
  { value: "declined", label: "Refusée" },
];

export default function ApplicationsPage() {
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<number, string>>({});

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/applications");
    const data = (await res.json()) as ApplicationRow[];
    setApps(data);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const updateApp = async (id: number, data: { status?: string; notes?: string; response?: string }) => {
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await load();
  };

  const interviews = apps.filter((a) => a.application.status === "interview").length;
  const pending = apps.filter((a) => a.application.status === "sent").length;

  return (
    <AppShell>
      <div className="p-8 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-6 h-6 text-blue-600" />
            Mes candidatures
          </h1>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-slate-500">{apps.length} total</span>
            <span className="text-amber-600">{pending} en attente de réponse</span>
            <span className="text-pink-600">{interviews} entretien(s)</span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-20">
            <Send className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Aucune candidature envoyée</p>
            <p className="text-slate-400 text-sm mt-1">
              Approuvez des offres et confirmez l&apos;envoi pour les voir ici
            </p>
            <a
              href="/offers?status=approved"
              className="inline-block mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Voir les offres approuvées →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map(({ application: app, offer }) => (
              <div key={app.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up">
                <div
                  className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{offer?.title ?? "Offre supprimée"}</h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {offer?.company && (
                          <span className="flex items-center gap-1 text-slate-600 text-sm">
                            <Building2 className="w-3.5 h-3.5" /> {offer.company}
                          </span>
                        )}
                        {offer?.location && (
                          <span className="flex items-center gap-1 text-slate-500 text-sm">
                            <MapPin className="w-3.5 h-3.5" /> {offer.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", statusBadge(app.status ?? ""))}>
                        {statusLabel(app.status ?? "")}
                      </span>
                      <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", expandedId === app.id && "rotate-180")} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    {app.sentAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Envoyée le {new Date(app.sentAt).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                    {offer?.matchScore && <span>Score: {offer.matchScore}%</span>}
                  </div>
                </div>

                {expandedId === app.id && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
                    {/* Status update */}
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-2">Mettre à jour le statut</label>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => void updateApp(app.id, { status: opt.value })}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                              app.status === opt.value
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1">Notes / réponse reçue</label>
                      <textarea
                        defaultValue={app.notes ?? ""}
                        onChange={(e) => setNotesDraft((d) => ({ ...d, [app.id]: e.target.value }))}
                        rows={3}
                        placeholder="Ajouter des notes sur cette candidature..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      <button
                        onClick={() => void updateApp(app.id, { notes: notesDraft[app.id] ?? app.notes ?? "" })}
                        className="mt-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors"
                      >
                        Sauvegarder les notes
                      </button>
                    </div>

                    {/* Link to offer */}
                    {offer && (
                      <a
                        href={`/offers/${offer.id}`}
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Voir l&apos;offre complète →
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
