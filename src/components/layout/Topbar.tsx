import {
  Bell,
  Languages,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  UserCircle2,
} from "lucide-react";
import { startTransition, useDeferredValue } from "react";
import { useTranslation } from "../../i18n/useTranslation";
import { Language, UserRole } from "../../types";

interface TopbarProps {
  role: UserRole;
  language: Language;
  search: string;
  theme: "dark" | "light";
  onSearch: (value: string) => void;
  onRoleChange: (role: UserRole) => void;
  onLanguageChange: (language: Language) => void;
  onMobileMenu: () => void;
  onLogout?: () => void;
  onThemeToggle: () => void;
}

export function Topbar({
  role,
  language,
  search,
  theme,
  onSearch,
  onRoleChange,
  onLanguageChange,
  onMobileMenu,
  onLogout,
  onThemeToggle,
}: TopbarProps) {
  const deferredSearch = useDeferredValue(search);
  const { t } = useTranslation(language);

  return (
    <header className="glass-panel sticky top-4 z-20 rounded-[28px] px-4 py-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <button
            className="rounded-2xl border border-white/10 p-3 text-slate-200 lg:hidden"
            onClick={onMobileMenu}
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              onChange={(event) =>
                startTransition(() => onSearch(event.target.value))
              }
              placeholder={t("search")}
              value={search}
            />
          </div>
          <div className="hidden rounded-2xl border border-sky-300/20 bg-sky-300/10 px-3 py-2 text-xs text-sky-100 md:block">
            Query focus: {deferredSearch || "global"}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 p-1">
            {(["en", "mn"] as Language[]).map((item) => (
              <button
                key={item}
                className={`rounded-xl px-3 py-2 text-sm transition ${
                  language === item
                    ? "bg-sky-300/15 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                onClick={() => onLanguageChange(item)}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  {item.toUpperCase()}
                </span>
              </button>
            ))}
          </div>

          <button
            className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-200 transition hover:bg-white/10"
            onClick={onThemeToggle}
            type="button"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          <select
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 outline-none"
            onChange={(event) => onRoleChange(event.target.value as UserRole)}
            value={role}
          >
            <option value="admin">{t("adminView")}</option>
            <option value="instructor">{t("instructorView")}</option>
            <option value="student">{t("studentView")}</option>
          </select>

          <button
            className="relative rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-200"
            type="button"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-400" />
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
          >
            <div className="rounded-2xl bg-emerald-300/10 p-2 text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-slate-100">Mission Lead</p>
              <p className="text-xs text-slate-400">Space Science Operations</p>
            </div>
            <UserCircle2 className="h-8 w-8 text-slate-300" />
          </button>
        </div>
      </div>
    </header>
  );
}
