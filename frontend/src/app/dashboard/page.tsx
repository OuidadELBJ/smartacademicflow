"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/store";
import {
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Activity,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    {
      label: "Modules en cours",
      value: "4",
      icon: <BookOpen size={20} className="text-blue-600" strokeWidth={1.5} />,
      change: "+2 ce semestre",
      bgColor: "bg-blue-50",
    },
    {
      label: "Elements assignes",
      value: "8",
      icon: <Users size={20} className="text-emerald-600" strokeWidth={1.5} />,
      change: "100% actifs",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Progression",
      value: "67%",
      icon: <TrendingUp size={20} className="text-violet-600" strokeWidth={1.5} />,
      change: "+12% cette semaine",
      bgColor: "bg-violet-50",
    },
    {
      label: "En retard",
      value: "2",
      icon: <Clock size={20} className="text-amber-600" strokeWidth={1.5} />,
      change: "Relance envoyee",
      bgColor: "bg-amber-50",
    },
  ];

  const recentActivities = [
    {
      action: "Note saisie",
      detail: "Java Avance - ETUDIANT_3",
      time: "Il y a 5 min",
      icon: <CheckCircle size={14} className="text-emerald-500" strokeWidth={1.5} />,
    },
    {
      action: "Absence declaree",
      detail: "Design Patterns - ETUDIANT_1",
      time: "Il y a 20 min",
      icon: <AlertTriangle size={14} className="text-amber-500" strokeWidth={1.5} />,
    },
    {
      action: "Rachat effectue",
      detail: "Java Avance - ETUDIANT_5 (8.5 -> 10)",
      time: "Il y a 1h",
      icon: <Activity size={14} className="text-blue-500" strokeWidth={1.5} />,
    },
  ];

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-slate-900 text-2xl font-bold">
          Bonjour, {user?.prenom || "Utilisateur"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Voici un apercu de votre activite academique
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium">{stat.label}</p>
                <p className="text-slate-900 text-2xl font-bold mt-1">
                  {stat.value}
                </p>
                <p className="text-slate-400 text-[11px] mt-1">{stat.change}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progression Chart Placeholder */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-slate-900 text-base font-bold">
              Progression de la saisie
            </h2>
            <BarChart3 size={18} className="text-slate-400" strokeWidth={1.5} />
          </div>

          {/* Progress bars */}
          <div className="space-y-4">
            {[
              { name: "Java Avance", progress: 80, teacher: "A. BENALI" },
              { name: "Design Patterns", progress: 45, teacher: "F. ELHASSOUNI" },
              { name: "Bases de Donnees", progress: 100, teacher: "K. MOULINE" },
              { name: "Reseaux", progress: 20, teacher: "H. ZIDANI" },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-slate-700 text-sm font-medium truncate">
                      {item.name}
                    </p>
                    <span className="text-slate-500 text-xs">{item.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.progress === 100
                          ? "bg-emerald-500"
                          : item.progress < 50
                          ? "bg-amber-400"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">{item.teacher}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-slate-900 text-base font-bold mb-4">
            Activite recente
          </h2>
          <div className="space-y-4">
            {recentActivities.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center mt-0.5">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 text-sm font-medium">
                    {activity.action}
                  </p>
                  <p className="text-slate-400 text-xs truncate">
                    {activity.detail}
                  </p>
                  <p className="text-slate-300 text-[10px] mt-0.5">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
