"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import {
  Users, CheckCircle, AlertTriangle, Lock, BookOpen,
  Filter, Search, TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleInfo {
  id: number; code: string; intitule: string; semestre: string; statut: string;
}

interface EtudiantStatut {
  etudiantId: number; nom: string; prenom: string;
  noteModule: number; statut: string; elementsRattrapage: string[];
}

interface ModuleData {
  moduleId: number; moduleIntitule: string; moduleCode: string; semestre: string;
  totalEtudiants: number; admis: number; rattrapage: number; bloques: number;
  etudiants: EtudiantStatut[];
}

export default function EtudiantsPage() {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingModule, setLoadingModule] = useState(false);
  const [filter, setFilter] = useState<"all" | "ADMIS" | "RATTRAPAGE" | "BLOQUE">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const res = await api.get("/rm/mes-modules");
      setModules(res.data);
      if (res.data.length > 0) {
        setSelectedModule(res.data[0].id);
        await fetchModuleData(res.data[0].id);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchModuleData = async (moduleId: number) => {
    setLoadingModule(true);
    try {
      const res = await api.get(`/rm/module/${moduleId}/etudiants-statut`);
      setModuleData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoadingModule(false); }
  };

  const handleModuleChange = (moduleId: number) => {
    setSelectedModule(moduleId);
    fetchModuleData(moduleId);
  };

  const filteredEtudiants = (moduleData?.etudiants || []).filter(e => {
    const matchFilter = filter === "all" || e.statut === filter;
    const matchSearch = e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.prenom.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="animate-pulse text-slate-400">Chargement...</div></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <Users size={20} className="text-orange-600" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-slate-900 text-xl font-bold">Etudiants par Module</h1>
          <p className="text-slate-500 text-xs">Statut de chaque etudiant : Admis / Rattrapage / Bloque</p>
        </div>
      </div>

      {/* Module selector */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-slate-600 text-xs font-medium mb-1 block">
              <BookOpen size={12} className="inline mr-1" strokeWidth={1.5} />
              Module
            </label>
            <select
              value={selectedModule || ""}
              onChange={(e) => handleModuleChange(Number(e.target.value))}
              className="input-field text-sm"
            >
              {modules.map(mod => (
                <option key={mod.id} value={mod.id}>{mod.intitule} ({mod.code} - {mod.semestre})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-slate-600 text-xs font-medium mb-1 block">
              <Filter size={12} className="inline mr-1" strokeWidth={1.5} />
              Statut
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="input-field text-sm"
            >
              <option value="all">Tous les etudiants</option>
              <option value="ADMIS">Admis (module &gt;= 12)</option>
              <option value="RATTRAPAGE">Rattrapage (module &lt; 12)</option>
              <option value="BLOQUE">Bloque (Art. 39)</option>
            </select>
          </div>
          <div>
            <label className="text-slate-600 text-xs font-medium mb-1 block">
              <Search size={12} className="inline mr-1" strokeWidth={1.5} />
              Rechercher
            </label>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field text-sm" placeholder="Nom..." />
          </div>
        </div>
      </div>

      {/* Stats */}
      {moduleData && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card py-4 text-center">
            <p className="text-slate-900 text-2xl font-bold">{moduleData.totalEtudiants}</p>
            <p className="text-slate-500 text-xs">Total</p>
          </div>
          <div className="card py-4 text-center">
            <p className="text-emerald-600 text-2xl font-bold">{moduleData.admis}</p>
            <p className="text-slate-500 text-xs">Admis</p>
          </div>
          <div className="card py-4 text-center">
            <p className="text-amber-600 text-2xl font-bold">{moduleData.rattrapage}</p>
            <p className="text-slate-500 text-xs">Rattrapage</p>
          </div>
          <div className="card py-4 text-center">
            <p className="text-red-600 text-2xl font-bold">{moduleData.bloques}</p>
            <p className="text-slate-500 text-xs">Bloques</p>
          </div>
        </div>
      )}

      {/* Table */}
      {loadingModule ? (
        <div className="card py-12 text-center text-slate-400 text-sm animate-pulse">Chargement...</div>
      ) : moduleData && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-slate-700 text-xs font-medium">{moduleData.moduleIntitule} ({moduleData.moduleCode})</span>
            <span className="text-slate-400 text-[10px]">{filteredEtudiants.length} etudiant(s)</span>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-slate-50/90 border-b border-slate-100">
                  <th className="text-left text-slate-500 text-xs font-medium px-5 py-2.5">#</th>
                  <th className="text-left text-slate-500 text-xs font-medium px-5 py-2.5">Etudiant</th>
                  <th className="text-center text-slate-500 text-xs font-medium px-5 py-2.5">Note Module</th>
                  <th className="text-center text-slate-500 text-xs font-medium px-5 py-2.5">Statut</th>
                  <th className="text-left text-slate-500 text-xs font-medium px-5 py-2.5">Elements a rattraper</th>
                </tr>
              </thead>
              <tbody>
                {filteredEtudiants.map((etu, idx) => (
                  <tr key={etu.etudiantId} className={cn(
                    "border-b border-slate-100/80",
                    etu.statut === "BLOQUE" ? "bg-red-50/30" :
                    etu.statut === "RATTRAPAGE" ? "bg-amber-50/20" : "hover:bg-slate-50/50"
                  )}>
                    <td className="px-5 py-2.5 text-slate-400 text-xs">{idx + 1}</td>
                    <td className="px-5 py-2.5">
                      <p className="text-slate-800 text-sm font-medium">{etu.nom} {etu.prenom}</p>
                    </td>
                    <td className="px-5 py-2.5 text-center">
                      <span className={cn("font-bold text-sm",
                        etu.statut === "ADMIS" ? "text-emerald-600" :
                        etu.statut === "BLOQUE" ? "text-red-500" : "text-amber-600"
                      )}>{etu.noteModule.toFixed(2)}</span>
                      <span className="text-slate-400 text-xs">/20</span>
                    </td>
                    <td className="px-5 py-2.5 text-center">
                      {etu.statut === "ADMIS" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-medium">
                          <CheckCircle size={9} strokeWidth={2} />Admis
                        </span>
                      )}
                      {etu.statut === "RATTRAPAGE" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-medium">
                          <TrendingDown size={9} strokeWidth={2} />Rattrapage
                        </span>
                      )}
                      {etu.statut === "BLOQUE" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-medium">
                          <Lock size={9} strokeWidth={2} />Bloque
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-2.5">
                      {etu.elementsRattrapage.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {etu.elementsRattrapage.map((el, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-700 text-[9px]">
                              {el}
                            </span>
                          ))}
                        </div>
                      )}
                      {etu.statut === "ADMIS" && <span className="text-emerald-500 text-[10px]">Module valide</span>}
                      {etu.statut === "BLOQUE" && <span className="text-red-400 text-[10px]">Absence injustifiee (Art. 39)</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredEtudiants.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">Aucun etudiant trouve</div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
