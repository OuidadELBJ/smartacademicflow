"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import {
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

interface ElementData {
  id: number; intitule: string; filiereCode: string; semestre: string;
  moduleIntitule: string; hasTd: boolean; hasTp: boolean; hasProjet: boolean;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [elements, setElements] = useState<ElementData[]>([]);
  const [stats, setStats] = useState({ totalElements: 0, notesCount: 0, progression: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "ENS") { setLoading(false); return; }
    const fetchData = async () => {
      try {
        const res = await api.get("/enseignant/mes-elements");
        const elems: ElementData[] = res.data;
        setElements(elems);

        // Calculer stats reelles
        let totalNotes = 0;
        let totalExpected = 0;
        for (const el of elems) {
          try {
            const notesRes = await api.get(`/enseignant/notes/element/${el.id}?type=EXAM`);
            totalNotes += notesRes.data.length;
          } catch {}
          // Estimer le nombre attendu (simplifie)
          totalExpected += 30; // ~30 etudiants par filiere en moyenne
        }
        const prog = totalExpected > 0 ? Math.round((totalNotes / totalExpected) * 100) : 0;
        setStats({ totalElements: elems.length, notesCount: totalNotes, progression: Math.min(prog, 100) });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-pulse text-slate-400">Chargement...</div></div></DashboardLayout>;
  }

  // Get unique modules
  const modules = [...new Set(elements.map(e => e.moduleIntitule))];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-slate-900 text-2xl font-bold">
          Bonjour, {user?.prenom || "Utilisateur"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Voici un apercu de votre activite academique
        </p>
      </div>

      {/* Stats */}
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
              <p className="text-slate-900 text-2xl font-bold mt-1">{stats.totalElements}</p>
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
              <p className="text-slate-900 text-2xl font-bold mt-1">{stats.progression}%</p>
              <p className="text-slate-400 text-[11px] mt-1">{stats.notesCount} notes saisies</p>
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
              <p className="text-slate-900 text-2xl font-bold mt-1">
                {stats.progression >= 100 ? "Complet" : "En cours"}
              </p>
              <p className="text-slate-400 text-[11px] mt-1">
                {stats.progression >= 100 ? "Toutes les notes saisies" : "Saisie en cours"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              {stats.progression >= 100
                ? <CheckCircle size={20} className="text-emerald-600" strokeWidth={1.5} />
                : <Clock size={20} className="text-amber-600" strokeWidth={1.5} />
              }
            </div>
          </div>
        </div>
      </div>

      {/* Mes elements */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-slate-900 text-base font-bold">Mes elements de module</h2>
          <BarChart3 size={18} className="text-slate-400" strokeWidth={1.5} />
        </div>
        <div className="space-y-3">
          {elements.map((el) => (
            <div key={el.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                <BookOpen size={16} className="text-orange-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 text-sm font-medium">{el.intitule}</p>
                <p className="text-slate-400 text-[11px]">{el.moduleIntitule} | {el.filiereCode} | {el.semestre}</p>
              </div>
              <div className="flex gap-1">
                <span className="badge-info text-[9px]">Exam</span>
                {el.hasTd && <span className="badge text-[9px] bg-slate-100 text-slate-500 border border-slate-200">TD</span>}
                {el.hasTp && <span className="badge text-[9px] bg-slate-100 text-slate-500 border border-slate-200">TP</span>}
                {el.hasProjet && <span className="badge text-[9px] bg-slate-100 text-slate-500 border border-slate-200">Projet</span>}
              </div>
            </div>
          ))}
          {elements.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-6">Aucun element assigne</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
