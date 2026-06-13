"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import {
  MessageSquare, Send, Bot, User, Sparkles,
  TrendingUp, TrendingDown, ArrowUpCircle, AlertTriangle, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SyntheseElement {
  elementIntitule: string; moduleIntitule: string; semestre: string;
  noteExam: number | null; noteTd: number | null; noteTp: number | null;
  noteProjet: number | null; moyenne: number; isBlockedByArticle39: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  synthese?: {
    etudiantNom: string; etudiantPrenom: string;
    moyenneGenerale: number; totalElements: number;
    elements: SyntheseElement[];
  };
  type?: "text" | "synthese" | "analysis";
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Bonjour, je suis l'assistant academique SmartAcademicFlow.\n\nJe peux vous aider avec :\n• Analyse du parcours d'un etudiant (tapez son nom)\n• Reglement ENSIAS : rattrapage, rachat, absences, validation\n• Cas limites eligibles au rachat\n• Simulation de rattrapage\n\nBasé sur le Reglement Interieur ENSIAS (Cycle Ingenieur 2021).",
      type: "text",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const suggestedQuestions = [
    "Conditions de rattrapage",
    "Regles de rachat",
    "Absence injustifiee",
    "Synthese AABANE",
    "Cas limites eligibles",
    "Validation module",
  ];

  const handleSend = async (question?: string) => {
    const q = question || input;
    if (!q.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: q, type: "text" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Check if query is about a specific student
      const words = q.trim().split(/\s+/);
      let studentFound = false;

      // Try to find student by name
      if (words.length >= 1 && !q.toLowerCase().includes("regle") && !q.toLowerCase().includes("article")) {
        try {
          const etuRes = await api.get("/rm/etudiants");
          const etudiants = etuRes.data;

          // Search by name match
          const searchTerms = q.toLowerCase().replace("synthese", "").replace("analyse", "").replace("profil", "").trim();
          const match = etudiants.find((e: any) =>
            e.nom.toLowerCase().includes(searchTerms.toLowerCase()) ||
            (e.nom + " " + e.prenom).toLowerCase().includes(searchTerms.toLowerCase()) ||
            searchTerms.includes(e.nom.toLowerCase())
          );

          if (match) {
            const synRes = await api.get(`/rm/etudiant/${match.id}/synthese`);
            const synthese = synRes.data;

            // Build analysis
            const fortes = synthese.elements.filter((e: SyntheseElement) => e.moyenne >= 14);
            const faibles = synthese.elements.filter((e: SyntheseElement) => e.moyenne < 12 && !e.isBlockedByArticle39);
            const eligibles = synthese.elements.filter((e: SyntheseElement) => e.moyenne >= 10 && e.moyenne < 12 && !e.isBlockedByArticle39);
            const bloquees = synthese.elements.filter((e: SyntheseElement) => e.isBlockedByArticle39);

            let analysis = `**Synthese academique : ${synthese.etudiantNom} ${synthese.etudiantPrenom}**\n`;
            analysis += `Moyenne generale : ${synthese.moyenneGenerale}/20 | ${synthese.totalElements} element(s) evalue(s)\n\n`;

            if (fortes.length > 0) {
              analysis += `Points forts (${fortes.length}) :\n`;
              fortes.forEach((e: SyntheseElement) => { analysis += `  ✓ ${e.elementIntitule} : ${e.moyenne}/20\n`; });
              analysis += "\n";
            }

            if (faibles.length > 0) {
              analysis += `Non valides - Rattrapage (${faibles.length}) :\n`;
              faibles.forEach((e: SyntheseElement) => { analysis += `  ✗ ${e.elementIntitule} : ${e.moyenne}/20 (ecart ${(12 - e.moyenne).toFixed(2)} pts)\n`; });
              analysis += "\n";
            }

            if (eligibles.length > 0) {
              analysis += `Eligible au rachat [10-12) (${eligibles.length}) :\n`;
              eligibles.forEach((e: SyntheseElement) => { analysis += `  → ${e.elementIntitule} : ${e.moyenne}/20 (ecart ${(12 - e.moyenne).toFixed(2)} pts vers 12)\n`; });
              analysis += "\n";
            }

            if (bloquees.length > 0) {
              analysis += `Blocage Article 35 (${bloquees.length}) :\n`;
              bloquees.forEach((e: SyntheseElement) => { analysis += `  ⛔ ${e.elementIntitule} : 0/20 (absence injustifiee)\n`; });
              analysis += "\n";
            }

            analysis += "Recommandation : ";
            if (synthese.moyenneGenerale >= 12) {
              analysis += "Module valide — etudiant admis.";
            } else if (eligibles.length > 0) {
              analysis += `Rachat prioritaire sur ${eligibles[0].elementIntitule} (+${(12 - eligibles[0].moyenne).toFixed(2)} pts pour atteindre 12).`;
            } else if (faibles.length > 0) {
              analysis += "Rattrapage requis dans les elements non valides (note < 12).";
            } else {
              analysis += "Pas d'action requise.";
            }

            setMessages(prev => [...prev, {
              role: "assistant",
              content: analysis,
              synthese: synthese,
              type: "synthese",
            }]);
            studentFound = true;
          }
        } catch (err) { console.error(err); }
      }

      // If not a student query, handle as general question via RAG
      if (!studentFound) {
        try {
          // Call RAG service for academic questions
          const ragRes = await api.get("/rm/rag-query", { params: { question: q } });
          const ragData = ragRes.data;

          let response = ragData.reponse + "\n";
          if (ragData.sources && ragData.sources.length > 0) {
            response += "\n---\n📚 Sources :\n";
            ragData.sources.forEach((s: any) => {
              response += `• ${s.article}${s.page ? " (p." + s.page + ")" : ""}\n`;
            });
            response += `\n🎯 Confiance : ${Math.round(ragData.confiance * 100)}%`;
          }

          setMessages(prev => [...prev, { role: "assistant", content: response, type: "text" }]);
        } catch {
          // Fallback: handle locally
          let response = "";
          const qLower = q.toLowerCase();

          if (qLower.includes("cas limite") || qLower.includes("eligible") || qLower.includes("rachat")) {
            try {
              const res = await api.get("/rm/cas-limites");
              const cas = res.data;
              response = `**Cas limites eligibles au rachat : ${cas.length} etudiant(s)**\n\n`;
              if (cas.length > 0) {
                const top10 = cas.slice(0, 10);
                top10.forEach((c: any, i: number) => {
                  response += `${i + 1}. ${c.etudiantNom} ${c.etudiantPrenom} - ${c.elementIntitule} : ${c.noteElement}/20 (ecart -${c.ecartValidation} pts vers 12)\n`;
                });
                if (cas.length > 10) response += `\n... et ${cas.length - 10} autre(s)\n`;
                response += "\nCritere : note element entre 10 et 12/20 (Art. 30).\nRachat max : +2 pts, motif obligatoire (Art. 30).";
              } else {
                response = "Aucun cas limite actuellement.";
              }
            } catch { response = "Erreur lors de la recuperation des cas limites."; }
          } else {
            response = "Je n'ai pas trouve d'etudiant correspondant a votre recherche.\n\nEssayez :\n- Un nom d'etudiant (ex: \"AABANE\", \"BARKANI\")\n- \"Cas limites\" pour voir les eligibles au rachat\n- \"Rattrapage\" pour les conditions de rattrapage\n- \"Rachat\" pour les regles de rachat\n- \"Absence\" pour les regles d'absence\n- \"Validation\" pour les seuils";
          }

          setMessages(prev => [...prev, { role: "assistant", content: response, type: "text" }]);
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Erreur lors de l'analyse. Veuillez reessayer.", type: "text" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <MessageSquare size={20} className="text-orange-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-slate-900 text-xl font-bold">Assistant Academique IA</h1>
            <p className="text-slate-500 text-xs">RAG Reglement ENSIAS | Analyse etudiants | Aide a la deliberation</p>
          </div>
        </div>

        {/* Chat Container */}
        <div className="card p-0 overflow-hidden flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "")}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={16} className="text-orange-600" strokeWidth={1.5} />
                  </div>
                )}
                <div className={cn("max-w-[80%]", msg.role === "user" && "order-first")}>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                    msg.role === "user"
                      ? "text-white ml-auto"
                      : "bg-slate-50 text-slate-700 border border-slate-100"
                  )} style={msg.role === "user" ? { background: "linear-gradient(135deg, #ee2927, #ff8848)" } : undefined}>
                    {msg.content}
                  </div>

                  {/* Synthese cards */}
                  {msg.synthese && msg.synthese.elements.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {msg.synthese.elements.map((el, i) => (
                        <div key={i} className={cn(
                          "px-3 py-2 rounded-xl border text-[11px]",
                          el.isBlockedByArticle39 ? "bg-red-50/50 border-red-100" :
                          el.moyenne >= 10 ? "bg-emerald-50/50 border-emerald-100" : "bg-amber-50/50 border-amber-100"
                        )}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-700">{el.elementIntitule}</span>
                            <span className={cn("font-bold",
                              el.isBlockedByArticle39 ? "text-red-500" : el.moyenne >= 10 ? "text-emerald-600" : "text-amber-600"
                            )}>{el.moyenne}/20</span>
                          </div>
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            {el.noteExam !== null && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px]">Exam:{el.noteExam}</span>}
                            {el.noteTd !== null && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px]">TD:{el.noteTd}</span>}
                            {el.noteTp !== null && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px]">TP:{el.noteTp}</span>}
                            {el.noteProjet !== null && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px]">Projet:{el.noteProjet}</span>}
                            {el.isBlockedByArticle39 && <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-500 text-[9px]">Art.39</span>}
                          </div>
                          <p className="text-slate-400 text-[9px] mt-0.5">{el.moduleIntitule} | {el.semestre}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg, #ee2927, #ff8848)" }}>
                    <User size={16} className="text-white" strokeWidth={1.5} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Bot size={16} className="text-orange-600" strokeWidth={1.5} />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-orange-300 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-orange-300 animate-bounce [animation-delay:0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-orange-300 animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="px-5 pb-3">
              <p className="text-slate-400 text-[10px] font-medium mb-2 flex items-center gap-1">
                <BookOpen size={10} strokeWidth={2} />
                Suggestions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedQuestions.map((q, idx) => (
                  <button key={idx} onClick={() => handleSend(q)} className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-600 text-[11px] transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-slate-100">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-3">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} className="input-field flex-1 text-sm" placeholder="Tapez un nom d'etudiant ou posez une question..." disabled={loading} />
              <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-4">
                <Send size={16} strokeWidth={1.5} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
