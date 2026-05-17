import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Copy,
  Edit2,
  Eye,
  FileText,
  FlaskConical,
  HelpCircle,
  Loader2,
  MessageSquare,
  MoreVertical,
  Plus,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useUIStore } from "../../store/uiStore";

// ─── Types ─────────────────────────────────────────────────────────────────────

type CourseStatus = "published" | "draft" | "archived";
type InnerView = "list" | "detail" | "edit";
type DetailTab = "materials" | "students" | "assignment" | "quiz";
type EditSection = "materials" | "parts" | "exercises" | "assignment" | "quiz";

interface CourseMaterial { id: string; name: string; type: string; }
interface CoursePart { id: string; title: string; bullets: string[]; exerciseId: string; }
interface QuizQuestion { id: string; type: string; text: string; options?: { text: string; isCorrect: boolean }[]; }
interface AssignmentData { name: string; description: string; dueDate: string; minAccuracy: number; }

interface Course {
  id: number;
  title: string;
  description: string;
  status: CourseStatus;
  materialCount: number;
  partCount: number;
  exerciseCount: number;
  quizCount: number;
  studentCount: number;
  avgScore: number;
  submissionCount: number;
  assignmentName: string;
  dueDate: string;
  createdAt: string;
  parts: CoursePart[];
  quizQuestions: QuizQuestion[];
  assignment: AssignmentData;
  pptFiles: CourseMaterial[];
  pdfFiles: CourseMaterial[];
  videoFiles: CourseMaterial[];
  links: string[];
}

