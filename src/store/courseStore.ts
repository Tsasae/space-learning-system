import { API_URL } from '../config';
import { create } from "zustand";

export interface CaseProgress {
  materialViewed: boolean;
  exerciseSubmitted: boolean;
  quizPassed: boolean;
  certificateIssued: boolean;
}

export interface CourseFromApi {
  id: number;
  title: string;
  description: string;
  parts: any[] | null;
  materials: any;
  assignment: any;
  quiz: any;
  material_viewed: boolean;
  exercise_submitted: boolean;
  quiz_score: number | null;
  certificate_issued: boolean;
  progress: number;
}

// Kept as offline / empty-DB fallback
export interface StudyCase {
  id: number;
  title: string;
  courseName: string;
}

export const STUDY_CASES: StudyCase[] = [
  { id: 1, title: "Study Case 1", courseName: "AI Applications in Lunar and Planetary Science" },
  { id: 2, title: "Study Case 2", courseName: "Remote Sensing & Crater Detection" },
  { id: 3, title: "Study Case 3", courseName: "HPC Fundamentals & Parallel Computing" },
  { id: 4, title: "Study Case 4", courseName: "AI/ML: CNN, Autoencoders & Transformers" },
  { id: 5, title: "Study Case 5", courseName: "Capstone: Crater Catalog & Site Selection" },
];

const defaultProgress = (): CaseProgress => ({
  materialViewed: false,
  exerciseSubmitted: false,
  quizPassed: false,
  certificateIssued: false,
});

interface CourseState {
  activeCase: number;
  courses: CourseFromApi[];
  coursesLoading: boolean;
  caseProgress: Record<number, CaseProgress>;

  setActiveCase: (id: number) => void;
  fetchCourses: (studentId: string) => Promise<void>;
  updateProgress: (caseId: number, patch: Partial<CaseProgress>) => void;
  getProgressPct: (caseId: number) => number;
  isCompleted: (caseId: number) => boolean;
  getActiveCourse: () => CourseFromApi | null;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  activeCase: 0,
  courses: [],
  coursesLoading: false,
  caseProgress: {
    1: defaultProgress(),
    2: defaultProgress(),
    3: defaultProgress(),
    4: defaultProgress(),
    5: defaultProgress(),
  },

  setActiveCase: (id) => set({ activeCase: id }),

  fetchCourses: async (studentId: string) => {
    set({ coursesLoading: true });
    try {
      const res = await fetch(
        `${API_URL}/api/courses/my-progress?student_id=${encodeURIComponent(studentId)}`
      );
      const json = await res.json();
      if (json.success) {
        const courses: CourseFromApi[] = json.data ?? [];
        set((state) => ({
          courses,
          // Auto-select first course only if nothing is selected yet
          activeCase:
            state.activeCase === 0 && courses.length > 0
              ? courses[0].id
              : state.activeCase,
        }));
      }
    } catch {
      // keep existing state on network failure
    } finally {
      set({ coursesLoading: false });
    }
  },

  updateProgress: (caseId, patch) =>
    set((state) => ({
      caseProgress: {
        ...state.caseProgress,
        [caseId]: { ...(state.caseProgress[caseId] ?? defaultProgress()), ...patch },
      },
    })),

  getProgressPct: (caseId) => {
    // Prefer live API data if available
    const course = get().courses.find((c) => c.id === caseId);
    if (course) return course.progress;
    // Fallback to local milestone tracking
    const p = get().caseProgress[caseId] ?? defaultProgress();
    const steps = [p.materialViewed, p.exerciseSubmitted, p.quizPassed, p.certificateIssued];
    return Math.round((steps.filter(Boolean).length / 4) * 100);
  },

  isCompleted: (caseId) => {
    const course = get().courses.find((c) => c.id === caseId);
    if (course) return course.certificate_issued;
    const p = get().caseProgress[caseId] ?? defaultProgress();
    return p.materialViewed && p.exerciseSubmitted && p.quizPassed && p.certificateIssued;
  },

  getActiveCourse: () => {
    const { activeCase, courses } = get();
    return courses.find((c) => c.id === activeCase) ?? null;
  },
}));
