"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import {
  ClipboardList, CheckCircle, Clock, Send, Upload,
  AlertTriangle, BookOpen, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ElementProgress {
  elementId: number; elementIntitule: string; enseignantNom: string;
  enseignantEmail: string; notesSaisies: number; totalEtudiants: number;
  progression: number; moduleIntitule: string; semestre: string;
}

interface ModuleInfo {
  id: number;
  code: string;
  intitule: string;
  semestre: string;
  statut: string;
}

export default function SuiviPage() {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [elementsProgress, setElementsProgress] = useState<ElementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [transmitting, setTransmitting] = useState<number | null>(null);
  const [transmitted, setTransmitted] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, modsRes] = await Promise.all([
          api.get("/rm/dashboard"),
          api.get("/rm/mes-modules"),
        ]);
        setElementsProgress(dashRes.data.elementsProgress || []);
        setModules(modsRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleTransmettreCF = async (moduleId: number, intitule: string) => {
    setTransmitting(moduleId);
    try {
      await api.post(`/rm/transmettre-cf/${moduleId}`);
      setTransmitted(prev => { const s = new Set(Array.from(prev)); s.add(moduleId); return s; });
      setToast(`Module "${intitule}" transmis au Chef de Filiere`);
      setTimeout(() => setToast(""), 4000);
    } catch (err: any) {
      setToast(err.response?.data?.error || "Erreur lors de la transmission");
      setTimeout(() => setToast(""), 4000);
    }
    finally { setTransmitting(null); }
  };

  const handleTransmettreTous = async () => {
    const eligible = modules.filter(mod => {
      if (transmitted.has(mod.id) || mod.statut !== "EN_COURS") return false;
      const moduleElements = elementsProgress.filter(el => el.moduleIntitule === mod.intitule);
      return moduleElements.length > 0 && moduleElements.every(el => el.progression >= 90);
    });
    for (const mod of eligible) {
      await handleTransmettreCF(mod.id, mod.intitule);
    }
  };

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-pulse text-slate-400">Chargement...</div></div></DashboardLayout>;
  }

  // Categoriser les modules
  const modulesReady: ModuleInfo[] = [];
  const modulesInProgress: ModuleInfo[] = [];
  const modulesTransmitted: ModuleInfo[] = [];

  for (const mod of modules) {
    if (transmitted.has(mod.id) || mod.statut === "TRANSMIS_CF" || mod.statut === "TRANSMIS_SCO" || mod.statut === "CLOTURE") {
      modulesTransmitted.push(mod);
    } else {
      const moduleElements = elementsProgress.filter(el => el.moduleIntitule === mod.intitule);
      const allReady = moduleElements.length > 0 && moduleElements.every(el => el.progression >= 90);
      if (allReady) {
        modulesReady.push(mod);
      } else {
        modulesInProgress.push(mod);
      }
    }
  }

  return (
    <DashboardLayout>
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-emerald-600 text-white text-sm font-medium shadow-lg flex items-center gap-2">
          <CheckCircle size={16} strokeWidth={2} />
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <Upload size={20} className="text-orange-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-slate-900 text-xl font-bold">Transmission au Chef de Filiere</h1>
            <p className="text-slate-500 text-xs">Transmettez les modules completes au CF pour validation</p>
          </div>
        </div>
        {modulesReady.length > 1 && (
          <button onClick={handleTransmettreTous} className="btn-primary text-xs py-2 px-4">
            <Send size={13} strokeWidth={1.5} />
            Tout transmettre ({modulesReady.length})
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle size={18} className="text-emerald-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-wide">Prets</p>
              <p className="text-emerald-600 text-lg font-bold">{modulesReady.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock size={18} className="text-amber-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-wide">En cours</p>
              <p className="text-amber-600 text-lg font-bold">{modulesInProgress.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Send size={18} className="text-blue-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-wide">Transmis</p>
              <p className="text-blue-600 text-lg font-bold">{modulesTransmitted.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modules prets a transmettre */}
      {modulesReady.length > 0 && (
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={16} className="text-emerald-600" strokeWidth={2} />
            <h2 className="text-slate-900 text-sm font-bold">Prets a transmettre</h2>
          </div>
          <div className="space-y-2.5">
            {modulesReady.map(mod => {
              const moduleElements = elementsProgress.filter(el => el.moduleIntitule === mod.intitule);
              const avgProg = moduleElements.length > 0 ? Math.round(moduleElements.reduce((s, e) => s + e.progression, 0) / moduleElements.length) : 0;
              return (
                <div key={mod.id} className="flex items-center gap-4 p-3 rounded-xl bg-emerald-50/30 border border-emerald-100 hover:bg-emerald-50/60 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <BookOpen size={16} className="text-emerald-600" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-slate-800 text-sm font-medium">{mod.intitule}</p>
                      <span className="text-slate-400 text-[10px] font-mono">{mod.code}</span>
                    </div>
                    <p className="text-slate-400 text-[10px]">{mod.semestre} | {moduleElements.length} element(s) | {avgProg}%</p>
                  </div>
                  <button
                    onClick={() => handleTransmettreCF(mod.id, mod.intitule)}
                    disabled={transmitting === mod.id}
                    className="btn-primary text-[11px] py-2 px-3"
                  >
                    {transmitting === mod.id ? "..." : <><Send size={12} strokeWidth={1.5} />Transmettre</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modules en cours */}
      {modulesInProgress.length > 0 && (
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-amber-600" strokeWidth={2} />
            <h2 className="text-slate-900 text-sm font-bold">En cours de saisie</h2>
          </div>
          <div className="space-y-2.5">
            {modulesInProgress.map(mod => {
              const moduleElements = elementsProgress.filter(el => el.moduleIntitule === mod.intitule);
              const avgProg = moduleElements.length > 0 ? Math.round(moduleElements.reduce((s, e) => s + e.progression, 0) / moduleElements.length) : 0;
              return (
                <div key={mod.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Clock size={16} className="text-amber-600" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-slate-800 text-sm font-medium">{mod.intitule}</p>
                      <span className="text-slate-400 text-[10px] font-mono">{mod.code}</span>
                    </div>
                    <p className="text-slate-400 text-[10px]">{mod.semestre} | {moduleElements.length} element(s)</p>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                      <div className="h-full rounded-full" style={{
                        width: `${avgProg}%`,
                        background: avgProg >= 90 ? "#10b981" : avgProg < 50 ? "#ef4444" : "linear-gradient(135deg, #ee2927, #ff8848)",
                      }} />
                    </div>
                  </div>
                  <span className={cn("text-xs font-bold",
                    avgProg >= 90 ? "text-emerald-600" : avgProg < 50 ? "text-red-500" : "text-orange-600"
                  )}>{avgProg}%</span>
                  <span className="badge-warning text-[9px]">Incomplet</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modules deja transmis */}
      {modulesTransmitted.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Send size={16} className="text-blue-600" strokeWidth={2} />
            <h2 className="text-slate-900 text-sm font-bold">Deja transmis</h2>
          </div>
          <div className="space-y-2">
            {modulesTransmitted.map(mod => (
              <div key={mod.id} className="flex items-center gap-4 p-2.5 rounded-xl bg-slate-50/30 opacity-70">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <CheckCircle size={14} className="text-blue-600" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-600 text-xs font-medium">{mod.intitule}</p>
                  <p className="text-slate-400 text-[10px]">{mod.code} | {mod.semestre}</p>
                </div>
                <span className="badge-success text-[9px]">
                  {mod.statut === "CLOTURE" ? "Cloture" : mod.statut === "TRANSMIS_SCO" ? "Chez Scolarite" : "Chez CF"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
