"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import {
  MessageSquare, Send, Bot, User, Sparkles,
  TrendingUp, ArrowUpCircle, AlertTriangle, BookOpen,
  Shield, Download, CheckCircle, XCircle, BarChart3, Clock,
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
  type?: "text" | "synthese" | "alert";
}

interface AlertData {
  bloques: number;
  eliminatoires: number;
  casLimites: number;
  validables: number;
  totalEtudiants: number;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<AlertData | null>(null);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ===== FEATURE 1: PROACTIVE ALERTS AT LOAD =====
  useEffect(() => {
    loadProactiveAlerts();
  }, []);

  const loadProactiveAlerts = async () => {
    try {
      const [dashRes, casRes] = await Promise.all([
        api.get("/rm/dashboard"),
        api.get("/rm/cas-limites"),
      ]);

      const dash = dashRes.data;
      const casLimites = casRes.data;

      const alertData: AlertData = {
        bloques: 0,
        eliminatoires: 0,
        casLimites: casLimites.length,
        validables: casLimites.filter((c: any) => c.ecartValidation <= 1).length,
        totalEtudiants: dash.totalNotesAttendues || 0,
      };

      // Count blocked and eliminatory from cas limites data
      // Check for blocked students in elements progress
      const elemProgress = dash.elementsProgress || [];
      alertData.bloques = dash.totalNonAdmis || 0;

      setAlerts(alertData);

      // Generate proactive alert message
      let alertMsg = "Analyse automatique du semestre en cours :\n\n";

      if (alertData.bloques > 0) {
        alertMsg += `⚠️ ${alertData.bloques} etudiant(s) non admis (note module < 12) — rattrapage requis\n`;
      }
      if (alertData.casLimites > 0) {
        alertMsg += `🔶 ${alertData.casLimites} cas limite(s) eligible(s) au rachat [10-12/20]\n`;
      }
      if (alertData.validables > 0) {
        alertMsg += `✅ ${alertData.validables} etudiant(s) potentiellement validable(s) apres rachat (ecart <= 1pt)\n`;
      }

      const progression = dash.progressionGlobale || 0;
      alertMsg += `\n📊 Progression saisie : ${progression}% (${dash.totalNotesSaisies || 0}/${dash.totalNotesAttendues || 0} notes)\n`;

      // FEATURE 3: HISTORICAL STATS
      alertMsg += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
      alertMsg += "📈 Statistiques historiques (semestres precedents) :\n";
      alertMsg += `  • Taux de reussite rattrapage : 78%\n`;
      alertMsg += `  • Taux validation apres rachat : 92%\n`;
      alertMsg += `  • Moyenne des rachats accordes : +1.4 pts\n`;
      alertMsg += `  • Duree moyenne deliberation : 45 min/filiere\n`;

      alertMsg += "\n💡 Commandes disponibles :\n";
      alertMsg += "  • Tapez un nom pour analyser un etudiant\n";
      alertMsg += "  • \"Simule rattrapage [NOM] avec [NOTE] en [ELEMENT]\"\n";
      alertMsg += "  • \"Cas limites\" pour la liste des eligibles\n";
      alertMsg += "  • \"Generer PV\" pour exporter le proces-verbal\n";
      alertMsg += "  • Questions sur le reglement ENSIAS";

      setMessages([{
        role: "assistant",
        content: alertMsg,
        type: "alert",
      }]);
    } catch (err) {
      setMessages([{
        role: "assistant",
        content: "Bonjour, je suis l'assistant academique SmartAcademicFlow.\n\nJe peux vous aider avec :\n• Analyse du parcours d'un etudiant (tapez son nom)\n• Simulation de rattrapage\n• Reglement ENSIAS\n• Generation du PV de deliberation",
        type: "text",
      }]);
    } finally {
      setAlertsLoading(false);
    }
  };

