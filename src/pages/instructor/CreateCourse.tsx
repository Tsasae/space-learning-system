import { API_URL } from '../../config';
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardList,
  FileVideo,
  Link2,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useUIStore } from "../../store/uiStore";

// ─── Types ─────────────────────────────────────────────────────────────────────

type QType = "multiple" | "short" | "long" | "blank" | "matching";

interface Option { text: string; isCorrect: boolean; }
interface Pair { left: string; right: string; }

interface Question {
  id: string;
  type: QType;
  text: string;
  points: number;
  options: Option[];
  answer: string;
  sentence: string;
  pairs: Pair[];
}

interface Part {
  id: string;
  title: string;
  bullets: string[];
  exerciseId: string;
}

interface MaterialFile { id: string; name: string; }

// ─── Constants ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const STEP_LABELS = ["Нэршил", "Материал", "Лекц", "Notebook", "Даалгавар", "Quiz"];

const NOTEBOOKS = [
  { id: "", label: "— сонгох —" },
  { id: "exercise-crater-cnn", label: "Exercise 1: CNN Crater Classification" },
  { id: "exercise-rf-vs-nn", label: "Exercise 2: RF vs Neural Network" },
  { id: "exercise-surrogate", label: "Exercise 3: Surrogate Model" },
];

const Q_TYPE_LABELS: Record<QType, string> = {
  multiple: "🔘 Олон сонголт",
  short: "✏️ Богино хариулт",
  long: "📝 Урт хариулт",
  blank: "___ Нөхөх",
  matching: "↔️ Холбох",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function newQuestion(type: QType): Question {
  return {
    id: uid(), type, text: "", points: 1, answer: "", sentence: "",
    options: type === "multiple"
      ? [{ text: "", isCorrect: true }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }]
      : [],
    pairs: type === "matching" ? [{ left: "", right: "" }, { left: "", right: "" }] : [],
  };
}

