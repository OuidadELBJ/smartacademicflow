"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import {
  ClipboardList, CheckCircle, Clock, TrendingUp, BarChart3,
  Users, AlertTriangle, Send, Bell, ArrowRight, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ElementProgress {
  elementId: number; elementIntitule: string; enseignantNom: string;
  enseignantEmail: string; notesSaisies: number; totalEtudiants: number;
  progression: number; moduleIntitule: string; semestre: string;
}

interface DashboardData {
  totalModules: number; modulesEnCours: number; modulesClotures: number;
  totalNotesSaisies: number; totalNotesAttendues: number;
  progressionGlobale: number; totalNonAdmis: number;
  totalRattrapage: number; totalEligiblesRachat: number;
  elementsProgress: ElementProgress[];
}

interface ModuleInfo {
  id: number;
  code: string;
  intitule: string;
  semestre: string;
  statut: string;
}

export default function SuiviPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [relanced, setRelanced] = useState<Set<number>>(new Set());
  const [relancing, setRelancing] = useState<number | null>(null);
  const [transmitting, setTransmitting] = useState<number | null>(null);
  const [transmitted, setTransmitted] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, filieresRes] = await Promise.all([
          api.get("/rm/dashboard"),
          api.get("/rm/mes-modules"),
        ]);
        setData(dashRes.data);
        setModules(filieresRes.data);
      } catch (err) {
        // Fallback: try dashboard only
        try {
          const res = await api.get("/rm/dashboard");
          setData(res.data);
        } catch (e) { console.error(e); }
      }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleRelance = async (el: ElementProgress) => {
    setRelancing(el.elementId);
    try {
      await api.post("/rm/relance", {
        email: el.enseignantEmail,
        enseignantNom: el.enseignantNom,
        moduleIntitule: el.moduleIntitule,
        elementIntitule: el.elementIntitule,
      });
      setRelanced(prev => { const s = new Set(Array.from(prev)); s.add(el.elementId); return s; });
      setToast(`Relance envoyee a ${el.enseignantNom}`);
      setTimeout(() => setToast(""), 4000);
    } catch {}
    finally { setRelancing(null); }
  };

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

  if (loading || !data) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-pulse text-slate-400">Chargement...</div></div></DashboardLayout>;
  }

  const enRetard = data.elementsProgress.filter(e => e.progression < 80);
  const circumference = 2 * Math.PI * 54;
  const progressOffset = circumference - (data.progressionGlobale / 100) * circumference;

  // Group elements by module to determine which modules can be transmitted
  const moduleMap = new Map<string, { elements: ElementProgress[]; allComplete: boolean }>();
  for (const el of data.elementsProgress) {
    const key = el.moduleIntitule;
    if (!moduleMap.has(key)) {
      moduleMap.set(key, { elements: [], allComplete: true });
    }
    const entry = moduleMap.get(key)!;
    entry.elements.push(el);
    if (el.progression < 100) {
      entry.allComplete = false;
    }
  }

  return (
    <DashboardLayout>
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-emerald-600 text-white text-sm font-medium shadow-lg flex items-center gap-2 animate-[slideIn_0.3s_ease]">
          <CheckCircle size={16} strokeWidth={2} />
          {toast}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <ClipboardList size={20} className="text-orange-600" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-slate-900 text-xl font-bold">Suivi Avancement</h1>
          <p className="text-slate-500 text-xs">Responsable de Module - Vue d'ensemble</p>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        {/* Jauge circulaire */}
        <div className="col-span-12 md:col-span-4 card flex flex-col items-center justify-center py-8">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="10" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="url(#gaugeGrad)" strokeWidth="10"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={progressOffset}
                className="transition-all duration-1000" />
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ee2927" />
                  <stop offset="100%" stopColor="#ff8848" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-900">{data.progressionGlobale}%</span>
              <span className="text-[10px] text-slate-400">avancement</span>
            </div>
          </div>
          <p className="text-slate-600 text-xs font-medium mt-3">Progression globale saisie</p>
          <p className="text-slate-400 text-[10px]">{data.totalNotesSaisies} / {data.totalNotesAttendues} notes</p>
        </div>

        {/* KPIs */}
        <div className="col-span-12 md:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card py-5 text-center">
            <Users size={18} className="text-blue-600 mx-auto mb-1" strokeWidth={1.5} />
            <p className="text-slate-900 text-2xl font-bold">{data.totalModules}</p>
            <p className="text-slate-400 text-[10px]">Modules ({data.modulesEnCours} actifs)</p>
          </div>
          <div className="card py-5 text-center">
            <AlertTriangle size={18} className="text-red-500 mx-auto mb-1" strokeWidth={1.5} />
            <p className="text-red-600 text-2xl font-bold">{data.totalNonAdmis}</p>
            <p className="text-slate-400 text-[10px]">Non admis (module&lt;12)</p>
          </div>
          <div className="card py-5 text-center">
            <Clock size={18} className="text-amber-600 mx-auto mb-1" strokeWidth={1.5} />
            <p className="text-amber-600 text-2xl font-bold">{data.totalRattrapage}</p>
            <p className="text-slate-400 text-[10px]">Elements a rattraper</p>
          </div>
          <div className="card py-5 text-center">
            <TrendingUp size={18} className="text-orange-600 mx-auto mb-1" strokeWidth={1.5} />
            <p className="text-orange-600 text-2xl font-bold">{data.totalEligiblesRachat}</p>
            <p className="text-slate-400 text-[10px]">Eligibles rachat (10-12)</p>
          </div>

          {/* Alertes */}
          <div className="col-span-2 lg:col-span-4 card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={14} className="text-orange-600" strokeWidth={2} />
              <span className="text-slate-800 text-xs font-bold">Alertes</span>
            </div>
            <div className="space-y-2">
              {enRetard.length > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
                  <AlertTriangle size={12} className="text-red-500 shrink-0" strokeWidth={2} />
                  <span className="text-red-700 text-[11px] font-medium">{enRetard.length} enseignant(s) en retard de saisie (&lt;80%)</span>
                </div>
              )}
              {data.totalEligiblesRachat > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                  <Clock size={12} className="text-amber-600 shrink-0" strokeWidth={2} />
                  <span className="text-amber-700 text-[11px] font-medium">{data.totalEligiblesRachat} etudiant(s) eligible(s) au rachat (note [10-12))</span>
                  <ArrowRight size={11} className="text-amber-400 ml-auto" strokeWidth={2} />
                </div>
              )}
              {enRetard.length === 0 && data.totalEligiblesRachat === 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <CheckCircle size={12} className="text-emerald-600 shrink-0" strokeWidth={2} />
                  <span className="text-emerald-700 text-[11px] font-medium">Tout est en ordre</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transmission au CF — Modules prêts */}
      {modules.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload size={16} className="text-blue-600" strokeWidth={2} />
            <h2 className="text-slate-900 text-sm font-bold">Transmission au Chef de Filiere</h2>
          </div>
          <div className="space-y-2.5">
            {modules.map((mod) => {
              // Check if all elements of this module are complete
              const moduleElements = data.elementsProgress.filter(
                (el) => el.moduleIntitule === mod.intitule
              );
              const allComplete = moduleElements.length > 0 && moduleElements.every((el) => el.progression >= 90);
              const avgProgression = moduleElements.length > 0
                ? Math.round(moduleElements.reduce((sum, el) => sum + el.progression, 0) / moduleElements.length)
                : 0;
              const isTransmitted = transmitted.has(mod.id) || mod.statut === "TRANSMIS_CF" || mod.statut === "TRANSMIS_SCO" || mod.statut === "CLOTURE";

              return (
                <div key={mod.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    isTransmitted ? "bg-emerald-50" : allComplete ? "bg-blue-50" : "bg-slate-100"
                  )}>
                    {isTransmitted
                      ? <CheckCircle size={16} className="text-emerald-600" strokeWidth={2} />
                      : allComplete
                      ? <Upload size={16} className="text-blue-600" strokeWidth={2} />
                      : <Clock size={16} className="text-slate-400" strokeWidth={2} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-slate-800 text-sm font-medium">{mod.intitule}</p>
                      <span className="text-slate-400 text-[10px] font-mono">{mod.code}</span>
                    </div>
                    <p className="text-slate-400 text-[10px]">{mod.semestre} | {moduleElements.length} element(s) | Progression: {avgProgression}%</p>
                  </div>

                  {isTransmitted ? (
                    <span className="badge-success text-[10px] flex items-center gap-1">
                      <CheckCircle size={10} strokeWidth={2} />
                      Transmis
                    </span>
                  ) : allComplete ? (
                    <button
                      onClick={() => handleTransmettreCF(mod.id, mod.intitule)}
                      disabled={transmitting === mod.id}
                      className="btn-primary text-[11px] py-2 px-3"
                    >
                      {transmitting === mod.id ? "..." : (
                        <>
                          <Send size={12} strokeWidth={1.5} />
                          Transmettre au CF
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="badge-warning text-[10px] flex items-center gap-1">
                      <Clock size={10} strokeWidth={2} />
                      Incomplet
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Avancement par element */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-slate-900 text-sm font-bold">Avancement saisie par element</h2>
          <span className="text-slate-400 text-[10px]">{data.elementsProgress.length} element(s)</span>
        </div>
        <div className="space-y-2.5">
          {data.elementsProgress.map((el) => (
            <div key={el.elementId} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                el.progression >= 100 ? "bg-emerald-50" : el.progression < 50 ? "bg-red-50" : "bg-orange-50"
              )}>
                {el.progression >= 100
                  ? <CheckCircle size={14} className="text-emerald-600" strokeWidth={2} />
                  : <BarChart3 size={14} className={el.progression < 50 ? "text-red-500" : "text-orange-600"} strokeWidth={2} />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-slate-800 text-xs font-medium truncate">{el.elementIntitule}</p>
                  <span className="text-slate-500 text-[10px] ml-2">{el.notesSaisies}/{el.totalEtudiants}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${Math.min(el.progression, 100)}%`,
                    background: el.progression >= 100 ? "#10b981" : el.progression < 50 ? "#ef4444" : "linear-gradient(135deg, #ee2927, #ff8848)",
                  }} />
                </div>
                <p className="text-slate-400 text-[9px] mt-0.5">{el.enseignantNom} | {el.moduleIntitule} | {el.semestre}</p>
              </div>

              <span className={cn("text-xs font-bold w-10 text-right",
                el.progression >= 100 ? "text-emerald-600" : el.progression < 50 ? "text-red-500" : "text-orange-600"
              )}>{el.progression}%</span>

              {el.progression < 100 && (
                <button
                  onClick={() => handleRelance(el)}
                  disabled={relancing === el.elementId || relanced.has(el.elementId)}
                  className={cn(
                    "text-[10px] py-1.5 px-2.5 rounded-lg font-medium transition-all flex items-center gap-1",
                    relanced.has(el.elementId)
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100"
                  )}
                >
                  {relancing === el.elementId ? (
                    <span className="animate-spin w-3 h-3 border-2 border-orange-300 border-t-orange-600 rounded-full" />
                  ) : relanced.has(el.elementId) ? (
                    <><CheckCircle size={10} strokeWidth={2} />Relance</>
                  ) : (
                    <><Send size={10} strokeWidth={2} />Relancer</>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
