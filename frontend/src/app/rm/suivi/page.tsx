"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import {
  ClipboardList, CheckCircle, Clock, TrendingUp, BarChart3,
  Users, AlertTriangle, Send,
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
  progressionGlobale: number; totalAjournes: number;
  totalRattrapage: number; totalCasLimites: number;
  elementsProgress: ElementProgress[];
}

export default function SuiviPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [relancing, setRelancing] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/rm/dashboard");
        setData(res.data);
      } catch (err) { console.error(err); }
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
    } catch {}
    setTimeout(() => setRelancing(null), 2000);
  };

  if (loading || !data) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-pulse text-slate-400">Chargement...</div></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <ClipboardList size={20} className="text-orange-600" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-slate-900 text-xl font-bold">Tableau de Bord - Responsable Module</h1>
          <p className="text-slate-500 text-xs">Suivi de l'avancement et KPIs academiques</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="card text-center py-4">
          <TrendingUp size={18} className="text-orange-600 mx-auto mb-1.5" strokeWidth={1.5} />
          <p className="text-slate-900 text-xl font-bold">{data.progressionGlobale}%</p>
          <p className="text-slate-500 text-[10px]">Progression saisie</p>
        </div>
        <div className="card text-center py-4">
          <BarChart3 size={18} className="text-blue-600 mx-auto mb-1.5" strokeWidth={1.5} />
          <p className="text-slate-900 text-xl font-bold">{data.totalNotesSaisies}</p>
          <p className="text-slate-500 text-[10px]">Notes saisies</p>
        </div>
        <div className="card text-center py-4">
          <Users size={18} className="text-emerald-600 mx-auto mb-1.5" strokeWidth={1.5} />
          <p className="text-slate-900 text-xl font-bold">{data.totalModules}</p>
          <p className="text-slate-500 text-[10px]">Modules ({data.modulesEnCours} actifs)</p>
        </div>
        <div className="card text-center py-4">
          <AlertTriangle size={18} className="text-red-500 mx-auto mb-1.5" strokeWidth={1.5} />
          <p className="text-slate-900 text-xl font-bold">{data.totalAjournes}</p>
          <p className="text-slate-500 text-[10px]">Ajournes (&lt;7)</p>
        </div>
        <div className="card text-center py-4">
          <Clock size={18} className="text-amber-600 mx-auto mb-1.5" strokeWidth={1.5} />
          <p className="text-slate-900 text-xl font-bold">{data.totalRattrapage}</p>
          <p className="text-slate-500 text-[10px]">Rattrapage (7-10)</p>
        </div>
        <div className="card text-center py-4">
          <CheckCircle size={18} className="text-violet-600 mx-auto mb-1.5" strokeWidth={1.5} />
          <p className="text-slate-900 text-xl font-bold">{data.totalCasLimites}</p>
          <p className="text-slate-500 text-[10px]">Cas limites (8-10)</p>
        </div>
      </div>

      {/* Progression par element */}
      <div className="card">
        <h2 className="text-slate-900 text-sm font-bold mb-4">Avancement saisie par element</h2>
        <div className="space-y-3">
          {data.elementsProgress.map((el) => (
            <div key={el.elementId} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                el.progression >= 100 ? "bg-emerald-50" : el.progression < 50 ? "bg-red-50" : "bg-orange-50"
              )}>
                {el.progression >= 100
                  ? <CheckCircle size={16} className="text-emerald-600" strokeWidth={1.5} />
                  : <BarChart3 size={16} className={el.progression < 50 ? "text-red-500" : "text-orange-600"} strokeWidth={1.5} />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-slate-800 text-sm font-medium">{el.elementIntitule}</p>
                  <span className="text-slate-600 text-xs font-medium">{el.notesSaisies}/{el.totalEtudiants}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${el.progression}%`,
                    background: el.progression >= 100 ? "#10b981" : el.progression < 50 ? "#ef4444" : "linear-gradient(135deg, #ee2927, #ff8848)",
                  }} />
                </div>
                <p className="text-slate-400 text-[10px] mt-0.5">{el.enseignantNom} | {el.moduleIntitule} ({el.semestre})</p>
              </div>

              <span className={cn("text-sm font-bold",
                el.progression >= 100 ? "text-emerald-600" : el.progression < 50 ? "text-red-500" : "text-orange-600"
              )}>{el.progression}%</span>

              {el.progression < 100 && (
                <button
                  onClick={() => handleRelance(el)}
                  disabled={relancing === el.elementId}
                  className="btn-secondary text-[10px] py-1.5 px-2.5"
                >
                  {relancing === el.elementId ? <CheckCircle size={11} strokeWidth={2} /> : <Send size={11} strokeWidth={2} />}
                  {relancing === el.elementId ? "OK" : "Relancer"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
