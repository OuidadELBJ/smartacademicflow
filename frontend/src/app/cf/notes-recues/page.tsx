"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import {
  Inbox,
  Send,
  CheckCircle,
  BookOpen,
  User,
  Calendar,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleRecu {
  moduleId: number;
  code: string;
  intitule: string;
  semestre: string;
  filiereCode: string;
  filiereIntitule: string;
  responsableNom: string;
  notesSaisies: number;
  nbEtudiants: number;
  nbElements: number;
  dateTransmissionCF: string | null;
}

export default function NotesRecuesPage() {
  const [modulesRecus, setModulesRecus] = useState<ModuleRecu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [transmitting, setTransmitting] = useState<number | null>(null);
  const [transmitted, setTransmitted] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchModulesRecus();
  }, []);

  const fetchModulesRecus = async () => {
    try {
      const res = await api.get("/cf/modules-recus");
      setModulesRecus(res.data);
    } catch (err: any) {
      setError("Erreur lors du chargement des modules recus");
    } finally {
      setLoading(false);
    }
  };

  const handleTransmettreScolarite = async (moduleId: number, intitule: string) => {
    setTransmitting(moduleId);
    setError("");
    setSuccess("");
    try {
      const res = await api.post(`/cf/transmettre-scolarite/${moduleId}`);
      setTransmitted((prev) => {
        const s = new Set(Array.from(prev));
        s.add(moduleId);
        return s;
      });
      setSuccess(res.data.message || `Module "${intitule}" transmis a la scolarite`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || "Erreur lors de la transmission");
    } finally {
      setTransmitting(null);
    }
  };

  const handleTransmettreTous = async () => {
    setError("");
    setSuccess("");
    const pending = modulesRecus.filter((m) => !transmitted.has(m.moduleId));
    let count = 0;
    for (const mod of pending) {
      try {
        await api.post(`/cf/transmettre-scolarite/${mod.moduleId}`);
        setTransmitted((prev) => {
          const s = new Set(Array.from(prev));
          s.add(mod.moduleId);
          return s;
        });
        count++;
      } catch (err) {}
    }
    if (count > 0) {
      setSuccess(`${count} module(s) transmis a la scolarite avec succes`);
      setTimeout(() => setSuccess(""), 4000);
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

  const pendingModules = modulesRecus.filter((m) => !transmitted.has(m.moduleId));

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
            <Inbox size={20} className="text-orange-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-slate-900 text-xl font-bold">
              Notes Recues
              {pendingModules.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold text-white bg-orange-500 rounded-full">
                  {pendingModules.length}
                </span>
              )}
            </h1>
            <p className="text-slate-500 text-xs">
              Modules transmis par les responsables de module — prets a etre envoyes a la scolarite
            </p>
          </div>
        </div>
        {pendingModules.length > 1 && (
          <button onClick={handleTransmettreTous} className="btn-primary text-xs py-2 px-4">
            <Send size={13} strokeWidth={1.5} />
            Tout transmettre a la Scolarite
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-500" strokeWidth={2} />
          <span className="text-red-600 text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2">
          <CheckCircle size={14} className="text-emerald-500" strokeWidth={2} />
          <span className="text-emerald-600 text-sm">{success}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
              <Inbox size={18} className="text-orange-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-wide">Recus</p>
              <p className="text-slate-900 text-lg font-bold">{modulesRecus.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <BookOpen size={18} className="text-amber-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-wide">A transmettre</p>
              <p className="text-amber-600 text-lg font-bold">{pendingModules.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle size={18} className="text-emerald-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-wide">Transmis</p>
              <p className="text-emerald-600 text-lg font-bold">{transmitted.size}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modules List */}
      {modulesRecus.length === 0 ? (
        <div className="card py-12 text-center">
          <Inbox size={40} className="text-slate-200 mx-auto mb-3" strokeWidth={1} />
          <p className="text-slate-400 text-sm">Aucun module recu pour le moment</p>
          <p className="text-slate-300 text-xs mt-1">Les modules apparaitront ici une fois transmis par les responsables de module</p>
        </div>
      ) : (
        <div className="space-y-3">
          {modulesRecus.map((mod) => {
            const isTransmitted = transmitted.has(mod.moduleId);
            return (
              <div
                key={mod.moduleId}
                className={cn(
                  "card-hover flex items-center gap-4 transition-all",
                  isTransmitted && "opacity-60"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                  isTransmitted ? "bg-emerald-50" : "bg-orange-50"
                )}>
                  {isTransmitted ? (
                    <CheckCircle size={20} className="text-emerald-600" strokeWidth={1.5} />
                  ) : (
                    <BookOpen size={20} className="text-orange-600" strokeWidth={1.5} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-slate-800 text-sm font-medium">{mod.intitule}</p>
                    <span className="text-slate-400 text-[10px] font-mono">{mod.code}</span>
                    {isTransmitted && <span className="badge-success text-[9px]">Transmis</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <User size={10} strokeWidth={1.5} />
                      RM: {mod.responsableNom}
                    </span>
                    <span>{mod.filiereCode} | {mod.semestre}</span>
                    <span>{mod.notesSaisies} notes | {mod.nbElements} element(s)</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <Calendar size={10} strokeWidth={1.5} />
                    <span>Recu le {formatDate(mod.dateTransmissionCF)}</span>
                  </div>
                </div>

                {/* Action */}
                {!isTransmitted && (
                  <button
                    onClick={() => handleTransmettreScolarite(mod.moduleId, mod.intitule)}
                    disabled={transmitting === mod.moduleId}
                    className="btn-primary text-xs py-2 px-4 shrink-0"
                  >
                    {transmitting === mod.moduleId ? (
                      "..."
                    ) : (
                      <>
                        <Send size={13} strokeWidth={1.5} />
                        Transmettre
                        <ArrowRight size={12} strokeWidth={1.5} />
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
