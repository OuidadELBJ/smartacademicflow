"use client";

import { useAuthStore, Role } from "@/lib/store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  LayoutDashboard,
  FileText,
  Users,
  Mail,
  Scale,
  Shield,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  LogOut,
  ClipboardList,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Role[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={20} strokeWidth={1.5} />,
    roles: ["ENS", "RM", "CF", "SCO"],
  },
  {
    label: "Saisie des Notes",
    href: "/enseignant/notes",
    icon: <BookOpen size={20} strokeWidth={1.5} />,
    roles: ["ENS"],
  },
  {
    label: "Absences",
    href: "/enseignant/absences",
    icon: <AlertTriangle size={20} strokeWidth={1.5} />,
    roles: ["ENS"],
  },
  {
    label: "Mes Relances",
    href: "/enseignant/relances",
    icon: <Mail size={20} strokeWidth={1.5} />,
    roles: ["ENS"],
  },
  {
    label: "Historique Notes",
    href: "/enseignant/historique",
    icon: <FileText size={20} strokeWidth={1.5} />,
    roles: ["ENS"],
  },
  {
    label: "Suivi Avancement",
    href: "/rm/suivi",
    icon: <ClipboardList size={20} strokeWidth={1.5} />,
    roles: ["RM"],
  },
  {
    label: "Etudiants & Rattrapage",
    href: "/rm/etudiants",
    icon: <Users size={20} strokeWidth={1.5} />,
    roles: ["RM"],
  },
  {
    label: "Deliberation & Rachat",
    href: "/rm/deliberation",
    icon: <Scale size={20} strokeWidth={1.5} />,
    roles: ["RM"],
  },
  {
    label: "Relance Enseignants",
    href: "/rm/relance",
    icon: <Mail size={20} strokeWidth={1.5} />,
    roles: ["RM"],
  },
  {
    label: "Assistant IA",
    href: "/rm/chatbot",
    icon: <MessageSquare size={20} strokeWidth={1.5} />,
    roles: ["RM"],
  },
  {
    label: "Supervision Filiere",
    href: "/cf/supervision",
    icon: <Users size={20} strokeWidth={1.5} />,
    roles: ["CF"],
  },
  {
    label: "Notes Recues",
    href: "/cf/notes-recues",
    icon: <Download size={20} strokeWidth={1.5} />,
    roles: ["CF"],
  },
  {
    label: "Validation PV",
    href: "/cf/validation-pv",
    icon: <CheckCircle size={20} strokeWidth={1.5} />,
    roles: ["CF"],
  },
  {
    label: "Certificats Medicaux",
    href: "/scolarite/certificats",
    icon: <Upload size={20} strokeWidth={1.5} />,
    roles: ["SCO"],
  },
  {
    label: "Export Apogee",
    href: "/scolarite/export",
    icon: <Download size={20} strokeWidth={1.5} />,
    roles: ["SCO"],
  },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  if (!user) return null;

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const roleLabels: Record<Role, string> = {
    ENS: "Enseignant",
    RM: "Responsable Module",
    CF: "Chef de Filiere",
    SCO: "Scolarite",
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col z-50" style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)" }}>
      {/* Header */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ee2927, #ff8848)" }}>
            <svg width="18" height="18" viewBox="0 0 52.917 52.917" xmlns="http://www.w3.org/2000/svg">
              <path d="M26.458 5L5 47.917h42.917L26.458 5z" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">
              SmartAcademic
            </h1>
            <p className="text-white/40 text-[11px]">Flow Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "text-white shadow-sm"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
              style={isActive ? { background: "linear-gradient(135deg, rgba(238,41,39,0.8), rgba(255,136,72,0.8))" } : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Shield size={16} className="text-white/60" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {user.prenom} {user.nom}
            </p>
            <p className="text-white/40 text-[10px]">
              {roleLabels[user.role]}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-white/40 hover:text-white text-xs transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-white/5"
        >
          <LogOut size={14} strokeWidth={1.5} />
          <span>Deconnexion</span>
        </button>
      </div>
    </aside>
  );
}
