"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import {
  BookOpen, Users, TrendingUp, Clock, CheckCircle,
  AlertTriangle, BarChart3, Bell, ArrowRight, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ElementData {
  id: number; intitule: string; filiereCode: string; semestre: string;
  moduleIntitule: string; hasTd: boolean; hasTp: boolean; hasProjet: boolean;
}

interface RMDashboard {
  totalModules: number; modulesEnCours: number; modulesClotures: number;
  totalNotesSaisies: number; totalNotesAttendues: number;
  progressionGlobale: number; totalNonAdmis: number;
  totalRattrapage: number; totalEligiblesRachat: number;
  elementsProgress: any[];
}

interface CFDashboard {
  totalFilieres: number; totalModules: number;
  modulesEnCours: number; modulesTransmisCF: number;
  modulesTransmisSCO: number; modulesClotures: number;
  totalNotesSaisies: number; totalNotesAttendues: number;
  progressionGlobale: number; totalEtudiants: number;
  filieres: any[];
}

interface SCODashboard {
  modulesRecus: number; modulesClotures: number;
  totalModules: number; certificatsEnAttente: number;
  totalAbsences: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // ENS state
  const [elements, setElements] = useState<ElementData[]>([]);
  const [ensStats, setEnsStats] = useState({ totalElements: 0, notesCount: 0, progression: 0 });

  // RM state
  const [rmData, setRmData] = useState<RMDashboard | null>(null);

  // CF state
  const [cfData, setCfData] = useState<CFDashboard | null>(null);

  // SCO state
  const [scoData, setScoData] = useState<SCODashboard | null>(null);

  // ENS extra state
  const [elementProgress, setElementProgress] = useState<any[]>([]);
  const [relancesCount, setRelancesCount] = useState(0);

