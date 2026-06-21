"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import {
  Clock, FileText, ArrowUpCircle, ArrowDownCircle,
  AlertTriangle, CheckCircle, Lock, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoriqueEntry {
  id: number;
  action: string;
  ancienneValeur: string | null;
  nouvelleValeur: string | null;
  motif: string | null;
  date: string | null;
}

export default function HistoriquePage() {
  const [historique, setHistorique] = useState<HistoriqueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "SAISIE_NOTE" | "RACHAT_NOTE" | "ARTICLE_39">("all");

  useEffect(() => {
    fetchHistorique();
  }, []);

  const fetchHistorique = async () => {
    try {
      const res = await api.get("/enseignant/historique-notes");
      setHistorique(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistorique = historique.filter((h) => {
    if (filter === "all") return true;
    return h.action === filter;
  });

  const getActionLabel = (action: string) => {
    switch (action) {
      case "SAISIE_NOTE": return "Saisie";
      case "RACHAT_NOTE": return "Rachat";
      case "ARTICLE_39_APPLIED": return "Art. 39";
      default: return action;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "SAISIE_NOTE": return <CheckCircle size={14} className="text-blue-600" strokeWidth={2} />;
      case "RACHAT_NOTE": return <ArrowUpCircle size={14} className="text-emerald-600" strokeWidth={2} />;
      case "ARTICLE_39_APPLIED": return <Lock size={14} className="text-red-500" strokeWidth={2} />;
      default: return <FileText size={14} className="text-slate-400" strokeWidth={2} />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "SAISIE_NOTE": return "bg-blue-50 border-blue-100";
      case "RACHAT_NOTE": return "bg-emerald-50 border-emerald-100";
      case "ARTICLE_39_APPLIED": return "bg-red-50 border-red-100";
      default: return "bg-slate-50 border-slate-100";
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-slate-400">Chargement...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <Clock size={20} className="text-orange-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-slate-900 text-xl font-bold">Historique des Notes</h1>
            <p className="text-slate-500 text-xs">Toutes les modifications de notes sur vos elements</p>
          </div>
        </div>
        <span className="text-slate-400 text-xs">{historique.length} action(s)</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card py-4 text-center">
          <p className="text-blue-600 text-2xl font-bold">{historique.filter(h => h.action === "SAISIE_NOTE").length}</p>
          <p className="text-slate-500 text-xs">Saisies</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-emerald-600 text-2xl font-bold">{historique.filter(h => h.action === "RACHAT_NOTE").length}</p>
          <p className="text-slate-500 text-xs">Rachats</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-red-600 text-2xl font-bold">{historique.filter(h => h.action === "ARTICLE_39_APPLIED").length}</p>
          <p className="text-slate-500 text-xs">Art. 39</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-slate-900 text-2xl font-bold">{historique.length}</p>
          <p className="text-slate-500 text-xs">Total</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 mb-4 p-1 bg-slate-100 rounded-xl w-fit">
        <button onClick={() => setFilter("all")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", filter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>
          Toutes
        </button>
        <button onClick={() => setFilter("SAISIE_NOTE")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", filter === "SAISIE_NOTE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>
          Saisies
        </button>
        <button onClick={() => setFilter("RACHAT_NOTE")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", filter === "RACHAT_NOTE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>
          Rachats
        </button>
        <button onClick={() => setFilter("ARTICLE_39")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", filter === "ARTICLE_39" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>
          Art. 39
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {filteredHistorique.length === 0 ? (
          <div className="card py-12 text-center">
            <Clock size={36} className="text-slate-200 mx-auto mb-3" strokeWidth={1} />
            <p className="text-slate-400 text-sm">Aucune modification enregistree</p>
            <p className="text-slate-300 text-xs mt-1">L'historique apparaitra apres vos premieres saisies de notes</p>
          </div>
        ) : (
          filteredHistorique.map((entry) => (
            <div key={entry.id} className={cn("flex items-center gap-4 p-3 rounded-xl border", getActionColor(entry.action))}>
              {/* Icon */}
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                {getActionIcon(entry.action)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded",
                    entry.action === "SAISIE_NOTE" ? "bg-blue-100 text-blue-700" :
                    entry.action === "RACHAT_NOTE" ? "bg-emerald-100 text-emerald-700" :
                    "bg-red-100 text-red-700"
                  )}>
                    {getActionLabel(entry.action)}
                  </span>
                  {entry.motif && (
                    <p className="text-slate-500 text-[10px] truncate">{entry.motif}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px]">
                  {entry.ancienneValeur && entry.ancienneValeur !== "null" && (
                    <span className="text-slate-400">
                      Avant: <span className="font-medium text-slate-600">{entry.ancienneValeur}</span>
                    </span>
                  )}
                  {entry.nouvelleValeur && (
                    <span className="text-slate-400">
                      Apres: <span className="font-bold text-slate-800">{entry.nouvelleValeur}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Date */}
              <div className="text-right shrink-0">
                <p className="text-slate-400 text-[10px]">{formatDate(entry.date)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
