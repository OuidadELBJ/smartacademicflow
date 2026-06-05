"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { ArrowUpCircle, Lock, CheckCircle, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CasLimite {
  noteId: number; etudiantId: number; etudiantNom: string; etudiantPrenom: string;
  elementIntitule: string; moduleIntitule: string; noteExam: number;
  ecartValidation: number; isRachete: boolean; motifRachat: string | null;
  isBlockedByArticle39?: boolean;
}

export default function RachatPage() {
  const [casLimites, setCasLimites] = useState<CasLimite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<CasLimite | null>(null);
  const [motif, setMotif] = useState("");
  const [nouvelleNote, setNouvelleNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/rm/cas-limites");
        setCasLimites(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleRachat = async () => {
    if (!selectedNote || !motif.trim() || !nouvelleNote) return;
    setSubmitting(true);
    setError("");

    try {
      await api.post("/rm/rachat", {
        noteId: selectedNote.noteId,
        nouvelleValeur: parseFloat(nouvelleNote),
        motif: motif,
      });

      // Refresh list
      const res = await api.get("/rm/cas-limites");
      setCasLimites(res.data);

      setToast(`Rachat effectue : ${selectedNote.etudiantNom} ${selectedNote.etudiantPrenom} (${selectedNote.noteExam} -> ${nouvelleNote})`);
      setSelectedNote(null);
      setMotif("");
      setNouvelleNote("");
      setTimeout(() => setToast(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors du rachat");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-pulse text-slate-400">Chargement...</div></div></DashboardLayout>;
  }

  const eligibles = casLimites.filter(c => !c.isRachete && !c.isBlockedByArticle39);
  const rachetes = casLimites.filter(c => c.isRachete);
  const bloques = casLimites.filter(c => c.isBlockedByArticle39);

  return (
    <DashboardLayout>
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-emerald-600 text-white text-sm font-medium shadow-lg flex items-center gap-2">
          <CheckCircle size={16} strokeWidth={2} />
          {toast}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <ArrowUpCircle size={20} className="text-orange-600" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-slate-900 text-xl font-bold">Rachat de Notes</h1>
          <p className="text-slate-500 text-xs">{eligibles.length} etudiant(s) eligible(s) | {rachetes.length} rachete(s)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Liste des notes */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-slate-700 text-xs font-medium">Notes eligibles (8-10/20)</span>
            <span className="text-slate-400 text-[10px]">{casLimites.length} total</span>
          </div>
          <div className="max-h-[550px] overflow-y-auto divide-y divide-slate-100">
            {casLimites.map((cas) => {
              const isBlocked = cas.isBlockedByArticle39;
              const isSelected = selectedNote?.noteId === cas.noteId;

              return (
                <div
                  key={cas.noteId}
                  onClick={() => {
                    if (!isBlocked && !cas.isRachete) {
                      setSelectedNote(cas);
                      setNouvelleNote(String(Math.min(cas.noteExam + 2, 12)));
                      setMotif("");
                      setError("");
                    }
                  }}
                  className={cn(
                    "px-5 py-3.5 flex items-center gap-4 transition-colors",
                    isBlocked
                      ? "row-blocked-article39 cursor-not-allowed opacity-60"
                      : cas.isRachete
                      ? "bg-emerald-50/30 cursor-default"
                      : isSelected
                      ? "bg-orange-50/60 border-l-2 border-l-orange-400"
                      : "hover:bg-slate-50/50 cursor-pointer"
                  )}
                >
                  {isBlocked && (
                    <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center shrink-0">
                      <Lock size={12} className="text-red-400" strokeWidth={2} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", isBlocked ? "text-slate-400" : "text-slate-800")}>
                      {cas.etudiantNom} {cas.etudiantPrenom}
                    </p>
                    <p className="text-slate-400 text-[10px]">{cas.elementIntitule} | {cas.moduleIntitule}</p>
                    {isBlocked && <p className="text-red-400 text-[9px] font-medium mt-0.5">Article 39 - Rachat impossible</p>}
                    {cas.isRachete && <p className="text-emerald-600 text-[9px] font-medium mt-0.5">Rachete - {cas.motifRachat}</p>}
                  </div>

                  <div className="text-right shrink-0">
                    <span className={cn(
                      "text-base font-bold",
                      isBlocked ? "text-red-300" : cas.isRachete ? "text-emerald-600" : "text-amber-600"
                    )}>
                      {cas.noteExam}
                    </span>
                    <p className="text-slate-400 text-[9px]">/20</p>
                  </div>

                  {cas.isRachete && (
                    <span className="badge-success text-[9px]"><CheckCircle size={9} className="mr-0.5" />OK</span>
                  )}
                </div>
              );
            })}
            {casLimites.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm">Aucun cas limite</div>
            )}
          </div>
        </div>

        {/* Right - Formulaire rachat (modale inline) */}
        <div className="card">
          {selectedNote ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-900 text-sm font-bold">Rachat</h3>
                <button onClick={() => { setSelectedNote(null); setError(""); }} className="text-slate-400 hover:text-slate-600">
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                <p className="text-slate-800 text-sm font-medium">{selectedNote.etudiantNom} {selectedNote.etudiantPrenom}</p>
                <p className="text-slate-500 text-[11px]">{selectedNote.elementIntitule}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-amber-600 font-bold">{selectedNote.noteExam}/20</span>
                  <span className="text-slate-400 text-[10px]">ecart : -{selectedNote.ecartValidation} pts</span>
                </div>
              </div>

              {error && (
                <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2">
                  <AlertTriangle size={12} className="text-red-500" strokeWidth={2} />
                  <span className="text-red-600 text-[11px]">{error}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-slate-600 text-xs font-medium mb-1 block">Nouvelle note /20</label>
                  <input
                    type="number"
                    min={selectedNote.noteExam}
                    max={Math.min(selectedNote.noteExam + 2, 20)}
                    step="0.25"
                    value={nouvelleNote}
                    onChange={(e) => setNouvelleNote(e.target.value)}
                    className="input-field text-sm"
                  />
                  <p className="text-slate-400 text-[9px] mt-1">Max : {Math.min(selectedNote.noteExam + 2, 20).toFixed(2)} (limite +2 pts)</p>
                </div>
                <div>
                  <label className="text-slate-600 text-xs font-medium mb-1 block">Motif (obligatoire)</label>
                  <textarea
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    className="input-field text-sm min-h-[90px] resize-none"
                    placeholder="Justification consignee au PV..."
                  />
                </div>
              </div>

              <button
                onClick={handleRachat}
                disabled={!motif.trim() || !nouvelleNote || submitting}
                className={cn(
                  "btn-primary w-full justify-center mt-4",
                  (!motif.trim() || !nouvelleNote) && "opacity-50 cursor-not-allowed"
                )}
              >
                {submitting ? (
                  <span className="animate-pulse">Enregistrement...</span>
                ) : (
                  <><CheckCircle size={14} strokeWidth={1.5} />Confirmer le rachat</>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <ArrowUpCircle size={24} className="text-slate-300" strokeWidth={1.5} />
              </div>
              <p className="text-slate-500 text-sm font-medium">Selectionnez un etudiant</p>
              <p className="text-slate-400 text-xs mt-1">Cliquez sur un cas limite dans la liste pour effectuer un rachat</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
