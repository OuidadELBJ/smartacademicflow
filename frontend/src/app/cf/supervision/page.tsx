"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Users, BookOpen, CheckCircle, Clock, TrendingUp, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SupervisionPage() {
  const modules = [
    { id: 1, code: "GL-M1", intitule: "Programmation Avancee", rm: "M. KHALIL", statut: "EN_COURS", progression: 85 },
    { id: 2, code: "GL-M2", intitule: "Bases de Donnees", rm: "S. MOUSSAOUI", statut: "EN_COURS", progression: 100 },
    { id: 3, code: "GL-M3", intitule: "Genie Logiciel", rm: "A. LAHLOU", statut: "EN_COURS", progression: 60 },
    { id: 4, code: "GL-M4", intitule: "Reseaux Informatiques", rm: "H. ZIDANI", statut: "CLOTURE", progression: 100 },
  ];

  return (
    <DashboardLayout>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <Users size={20} className="text-orange-600" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-slate-900 text-xl font-bold">Supervision de la Filiere</h1>
          <p className="text-slate-500 text-xs">Filiere Genie Logiciel (GL) - Vue d'ensemble</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <BookOpen size={18} className="text-orange-600 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-slate-900 text-xl font-bold">4</p>
          <p className="text-slate-500 text-[11px]">Modules</p>
        </div>
        <div className="card text-center">
          <CheckCircle size={18} className="text-emerald-600 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-slate-900 text-xl font-bold">1</p>
          <p className="text-slate-500 text-[11px]">Clotures</p>
        </div>
        <div className="card text-center">
          <TrendingUp size={18} className="text-red-500 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-slate-900 text-xl font-bold">86%</p>
          <p className="text-slate-500 text-[11px]">Progression</p>
        </div>
        <div className="card text-center">
          <Clock size={18} className="text-amber-600 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-slate-900 text-xl font-bold">1</p>
          <p className="text-slate-500 text-[11px]">En retard</p>
        </div>
      </div>

      <div className="space-y-3">
        {modules.map((m) => (
          <div key={m.id} className={cn("card-hover", m.statut === "CLOTURE" && "opacity-70")}>
            <div className="flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", m.statut === "CLOTURE" ? "bg-slate-100" : "bg-orange-50")}>
                {m.statut === "CLOTURE" ? <Lock size={18} className="text-slate-400" strokeWidth={1.5} /> : <BookOpen size={18} className="text-orange-600" strokeWidth={1.5} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-slate-800 text-sm font-medium">{m.intitule}</p>
                  <span className="text-slate-400 text-[10px] font-mono">{m.code}</span>
                </div>
                <p className="text-slate-500 text-xs">Responsable: {m.rm}</p>
              </div>
              <div className="w-32">
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${m.progression}%`, background: m.progression === 100 ? "#10b981" : "linear-gradient(135deg, #ee2927, #ff8848)" }} />
                </div>
                <p className="text-slate-400 text-[10px] text-right mt-0.5">{m.progression}%</p>
              </div>
              {m.statut === "CLOTURE" ? (
                <span className="badge-success"><Lock size={10} className="mr-1" strokeWidth={2} />Cloture</span>
              ) : (
                <span className="badge-info"><Clock size={10} className="mr-1" strokeWidth={2} />En cours</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
