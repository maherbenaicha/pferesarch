import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  sub?: string;
}

export default function StatCard({ label, value, icon: Icon, color = "blue", sub }: StatCardProps) {
  const colorMap: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-orange-500",
    purple: "from-purple-500 to-indigo-600",
    pink: "from-pink-500 to-rose-500",
    slate: "from-slate-500 to-slate-600",
  };

  const bgMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-100",
    green: "bg-emerald-50 border-emerald-100",
    amber: "bg-amber-50 border-amber-100",
    purple: "bg-purple-50 border-purple-100",
    pink: "bg-pink-50 border-pink-100",
    slate: "bg-slate-50 border-slate-200",
  };

  return (
    <div className={cn("rounded-2xl border p-5 shadow-sm animate-slide-up", bgMap[color] ?? bgMap.blue)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md", colorMap[color] ?? colorMap.blue)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
