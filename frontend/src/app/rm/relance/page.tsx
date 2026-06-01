"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Mail, Send, Clock, CheckCircle, User } from "lucide-react";

export default function RelancePage() {
  const [sending, setSending] = useState<number | null>(null);

  const enseignantsEnRetard = [
    { id: 1, nom: "BENALI Ahmed", email: "enseignant1@ensias.ma", element: "Java Avance", progression: 30, derniereMaj: "Il y a 5 jours" },
    { id: 2, nom: "ELHASSOUNI Fatima", email: "enseignant2@ensias.ma", element: "Design Patterns", progression: 45, derniereMaj: "Il y a 3 jours" },
  ];

  const handleRelance = (id: number) => {
    setSending(id);
    setTimeout(() => setSending(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <Mail size={20} className="text-orange-600" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-slate-900 text-xl font-bold">Relance des Enseignants</h1>
          <p className="text-slate-500 text-xs">
            Envoyez un rappel aux enseignants en retard sur la saisie
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {enseignantsEnRetard.map((ens) => (
          <div key={ens.id} className="card-hover flex items-center gap-5">
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
              <User size={20} className="text-slate-500" strokeWidth={1.5} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-slate-800 text-sm font-medium">{ens.nom}</p>
              <p className="text-slate-400 text-xs">{ens.email}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Element: {ens.element}
              </p>
            </div>

            <div className="text-center">
              <p className="text-amber-600 text-lg font-bold">{ens.progression}%</p>
              <p className="text-slate-400 text-[10px]">Progression</p>
            </div>

            <div className="text-right">
              <p className="text-slate-400 text-[10px] flex items-center gap-1 mb-2">
                <Clock size={10} strokeWidth={1.5} />
                {ens.derniereMaj}
              </p>
              <button
                onClick={() => handleRelance(ens.id)}
                disabled={sending === ens.id}
                className="btn-primary text-xs py-2 px-3"
              >
                {sending === ens.id ? (
                  <>
                    <CheckCircle size={13} strokeWidth={1.5} />
                    Envoye
                  </>
                ) : (
                  <>
                    <Send size={13} strokeWidth={1.5} />
                    Relancer
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