function newPart(): Part {
  return { id: uid(), title: "", bullets: [""], exerciseId: "" };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = current > n;
        const active = current === n;
        return (
          <div key={n} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  done ? "bg-emerald-400 text-slate-900"
                  : active ? "bg-sky-400 text-slate-900 ring-4 ring-sky-400/30"
                  : "border border-white/20 bg-white/5 text-slate-500"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : n}
              </div>
              <span className={`hidden text-[10px] font-medium sm:block ${active ? "text-sky-300" : done ? "text-emerald-300" : "text-slate-600"}`}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`mx-1 h-px flex-1 transition-colors ${done ? "bg-emerald-400/50" : "bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DropZone({
  label, icon, accept, files, onAdd, onRemove,
}: {
  label: string; icon: React.ReactNode; accept: string;
  files: MaterialFile[]; onAdd: (f: MaterialFile) => void; onRemove: (id: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = (f: File) => onAdd({ id: uid(), name: f.name });

  return (
    <div className="space-y-2">
      <div
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-5 py-6 text-center transition ${
          dragging ? "border-sky-400 bg-sky-400/10" : "border-white/15 bg-white/3 hover:border-white/25"
        }`}
        onClick={() => ref.current?.click()}
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault(); setDragging(false);
          const f = e.dataTransfer.files[0]; if (f) handle(f);
        }}
      >
        <input ref={ref} type="file" accept={accept} className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }} />
        <div className="text-sky-300/70">{icon}</div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-xs text-slate-600">Drag &amp; drop эсвэл сонгох</p>
      </div>
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <span className="flex-1 truncate text-xs text-slate-300">{f.name}</span>
              <button type="button" onClick={() => onRemove(f.id)}><X className="h-3.5 w-3.5 text-slate-500 hover:text-rose-400" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PartCard({
  part, index, total, onChange, onRemove, onMoveUp, onMoveDown,
}: {
  part: Part; index: number; total: number;
  onChange: (p: Part) => void; onRemove: () => void;
  onMoveUp: () => void; onMoveDown: () => void;
}) {
  const setBullet = (i: number, val: string) => {
    const b = [...part.bullets]; b[i] = val; onChange({ ...part, bullets: b });
  };
  const addBullet = () => onChange({ ...part, bullets: [...part.bullets, ""] });
  const removeBullet = (i: number) => onChange({ ...part, bullets: part.bullets.filter((_, j) => j !== i) });

  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-sky-300">Part {index + 1}</span>
        <div className="flex-1" />
        <button type="button" onClick={onMoveUp} disabled={index === 0}
          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-400 disabled:opacity-30 hover:text-slate-200">↑</button>
        <button type="button" onClick={onMoveDown} disabled={index === total - 1}
          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-400 disabled:opacity-30 hover:text-slate-200">↓</button>
        <button type="button" onClick={onRemove}
          className="ml-1 rounded-lg p-1.5 text-slate-500 hover:bg-rose-400/10 hover:text-rose-400">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <input
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
        placeholder="Гарчиг..."
        value={part.title}
        onChange={(e) => onChange({ ...part, title: e.target.value })}
      />

      <div className="space-y-2">
        <p className="text-xs text-slate-500">Агуулга</p>
        {part.bullets.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-slate-600">•</span>
            <input
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-sky-400/30"
              placeholder="Цэг нэмэх..."
              value={b}
              onChange={(e) => setBullet(i, e.target.value)}
            />
            <button type="button" onClick={() => removeBullet(i)} disabled={part.bullets.length === 1}>
              <X className="h-3.5 w-3.5 text-slate-600 hover:text-rose-400" />
            </button>
          </div>
        ))}
        <button type="button" onClick={addBullet}
          className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-sky-300">
          <Plus className="h-3 w-3" /> Цэг нэмэх
        </button>
      </div>

      <div>
        <p className="mb-1.5 text-xs text-slate-500">Дасгал (notebook)</p>
        <div className="relative">
          <select
            className="w-full appearance-none rounded-xl border border-white/10 bg-[#0f1c2e] px-4 py-2.5 pr-8 text-sm text-slate-200 outline-none focus:border-sky-400/40"
            value={part.exerciseId}
            onChange={(e) => onChange({ ...part, exerciseId: e.target.value })}
          >
            {NOTEBOOKS.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
      </div>
    </div>
  );
}

