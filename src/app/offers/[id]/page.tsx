"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { cn, scoreColor, statusBadge, statusLabel } from "@/lib/utils";
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Send,
  Building2,
  MapPin,
  Star,
  FileText,
  MessageSquare,
  Link2,
  Edit3,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface AIAnalysis {
  strengths?: string[];
  gaps?: string[];
  tags?: string[];
}

interface Offer {
  id: number;
  title: string;
  company: string;
  location: string | null;
  country: string | null;
  source: string | null;
  sourceUrl: string | null;
  matchScore: number | null;
  matchReason: string | null;
  status: string | null;
  description: string | null;
  requirements: string[] | null;
  adaptedCv: string | null;
  coverLetter: string | null;
  linkedinMessage: string | null;
  aiAnalysis: AIAnalysis | null;
  postedAt: string | null;
  createdAt: string | null;
}

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
      >
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Icon className="w-4 h-4 text-blue-500" />
          {title}
        </h3>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function EditableTextArea({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-slate-500">{label}</label>
        <button
          onClick={() => {
            if (editing) onChange(draft);
            setEditing((e) => !e);
          }}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
        >
          {editing ? <><Save className="w-3 h-3" /> Enregistrer</> : <><Edit3 className="w-3 h-3" /> Modifier</>}
        </button>
      </div>
      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={12}
          className="w-full px-3 py-2 rounded-lg border border-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-y"
        />
      ) : (
        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-mono border border-slate-100">
          {value || <span className="text-slate-400 italic">Non généré</span>}
        </div>
      )}
    </div>
  );
}

export default function OfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/offers/${id}`);
    const data = (await res.json()) as Offer;
    setOffer(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const patch = async (data: Partial<Offer>) => {
    setActionLoading(true);
    await fetch(`/api/offers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await load();
    setActionLoading(false);
  };

  const sendApplication = async () => {
    setActionLoading(true);
    await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId: parseInt(id) }),
    });
    await load();
    setConfirmSend(false);
    setActionLoading(false);
  };

  if (loading) return <AppShell><div className="p-8 text-slate-500">Chargement...</div></AppShell>;
  if (!offer) return <AppShell><div className="p-8 text-red-500">Offre introuvable</div></AppShell>;

  const score = offer.matchScore ?? 0;
  const analysis = offer.aiAnalysis as AIAnalysis | null;

  return (
    <AppShell>
      <div className="p-8 max-w-3xl">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux offres
        </button>

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          {/* Score bar */}
          <div className="h-1.5 bg-slate-100 rounded-full mb-5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
              style={{ width: `${score}%` }}
            />
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{offer.title}</h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-slate-600 text-sm">
                  <Building2 className="w-3.5 h-3.5" /> {offer.company}
                </span>
                {offer.location && (
                  <span className="flex items-center gap-1 text-slate-500 text-sm">
                    <MapPin className="w-3.5 h-3.5" /> {offer.location}
                  </span>
                )}
                {offer.source && (
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{offer.source}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={cn("text-lg font-bold px-3 py-1.5 rounded-xl border", scoreColor(score))}>
                {score}% match
              </span>
              <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", statusBadge(offer.status ?? ""))}>
                {statusLabel(offer.status ?? "")}
              </span>
            </div>
          </div>

          {offer.sourceUrl && (
            <a
              href={offer.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Voir l&apos;offre originale
            </a>
          )}
        </div>

        <div className="space-y-4">
          {/* AI Analysis */}
          <Section title="Analyse IA" icon={Star}>
            {offer.matchReason && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                <p className="text-sm text-blue-800 leading-relaxed">{offer.matchReason}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis?.strengths && analysis.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-700 mb-2">✅ Points forts</p>
                  <ul className="space-y-1.5">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-emerald-500 mt-0.5">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis?.gaps && analysis.gaps.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-700 mb-2">⚠️ Points à améliorer</p>
                  <ul className="space-y-1.5">
                    {analysis.gaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-amber-500 mt-0.5">•</span> {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {analysis?.tags && analysis.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {analysis.tags.map((t, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">{t}</span>
                ))}
              </div>
            )}
          </Section>

          {/* Description */}
          {offer.description && (
            <Section title="Description de l'offre" icon={FileText} defaultOpen={false}>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{offer.description}</p>
              {offer.requirements && offer.requirements.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Exigences</p>
                  <div className="flex flex-wrap gap-2">
                    {offer.requirements.map((r, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">{r}</span>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Adapted CV */}
          <Section title="Résumé CV adapté" icon={FileText}>
            <EditableTextArea
              label="Résumé professionnel adapté à cette offre"
              value={offer.adaptedCv ?? ""}
              onChange={(v) => void patch({ adaptedCv: v })}
            />
          </Section>

          {/* Cover letter */}
          <Section title="Lettre de motivation" icon={MessageSquare}>
            <EditableTextArea
              label="Lettre de motivation personnalisée"
              value={offer.coverLetter ?? ""}
              onChange={(v) => void patch({ coverLetter: v })}
            />
          </Section>

          {/* LinkedIn message */}
          <Section title="Message LinkedIn" icon={Link2}>
            <EditableTextArea
              label="Message de connexion LinkedIn (max 300 caractères)"
              value={offer.linkedinMessage ?? ""}
              onChange={(v) => void patch({ linkedinMessage: v })}
            />
            <p className="text-xs text-slate-400 mt-2">
              {(offer.linkedinMessage ?? "").length} / 300 caractères
            </p>
          </Section>

          {/* Actions */}
          {offer.status !== "sent" && offer.status !== "declined" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-1">Actions de candidature</h3>
              <p className="text-slate-500 text-sm mb-4">
                🔒 Votre accord est obligatoire avant tout envoi de candidature.
              </p>

              <div className="flex flex-wrap gap-3">
                {offer.status === "pending_review" && (
                  <>
                    <button
                      onClick={() => void patch({ status: "approved" as Offer["status"] })}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approuver l&apos;offre
                    </button>
                    <button
                      onClick={() => void patch({ status: "rejected" as Offer["status"] })}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors font-medium disabled:opacity-60"
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeter
                    </button>
                  </>
                )}

                {offer.status === "approved" && (
                  <>
                    {!confirmSend ? (
                      <button
                        onClick={() => setConfirmSend(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-sm"
                      >
                        <Send className="w-4 h-4" />
                        Confirmer et enregistrer l&apos;envoi
                      </button>
                    ) : (
                      <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-amber-800 font-semibold text-sm mb-1">⚠️ Confirmation requise</p>
                        <p className="text-amber-700 text-sm mb-3">
                          Confirmez-vous l&apos;envoi de cette candidature à <strong>{offer.company}</strong> ?
                          Cette action marquera la candidature comme envoyée.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={sendApplication}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm disabled:opacity-60"
                          >
                            ✓ Oui, confirmer l&apos;envoi
                          </button>
                          <button
                            onClick={() => setConfirmSend(false)}
                            className="px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {offer.status === "sent" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-emerald-800 font-semibold">Candidature envoyée !</p>
                <p className="text-emerald-700 text-sm">
                  Suivez l&apos;évolution dans <a href="/applications" className="font-bold underline">Mes candidatures</a>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
