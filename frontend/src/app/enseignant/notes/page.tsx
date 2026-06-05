"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { BookOpen, Save, Lock, AlertTriangle, CheckCircle, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface Element {
  id: number; code: string; intitule: string; moduleIntitule: string;
  moduleCode: string; semestre: string; filiereCode: string;
  filiereIntitule: string; coefficient: number;
  hasTd: boolean; hasTp: boolean; hasProjet: boolean;
}

interface Etudiant { id: number; nom: string; prenom: string; email: string; }

interface NoteData {
  id?: number; etudiantId: number; etudiantNom: string; etudiantPrenom: string;
  valeur: number | null; isBlockedByArticle39: boolean;
  typeEvaluation: string;
}

type TabType = "EXAM" | "TD" | "TP" | "PROJET";

export default function SaisieNotesPage() {
  const [elements, setElements] = useState<Element[]>([]);
  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [selectedElement, setSelectedElement] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("EXAM");
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentElement = elements.find(e => e.id === selectedElement);

  // Available tabs based on element config
  const availableTabs: TabType[] = currentElement
    ? ["EXAM",
       ...(currentElement.hasTd ? ["TD" as TabType] : []),
       ...(currentElement.hasTp ? ["TP" as TabType] : []),
       ...(currentElement.hasProjet ? ["PROJET" as TabType] : [])]
    : ["EXAM"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const elemRes = await api.get("/enseignant/mes-elements");
        setElements(elemRes.data);
        if (elemRes.data.length > 0) {
          setSelectedElement(elemRes.data[0].id);
        }
      } catch (err) { setError("Erreur chargement des elements"); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Load students filtered by filiere when element changes
  useEffect(() => {
    if (!currentElement) return;
    const fetchEtudiants = async () => {
      try {
        const filiereCode = currentElement.filiereCode.toLowerCase();
        const res = await api.get(`/enseignant/etudiants?filiere=${filiereCode}`);
        setEtudiants(res.data);
      } catch (err) { console.error(err); }
    };
    fetchEtudiants();
  }, [selectedElement, currentElement?.filiereCode]);

  // Load notes when element or tab changes
  useEffect(() => {
    if (!selectedElement) return;
    const fetchNotes = async () => {
      try {
        const res = await api.get(`/enseignant/notes/element/${selectedElement}?type=${activeTab}`);
        const existingNotes: NoteData[] = res.data;
        const notesMap = new Map(existingNotes.map(n => [n.etudiantId, n]));

        const allNotes: NoteData[] = etudiants.map(etu => {
          const existing = notesMap.get(etu.id);
          if (existing) return existing;
          return {
            etudiantId: etu.id, etudiantNom: etu.nom, etudiantPrenom: etu.prenom,
            valeur: null, isBlockedByArticle39: false, typeEvaluation: activeTab,
          };
        });
        setNotes(allNotes);
        setSavedIds(new Set());
      } catch (err) { console.error(err); }
    };
    if (etudiants.length > 0) fetchNotes();
  }, [selectedElement, activeTab, etudiants]);

  const handleSaveNote = async (etudiantId: number, valeur: number) => {
    if (!selectedElement) return;
    setSaving(etudiantId); setError(""); setSuccess("");
    try {
      await api.post("/enseignant/notes", {
        etudiantId, elementModuleId: selectedElement,
        valeur, typeEvaluation: activeTab,
      });
      setSavedIds(prev => { const s = new Set(Array.from(prev)); s.add(etudiantId); return s; });
      setSuccess("Note enregistree");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur sauvegarde");
    } finally { setSaving(null); }
  };

  const handleNoteChange = (etudiantId: number, value: string) => {
    if (value === "") {
      setNotes(prev => prev.map(n => n.etudiantId === etudiantId ? { ...n, valeur: null } : n));
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 20) return;
    setNotes(prev => prev.map(n => n.etudiantId === etudiantId ? { ...n, valeur: numValue } : n));
    setSavedIds(prev => { const s = new Set(Array.from(prev)); s.delete(etudiantId); return s; });
  };

  const filteredNotes = notes.filter(n =>
    n.etudiantNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.etudiantPrenom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-pulse text-slate-400">Chargement...</div></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-900 text-2xl font-bold">Saisie des Notes</h1>
          <p className="text-slate-500 text-sm mt-1">
            {currentElement ? `${currentElement.filiereCode} | ${currentElement.moduleIntitule} | ${currentElement.semestre}` : "Selectionnez un element"}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-500" strokeWidth={2} />
          <span className="text-red-600 text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2">
          <CheckCircle size={14} className="text-emerald-500" strokeWidth={2} />
          <span className="text-emerald-600 text-sm">{success}</span>
        </div>
      )}

      {/* Filtres */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-slate-600 text-xs font-medium mb-1 block">
              <Filter size={12} className="inline mr-1" strokeWidth={1.5} />
              Element de Module
            </label>
            <select value={selectedElement || ""} onChange={(e) => { setSelectedElement(Number(e.target.value)); setActiveTab("EXAM"); }} className="input-field text-sm">
              <option value="">-- Selectionner --</option>
              {elements.map(el => (
                <option key={el.id} value={el.id}>[{el.filiereCode}] {el.intitule} ({el.semestre})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-slate-600 text-xs font-medium mb-1 block">Filiere / Semestre</label>
            <input type="text" className="input-field text-sm bg-slate-50" value={currentElement ? `${currentElement.filiereIntitule} - ${currentElement.semestre}` : ""} readOnly />
          </div>
          <div>
            <label className="text-slate-600 text-xs font-medium mb-1 block">
              <Search size={12} className="inline mr-1" strokeWidth={1.5} />
              Rechercher
            </label>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field text-sm" placeholder="Nom ou prenom..." />
          </div>
        </div>
      </div>

      {/* Onglets Exam / TD / TP / Projet */}
      {selectedElement && (
        <div className="flex gap-1 mb-4 p-1 bg-slate-100 rounded-xl w-fit">
          {availableTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-medium transition-all",
                activeTab === tab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab === "EXAM" ? "Examen" : tab}
            </button>
          ))}
        </div>
      )}

      {/* Article 39 banner - ONLY on EXAM tab */}
      {activeTab === "EXAM" && selectedElement && (
        <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-red-700 text-xs font-medium">Regle Article 39 (Examen uniquement)</p>
            <p className="text-red-500 text-[11px] mt-0.5">
              Absence injustifiee a l'examen = note forcee a 0/20 et verrouillee. Ne concerne pas TD/TP/Projet.
            </p>
          </div>
        </div>
      )}

      {/* Tableau des notes */}
      {selectedElement && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <span className="text-slate-600 text-xs font-medium">
              {filteredNotes.length} etudiant(s) | {currentElement?.filiereCode}
            </span>
            <span className="text-slate-400 text-[10px]">
              Type: {activeTab === "EXAM" ? "Examen" : activeTab} | Bareme: /20
            </span>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-slate-50/90 border-b border-slate-100">
                  <th className="text-left text-slate-500 text-xs font-medium px-6 py-3">#</th>
                  <th className="text-left text-slate-500 text-xs font-medium px-6 py-3">Etudiant</th>
                  <th className="text-center text-slate-500 text-xs font-medium px-6 py-3">Note /20</th>
                  <th className="text-center text-slate-500 text-xs font-medium px-6 py-3">Statut</th>
                  <th className="text-right text-slate-500 text-xs font-medium px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotes.map((note, idx) => (
                  <tr key={note.etudiantId} className={cn("border-b border-slate-100/80 transition-colors", note.isBlockedByArticle39 ? "row-blocked-article39" : "hover:bg-slate-50/50")}>
                    <td className="px-6 py-2.5 text-slate-400 text-xs">{idx + 1}</td>
                    <td className="px-6 py-2.5">
                      <div className="flex items-center gap-2">
                        {note.isBlockedByArticle39 && (
                          <div className="w-5 h-5 rounded bg-red-50 flex items-center justify-center">
                            <Lock size={10} className="text-red-400" strokeWidth={2} />
                          </div>
                        )}
                        <div>
                          <p className={cn("text-sm font-medium", note.isBlockedByArticle39 ? "text-slate-400" : "text-slate-800")}>
                            {note.etudiantNom} {note.etudiantPrenom}
                          </p>
                          {note.isBlockedByArticle39 && <p className="text-[9px] text-red-400 font-medium">Art. 39</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-2.5 text-center">
                      {note.isBlockedByArticle39 ? (
                        <span className="text-red-400 font-bold">0.00</span>
                      ) : (
                        <input type="number" min="0" max="20" step="0.25" value={note.valeur ?? ""} onChange={(e) => handleNoteChange(note.etudiantId, e.target.value)} className="w-20 px-2 py-1 text-center rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none text-sm font-medium" placeholder="--" />
                      )}
                    </td>
                    <td className="px-6 py-2.5 text-center">
                      {note.isBlockedByArticle39 ? (
                        <span className="badge-danger text-[10px]"><Lock size={9} className="mr-0.5" />Bloque</span>
                      ) : savedIds.has(note.etudiantId) || (note.id && note.valeur !== null) ? (
                        <span className="badge-success text-[10px]"><CheckCircle size={9} className="mr-0.5" />OK</span>
                      ) : (
                        <span className="badge-warning text-[10px]">--</span>
                      )}
                    </td>
                    <td className="px-6 py-2.5 text-right">
                      {!note.isBlockedByArticle39 && note.valeur !== null && (
                        <button onClick={() => handleSaveNote(note.etudiantId, note.valeur!)} disabled={saving === note.etudiantId} className="text-orange-600 text-xs font-medium hover:text-orange-700 disabled:opacity-50">
                          {saving === note.etudiantId ? "..." : "Sauver"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredNotes.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">Aucun etudiant pour cette filiere</div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