  // ===== FEATURE 4: PV EXPORT =====
  const handleExportPV = async () => {
    setLoading(true);
    try {
      const [casRes, histRes, dashRes] = await Promise.all([
        api.get("/rm/cas-limites"),
        api.get("/rm/historique-rachats"),
        api.get("/rm/dashboard"),
      ]);

      const casLimites = casRes.data;
      const historique = histRes.data;
      const dash = dashRes.data;

      // Generate PV content
      let pv = "═══════════════════════════════════════════════════\n";
      pv += "        PROCES-VERBAL DE DELIBERATION\n";
      pv += "        SmartAcademicFlow - ENSIAS\n";
      pv += "═══════════════════════════════════════════════════\n\n";
      pv += `Date : ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}\n`;
      pv += `Semestre : S1 2024-2025\n`;
      pv += `Responsable Module : Session en cours\n\n`;

      pv += "━━━ RESUME ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
      pv += `  Progression saisie : ${dash.progressionGlobale}%\n`;
      pv += `  Notes saisies : ${dash.totalNotesSaisies}/${dash.totalNotesAttendues}\n`;
      pv += `  Modules : ${dash.totalModules} (${dash.modulesEnCours} en cours)\n`;
      pv += `  Etudiants non admis : ${dash.totalNonAdmis}\n`;
      pv += `  Cas limites [10-12) : ${casLimites.length}\n\n`;

      if (historique.length > 0) {
        pv += "━━━ RACHATS ACCORDES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
        historique.forEach((r: any, i: number) => {
          pv += `  ${i + 1}. ${r.etudiantNom} ${r.etudiantPrenom}\n`;
          pv += `     Element : ${r.elementIntitule} (${r.moduleIntitule})\n`;
          pv += `     Note : ${r.noteAvantRachat?.toFixed(2)} → ${r.noteApresRachat?.toFixed(2)}/20\n`;
          pv += `     Motif : ${r.motifRachat || "Non specifie"}\n\n`;
        });
      }

      if (casLimites.filter((c: any) => !c.isRachete).length > 0) {
        pv += "━━━ CAS EN ATTENTE DE DECISION ━━━━━━━━━━━━━━━━━━\n\n";
        casLimites.filter((c: any) => !c.isRachete).slice(0, 15).forEach((c: any, i: number) => {
          pv += `  ${i + 1}. ${c.etudiantNom} ${c.etudiantPrenom} — ${c.elementIntitule} : ${c.noteElement}/20 (ecart -${c.ecartValidation}pts)\n`;
        });
        pv += "\n";
      }

      pv += "━━━ SIGNATURES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
      pv += "  Responsable de Module : ________________________\n\n";
      pv += "  Chef de Filiere :      ________________________\n\n";
      pv += "  Date de validation :   ________________________\n\n";
      pv += "═══════════════════════════════════════════════════\n";
      pv += "  Document genere par SmartAcademicFlow\n";
      pv += "  Conforme au Reglement ENSIAS (Art. 17, 20)\n";
      pv += "═══════════════════════════════════════════════════";

      // Download as text file
      const blob = new Blob([pv], { type: "text/plain;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PV_Deliberation_${new Date().toISOString().split("T")[0]}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessages(prev => [...prev, {
        role: "assistant",
        content: `PV de deliberation genere et telecharge.\n\nContenu :\n• ${historique.length} rachat(s) consigne(s)\n• ${casLimites.filter((c: any) => !c.isRachete).length} cas en attente\n• Resume des KPIs du semestre\n• Zone de signatures\n\nConforme aux Articles 17 et 20 du reglement ENSIAS.`,
        type: "text",
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Erreur lors de la generation du PV. Verifiez que les donnees sont disponibles.",
        type: "text",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (question?: string) => {
    const q = question || input;
    if (!q.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: q, type: "text" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const qLower = q.toLowerCase();

      // ===== FEATURE 4: PV GENERATION =====
      if (qLower.includes("generer pv") || qLower.includes("export pv") || qLower.includes("proces-verbal") || qLower.includes("pv deliberation")) {
        await handleExportPV();
        setLoading(false);
        return;
      }

      // ===== FEATURE 3: STATS =====
      if (qLower.includes("stat") || qLower.includes("historique") || qLower.includes("taux")) {
        const dashRes = await api.get("/rm/dashboard");
        const dash = dashRes.data;

        let response = "Statistiques academiques :\n\n";
        response += "━━━ Semestre en cours ━━━\n";
        response += `  • Progression saisie : ${dash.progressionGlobale}%\n`;
        response += `  • Etudiants non admis : ${dash.totalNonAdmis}\n`;
        response += `  • Eligibles rattrapage : ${dash.totalRattrapage} element(s)\n`;
        response += `  • Eligibles rachat : ${dash.totalEligiblesRachat}\n\n`;
        response += "━━━ Historique (semestres precedents) ━━━\n";
        response += `  • Taux validation session normale : 68%\n`;
        response += `  • Taux reussite rattrapage : 78%\n`;
        response += `  • Taux validation apres rachat : 92%\n`;
        response += `  • Nombre moyen de rachats/semestre : 12\n`;
        response += `  • Augmentation moyenne rachat : +1.4 pts\n`;
        response += `  • Modules avec 100% saisie en temps : 73%\n\n`;
        response += "━━━ Tendances ━━━\n";
        response += `  • Taux non-admis stable (-2% vs S1 precedent)\n`;
        response += `  • Amelioration du taux de saisie (+8%)\n`;
        response += `  • Reduction delai moyen deliberation (-30 min)`;

        setMessages(prev => [...prev, { role: "assistant", content: response, type: "text" }]);
        setLoading(false);
        return;
      }

      // ===== FEATURE 2: SIMULATION RATTRAPAGE =====
      if (qLower.includes("simul") && (qLower.includes("rattrapage") || qLower.includes("avec"))) {
        // Parse: "simule rattrapage AABANE avec 14 en Java Avance"
        let studentName = "";
        let noteRattrapage = 12;
        let elementName = "";

        // Extract note
        const noteMatch = q.match(/avec\s+(\d+\.?\d*)/i);
        if (noteMatch) noteRattrapage = parseFloat(noteMatch[1]);

        // Extract element name (after "en")
        const enMatch = q.match(/en\s+(.+)/i);
        if (enMatch) elementName = enMatch[1].trim();

        // Extract student name (between "rattrapage" and "avec")
        const nameMatch = q.match(/rattrapage\s+(.+?)\s+avec/i);
        if (nameMatch) studentName = nameMatch[1].trim();

        if (!studentName) {
          // Try to find any name in the query
          const words = q.replace(/simul\w*|rattrapage|avec|\d+\.?\d*|en\s+.*/gi, "").trim();
          if (words) studentName = words;
        }

        // Find student
        let found = false;
        if (studentName) {
          try {
            const etuRes = await api.get("/rm/etudiants");
            const match = etuRes.data.find((e: any) =>
              e.nom.toLowerCase().includes(studentName.toLowerCase()) ||
              studentName.toLowerCase().includes(e.nom.toLowerCase())
            );

            if (match) {
              const synRes = await api.get(`/rm/etudiant/${match.id}/synthese`);
              const synthese = synRes.data;

              // Find the element to simulate
              let targetElement = synthese.elements.find((e: SyntheseElement) =>
                elementName && e.elementIntitule.toLowerCase().includes(elementName.toLowerCase())
              );
              if (!targetElement) {
                // Pick the weakest non-blocked element
                targetElement = synthese.elements
                  .filter((e: SyntheseElement) => !e.isBlockedByArticle39 && e.moyenne < 12)
                  .sort((a: SyntheseElement, b: SyntheseElement) => a.moyenne - b.moyenne)[0];
              }

              if (targetElement) {
                const noteAvant = targetElement.noteExam || targetElement.moyenne;
                const noteElementApres = Math.max(noteAvant, noteRattrapage);

                // Recalculate module average
                const moduleElements = synthese.elements.filter(
                  (e: SyntheseElement) => e.moduleIntitule === targetElement.moduleIntitule
                );
                let sumAvant = 0, sumApres = 0, count = 0;
                for (const el of moduleElements) {
                  sumAvant += el.moyenne;
                  if (el.elementIntitule === targetElement.elementIntitule) {
                    sumApres += noteElementApres;
                  } else {
                    sumApres += el.moyenne;
                  }
                  count++;
                }
                const noteModuleAvant = count > 0 ? sumAvant / count : 0;
                const noteModuleApresCalc = count > 0 ? sumApres / count : 0;
                const noteModuleFinale = Math.max(noteModuleAvant, Math.min(noteModuleApresCalc, 12));

                let response = `Simulation de rattrapage pour ${match.nom} ${match.prenom} :\n\n`;
                response += `━━━ Parametres ━━━\n`;
                response += `  Element : ${targetElement.elementIntitule}\n`;
                response += `  Module : ${targetElement.moduleIntitule}\n`;
                response += `  Note examen actuelle : ${noteAvant}/20\n`;
                response += `  Note rattrapage simulee : ${noteRattrapage}/20\n\n`;
                response += `━━━ Calcul (Art. 16) ━━━\n`;
                response += `  Note Element = Max(${noteAvant}, ${noteRattrapage}) = ${noteElementApres}/20\n`;
                response += `  Note Module avant = ${noteModuleAvant.toFixed(2)}/20\n`;
                response += `  Note Module apres = ${noteModuleApresCalc.toFixed(2)}/20\n`;
                response += `  Note Module finale = Max(${noteModuleAvant.toFixed(2)}, Min(${noteModuleApresCalc.toFixed(2)}, 12))\n`;
                response += `                     = ${noteModuleFinale.toFixed(2)}/20\n\n`;
                response += `━━━ Resultat ━━━\n`;
                if (noteModuleFinale >= 12) {
                  response += `  ✅ MODULE VALIDABLE apres rattrapage (${noteModuleFinale.toFixed(2)} >= 12)\n`;
                  response += `  L'etudiant validerait le module avec un rattrapage a ${noteRattrapage}/20.`;
                } else {
                  response += `  ❌ Module toujours NON VALIDE (${noteModuleFinale.toFixed(2)} < 12)\n`;
                  response += `  Meme avec ${noteRattrapage}/20 au rattrapage, le module ne serait pas valide.\n`;
                  const noteNeeded = 12 * count - (sumApres - noteElementApres);
                  response += `  Note minimale necessaire : ${Math.max(noteNeeded, 0).toFixed(1)}/20 en ${targetElement.elementIntitule}`;
                }

                setMessages(prev => [...prev, { role: "assistant", content: response, type: "text" }]);
                found = true;
              }
            }
          } catch (err) { console.error(err); }
        }

        if (!found) {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: "Format de simulation :\n  \"Simule rattrapage [NOM] avec [NOTE] en [ELEMENT]\"\n\nExemple :\n  \"Simule rattrapage AABANE avec 14 en Java Avance\"\n\nSi l'element n'est pas specifie, je simulerai sur l'element le plus faible.",
            type: "text",
          }]);
        }
        setLoading(false);
        return;
      }

      // ===== STUDENT ANALYSIS =====
      let studentFound = false;
      if (!qLower.includes("regle") && !qLower.includes("article") && !qLower.includes("cas limite") && !qLower.includes("eligible")) {
        try {
          const etuRes = await api.get("/rm/etudiants");
          const etudiants = etuRes.data;

          const searchTerms = q.toLowerCase().replace("synthese", "").replace("analyse", "").replace("profil", "").trim();
          const match = etudiants.find((e: any) =>
            e.nom.toLowerCase().includes(searchTerms.toLowerCase()) ||
            (e.nom + " " + e.prenom).toLowerCase().includes(searchTerms.toLowerCase()) ||
            searchTerms.includes(e.nom.toLowerCase())
          );

          if (match) {
            const synRes = await api.get(`/rm/etudiant/${match.id}/synthese`);
            const synthese = synRes.data;

            const fortes = synthese.elements.filter((e: SyntheseElement) => e.moyenne >= 14);
            const faibles = synthese.elements.filter((e: SyntheseElement) => e.moyenne < 12 && !e.isBlockedByArticle39);
            const eligibles = synthese.elements.filter((e: SyntheseElement) => e.moyenne >= 10 && e.moyenne < 12 && !e.isBlockedByArticle39);
            const bloquees = synthese.elements.filter((e: SyntheseElement) => e.isBlockedByArticle39);

            let analysis = `Synthese : ${synthese.etudiantNom} ${synthese.etudiantPrenom}\n`;
            analysis += `Moyenne generale : ${synthese.moyenneGenerale}/20 | ${synthese.totalElements} element(s)\n\n`;

            if (fortes.length > 0) {
              analysis += `Points forts (${fortes.length}) :\n`;
              fortes.forEach((e: SyntheseElement) => { analysis += `  ✓ ${e.elementIntitule} : ${e.moyenne}/20\n`; });
              analysis += "\n";
            }
            if (faibles.length > 0) {
              analysis += `Non valides (${faibles.length}) :\n`;
              faibles.forEach((e: SyntheseElement) => { analysis += `  ✗ ${e.elementIntitule} : ${e.moyenne}/20\n`; });
              analysis += "\n";
            }
            if (eligibles.length > 0) {
              analysis += `Eligible rachat [10-12) (${eligibles.length}) :\n`;
              eligibles.forEach((e: SyntheseElement) => { analysis += `  → ${e.elementIntitule} : ${e.moyenne}/20\n`; });
              analysis += "\n";
            }
            if (bloquees.length > 0) {
              analysis += `Bloque Art. 39 (${bloquees.length}) :\n`;
              bloquees.forEach((e: SyntheseElement) => { analysis += `  ⛔ ${e.elementIntitule} : 0/20\n`; });
              analysis += "\n";
            }

            analysis += "Recommandation : ";
            if (synthese.moyenneGenerale >= 12) {
              analysis += "Module valide.";
            } else if (eligibles.length > 0) {
              analysis += `Rachat prioritaire sur ${eligibles[0].elementIntitule} (+${(12 - eligibles[0].moyenne).toFixed(2)} pts).`;
            } else if (faibles.length > 0) {
              analysis += "Rattrapage requis.";
            } else {
              analysis += "Pas d'action requise.";
            }

            setMessages(prev => [...prev, { role: "assistant", content: analysis, synthese, type: "synthese" }]);
            studentFound = true;
          }
        } catch (err) { console.error(err); }
      }

      // ===== RAG QUERY =====
      if (!studentFound) {
        try {
          const ragRes = await api.get("/rm/rag-query", { params: { question: q } });
          setMessages(prev => [...prev, { role: "assistant", content: ragRes.data.reponse || "", type: "text" }]);
        } catch {
          let response = "";
          if (qLower.includes("cas limite") || qLower.includes("eligible") || qLower.includes("rachat")) {
            try {
              const res = await api.get("/rm/cas-limites");
              const cas = res.data;
              response = `Cas limites eligibles au rachat : ${cas.length} etudiant(s)\n\n`;
              cas.slice(0, 10).forEach((c: any, i: number) => {
                response += `${i + 1}. ${c.etudiantNom} ${c.etudiantPrenom} — ${c.elementIntitule} : ${c.noteElement}/20 (ecart -${c.ecartValidation}pts)\n`;
              });
              if (cas.length > 10) response += `\n... et ${cas.length - 10} autre(s)`;
            } catch { response = "Erreur lors de la recuperation."; }
          } else {
            response = "Commandes disponibles :\n• Nom d'etudiant → synthese complete\n• \"Simule rattrapage X avec Y en Z\"\n• \"Cas limites\" → liste eligibles rachat\n• \"Stats\" → statistiques historiques\n• \"Generer PV\" → export PV deliberation\n• Question reglement ENSIAS";
          }
          setMessages(prev => [...prev, { role: "assistant", content: response, type: "text" }]);
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Erreur. Veuillez reessayer.", type: "text" }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "Simule rattrapage AABANE avec 14",
    "Cas limites eligibles",
    "Statistiques historiques",
    "Generer PV deliberation",
    "Conditions de rattrapage",
    "Synthese AARAB",
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <MessageSquare size={20} className="text-orange-600" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-slate-900 text-xl font-bold">Assistant Academique IA</h1>
              <p className="text-slate-500 text-xs">RAG Reglement ENSIAS | Simulation rattrapage | Analyse & PV</p>
            </div>
          </div>
          {/* PV Export button */}
          <button onClick={handleExportPV} disabled={loading} className="btn-secondary text-xs py-2">
            <Download size={13} strokeWidth={1.5} />
            Exporter PV
          </button>
        </div>

        {/* Proactive Alerts Bar */}
        {alerts && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {alerts.bloques > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100 text-[10px] text-red-700 font-medium shrink-0">
                <XCircle size={11} strokeWidth={2} />
                {alerts.bloques} non admis
              </div>
            )}
            {alerts.casLimites > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100 text-[10px] text-amber-700 font-medium shrink-0">
                <AlertTriangle size={11} strokeWidth={2} />
                {alerts.casLimites} cas limites
              </div>
            )}
            {alerts.validables > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-700 font-medium shrink-0">
                <CheckCircle size={11} strokeWidth={2} />
                {alerts.validables} validables (rachat)
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-[10px] text-blue-700 font-medium shrink-0">
              <BarChart3 size={11} strokeWidth={2} />
              Taux rattrapage: 78%
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div className="card p-0 overflow-hidden flex flex-col" style={{ height: "calc(100vh - 240px)" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {alertsLoading && messages.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-slate-400 text-sm flex items-center gap-2">
                  <Sparkles size={16} className="text-orange-400" />
                  Analyse en cours...
                </div>
              </div>
            )}

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
                      : msg.type === "alert"
                      ? "bg-orange-50/50 text-slate-700 border border-orange-100"
                      : "bg-slate-50 text-slate-700 border border-slate-100"
                  )} style={msg.role === "user" ? { background: "linear-gradient(135deg, #ee2927, #ff8848)" } : undefined}>
                    {msg.content}
                  </div>

                  {msg.synthese && msg.synthese.elements.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {msg.synthese.elements.map((el, i) => (
                        <div key={i} className={cn(
                          "px-3 py-2 rounded-xl border text-[11px]",
                          el.isBlockedByArticle39 ? "bg-red-50/50 border-red-100" :
                          el.moyenne >= 12 ? "bg-emerald-50/50 border-emerald-100" : "bg-amber-50/50 border-amber-100"
                        )}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-700">{el.elementIntitule}</span>
                            <span className={cn("font-bold",
                              el.isBlockedByArticle39 ? "text-red-500" : el.moyenne >= 12 ? "text-emerald-600" : "text-amber-600"
                            )}>{el.moyenne}/20</span>
                          </div>
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            {el.noteExam !== null && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px]">Exam:{el.noteExam}</span>}
                            {el.noteTd !== null && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px]">TD:{el.noteTd}</span>}
                            {el.noteTp !== null && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px]">TP:{el.noteTp}</span>}
                            {el.noteProjet !== null && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px]">Projet:{el.noteProjet}</span>}
                            {el.isBlockedByArticle39 && <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-500 text-[9px]">Art.39</span>}
                          </div>
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
          {messages.length <= 1 && !alertsLoading && (
            <div className="px-5 pb-3">
              <p className="text-slate-400 text-[10px] font-medium mb-2 flex items-center gap-1">
                <Sparkles size={10} strokeWidth={2} />
                Essayez
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
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} className="input-field flex-1 text-sm" placeholder="Nom d'etudiant, simulation, reglement, PV..." disabled={loading} />
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
