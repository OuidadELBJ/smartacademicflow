"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import {
  Mail,
  MailOpen,
  Clock,
  User,
  BookOpen,
  CheckCircle,
  Bell,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RelanceData {
  id: number;
  moduleIntitule: string;
  elementIntitule: string;
  message: string;
  lu: boolean;
  expediteurNom: string;
  expediteurEmail: string;
  dateEnvoi: string;
}

export default function RelancesPage() {
  const [relances, setRelances] = useState<RelanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [markingId, setMarkingId] = useState<number | null>(null);

  useEffect(() => {
    fetchRelances();
  }, []);

  const fetchRelances = async () => {
    try {
      const res = await api.get("/enseignant/mes-relances");
      setRelances(res.data);
    } catch (err: any) {
      setError("Erreur lors du chargement des relances");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    setMarkingId(id);
    try {
      await api.patch(`/enseignant/relances/${id}/lire`);
      setRelances((prev) =>
        prev.map((r) => (r.id === id ? { ...r, lu: true } : r))
      );
    } catch (err: any) {
      setError("Erreur lors du marquage");
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = relances.filter((r) => !r.lu);
    for (const r of unread) {
      try {
        await api.patch(`/enseignant/relances/${r.id}/lire`);
      } catch (err) {}
    }
    setRelances((prev) => prev.map((r) => ({ ...r, lu: true })));
  };

  const filteredRelances = relances.filter((r) => {
    if (filter === "unread") return !r.lu;
    if (filter === "read") return r.lu;
    return true;
  });

  const unreadCount = relances.filter((r) => !r.lu).length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "A l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
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
            <Bell size={20} className="text-orange-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-slate-900 text-xl font-bold">
              Mes Relances
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-slate-500 text-xs">
              Rappels recus de la part des responsables de module
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="btn-primary text-xs py-2 px-3"
          >
            <CheckCircle size={13} strokeWidth={1.5} />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-500" strokeWidth={2} />
          <span className="text-red-600 text-sm">{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Mail size={18} className="text-blue-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-wide">
                Total
              </p>
              <p className="text-slate-900 text-lg font-bold">
                {relances.length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
              <Bell size={18} className="text-red-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-wide">
                Non lues
              </p>
              <p className="text-red-600 text-lg font-bold">{unreadCount}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <MailOpen
                size={18}
                className="text-emerald-600"
                strokeWidth={1.5}
              />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-wide">
                Lues
              </p>
              <p className="text-emerald-600 text-lg font-bold">
                {relances.length - unreadCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-medium transition-all",
            filter === "all"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Toutes ({relances.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-medium transition-all",
            filter === "unread"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Non lues ({unreadCount})
        </button>
        <button
          onClick={() => setFilter("read")}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-medium transition-all",
            filter === "read"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Lues ({relances.length - unreadCount})
        </button>
      </div>

      {/* Relances List */}
      <div className="space-y-3">
        {filteredRelances.length === 0 ? (
          <div className="card py-12 text-center">
            <MailOpen
              size={40}
              className="text-slate-200 mx-auto mb-3"
              strokeWidth={1}
            />
            <p className="text-slate-400 text-sm">
              {filter === "unread"
                ? "Aucune relance non lue"
                : filter === "read"
                ? "Aucune relance lue"
                : "Aucune relance recue"}
            </p>
          </div>
        ) : (
          filteredRelances.map((relance) => (
            <div
              key={relance.id}
              className={cn(
                "card-hover flex items-start gap-4 transition-all",
                !relance.lu && "border-l-4 border-l-orange-400 bg-orange-50/30"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                  relance.lu ? "bg-slate-100" : "bg-orange-100"
                )}
              >
                {relance.lu ? (
                  <MailOpen
                    size={18}
                    className="text-slate-400"
                    strokeWidth={1.5}
                  />
                ) : (
                  <Mail
                    size={18}
                    className="text-orange-600"
                    strokeWidth={1.5}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      relance.lu ? "text-slate-600" : "text-slate-900"
                    )}
                  >
                    Relance - {relance.elementIntitule}
                  </p>
                  {!relance.lu && (
                    <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                  )}
                </div>
                <p className="text-slate-500 text-xs mb-2">
                  {relance.message}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <User size={11} strokeWidth={1.5} />
                    {relance.expediteurNom}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={11} strokeWidth={1.5} />
                    {relance.moduleIntitule}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} strokeWidth={1.5} />
                    {formatDate(relance.dateEnvoi)}
                  </span>
                </div>
              </div>

              {/* Action */}
              {!relance.lu && (
                <button
                  onClick={() => handleMarkAsRead(relance.id)}
                  disabled={markingId === relance.id}
                  className="btn-primary text-[11px] py-1.5 px-3 shrink-0"
                >
                  {markingId === relance.id ? (
                    "..."
                  ) : (
                    <>
                      <CheckCircle size={12} strokeWidth={1.5} />
                      Lu
                    </>
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
