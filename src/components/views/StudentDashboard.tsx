import { API_URL } from '../../config';
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Download,
  ExternalLink,
  FlaskConical,
  Loader2,
  Paperclip,
  Send,
  Trophy,
} from "lucide-react";
import { SectionHeader } from "../common/SectionHeader";
import { STUDY_CASES, useCourseStore } from "../../store/courseStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStudentInfo(): { id: string; name: string } {
  try {
    const u = JSON.parse(localStorage.getItem("lms_user") || "{}");
    return { id: u.id ?? "", name: u.name ?? "Оюутан" };
  } catch {
    return { id: "", name: "Оюутан" };
  }
}

function today(): string {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// ─── API Types ────────────────────────────────────────────────────────────────

interface ApiContentItem {
  id: string;
  title: string;
  file_url?: string;
  link_url?: string;
  file_type?: string;
  link_type?: string;
  content_type: string;
  instructor_name?: string;
  created_at: string;
}

interface ProgressRecord {
  part_number: number;
  part_title: string;
  completed: boolean;
}

interface SubmissionRecord {
  id: string;
  exercise_type: string;
  accuracy?: number;
  submitted_at: string;
  grade?: number;
  feedback_comment?: string;
  instructor_name?: string;
}

// ─── Course Data ──────────────────────────────────────────────────────────────

const STUDY_PARTS = [
  {
    number: 1,
    title: "Introduction to AI in Planetary Science",
    bullets: ["Why Study the Moon?", "Crater Dating Importance", "Resource Exploration", "AI in NASA & ESA", "Why AI?"],
    exercise: { id: "exercise-crater-cnn", title: "Exercise 1: CNN Crater Classification" },
  },
  {
    number: 2,
    title: "AI-Based Crater Chronology",
    bullets: ["What is Crater Chronology?", "Surface Age Estimation", "CNN + Regression Pipeline", "Example: ResNet18 Age Prediction"],
    exercise: { id: "exercise-rf-vs-nn", title: "Exercise 2: RF vs Neural Network" },
  },
  {
    number: 3,
    title: "Volcanic Structure Detection",
    bullets: ["Lava Plains (Maria)", "Volcanic Domes", "Pyroclastic Deposits", "CNN Binary Classification"],
    exercise: { id: "exercise-surrogate", title: "Exercise 3: Surrogate Model" },
  },
  {
    number: 4,
    title: "AI Surrogate Models",
    bullets: ["What is a Surrogate Model?", "Physics Simulation → Dataset → NN", "Fast Predictions", "Example: MLPRegressor"],
    exercise: { id: "surrogate", title: "Exercise 4: Surrogate Physics Model" },
  },
  {
    number: 5,
    title: "Isotope & Terrain Classification",
    bullets: ["Isotope Data Overview", "Random Forest Classification", "3 Terrain Classes", "Accuracy Evaluation"],
    exercise: { id: "terrain-rf", title: "Exercise 5: Terrain Classification" },
  },
  {
    number: 6,
    title: "Challenges & Conclusion",
    bullets: ["Limited Labeled Data", "Class Imbalance", "Overfitting", "AI Transforms Planetary Science"],
    exercise: null,
  },
];

const EXERCISES = [
  {
    id: "crater-cnn",
    title: "Exercise 1: CNN Crater Classification",
    desc: "NASA NEO өгөгдөл дээр Random Forest ашиглан asteroid classification хийх",
  },
  {
    id: "rf-vs-nn",
    title: "Exercise 2: Random Forest vs Neural Network",
    desc: "Crater feature дээр RF болон MLP моделийг харьцуулах",
  },
  {
    id: "surrogate",
    title: "Exercise 3: Surrogate Physics Model",
    desc: "Физикийн тэгшитгэлийг MLPRegressor-ээр ойролцоолох",
  },
];

// ─── Quiz Data ────────────────────────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    id: 1,
    q: "Machine Learning-д Random Forest алгоритм юунд ашиглагддаг вэ?",
    opts: ["Зургийн боловсруулалт", "Ангилал болон регресс", "Текст боловсруулалт", "Дуу таних"],
    correct: 1,
  },
  {
    id: 2,
    q: "CNN архитектурт конволюцийн давхарга юу хийдэг вэ?",
    opts: ["Өгөгдөл хадгалах", "Сүлжээ холбох", "Онцлог илрүүлэх", "Алдаа засах"],
    correct: 2,
  },
  {
    id: 3,
    q: "NASA NEO гэж юуг хэлдэг вэ?",
    opts: ["New Earth Observatory", "Near Earth Objects", "NASA Engine Output", "Neutral Earth Orbit"],
    correct: 1,
  },
  {
    id: 4,
    q: "Surrogate model-ийн гол зорилго юу вэ?",
    opts: ["Өгөгдөл цуглуулах", "Хурдан таамаглал гаргах", "Зураг боловсруулах", "Сүлжээ тохируулах"],
    correct: 1,
  },
  {
    id: 5,
    q: "BigQuery ML-д ямар давуу тал байдаг вэ?",
    opts: [
      "Өгөгдлийг локалд татаж боловсруулдаг",
      "Зөвхөн жижиг өгөгдөлд ажилладаг",
      "Cloud дотор шууд ML загвар сургадаг",
      "GPU шаарддаг",
    ],
    correct: 2,
  },
];

