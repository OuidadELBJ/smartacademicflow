"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SuiviPage() {
  const elements = [
    { id: 1, name: "Java Avance", enseignant: "A. BENALI", notes: 35, total: 42, progression: 83 },
    { id: 2, name: "Design Patterns", enseignant: "F. ELHASSOUNI", notes: 20, total: 42, progression: 48 },
    { id: 3, name: "Spring Boot", enseignant: "K. MOULINE", notes: 42, total: 42, progression: 100 },
    { id: 4, name: "Algorithmique", enseignant: "M. SENHAJI", notes: 10, total: 42, progression: 24 },
  ];

  return (
    <DashboardLayout>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <ClipboardList size={20} className="text-orange-600" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-slate-900 text-xl font-bold">Suivi de l'Avancement</h1>
          <p className="text-slate-500 text-xs">Vue d'ensemble de la progression de saisie</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <TrendingUp size={20} className="text-orange-600 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-slate-900 text-2xl font-bold">64%</p>
          <p className="text-slate-500 text-xs">Progression moyenne</p>
        </div>
        <div className="card text-center">
          <CheckCircle size={20} className="text-emerald-600 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-slate-900 text-2xl font-bold">1</p>
          <p className="text-slate-500 text-xs">Elements completes</p>
        </div>
        <div className="card text-center">
          <Clock size={20} className="text-amber-600 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-slate-900 text-2xl font-bold">2</p>
          <p className="text-slate-500 text-xs">En retard</p>
        </div>
      </div>

      <div className="space-y-3">
        {elements.map((el) => (
          <div key={el.id} className="card-hover">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                el.progression === 100 ? "bg-emerald-50" :
                el.progression < 50 ? "bg-amber-50" : "bg-orange-50"
              )}>
                {el.progression === 100 ? (
                  <CheckCircle size={18} className="text-emerald-600" strokeWidth={1.5} />
                ) : (
                  <BarChart3 size={18} className={el.progression < 50 ? "text-amber-600" : "text-orange-600"} strokeWidth={1.5} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-slate-800 text-sm font-medium">{el.name}</p>
                  <span className="text-slate-600 text-xs font-medium">
                    {el.notes}/{el.total} notes
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${el.progression}%`,
                      background: el.progression === 100 ? "#10b981" :
                        el.progression < 50 ? "#f59e0b" : "linear-gradient(135deg, #ee2927, #ff8848)",
                    }}
                  />
                </div>
                <p className="text-slate-400 text-[11px] mt-1">Enseignant: {el.enseignant}</p>
              </div>

              <span className={cn(
                "text-lg font-bold",
                el.progression === 100 ? "text-emerald-600" :
                el.progression < 50 ? "text-amber-600" : "text-orange-600"
              )}>
                {el.progression}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
