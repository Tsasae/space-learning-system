import { startTransition, useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { LoginPage } from "./components/auth/LoginPage";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { RoleDashboard } from "./components/dashboards/RoleDashboard";
import { AnalyticsPanel } from "./components/views/AnalyticsPanel";
import { CourseEnvironment } from "./components/views/CourseEnvironment";
import { HPCJobsPanel } from "./components/views/HPCJobsPanel";
import { LabEditor } from "./components/views/LabEditor";
import { MapViewer } from "./components/views/MapViewer";
import { ProjectsPanel } from "./components/views/ProjectsPanel";
import { SettingsPanel } from "./components/views/SettingsPanel";
import { InstructorDashboard } from "./components/views/InstructorDashboard";
import CloudAnalytics from "./pages/CloudAnalytics";
import CreateCourse from "./pages/instructor/CreateCourse";
import MyCourses from "./pages/instructor/MyCourses";
import StudentsPage from "./pages/instructor/Students";
import { StudentDashboard } from "./components/views/StudentDashboard";
import { StudentDashboardHome } from "./components/views/StudentDashboardHome";
import { useUIStore } from "./store/uiStore";
import { AuthUser, ViewKey } from "./types";

function App() {
  const {
    activeView,
    role,
    language,
    search,
    sidebarCollapsed,
    theme,
    setActiveView,
    setLanguage,
    setRole,
    toggleSidebar,
    setSearch,
    toggleTheme,
  } = useUIStore();

  const storedToken = localStorage.getItem('lms_token');
  const [isAuthenticated, setIsAuthenticated] = useState(!!storedToken);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("lms_token");
    const stored = localStorage.getItem("lms_user");
    if (token && stored) {
      try {
        const user: AuthUser = JSON.parse(stored);
        setCurrentUser(user);
        setIsAuthenticated(true);
        setRole(user.role);
      } catch {
        localStorage.removeItem("lms_token");
        localStorage.removeItem("lms_user");
      }
    }

    const path = window.location.pathname;
    if (path.includes('virtual-lab')) {
      setActiveView('lab');
    }
  }, []);

  useEffect(() => {
    document.body.className = theme === "light" ? "light" : "dark";
  }, [theme]);

  function handleLogin(user: AuthUser) {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setRole(user.role);
  }

  function handleLogout() {
    localStorage.removeItem("lms_token");
    localStorage.removeItem("lms_user");
    setIsAuthenticated(false);
    setCurrentUser(null);
  }

  const renderView = (view: ViewKey) => {
    switch (view) {
      case "dashboard":
        if (role === 'student') return <StudentDashboardHome />;
        return <RoleDashboard role={role} />;
      case "courses":
        if (role === 'instructor' || role === 'admin') return <InstructorDashboard />;
        if (role === 'student') return <StudentDashboard />;
        return <CourseEnvironment />;
      case "lab":
        return <LabEditor language={language} />;
      case "spatial":
        return <MapViewer language={language} />;
      case "cloudAnalytics":
        return <CloudAnalytics />;
      case "createCourse":
        return <CreateCourse />;
      case "myCourses":
        return <MyCourses />;
      case "instructorStudents":
        return <StudentsPage />;
      case "instructorAssignments":
        return <InstructorDashboard />;
      case "analytics":
        return <AnalyticsPanel />;
      case "jobs":
        return <HPCJobsPanel />;
      case "projects":
        return <ProjectsPanel />;
      case "settings":
        return <SettingsPanel />;
      case "instructor":
        return <InstructorDashboard />;
      default:
        return <RoleDashboard role={role} />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} language={language} />;
  }

  return (
    <BrowserRouter>
      <DashboardLayout
        activeView={activeView}
        language={language}
        onLanguageChange={setLanguage}
        onLogout={handleLogout}
        onRoleChange={setRole}
        onSearch={setSearch}
        onSidebarToggle={toggleSidebar}
        onThemeToggle={toggleTheme}
        onViewChange={(view) => startTransition(() => setActiveView(view))}
        role={role}
        search={search}
        sidebarCollapsed={sidebarCollapsed}
        theme={theme}
      >
        {renderView(activeView)}
      </DashboardLayout>
    </BrowserRouter>
  );
}

export default App;
