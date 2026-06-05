"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { CheckCircle, Lock, AlertTriangle, FileText, Shield, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleStatus {
  id: number;
  code: string;
  intitule: string;
  responsable: string;
  statut: "EN_COURS" | "CLOTURE";
  progression: number;
}

export default function ValidationPVPage() {
  const [modules, setModules] = useState<ModuleStatus[]>([
    { id: 1, code: "GL-M1", intitule: "Programmation Avancee", responsable: "M. KHALIL", statut: "EN_COURS", progression: 85 },
    { id: 2, code: "GL-M2", intitule: "Bases de Donnees", responsable: "S. MOUSSAOUI", statut: "EN_COURS", progression: 100 },
    { id: 3, code: "GL-M3", intitule: "Genie Logiciel", responsable: "A. LAHLOU", statut: "EN_COURS", progression: 92 },
    { id: 4, code: "GL-M4", intitule: "Reseaux Informatiques", responsable: "H. ZIDANI", statut: "CLOTURE", progression: 100 },
  ]);
  const [confirming, setConfirming] = useState(false);
  const allReady = modules.every((m) => m.progression === 100 || m.statut === "CLOTURE");

  const handleValidation = async () => {
    if (!confirming) { setConfirming(true); return; }
    try {
      await api.post("/cf/filiere/1/valider-pv");
      setModules((prev) => prev.map((m) => ({ ...m, statut: "CLOTURE" as const })));
      setConfirming(false);
    } catch (err) { console.error(err); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <FileText size={20} className="text-orange-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-slate-900 text-xl font-bold">Validation du PV Semestriel</h1>
            <p className="text-slate-500 text-xs">Filiere : Genie Logiciel (GL) | Semestre : S1 2024-2025</p>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-red-700 text-sm font-medium">Action irreversible</p>
            <p className="text-red-500 text-xs mt-0.5">La validation du PV cloture definitivement tous les modules. Aucune modification des notes ne sera possible apres cette operation.</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {modules.map((module) => (
            <div key={module.id} className={cn("card flex items-center gap-4", module.statut === "CLOTURE" && "opacity-60")}>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", module.statut === "CLOTURE" ? "bg-slate-100" : "bg-orange-50")}>
                {module.statut === "CLOTURE" ? <Lock size={18} className="text-slate-400" strokeWidth={1.5} /> : <BookOpen size={18} className="text-orange-600" strokeWidth={1.5} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-slate-800 text-sm font-medium">{module.intitule}</p>
                  <span className="text-slate-400 text-[10px]">{module.code}</span>
                </div>
                <p className="text-slate-500 text-xs">{module.responsable}</p>
              </div>
              <div className="w-32">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400 text-[10px]">Progression</span>
                  <span className="text-slate-600 text-[10px] font-medium">{module.progression}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full">
                  <div className="h-full rounded-full" style={{ width: `${module.progression}%`, background: module.progression === 100 ? "#10b981" : "linear-gradient(135deg, #ee2927, #ff8848)" }} />
                </div>
              </div>
              <div>
                {module.statut === "CLOTURE" ? (
                  <span className="badge-success"><Lock size={10} className="mr-1" strokeWidth={2} />Cloture</span>
                ) : module.progression === 100 ? (
                  <span className="badge-info"><CheckCircle size={10} className="mr-1" strokeWidth={2} />Pret</span>
                ) : (
                  <span className="badge-warning"><AlertTriangle size={10} className="mr-1" strokeWidth={2} />Incomplet</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="card text-center">
          {confirming ? (
            <div>
              <p className="text-red-600 text-sm font-medium mb-3">Etes-vous certain de vouloir valider le PV ? Cette action est irreversible.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={handleValidation} className="btn-danger"><Shield size={16} strokeWidth={1.5} />Confirmer la validation</button>
                <button onClick={() => setConfirming(false)} className="btn-secondary">Annuler</button>
              </div>
            </div>
          ) : (
            <button onClick={handleValidation} disabled={!allReady} className={cn("btn-primary justify-center px-8", !allReady && "opacity-50 cursor-not-allowed")}>
              <CheckCircle size={16} strokeWidth={1.5} />Valider le PV Semestriel
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
