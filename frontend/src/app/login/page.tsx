"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { ChevronRight, User, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import "./login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="ensias-login">
      {/* Background with blur overlay */}
      <div className="ensias-login__overlay" />

      {/* Login Container */}
      <div className="ensias-login__container">
        {/* Left Box - Form */}
        <div className="ensias-login__left">
          {/* Header with logos */}
          <div className="ensias-login__logos">
            <div className="ensias-login__logo-ensias">
              {/* ENSIAS Triangle Logo SVG */}
              <svg width="48" height="48" viewBox="0 0 52.917 52.917" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="ensiasGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ee2927" />
                    <stop offset="100%" stopColor="#ff8848" />
                  </linearGradient>
                </defs>
                <path
                  d="M26.458 5L5 47.917h42.917L26.458 5z"
                  fill="url(#ensiasGrad)"
                  opacity="0.9"
                />
                <path
                  d="M26.458 15L15 42h22.917L26.458 15z"
                  fill="#e5e5e5"
                  opacity="0.6"
                />
              </svg>
            </div>
            <div className="ensias-login__logo-text">
              <span className="ensias-login__brand">SmartAcademicFlow</span>
            </div>
            <div className="ensias-login__logo-um5"></div>
          </div>

          {/* App Header */}
          <div className="ensias-login__app-header">
            <h1>SmartAcademic Portal</h1>
          </div>

          {/* Title */}
          <label className="ensias-login__title">Sign in to your account</label>

          {/* Error */}
          {error && (
            <div className="ensias-login__error">
              <AlertCircle size={14} strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="ensias-login__form">
            {/* Email */}
            <div className="ensias-login__field">
              <label className="ensias-login__label">Email</label>
              <div className="ensias-login__input-wrapper">
                <div className="ensias-login__input-icon">
                  <User size={16} strokeWidth={1.5} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ensias-login__input"
                  placeholder="exemple@ensias.um5.ac.ma"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="ensias-login__field">
              <label className="ensias-login__label">Password</label>
              <div className="ensias-login__input-wrapper">
                <div className="ensias-login__input-icon">
                  <Lock size={16} strokeWidth={1.5} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ensias-login__input"
                  placeholder="password"
                  required
                />
                <button
                  type="button"
                  className="ensias-login__eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={1.5} />
                  ) : (
                    <Eye size={16} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="ensias-login__options">
              <label className="ensias-login__switch-label">
                <div className={`ensias-login__switch ${rememberMe ? "active" : ""}`}
                  onClick={() => setRememberMe(!rememberMe)}>
                  <div className="ensias-login__switch-thumb" />
                </div>
                <span>Remember me</span>
              </label>
            </div>

            {/* Submit */}
            <div className="ensias-login__submit-row">
              <button
                type="submit"
                disabled={loading}
                className="ensias-login__submit-btn"
              >
                <span>{loading ? "Signing in..." : "Sign In"}</span>
                <ChevronRight size={18} strokeWidth={2} />
              </button>
            </div>
          </form>

          {/* Separator */}
          <div className="ensias-login__separator">
            <div className="ensias-login__separator-line" />
            <label>Or sign in with</label>
            <div className="ensias-login__separator-line" />
          </div>

          {/* Social login placeholder */}
          <div className="ensias-login__social">
            <button type="button" className="ensias-login__social-btn">
              <svg width="16" height="16" viewBox="0 0 21 21" fill="none">
                <path d="M0 0h10v10H0zM11 0h10v10H11zM0 11h10v10H0zM11 11h10v10H11z" fill="#424344"/>
              </svg>
              <span>Microsoft</span>
            </button>
            <button type="button" className="ensias-login__social-btn">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Google</span>
            </button>
          </div>

          {/* Demo credentials */}
          <div className="ensias-login__demo">
            <p className="ensias-login__demo-title">Demo accounts :</p>
            <div className="ensias-login__demo-list">
              <span>enseignant1@ensias.ma</span>
              <span>responsable@ensias.ma</span>
              <span>chef@ensias.ma</span>
              <span>scolarite@ensias.ma</span>
              <span style={{ opacity: 0.6 }}>Password: password123</span>
            </div>
          </div>
        </div>

        {/* Right Box - Decorative */}
        <div className="ensias-login__right">
          <div className="ensias-login__right-content">
            <svg width="120" height="120" viewBox="0 0 52.917 52.917" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="ensiasGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ee2927" />
                  <stop offset="100%" stopColor="#ff8848" />
                </linearGradient>
              </defs>
              <path
                d="M26.458 5L5 47.917h42.917L26.458 5z"
                fill="url(#ensiasGrad2)"
                opacity="0.87"
              />
              <path
                d="M26.458 18L16 42h20.917L26.458 18z"
                fill="rgba(255,255,255,0.3)"
              />
            </svg>
            <h2>SmartAcademicFlow</h2>
            <p>Plateforme de gestion academique intelligente</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="ensias-login__footer">
        <span>&copy; L&apos;Ecole Nationale Superieure d&apos;Informatique et d&apos;Analyse des Systemes</span>
      </footer>
    </div>
  );
}