const OPTION_LABELS = ["A", "B", "C", "D"];

// ─── Progress stepper ─────────────────────────────────────────────────────────

const STEPS = ["Material", "Exercise", "Quiz", "Certificate"];

function ProgressStepper({ completedCount }: { completedCount: number }) {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((label, i) => {
        const done = i < completedCount;
        const active = i === completedCount;
        return (
          <div key={label} className="flex items-center">
            <div
              className={`flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-medium transition-all ${
                done
                  ? "text-emerald-400"
                  : active
                  ? "bg-sky-400/15 text-sky-100 ring-1 ring-sky-400/30"
                  : "text-slate-600"
              }`}
            >
              {done ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                    active ? "bg-sky-400/30 text-sky-100" : "bg-white/8 text-slate-600"
                  }`}
                >
                  {i + 1}
                </span>
              )}
              {label}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-1 h-px w-6 ${i < completedCount ? "bg-emerald-400/40" : "bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Certificate card ─────────────────────────────────────────────────────────

function CertificateCard({
  certRef,
  name,
  score,
  total,
  caseTitle,
  courseName,
}: {
  certRef: React.RefObject<HTMLDivElement | null>;
  name: string;
  score: number;
  total: number;
  caseTitle: string;
  courseName: string;
}) {
  const pct = Math.round((score / total) * 100);
  return (
    <div
      ref={certRef as React.RefObject<HTMLDivElement>}
      className="relative overflow-hidden rounded-[28px] p-10 text-center"
      style={{
        background: "linear-gradient(150deg, #0a0f1e 0%, #0d1a2d 60%, #0a0f1e 100%)",
        border: "2px solid #c9a84c",
        boxShadow: "0 0 80px rgba(201,168,76,0.12), inset 0 0 60px rgba(201,168,76,0.04)",
      }}
    >
      {/* Corner ornaments */}
      {[
        "absolute top-4 left-4 h-8 w-8 border-t-2 border-l-2 border-[#c9a84c]/60 rounded-tl-lg",
        "absolute top-4 right-4 h-8 w-8 border-t-2 border-r-2 border-[#c9a84c]/60 rounded-tr-lg",
        "absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-[#c9a84c]/60 rounded-bl-lg",
        "absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-[#c9a84c]/60 rounded-br-lg",
      ].map((cls, i) => (
        <div key={i} className={cls} />
      ))}

      {/* Logo placeholder */}
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#c9a84c]/60 bg-[#c9a84c]/10">
        <span className="text-[10px] font-bold tracking-widest text-amber-300">ШУТИС</span>
      </div>

      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-amber-400/80">
        Батламж · Certificate
      </p>

      <Trophy className="mx-auto mt-4 h-10 w-10 text-amber-400" />

      <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-400">
        Энэхүү батламжийг
      </p>
      <p className="mt-2 text-2xl font-bold text-amber-200">{name}</p>
      <p className="mt-1 text-xs text-slate-400">-д гардуулж байна</p>

      <div className="mx-auto my-5 h-px w-2/3 bg-gradient-to-r from-transparent via-[#c9a84c]/40 to-transparent" />

      <p className="text-sm font-semibold text-slate-200">{courseName}</p>
      <p className="mt-2 text-xs text-emerald-300">{caseTitle} амжилттай дүүргэлээ</p>

      <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-5 py-2">
        <span className="text-lg font-bold text-amber-200">{pct}%</span>
        <span className="text-xs text-slate-400">Quiz Score</span>
      </div>

      <div className="mx-auto mt-5 h-px w-2/3 bg-gradient-to-r from-transparent via-[#c9a84c]/40 to-transparent" />

      <p className="mt-4 text-xs text-slate-500">{today()}</p>
      <p className="mt-1 text-xs text-slate-600">Issued by: Lunar Cloud LMS</p>
    </div>
  );
}

// ─── Slides viewer ────────────────────────────────────────────────────────────

function SlidesViewer({
  fileUrl,
  title,
  label,
}: {
  fileUrl: string;
  title: string;
  label?: string;
}) {
  const lower = fileUrl.toLowerCase();
  const isPDF = lower.includes(".pdf");
  const isPPT = lower.includes(".ppt") || lower.includes(".pps");

  const fullUrl = fileUrl.startsWith("http") ? fileUrl : `${API_URL}${fileUrl}`;

  const iframeSrc = isPDF
    ? fullUrl
    : isPPT
    ? `https://docs.google.com/gview?url=${encodeURIComponent(fullUrl)}&embedded=true`
    : null;

  return (
    <div className="relative overflow-hidden rounded-xl bg-white" style={{ height: 500 }}>
      {/* Open-in-new-tab button */}
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-14 top-2 z-10 inline-flex items-center gap-1 rounded-lg border border-white/20 bg-black/50 px-2.5 py-1 text-xs text-white backdrop-blur-sm transition hover:bg-black/70"
      >
        <ExternalLink className="h-3 w-3" />
        Нээх
      </a>

      {iframeSrc ? (
        <iframe
          src={iframeSrc}
          className="h-full w-full"
          style={{ border: "none" }}
          title={title}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-slate-400">
          Файл харуулах боломжгүй
        </div>
      )}

      {/* ШУТИС side badge */}
      <div className="absolute bottom-0 right-0 top-0 flex w-11 flex-col items-center justify-center gap-2 bg-blue-900/95">
        <img
          src="/shutis-logo.png"
          alt="ШУТИС"
          className="h-8 w-8 object-contain"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
        <span
          className="select-none text-[9px] font-medium text-blue-200"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {label ?? title}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

// ─── Coming Soon placeholder ──────────────────────────────────────────────────

function ComingSoonCase({ caseId }: { caseId: number }) {
  const sc = STUDY_CASES.find((c) => c.id === caseId);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-24 text-center">
      <div className="rounded-full bg-sky-400/10 p-6">
        <Clock className="h-12 w-12 text-sky-300" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">
          {sc?.title ?? `Study Case ${caseId}`}
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-100">Тун удахгүй</h2>
        <p className="mt-2 text-sm text-slate-400">{sc?.courseName}</p>
      </div>
      <p className="max-w-xs text-xs text-slate-500">
        Энэхүү хичээлийн агуулга бэлтгэгдэж байна. Удахгүй нийтлэгдэх болно.
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StudentDashboard() {
  const { id: studentId, name: studentName } = getStudentInfo();
  const { activeCase, updateProgress } = useCourseStore();
  // Tab
  const [activeTab, setActiveTab] = useState<"slides" | "notebook">("slides");
  const [selectedSlideIdx, setSelectedSlideIdx] = useState(0);

  // Course content from API
  const [apiContent, setApiContent] = useState<ApiContentItem[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  // Part accordion
  const [expandedPart, setExpandedPart] = useState<number | null>(1);
  const [openNotebook, setOpenNotebook] = useState<number | null>(null);
  const [completedParts, setCompletedParts] = useState<Set<number>>(new Set());
  const [progressLoading, setProgressLoading] = useState(true);
  const [togglingPart, setTogglingPart] = useState<number | null>(null);

  // Submission (inline)
  const [accuracy, setAccuracy] = useState("");
  const [subNotes, setSubNotes] = useState("");
  const [notebookFile, setNotebookFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [exerciseSubmitted, setExerciseSubmitted] = useState(false);

  // Previous submissions for Feedback
  const [prevSubmissions, setPrevSubmissions] = useState<SubmissionRecord[]>([]);

  // Quiz
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const certRef = useRef<HTMLDivElement>(null);
  const notebookRef = useRef<HTMLDivElement>(null);

  // Must be declared here — before any early returns — to satisfy Rules of Hooks
  const [previewFile, setPreviewFile] = useState<any>(null);

  // ── Dynamic course data (loaded from DB when activeCase changes) ─────────────
  const [currentCourseData, setCurrentCourseData] = useState<any>(null);
  const [courseDataLoading, setCourseDataLoading] = useState(false);

  // Normalize DB parts → same shape as STUDY_PARTS
  const activeParts = useMemo(() => {
    const raw = currentCourseData?.parts;
    if (!raw || !Array.isArray(raw) || raw.length === 0) return STUDY_PARTS;
    return raw.map((p: any, i: number) => ({
      number: i + 1,
      title: p.title ?? `Part ${i + 1}`,
      bullets: p.bullets ?? p.topics ?? [],
      exercise: p.exercise ?? null,
    }));
  }, [currentCourseData]);

  // Normalize DB quiz → same shape as QUIZ_QUESTIONS
  const activeQuizQs = useMemo(() => {
    const raw = currentCourseData?.quiz;
    const questions = Array.isArray(raw) ? raw : raw?.questions;
    if (!questions || !Array.isArray(questions) || questions.length === 0) return QUIZ_QUESTIONS;
    return questions.map((q: any, i: number) => ({
      id: i + 1,
      q: q.question ?? q.q ?? `Question ${i + 1}`,
      opts: (q.options ?? q.opts ?? []) as string[],
      correct: typeof q.correct === "number" ? q.correct : 0,
    }));
  }, [currentCourseData]);

  const quizPassed = quizScore !== null && quizScore / activeQuizQs.length >= 0.75;

  // Prefer live DB data for display strings; fall back to hardcoded STUDY_CASES
  const _fallbackCase = STUDY_CASES.find((c) => c.id === activeCase) ?? STUDY_CASES[0];
  const currentCase = {
    title: currentCourseData?.title ?? _fallbackCase.title,
    courseName: currentCourseData?.description ?? _fallbackCase.courseName,
  };

  // Steps: 0=Material, 1=Exercise submitted, 2=Quiz done & passed, 3=Certificate
  const completedStepCount = [true, exerciseSubmitted, quizPassed].filter(Boolean).length;

  // ── Fetch course content ────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/upload/courses`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setApiContent(j.courses ?? []); })
      .catch(() => {})
      .finally(() => setContentLoading(false));
  }, []);

  // ── Fetch part progress ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!studentId) { setProgressLoading(false); return; }
    fetch(`${API_URL}/api/submissions/progress/${studentId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          const done = new Set<number>(
            (j.progress as ProgressRecord[]).filter((p) => p.completed).map((p) => p.part_number)
          );
          setCompletedParts(done);
        }
      })
      .catch(() => {})
      .finally(() => setProgressLoading(false));
  }, [studentId]);

  // ── Fetch past submissions (to pre-set exerciseSubmitted) ───────────────────
  useEffect(() => {
    if (!studentId) return;
    fetch(`${API_URL}/api/submissions/student/${studentId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && (j.submissions ?? []).length > 0) {
          setPrevSubmissions(j.submissions ?? []);
          setExerciseSubmitted(true);
        }
      })
      .catch(() => {});
  }, [studentId]);

  // ── Fetch full course data when active case changes ─────────────────────────
  useEffect(() => {
    if (activeCase <= 0) return;
    setCourseDataLoading(true);
    setCurrentCourseData(null);
    // Reset quiz state when switching courses
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    fetch(`${API_URL}/api/courses/${activeCase}`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setCurrentCourseData(j.data ?? j.course ?? null); })
      .catch(() => {})
      .finally(() => setCourseDataLoading(false));
  }, [activeCase]);

  // ── Milestone tracking ────────────────────────────────────────────────────────
  useEffect(() => {
    updateProgress(activeCase || 1, { materialViewed: true });
    if (activeCase > 0 && studentId) {
      fetch(`${API_URL}/api/courses/${activeCase}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, material_viewed: true }),
      }).catch(() => {});
    }
  }, [activeCase]);

  useEffect(() => {
    if (!exerciseSubmitted) return;
    updateProgress(activeCase || 1, { exerciseSubmitted: true });
    if (activeCase > 0 && studentId) {
      fetch(`${API_URL}/api/courses/${activeCase}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, exercise_submitted: true }),
      }).catch(() => {});
    }
  }, [exerciseSubmitted]);

  useEffect(() => {
    if (!quizPassed) return;
    updateProgress(activeCase || 1, { quizPassed: true });
    if (activeCase > 0 && studentId && quizScore !== null) {
      fetch(`${API_URL}/api/courses/${activeCase}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, quiz_score: (quizScore / activeQuizQs.length) * 100 }),
      }).catch(() => {});
    }
  }, [quizPassed]);

  // ── Loading / early-return guards (must be after all hooks) ──────────────────
  if (courseDataLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-sky-300" />
      </div>
    );
  }
  // Fallback: no DB course loaded and not case 1 → show coming-soon
  if (!currentCourseData && activeCase !== 1) return <ComingSoonCase caseId={activeCase} />;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const togglePart = async (num: number, title: string) => {
    if (completedParts.has(num)) return;
    setTogglingPart(num);
    try {
      await fetch(`${API_URL}/api/submissions/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, part_number: num, part_title: title }),
      });
    } catch { /* still mark locally */ }
    setCompletedParts((prev) => new Set([...prev, num]));
    setTogglingPart(null);
  };

  const submitExercise = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("student_id", studentId);
      formData.append("exercise_type", "crater-cnn");
      if (accuracy) formData.append("accuracy", accuracy);
      if (subNotes) formData.append("result_output", subNotes);
      if (notebookFile) formData.append("file", notebookFile);

      await fetch(`${API_URL}/api/submissions`, {
        method: "POST",
        body: formData,
      });
    } catch { /* offline — still proceed */ }
    setSubmitSuccess(true);
    setTimeout(() => {
      setExerciseSubmitted(true);
      setSubmitSuccess(false);
    }, 1600);
    setSubmitting(false);
  };

  const submitQuiz = () => {
    const correct = activeQuizQs.filter((q) => quizAnswers[q.id] === q.correct).length;
    setQuizScore(correct);
    setQuizSubmitted(true);

    if (studentId) {
      fetch(`${API_URL}/api/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          caseId: `case${activeCase}`,
          answers: activeQuizQs.map((q) => quizAnswers[q.id] ?? -1),
        }),
      }).catch(() => {});
    }
  };

  const downloadCertificate = async () => {
    if (!certRef.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: null });
    const link = document.createElement("a");
    link.download = `certificate-${studentName.replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    updateProgress(activeCase || 1, { certificateIssued: true });
    if (activeCase > 0 && studentId) {
      fetch(`${API_URL}/api/courses/${activeCase}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, certificate_issued: true }),
      }).catch(() => {});
    }
  };

  // Derived
  const slideItems    = apiContent.filter((i) => i.content_type === "slide");
  const notebookItems = apiContent.filter((i) => i.content_type === "notebook");
  const completedCount = completedParts.size;

  const assignmentFiles = slideItems.map((item) => ({
    name: item.title,
    type: (item.file_type ?? item.content_type ?? "pdf").toLowerCase(),
    url: item.file_url ?? item.link_url ?? "",
    size: "—",
    uploadedBy: item.instructor_name ?? "Багш",
  }));
  const progressPct = Math.round((completedCount / activeParts.length) * 100);

  return (
    <section className="space-y-6">
      <SectionHeader
        eyebrow="STUDENT VIEW"
        title="AI for Lunar Formation & Structure"
        description="Case 1 — Material үзэх, дасгал илгээх, quiz өгөх, батламж авах."
      />

      {/* ── Progress stepper ──────────────────────────────────────────────── */}
      <div className="glass-panel flex items-center justify-between rounded-[28px] px-6 py-4">
        <ProgressStepper completedCount={completedStepCount} />
        <span className="text-xs text-slate-500">
          {completedStepCount < 4 ? `${STEPS[completedStepCount]} хийгдэж байна` : "Дууссан"}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.9fr_1fr]">
        {/* ── LEFT: main flow ────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* ── SECTION 1 + 2: Material Viewer + Accordion ───────────────── */}
          <div className="glass-panel rounded-[28px] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
              Case 1 — AI for Lunar Formation &amp; Structure
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-50">
              Study Case 1
            </h2>

            {/* Tabs */}
            <div className="mt-4 flex gap-2">
              {(["slides", "notebook"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-sky-400/20 text-sky-100 ring-1 ring-sky-400/30"
                      : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                  }`}
                >
                  {tab === "slides" ? <BookOpen className="h-4 w-4" /> : <FlaskConical className="h-4 w-4" />}
                  {tab === "slides" ? "Slides" : "Notebook"}
                </button>
              ))}
            </div>

            {/* ── Slides tab ──────────────────────────────────────────── */}
            {activeTab === "slides" && (
              <div className="mt-6 space-y-5">
                {/* Instructor-uploaded slides */}
                {contentLoading ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Уншиж байна…
                  </div>
                ) : slideItems.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
                      Instructor-ийн материал
                    </p>
                    {/* Slide selector — show tabs when multiple slides exist */}
                    {slideItems.length > 1 && (
                      <div className="flex flex-wrap gap-2">
                        {slideItems.map((item, idx) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedSlideIdx(idx)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                              selectedSlideIdx === idx
                                ? "bg-sky-400/20 text-sky-100 ring-1 ring-sky-400/30"
                                : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                            }`}
                          >
                            {item.title}
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Inline viewer for the selected slide */}
                    {(() => {
                      const item = slideItems[selectedSlideIdx] ?? slideItems[0];
                      const url = item.file_url ?? item.link_url ?? "";
                      return url ? (
                        <SlidesViewer
                          key={item.id}
                          fileUrl={url}
                          title={item.title}
                          label={`Лекц №${selectedSlideIdx + 1} ${item.instructor_name ?? ""}`}
                        />
                      ) : null;
                    })()}
                  </div>
                ) : null}

                {/* ── SECTION 2: Accordion ─────────────────────────────── */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
                    Study Case 1 — Лекцийн агуулга
                  </p>
                  {activeParts.map((part) => {
                    const done = completedParts.has(part.number);
                    const open = expandedPart === part.number;
                    const toggling = togglingPart === part.number;
                    return (
                      <div
                        key={part.number}
                        className={`overflow-hidden rounded-[20px] border transition-colors ${
                          done ? "border-emerald-400/20 bg-emerald-400/5" : "border-white/10 bg-white/5"
                        }`}
                      >
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-5 py-4 text-left"
                          onClick={() => {
                            setExpandedPart(open ? null : part.number);
                            setOpenNotebook(null);
                          }}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              done ? "bg-emerald-400/20 text-emerald-300" : "bg-white/10 text-slate-400"
                            }`}
                          >
                            {part.number}
                          </span>
                          <span className={`flex-1 text-sm font-medium ${done ? "text-emerald-200" : "text-slate-200"}`}>
                            {part.title}
                          </span>
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                          ) : open ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                          )}
                        </button>

                        {open && (
                          <div className="border-t border-white/8 px-5 pb-5 pt-4 space-y-4">
                            <ul className="space-y-1.5">
                              {(part.bullets as string[]).map((b) => (
                                <li key={b} className="flex items-center gap-2 text-sm text-slate-300">
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/70" />
                                  {b}
                                </li>
                              ))}
                            </ul>

                            {part.exercise && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = openNotebook === part.number ? null : part.number;
                                  setOpenNotebook(next);
                                  if (next !== null) {
                                    setTimeout(() => notebookRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
                              >
                                <FlaskConical className="h-3.5 w-3.5" />
                                {part.exercise.title}
                              </button>
                            )}

                            {openNotebook === part.number && part.exercise && (
                              <div ref={notebookRef} className="overflow-hidden rounded-xl border border-sky-400/20">
                                {/* Notebook toolbar */}
                                <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2">
                                  <div className="flex items-center gap-3">
                                    <span className="rounded border border-green-500/30 bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                                      kernel: python 3.11
                                    </span>
                                    <span className="text-xs text-slate-500">●●●</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      className="flex items-center gap-1 rounded border border-sky-500/30 bg-sky-500/20 px-3 py-1 text-xs text-sky-400 hover:bg-sky-500/30"
                                    >
                                      ▶ Run
                                    </button>
                                    <button
                                      type="button"
                                      className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:bg-white/10"
                                    >
                                      ⏹ Stop
                                    </button>
                                    <button
                                      type="button"
                                      className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:bg-white/10"
                                    >
                                      💾 Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setOpenNotebook(null)}
                                      className="ml-2 text-xs text-slate-500 hover:text-slate-300"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                                <iframe
                                  src={`https://online-facilitate-split-sticky.trycloudflare.com/hub/user-redirect/lab/tree/${part.exercise.id}.ipynb`}
                                  className="w-full bg-white"
                                  style={{ height: "650px", border: "none" }}
                                  title={part.exercise.title}
                                />
                              </div>
                            )}

                            {!done && (
                              <button
                                type="button"
                                disabled={toggling || progressLoading}
                                onClick={() => togglePart(part.number, part.title)}
                                className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-400/20 disabled:opacity-50"
                              >
                                {toggling ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                )}
                                Дууссан гэж тэмдэглэх
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Notebook tab ────────────────────────────────────────── */}
            {activeTab === "notebook" && (
              <div className="mt-6 space-y-4">
                {notebookItems.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
                      Instructor-ийн notebook
                    </p>
                    {notebookItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-white/5 p-4"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-100">{item.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.instructor_name ?? "Instructor"} · {item.created_at.slice(0, 10)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { window.location.href = "/virtual-lab"; }}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-violet-400/20 bg-violet-400/10 px-3 py-2 text-xs text-violet-200 transition hover:bg-violet-400/20"
                        >
                          <FlaskConical className="h-3.5 w-3.5" />
                          Virtual Lab-д нээх
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
                  Дасгал ажлууд
                </p>
                {EXERCISES.map((ex) => (
                  <div key={ex.id} className="rounded-[20px] border border-white/10 bg-white/5 p-5">
                    <p className="text-sm font-semibold text-slate-100">{ex.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{ex.desc}</p>
                    <button
                      type="button"
                      onClick={() => { window.location.href = `/virtual-lab?exercise=${ex.id}`; }}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-xs text-violet-200 transition hover:bg-violet-400/20"
                    >
                      <FlaskConical className="h-3.5 w-3.5" />
                      Virtual Lab-д нээх
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Assignment description ───────────────────────────────────── */}
          <div className="overflow-hidden rounded-[28px] border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-amber-400">📋</span>
                <span className="text-sm font-medium text-white">Даалгаврын тайлбар</span>
              </div>
              <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-400">
                Багшийн оруулсан
              </span>
            </div>

            <div className="p-5 space-y-5">
              {/* Description */}
              <p className="text-sm leading-relaxed text-slate-300">
                NASA NEO өгөгдлийг ашиглан аюултай asteroid-уудыг таних машин сургалтын загвар
                бүтээгээрэй. Random Forest эсвэл өөр алгоритм ашиглан accuracy-гаа дээшлүүлэхийг
                оролдоорой.
              </p>

              {/* Requirements */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Шаардлага
                </p>
                <ul className="space-y-1.5">
                  {[
                    "NASA NEO API-аас өгөгдөл татах",
                    "ML загвар сургаж accuracy тооцоолох",
                    "Accuracy ≥ 80% байвал дамжина",
                    "Тайлбар бичиж илгээх",
                  ].map((req) => (
                    <li key={req} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Attached files */}
              {assignmentFiles.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Холбогдох материал
                  </p>
                  <div className="space-y-2">
                    {assignmentFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {file.type === "pdf"
                              ? "📄"
                              : file.type === "doc" || file.type === "docx"
                              ? "📝"
                              : file.type === "video" || file.type === "mp4"
                              ? "🎥"
                              : "📎"}
                          </span>
                          <div>
                            <p className="text-sm text-white">{file.name}</p>
                            <p className="text-xs text-slate-500">
                              {file.size} · {file.uploadedBy}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewFile(previewFile?.url === file.url ? null : file)
                            }
                            className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 transition hover:bg-white/10"
                          >
                            {previewFile?.url === file.url ? "✕ Хаах" : "👁 Харах"}
                          </button>
                          {file.url && (
                            <a
                              href={
                                file.url.startsWith("http")
                                  ? file.url
                                  : `${API_URL}${file.url}`
                              }
                              download
                              className="rounded border border-sky-500/30 bg-sky-500/20 px-2 py-1 text-xs text-sky-400 transition hover:bg-sky-500/30"
                            >
                              ↓ Татах
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inline preview */}
              {previewFile && (
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-xs text-slate-300">{previewFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setPreviewFile(null)}
                      className="text-xs text-slate-500 transition hover:text-slate-300"
                    >
                      ✕ Хаах
                    </button>
                  </div>
                  <iframe
                    src={
                      previewFile.url.startsWith("http")
                        ? previewFile.url
                        : `${API_URL}${previewFile.url}`
                    }
                    className="w-full bg-white"
                    style={{ height: 400, border: "none" }}
                    title={previewFile.name}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Free Experiment ──────────────────────────────────────────── */}
          <div className="overflow-hidden rounded-[28px] border border-sky-400/20">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-sky-400/20 bg-sky-500/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sky-400">🧪</span>
                <span className="text-sm font-medium text-sky-400">
                  Өөрөө туршилт хийх орчин
                </span>
                <span className="hidden text-xs text-slate-400 sm:inline">
                  — Кодоо бичиж, өөрийн үнэлгээгээ хийгээд илгээгээрэй
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://online-facilitate-split-sticky.trycloudflare.com/hub/user-redirect/lab/tree/free-experiment.ipynb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-sky-500/30 bg-sky-500/20 px-3 py-1 text-xs text-sky-400 transition hover:bg-sky-500/30"
                >
                  + Шинэ туршилт
                </a>
                <a
                  href="/virtual-lab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400 transition hover:bg-white/10"
                >
                  ↗ Virtual Lab-д нээх
                </a>
              </div>
            </div>

            {/* Kernel toolbar */}
            <div className="flex items-center justify-between border-b border-white/5 bg-slate-800/80 px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="rounded border border-green-500/30 bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                  kernel: python 3.11
                </span>
                <span className="text-xs text-slate-500">Jupyter Notebook</span>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { label: "▶ Run", cls: "border-sky-500/30 bg-sky-500/20 text-sky-400 hover:bg-sky-500/30" },
                  { label: "⏹ Stop", cls: "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" },
                  { label: "💾 Save", cls: "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" },
                  { label: "⟳ Restart", cls: "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    className={`rounded border px-3 py-1 text-xs transition ${btn.cls}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Jupyter iframe */}
            <iframe
              src="https://online-facilitate-split-sticky.trycloudflare.com/hub/user-redirect/lab/tree/free-experiment.ipynb"
              className="w-full bg-white"
              style={{ height: 700, border: "none" }}
              title="Free Experiment Notebook"
            />

            {/* Bottom hint */}
            <div className="flex items-center justify-between border-t border-white/5 bg-slate-800/50 px-4 py-3">
              <span className="text-xs text-slate-400">
                Энд бичсэн кодоо туршиж, accuracy-гаа тооцоолоод доорх "Дасгал илгээх" хэсэгт оруулна уу
              </span>
              <span className="hidden text-xs text-slate-500 sm:inline">
                NASA NEO өгөгдөл ашиглах:{" "}
                <code className="ml-1 text-sky-400">import requests</code>
              </span>
            </div>
          </div>

          {/* ── SECTION 3: Exercise submission ───────────────────────────── */}
          <div className="glass-panel rounded-[28px] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
              Дасгал илгээх
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-100">Exercise Submission</h3>

            {exerciseSubmitted && !submitSuccess ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Дасгал амжилттай илгээгдсэн. Доорх Quiz-г бөглөнө үү.
                </div>
                {prevSubmissions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Өмнөх илгээлтүүд
                    </p>
                    {prevSubmissions.slice(0, 3).map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between rounded-[16px] border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm text-slate-200">{sub.exercise_type}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(sub.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {sub.accuracy != null && (
                            <span className="rounded-full bg-sky-400/10 px-2.5 py-0.5 text-xs text-sky-300">
                              {sub.accuracy}%
                            </span>
                          )}
                          {sub.grade != null ? (
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                sub.grade >= 90
                                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                                  : sub.grade >= 70
                                  ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
                                  : "border-red-400/20 bg-red-400/10 text-red-200"
                              }`}
                            >
                              {sub.grade}/100
                            </span>
                          ) : (
                            <span className="rounded-full border border-slate-600 bg-white/5 px-2.5 py-0.5 text-xs text-slate-500">
                              Үнэлгээ хүлээж байна
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : submitSuccess ? (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> Дасгал амжилттай илгээгдлээ!
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  placeholder="Accuracy (0–100, e.g. 95.24)"
                  value={accuracy}
                  onChange={(e) => setAccuracy(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400/40"
                />
                <textarea
                  rows={3}
                  placeholder="Тайлбар бичих…"
                  value={subNotes}
                  onChange={(e) => setSubNotes(e.target.value)}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400/40"
                />

                {/* File upload */}
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-3 transition hover:border-sky-400/30 hover:bg-white/8">
                  <Paperclip className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-400">
                    {notebookFile ? notebookFile.name : "Notebook файл хавсаргах (.ipynb)"}
                  </span>
                  <input
                    type="file"
                    accept=".ipynb"
                    className="hidden"
                    onChange={(e) => setNotebookFile(e.target.files?.[0] ?? null)}
                  />
                </label>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={submitExercise}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-400/15 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-400/25 disabled:opacity-40"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Илгээх
                </button>
              </div>
            )}
          </div>

          {/* ── SECTION 4: Quiz ───────────────────────────────────────────── */}
          {exerciseSubmitted && (
            <div className="glass-panel rounded-[28px] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
                Quiz — Study Case 1
              </p>
              <h3 className="mt-1 text-base font-semibold text-slate-100">
                AI for Lunar Formation &amp; Structure
              </h3>

              {quizSubmitted && quizScore !== null ? (
                <div className="mt-5 space-y-4">
                  {/* Score banner */}
                  <div
                    className={`rounded-[20px] border p-5 text-center ${
                      quizPassed
                        ? "border-emerald-400/25 bg-emerald-400/8"
                        : "border-red-400/20 bg-red-400/5"
                    }`}
                  >
                    <p className="text-3xl font-bold text-slate-50">
                      {quizScore}/{activeQuizQs.length}
                      <span className="ml-2 text-lg font-normal text-slate-400">
                        = {Math.round((quizScore / activeQuizQs.length) * 100)}%
                      </span>
                    </p>
                    {quizPassed ? (
                      <p className="mt-2 text-sm font-semibold text-emerald-300">
                        Congratulations! Батламж авах боломжтой боллоо.
                      </p>
                    ) : (
                      <>
                        <p className="mt-2 text-sm text-red-300">
                          75% дүнгийн босго хүрсэнгүй. Дахин оролдоно уу.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setQuizAnswers({});
                            setQuizSubmitted(false);
                            setQuizScore(null);
                          }}
                          className="mt-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-2 text-sm font-medium text-red-200 transition hover:bg-red-400/20"
                        >
                          Дахин оролдох
                        </button>
                      </>
                    )}
                  </div>

                  {/* Answer review */}
                  <div className="space-y-3">
                    {activeQuizQs.map((q) => {
                      const chosen = quizAnswers[q.id];
                      const correct = q.correct;
                      return (
                        <div key={q.id} className="rounded-[18px] border border-white/8 bg-white/5 p-4">
                          <p className="text-sm font-medium text-slate-200">{q.id}. {q.q}</p>
                          <div className="mt-2 grid grid-cols-2 gap-1.5">
                            {(q.opts as string[]).map((opt, oi) => (
                              <div
                                key={oi}
                                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
                                  oi === correct
                                    ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                                    : oi === chosen && chosen !== correct
                                    ? "border border-red-400/20 bg-red-400/8 text-red-300"
                                    : "border border-white/8 text-slate-400"
                                }`}
                              >
                                <span className="font-bold">{OPTION_LABELS[oi]}.</span> {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {activeQuizQs.map((q) => (
                    <div key={q.id} className="rounded-[20px] border border-white/10 bg-white/5 p-5">
                      <p className="text-sm font-semibold text-slate-100">
                        {q.id}. {q.q}
                      </p>
                      <div className="mt-3 space-y-2">
                        {(q.opts as string[]).map((opt, oi) => (
                          <label
                            key={oi}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                              quizAnswers[q.id] === oi
                                ? "border-sky-400/40 bg-sky-400/10 text-slate-100"
                                : "border-white/8 bg-white/5 text-slate-300 hover:border-white/15 hover:bg-white/8"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q${q.id}`}
                              value={oi}
                              checked={quizAnswers[q.id] === oi}
                              onChange={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                              className="hidden"
                            />
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                                quizAnswers[q.id] === oi
                                  ? "border-sky-400 bg-sky-400/20 text-sky-200"
                                  : "border-white/20 text-slate-500"
                              }`}
                            >
                              {OPTION_LABELS[oi]}
                            </span>
                            <span className="text-sm">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    disabled={Object.keys(quizAnswers).length < activeQuizQs.length}
                    onClick={submitQuiz}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-400/15 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-400/25 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                    Quiz илгээх ({Object.keys(quizAnswers).length}/{activeQuizQs.length} хариулсан)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── SECTION 5: Certificate ────────────────────────────────────── */}
          {quizPassed && (
            <div className="glass-panel rounded-[28px] p-6 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400">
                  Батламж · Certificate
                </p>
                <h3 className="mt-1 text-base font-semibold text-slate-100">
                  Хичээлийн батламж авах
                </h3>
              </div>

              <CertificateCard
                certRef={certRef}
                name={studentName}
                score={quizScore!}
                total={activeQuizQs.length}
                caseTitle={currentCase.title}
                courseName={currentCase.courseName}
              />

              <button
                type="button"
                onClick={downloadCertificate}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-200 transition hover:bg-amber-400/20"
              >
                <Download className="h-4 w-4" />
                Татаж авах (PNG)
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT: progress panel ───────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Overall progress */}
          <div className="glass-panel rounded-[28px] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
              Learning Progress
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="shrink-0 text-sm font-bold text-sky-200">{progressPct}%</span>
            </div>

            <div className="mt-5 space-y-3">
              {progressLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Уншиж байна…
                </div>
              ) : (
                activeParts.map((part) => {
                  const done = completedParts.has(part.number);
                  return (
                    <div key={part.number} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                        )}
                        <span className="flex-1 truncate text-xs text-slate-400">
                          {part.number}. {part.title.split(" ").slice(0, 3).join(" ")}…
                        </span>
                        <span className="shrink-0 text-xs font-medium text-slate-500">
                          {done ? "100%" : "0%"}
                        </span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                          style={{ width: done ? "100%" : "0%" }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Flow status */}
          <div className="glass-panel rounded-[28px] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
              Явц
            </p>
            <div className="mt-4 space-y-2">
              {[
                { label: "Лекц үзсэн", done: true },
                { label: "Дасгал илгээсэн", done: exerciseSubmitted },
                { label: "Quiz өгсөн", done: quizSubmitted },
                { label: "Батламж авсан", done: quizPassed },
              ].map((row) => (
                <div
                  key={row.label}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                    row.done
                      ? "border-emerald-400/20 bg-emerald-400/8 text-emerald-200"
                      : "border-white/8 bg-white/5 text-slate-500"
                  }`}
                >
                  {row.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0" />
                  )}
                  {row.label}
                </div>
              ))}
            </div>
          </div>

          {/* Next steps */}
          <div className="glass-panel rounded-[28px] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
              Next Steps
            </p>
            <div className="mt-4 space-y-2">
              {!exerciseSubmitted && (
                <div className="flex items-center gap-3 rounded-2xl border border-sky-400/15 bg-sky-400/8 px-4 py-3 text-xs text-sky-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-400/20 text-[10px] font-bold">1</span>
                  Дасгалаа илгээнэ үү
                </div>
              )}
              {exerciseSubmitted && !quizSubmitted && (
                <div className="flex items-center gap-3 rounded-2xl border border-sky-400/15 bg-sky-400/8 px-4 py-3 text-xs text-sky-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-400/20 text-[10px] font-bold">2</span>
                  Quiz-г бөглөнө үү
                </div>
              )}
              {quizSubmitted && !quizPassed && (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-400/15 bg-amber-400/8 px-4 py-3 text-xs text-amber-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-[10px] font-bold">!</span>
                  Quiz дахин өгнө үү (75% шаардлагатай)
                </div>
              )}
              {quizPassed && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Батламжаа татаж аваарай!
                </div>
              )}
              {activeParts.filter((p) => !completedParts.has(p.number))
                .slice(0, 2)
                .map((p) => (
                  <div
                    key={p.number}
                    className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-xs text-slate-400"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-slate-500">
                      {p.number}
                    </span>
                    Part {p.number}: {p.title.split(" ").slice(0, 3).join(" ")}…
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
