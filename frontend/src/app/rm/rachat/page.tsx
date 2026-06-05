"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FileText, ArrowUpCircle, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RachatPage() {
  const [motif, setMotif] = useState("");
  const [selectedNote, setSelectedNote] = useState<number | null>(null);
  const [nouvelleNote, setNouvelleNote] = useState("");

  const notes = [
    { id: 1, etudiant: "DOUKKALI Amina", element: "Java Avance", note: 9.0, isArticle39: false },
    { id: 2, etudiant: "ELFASSI Hamza", element: "Java Avance", note: 8.5, isArticle39: false },
    { id: 3, etudiant: "CHRAIBI Omar", element: "Java Avance", note: 0, isArticle39: true },
    { id: 4, etudiant: "ALAOUI Youssef", element: "Design Patterns", note: 9.5, isArticle39: false },
  ];

  return (
    <DashboardLayout>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <ArrowUpCircle size={20} className="text-orange-600" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-slate-900 text-xl font-bold">Rachat de Notes</h1>
          <p className="text-slate-500 text-xs">Modifier une note avec motif obligatoire (Art. 35-37)</p>
        </div>
      </div>

      <div className="card mb-6 bg-orange-50/50 border-orange-100">
        <div className="flex items-start gap-3">
          <AlertCircle size={16} className="text-orange-600 mt-0.5 shrink-0" strokeWidth={1.5} />
          <div className="text-xs text-orange-700">
            <p className="font-medium mb-1">Regles de rachat :</p>
            <ul className="space-y-0.5 text-orange-600">
              <li>- Applicable uniquement pour les notes entre 8 et 10/20</li>
              <li>- Maximum +2 points d'augmentation (Art. 36)</li>
              <li>- Motif obligatoire consigne au PV (Art. 37)</li>
              <li>- Impossible si Article 39 applique</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <p className="text-slate-700 text-sm font-medium">Notes eligibles au rachat</p>
          </div>
          <div className="divide-y divide-slate-100">
            {notes.map((note) => (
              <div key={note.id} className={cn("px-6 py-4 flex items-center gap-4 transition-colors cursor-pointer", note.isArticle39 ? "row-blocked-article39 cursor-not-allowed" : selectedNote === note.id ? "bg-orange-50/50" : "hover:bg-slate-50/50")} onClick={() => !note.isArticle39 && setSelectedNote(note.id)}>
                {note.isArticle39 && <Lock size={14} className="text-red-400 shrink-0" strokeWidth={2} />}
                <div className="flex-1">
                  <p className={cn("text-sm font-medium", note.isArticle39 ? "text-slate-400" : "text-slate-800")}>{note.etudiant}</p>
                  <p className="text-slate-400 text-xs">{note.element}</p>
                </div>
                <span className={cn("text-lg font-bold", note.isArticle39 ? "text-red-300" : "text-amber-600")}>{note.note}/20</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-slate-900 text-sm font-bold mb-4">Formulaire de rachat</h3>
          {selectedNote ? (
            <div className="space-y-4">
              <div>
                <label className="text-slate-600 text-xs font-medium mb-1 block">Nouvelle note /20</label>
                <input type="number" min="0" max="20" step="0.25" value={nouvelleNote} onChange={(e) => setNouvelleNote(e.target.value)} className="input-field" placeholder="Ex: 10.5" />
              </div>
              <div>
                <label className="text-slate-600 text-xs font-medium mb-1 block">Motif du rachat (obligatoire)</label>
                <textarea value={motif} onChange={(e) => setMotif(e.target.value)} className="input-field min-h-[100px] resize-none" placeholder="Justification detaillee du rachat..." />
              </div>
              <button disabled={!motif.trim() || !nouvelleNote} className={cn("btn-primary w-full justify-center", (!motif.trim() || !nouvelleNote) && "opacity-50 cursor-not-allowed")}>
                <CheckCircle size={16} strokeWidth={1.5} />
                Confirmer le rachat
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText size={32} className="text-slate-200 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-slate-400 text-xs">Selectionnez une note dans la liste pour effectuer un rachat</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
