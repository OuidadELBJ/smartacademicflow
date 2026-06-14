"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api, aiApi } from "@/lib/api";
import {
  Scale, CheckCircle, AlertTriangle, ArrowUpCircle, Lock, Search,
  Sparkles, Bot, TrendingUp, XCircle, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CasLimite {
  noteId: number; etudiantId: number; etudiantNom: string; etudiantPrenom: string;
  elementIntitule: string; moduleIntitule: string; noteExam: number;
  noteElement: number; ecartValidation: number; isRachete: boolean;
  motifRachat: string | null; noteModule: number;
}

interface AIAnalysis {
  resume: string;
  elements: { nom: string; note: number; statut: string }[];
  elements_rattrapage: string[];
  simulation: { avant: number; apres: number; elements_modifies: string[] };
  recommandation: string;
  justification: string;
  confiance: number;
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

  // AI Analysis state
  const [selectedForAI, setSelectedForAI] = useState<CasLimite | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Historique rachats
  const [historiqueRachats, setHistoriqueRachats] = useState<any[]>([]);
  const [showHistorique, setShowHistorique] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [casRes, histRes] = await Promise.all([
          api.get("/rm/cas-limites"),
          api.get("/rm/historique-rachats"),
        ]);
        setCasLimites(casRes.data);
        setHistoriqueRachats(histRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const generateMotifProposition = (cas: CasLimite, analysis: AIAnalysis): string => {
    const ecart = cas.ecartValidation || (12 - (cas.noteElement || cas.noteExam));
    const noteActuelle = cas.noteElement || cas.noteExam;
    const elementsOK = analysis.elements.filter(e => e.statut === "OK");
    const nbElementsTotal = analysis.elements.length;
    
    // Construire un motif contextuel et professionnel
    let motif = `Rachat accorde pour l'element "${cas.elementIntitule}" (module "${cas.moduleIntitule}"). `;
    
    if (ecart <= 1) {
      motif += `Note actuelle ${noteActuelle}/20, a seulement ${ecart.toFixed(2)} point(s) du seuil de validation. `;
    } else {
      motif += `Note actuelle ${noteActuelle}/20, ecart de ${ecart.toFixed(2)} points par rapport au seuil de 12. `;
    }

    if (elementsOK.length > 0) {
      motif += `L'etudiant a valide ${elementsOK.length}/${nbElementsTotal} element(s) du module avec succes. `;
    }

    if (analysis.simulation.apres >= 12) {
      motif += `Le rachat permettrait la validation du module (note simulee : ${analysis.simulation.apres}/20, plafonnee a 12). `;
    }

    motif += `Decision motivee conformement aux Art. 30-31 du reglement ENSIAS.`;
    
    return motif;
  };

  const handleAnalyseIA = async (cas: CasLimite) => {
    setSelectedForAI(cas);
    setAiLoading(true);
    setAiAnalysis(null);

    try {
      // Get full student synthese for this module
      const synRes = await api.get(`/rm/etudiant/${cas.etudiantId}/synthese`);
      const synthese = synRes.data;

      // Build elements for the AI analysis
      const elements = (synthese.elements || []).map((el: any) => ({
        nom: el.elementIntitule,
        note_element: el.moyenne,
        coefficient: 1.5,
        is_blocked: el.isBlockedByArticle39 || false,
      }));

      const noteModule = synthese.moyenneGenerale || cas.noteModule || 0;

      // Call AI service via backend proxy (more reliable)
      let aiResult: AIAnalysis;
      try {
        const aiRes = await api.post("/rm/analyse-ia", {
          etudiant_nom: cas.etudiantNom,
          etudiant_prenom: cas.etudiantPrenom,
          note_module: noteModule,
          elements: elements,
        });
        aiResult = aiRes.data;
      } catch {
        // Fallback: try direct call to AI service
        try {
          const aiRes = await aiApi.post("/api/rag/analyse-etudiant", {
            etudiant_nom: cas.etudiantNom,
            etudiant_prenom: cas.etudiantPrenom,
            note_module: noteModule,
            elements: elements,
          });
          aiResult = aiRes.data;
        } catch {
          // Ultimate fallback: generate analysis locally
          const elementsAnalysis = elements.map((el: any) => ({
            nom: el.nom,
            note: el.note_element,
            statut: el.is_blocked ? "BLOQUE" : el.note_element >= 12 ? "OK" : "RATTRAPAGE",
          }));
          const elemRatt = elements.filter((el: any) => !el.is_blocked && el.note_element < 12).map((el: any) => el.nom);

          aiResult = {
            resume: `Etudiant ${cas.etudiantNom} ${cas.etudiantPrenom} — Note module : ${noteModule.toFixed(2)}/20`,
            elements: elementsAnalysis,
            elements_rattrapage: elemRatt,
            simulation: { avant: noteModule, apres: Math.min(Math.max(noteModule, 12), 12), elements_modifies: elemRatt },
            recommandation: noteModule >= 12 ? "VALIDER" : elemRatt.length > 0 ? "RATTRAPAGE" : "REFUSER",
            justification: noteModule >= 12
              ? `Module valide : ${noteModule.toFixed(2)}/20 >= 12 (Art. 21).`
              : elemRatt.length > 0
              ? `Module non valide (${noteModule.toFixed(2)}/20 < 12). Rattrapage dans : ${elemRatt.join(", ")} (Art. 25). Rachat possible si note element entre [10, 12) avec max +2pts (Art. 30).`
              : `Module non valide. Aucun element eligible au rattrapage.`,
            confiance: 0.80,
          };
        }
      }

      setAiAnalysis(aiResult);
    } catch (err) {
      console.error("Erreur analyse IA:", err);
      // Fallback minimal
      setAiAnalysis({
        resume: `Analyse de ${cas.etudiantNom} ${cas.etudiantPrenom}`,
        elements: [{ nom: cas.elementIntitule, note: cas.noteElement || cas.noteExam, statut: "RATTRAPAGE" }],
        elements_rattrapage: [cas.elementIntitule],
        simulation: { avant: cas.noteModule || 0, apres: 12, elements_modifies: [cas.elementIntitule] },
        recommandation: "RATTRAPAGE",
        justification: `Note element ${cas.noteElement || cas.noteExam}/20 < 12 (Art. 25). Rachat possible : note entre [10, 12). Max +2pts (Art. 30).`,
        confiance: 0.70,
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleRachat = async () => {
    if (!rachatModal || !motif.trim() || !nouvelleNote) return;
    setSubmitting(true);
    try {
      await api.post("/rm/rachat", {
        noteId: rachatModal.noteId,
        nouvelleValeur: parseFloat(nouvelleNote),
        motif: motif,
      });
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
            <h1 className="text-slate-900 text-xl font-bold">Deliberation & Rachat</h1>
            <p className="text-slate-500 text-xs">{casLimites.length} cas limite(s) [10-12/20] | Assistant IA integre</p>
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

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card py-4 text-center">
          <p className="text-amber-600 text-2xl font-bold">{casLimites.filter(c => !c.isRachete).length}</p>
          <p className="text-slate-500 text-xs">En attente</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-emerald-600 text-2xl font-bold">{casLimites.filter(c => c.isRachete).length + historiqueRachats.length}</p>
          <p className="text-slate-500 text-xs">Rachetes</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-orange-600 text-2xl font-bold">{casLimites.length}</p>
          <p className="text-slate-500 text-xs">Total</p>
        </div>
        <div className="card py-4 text-center cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setShowHistorique(!showHistorique)}>
          <p className="text-blue-600 text-2xl font-bold">{historiqueRachats.length}</p>
          <p className="text-slate-500 text-xs">{showHistorique ? "Masquer PV" : "Voir PV"}</p>
        </div>
      </div>

      {/* Historique des rachats - PV de tracabilite */}
      {showHistorique && historiqueRachats.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scale size={16} className="text-blue-600" strokeWidth={2} />
              <h2 className="text-slate-900 text-sm font-bold">Historique des Rachats (PV)</h2>
            </div>
            <span className="text-slate-400 text-[10px]">{historiqueRachats.length} rachat(s) consigne(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-slate-500 font-medium px-3 py-2">Etudiant</th>
                  <th className="text-left text-slate-500 font-medium px-3 py-2">Element / Module</th>
                  <th className="text-center text-slate-500 font-medium px-3 py-2">Avant</th>
                  <th className="text-center text-slate-500 font-medium px-3 py-2">Apres</th>
                  <th className="text-left text-slate-500 font-medium px-3 py-2">Motif (Art. 30)</th>
                  <th className="text-right text-slate-500 font-medium px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {historiqueRachats.map((r: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-100/50 hover:bg-emerald-50/20">
                    <td className="px-3 py-2 font-medium text-slate-800">{r.etudiantNom} {r.etudiantPrenom}</td>
                    <td className="px-3 py-2">
                      <p className="text-slate-700">{r.elementIntitule}</p>
                      <p className="text-slate-400 text-[9px]">{r.moduleIntitule}</p>
                    </td>
                    <td className="px-3 py-2 text-center text-red-500 font-medium">{r.noteAvantRachat != null ? r.noteAvantRachat.toFixed(2) : "—"}</td>
                    <td className="px-3 py-2 text-center text-emerald-600 font-bold">{r.noteApresRachat != null ? r.noteApresRachat.toFixed(2) : "—"}</td>
                    <td className="px-3 py-2 text-slate-600 max-w-[250px]">
                      <p className="truncate" title={r.motifRachat}>{r.motifRachat || "—"}</p>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-400">
                      {r.dateRachat ? new Date(r.dateRachat).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400">
            <Scale size={10} strokeWidth={2} />
            <span>Proces-verbal de deliberation</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Table cas limites */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-slate-700 text-xs font-medium">Cas limites (note element [10-12/20])</span>
            <span className="text-slate-400 text-[10px]">{filtered.length} resultat(s)</span>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-slate-50/90 border-b border-slate-100">
                  <th className="text-left text-slate-500 text-xs font-medium px-4 py-2.5">Etudiant</th>
                  <th className="text-left text-slate-500 text-xs font-medium px-4 py-2.5">Element</th>
                  <th className="text-center text-slate-500 text-xs font-medium px-4 py-2.5">Note</th>
                  <th className="text-center text-slate-500 text-xs font-medium px-4 py-2.5">Ecart</th>
                  <th className="text-center text-slate-500 text-xs font-medium px-4 py-2.5">Statut</th>
                  <th className="text-right text-slate-500 text-xs font-medium px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cas) => (
                  <tr key={cas.noteId} className={cn(
                    "border-b border-slate-100/80 transition-colors",
                    selectedForAI?.noteId === cas.noteId ? "bg-orange-50/40" : "hover:bg-slate-50/50"
                  )}>
                    <td className="px-4 py-2.5">
                      <p className="text-slate-800 text-xs font-medium">{cas.etudiantNom} {cas.etudiantPrenom}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-slate-700 text-[11px]">{cas.elementIntitule}</p>
                      <p className="text-slate-400 text-[9px]">{cas.moduleIntitule}</p>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-amber-600 font-bold text-xs">{cas.noteElement}/20</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-red-500 text-[10px] font-medium">-{cas.ecartValidation}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {cas.isRachete ? (
                        <span className="badge-success text-[9px]"><CheckCircle size={8} className="mr-0.5" />OK</span>
                      ) : (
                        <span className="badge-warning text-[9px]"><AlertTriangle size={8} className="mr-0.5" />Attente</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => handleAnalyseIA(cas)}
                          className="text-[9px] py-1 px-2 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100 font-medium flex items-center gap-0.5"
                        >
                          <Sparkles size={9} strokeWidth={2} />IA
                        </button>
                        {!cas.isRachete && (
                          <button
                            onClick={() => { setRachatModal(cas); setNouvelleNote("12"); }}
                            className="text-[9px] py-1 px-2 rounded-md bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100 font-medium"
                          >
                            Racheter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">Aucun cas limite</div>
          )}
        </div>

        {/* Right: AI Analysis Panel */}
        <div className="space-y-4">
          {aiLoading ? (
            <div className="card flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3 animate-pulse">
                <Sparkles size={20} className="text-purple-600" strokeWidth={1.5} />
              </div>
              <p className="text-slate-500 text-sm">Analyse IA en cours...</p>
              <p className="text-slate-400 text-[10px] mt-1">Application du reglement ENSIAS</p>
            </div>
          ) : aiAnalysis && selectedForAI ? (
            <>
              {/* Header */}
              <div className="card border-l-4 border-l-purple-400">
                <div className="flex items-center gap-2 mb-2">
                  <Bot size={16} className="text-purple-600" strokeWidth={1.5} />
                  <span className="text-slate-900 text-xs font-bold">Analyse IA - {selectedForAI.etudiantNom}</span>
                </div>
                <p className="text-slate-500 text-[10px]">{aiAnalysis.resume}</p>
              </div>

              {/* Recommandation */}
              <div className={cn("card border-2", 
                aiAnalysis.recommandation === "VALIDER" ? "border-emerald-200 bg-emerald-50/30" :
                aiAnalysis.recommandation === "RATTRAPAGE" ? "border-amber-200 bg-amber-50/30" :
                "border-red-200 bg-red-50/30"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {aiAnalysis.recommandation === "VALIDER" ? <CheckCircle size={18} className="text-emerald-600" strokeWidth={1.5} /> :
                   aiAnalysis.recommandation === "RATTRAPAGE" ? <TrendingUp size={18} className="text-amber-600" strokeWidth={1.5} /> :
                   <XCircle size={18} className="text-red-500" strokeWidth={1.5} />}
                  <span className={cn("text-sm font-bold",
                    aiAnalysis.recommandation === "VALIDER" ? "text-emerald-700" :
                    aiAnalysis.recommandation === "RATTRAPAGE" ? "text-amber-700" : "text-red-700"
                  )}>
                    {aiAnalysis.recommandation}
                  </span>
                  <span className="ml-auto text-[10px] text-slate-400">
                    Confiance : {Math.round(aiAnalysis.confiance * 100)}%
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{aiAnalysis.justification}</p>
              </div>

              {/* Elements */}
              <div className="card">
                <h4 className="text-slate-800 text-xs font-bold mb-3 flex items-center gap-1.5">
                  <Info size={12} className="text-slate-400" strokeWidth={2} />
                  Elements du module
                </h4>
                <div className="space-y-1.5">
                  {aiAnalysis.elements.map((el, idx) => (
                    <div key={idx} className={cn("flex items-center gap-2 p-2 rounded-lg text-[11px]",
                      el.statut === "OK" ? "bg-emerald-50/50" :
                      el.statut === "BLOQUE" ? "bg-red-50/50" : "bg-amber-50/50"
                    )}>
                      <div className={cn("w-5 h-5 rounded flex items-center justify-center shrink-0",
                        el.statut === "OK" ? "bg-emerald-100" :
                        el.statut === "BLOQUE" ? "bg-red-100" : "bg-amber-100"
                      )}>
                        {el.statut === "OK" ? <CheckCircle size={10} className="text-emerald-600" strokeWidth={2} /> :
                         el.statut === "BLOQUE" ? <Lock size={10} className="text-red-500" strokeWidth={2} /> :
                         <AlertTriangle size={10} className="text-amber-600" strokeWidth={2} />}
                      </div>
                      <span className="flex-1 text-slate-700 font-medium truncate">{el.nom}</span>
                      <span className={cn("font-bold",
                        el.statut === "OK" ? "text-emerald-600" :
                        el.statut === "BLOQUE" ? "text-red-500" : "text-amber-600"
                      )}>{el.note}/20</span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                        el.statut === "OK" ? "bg-emerald-100 text-emerald-700" :
                        el.statut === "BLOQUE" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      )}>{el.statut}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulation Rattrapage */}
              {aiAnalysis.elements_rattrapage.length > 0 && (
                <div className="card bg-slate-50/50">
                  <h4 className="text-slate-800 text-xs font-bold mb-2 flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-blue-600" strokeWidth={2} />
                    Simulation rattrapage
                  </h4>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-center">
                      <p className="text-red-500 text-sm font-bold">{aiAnalysis.simulation.avant}</p>
                      <p className="text-slate-400 text-[9px]">Avant</p>
                    </div>
                    <div className="flex-1 h-px bg-slate-200 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                        <ArrowUpCircle size={14} className="text-blue-500" strokeWidth={1.5} />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className={cn("text-sm font-bold", aiAnalysis.simulation.apres >= 12 ? "text-emerald-600" : "text-amber-600")}>
                        {aiAnalysis.simulation.apres}
                      </p>
                      <p className="text-slate-400 text-[9px]">Apres</p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-[10px]">
                    Elements a rattraper : {aiAnalysis.elements_rattrapage.join(", ")}
                  </p>
                  <p className="text-slate-400 text-[9px] mt-1">
                    Regle : Note Module = Max(Avant, Min(Apres, 12)) — Art. 27
                  </p>
                </div>
              )}

              {/* Proposition de motif de rachat */}
              {aiAnalysis.recommandation !== "VALIDER" && selectedForAI && !selectedForAI.isRachete && (
                <div className="card border border-purple-100 bg-purple-50/20">
                  <h4 className="text-slate-800 text-xs font-bold mb-2 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-purple-600" strokeWidth={2} />
                    Proposition de motif (IA)
                  </h4>
                  <div className="p-2.5 rounded-lg bg-white border border-purple-100 text-[11px] text-slate-700 leading-relaxed mb-3">
                    {generateMotifProposition(selectedForAI, aiAnalysis)}
                  </div>
                  <button
                    onClick={() => {
                      setRachatModal(selectedForAI);
                      setNouvelleNote("12");
                      setMotif(generateMotifProposition(selectedForAI, aiAnalysis));
                    }}
                    className="w-full btn-primary text-[10px] py-2 justify-center"
                  >
                    <ArrowUpCircle size={12} strokeWidth={1.5} />
                    Utiliser ce motif et racheter
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                <Sparkles size={24} className="text-purple-300" strokeWidth={1.5} />
              </div>
              <p className="text-slate-500 text-sm font-medium">Assistant IA</p>
              <p className="text-slate-400 text-xs mt-1 max-w-[200px]">
                Cliquez sur le bouton "IA" d'un etudiant pour obtenir une analyse detaillee avec recommandation
              </p>
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-400 text-left max-w-[220px]">
                <p className="font-medium text-slate-500 mb-1">L'IA analyse :</p>
                <p>- Notes par element</p>
                <p>- Eligibilite rattrapage (Art. 25)</p>
                <p>- Simulation note apres rattrapage</p>
                <p>- Recommandation explicable</p>
              </div>
            </div>
          )}
        </div>
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
              <p className="text-amber-700 text-xs">Note actuelle : <strong>{rachatModal.noteElement}/20</strong> (ecart de {rachatModal.ecartValidation} pts vers 12)</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-600 text-xs font-medium mb-1 block">Nouvelle note /20 (max +2 pts, Art.30)</label>
                <input type="number" min={rachatModal.noteElement} max={Math.min(rachatModal.noteElement + 2, 12)} step="0.25" value={nouvelleNote} onChange={(e) => setNouvelleNote(e.target.value)} className="input-field text-sm" />
                <p className="text-slate-400 text-[9px] mt-1">Max : {Math.min(rachatModal.noteElement + 2, 12).toFixed(2)} (Art. 30 : limite +2 pts, plafond 12)</p>
              </div>
              <div>
                <label className="text-slate-600 text-xs font-medium mb-1 block">Motif du rachat (obligatoire - Art.30)</label>
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