  // Filtre annee/semestre (shared across roles)
  const [selectedYear, setSelectedYear] = useState<string>("all");

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    if (user.role === "ENS") {
      fetchEnsData();
    } else if (user.role === "RM") {
      fetchRMData();
    } else if (user.role === "CF") {
      fetchCFData();
    } else if (user.role === "SCO") {
      fetchSCOData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchEnsData = async () => {
    try {
      const res = await api.get("/enseignant/mes-elements");
      const elems: ElementData[] = res.data;
      setElements(elems);

      let totalNotes = 0;
      let totalExpected = 0;
      for (const el of elems) {
        try {
          const filierePrefix = el.filiereCode.toLowerCase().replace(/&/g, "").replace(/\s/g, "");
          const [notesRes, etusRes] = await Promise.all([
            api.get(`/enseignant/notes/element/${el.id}?type=EXAM`),
            api.get(`/enseignant/etudiants?filiere=${encodeURIComponent(filierePrefix)}`),
          ]);
          totalNotes += notesRes.data.length;
          totalExpected += etusRes.data.length;
        } catch {}
      }
      const prog = totalExpected > 0 ? Math.round((totalNotes / totalExpected) * 100) : 0;
      setEnsStats({ totalElements: elems.length, notesCount: totalNotes, progression: prog });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchRMData = async () => {
    try {
      const res = await api.get("/rm/dashboard");
      setRmData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchCFData = async () => {
    try {
      const res = await api.get("/cf/dashboard");
      setCfData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSCOData = async () => {
    try {
      const res = await api.get("/scolarite/dashboard");
      setScoData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Load ENS progression details after elements are fetched
  useEffect(() => {
    if (user?.role === "ENS" && elements.length > 0 && !loading) {
      loadEnsDetails();
    }
  }, [elements, loading]);

  const loadEnsDetails = async () => {
    try {
      const progressData: any[] = [];
      for (const el of elements) {
        try {
          const filierePrefix = el.filiereCode.toLowerCase().replace(/&/g, "").replace(/\s/g, "");
          const [notesRes, etusRes] = await Promise.all([
            api.get(`/enseignant/notes/element/${el.id}?type=EXAM`),
            api.get(`/enseignant/etudiants?filiere=${encodeURIComponent(filierePrefix)}`),
          ]);
          const prog = etusRes.data.length > 0 ? Math.round((notesRes.data.length / etusRes.data.length) * 100) : 0;
          progressData.push({
            ...el,
            notesSaisies: notesRes.data.length,
            totalEtudiants: etusRes.data.length,
            progression: prog,
          });
        } catch {
          progressData.push({ ...el, notesSaisies: 0, totalEtudiants: 0, progression: 0 });
        }
      }
      setElementProgress(progressData);
      try {
        const relRes = await api.get("/enseignant/relances/non-lues/count");
        setRelancesCount(relRes.data.count || 0);
      } catch {}
    } catch {}
  };

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-pulse text-slate-400">Chargement...</div></div></DashboardLayout>;
  }

  // ===================== RM DASHBOARD =====================
  if (user?.role === "RM" && rmData) {
    const circumference = 2 * Math.PI * 54;
    const progressOffset = circumference - (rmData.progressionGlobale / 100) * circumference;

    const yearFilter = (semestre: string) => {
      if (selectedYear === "all") return true;
      if (selectedYear === "1A") return semestre === "S1" || semestre === "S2";
      if (selectedYear === "2A") return semestre === "S3" || semestre === "S4";
      if (selectedYear === "3A") return semestre === "S5" || semestre === "S6";
      return true;
    };
    const filteredElements = rmData.elementsProgress.filter((e: any) => yearFilter(e.semestre));
    const enRetard = filteredElements.filter((e: any) => e.progression < 80);

    return (
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-slate-900 text-2xl font-bold">Bonjour, {user.prenom}</h1>
          <p className="text-slate-500 text-sm mt-1">Tableau de bord - Responsable de Module</p>
        </div>

        {/* Filtre Annee */}
        <div className="flex gap-1 mb-4 p-1 bg-slate-100 rounded-xl w-fit">
          {[
            { value: "all", label: "Toutes" },
            { value: "1A", label: "1A (S1-S2)" },
            { value: "2A", label: "2A (S3-S4)" },
            { value: "3A", label: "3A (S5-S6)" },
          ].map(opt => (
            <button key={opt.value} onClick={() => setSelectedYear(opt.value)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                selectedYear === opt.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-4 mb-6">
          {/* Jauge circulaire */}
          <div className="col-span-12 md:col-span-4 card flex flex-col items-center justify-center py-8">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle cx="60" cy="60" r="54" fill="none" stroke="url(#gaugeGrad)" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={progressOffset}
                  className="transition-all duration-1000" />
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ee2927" />
                    <stop offset="100%" stopColor="#ff8848" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900">{rmData.progressionGlobale}%</span>
                <span className="text-[10px] text-slate-400">avancement</span>
              </div>
            </div>
            <p className="text-slate-600 text-xs font-medium mt-3">Progression globale</p>
            <p className="text-slate-400 text-[10px]">{rmData.totalNotesSaisies} / {rmData.totalNotesAttendues} notes</p>
          </div>

          {/* KPIs droite */}
          <div className="col-span-12 md:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card py-5 text-center">
              <BookOpen size={18} className="text-blue-600 mx-auto mb-1" strokeWidth={1.5} />
              <p className="text-slate-900 text-2xl font-bold">{rmData.totalModules}</p>
              <p className="text-slate-400 text-[10px]">Modules ({rmData.modulesEnCours} actifs)</p>
            </div>
            <div className="card py-5 text-center">
              <AlertTriangle size={18} className="text-red-500 mx-auto mb-1" strokeWidth={1.5} />
              <p className="text-red-600 text-2xl font-bold">{rmData.totalNonAdmis}</p>
              <p className="text-slate-400 text-[10px]">Non admis (module&lt;12)</p>
            </div>
            <div className="card py-5 text-center">
              <Clock size={18} className="text-amber-600 mx-auto mb-1" strokeWidth={1.5} />
              <p className="text-amber-600 text-2xl font-bold">{rmData.totalRattrapage}</p>
              <p className="text-slate-400 text-[10px]">Elements a rattraper</p>
            </div>
            <div className="card py-5 text-center">
              <TrendingUp size={18} className="text-orange-600 mx-auto mb-1" strokeWidth={1.5} />
              <p className="text-orange-600 text-2xl font-bold">{rmData.totalEligiblesRachat}</p>
              <p className="text-slate-400 text-[10px]">Eligibles rachat (10-12)</p>
            </div>

            {/* Alertes */}
            <div className="col-span-2 lg:col-span-4 card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell size={14} className="text-orange-600" strokeWidth={2} />
                <span className="text-slate-800 text-xs font-bold">Alertes</span>
              </div>
              <div className="space-y-2">
                {enRetard.length > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
                    <AlertTriangle size={12} className="text-red-500 shrink-0" strokeWidth={2} />
                    <span className="text-red-700 text-[11px] font-medium">{enRetard.length} enseignant(s) en retard de saisie</span>
                  </div>
                )}
                {rmData.totalEligiblesRachat > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                    <Clock size={12} className="text-amber-600 shrink-0" strokeWidth={2} />
                    <span className="text-amber-700 text-[11px] font-medium">{rmData.totalEligiblesRachat} etudiant(s) eligible(s) au rachat (note [10-12))</span>
                    <ArrowRight size={11} className="text-amber-400 ml-auto" strokeWidth={2} />
                  </div>
                )}
                {rmData.totalNonAdmis > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <Users size={12} className="text-slate-500 shrink-0" strokeWidth={2} />
                    <span className="text-slate-600 text-[11px] font-medium">{rmData.totalNonAdmis} etudiant(s) non admis (module &lt;12) - rattrapage</span>
                  </div>
                )}
                {enRetard.length === 0 && rmData.totalEligiblesRachat === 0 && rmData.totalNonAdmis === 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                    <CheckCircle size={12} className="text-emerald-600 shrink-0" strokeWidth={2} />
                    <span className="text-emerald-700 text-[11px] font-medium">Tout est en ordre</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Avancement par element */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-slate-900 text-sm font-bold">Avancement saisie par element</h2>
            <span className="text-slate-400 text-[10px]">{filteredElements.length} element(s)</span>
          </div>
          <div className="space-y-2.5">
            {filteredElements.map((el: any) => (
              <div key={el.elementId} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  el.progression >= 100 ? "bg-emerald-50" : el.progression < 50 ? "bg-red-50" : "bg-orange-50"
                )}>
                  {el.progression >= 100
                    ? <CheckCircle size={14} className="text-emerald-600" strokeWidth={2} />
                    : <BarChart3 size={14} className={el.progression < 50 ? "text-red-500" : "text-orange-600"} strokeWidth={2} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-slate-800 text-xs font-medium truncate">{el.elementIntitule}</p>
                    <span className="text-slate-500 text-[10px] ml-2">{el.notesSaisies}/{el.totalEtudiants}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${Math.min(el.progression, 100)}%`,
                      background: el.progression >= 100 ? "#10b981" : el.progression < 50 ? "#ef4444" : "linear-gradient(135deg, #ee2927, #ff8848)",
                    }} />
                  </div>
                  <p className="text-slate-400 text-[9px] mt-0.5">{el.enseignantNom} | {el.semestre}</p>
                </div>
                <span className={cn("text-xs font-bold w-10 text-right",
                  el.progression >= 100 ? "text-emerald-600" : el.progression < 50 ? "text-red-500" : "text-orange-600"
                )}>{el.progression}%</span>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ===================== SCO DASHBOARD =====================
  if (user?.role === "SCO" && scoData) {
    return (
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-slate-900 text-2xl font-bold">Bonjour, {user.prenom}</h1>
          <p className="text-slate-500 text-sm mt-1">Tableau de bord - Service de Scolarite</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium">Modules recus (CF)</p>
                <p className="text-slate-900 text-2xl font-bold mt-1">{scoData.modulesRecus}</p>
                <p className="text-slate-400 text-[11px] mt-1">Prets pour export Apogee</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Send size={20} className="text-orange-600" strokeWidth={1.5} />
              </div>
            </div>
          </div>
          <div className="card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium">Modules clotures</p>
                <p className="text-emerald-600 text-2xl font-bold mt-1">{scoData.modulesClotures}</p>
                <p className="text-slate-400 text-[11px] mt-1">Exportes dans Apogee</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle size={20} className="text-emerald-600" strokeWidth={1.5} />
              </div>
            </div>
          </div>
          <div className="card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium">Certificats en attente</p>
                <p className="text-amber-600 text-2xl font-bold mt-1">{scoData.certificatsEnAttente}</p>
                <p className="text-slate-400 text-[11px] mt-1">A traiter</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock size={20} className="text-amber-600" strokeWidth={1.5} />
              </div>
            </div>
          </div>
          <div className="card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium">Total modules</p>
                <p className="text-slate-900 text-2xl font-bold mt-1">{scoData.totalModules}</p>
                <p className="text-slate-400 text-[11px] mt-1">Toutes filieres</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <BookOpen size={20} className="text-blue-600" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </div>

        {/* Alertes */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-orange-600" strokeWidth={2} />
            <span className="text-slate-800 text-xs font-bold">Resume</span>
          </div>
          <div className="space-y-2">
            {scoData.modulesRecus > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-100">
                <Send size={12} className="text-orange-600 shrink-0" strokeWidth={2} />
                <span className="text-orange-700 text-[11px] font-medium">{scoData.modulesRecus} module(s) recu(s) du CF - en attente d'export vers Apogee</span>
                <ArrowRight size={11} className="text-orange-400 ml-auto" strokeWidth={2} />
              </div>
            )}
            {scoData.certificatsEnAttente > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                <AlertTriangle size={12} className="text-amber-600 shrink-0" strokeWidth={2} />
                <span className="text-amber-700 text-[11px] font-medium">{scoData.certificatsEnAttente} certificat(s) medical(aux) en attente de validation</span>
              </div>
            )}
            {scoData.totalAbsences > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <Users size={12} className="text-slate-500 shrink-0" strokeWidth={2} />
                <span className="text-slate-600 text-[11px] font-medium">{scoData.totalAbsences} absence(s) declaree(s) au total</span>
              </div>
            )}
            {scoData.modulesRecus === 0 && scoData.certificatsEnAttente === 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                <CheckCircle size={12} className="text-emerald-600 shrink-0" strokeWidth={2} />
                <span className="text-emerald-700 text-[11px] font-medium">Tout est a jour - aucune action requise</span>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ===================== CF DASHBOARD =====================
  if (user?.role === "CF" && cfData) {
    const circumference = 2 * Math.PI * 54;
    const progressOffset = circumference - (cfData.progressionGlobale / 100) * circumference;
    const modulesRecus = cfData.modulesTransmisCF;
    const modulesEnAttente = cfData.modulesEnCours;

    return (
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-slate-900 text-2xl font-bold">Bonjour, {user.prenom}</h1>
          <p className="text-slate-500 text-sm mt-1">Tableau de bord - Chef de Filiere</p>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-12 gap-4 mb-6">
          {/* Jauge circulaire */}
          <div className="col-span-12 md:col-span-4 card flex flex-col items-center justify-center py-8">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle cx="60" cy="60" r="54" fill="none" stroke="url(#cfGaugeGrad)" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={progressOffset}
                  className="transition-all duration-1000" />
                <defs>
                  <linearGradient id="cfGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ee2927" />
                    <stop offset="100%" stopColor="#ff8848" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900">{cfData.progressionGlobale}%</span>
                <span className="text-[10px] text-slate-400">avancement</span>
              </div>
            </div>
            <p className="text-slate-600 text-xs font-medium mt-3">Progression globale</p>
            <p className="text-slate-400 text-[10px]">{cfData.totalNotesSaisies} / {cfData.totalNotesAttendues} notes</p>
          </div>

          {/* KPIs droite */}
          <div className="col-span-12 md:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card py-5 text-center">
              <BookOpen size={18} className="text-blue-600 mx-auto mb-1" strokeWidth={1.5} />
              <p className="text-slate-900 text-2xl font-bold">{cfData.totalModules}</p>
              <p className="text-slate-400 text-[10px]">Modules total</p>
            </div>
            <div className="card py-5 text-center">
              <Clock size={18} className="text-amber-600 mx-auto mb-1" strokeWidth={1.5} />
              <p className="text-amber-600 text-2xl font-bold">{modulesEnAttente}</p>
              <p className="text-slate-400 text-[10px]">En attente (RM)</p>
            </div>
            <div className="card py-5 text-center">
              <Send size={18} className="text-orange-600 mx-auto mb-1" strokeWidth={1.5} />
              <p className="text-orange-600 text-2xl font-bold">{modulesRecus}</p>
              <p className="text-slate-400 text-[10px]">Recus (a transmettre)</p>
            </div>
            <div className="card py-5 text-center">
              <CheckCircle size={18} className="text-emerald-600 mx-auto mb-1" strokeWidth={1.5} />
              <p className="text-emerald-600 text-2xl font-bold">{cfData.modulesTransmisSCO + cfData.modulesClotures}</p>
              <p className="text-slate-400 text-[10px]">Transmis / Clotures</p>
            </div>

            {/* Stats supplementaires */}
            <div className="col-span-2 lg:col-span-4 card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell size={14} className="text-orange-600" strokeWidth={2} />
                <span className="text-slate-800 text-xs font-bold">Resume</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-100">
                  <Users size={12} className="text-blue-600 shrink-0" strokeWidth={2} />
                  <span className="text-blue-700 text-[11px] font-medium">{cfData.totalEtudiants} etudiant(s) dans vos filieres</span>
                </div>
                {modulesRecus > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-100">
                    <Send size={12} className="text-orange-600 shrink-0" strokeWidth={2} />
                    <span className="text-orange-700 text-[11px] font-medium">{modulesRecus} module(s) en attente de transmission a la scolarite</span>
                    <ArrowRight size={11} className="text-orange-400 ml-auto" strokeWidth={2} />
                  </div>
                )}
                {modulesEnAttente > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                    <Clock size={12} className="text-amber-600 shrink-0" strokeWidth={2} />
                    <span className="text-amber-700 text-[11px] font-medium">{modulesEnAttente} module(s) en cours de saisie par les RM</span>
                  </div>
                )}
                {modulesRecus === 0 && modulesEnAttente === 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                    <CheckCircle size={12} className="text-emerald-600 shrink-0" strokeWidth={2} />
                    <span className="text-emerald-700 text-[11px] font-medium">Tous les modules sont a jour</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modules par filiere */}
        {cfData.filieres.map((filiere: any) => (
          <div key={filiere.filiereId} className="card mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <BookOpen size={14} className="text-orange-600" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-slate-900 text-sm font-bold">{filiere.intitule} ({filiere.code})</h2>
                  <p className="text-slate-400 text-[10px]">{filiere.totalModules} modules | {filiere.nbEtudiants} etudiants | Progression: {filiere.progression}%</p>
                </div>
              </div>
              <div className="w-24">
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${filiere.progression}%`, background: filiere.progression >= 100 ? "#10b981" : "linear-gradient(135deg, #ee2927, #ff8848)" }} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {filiere.modules.map((mod: any) => (
                <div key={mod.moduleId} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    mod.statut === "CLOTURE" || mod.statut === "TRANSMIS_SCO" ? "bg-emerald-50" :
                    mod.statut === "TRANSMIS_CF" ? "bg-orange-50" : "bg-slate-100"
                  )}>
                    {mod.statut === "CLOTURE" || mod.statut === "TRANSMIS_SCO"
                      ? <CheckCircle size={14} className="text-emerald-600" strokeWidth={2} />
                      : mod.statut === "TRANSMIS_CF"
                      ? <Send size={14} className="text-orange-600" strokeWidth={2} />
                      : <Clock size={14} className="text-slate-400" strokeWidth={2} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-slate-800 text-xs font-medium truncate">{mod.intitule}</p>
                      <span className="text-slate-500 text-[10px] ml-2">{mod.notesSaisies}/{mod.notesAttendues} notes</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min(mod.progression, 100)}%`,
                        background: mod.progression >= 100 ? "#10b981" : mod.progression < 50 ? "#ef4444" : "linear-gradient(135deg, #ee2927, #ff8848)",
                      }} />
                    </div>
                    <p className="text-slate-400 text-[9px] mt-0.5">RM: {mod.responsableNom} | {mod.semestre} | {mod.code}</p>
                  </div>
                  <div className="shrink-0">
                    {mod.statut === "CLOTURE" && <span className="badge-success text-[9px]">Cloture</span>}
                    {mod.statut === "TRANSMIS_SCO" && <span className="badge-success text-[9px]">Transmis SCO</span>}
                    {mod.statut === "TRANSMIS_CF" && <span className="badge-info text-[9px]">Recu</span>}
                    {mod.statut === "EN_COURS" && <span className="badge-warning text-[9px]">En cours</span>}
                  </div>
                  <span className={cn("text-xs font-bold w-10 text-right",
                    mod.progression >= 100 ? "text-emerald-600" : mod.progression < 50 ? "text-red-500" : "text-orange-600"
                  )}>{mod.progression}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </DashboardLayout>
    );
  }

  // ===================== ENS DASHBOARD =====================
  const modules = Array.from(new Set(elements.map(e => e.moduleIntitule)));

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-slate-900 text-2xl font-bold">Bonjour, {user?.prenom || "Utilisateur"}</h1>
        <p className="text-slate-500 text-sm mt-1">Voici un apercu de votre activite academique</p>
      </div>

      {/* Message felicitations si 100% */}
      {ensStats.progression >= 100 && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle size={24} className="text-emerald-600" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-emerald-800 text-sm font-bold">Toutes les notes sont saisies !</p>
            <p className="text-emerald-600 text-xs mt-0.5">Felicitations, vous avez complete la saisie de {ensStats.notesCount} notes pour vos {ensStats.totalElements} elements de module. Vos notes sont maintenant en attente de validation par le responsable de module.</p>
          </div>
        </div>
      )}

      {/* Notification relances non lues */}
      {relancesCount > 0 && (
        <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-3">
          <AlertTriangle size={16} className="text-amber-600" strokeWidth={1.5} />
          <span className="text-amber-700 text-xs font-medium">{relancesCount} relance(s) non lue(s) de la part du responsable de module</span>
          <a href="/enseignant/relances" className="ml-auto text-amber-600 text-xs font-medium hover:text-amber-700">Voir →</a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-xs font-medium">Modules en cours</p>
              <p className="text-slate-900 text-2xl font-bold mt-1">{modules.length}</p>
              <p className="text-slate-400 text-[11px] mt-1">Ce semestre</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <BookOpen size={20} className="text-orange-600" strokeWidth={1.5} />
            </div>
          </div>
        </div>
        <div className="card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-xs font-medium">Elements assignes</p>
              <p className="text-slate-900 text-2xl font-bold mt-1">{ensStats.totalElements}</p>
              <p className="text-slate-400 text-[11px] mt-1">Tous actifs</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Users size={20} className="text-emerald-600" strokeWidth={1.5} />
            </div>
          </div>
        </div>
        <div className="card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-xs font-medium">Progression saisie</p>
              <p className="text-slate-900 text-2xl font-bold mt-1">{ensStats.progression}%</p>
              <p className="text-slate-400 text-[11px] mt-1">{ensStats.notesCount} notes saisies</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <TrendingUp size={20} className="text-red-500" strokeWidth={1.5} />
            </div>
          </div>
        </div>
        <div className="card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-xs font-medium">Statut</p>
              <p className="text-slate-900 text-2xl font-bold mt-1">{ensStats.progression >= 100 ? "Complet" : "En cours"}</p>
              <p className="text-slate-400 text-[11px] mt-1">{ensStats.progression >= 100 ? "Toutes notes saisies" : "Saisie en cours"}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              {ensStats.progression >= 100 ? <CheckCircle size={20} className="text-emerald-600" strokeWidth={1.5} /> : <Clock size={20} className="text-amber-600" strokeWidth={1.5} />}
            </div>
          </div>
        </div>
      </div>

      {/* Filtre Annee ENS */}
      <div className="flex gap-1 mb-4 p-1 bg-slate-100 rounded-xl w-fit">
        {[
          { value: "all", label: "Toutes" },
          { value: "1A", label: "1A (S1-S2)" },
          { value: "2A", label: "2A (S3-S4)" },
          { value: "3A", label: "3A (S5-S6)" },
        ].map(opt => (
          <button key={opt.value} onClick={() => setSelectedYear(opt.value)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              selectedYear === opt.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Progression par element avec barres */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-slate-900 text-base font-bold">Progression par element</h2>
          <span className="text-slate-400 text-[10px]">{elementProgress.filter(el => {
            if (selectedYear === "all") return true;
            if (selectedYear === "1A") return el.semestre === "S1" || el.semestre === "S2";
            if (selectedYear === "2A") return el.semestre === "S3" || el.semestre === "S4";
            if (selectedYear === "3A") return el.semestre === "S5" || el.semestre === "S6";
            return true;
          }).length} element(s)</span>
        </div>
        <div className="space-y-3">
          {elementProgress.filter(el => {
            if (selectedYear === "all") return true;
            if (selectedYear === "1A") return el.semestre === "S1" || el.semestre === "S2";
            if (selectedYear === "2A") return el.semestre === "S3" || el.semestre === "S4";
            if (selectedYear === "3A") return el.semestre === "S5" || el.semestre === "S6";
            return true;
          }).map((el: any) => (
            <div key={el.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                el.progression >= 100 ? "bg-emerald-50" : el.progression < 50 ? "bg-red-50" : "bg-orange-50"
              )}>
                {el.progression >= 100
                  ? <CheckCircle size={16} className="text-emerald-600" strokeWidth={2} />
                  : <BarChart3 size={16} className={el.progression < 50 ? "text-red-500" : "text-orange-600"} strokeWidth={2} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-slate-800 text-sm font-medium truncate">{el.intitule}</p>
                  <span className="text-slate-500 text-[10px]">{el.notesSaisies}/{el.totalEtudiants}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${Math.min(el.progression, 100)}%`,
                    background: el.progression >= 100 ? "#10b981" : el.progression < 50 ? "#ef4444" : "linear-gradient(135deg, #ee2927, #ff8848)",
                  }} />
                </div>
                <p className="text-slate-400 text-[10px] mt-1">{el.moduleIntitule} | {el.filiereCode} | {el.semestre}</p>
              </div>
              <span className={cn("text-sm font-bold w-12 text-right",
                el.progression >= 100 ? "text-emerald-600" : el.progression < 50 ? "text-red-500" : "text-orange-600"
              )}>{el.progression}%</span>
              <div className="flex gap-1 shrink-0">
                <span className="badge-info text-[8px]">Exam</span>
                {el.hasTd && <span className="text-[8px] px-1 py-0.5 rounded bg-slate-100 text-slate-400">TD</span>}
                {el.hasTp && <span className="text-[8px] px-1 py-0.5 rounded bg-slate-100 text-slate-400">TP</span>}
                {el.hasProjet && <span className="text-[8px] px-1 py-0.5 rounded bg-slate-100 text-slate-400">Proj</span>}
              </div>
            </div>
          ))}
          {elementProgress.length === 0 && elements.length > 0 && (
            <div className="py-4 text-center text-slate-400 text-sm animate-pulse">Chargement progression...</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
