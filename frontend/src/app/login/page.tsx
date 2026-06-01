"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { GraduationCap, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const data = response.data;

      login({
        userId: data.userId,
        email: data.email,
        nom: data.nom,
        prenom: data.prenom,
        role: data.role,
        token: data.token,
      });

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-900 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400/10 rounded-full translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <GraduationCap size={22} className="text-white" strokeWidth={1.5} />
            </div>
            <span className="text-white font-bold text-lg">SmartAcademicFlow</span>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-white text-3xl font-bold leading-tight mb-4">
            Plateforme de gestion
            <br />
            academique intelligente
          </h2>
          <p className="text-blue-200 text-base leading-relaxed max-w-md">
            Numerisez votre workflow academique. Saisie des notes, deliberations,
            suivi en temps reel et assistance IA pour vos decisions.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6">
          <div className="text-center">
            <p className="text-white text-2xl font-bold">4</p>
            <p className="text-blue-300 text-xs">Roles RBAC</p>
          </div>
          <div className="w-px h-8 bg-blue-700" />
          <div className="text-center">
            <p className="text-white text-2xl font-bold">IA</p>
            <p className="text-blue-300 text-xs">Assistee</p>
          </div>
          <div className="w-px h-8 bg-blue-700" />
          <div className="text-center">
            <p className="text-white text-2xl font-bold">100%</p>
            <p className="text-blue-300 text-xs">Tracabilite</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-slate-900 text-2xl font-bold mb-2">
              Connexion
            </h1>
            <p className="text-slate-500 text-sm">
              Accedez a votre espace de travail
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle size={16} className="text-red-500" strokeWidth={1.5} />
              <span className="text-red-600 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  strokeWidth={1.5}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="nom@ensias.ma"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 text-sm font-medium mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  strokeWidth={1.5}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11"
                  placeholder="Votre mot de passe"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? (
                <span className="animate-pulse">Connexion...</span>
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={16} strokeWidth={1.5} />
                </>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 rounded-xl bg-slate-100/80 border border-slate-200/60">
            <p className="text-slate-600 text-xs font-medium mb-2">
              Comptes de demonstration :
            </p>
            <div className="space-y-1 text-[11px] text-slate-500 font-mono">
              <p>enseignant1@ensias.ma / password123</p>
              <p>responsable@ensias.ma / password123</p>
              <p>chef@ensias.ma / password123</p>
              <p>scolarite@ensias.ma / password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
