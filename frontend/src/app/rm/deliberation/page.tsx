"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Scale,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpCircle,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentDelib {
  id: number;
  nom: string;
  prenom: string;
  moyenne: number;
  decision: string | null;
  isArticle39: boolean;
}

export default function DeliberationPage() {
  const [students] = useState<StudentDelib[]>([
    { id: 1, nom: "ALAOUI", prenom: "Youssef", moyenne: 14.5, decision: "VALIDE", isArticle39: false },
    { id: 2, nom: "BENNANI", prenom: "Khadija", moyenne: 11.25, decision: "VALIDE", isArticle39: false },
    { id: 3, nom: "CHRAIBI", prenom: "Omar", moyenne: 3.5, decision: "NON_VALIDE", isArticle39: true },
    { id: 4, nom: "DOUKKALI", prenom: "Amina", moyenne: 9.0, decision: null, isArticle39: false },
    { id: 5, nom: "ELFASSI", prenom: "Hamza", moyenne: 8.5, decision: "RACHAT", isArticle39: false },
  ]);

  const getDecisionBadge = (decision: string | null, isArticle39: boolean) => {
    if (isArticle39) {
      return (
        <span className="badge-danger">
          <Lock size={10} className="mr-1" strokeWidth={2} />
          Defaillant (Art.39)
        </span>
      );
    }
    switch (decision) {
      case "VALIDE":
        return (
          <span className="badge-success">
            <CheckCircle size={10} className="mr-1" strokeWidth={2} />
            Valide
          </span>
        );
      case "RACHAT":
        return (
          <span className="badge-info">
            <ArrowUpCircle size={10} className="mr-1" strokeWidth={2} />
            Rachat
          </span>
        );
      case "RATTRAPAGE":
        return (
          <span className="badge-warning">
            <AlertTriangle size={10} className="mr-1" strokeWidth={2} />
            Rattrapage
          </span>
        );
      case "NON_VALIDE":
        return (
          <span className="badge-danger">
            <XCircle size={10} className="mr-1" strokeWidth={2} />
            Non Valide
          </span>
        );
      default:
        return <span className="badge bg-slate-50 text-slate-500 border border-slate-200">En attente</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Scale size={20} className="text-indigo-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-slate-900 text-xl font-bold">Deliberation de Module</h1>
            <p className="text-slate-500 text-xs">
              Module : Programmation Avancee | Semestre : S1
            </p>
          </div>
        </div>
        <button className="btn-primary">
          <CheckCircle size={16} strokeWidth={1.5} />
          Valider la deliberation
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Valides", value: "2", color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Rattrapage", value: "0", color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Rachat", value: "1", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Non Valides", value: "1", color: "text-red-600", bg: "bg-red-50" },
        ].map((s) => (
          <div key={s.label} className="card py-4 text-center">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="text-left text-slate-500 text-xs font-medium px-6 py-3.5">Etudiant</th>
              <th className="text-center text-slate-500 text-xs font-medium px-6 py-3.5">Moyenne</th>
              <th className="text-center text-slate-500 text-xs font-medium px-6 py-3.5">Decision</th>
              <th className="text-right text-slate-500 text-xs font-medium px-6 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className={cn(
                  "border-b border-slate-100/80",
                  student.isArticle39 ? "row-blocked-article39" : "hover:bg-slate-50/50"
                )}
              >
                <td className="px-6 py-4">
                  <p className="text-slate-800 text-sm font-medium">
                    {student.nom} {student.prenom}
                  </p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={cn(
                    "text-sm font-bold",
                    student.moyenne >= 10 ? "text-emerald-600" :
                    student.moyenne >= 8 ? "text-amber-600" : "text-red-500"
                  )}>
                    {student.moyenne.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {getDecisionBadge(student.decision, student.isArticle39)}
                </td>
                <td className="px-6 py-4 text-right">
                  {!student.isArticle39 && !student.decision && (
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600">
                      <option value="">Choisir...</option>
                      <option value="VALIDE">Valider</option>
                      <option value="RATTRAPAGE">Rattrapage</option>
                      <option value="RACHAT">Rachat</option>
                      <option value="NON_VALIDE">Non Valide</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
