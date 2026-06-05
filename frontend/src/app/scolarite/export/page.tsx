"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { Download, FileText, CheckCircle, Database, ArrowRight } from "lucide-react";

export default function ExportPage() {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const elements = [
    { id: 1, code: "GL-M1-E1", name: "Java Avance", module: "Programmation Avancee", notes: 42 },
    { id: 2, code: "GL-M1-E2", name: "Design Patterns", module: "Programmation Avancee", notes: 42 },
    { id: 3, code: "GL-M2-E1", name: "SQL Avance", module: "Bases de Donnees", notes: 40 },
  ];

  const handleExport = async (elementId: number) => {
    setExporting(true);
    try {
      const response = await api.get(`/scolarite/export/apogee/${elementId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `export_apogee_${elementId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setExported(true);
    } catch (err) { console.error(err); }
    finally { setExporting(false); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <Download size={20} className="text-orange-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-slate-900 text-xl font-bold">Export Apogee</h1>
            <p className="text-slate-500 text-xs">Generation du fichier CSV au format norme Apogee</p>
          </div>
        </div>

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

        <div className="space-y-3">
          {elements.map((el) => (
            <div key={el.id} className="card-hover flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <FileText size={18} className="text-slate-500" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-slate-800 text-sm font-medium">{el.name}</p>
                <p className="text-slate-400 text-xs">{el.module} | {el.notes} notes</p>
              </div>
              <span className="text-slate-400 text-[10px] font-mono">{el.code}</span>
              <button onClick={() => handleExport(el.id)} className="btn-secondary text-xs py-2">
                <Download size={13} strokeWidth={1.5} />Exporter<ArrowRight size={12} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>

        {exported && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
            <CheckCircle size={18} className="text-emerald-500" strokeWidth={1.5} />
            <p className="text-emerald-700 text-sm">Export genere et telecharge avec succes.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