function QuestionCard({
  q, index, onChange, onRemove,
}: {
  q: Question; index: number;
  onChange: (q: Question) => void; onRemove: () => void;
}) {
  const setOpt = (i: number, text: string) => {
    const opts = q.options.map((o, j) => j === i ? { ...o, text } : o);
    onChange({ ...q, options: opts });
  };
  const setCorrect = (i: number) => {
    onChange({ ...q, options: q.options.map((o, j) => ({ ...o, isCorrect: j === i })) });
  };
  const addOpt = () => onChange({ ...q, options: [...q.options, { text: "", isCorrect: false }] });
  const removeOpt = (i: number) => onChange({ ...q, options: q.options.filter((_, j) => j !== i) });

  const setPair = (i: number, side: "left" | "right", val: string) => {
    const pairs = q.pairs.map((p, j) => j === i ? { ...p, [side]: val } : p);
    onChange({ ...q, pairs });
  };
  const addPair = () => onChange({ ...q, pairs: [...q.pairs, { left: "", right: "" }] });
  const removePair = (i: number) => onChange({ ...q, pairs: q.pairs.filter((_, j) => j !== i) });

  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400">Q{index + 1}</span>
        <div className="relative flex-1">
          <select
            className="w-full appearance-none rounded-xl border border-white/10 bg-[#0f1c2e] px-3 py-2 pr-8 text-xs text-slate-300 outline-none focus:border-sky-400/40"
            value={q.type}
            onChange={(e) => onChange(newQuestion(e.target.value as QType))}
          >
            {(Object.keys(Q_TYPE_LABELS) as QType[]).map((t) => (
              <option key={t} value={t}>{Q_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
        </div>
        <div className="flex items-center gap-1">
          <input
            className="w-12 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-center text-xs text-slate-200 outline-none focus:border-sky-400/40"
            type="number" min={1} value={q.points}
            onChange={(e) => onChange({ ...q, points: Number(e.target.value) })}
          />
          <span className="text-xs text-slate-500">pt</span>
        </div>
        <button type="button" onClick={onRemove}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-400/10 hover:text-rose-400">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Question text */}
      {q.type !== "blank" && (
        <input
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
          placeholder="Асуулт..."
          value={q.text}
          onChange={(e) => onChange({ ...q, text: e.target.value })}
        />
      )}

      {/* Multiple choice */}
      {q.type === "multiple" && (
        <div className="space-y-2">
          {q.options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name={`correct-${q.id}`} checked={o.isCorrect}
                onChange={() => setCorrect(i)} className="accent-sky-400 shrink-0" />
              <input
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-sky-400/30"
                placeholder={`Сонголт ${String.fromCharCode(65 + i)}`}
                value={o.text}
                onChange={(e) => setOpt(i, e.target.value)}
              />
              <button type="button" onClick={() => removeOpt(i)} disabled={q.options.length <= 2}>
                <X className="h-3.5 w-3.5 text-slate-600 hover:text-rose-400" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addOpt}
            className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-sky-300">
            <Plus className="h-3 w-3" /> Сонголт нэмэх
          </button>
          <p className="text-[10px] text-slate-600">● Зөв хариуг сонгоно уу</p>
        </div>
      )}

      {/* Short answer */}
      {q.type === "short" && (
        <input
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
          placeholder="Зөв хариулт..."
          value={q.answer}
          onChange={(e) => onChange({ ...q, answer: e.target.value })}
        />
      )}

      {/* Long answer */}
      {q.type === "long" && (
        <p className="text-xs text-slate-500 italic">Урт хариулт — багш шалгана</p>
      )}

      {/* Fill in blank */}
      {q.type === "blank" && (
        <div className="space-y-2">
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
            placeholder='Өгүүлбэр ("___" -г нөхөх хэсэгт тавина уу)'
            value={q.sentence}
            onChange={(e) => onChange({ ...q, sentence: e.target.value })}
          />
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
            placeholder="Зөв хариулт..."
            value={q.answer}
            onChange={(e) => onChange({ ...q, answer: e.target.value })}
          />
        </div>
      )}

      {/* Matching */}
      {q.type === "matching" && (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs text-slate-500 px-1">
            <span>Зүүн тал</span><span />
            <span>Баруун тал</span>
          </div>
          {q.pairs.map((p, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
              <input
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-400/30"
                placeholder="Зүүн..."
                value={p.left}
                onChange={(e) => setPair(i, "left", e.target.value)}
              />
              <span className="text-slate-500">↔</span>
              <input
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-400/30"
                placeholder="Баруун..."
                value={p.right}
                onChange={(e) => setPair(i, "right", e.target.value)}
              />
              <button type="button" onClick={() => removePair(i)} disabled={q.pairs.length <= 2}>
                <X className="h-3.5 w-3.5 text-slate-600 hover:text-rose-400" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addPair}
            className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-sky-300">
            <Plus className="h-3 w-3" /> Хос нэмэх
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Success screen ────────────────────────────────────────────────────────────

function SuccessScreen({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/15 ring-4 ring-emerald-400/20">
        <Check className="h-10 w-10 text-emerald-400" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">Амжилттай нийтлэгдлээ!</h2>
        <p className="mt-2 text-sm text-slate-400">
          "<span className="text-slate-200">{title}</span>" хичээл оюутнуудад харагдах болно.
        </p>
      </div>
      <button
        className="rounded-2xl bg-sky-400/15 px-6 py-3 text-sm font-medium text-sky-200 transition hover:bg-sky-400/25"
        type="button"
        onClick={onBack}
      >
        ← Буцах
      </button>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function CreateCourse() {
  const { setActiveView } = useUIStore();
  const [step, setStep] = useState(1);

  // Step 1
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");

  // Step 2
  const [pptFiles, setPptFiles] = useState<MaterialFile[]>([]);
  const [pdfFiles, setPdfFiles] = useState<MaterialFile[]>([]);
  const [videoFiles, setVideoFiles] = useState<MaterialFile[]>([]);
  const [links, setLinks] = useState<string[]>([""]);

  // Step 3
  const [parts, setParts] = useState<Part[]>([newPart()]);

  // Step 4 – per-exercise notebook config
  const [nbDesc, setNbDesc] = useState<Record<string, string>>({});
  const [nbReqs, setNbReqs] = useState<Record<string, string[]>>({});

  // Step 5
  const [assName, setAssName] = useState("");
  const [assDesc, setAssDesc] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [minAccuracy, setMinAccuracy] = useState(80);

  // Step 6
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passThreshold, setPassThreshold] = useState(75);
  const [timeLimit, setTimeLimit] = useState(30);

  // UI
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  // Derived: exercises from step 3
  const exercises = parts.filter((p) => p.exerciseId);

  // ── validation ──────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    if (step === 1 && !courseTitle.trim()) { setError("Хичээлийн нэр оруулна уу"); return false; }
    if (step === 3 && parts.some((p) => !p.title.trim())) { setError("Бүх хэсгийн гарчиг оруулна уу"); return false; }
    if (step === 5 && !assName.trim()) { setError("Даалгаврын нэр оруулна уу"); return false; }
    if (step === 6 && questions.length === 0) { setError("Дор хаяж нэг асуулт нэмнэ үү"); return false; }
    setError("");
    return true;
  };

  const next = () => { if (validate()) setStep((s) => Math.min(s + 1, 6)); };
  const back = () => { setError(""); setStep((s) => Math.max(s - 1, 1)); };

  // ── publish ─────────────────────────────────────────────────────────────────

  const publish = async () => {
    if (!validate()) return;
    setPublishing(true);
    try {
      const res = await fetch(`${API_URL}/api/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: courseTitle,
          description: courseDesc,
          materials: { pptFiles, pdfFiles, videoFiles, links: links.filter(Boolean) },
          parts,
          assignment: { name: assName, description: assDesc, dueDate, minAccuracy },
          quiz: { questions, passThreshold, timeLimit },
          published: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Сервер алдаа (${res.status})`);
      }
      setPublished(true);
    } catch (err) {
      alert("Хичээл хадгалахад алдаа гарлаа: " + (err as Error).message);
    } finally {
      setPublishing(false);
    }
  };

  // ── part helpers ────────────────────────────────────────────────────────────

  const updatePart = (id: string, p: Part) => setParts((prev) => prev.map((x) => (x.id === id ? p : x)));
  const removePart = (id: string) => setParts((prev) => prev.filter((x) => x.id !== id));
  const movePart = (i: number, dir: -1 | 1) => {
    const arr = [...parts]; const j = i + dir;
    [arr[i], arr[j]] = [arr[j], arr[i]]; setParts(arr);
  };

  // ── question helpers ────────────────────────────────────────────────────────

  const addQuestion = (type: QType) => setQuestions((prev) => [...prev, newQuestion(type)]);
  const updateQ = (id: string, q: Question) => setQuestions((prev) => prev.map((x) => (x.id === id ? q : x)));
  const removeQ = (id: string) => setQuestions((prev) => prev.filter((x) => x.id !== id));

  if (published) return <SuccessScreen title={courseTitle} onBack={() => setActiveView("courses")} />;

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <section className="space-y-6">
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">Багш</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-50">Хичээл үүсгэх</h1>
        <p className="mt-1 text-sm text-slate-400">Шинэ хичээлийн бүх дэлгэрэнгүйг тохируулна уу</p>
      </div>

      {/* Step progress */}
      <StepBar current={step} />

      {/* Step card */}
      <div className="glass-panel rounded-[28px] p-8 space-y-6">
        {/* Step title */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
            Алхам {step} / {STEP_LABELS.length}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-100">
            {step === 1 && "Case Study нэршил"}
            {step === 2 && "Холбогдох материал оруулах"}
            {step === 3 && "Лекцийн агуулга үүсгэх"}
            {step === 4 && "Дасгалын notebook тохиргоо"}
            {step === 5 && "Даалгаврын тохиргоо"}
            {step === 6 && "Quiz асуулт үүсгэх"}
          </h2>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
            <X className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="space-y-4">
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
              placeholder="Case Study нэр *"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
            />
            <textarea
              className="h-32 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
              placeholder="Товч тайлбар..."
              value={courseDesc}
              onChange={(e) => setCourseDesc(e.target.value)}
            />
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-5">
            <DropZone
              label="📊 PPT/PPTX файл"
              icon={<Upload className="h-7 w-7" />}
              accept=".ppt,.pptx"
              files={pptFiles}
              onAdd={(f) => setPptFiles((p) => [...p, f])}
              onRemove={(id) => setPptFiles((p) => p.filter((f) => f.id !== id))}
            />
            <DropZone
              label="📄 PDF/Word файл"
              icon={<Upload className="h-7 w-7" />}
              accept=".pdf,.doc,.docx"
              files={pdfFiles}
              onAdd={(f) => setPdfFiles((p) => [...p, f])}
              onRemove={(id) => setPdfFiles((p) => p.filter((f) => f.id !== id))}
            />
            <DropZone
              label="🎥 Video файл"
              icon={<FileVideo className="h-7 w-7" />}
              accept=".mp4,.mov,.avi,.webm"
              files={videoFiles}
              onAdd={(f) => setVideoFiles((p) => [...p, f])}
              onRemove={(id) => setVideoFiles((p) => p.filter((f) => f.id !== id))}
            />

            {/* URL links */}
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm text-slate-400">
                <Link2 className="h-4 w-4 text-sky-300" /> YouTube / Гадаад холбоос
              </p>
              {links.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
                    placeholder="https://..."
                    value={l}
                    onChange={(e) => { const a = [...links]; a[i] = e.target.value; setLinks(a); }}
                  />
                  <button type="button"
                    onClick={() => setLinks((a) => a.filter((_, j) => j !== i))}
                    disabled={links.length === 1}
                    className="rounded-2xl border border-white/10 px-3 text-slate-500 hover:text-rose-400 disabled:opacity-30">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setLinks((a) => [...a, ""])}
                className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-sky-300">
                <Plus className="h-3 w-3" /> Холбоос нэмэх
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="space-y-4">
            {parts.map((part, i) => (
              <PartCard
                key={part.id}
                part={part}
                index={i}
                total={parts.length}
                onChange={(p) => updatePart(part.id, p)}
                onRemove={() => removePart(part.id)}
                onMoveUp={() => movePart(i, -1)}
                onMoveDown={() => movePart(i, 1)}
              />
            ))}
            <button
              type="button"
              onClick={() => setParts((p) => [...p, newPart()])}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-4 text-sm text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300"
            >
              <Plus className="h-4 w-4" /> Part нэмэх
            </button>
          </div>
        )}

        {/* ── STEP 4 ── */}
        {step === 4 && (
          <div className="space-y-5">
            {exercises.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/3 px-6 py-10 text-center text-sm text-slate-500">
                Алхам 3-д дасгал нэмэгдээгүй байна. Буцаж нэмж болно.
              </div>
            ) : (
              exercises.map((p) => {
                const nb = NOTEBOOKS.find((n) => n.id === p.exerciseId);
                const desc = nbDesc[p.id] ?? "";
                const reqs = nbReqs[p.id] ?? [""];
                const setDesc = (v: string) => setNbDesc((d) => ({ ...d, [p.id]: v }));
                const setReqs = (v: string[]) => setNbReqs((r) => ({ ...r, [p.id]: v }));
                return (
                  <div key={p.id} className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4">
                    <p className="text-sm font-medium text-slate-200">{nb?.label ?? p.exerciseId}</p>
                    <div>
                      <p className="mb-1.5 text-xs text-slate-500">Notebook файл</p>
                      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300">
                        {p.exerciseId}.ipynb
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs text-slate-500">Тайлбар</p>
                      <textarea
                        className="h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
                        placeholder="Дасгалын тайлбар..."
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500">Шаардлага</p>
                      {reqs.map((r, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          <input
                            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-sky-400/30"
                            placeholder="Шаардлага..."
                            value={r}
                            onChange={(e) => { const a = [...reqs]; a[i] = e.target.value; setReqs(a); }}
                          />
                          <button type="button" onClick={() => setReqs(reqs.filter((_, j) => j !== i))} disabled={reqs.length === 1}>
                            <X className="h-3.5 w-3.5 text-slate-600 hover:text-rose-400" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setReqs([...reqs, ""])}
                        className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-sky-300">
                        <Plus className="h-3 w-3" /> Шаардлага нэмэх
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── STEP 5 ── */}
        {step === 5 && (
          <div className="space-y-4">
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
              placeholder="Даалгаврын нэр *"
              value={assName}
              onChange={(e) => setAssName(e.target.value)}
            />
            <textarea
              className="h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
              placeholder="Тайлбар..."
              value={assDesc}
              onChange={(e) => setAssDesc(e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs text-slate-500">Дуусах хугацаа</p>
                <input
                  type="date"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 outline-none focus:border-sky-400/40"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <p className="mb-1.5 text-xs text-slate-500">Min accuracy (%)</p>
                <input
                  type="number" min={0} max={100}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 outline-none focus:border-sky-400/40"
                  value={minAccuracy}
                  onChange={(e) => setMinAccuracy(Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs text-slate-500">Холбогдох файл (заавал биш)</p>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/15 px-5 py-4 text-sm text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300">
                <ClipboardList className="h-5 w-5" />
                📎 Файл хавсаргах
                <input type="file" className="sr-only" />
              </label>
            </div>
          </div>
        )}

        {/* ── STEP 6 ── */}
        {step === 6 && (
          <div className="space-y-5">
            {/* Quiz settings */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs text-slate-500">Тэнцэх оноо (%)</p>
                <input
                  type="number" min={0} max={100}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 outline-none focus:border-sky-400/40"
                  value={passThreshold}
                  onChange={(e) => setPassThreshold(Number(e.target.value))}
                />
              </div>
              <div>
                <p className="mb-1.5 text-xs text-slate-500">Хугацаа (минут)</p>
                <input
                  type="number" min={0}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 outline-none focus:border-sky-400/40"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Question list */}
            {questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                q={q}
                index={i}
                onChange={(updated) => updateQ(q.id, updated)}
                onRemove={() => removeQ(q.id)}
              />
            ))}

            {/* Add question */}
            <div className="flex flex-wrap gap-2">
              {(Object.keys(Q_TYPE_LABELS) as QType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addQuestion(t)}
                  className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-300 transition hover:border-sky-400/30 hover:text-sky-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {Q_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={step === 1 ? () => setActiveView("courses") : back}
            className="flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-sm text-slate-400 transition hover:border-white/20 hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 1 ? "Цуцлах" : "Буцах"}
          </button>

          {step < 6 ? (
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-2 rounded-2xl bg-sky-400/15 px-6 py-3 text-sm font-medium text-sky-200 ring-1 ring-sky-400/30 transition hover:bg-sky-400/25"
            >
              Дараагийн алхам
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={publish}
              disabled={publishing}
              className="flex items-center gap-2 rounded-2xl bg-emerald-400/15 px-6 py-3 text-sm font-medium text-emerald-200 ring-1 ring-emerald-400/30 transition hover:bg-emerald-400/25 disabled:opacity-50"
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              💾 Хадгалах ба Нийтлэх
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
