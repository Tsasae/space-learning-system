import { API_URL } from '../../config';
import { useState } from "react";
import { AlertCircle, Eye, EyeOff, Lock, Mail, Rocket, User } from "lucide-react";
import { useTranslation } from "../../i18n/useTranslation";
import { AuthUser, Language } from "../../types";

type Mode = "login" | "register";

const ROLE_DESTINATION: Record<string, string> = {
  admin: "Admin Dashboard",
  instructor: "Instructor Panel",
  student: "Learning Dashboard",
};

interface LoginPageProps {
  onLogin: (user: AuthUser, token: string) => void;
  language?: Language;
}

// ─── Decorative star positions (deterministic, no random on each render) ──────
const STARS = Array.from({ length: 28 }, (_, i) => ({
  top: `${(i * 37 + 7) % 95}%`,
  left: `${(i * 53 + 11) % 95}%`,
  size: i % 3 === 0 ? 3 : 2,
  opacity: 0.15 + (i % 5) * 0.08,
}));

export function LoginPage({ onLogin, language = "en" }: LoginPageProps) {
  const { t } = useTranslation(language);
  const [mode, setMode] = useState<Mode>("login");
  const [welcome, setWelcome] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  // Register fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"student" | "instructor">("student");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setShowPassword(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Invalid email or password");
      }
      const { token, user }: { token: string; user: AuthUser } = await res.json();
      localStorage.setItem("lms_token", token);
      localStorage.setItem("lms_user", JSON.stringify(user));
      setWelcome(user);
      setTimeout(() => onLogin(user, token), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!agreedToTerms) {
      setError("Please agree to the Terms and Privacy Policy");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          name: `${firstName} ${lastName}`.trim(),
          role: regRole,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Registration failed");
      }
      const { token, user }: { token: string; user: AuthUser } = await res.json();
      localStorage.setItem("lms_token", token);
      localStorage.setItem("lms_user", JSON.stringify(user));
      setWelcome(user);
      setTimeout(() => onLogin(user, token), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const leftHeading = mode === "login" ? t("welcomeBack") : t("letsGetStarted");
  const leftSub =
    mode === "login"
      ? "Continue your lunar science journey"
      : "Join the Lunar Cloud LMS community";

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel ────────────────────────────────────────────────────── */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-12 md:flex">
        {/* Stars */}
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{ width: s.size, height: s.size, top: s.top, left: s.left, opacity: s.opacity }}
          />
        ))}
        {/* Glow orbs */}
        <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -right-24 bottom-1/4 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="rounded-2xl bg-sky-400/15 p-3 text-sky-300">
            <Rocket className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Lunar Cloud LMS</p>
            <p className="text-xs text-slate-400">NASA-grade learning console</p>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative space-y-4">
          <h1 className="text-4xl font-bold leading-tight text-white">{leftHeading}</h1>
          <p className="text-lg text-slate-400">{leftSub}</p>
          <div className="flex gap-2 pt-2">
            <div className="h-1.5 w-8 rounded-full bg-sky-400" />
            <div className="h-1.5 w-3 rounded-full bg-white/20" />
            <div className="h-1.5 w-3 rounded-full bg-white/20" />
          </div>
        </div>

        <p className="relative text-xs text-slate-500">
          Advancing planetary science through collaborative AI education
        </p>
      </div>

      {/* ── Right panel ───────────────────────────────────────────────────── */}
      <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-gray-900 px-8 py-12 md:w-1/2">
        <div className="w-full max-w-md space-y-6">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 md:hidden">
            <div className="rounded-2xl bg-sky-400/15 p-2.5 text-sky-300">
              <Rocket className="h-5 w-5" />
            </div>
            <p className="font-semibold text-white">Lunar Cloud LMS</p>
          </div>

          {welcome ? (
            /* ── Welcome / redirect ─────────────────────────────────────── */
            <div className="space-y-5 py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                <Rocket className="h-7 w-7" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">Welcome, {welcome.name}!</p>
                <p className="mt-2 text-sm text-slate-400">
                  Redirecting to {ROLE_DESTINATION[welcome.role] ?? "Dashboard"}...
                </p>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-[1200ms] ease-in-out"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          ) : mode === "login" ? (
            /* ── Login form ─────────────────────────────────────────────── */
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <h2 className="text-3xl font-bold text-white">{t("login")}</h2>
                <p className="mt-1 text-sm text-slate-400">Access your mission workspace</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {/* Email */}
                <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder={t("email")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </div>
                {/* Password */}
                <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3">
                  <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder={t("password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="shrink-0 text-slate-400 transition hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-slate-400">
                  <input
                    type="checkbox"
                    checked={keepLoggedIn}
                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                    className="accent-sky-500"
                  />
                  Keep me logged in
                </label>
                <button type="button" className="text-sky-400 transition hover:text-sky-300">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : t("login")}
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-slate-500">OR</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <p className="text-center text-sm text-slate-400">
                {t("dontHaveAccount")}{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="font-semibold text-sky-400 transition hover:text-sky-300"
                >
                  {t("register")}
                </button>
              </p>
            </form>
          ) : (
            /* ── Register form ──────────────────────────────────────────── */
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <h2 className="text-3xl font-bold text-white">{t("register")}</h2>
                <p className="mt-1 text-sm text-slate-400">Join the Lunar Cloud LMS community</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3">
                    <User className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder={t("firstName")}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    />
                  </div>
                  <div className="flex items-center rounded-xl border border-white/20 bg-white/5 px-4 py-3">
                    <input
                      type="text"
                      required
                      placeholder={t("lastName")}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>
                {/* Email */}
                <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder={t("email")}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </div>
                {/* Password */}
                <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3">
                  <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder={t("password")}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="shrink-0 text-slate-400 transition hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Role */}
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as "student" | "instructor")}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="student" className="bg-gray-900">{t("student")}</option>
                  <option value="instructor" className="bg-gray-900">{t("instructor")}</option>
                </select>
              </div>

              {/* Terms */}
              <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 accent-sky-500"
                />
                <span>
                  I agree with{" "}
                  <span className="text-sky-400">Terms</span> and{" "}
                  <span className="text-sky-400">Privacy Policy</span>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : t("register")}
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-slate-500">OR</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <p className="text-center text-sm text-slate-400">
                {t("alreadyHaveAccount")}{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-semibold text-sky-400 transition hover:text-sky-300"
                >
                  {t("login")}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
