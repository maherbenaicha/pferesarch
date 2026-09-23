"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import OfferCard from "@/components/OfferCard";
import { Briefcase, Filter, RefreshCw } from "lucide-react";
import { cn, statusLabel } from "@/lib/utils";

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
  createdAt: string | null;
}

const STATUS_FILTERS = [
  { value: "", label: "Toutes" },
  { value: "pending_review", label: "À valider" },
  { value: "approved", label: "Approuvées" },
  { value: "sent", label: "Envoyées" },
  { value: "rejected", label: "Rejetées" },
  { value: "interview", label: "Entretiens" },
];

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const url = filter ? `/api/offers?status=${filter}` : "/api/offers";
    const res = await fetch(url);
    const data = (await res.json()) as Offer[];
    setOffers(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/offers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  };

  const pendingCount = offers.filter((o) => o.status === "pending_review").length;

  return (
    <AppShell>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-blue-600" />
              Offres de PFE
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {offers.length} offre(s) · {pendingCount} en attente de validation
            </p>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-sm text-slate-600">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Actualiser
          </button>
        </div>

        {/* Validation reminder */}
        {pendingCount > 0 && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🔒</span>
            </div>
            <div>
              <p className="text-amber-800 font-semibold text-sm">{pendingCount} offre(s) attendent votre validation</p>
              <p className="text-amber-600 text-xs mt-0.5">
                Aucune candidature ne sera envoyée sans votre accord explicite. Examinez et approuvez chaque offre.
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                filter === f.value
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Aucune offre {filter ? `avec statut "${statusLabel(filter)}"` : "trouvée"}</p>
            <p className="text-slate-400 text-sm mt-1">Lancez une recherche pour trouver des offres de PFE</p>
            <a href="/search" className="inline-block mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
              Lancer une recherche →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onApprove={(id) => updateStatus(id, "approved")}
                onReject={(id) => updateStatus(id, "rejected")}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
