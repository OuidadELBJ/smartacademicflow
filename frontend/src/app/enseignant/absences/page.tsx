"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import {
  AlertTriangle,
  Plus,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";

interface Element {
  id: number;
  code: string;
  intitule: string;
  filiereCode: string;
  semestre: string;
}

interface Etudiant {
  id: number;
  nom: string;
  prenom: string;
}

interface AbsenceData {
  id: number;
  etudiantNom: string;
  etudiantPrenom: string;
  elementIntitule: string;
  elementId: number;
  dateAbsence: string;
  type: string;
}

export default function AbsencesPage() {
  const [absences, setAbsences] = useState<AbsenceData[]>([]);
  const [elements, setElements] = useState<Element[]>([]);
  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [formEtudiant, setFormEtudiant] = useState("");
  const [formElement, setFormElement] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formType, setFormType] = useState("INJUSTIFIEE");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [elemRes, etuRes, absRes] = await Promise.all([
          api.get("/enseignant/mes-elements"),
          api.get("/enseignant/etudiants"),
          api.get("/enseignant/absences/mes-absences"),
        ]);
        setElements(elemRes.data);
        setEtudiants(etuRes.data);
        setAbsences(absRes.data);
      } catch (err) {
        setError("Erreur chargement des donnees");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!formEtudiant || !formElement || !formDate) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      await api.post("/enseignant/absences", {
        etudiantId: Number(formEtudiant),
        elementModuleId: Number(formElement),
        dateAbsence: formDate,
        type: formType,
      });

      // Refresh absences
      const absRes = await api.get("/enseignant/absences/mes-absences");
      setAbsences(absRes.data);

      setSuccess("Absence declaree avec succes" + (formType === "INJUSTIFIEE" ? " - Article 39 applique automatiquement" : ""));
      setShowForm(false);
      setFormEtudiant("");
      setFormElement("");
      setFormDate("");
      setFormType("INJUSTIFIEE");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la declaration");
    } finally {
      setSubmitting(false);
    }
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <AlertTriangle size={20} className="text-amber-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-slate-900 text-xl font-bold">Declaration des Absences</h1>
            <p className="text-slate-500 text-xs">{absences.length} absence(s) declaree(s)</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <X size={16} strokeWidth={1.5} /> : <Plus size={16} strokeWidth={1.5} />}
          {showForm ? "Annuler" : "Nouvelle absence"}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-500" strokeWidth={2} />
          <span className="text-red-600 text-sm">{error}</span>
          <button onClick={() => setError("")} className="ml-auto"><X size={14} className="text-red-400" /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2">
          <CheckCircle size={14} className="text-emerald-500" strokeWidth={2} />
          <span className="text-emerald-600 text-sm">{success}</span>
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="card mb-6 border-2 border-orange-100">
          <h3 className="text-slate-900 text-sm font-bold mb-4">Declarer une absence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-slate-600 text-xs font-medium mb-1 block">Etudiant</label>
              <select
                value={formEtudiant}
                onChange={(e) => setFormEtudiant(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Selectionner...</option>
                {etudiants.map(etu => (
                  <option key={etu.id} value={etu.id}>
                    {etu.nom} {etu.prenom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-600 text-xs font-medium mb-1 block">Element</label>
              <select
                value={formElement}
                onChange={(e) => setFormElement(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Selectionner...</option>
                {elements.map(el => (
                  <option key={el.id} value={el.id}>
                    [{el.filiereCode}] {el.intitule}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-600 text-xs font-medium mb-1 block">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="text-slate-600 text-xs font-medium mb-1 block">Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="input-field text-sm"
              >
                <option value="INJUSTIFIEE">Injustifiee (Art. 39 - Note 0)</option>
                <option value="JUSTIFIEE">Justifiee</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary"
            >
              <CheckCircle size={14} strokeWidth={1.5} />
              {submitting ? "Enregistrement..." : "Enregistrer l'absence"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">
              Annuler
            </button>
          </div>
          {formType === "INJUSTIFIEE" && (
            <p className="mt-3 text-[11px] text-red-500 flex items-center gap-1">
              <AlertTriangle size={11} strokeWidth={2} />
              L'Article 39 sera applique automatiquement : note forcee a 0/20 et verrouillee
            </p>
          )}
        </div>
      )}

      {/* Liste des absences */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100">
          <span className="text-slate-600 text-xs font-medium">{absences.length} absence(s)</span>
        </div>
        {absences.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="text-left text-slate-500 text-xs font-medium px-6 py-3">Etudiant</th>
                <th className="text-left text-slate-500 text-xs font-medium px-6 py-3">Element</th>
                <th className="text-center text-slate-500 text-xs font-medium px-6 py-3">Date</th>
                <th className="text-center text-slate-500 text-xs font-medium px-6 py-3">Type</th>
              </tr>
            </thead>
            <tbody>
              {absences.map((absence) => (
                <tr key={absence.id} className="border-b border-slate-100/80 hover:bg-slate-50/50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <User size={13} className="text-slate-400" strokeWidth={1.5} />
                      <span className="text-slate-800 text-sm font-medium">
                        {absence.etudiantNom} {absence.etudiantPrenom}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-600 text-sm">{absence.elementIntitule}</td>
                  <td className="px-6 py-3 text-center">
                    <span className="text-slate-600 text-sm flex items-center justify-center gap-1">
                      <Calendar size={11} strokeWidth={1.5} />
                      {absence.dateAbsence}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    {absence.type === "INJUSTIFIEE" ? (
                      <span className="badge-danger text-[10px]">
                        <XCircle size={9} className="mr-0.5" />Injustifiee
                      </span>
                    ) : (
                      <span className="badge-success text-[10px]">
                        <CheckCircle size={9} className="mr-0.5" />Justifiee
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-slate-400 text-sm">
            Aucune absence declaree. Cliquez sur "Nouvelle absence" pour commencer.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
