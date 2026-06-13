"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api, aiApi } from "@/lib/api";
import {
  Upload, FileImage, CheckCircle, XCircle, Sparkles,
  Calendar, Stethoscope, Clock, Shield, AlertTriangle,
  User, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AbsenceData {
  id: number;
  etudiantNom: string;
  etudiantPrenom: string;
  etudiantEmail: string;
  elementIntitule: string;
  moduleIntitule: string;
  dateAbsence: string;
  type: string;
  justificatifStatut: string;
}

interface AnalysisResult {
  texte_extrait: string;
  date_incapacite_debut: string | null;
  date_incapacite_fin: string | null;
  medecin_detecte: string | null;
  recommandation: "VALIDE" | "REJETE";
  score_confiance: number;
  motif: string;
  couvre_date_examen: boolean;
}

export default function CertificatsPage() {
  const [absences, setAbsences] = useState<AbsenceData[]>([]);
  const [loadingAbsences, setLoadingAbsences] = useState(true);
  const [filter, setFilter] = useState<"all" | "EN_ATTENTE" | "VALIDE" | "REJETE">("all");

  // Analysis state
  const [selectedAbsence, setSelectedAbsence] = useState<AbsenceData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchAbsences();
  }, []);

  const fetchAbsences = async () => {
    try {
      const res = await api.get("/scolarite/absences");
      setAbsences(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAbsences(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
      setAnalysis(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
      setAnalysis(null);
    }
  }, []);

  const analyzeDocument = async () => {
    if (!selectedFile || !selectedAbsence) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const response = await aiApi.post("/api/ocr/analyze", {
          image_base64: base64,
          date_examen: selectedAbsence.dateAbsence,
        });
        setAnalysis(response.data);
        setLoading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch {
      setAnalysis({
        texte_extrait: "Erreur lors de l'analyse",
        date_incapacite_debut: null,
        date_incapacite_fin: null,
        medecin_detecte: null,
        recommandation: "REJETE",
        score_confiance: 0,
        motif: "Erreur technique",
        couvre_date_examen: false,
      });
      setLoading(false);
    }
  };

  const handleValider = async () => {
    if (!selectedAbsence) return;
    setActionLoading(true);
    try {
      await api.post(`/scolarite/certificats/${selectedAbsence.id}/valider`);
      setAbsences((prev) =>
        prev.map((a) =>
          a.id === selectedAbsence.id ? { ...a, justificatifStatut: "VALIDE" } : a
        )
      );
      setSuccess("Certificat valide avec succes");
      setSelectedAbsence(null);
      setSelectedFile(null);
      setPreview(null);
      setAnalysis(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const handleRejeter = async () => {
    if (!selectedAbsence) return;
    setActionLoading(true);
    try {
      await api.post(`/scolarite/certificats/${selectedAbsence.id}/rejeter`);
      setAbsences((prev) =>
        prev.map((a) =>
          a.id === selectedAbsence.id ? { ...a, justificatifStatut: "REJETE" } : a
        )
      );
      setSuccess("Certificat rejete");
      setSelectedAbsence(null);
      setSelectedFile(null);
      setPreview(null);
      setAnalysis(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const filteredAbsences = absences.filter((a) => {
    if (filter === "all") return true;
    return a.justificatifStatut === filter;
  });

  const enAttente = absences.filter((a) => a.justificatifStatut === "EN_ATTENTE").length;

  if (loadingAbsences) {
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
          <Stethoscope size={20} className="text-orange-600" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-slate-900 text-xl font-bold">
            Absences & Certificats Medicaux
            {enAttente > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold text-white bg-amber-500 rounded-full">
                {enAttente}
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-xs">
            Gestion des absences et validation des justificatifs medicaux
          </p>
        </div>
      </div>

      {success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2">
          <CheckCircle size={14} className="text-emerald-500" strokeWidth={2} />
          <span className="text-emerald-600 text-sm">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Absences list */}
        <div className="lg:col-span-2">
          {/* Filter Tabs */}
          <div className="flex gap-1 mb-4 p-1 bg-slate-100 rounded-xl w-fit">
            <button onClick={() => setFilter("all")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", filter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              Toutes ({absences.length})
            </button>
            <button onClick={() => setFilter("EN_ATTENTE")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", filter === "EN_ATTENTE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              En attente ({enAttente})
            </button>
            <button onClick={() => setFilter("VALIDE")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", filter === "VALIDE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              Validees
            </button>
            <button onClick={() => setFilter("REJETE")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", filter === "REJETE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              Rejetees
            </button>
          </div>

          {/* Absences List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredAbsences.length === 0 ? (
              <div className="card py-12 text-center">
                <CheckCircle size={36} className="text-slate-200 mx-auto mb-3" strokeWidth={1} />
                <p className="text-slate-400 text-sm">Aucune absence trouvee</p>
              </div>
            ) : (
              filteredAbsences.map((abs) => (
                <div
                  key={abs.id}
                  onClick={() => {
                    setSelectedAbsence(abs);
                    setSelectedFile(null);
                    setPreview(null);
                    setAnalysis(null);
                  }}
                  className={cn(
                    "card-hover flex items-center gap-3 cursor-pointer transition-all",
                    selectedAbsence?.id === abs.id && "ring-2 ring-orange-400 bg-orange-50/30"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    abs.justificatifStatut === "VALIDE" ? "bg-emerald-50" :
                    abs.justificatifStatut === "REJETE" ? "bg-red-50" : "bg-amber-50"
                  )}>
                    {abs.justificatifStatut === "VALIDE" ? <CheckCircle size={16} className="text-emerald-600" strokeWidth={2} /> :
                     abs.justificatifStatut === "REJETE" ? <XCircle size={16} className="text-red-500" strokeWidth={2} /> :
                     <Clock size={16} className="text-amber-600" strokeWidth={2} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 text-sm font-medium truncate">
                      {abs.etudiantNom} {abs.etudiantPrenom}
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      {abs.elementIntitule} | {abs.dateAbsence} | {abs.type === "INJUSTIFIEE" ? "Injustifiee" : "Justifiee"}
                    </p>
                  </div>
                  <span className={cn("text-[9px] font-medium px-2 py-0.5 rounded-full",
                    abs.justificatifStatut === "VALIDE" ? "bg-emerald-100 text-emerald-700" :
                    abs.justificatifStatut === "REJETE" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  )}>
                    {abs.justificatifStatut === "EN_ATTENTE" ? "En attente" : abs.justificatifStatut === "VALIDE" ? "Validee" : "Rejetee"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Analysis panel */}
        <div className="space-y-4">
          {selectedAbsence ? (
            <>
              {/* Student info */}
              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <User size={16} className="text-slate-500" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-slate-800 text-sm font-medium">{selectedAbsence.etudiantNom} {selectedAbsence.etudiantPrenom}</p>
                    <p className="text-slate-400 text-[10px]">{selectedAbsence.etudiantEmail}</p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 space-y-1">
                  <p><span className="font-medium">Element:</span> {selectedAbsence.elementIntitule}</p>
                  <p><span className="font-medium">Module:</span> {selectedAbsence.moduleIntitule}</p>
                  <p><span className="font-medium">Date absence:</span> {selectedAbsence.dateAbsence}</p>
                  <p><span className="font-medium">Type:</span> {selectedAbsence.type === "INJUSTIFIEE" ? "Injustifiee" : "Justifiee"}</p>
                </div>
              </div>

              {/* Upload zone */}
              {selectedAbsence.justificatifStatut === "EN_ATTENTE" && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="card border-2 border-dashed border-slate-200 hover:border-orange-300 transition-all"
                >
                  <div className="py-6 flex flex-col items-center text-center">
                    <Upload size={20} className="text-slate-400 mb-2" strokeWidth={1.5} />
                    <p className="text-slate-600 text-xs font-medium mb-1">Deposer le certificat</p>
                    <p className="text-slate-400 text-[10px] mb-3">PNG, JPG</p>
                    <label className="btn-secondary cursor-pointer text-[10px] py-1.5 px-3">
                      <FileImage size={12} strokeWidth={1.5} />Choisir
                      <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                    </label>
                  </div>
                </div>
              )}

              {/* Preview + Analyze */}
              {preview && (
                <div className="card p-3">
                  <div className="rounded-lg overflow-hidden border border-slate-100 bg-slate-50 mb-3">
                    <img src={preview} alt="Certificat" className="w-full h-40 object-contain" />
                  </div>
                  <button onClick={analyzeDocument} disabled={loading} className="btn-primary w-full justify-center text-xs">
                    {loading ? <span className="animate-pulse">Analyse en cours...</span> : <><Sparkles size={14} strokeWidth={1.5} />Analyser avec l'IA</>}
                  </button>
                </div>
              )}

              {/* Analysis results */}
              {analysis && (
                <>
                  <div className={cn("card border", analysis.recommandation === "VALIDE" ? "border-emerald-200 bg-emerald-50/30" : "border-red-200 bg-red-50/30")}>
                    <div className="flex items-center gap-2 mb-2">
                      {analysis.recommandation === "VALIDE" ? <CheckCircle size={18} className="text-emerald-500" strokeWidth={1.5} /> : <XCircle size={18} className="text-red-500" strokeWidth={1.5} />}
                      <p className={cn("text-sm font-bold", analysis.recommandation === "VALIDE" ? "text-emerald-700" : "text-red-700")}>{analysis.recommandation}</p>
                    </div>
                    <p className="text-slate-500 text-[10px]">{analysis.motif}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-slate-500 text-[10px]">Confiance:</span>
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full">
                        <div className="h-full rounded-full" style={{ width: `${analysis.score_confiance * 100}%`, background: analysis.score_confiance >= 0.6 ? "#10b981" : "#ef4444" }} />
                      </div>
                      <span className="text-slate-700 text-[10px] font-bold">{Math.round(analysis.score_confiance * 100)}%</span>
                    </div>
                  </div>

                  <div className="card text-[11px] space-y-2">
                    <p><span className="text-slate-500">Debut:</span> <span className="font-medium">{analysis.date_incapacite_debut || "—"}</span></p>
                    <p><span className="text-slate-500">Fin:</span> <span className="font-medium">{analysis.date_incapacite_fin || "—"}</span></p>
                    <p><span className="text-slate-500">Medecin:</span> <span className="font-medium">{analysis.medecin_detecte || "—"}</span></p>
                    <p><span className="text-slate-500">Couvre examen:</span> <span className={cn("font-medium", analysis.couvre_date_examen ? "text-emerald-600" : "text-red-500")}>{analysis.couvre_date_examen ? "Oui" : "Non"}</span></p>
                  </div>
                </>
              )}

              {/* Actions */}
              {selectedAbsence.justificatifStatut === "EN_ATTENTE" && (
                <div className="flex gap-2">
                  <button onClick={handleValider} disabled={actionLoading} className="btn-primary flex-1 justify-center text-xs">
                    <CheckCircle size={14} strokeWidth={1.5} />Valider
                  </button>
                  <button onClick={handleRejeter} disabled={actionLoading} className="btn-danger flex-1 justify-center text-xs">
                    <XCircle size={14} strokeWidth={1.5} />Rejeter
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Stethoscope size={24} className="text-slate-300" strokeWidth={1.5} />
              </div>
              <p className="text-slate-500 text-sm font-medium">Selectionnez une absence</p>
              <p className="text-slate-400 text-xs mt-1 max-w-[200px]">Cliquez sur un etudiant pour traiter son justificatif</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
