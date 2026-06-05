"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  BookOpen,
  Save,
  Lock,
  AlertTriangle,
  CheckCircle,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentNote {
  id: number;
  nom: string;
  prenom: string;
  note: number | null;
  isBlockedByArticle39: boolean;
  saved: boolean;
}

export default function SaisieNotesPage() {
  const [selectedElement, setSelectedElement] = useState("Java Avance");
  const [students, setStudents] = useState<StudentNote[]>([
    { id: 1, nom: "ALAOUI", prenom: "Youssef", note: 15.5, isBlockedByArticle39: false, saved: true },
    { id: 2, nom: "BENNANI", prenom: "Khadija", note: 12.0, isBlockedByArticle39: false, saved: true },
    { id: 3, nom: "CHRAIBI", prenom: "Omar", note: 0, isBlockedByArticle39: true, saved: true },
    { id: 4, nom: "DOUKKALI", prenom: "Amina", note: null, isBlockedByArticle39: false, saved: false },
    { id: 5, nom: "ELFASSI", prenom: "Hamza", note: 8.5, isBlockedByArticle39: false, saved: true },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredStudents = students.filter(
    (s) =>
      s.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.prenom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNoteChange = (id: number, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 20) return;

    setStudents((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, note: numValue, saved: false } : s
      )
    );
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-slate-900 text-2xl font-bold">Saisie des Notes</h1>
          <p className="text-slate-500 text-sm mt-1">
            Element : {selectedElement} | Bareme : /20
          </p>
        </div>
        <button className="btn-primary">
          <Save size={16} strokeWidth={1.5} />
          Enregistrer tout
        </button>
      </div>

      {/* Element selector */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-slate-600 text-xs font-medium mb-1 block">
              Element de Module
            </label>
            <select
              value={selectedElement}
              onChange={(e) => setSelectedElement(e.target.value)}
              className="input-field"
            >
              <option>Java Avance</option>
              <option>Design Patterns</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-slate-600 text-xs font-medium mb-1 block">
              Rechercher un etudiant
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                strokeWidth={1.5}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
                placeholder="Nom ou prenom..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Article 39 Warning Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
        <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" strokeWidth={1.5} />
        <div>
          <p className="text-red-700 text-sm font-medium">Regle Article 39</p>
          <p className="text-red-500 text-xs mt-0.5">
            Les etudiants avec absence injustifiee ont leur note forcee a 0/20 et
            verrouillee. Aucune modification ni rachat n'est possible.
          </p>
        </div>
      </div>

      {/* Notes Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="text-left text-slate-500 text-xs font-medium px-6 py-3.5">
                Etudiant
              </th>
              <th className="text-center text-slate-500 text-xs font-medium px-6 py-3.5">
                Note /20
              </th>
              <th className="text-center text-slate-500 text-xs font-medium px-6 py-3.5">
                Statut
              </th>
              <th className="text-right text-slate-500 text-xs font-medium px-6 py-3.5">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr
                key={student.id}
                className={cn(
                  "border-b border-slate-100/80 transition-colors",
                  student.isBlockedByArticle39
                    ? "row-blocked-article39"
                    : "hover:bg-slate-50/50"
                )}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {student.isBlockedByArticle39 && (
                      <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center">
                        <Lock size={12} className="text-red-400" strokeWidth={2} />
                      </div>
                    )}
                    <div>
                      <p className={cn(
                        "text-sm font-medium",
                        student.isBlockedByArticle39 ? "text-slate-400" : "text-slate-800"
                      )}>
                        {student.nom} {student.prenom}
                      </p>
                      {student.isBlockedByArticle39 && (
                        <p className="text-[10px] text-red-400 font-medium mt-0.5">
                          Article 39 - Absence injustifiee
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {student.isBlockedByArticle39 ? (
                    <span className="text-red-400 font-bold text-lg">0</span>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.25"
                      value={student.note ?? ""}
                      onChange={(e) => handleNoteChange(student.id, e.target.value)}
                      className="w-20 px-3 py-1.5 text-center rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm font-medium"
                      placeholder="--"
                    />
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {student.isBlockedByArticle39 ? (
                    <span className="badge-danger">
                      <Lock size={10} className="mr-1" strokeWidth={2} />
                      Verrouille
                    </span>
                  ) : student.saved ? (
                    <span className="badge-success">
                      <CheckCircle size={10} className="mr-1" strokeWidth={2} />
                      Enregistre
                    </span>
                  ) : (
                    <span className="badge-warning">En attente</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {!student.isBlockedByArticle39 && (
                    <button className="text-orange-600 text-xs font-medium hover:text-orange-700 transition-colors">
                      Sauvegarder
                    </button>
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
