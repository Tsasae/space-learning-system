import { useEffect } from "react";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Rocket } from "lucide-react";
import { instructorNavItems, navigationItems } from "../../data/mockData";
import { useTranslation } from "../../i18n/useTranslation";
import { TranslationKey } from "../../i18n/translations";
import { STUDY_CASES, useCourseStore } from "../../store/courseStore";
import { Language, UserRole, ViewKey } from "../../types";

const NAV_KEY: Record<ViewKey, TranslationKey> = {
  dashboard: "dashboard",
  courses: "courseEnvironment",
  lab: "virtualLab",
  spatial: "spatialData",
  cloudAnalytics: "cloudAnalytics",
  analytics: "analytics",
  jobs: "hpcJobs",
  projects: "projects",
  settings: "settings",
  instructor: "courseEnvironment",
  createCourse: "createCourse",
  myCourses: "myCourses",
  instructorStudents: "instructorStudents",
  instructorAssignments: "instructorAssignments",
};

interface SidebarProps {
  activeView: ViewKey;
  collapsed: boolean;
  language: Language;
  role?: UserRole;
  onSelect: (view: ViewKey) => void;
  onToggle: () => void;
  mobile?: boolean;
}

export function Sidebar({
  activeView,
  collapsed,
  language,
  role,
  onSelect,
  onToggle,
  mobile = false,
}: SidebarProps) {
  const { t } = useTranslation(language);

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("lms_user") || "{}"); } catch { return {}; }
  })();
  const userName = storedUser.name || storedUser.email || "Хэрэглэгч";
  const userRole =
    storedUser.role === "student" ? "Оюутан" :
    storedUser.role === "instructor" ? "Багш" :
    storedUser.role === "admin" ? "Админ" : "Welcome";

  const navItems = role === "instructor" ? instructorNavItems : navigationItems;

  const { activeCase, setActiveCase, getProgressPct, isCompleted, courses, coursesLoading, fetchCourses } = useCourseStore();

  // Fetch courses when student enters course environment
  useEffect(() => {
    if (role !== "student" || activeView !== "courses") return;
    try {
      const u = JSON.parse(localStorage.getItem("lms_user") || "{}");
      if (u.id) fetchCourses(String(u.id));
    } catch { /* ignore */ }
  }, [role, activeView]);

  // Student course environment: replace nav with study cases list
  if (role === "student" && activeView === "courses") {
    // Use API courses when available, fall back to hardcoded STUDY_CASES
    const displayCases = courses.length > 0
      ? courses.map((c, i) => ({
          id: c.id,
          title: `Study Case ${i + 1}`,
          courseName: c.title,
          description: c.description,
          isApiCourse: true,
        }))
      : STUDY_CASES.map((sc) => ({ ...sc, description: sc.courseName, isApiCourse: false }));

    return (
      <aside
        className={`glass-panel rounded-[28px] transition-all duration-300 ${
          mobile
            ? "flex h-full w-full flex-col"
            : "fixed inset-y-4 left-4 z-30 hidden lg:flex lg:flex-col w-72"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="rounded-2xl bg-sky-400/15 p-3 text-sky-300">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-50">Хичээлийн орчин</p>
            <p className="text-xs text-slate-400">
              {courses.length > 0 ? `${courses.length} хичээл` : "Study Cases"}
            </p>
          </div>
        </div>

        {/* Cases list */}
        <nav className="flex-1 overflow-y-auto p-3">
          {coursesLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Ачааллаж байна…
            </div>
          ) : displayCases.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">
              Одоогоор хичээл байхгүй байна
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Хичээлүүд ({displayCases.length})
              </p>
              {displayCases.map((sc) => {
                const pct = getProgressPct(sc.id);
                const done = isCompleted(sc.id);
                const active = activeCase === sc.id;
                return (
                  <button
                    key={sc.id}
                    onClick={() => setActiveCase(sc.id)}
                    type="button"
                    className={`flex w-full flex-col gap-1.5 rounded-2xl px-4 py-3 text-left transition ${
                      active
                        ? "bg-sky-400/15 ring-1 ring-sky-300/30"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${active ? "text-sky-400" : "text-slate-500"}`}>
                        {sc.title}
                      </span>
                      {done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      ) : (
                        <span className="text-xs text-slate-500">{pct}%</span>
                      )}
                    </div>
                    <p className={`truncate text-sm font-medium ${active ? "text-sky-300" : "text-slate-300"}`}>
                      {sc.courseName}
                    </p>
                    <p className="truncate text-[10px] text-slate-500">{sc.description}</p>
                    <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/8">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${done ? "bg-emerald-400" : "bg-sky-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {/* Back link */}
        <div className="border-t border-white/10 p-4">
          <button
            onClick={() => onSelect("dashboard")}
            type="button"
            className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Буцах
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`glass-panel rounded-[28px] transition-all duration-300 ${
        mobile
          ? "flex h-full w-full flex-col"
          : `fixed inset-y-4 left-4 z-30 hidden lg:flex lg:flex-col ${collapsed ? "w-24" : "w-72"}`
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <div className={`flex items-center gap-3 ${collapsed && !mobile ? "justify-center" : ""}`}>
          <div className="rounded-2xl bg-sky-400/15 p-3 text-sky-300">
            <Rocket className="h-5 w-5" />
          </div>
          {(!collapsed || mobile) && (
            <div>
              <p className="text-sm font-semibold text-slate-50">{userName}</p>
              <p className="text-xs text-slate-400">{userRole}</p>
            </div>
          )}
        </div>
        <button
          className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:border-sky-300/30 hover:text-white"
          onClick={onToggle}
          type="button"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.key;
          return (
            <button
              key={item.key}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                active
                  ? "bg-sky-400/15 text-slate-50 ring-1 ring-sky-300/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              } ${collapsed && !mobile ? "justify-center px-0" : ""}`}
              onClick={() => onSelect(item.key)}
              type="button"
            >
              <Icon className="h-5 w-5" />
              {(!collapsed || mobile) && (
                <span className="text-sm font-medium">{t(NAV_KEY[item.key])}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-3xl bg-gradient-to-br from-sky-400/15 to-emerald-400/10 p-4">
          {(!collapsed || mobile) && (
            <>
              <p className="text-xs uppercase tracking-[0.25em] text-sky-200">
                {t("missionControl")}
              </p>
              <p className="mt-2 text-sm text-slate-300">{t("missionControlDesc")}</p>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
