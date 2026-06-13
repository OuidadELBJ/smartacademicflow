"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { Mail, Send, Clock, CheckCircle, User, AlertTriangle } from "lucide-react";

interface EnseignantEnRetard {
  elementId: number;
  elementIntitule: string;
  enseignantNom: string;
  enseignantEmail: string;
  notesSaisies: number;
  totalEtudiants: number;
  progression: number;
  moduleIntitule: string;
  semestre: string;
}

export default function RelancePage() {
  const [sending, setSending] = useState<number | null>(null);
  const [sent, setSent] = useState<Set<number>>(new Set());
  const [enseignants, setEnseignants] = useState<EnseignantEnRetard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchEnseignantsEnRetard();
  }, []);

  const fetchEnseignantsEnRetard = async () => {
    try {
      const res = await api.get("/rm/dashboard");
      const data = res.data;
      // Filtrer les elements avec progression < 100%
      const enRetard = (data.elementsProgress || []).filter(
        (el: EnseignantEnRetard) => el.progression < 100
      );
      setEnseignants(enRetard);
    } catch (err: any) {
      setError("Erreur lors du chargement des donnees");
    } finally {
      setLoading(false);
    }
  };

  const handleRelance = async (ens: EnseignantEnRetard) => {
    setSending(ens.elementId);
    setError("");
    setSuccess("");
    try {
      await api.post("/rm/relance", {
        email: ens.enseignantEmail,
        enseignantNom: ens.enseignantNom,
        moduleIntitule: ens.moduleIntitule,
        elementIntitule: ens.elementIntitule,
      });
      setSent((prev) => {
        const s = new Set(Array.from(prev));
        s.add(ens.elementId);
        return s;
      });
      setSuccess(`Relance envoyee a ${ens.enseignantNom} pour "${ens.elementIntitule}"`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi de la relance");
    } finally {
      setSending(null);
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
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <Mail size={20} className="text-orange-600" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-slate-900 text-xl font-bold">Relance des Enseignants</h1>
          <p className="text-slate-500 text-xs">Envoyez un rappel aux enseignants en retard sur la saisie</p>
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

      {enseignants.length === 0 ? (
        <div className="card py-12 text-center">
          <CheckCircle size={40} className="text-emerald-200 mx-auto mb-3" strokeWidth={1} />
          <p className="text-slate-400 text-sm">Tous les enseignants sont a jour !</p>
        </div>
      ) : (
        <div className="space-y-4">
          {enseignants.map((ens) => (
            <div key={ens.elementId} className="card-hover flex items-center gap-5">
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
                <User size={20} className="text-slate-500" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 text-sm font-medium">{ens.enseignantNom}</p>
                <p className="text-slate-400 text-xs">{ens.enseignantEmail}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Element: {ens.elementIntitule} | Module: {ens.moduleIntitule} | {ens.semestre}
                </p>
              </div>
              <div className="text-center">
                <p className="text-amber-600 text-lg font-bold">{ens.progression}%</p>
                <p className="text-slate-400 text-[10px]">Progression</p>
                <p className="text-slate-400 text-[10px]">{ens.notesSaisies}/{ens.totalEtudiants} notes</p>
              </div>
              <div className="text-right">
                {sent.has(ens.elementId) ? (
                  <button disabled className="btn-primary text-xs py-2 px-3 opacity-60">
                    <CheckCircle size={13} strokeWidth={1.5} />
                    Envoye
                  </button>
                ) : (
                  <button
                    onClick={() => handleRelance(ens)}
                    disabled={sending === ens.elementId}
                    className="btn-primary text-xs py-2 px-3"
                  >
                    {sending === ens.elementId ? (
                      <>...</>
                    ) : (
                      <>
                        <Send size={13} strokeWidth={1.5} />
                        Relancer
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
