"use client";

import { cn, scoreColor, statusBadge, statusLabel, truncate } from "@/lib/utils";
import { MapPin, Building2, ExternalLink, CheckCircle2, XCircle, Star } from "lucide-react";
import Link from "next/link";

interface OfferCardProps {
  offer: {
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
    createdAt: Date | string | null;
  };
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

export default function OfferCard({ offer, onApprove, onReject }: OfferCardProps) {
  const score = offer.matchScore ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all animate-slide-up overflow-hidden">
      {/* Score bar */}
      <div
        className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"
        style={{ width: `${score}%` }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-base leading-tight truncate">{offer.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-slate-600 text-sm">
                <Building2 className="w-3.5 h-3.5" />
                {offer.company}
              </span>
              {offer.location && (
                <span className="flex items-center gap-1 text-slate-500 text-sm">
                  <MapPin className="w-3.5 h-3.5" />
                  {offer.location}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Score badge */}
            <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", scoreColor(score))}>
              {score}%
            </span>
            {/* Status badge */}
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusBadge(offer.status ?? "pending_review"))}>
              {statusLabel(offer.status ?? "pending_review")}
            </span>
          </div>
        </div>

        {/* Description */}
        {offer.description && (
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            {truncate(offer.description, 140)}
          </p>
        )}

        {/* Match reason */}
        {offer.matchReason && (
          <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            <Star className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">{offer.matchReason}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {offer.source && (
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{offer.source}</span>
            )}
            {offer.country && (
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">🌍 {offer.country}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {offer.sourceUrl && (
              <a
                href={offer.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <Link
              href={`/offers/${offer.id}`}
              className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors font-medium"
            >
              Voir détails
            </Link>
            {offer.status === "pending_review" && onApprove && onReject && (
              <>
                <button
                  onClick={() => onReject(offer.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                  title="Rejeter"
                >
                  <XCircle className="w-4.5 h-4.5 w-5 h-5" />
                </button>
                <button
                  onClick={() => onApprove(offer.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                  title="Approuver"
                >
                  <CheckCircle2 className="w-4.5 h-4.5 w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
