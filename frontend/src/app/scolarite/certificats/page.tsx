"use client";

import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { aiApi } from "@/lib/api";
import {
  Upload,
  FileImage,
  CheckCircle,
  XCircle,
  Sparkles,
  Calendar,
  Stethoscope,
  Clock,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dateExamen, setDateExamen] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    setAnalysis(null);
  };

  const analyzeDocument = async () => {
    if (!selectedFile || !dateExamen) return;
    setLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const response = await aiApi.post("/api/ocr/analyze", {
          image_base64: base64,
          date_examen: dateExamen,
        });
        setAnalysis(response.data);
        setLoading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setAnalysis({
        texte_extrait: "Erreur lors de l'analyse",
        date_incapacite_debut: null,
        date_incapacite_fin: null,
        medecin_detecte: null,
        recommandation: "REJETE",
        score_confiance: 0,
        motif: "Erreur technique - veuillez reessayer",
        couvre_date_examen: false,
      });
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <Stethoscope size={20} className="text-emerald-600" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-slate-900 text-xl font-bold">
            Analyse des Certificats Medicaux
          </h1>
          <p className="text-slate-500 text-xs">
            OCR + NLP : extraction automatique et validation intelligente
          </p>
        </div>
      </div>

      {/* Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Document Upload */}
        <div className="space-y-4">
          {/* Date examen */}
          <div className="card">
            <label className="text-slate-600 text-xs font-medium mb-1.5 block">
              Date de l'examen concerne
            </label>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                strokeWidth={1.5}
              />
              <input
                type="date"
                value={dateExamen}
                onChange={(e) => setDateExamen(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "card border-2 border-dashed transition-all duration-200 cursor-pointer",
              dragOver
                ? "border-blue-400 bg-blue-50/50"
                : "border-slate-200 hover:border-blue-300 hover:bg-slate-50/50"
            )}
          >
            <div className="py-12 flex flex-col items-center text-center">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                dragOver ? "bg-blue-100" : "bg-slate-100"
              )}>
                <Upload
                  size={24}
                  className={dragOver ? "text-blue-600" : "text-slate-400"}
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-slate-700 text-sm font-medium mb-1">
                Deposez le certificat ici
              </p>
              <p className="text-slate-400 text-xs mb-4">
                Formats acceptes : PNG, JPG, PDF (image)
              </p>
              <label className="btn-secondary cursor-pointer text-xs">
                <FileImage size={14} strokeWidth={1.5} />
                Choisir un fichier
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="card p-3">
              <p className="text-slate-500 text-xs font-medium mb-2">Apercu du document</p>
              <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                <img
                  src={preview}
                  alt="Certificat"
                  className="w-full h-64 object-contain"
                />
              </div>
              <button
                onClick={analyzeDocument}
                disabled={!dateExamen || loading}
                className="btn-primary w-full justify-center mt-3"
              >
                {loading ? (
                  <span className="animate-pulse">Analyse en cours...</span>
                ) : (
                  <>
                    <Sparkles size={16} strokeWidth={1.5} />
                    Analyser avec l'IA
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right - Analysis Results */}
        <div className="space-y-4">
          {analysis ? (
            <>
              {/* Recommandation */}
              <div className={cn(
                "card border-2",
                analysis.recommandation === "VALIDE"
                  ? "border-emerald-200 bg-emerald-50/30"
                  : "border-red-200 bg-red-50/30"
              )}>
                <div className="flex items-center gap-3 mb-3">
                  {analysis.recommandation === "VALIDE" ? (
                    <CheckCircle size={24} className="text-emerald-500" strokeWidth={1.5} />
                  ) : (
                    <XCircle size={24} className="text-red-500" strokeWidth={1.5} />
                  )}
                  <div>
                    <p className={cn(
                      "text-lg font-bold",
                      analysis.recommandation === "VALIDE" ? "text-emerald-700" : "text-red-700"
                    )}>
                      {analysis.recommandation}
                    </p>
                    <p className="text-slate-500 text-xs">{analysis.motif}</p>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-slate-600 text-xs font-medium">Score de confiance</span>
                    <span className="text-slate-900 text-sm font-bold">
                      {Math.round(analysis.score_confiance * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        analysis.score_confiance >= 0.6 ? "bg-emerald-500" :
                        analysis.score_confiance >= 0.4 ? "bg-amber-400" : "bg-red-400"
                      )}
                      style={{ width: `${analysis.score_confiance * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Extracted Data */}
              <div className="card">
                <h3 className="text-slate-900 text-sm font-bold mb-4">
                  Donnees extraites
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 text-xs flex items-center gap-2">
                      <Calendar size={13} strokeWidth={1.5} />
                      Debut incapacite
                    </span>
                    <span className="text-slate-800 text-xs font-medium">
                      {analysis.date_incapacite_debut || "Non detecte"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 text-xs flex items-center gap-2">
                      <Clock size={13} strokeWidth={1.5} />
                      Fin incapacite
                    </span>
                    <span className="text-slate-800 text-xs font-medium">
                      {analysis.date_incapacite_fin || "Non detecte"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 text-xs flex items-center gap-2">
                      <Stethoscope size={13} strokeWidth={1.5} />
                      Medecin
                    </span>
                    <span className="text-slate-800 text-xs font-medium">
                      {analysis.medecin_detecte || "Non detecte"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-500 text-xs flex items-center gap-2">
                      <Shield size={13} strokeWidth={1.5} />
                      Couvre la date d'examen
                    </span>
                    <span className={cn(
                      "text-xs font-medium",
                      analysis.couvre_date_examen ? "text-emerald-600" : "text-red-500"
                    )}>
                      {analysis.couvre_date_examen ? "Oui" : "Non"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Extracted Text */}
              <div className="card">
                <h3 className="text-slate-900 text-sm font-bold mb-3">
                  Texte extrait (OCR)
                </h3>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 max-h-48 overflow-y-auto">
                  <pre className="text-slate-600 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                    {analysis.texte_extrait}
                  </pre>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button className="btn-primary flex-1 justify-center">
                  <CheckCircle size={16} strokeWidth={1.5} />
                  Valider le certificat
                </button>
                <button className="btn-danger flex-1 justify-center">
                  <XCircle size={16} strokeWidth={1.5} />
                  Rejeter
                </button>
              </div>
            </>
          ) : (
            /* Placeholder */
            <div className="card flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-slate-300" strokeWidth={1.5} />
              </div>
              <p className="text-slate-500 text-sm font-medium">
                En attente d'analyse
              </p>
              <p className="text-slate-400 text-xs mt-1 max-w-xs">
                Deposez un certificat medical et cliquez sur "Analyser" pour
                obtenir les resultats de l'IA
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
