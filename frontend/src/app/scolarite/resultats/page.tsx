"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import {
  Users, CheckCircle, AlertTriangle, Lock, Search, Filter, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EtudiantResult {
  etudiantId: number; nom: string; prenom: string; email: string;
  moyenne: number; statut: string;
  modulesValides: number; modulesNonValides: number; totalNotes: number;
}

export default function ResultatsPage() {
  const [etudiants, setEtudiants] = useState<EtudiantResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filiere, setFiliere] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "ADMIS" | "NON_ADMIS" | "BLOQUE">("all");

  useEffect(() => {
    fetchResultats();
  }, [filiere]);

  const fetchResultats = async () => {
    setLoading(true);
    try {
      const params = filiere ? `?filiere=${filiere}` : "";
      const res = await api.get(`/scolarite/etudiants-resultats${params}`);
      setEtudiants(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = etudiants.filter(e => {
    const matchFilter = filter === "all" || e.statut === filter;
    const matchSearch = e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.prenom.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  const admis = etudiants.filter(e => e.statut === "ADMIS").length;
  const nonAdmis = etudiants.filter(e => e.statut === "NON_ADMIS").length;
  const bloques = etudiants.filter(e => e.statut === "BLOQUE").length;
  const moyenneGenerale = etudiants.length > 0
    ? Math.round(etudiants.reduce((s, e) => s + e.moyenne, 0) / etudiants.length * 100) / 100 : 0;

  if (loading && etudiants.length === 0) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-pulse text-slate-400">Chargement...</div></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <Users size={20} className="text-orange-600" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-slate-900 text-xl font-bold">Resultats Etudiants</h1>
          <p className="text-slate-500 text-xs">Vue consolidee par filiere avec statuts academiques</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-slate-600 text-xs font-medium mb-1 block">
              <Filter size={12} className="inline mr-1" strokeWidth={1.5} />Filiere
            </label>
            <select value={filiere} onChange={(e) => setFiliere(e.target.value)} className="input-field text-sm">
              <option value="">Toutes les filieres</option>
              <option value="gl">GL - Genie Logiciel</option>
              <option value="2ia">2IA - Intelligence Artificielle</option>
              <option value="bia">BI&A - Business Intelligence</option>
              <option value="gd">GD - Genie de la Data</option>
              <option value="idf">IDF - Finance</option>
              <option value="2scl">2SCL - Supply Chain</option>
              <option value="cscc">CSCC - Cybersecurite</option>
              <option value="d2s">D2S - Data Sciences</option>
              <option value="sse">SSE - Systemes Intelligents</option>
            </select>
          </div>
          <div>
            <label className="text-slate-600 text-xs font-medium mb-1 block">Statut</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="input-field text-sm">
              <option value="all">Tous</option>
              <option value="ADMIS">Admis</option>
              <option value="NON_ADMIS">Non admis</option>
              <option value="BLOQUE">Bloques</option>
            </select>
          </div>
          <div>
            <label className="text-slate-600 text-xs font-medium mb-1 block">
              <Search size={12} className="inline mr-1" strokeWidth={1.5} />Rechercher
            </label>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field text-sm" placeholder="Nom..." />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="card py-4 text-center">
          <p className="text-slate-900 text-2xl font-bold">{etudiants.length}</p>
          <p className="text-slate-500 text-xs">Total</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-emerald-600 text-2xl font-bold">{admis}</p>
          <p className="text-slate-500 text-xs">Admis</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-amber-600 text-2xl font-bold">{nonAdmis}</p>
          <p className="text-slate-500 text-xs">Non admis</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-red-600 text-2xl font-bold">{bloques}</p>
          <p className="text-slate-500 text-xs">Bloques</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-blue-600 text-2xl font-bold">{moyenneGenerale}</p>
          <p className="text-slate-500 text-xs">Moy. generale</p>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-slate-700 text-xs font-medium">{filtered.length} etudiant(s)</span>
          <span className="text-slate-400 text-[10px]">{filiere ? filiere.toUpperCase() : "Toutes filieres"}</span>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="bg-slate-50/90 border-b border-slate-100">
                <th className="text-left text-slate-500 text-xs font-medium px-5 py-2.5">#</th>
                <th className="text-left text-slate-500 text-xs font-medium px-5 py-2.5">Etudiant</th>
                <th className="text-center text-slate-500 text-xs font-medium px-5 py-2.5">Moyenne</th>
                <th className="text-center text-slate-500 text-xs font-medium px-5 py-2.5">Valides</th>
                <th className="text-center text-slate-500 text-xs font-medium px-5 py-2.5">Non valides</th>
                <th className="text-center text-slate-500 text-xs font-medium px-5 py-2.5">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((etu, idx) => (
                <tr key={etu.etudiantId} className="border-b border-slate-100/80 hover:bg-slate-50/50">
                  <td className="px-5 py-2.5 text-slate-400 text-xs">{idx + 1}</td>
                  <td className="px-5 py-2.5">
                    <p className="text-slate-800 text-sm font-medium">{etu.nom} {etu.prenom}</p>
                    <p className="text-slate-400 text-[10px]">{etu.email}</p>
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <span className={cn("font-bold text-sm",
                      etu.moyenne >= 12 ? "text-emerald-600" : etu.moyenne >= 10 ? "text-amber-600" : "text-red-500"
                    )}>{etu.moyenne}</span>
                    <span className="text-slate-400 text-xs">/20</span>
                  </td>
                  <td className="px-5 py-2.5 text-center text-emerald-600 text-xs font-medium">{etu.modulesValides}</td>
                  <td className="px-5 py-2.5 text-center text-red-500 text-xs font-medium">{etu.modulesNonValides}</td>
                  <td className="px-5 py-2.5 text-center">
                    {etu.statut === "ADMIS" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-medium">
                        <CheckCircle size={9} strokeWidth={2} />Admis
                      </span>
                    )}
                    {etu.statut === "NON_ADMIS" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-medium">
                        <AlertTriangle size={9} strokeWidth={2} />Non admis
                      </span>
                    )}
                    {etu.statut === "BLOQUE" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-medium">
                        <Lock size={9} strokeWidth={2} />Bloque
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm">Aucun etudiant trouve</div>
        )}
      </div>
    </DashboardLayout>
  );
}
