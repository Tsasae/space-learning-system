import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Language, UserRole, ViewKey } from "../../types";

interface DashboardLayoutProps {
  children: ReactNode;
  activeView: ViewKey;
  role: UserRole;
  language: Language;
  search: string;
  sidebarCollapsed: boolean;
  theme: "dark" | "light";
  onViewChange: (view: ViewKey) => void;
  onSidebarToggle: () => void;
  onRoleChange: (role: UserRole) => void;
  onLanguageChange: (language: Language) => void;
  onSearch: (value: string) => void;
  onLogout?: () => void;
  onThemeToggle: () => void;
}

export function DashboardLayout(props: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-hero-grid px-4 py-4 text-slate-100">
      <Sidebar
        activeView={props.activeView}
        collapsed={props.sidebarCollapsed}
        language={props.language}
        role={props.role}
        onSelect={(view) => {
          props.onViewChange(view);
          setMobileOpen(false);
        }}
        onToggle={props.onSidebarToggle}
      />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden">
          <div className="h-full w-80 max-w-[85vw] p-4">
            <div className="glass-panel h-full rounded-[28px] p-2">
              <Sidebar
                activeView={props.activeView}
                collapsed={false}
                language={props.language}
                role={props.role}
                mobile
                onSelect={(view) => {
                  props.onViewChange(view);
                  setMobileOpen(false);
                }}
                onToggle={() => setMobileOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      <main
        className={`transition-all duration-300 ${
          props.sidebarCollapsed ? "lg:ml-28" : "lg:ml-80"
        }`}
      >
        <div className="mx-auto max-w-[1600px] space-y-6">
          <Topbar
            language={props.language}
            onLanguageChange={props.onLanguageChange}
            onLogout={props.onLogout}
            onMobileMenu={() => setMobileOpen(true)}
            onRoleChange={props.onRoleChange}
            onSearch={props.onSearch}
            onThemeToggle={props.onThemeToggle}
            role={props.role}
            search={props.search}
            theme={props.theme}
          />
          <div className="pb-8">{props.children}</div>
        </div>
      </main>
    </div>
  );
}
