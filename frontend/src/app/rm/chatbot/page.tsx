"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import {
  MessageSquare, Send, BookOpen, Sparkles, Bot, User, Search,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ArrowUpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Etudiant { id: number; nom: string; prenom: string; email: string; }

interface SyntheseElement {
  elementIntitule: string; moduleIntitule: string; semestre: string;
  noteExam: number | null; noteTd: number | null; noteTp: number | null;
  noteProjet: number | null; moyenne: number; isBlockedByArticle39: boolean;
}

interface Synthese {
  etudiantNom: string; etudiantPrenom: string;
  moyenneGenerale: number; totalElements: number;
  elements: SyntheseElement[];
}

export default function ChatbotPage() {
  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEtudiant, setSelectedEtudiant] = useState<Etudiant | null>(null);
  const [synthese, setSynthese] = useState<Synthese | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingEtudiants, setLoadingEtudiants] = useState(true);

  useEffect(() => {
    const fetchEtudiants = async () => {
      try {
        const res = await api.get("/enseignant/etudiants");
        setEtudiants(res.data);
      } catch (err) { console.error(err); }
      finally { setLoadingEtudiants(false); }
    };
    fetchEtudiants();
  }, []);

  const handleSelectEtudiant = async (etu: Etudiant) => {
    setSelectedEtudiant(etu);
    setLoading(true);
    setSynthese(null);
    try {
      const res = await api.get(`/rm/etudiant/${etu.id}/synthese`);
      setSynthese(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filteredEtudiants = etudiants.filter(e =>
    e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.prenom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Analyse academique
  const getAnalysis = (s: Synthese) => {
    const fortes = s.elements.filter(e => e.moyenne >= 14).sort((a, b) => b.moyenne - a.moyenne);
    const faibles = s.elements.filter(e => e.moyenne < 10 && !e.isBlockedByArticle39).sort((a, b) => a.moyenne - b.moyenne);
    const eligiblesRachat = s.elements.filter(e => e.noteExam !== null && e.noteExam >= 8 && e.noteExam < 10 && !e.isBlockedByArticle39);
    const bloquees = s.elements.filter(e => e.isBlockedByArticle39);
    return { fortes, faibles, eligiblesRachat, bloquees };
  };

  return (
    <DashboardLayout>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <MessageSquare size={20} className="text-orange-600" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-slate-900 text-xl font-bold">Assistant Academique</h1>
          <p className="text-slate-500 text-xs">Synthese, analyse de performance et aide au rachat</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Search & Select Student */}
        <div className="space-y-4">
          <div className="card">
            <label className="text-slate-600 text-xs font-medium mb-2 block">
              <Search size={12} className="inline mr-1" strokeWidth={1.5} />
              Rechercher un etudiant
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field text-sm"
              placeholder="Nom ou prenom..."
            />
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
              <span className="text-slate-500 text-[10px] font-medium">{filteredEtudiants.length} etudiant(s)</span>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {loadingEtudiants ? (
                <div className="py-8 text-center text-slate-400 text-sm animate-pulse">Chargement...</div>
              ) : (
                filteredEtudiants.slice(0, 50).map(etu => (
                  <button
                    key={etu.id}
                    onClick={() => handleSelectEtudiant(etu)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 border-b border-slate-100/80 hover:bg-orange-50/50 transition-colors",
                      selectedEtudiant?.id === etu.id && "bg-orange-50"
                    )}
                  >
                    <p className="text-slate-800 text-sm font-medium">{etu.nom} {etu.prenom}</p>
                    <p className="text-slate-400 text-[10px]">{etu.email}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right - Synthese */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="card flex items-center justify-center py-20">
              <div className="animate-pulse text-slate-400 text-sm">Analyse en cours...</div>
            </div>
          ) : synthese ? (
            <>
              {/* Header etudiant */}
              <div className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ee2927, #ff8848)" }}>
                  <User size={22} className="text-white" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h2 className="text-slate-900 text-lg font-bold">{synthese.etudiantNom} {synthese.etudiantPrenom}</h2>
                  <p className="text-slate-500 text-xs">{synthese.totalElements} element(s) evalue(s)</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-2xl font-bold", synthese.moyenneGenerale >= 10 ? "text-emerald-600" : "text-red-500")}>
                    {synthese.moyenneGenerale}/20
                  </p>
                  <p className="text-slate-400 text-[10px]">Moyenne generale</p>
                </div>
              </div>

              {/* Analyse IA */}
              {(() => {
                const analysis = getAnalysis(synthese);
                return (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Points forts */}
                    <div className="card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={14} className="text-emerald-600" strokeWidth={2} />
                        <span className="text-slate-800 text-xs font-bold">Points forts ({analysis.fortes.length})</span>
                      </div>
                      {analysis.fortes.length > 0 ? analysis.fortes.slice(0, 3).map((e, i) => (
                        <div key={i} className="flex justify-between py-1">
                          <span className="text-slate-600 text-[11px] truncate flex-1">{e.elementIntitule}</span>
                          <span className="text-emerald-600 text-[11px] font-bold ml-2">{e.moyenne}</span>
                        </div>
                      )) : <p className="text-slate-400 text-[10px]">Aucun module fort</p>}
                    </div>

                    {/* Points faibles */}
                    <div className="card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingDown size={14} className="text-red-500" strokeWidth={2} />
                        <span className="text-slate-800 text-xs font-bold">Points faibles ({analysis.faibles.length})</span>
                      </div>
                      {analysis.faibles.length > 0 ? analysis.faibles.slice(0, 3).map((e, i) => (
                        <div key={i} className="flex justify-between py-1">
                          <span className="text-slate-600 text-[11px] truncate flex-1">{e.elementIntitule}</span>
                          <span className="text-red-500 text-[11px] font-bold ml-2">{e.moyenne}</span>
                        </div>
                      )) : <p className="text-slate-400 text-[10px]">Aucun point faible</p>}
                    </div>

                    {/* Eligible rachat */}
                    <div className="card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ArrowUpCircle size={14} className="text-orange-600" strokeWidth={2} />
                        <span className="text-slate-800 text-xs font-bold">Eligible rachat ({analysis.eligiblesRachat.length})</span>
                      </div>
                      {analysis.eligiblesRachat.length > 0 ? analysis.eligiblesRachat.map((e, i) => (
                        <div key={i} className="flex justify-between py-1">
                          <span className="text-slate-600 text-[11px] truncate flex-1">{e.elementIntitule}</span>
                          <span className="text-orange-600 text-[11px] font-bold ml-2">{e.noteExam}/20</span>
                        </div>
                      )) : <p className="text-slate-400 text-[10px]">Aucun element eligible</p>}
                    </div>

                    {/* Article 39 */}
                    <div className="card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={14} className="text-red-500" strokeWidth={2} />
                        <span className="text-slate-800 text-xs font-bold">Art. 39 ({analysis.bloquees.length})</span>
                      </div>
                      {analysis.bloquees.length > 0 ? analysis.bloquees.map((e, i) => (
                        <div key={i} className="flex justify-between py-1">
                          <span className="text-slate-600 text-[11px] truncate flex-1">{e.elementIntitule}</span>
                          <span className="text-red-400 text-[11px] font-bold ml-2">0/20</span>
                        </div>
                      )) : <p className="text-emerald-500 text-[10px]">Aucun blocage Art. 39</p>}
                    </div>
                  </div>
                );
              })()}

              {/* Detail notes par element */}
              <div className="card">
                <h3 className="text-slate-900 text-sm font-bold mb-4">Detail des notes par element</h3>
                <div className="space-y-2">
                  {synthese.elements.map((el, idx) => (
                    <div key={idx} className={cn(
                      "p-3 rounded-xl border transition-colors",
                      el.isBlockedByArticle39 ? "bg-red-50/50 border-red-100" : el.moyenne >= 10 ? "bg-emerald-50/30 border-emerald-100" : "bg-amber-50/30 border-amber-100"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-slate-800 text-xs font-medium">{el.elementIntitule}</p>
                          <p className="text-slate-400 text-[10px]">{el.moduleIntitule} | {el.semestre}</p>
                        </div>
                        <span className={cn("text-sm font-bold",
                          el.isBlockedByArticle39 ? "text-red-400" : el.moyenne >= 10 ? "text-emerald-600" : "text-amber-600"
                        )}>
                          {el.moyenne}/20
                        </span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {el.noteExam !== null && (
                          <span className={cn("badge text-[9px]", el.isBlockedByArticle39 ? "bg-red-100 text-red-600 border border-red-200" : "bg-slate-100 text-slate-600 border border-slate-200")}>
                            Exam: {el.noteExam}
                          </span>
                        )}
                        {el.noteTd !== null && <span className="badge text-[9px] bg-slate-100 text-slate-600 border border-slate-200">TD: {el.noteTd}</span>}
                        {el.noteTp !== null && <span className="badge text-[9px] bg-slate-100 text-slate-600 border border-slate-200">TP: {el.noteTp}</span>}
                        {el.noteProjet !== null && <span className="badge text-[9px] bg-slate-100 text-slate-600 border border-slate-200">Projet: {el.noteProjet}</span>}
                        {el.isBlockedByArticle39 && <span className="badge text-[9px] bg-red-100 text-red-500 border border-red-200">Art. 39</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Bot size={28} className="text-slate-300" strokeWidth={1.5} />
              </div>
              <p className="text-slate-500 text-sm font-medium">Assistant Academique</p>
              <p className="text-slate-400 text-xs mt-1 max-w-xs">
                Selectionnez un etudiant pour voir sa synthese complete : notes, analyse de performance, modules eligibles au rachat
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
