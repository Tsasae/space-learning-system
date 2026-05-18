import { LucideIcon } from "lucide-react";

export type Language = "en" | "mn";
export type UserRole = "admin" | "instructor" | "student";
export type ViewKey =
  | "dashboard"
  | "courses"
  | "lab"
  | "spatial"
  | "cloudAnalytics"
  | "settings"
  | "instructor"
  | "createCourse"
  | "myCourses"
  | "instructorStudents"
  | "instructorAssignments";

export interface NavItem {
  key: ViewKey;
  label: string;
  icon: LucideIcon;
}

export interface MetricCardData {
  title: string;
  value: string;
  delta: string;
  tone: "accent" | "success" | "warning";
}

export interface TimelinePoint {
  name: string;
  cpu: number;
  response: number;
  sessions: number;
}

export interface ModuleUnit {
  title: string;
  topics: string[];
  ai: string[];
  practice: string[];
  progress: number;
}

export interface DatasetItem {
  id: string;
  name: string;
  satellite: string;
  date: string;
  coords: string;
  type: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

