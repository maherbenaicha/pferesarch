import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
}

export function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending_review: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    rejected: "bg-gray-100 text-gray-500 line-through",
    sent: "bg-green-100 text-green-800",
    followed_up: "bg-purple-100 text-purple-800",
    interview: "bg-pink-100 text-pink-800",
    declined: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending_review: "En attente de validation",
    approved: "Approuvée",
    rejected: "Rejetée",
    sent: "Envoyée",
    followed_up: "Relancée",
    interview: "Entretien",
    declined: "Refusée",
  };
  return map[status] ?? status;
}

export function truncate(str: string, n = 120) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}