interface DetailStudent {
  id: string; name: string; progress: number;
  accuracy: string; quizScore: string;
  status: "approved" | "in_progress" | "started";
  expanded: boolean;
  submissionNotes?: string;
  submittedAt?: string;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const MOCK_COURSES: Course[] = [
  {
    id: 1, title: "Study Case 1", description: "AI for Lunar Formation & Structure",
    status: "published", materialCount: 3, partCount: 6, exerciseCount: 3,
    quizCount: 5, studentCount: 12, avgScore: 87, submissionCount: 8,
    assignmentName: "NASA NEO Asteroid Classification",
    dueDate: "2026-06-01", createdAt: "2026-05-06",
    parts: [
      { id: "p1", title: "Part 1: Lunar Origin", bullets: ["Giant impact hypothesis", "Accretion theory"], exerciseId: "exercise-crater-cnn" },
      { id: "p2", title: "Part 2: Surface Evolution", bullets: ["Volcanic activity", "Impact cratering"], exerciseId: "exercise-rf-vs-nn" },
      { id: "p3", title: "Part 3: Internal Structure", bullets: ["Seismic data", "Core composition"], exerciseId: "exercise-surrogate" },
    ],
    quizQuestions: [
      { id: "q1", type: "multiple", text: "Сарны гадаргуу ямар гарал үүсэлтэй?", options: [{ text: "Giant impact", isCorrect: true }, { text: "Nebular", isCorrect: false }, { text: "Capture", isCorrect: false }] },
      { id: "q2", type: "short", text: "CNN гэж юу вэ?" },
      { id: "q3", type: "multiple", text: "Random Forest загварын давуу тал?" },
      { id: "q4", type: "blank", text: "_____ нь олон шийдвэрийн мод ашигладаг." },
      { id: "q5", type: "matching", text: "Загваруудыг тайлбартай нь холбоно уу." },
    ],
    assignment: { name: "NASA NEO Asteroid Classification", description: "NASA-ийн NEO датасет ашиглан asteroid аюултай эсэхийг ангилах ML загвар боловсруулна уу.", dueDate: "2026-06-01", minAccuracy: 80 },
    pptFiles: [{ id: "f1", name: "lecture1.pptx", type: "ppt" }, { id: "f2", name: "lunar_data.pptx", type: "ppt" }],
    pdfFiles: [{ id: "f3", name: "study_guide.pdf", type: "pdf" }],
    videoFiles: [], links: ["https://nasa.gov/neo"],
  },
  {
    id: 2, title: "Study Case 2", description: "Remote Sensing & Satellite Data",
    status: "draft", materialCount: 2, partCount: 4, exerciseCount: 2,
    quizCount: 8, studentCount: 0, avgScore: 0, submissionCount: 0,
    assignmentName: "Landsat Classification",
    dueDate: "", createdAt: "2026-05-10",
    parts: [
      { id: "p4", title: "Part 1: Satellite Basics", bullets: ["Orbit types", "Sensor types"], exerciseId: "exercise-crater-cnn" },
      { id: "p5", title: "Part 2: Image Processing", bullets: ["Band combinations", "NDVI"], exerciseId: "" },
    ],
    quizQuestions: [],
    assignment: { name: "Landsat Classification", description: "Landsat-8 хиймэл дагуулын дүрсийг ашиглан газрын бүрхэвчийг ангилна уу.", dueDate: "", minAccuracy: 75 },
    pptFiles: [{ id: "f4", name: "remote_sensing.pptx", type: "ppt" }],
    pdfFiles: [{ id: "f5", name: "landsat_guide.pdf", type: "pdf" }],
    videoFiles: [], links: [],
  },
  {
    id: 3, title: "Study Case 3", description: "HPC Fundamentals",
    status: "archived", materialCount: 1, partCount: 3, exerciseCount: 1,
    quizCount: 10, studentCount: 8, avgScore: 79, submissionCount: 7,
    assignmentName: "SLURM Job Optimization",
    dueDate: "2026-04-01", createdAt: "2026-04-01",
    parts: [
      { id: "p6", title: "Part 1: GPU Architecture", bullets: ["CUDA cores", "Memory hierarchy"], exerciseId: "exercise-surrogate" },
    ],
    quizQuestions: [],
    assignment: { name: "SLURM Job Optimization", description: "HPC кластер дээр SLURM ажлын скриптийг оновчтой болгоно уу.", dueDate: "2026-04-01", minAccuracy: 70 },
    pptFiles: [], pdfFiles: [], videoFiles: [], links: [],
  },
];

const MOCK_DETAIL_STUDENTS: DetailStudent[] = [
  { id: "s1", name: "Цацрал Н.", progress: 100, accuracy: "95.24%", quizScore: "5/5", status: "approved", submissionNotes: "Random Forest + XGBoost ансамбл ашиглав.", submittedAt: "2026-05-18", expanded: false },
  { id: "s2", name: "Болд Г.", progress: 60, accuracy: "82.00%", quizScore: "4/5", status: "in_progress", submissionNotes: "CNN загвар, 10 epoch.", submittedAt: "2026-05-17", expanded: false },
  { id: "s3", name: "Анар Д.", progress: 20, accuracy: "-", quizScore: "-", status: "started", expanded: false },
  { id: "s4", name: "Ариун Б.", progress: 80, accuracy: "91.30%", quizScore: "5/5", status: "approved", submissionNotes: "SVM + GridSearch.", submittedAt: "2026-05-16", expanded: false },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_META: Record<CourseStatus, { label: string; dot: string; badge: string }> = {
  published: { label: "Нийтлэгдсэн", dot: "bg-emerald-400", badge: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" },
  draft:     { label: "Ноорог",       dot: "bg-amber-400",   badge: "border-amber-400/25 bg-amber-400/10 text-amber-300" },
  archived:  { label: "Архив",        dot: "bg-slate-500",   badge: "border-white/10 bg-white/5 text-slate-500" },
};

const FILTER_TABS = ["Бүгд", "Нийтлэгдсэн", "Ноорог", "Архив"] as const;
const FILTER_MAP: Record<string, CourseStatus | null> = {
  "Бүгд": null, "Нийтлэгдсэн": "published", "Ноорог": "draft", "Архив": "archived",
};

const DETAIL_TABS: { key: DetailTab; label: string; icon: React.ReactNode }[] = [
  { key: "materials",  label: "Материал",  icon: <FileText className="h-4 w-4" /> },
  { key: "students",   label: "Сурагчид",  icon: <Users className="h-4 w-4" /> },
  { key: "assignment", label: "Даалгавар", icon: <ClipboardList className="h-4 w-4" /> },
  { key: "quiz",       label: "Quiz",      icon: <HelpCircle className="h-4 w-4" /> },
];

const EDIT_SECTIONS: { key: EditSection; label: string; icon: string }[] = [
  { key: "materials",  label: "Материал",  icon: "📄" },
  { key: "parts",      label: "Лекц",      icon: "📚" },
  { key: "exercises",  label: "Дасгал",    icon: "🧪" },
  { key: "assignment", label: "Даалгавар", icon: "📋" },
  { key: "quiz",       label: "Quiz",      icon: "❓" },
];

const NOTEBOOKS = [
  { id: "", label: "— сонгох —" },
  { id: "exercise-crater-cnn",  label: "Exercise 1: CNN Crater Classification" },
  { id: "exercise-rf-vs-nn",    label: "Exercise 2: RF vs Neural Network" },
  { id: "exercise-surrogate",   label: "Exercise 3: Surrogate Model" },
];

const Q_TYPE_LABELS: Record<string, string> = {
  multiple: "🔘 Олон сонголт", short: "✏️ Богино хариулт",
  long: "📝 Урт хариулт", blank: "___ Нөхөх", matching: "↔️ Холбох",
};

function newQuestion(): QuizQuestion {
  return { id: uid(), type: "multiple", text: "", options: [
    { text: "", isCorrect: true }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false },
  ]};
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CourseStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${m.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

// ─── Dropdown menu ─────────────────────────────────────────────────────────────

function DropdownMenu({
  onEdit, onDuplicate, onTogglePublish, onDelete, isPublished,
}: {
  onEdit: () => void; onDuplicate: () => void;
  onTogglePublish: () => void; onDelete: () => void; isPublished: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const item = (icon: React.ReactNode, label: string, onClick: () => void, danger = false) => (
    <button
      type="button"
      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-white/5 ${danger ? "text-rose-400" : "text-slate-300"}`}
      onClick={() => { onClick(); setOpen(false); }}
    >
      {icon}{label}
    </button>
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:border-white/20 hover:text-slate-200"
        onClick={() => setOpen((o) => !o)}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1829] shadow-xl">
          {item(<Edit2 className="h-4 w-4" />, "✏️ Засварлах", onEdit)}
          {item(<Copy className="h-4 w-4" />, "📋 Хуулбарлах", onDuplicate)}
          {item(<Eye className="h-4 w-4" />, isPublished ? "🚫 Нийтлэлтийг зогсоох" : "🟢 Нийтлэх", onTogglePublish)}
          <div className="mx-3 border-t border-white/8" />
          {item(<Trash2 className="h-4 w-4" />, "🗑️ Устгах", onDelete, true)}
        </div>
      )}
    </div>
  );
}

// ─── CourseCard ────────────────────────────────────────────────────────────────

function CourseCard({
  course, onView, onEdit, onStatusChange, onDelete,
}: {
  course: Course;
  onView: () => void; onEdit: () => void;
  onStatusChange: (id: number, status: CourseStatus) => void;
  onDelete: (id: number) => void;
}) {
  const stats = [
    { icon: "📄", label: "Материал", value: `${course.materialCount} файл` },
    { icon: "📝", label: "Лекц",     value: `${course.partCount} хэсэг` },
    { icon: "🧪", label: "Дасгал",   value: `${course.exerciseCount} notebook` },
    { icon: "❓", label: "Quiz",     value: `${course.quizCount} асуулт` },
  ];

  const handleDuplicate = () => {
    fetch("http://localhost:8000/api/instructor/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...course, title: `${course.title} (хуулбар)`, status: "draft" }),
    }).catch(() => {});
  };

  return (
    <div className="glass-panel rounded-[28px] p-6 space-y-5 transition hover:ring-1 hover:ring-white/10">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={course.status} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300"
          >
            <Edit2 className="h-3.5 w-3.5" /> Засах
          </button>
          <button
            type="button"
            onClick={onView}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300"
          >
            <Eye className="h-3.5 w-3.5" /> Харах
          </button>
          <DropdownMenu
            isPublished={course.status === "published"}
            onEdit={onEdit}
            onDuplicate={handleDuplicate}
            onTogglePublish={() => onStatusChange(course.id, course.status === "published" ? "draft" : "published")}
            onDelete={() => onDelete(course.id)}
          />
        </div>
      </div>

      {/* Title */}
      <div>
        <h3 className="text-lg font-semibold text-slate-50">{course.title}</h3>
        <p className="mt-0.5 text-sm text-slate-400">{course.description}</p>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/8 bg-white/3 px-3 py-2.5 text-center">
            <p className="text-base">{s.icon}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-200">{s.value}</p>
            <p className="text-[10px] text-slate-600">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {course.studentCount} сурагч суралцаж байна</span>
        {course.avgScore > 0 && <span className="flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> Дундаж оноо: <span className="text-emerald-300 font-medium">{course.avgScore}%</span></span>}
        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Үүсгэсэн: {course.createdAt}</span>
      </div>

      {/* Assignment section */}
      {course.assignmentName && (
        <div className="border-t border-white/8 pt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Даалгавар</p>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-200">📋 {course.assignmentName}</p>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                {course.dueDate && <span>⏰ Хугацаа: {course.dueDate}</span>}
                {course.submissionCount > 0 && (
                  <span>
                    ✅ <span className="text-emerald-300">{course.submissionCount}</span>/{course.studentCount} илгээсэн
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onView}
              className="shrink-0 rounded-xl border border-sky-400/20 bg-sky-400/8 px-3 py-1.5 text-xs text-sky-300 transition hover:bg-sky-400/15"
            >
              Харах →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CourseListView ────────────────────────────────────────────────────────────

function CourseListView({
  onView, onEdit, onCreate,
}: {
  onView: (c: Course) => void; onEdit: (c: Course) => void; onCreate: () => void;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("Бүгд");

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("http://localhost:8000/api/instructor/courses", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setCourses(d.courses ?? MOCK_COURSES))
      .catch(() => setCourses(MOCK_COURSES))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  const filtered = courses.filter((c) => {
    const f = FILTER_MAP[activeTab];
    return f === null || c.status === f;
  });

  const handleStatusChange = (id: number, status: CourseStatus) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    fetch(`http://localhost:8000/api/instructor/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  };

  const handleDelete = (id: number) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    fetch(`http://localhost:8000/api/instructor/courses/${id}`, { method: "DELETE" }).catch(() => {});
  };

  return (
    <section className="space-y-6">
      {/* Top bar */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">Багш</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-50">Миний хичээлүүд</h1>
          <p className="mt-1 text-sm text-slate-400">
            Та оруулсан хичээл, даалгавруудаа энд харж, засварлах боломжтой
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="flex shrink-0 items-center gap-2 rounded-2xl bg-sky-500/80 px-5 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-sky-500"
        >
          <Plus className="h-4 w-4" /> Шинэ хичээл
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeTab === tab ? "bg-sky-500 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            }`}
          >
            {tab}
            {tab !== "Бүгд" && (
              <span className="ml-1.5 text-[10px] opacity-70">
                ({courses.filter((c) => c.status === FILTER_MAP[tab]).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Course grid */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Ачааллаж байна…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <BookOpen className="h-12 w-12 text-slate-700" />
          <p className="text-sm text-slate-500">Хичээл олдсонгүй</p>
          <button type="button" onClick={onCreate}
            className="rounded-2xl bg-sky-400/15 px-5 py-2.5 text-sm text-sky-300 transition hover:bg-sky-400/25">
            + Шинэ хичээл үүсгэх
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onView={() => onView(c)}
              onEdit={() => onEdit(c)}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── CourseDetailView ──────────────────────────────────────────────────────────

function CourseDetailView({
  course, onBack, onEdit,
}: {
  course: Course; onBack: () => void; onEdit: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>("materials");
  const [students, setStudents] = useState<DetailStudent[]>(MOCK_DETAIL_STUDENTS);
  const [feedbackFor, setFeedbackFor] = useState<DetailStudent | null>(null);
  const [fbGrade, setFbGrade] = useState("");
  const [fbText, setFbText] = useState("");
  const [fbSending, setFbSending] = useState(false);

  const toggleStudent = (id: string) =>
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, expanded: !s.expanded } : s)));

  const sendFeedback = async () => {
    if (!feedbackFor) return;
    setFbSending(true);
    try {
      await fetch("http://localhost:8000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: feedbackFor.id, grade: Number(fbGrade), comment: fbText }),
      });
    } catch { /* offline */ }
    setStudents((prev) => prev.map((s) =>
      s.id === feedbackFor.id ? { ...s, status: "approved" as const } : s
    ));
    setFbSending(false);
    setFeedbackFor(null);
    setFbGrade("");
    setFbText("");
  };

  const statusLabel = (s: DetailStudent["status"]) =>
    s === "approved" ? <span className="text-xs text-emerald-300">✅ Баталж</span>
    : s === "in_progress" ? <span className="text-xs text-amber-300">⏳ Явцад</span>
    : <span className="text-xs text-sky-300">🔵 Эхэлсэн</span>;

  const allFiles = [
    ...course.pptFiles.map((f) => ({ ...f, size: "—" })),
    ...course.pdfFiles.map((f) => ({ ...f, size: "—" })),
    ...course.videoFiles.map((f) => ({ ...f, size: "—" })),
    ...course.links.map((l, i) => ({ id: `link-${i}`, name: l, type: "link", size: "URL" })),
  ];

  return (
    <section className="space-y-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button type="button" onClick={onBack}
          className="mt-1 rounded-xl border border-white/10 p-2 text-slate-400 hover:text-slate-200">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-slate-50">{course.title}</h1>
          <p className="mt-0.5 text-sm text-slate-400">{course.description}</p>
        </div>
        <button type="button" onClick={onEdit}
          className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:border-sky-400/30 hover:text-sky-300">
          <Edit2 className="h-4 w-4" /> Засах
        </button>
      </div>

      {/* Stats banner */}
      <div className="glass-panel grid grid-cols-3 gap-0 divide-x divide-white/10 rounded-[28px] overflow-hidden">
        {[
          { label: "Сурагч", value: course.studentCount, icon: <Users className="h-5 w-5 text-sky-300" /> },
          { label: "Дундаж оноо", value: course.avgScore > 0 ? `${course.avgScore}%` : "—", icon: <BarChart3 className="h-5 w-5 text-emerald-300" /> },
          { label: "Дүүргэсэн", value: course.submissionCount, icon: <Check className="h-5 w-5 text-amber-300" /> },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1 py-5">
            {s.icon}
            <p className="text-xl font-semibold text-slate-50">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
        {DETAIL_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition ${
              tab === t.key ? "bg-sky-400/20 text-sky-200" : "text-slate-400 hover:text-slate-300"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* МАТЕРИАЛ TAB */}
      {tab === "materials" && (
        <div className="glass-panel rounded-[28px] overflow-hidden">
          {allFiles.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">Материал байхгүй байна</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {["Нэр", "Төрөл", "Хэмжээ", ""].map((h) => (
                    <th key={h} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFiles.map((f) => (
                  <tr key={f.id} className="border-b border-white/5 hover:bg-white/3">
                    <td className="px-5 py-3 font-medium text-slate-200">
                      {f.type === "ppt" ? "📊" : f.type === "pdf" ? "📄" : f.type === "link" ? "🔗" : "🎥"} {f.name}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{f.type.toUpperCase()}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{f.size}</td>
                    <td className="px-5 py-3">
                      <button type="button" className="text-xs text-slate-500 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* СУРАГЧИД TAB */}
      {tab === "students" && (
        <div className="glass-panel overflow-hidden rounded-[28px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {["#", "Нэр", "Явц", "Accuracy", "Quiz", "Статус", ""].map((h) => (
                  <th key={h} className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <>
                  <tr
                    key={s.id}
                    className={`cursor-pointer border-b border-white/5 transition hover:bg-white/3 ${s.expanded ? "bg-sky-400/5" : ""}`}
                    onClick={() => toggleStudent(s.id)}
                  >
                    <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-100">{s.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-sky-400" style={{ width: `${s.progress}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{s.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-200">{s.accuracy}</td>
                    <td className="px-4 py-3 text-slate-200">{s.quizScore}</td>
                    <td className="px-4 py-3">{statusLabel(s.status)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {s.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </td>
                  </tr>
                  {s.expanded && (
                    <tr key={`${s.id}-exp`}>
                      <td colSpan={7} className="pb-3 pt-1">
                        <div className="mx-4 rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4 space-y-3">
                          {s.submissionNotes ? (
                            <>
                              <div className="grid gap-3 text-sm sm:grid-cols-3">
                                <div><p className="text-xs text-slate-500 mb-0.5">Accuracy</p><p className="font-mono text-emerald-300 font-semibold">{s.accuracy}</p></div>
                                <div><p className="text-xs text-slate-500 mb-0.5">Илгээсэн</p><p className="text-slate-200">{s.submittedAt}</p></div>
                              </div>
                              <div><p className="text-xs text-slate-500 mb-1">Тайлбар</p><p className="text-sm text-slate-300">{s.submissionNotes}</p></div>
                            </>
                          ) : (
                            <p className="text-sm text-slate-500 italic">Илгээлт байхгүй</p>
                          )}
                          <div className="flex gap-2">
                            <button type="button"
                              onClick={(e) => { e.stopPropagation(); setFeedbackFor(s); }}
                              className="flex items-center gap-1.5 rounded-xl border border-sky-400/20 bg-sky-400/8 px-3 py-2 text-xs text-sky-300 transition hover:bg-sky-400/15">
                              <MessageSquare className="h-3.5 w-3.5" /> Оноо өгөх
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ДААЛГАВАР TAB */}
      {tab === "assignment" && (
        <div className="space-y-4">
          <div className="glass-panel rounded-[28px] p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">📋 {course.assignment.name}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{course.assignment.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              {course.assignment.dueDate && (
                <div><p className="text-xs text-slate-500 mb-0.5">Дуусах хугацаа</p><p className="text-slate-200">{course.assignment.dueDate}</p></div>
              )}
              <div><p className="text-xs text-slate-500 mb-0.5">Min accuracy</p><p className="text-emerald-300 font-medium">{course.assignment.minAccuracy}%</p></div>
              <div><p className="text-xs text-slate-500 mb-0.5">Илгээлт</p><p className="text-slate-200">{course.submissionCount}/{course.studentCount}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* QUIZ TAB */}
      {tab === "quiz" && (
        <div className="space-y-4">
          {course.quizQuestions.length === 0 ? (
            <div className="glass-panel rounded-[28px] py-12 text-center text-sm text-slate-500">Quiz асуулт байхгүй байна</div>
          ) : (
            course.quizQuestions.map((q, i) => (
              <div key={q.id} className="glass-panel rounded-[28px] p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Q{i + 1}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-400">
                    {Q_TYPE_LABELS[q.type] ?? q.type}
                  </span>
                </div>
                <p className="text-sm text-slate-200">{q.text}</p>
                {q.options && (
                  <div className="space-y-1.5">
                    {q.options.map((o, oi) => (
                      <div key={oi} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${o.isCorrect ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/20" : "bg-white/3 text-slate-400"}`}>
                        <span>{String.fromCharCode(65 + oi)}.</span> {o.text || "—"}
                        {o.isCorrect && <Check className="ml-auto h-3.5 w-3.5" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Feedback modal */}
      {feedbackFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-[28px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-100">{feedbackFor.name}</p>
              <button type="button" onClick={() => setFeedbackFor(null)}><X className="h-5 w-5 text-slate-500" /></button>
            </div>
            <input type="number" min={0} max={100} placeholder="Оноо (0–100)"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-400/40"
              value={fbGrade} onChange={(e) => setFbGrade(e.target.value)} />
            <textarea placeholder="Санал бичнэ үү..."
              className="h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-400/40"
              value={fbText} onChange={(e) => setFbText(e.target.value)} />
            <button type="button" onClick={sendFeedback} disabled={fbSending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-400/15 py-3 text-sm font-medium text-sky-200 ring-1 ring-sky-400/30 transition hover:bg-sky-400/25 disabled:opacity-50">
              {fbSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Илгээх
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── EditCourseView ────────────────────────────────────────────────────────────

function EditCourseView({ course, onBack, onSaved }: {
  course: Course; onBack: () => void; onSaved: (c: Course) => void;
}) {
  const [section, setSection] = useState<EditSection>("materials");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Local editable state
  const [title, setTitle] = useState(course.title);
  const [desc, setDesc] = useState(course.description);
  const [parts, setParts] = useState<CoursePart[]>(course.parts);
  const [questions, setQuestions] = useState<QuizQuestion[]>(course.quizQuestions);
  const [assName, setAssName] = useState(course.assignment.name);
  const [assDesc, setAssDesc] = useState(course.assignment.description);
  const [dueDate, setDueDate] = useState(course.assignment.dueDate);
  const [minAcc, setMinAcc] = useState(course.assignment.minAccuracy);

  const save = async () => {
    setSaving(true);
    const updated: Course = {
      ...course, title, description: desc, parts, quizQuestions: questions,
      assignment: { name: assName, description: assDesc, dueDate, minAccuracy: minAcc },
    };
    try {
      await fetch(`http://localhost:8000/api/instructor/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch { /* offline */ }
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onSaved(updated); }, 1200);
  };

  const updatePart = (id: string, p: CoursePart) => setParts((prev) => prev.map((x) => (x.id === id ? p : x)));
  const removePart = (id: string) => setParts((prev) => prev.filter((x) => x.id !== id));
  const addPart = () => setParts((prev) => [...prev, { id: uid(), title: "", bullets: [""], exerciseId: "" }]);
  const movePart = (i: number, dir: -1 | 1) => {
    const arr = [...parts]; const j = i + dir; [arr[i], arr[j]] = [arr[j], arr[i]]; setParts(arr);
  };

  const updateOpt = (qId: string, oi: number, text: string) =>
    setQuestions((prev) => prev.map((q) => q.id !== qId ? q : {
      ...q, options: (q.options ?? []).map((o, i) => i === oi ? { ...o, text } : o),
    }));
  const setCorrect = (qId: string, oi: number) =>
    setQuestions((prev) => prev.map((q) => q.id !== qId ? q : {
      ...q, options: (q.options ?? []).map((o, i) => ({ ...o, isCorrect: i === oi })),
    }));

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button type="button" onClick={onBack}
          className="mt-1 rounded-xl border border-white/10 p-2 text-slate-400 hover:text-slate-200">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">Багш</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-50">Хичээл засварлах</h1>
          <p className="mt-0.5 text-sm text-slate-400">{course.title}</p>
        </div>
        <button type="button" onClick={save} disabled={saving}
          className="flex items-center gap-2 rounded-2xl bg-emerald-400/15 px-5 py-3 text-sm font-medium text-emerald-200 ring-1 ring-emerald-400/30 transition hover:bg-emerald-400/25 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <FlaskConical className="h-4 w-4" />}
          {saved ? "Хадгалагдлаа!" : "Өөрчлөлт хадгалах"}
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2">
        {EDIT_SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            className={`flex items-center gap-1.5 rounded-2xl border px-4 py-2 text-sm font-medium transition ${
              section === s.key
                ? "border-sky-400/30 bg-sky-400/15 text-sky-200"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      <div className="glass-panel rounded-[28px] p-6 space-y-5">

        {/* ── МАТЕРИАЛ section ── */}
        {section === "materials" && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-300">Гарчиг ба тайлбар</p>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
              placeholder="Хичээлийн нэр"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
              placeholder="Тайлбар..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <div className="border-t border-white/8 pt-4">
              <p className="mb-3 text-sm font-medium text-slate-300">Одоогийн файлууд</p>
              {[...course.pptFiles, ...course.pdfFiles, ...course.videoFiles].length === 0 ? (
                <p className="text-sm text-slate-500 italic">Файл байхгүй байна</p>
              ) : (
                <div className="space-y-2">
                  {[...course.pptFiles, ...course.pdfFiles, ...course.videoFiles].map((f) => (
                    <div key={f.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
                      <span className="text-sm text-slate-300 flex-1">{f.type === "ppt" ? "📊" : f.type === "pdf" ? "📄" : "🎥"} {f.name}</span>
                      <button type="button"><Trash2 className="h-4 w-4 text-slate-600 hover:text-rose-400" /></button>
                    </div>
                  ))}
                </div>
              )}
              <button type="button"
                className="mt-3 flex items-center gap-2 rounded-2xl border border-dashed border-white/15 px-4 py-3 text-sm text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300">
                <Plus className="h-4 w-4" /> Шинэ файл нэмэх
              </button>
            </div>
          </div>
        )}

        {/* ── ЛЕКЦ section ── */}
        {section === "parts" && (
          <div className="space-y-4">
            {parts.map((part, i) => (
              <div key={part.id} className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-sky-300">Part {i + 1}</span>
                  <div className="flex-1" />
                  <button type="button" onClick={() => movePart(i, -1)} disabled={i === 0}
                    className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-500 disabled:opacity-30 hover:text-slate-200">↑</button>
                  <button type="button" onClick={() => movePart(i, 1)} disabled={i === parts.length - 1}
                    className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-500 disabled:opacity-30 hover:text-slate-200">↓</button>
                  <button type="button" onClick={() => removePart(part.id)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-400/10 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
                  placeholder="Гарчиг..."
                  value={part.title}
                  onChange={(e) => updatePart(part.id, { ...part, title: e.target.value })}
                />
                <div className="space-y-1.5">
                  {part.bullets.map((b, bi) => (
                    <div key={bi} className="flex items-center gap-2">
                      <span className="text-slate-600">•</span>
                      <input
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-400/30"
                        placeholder="Агуулга..."
                        value={b}
                        onChange={(e) => { const bl = [...part.bullets]; bl[bi] = e.target.value; updatePart(part.id, { ...part, bullets: bl }); }}
                      />
                      <button type="button" onClick={() => updatePart(part.id, { ...part, bullets: part.bullets.filter((_, j) => j !== bi) })} disabled={part.bullets.length === 1}>
                        <X className="h-3.5 w-3.5 text-slate-600 hover:text-rose-400" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => updatePart(part.id, { ...part, bullets: [...part.bullets, ""] })}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-sky-300">
                    <Plus className="h-3 w-3" /> Цэг нэмэх
                  </button>
                </div>
                <div>
                  <p className="mb-1 text-xs text-slate-500">Дасгал (notebook)</p>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-[#0f1c2e] px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-400/40"
                    value={part.exerciseId}
                    onChange={(e) => updatePart(part.id, { ...part, exerciseId: e.target.value })}
                  >
                    {NOTEBOOKS.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                  </select>
                </div>
              </div>
            ))}
            <button type="button" onClick={addPart}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-4 text-sm text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300">
              <Plus className="h-4 w-4" /> Part нэмэх
            </button>
          </div>
        )}

        {/* ── ДАСГАЛ section ── */}
        {section === "exercises" && (
          <div className="space-y-4">
            {parts.filter((p) => p.exerciseId).length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Лекц хэсэгт дасгал нэмнэ үү</p>
            ) : (
              parts.filter((p) => p.exerciseId).map((p) => (
                <div key={p.id} className="rounded-2xl border border-white/10 bg-white/3 p-5">
                  <p className="text-sm font-medium text-slate-200 mb-2">
                    {NOTEBOOKS.find((n) => n.id === p.exerciseId)?.label ?? p.exerciseId}
                  </p>
                  <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 font-mono text-xs text-slate-400">
                    {p.exerciseId}.ipynb
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── ДААЛГАВАР section ── */}
        {section === "assignment" && (
          <div className="space-y-4">
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
              placeholder="Даалгаврын нэр *"
              value={assName}
              onChange={(e) => setAssName(e.target.value)}
            />
            <textarea
              className="h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
              placeholder="Тайлбар..."
              value={assDesc}
              onChange={(e) => setAssDesc(e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs text-slate-500">Дуусах хугацаа</p>
                <input type="date"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 outline-none focus:border-sky-400/40"
                  value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div>
                <p className="mb-1.5 text-xs text-slate-500">Min accuracy (%)</p>
                <input type="number" min={0} max={100}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 outline-none focus:border-sky-400/40"
                  value={minAcc} onChange={(e) => setMinAcc(Number(e.target.value))} />
              </div>
            </div>
          </div>
        )}

        {/* ── QUIZ section ── */}
        {section === "quiz" && (
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={q.id} className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Q{i + 1}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-400">{Q_TYPE_LABELS[q.type] ?? q.type}</span>
                  <button type="button" onClick={() => setQuestions((prev) => prev.filter((x) => x.id !== q.id))}
                    className="ml-auto rounded-lg p-1 text-slate-600 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-400/40"
                  placeholder="Асуулт..."
                  value={q.text}
                  onChange={(e) => setQuestions((prev) => prev.map((x) => x.id === q.id ? { ...x, text: e.target.value } : x))}
                />
                {q.type === "multiple" && q.options && (
                  <div className="space-y-2">
                    {q.options.map((o, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`correct-${q.id}`} checked={o.isCorrect}
                          onChange={() => setCorrect(q.id, oi)} className="accent-sky-400 shrink-0" />
                        <input
                          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-400/30"
                          placeholder={`Сонголт ${String.fromCharCode(65 + oi)}`}
                          value={o.text}
                          onChange={(e) => updateOpt(q.id, oi, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setQuestions((prev) => [...prev, newQuestion()])}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-3 text-sm text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300">
              <Plus className="h-4 w-4" /> Асуулт нэмэх
            </button>
          </div>
        )}

      </div>
    </section>
  );
}

// ─── Main router component ─────────────────────────────────────────────────────

export default function MyCourses() {
  const { setActiveView } = useUIStore();
  const [view, setView] = useState<InnerView>("list");
  const [selected, setSelected] = useState<Course | null>(null);

  if (view === "detail" && selected) {
    return (
      <CourseDetailView
        course={selected}
        onBack={() => setView("list")}
        onEdit={() => setView("edit")}
      />
    );
  }

  if (view === "edit" && selected) {
    return (
      <EditCourseView
        course={selected}
        onBack={() => setView("list")}
        onSaved={(updated) => { setSelected(updated); setView("list"); }}
      />
    );
  }

  return (
    <CourseListView
      onView={(c) => { setSelected(c); setView("detail"); }}
      onEdit={(c) => { setSelected(c); setView("edit"); }}
      onCreate={() => setActiveView("createCourse")}
    />
  );
}
