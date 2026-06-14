"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import {
  Download, FileText, CheckCircle, Database, ArrowRight,
  Inbox, BookOpen, User, Calendar, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ElementInfo {
  elementId: number;
  code: string;
  intitule: string;
  nbNotes: number;
}

interface ModuleRecu {
  moduleId: number;
  code: string;
  intitule: string;
  semestre: string;
  statut: string;
  filiereCode: string;
  filiereIntitule: string;
  responsableNom: string;
  notesSaisies: number;
  nbEtudiants: number;
  elements: ElementInfo[];
  dateTransmissionSCO: string | null;
}

export default function ExportPage() {
  const [modules, setModules] = useState<ModuleRecu[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<number | null>(null);
  const [exported, setExported] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const res = await api.get("/scolarite/modules-recus");
      setModules(res.data);
    } catch (err: any) {
      setError("Erreur lors du chargement des modules");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (elementId: number, elementName: string) => {
    setExporting(elementId);
    setError("");
    try {
      const response = await api.get(`/scolarite/export/apogee/${elementId}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `export_apogee_${elementName.replace(/\s/g, "_")}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setExported((prev) => {
        const s = new Set(Array.from(prev));
        s.add(elementId);
        return s;
      });
      setSuccess(`Export "${elementName}" telecharge`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Erreur lors de l'export");
    } finally {
      setExporting(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-slate-400">Chargement...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <Download size={20} className="text-orange-600" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-slate-900 text-xl font-bold">Export Apogee</h1>
          <p className="text-slate-500 text-xs">
            Modules recus des Chefs de Filiere - Export CSV au format Apogee
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

      {/* Format info */}
      <div className="card mb-6 bg-slate-50/50">
        <div className="flex items-start gap-3">
          <Database size={16} className="text-slate-500 mt-0.5" strokeWidth={1.5} />
          <div className="text-xs text-slate-600">
            <p className="font-medium mb-1">Format CSV Apogee :</p>
            <p className="font-mono text-[10px] text-slate-400">COD_ETU;NOM;PRENOM;NOTE;BAREME;RES</p>
            <p className="mt-1 text-slate-500">Separateur: point-virgule | Encodage: UTF-8 | RES: ADM/AJ/DEF</p>
          </div>
        </div>
      </div>

      {/* Modules list */}
      {modules.length === 0 ? (
        <div className="card py-16 text-center">
          <Inbox size={40} className="text-slate-200 mx-auto mb-3" strokeWidth={1} />
          <p className="text-slate-400 text-sm font-medium">Aucun module recu</p>
          <p className="text-slate-300 text-xs mt-1">
            Les modules apparaitront ici une fois transmis par les Chefs de Filiere
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((mod) => (
            <div key={mod.moduleId} className="card">
              {/* Module header */}
              <div className="flex items-center gap-4 mb-4 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <BookOpen size={18} className="text-orange-600" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-slate-800 text-sm font-bold">{mod.intitule}</p>
                    <span className="text-slate-400 text-[10px] font-mono">{mod.code}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <User size={10} strokeWidth={1.5} />
                      RM: {mod.responsableNom}
                    </span>
                    <span>{mod.filiereCode} | {mod.semestre}</span>
                    <span>{mod.notesSaisies} notes | {mod.nbEtudiants} etudiants</span>
                    {mod.dateTransmissionSCO && (
                      <span className="flex items-center gap-1">
                        <Calendar size={10} strokeWidth={1.5} />
                        Recu: {formatDate(mod.dateTransmissionSCO)}
                      </span>
                    )}
                  </div>
                </div>
                <span className={cn("text-[9px] font-medium px-2 py-0.5 rounded-full",
                  mod.statut === "CLOTURE" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                )}>
                  {mod.statut === "CLOTURE" ? "Exporte" : "A exporter"}
                </span>
              </div>

              {/* Elements */}
              <div className="space-y-2">
                {mod.elements.map((el) => (
                  <div key={el.elementId} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-slate-500" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 text-xs font-medium">{el.intitule}</p>
                      <p className="text-slate-400 text-[10px]">{el.code} | {el.nbNotes} notes</p>
                    </div>
                    {exported.has(el.elementId) ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-medium">
                        <CheckCircle size={12} strokeWidth={2} />
                        Exporte
                      </span>
                    ) : (
                      <button
                        onClick={() => handleExport(el.elementId, el.intitule)}
                        disabled={exporting === el.elementId}
                        className="btn-secondary text-[10px] py-1.5 px-2.5"
                      >
                        {exporting === el.elementId ? (
                          "..."
                        ) : (
                          <>
                            <Download size={11} strokeWidth={1.5} />
                            CSV
                            <ArrowRight size={10} strokeWidth={1.5} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
