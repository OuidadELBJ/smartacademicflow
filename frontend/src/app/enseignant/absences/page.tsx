"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  AlertTriangle,
  Plus,
  Calendar,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function AbsencesPage() {
  const [absences] = useState([
    { id: 1, etudiant: "CHRAIBI Omar", date: "2024-12-15", type: "INJUSTIFIEE", element: "Java Avance" },
    { id: 2, etudiant: "DOUKKALI Amina", date: "2024-12-10", type: "JUSTIFIEE", element: "Java Avance" },
    { id: 3, etudiant: "ELFASSI Hamza", date: "2024-12-18", type: "INJUSTIFIEE", element: "Design Patterns" },
  ]);

  const [showForm, setShowForm] = useState(false);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <AlertTriangle size={20} className="text-amber-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-slate-900 text-xl font-bold">Declaration des Absences</h1>
            <p className="text-slate-500 text-xs">Declarez les absences pour vos elements</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus size={16} strokeWidth={1.5} />
          Nouvelle absence
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="text-slate-900 text-sm font-bold mb-4">Declarer une absence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-slate-600 text-xs font-medium mb-1 block">Etudiant</label>
              <select className="input-field">
                <option>Selectionner...</option>
                <option>ALAOUI Youssef</option>
                <option>BENNANI Khadija</option>
                <option>CHRAIBI Omar</option>
              </select>
            </div>
            <div>
              <label className="text-slate-600 text-xs font-medium mb-1 block">Element</label>
              <select className="input-field">
                <option>Java Avance</option>
                <option>Design Patterns</option>
              </select>
            </div>
            <div>
              <label className="text-slate-600 text-xs font-medium mb-1 block">Date</label>
              <input type="date" className="input-field" />
            </div>
            <div>
              <label className="text-slate-600 text-xs font-medium mb-1 block">Type</label>
              <select className="input-field">
                <option value="INJUSTIFIEE">Injustifiee</option>
                <option value="JUSTIFIEE">Justifiee</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="btn-primary">
              <CheckCircle size={14} strokeWidth={1.5} />
              Enregistrer
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="text-left text-slate-500 text-xs font-medium px-6 py-3.5">Etudiant</th>
              <th className="text-left text-slate-500 text-xs font-medium px-6 py-3.5">Element</th>
              <th className="text-center text-slate-500 text-xs font-medium px-6 py-3.5">Date</th>
              <th className="text-center text-slate-500 text-xs font-medium px-6 py-3.5">Type</th>
            </tr>
          </thead>
          <tbody>
            {absences.map((absence) => (
              <tr key={absence.id} className="border-b border-slate-100/80 hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-400" strokeWidth={1.5} />
                    <span className="text-slate-800 text-sm font-medium">{absence.etudiant}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 text-sm">{absence.element}</td>
                <td className="px-6 py-4 text-center">
                  <span className="text-slate-600 text-sm flex items-center justify-center gap-1.5">
                    <Calendar size={12} strokeWidth={1.5} />
                    {absence.date}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {absence.type === "INJUSTIFIEE" ? (
                    <span className="badge-danger">
                      <XCircle size={10} className="mr-1" strokeWidth={2} />
                      Injustifiee
                    </span>
                  ) : (
                    <span className="badge-success">
                      <CheckCircle size={10} className="mr-1" strokeWidth={2} />
                      Justifiee
                    </span>
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
