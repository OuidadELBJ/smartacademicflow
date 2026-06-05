"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { Scale, CheckCircle, AlertTriangle, ArrowUpCircle, Lock, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface CasLimite {
  noteId: number; etudiantId: number; etudiantNom: string; etudiantPrenom: string;
  elementIntitule: string; moduleIntitule: string; noteExam: number;
  ecartValidation: number; isRachete: boolean; motifRachat: string | null;
}

export default function DeliberationPage() {
  const [casLimites, setCasLimites] = useState<CasLimite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rachatModal, setRachatModal] = useState<CasLimite | null>(null);
  const [motif, setMotif] = useState("");
  const [nouvelleNote, setNouvelleNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

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
    if (!rachatModal || !motif.trim() || !nouvelleNote) return;
    setSubmitting(true);
    try {
      await api.post("/rm/rachat", {
        noteId: rachatModal.noteId,
        nouvelleValeur: parseFloat(nouvelleNote),
        motif: motif,
      });
      // Update local state
      setCasLimites(prev => prev.map(c =>
        c.noteId === rachatModal.noteId ? { ...c, isRachete: true, motifRachat: motif } : c
      ));
      setSuccess(`Rachat effectue pour ${rachatModal.etudiantNom} ${rachatModal.etudiantPrenom}`);
      setRachatModal(null);
      setMotif("");
      setNouvelleNote("");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur rachat");
    } finally { setSubmitting(false); }
  };

  const filtered = casLimites.filter(c =>
    c.etudiantNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.etudiantPrenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.elementIntitule.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-pulse text-slate-400">Chargement...</div></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <Scale size={20} className="text-orange-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-slate-900 text-xl font-bold">Deliberation - Cas Limites</h1>
            <p className="text-slate-500 text-xs">{casLimites.length} etudiant(s) entre 8 et 10/20 (eligibles au rachat)</p>
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={1.5} />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field text-xs pl-9 w-56" placeholder="Rechercher..." />
        </div>
      </div>

      {success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2">
          <CheckCircle size={14} className="text-emerald-500" strokeWidth={2} />
          <span className="text-emerald-600 text-sm">{success}</span>
        </div>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card py-4 text-center">
          <p className="text-amber-600 text-2xl font-bold">{casLimites.filter(c => !c.isRachete).length}</p>
          <p className="text-slate-500 text-xs">En attente de decision</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-emerald-600 text-2xl font-bold">{casLimites.filter(c => c.isRachete).length}</p>
          <p className="text-slate-500 text-xs">Rachetes</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-orange-600 text-2xl font-bold">{casLimites.length}</p>
          <p className="text-slate-500 text-xs">Total cas limites</p>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="bg-slate-50/90 border-b border-slate-100">
                <th className="text-left text-slate-500 text-xs font-medium px-5 py-3">Etudiant</th>
                <th className="text-left text-slate-500 text-xs font-medium px-5 py-3">Element / Module</th>
                <th className="text-center text-slate-500 text-xs font-medium px-5 py-3">Note Exam</th>
                <th className="text-center text-slate-500 text-xs font-medium px-5 py-3">Ecart</th>
                <th className="text-center text-slate-500 text-xs font-medium px-5 py-3">Statut</th>
                <th className="text-right text-slate-500 text-xs font-medium px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cas) => (
                <tr key={cas.noteId} className="border-b border-slate-100/80 hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <p className="text-slate-800 text-sm font-medium">{cas.etudiantNom} {cas.etudiantPrenom}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-slate-700 text-xs">{cas.elementIntitule}</p>
                    <p className="text-slate-400 text-[10px]">{cas.moduleIntitule}</p>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-amber-600 font-bold text-sm">{cas.noteExam}/20</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-red-500 text-xs font-medium">-{cas.ecartValidation} pts</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {cas.isRachete ? (
                      <span className="badge-success text-[10px]"><ArrowUpCircle size={9} className="mr-0.5" />Rachete</span>
                    ) : (
                      <span className="badge-warning text-[10px]"><AlertTriangle size={9} className="mr-0.5" />En attente</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {!cas.isRachete && (
                      <button onClick={() => { setRachatModal(cas); setNouvelleNote("10"); }} className="text-orange-600 text-xs font-medium hover:text-orange-700">
                        Racheter
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm">Aucun cas limite trouve</div>
        )}
      </div>

      {/* Modale Rachat */}
      {rachatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4">
            <h3 className="text-slate-900 text-base font-bold mb-1">Rachat de Note</h3>
            <p className="text-slate-500 text-xs mb-4">
              {rachatModal.etudiantNom} {rachatModal.etudiantPrenom} - {rachatModal.elementIntitule}
            </p>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 mb-4">
              <p className="text-amber-700 text-xs">Note actuelle : <strong>{rachatModal.noteExam}/20</strong> (ecart de {rachatModal.ecartValidation} pts)</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-600 text-xs font-medium mb-1 block">Nouvelle note /20 (max +2 pts, Art.36)</label>
                <input type="number" min={rachatModal.noteExam} max={Math.min(rachatModal.noteExam + 2, 20)} step="0.25" value={nouvelleNote} onChange={(e) => setNouvelleNote(e.target.value)} className="input-field text-sm" />
              </div>
              <div>
                <label className="text-slate-600 text-xs font-medium mb-1 block">Motif du rachat (obligatoire - Art.37)</label>
                <textarea value={motif} onChange={(e) => setMotif(e.target.value)} className="input-field text-sm min-h-[80px] resize-none" placeholder="Justification detaillee consignee au PV..." />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={handleRachat} disabled={!motif.trim() || !nouvelleNote || submitting} className={cn("btn-primary flex-1 justify-center", (!motif.trim() || !nouvelleNote) && "opacity-50 cursor-not-allowed")}>
                <CheckCircle size={14} strokeWidth={1.5} />
                {submitting ? "..." : "Confirmer le rachat"}
              </button>
              <button onClick={() => { setRachatModal(null); setMotif(""); setNouvelleNote(""); }} className="btn-secondary">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
