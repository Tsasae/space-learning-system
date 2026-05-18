import { API_URL } from '../../config';
import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  Send,
  X,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Submission {
  id: string;
  accuracy: string;
  notes: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  caseLabel: string;
  progress: number;
  accuracy: string;
  status: "submitted" | "in_progress" | "not_started";
  submissions: Submission[];
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_STUDENTS: Student[] = [
  {
    id: "s1",
    name: "Bat-Erdene Gantulga",
    email: "student@lms.com",
    caseLabel: "Case 1",
    progress: 60,
    accuracy: "95.24%",
    status: "submitted",
    submissions: [
      {
        id: "sub1",
        accuracy: "95.24%",
        notes: "Random Forest загвар ашиглав. n_estimators=200, max_depth=10. Train/test split 80/20.",
        submittedAt: "2026-05-18",
        grade: undefined,
        feedback: undefined,
      },
    ],
  },
  {
    id: "s2",
    name: "Nominchimeg Dash",
    email: "nomin@lms.com",
    caseLabel: "Case 1",
    progress: 20,
    accuracy: "-",
    status: "in_progress",
    submissions: [],
  },
  {
    id: "s3",
    name: "Tserenpuntsag Bold",
    email: "tserenpu@lms.com",
    caseLabel: "Case 1",
    progress: 90,
    accuracy: "98.11%",
    status: "submitted",
    submissions: [
      {
        id: "sub2",
        accuracy: "98.11%",
        notes: "XGBoost + feature engineering. GridSearchCV-р hyperparameter тааруулав.",
        submittedAt: "2026-05-16",
        grade: 96,
        feedback: "Excellent performance! Great use of XGBoost and hyperparameter tuning.",
      },
    ],
  },
  {
    id: "s4",
    name: "Enkhjargal Sukhbaatar",
    email: "enkhjargal@lms.com",
    caseLabel: "Case 2",
    progress: 45,
    accuracy: "87.50%",
    status: "submitted",
    submissions: [
      {
        id: "sub3",
        accuracy: "87.50%",
        notes: "CNN загвар, 15 epoch, batch_size=32.",
        submittedAt: "2026-05-17",
        grade: undefined,
        feedback: undefined,
      },
    ],
  },
  {
    id: "s5",
    name: "Gantumur Ochir",
    email: "gantumur@lms.com",
    caseLabel: "Case 2",
    progress: 10,
    accuracy: "-",
    status: "not_started",
    submissions: [],
  },
];

function getInstructorId(): string {
  try { return JSON.parse(localStorage.getItem("lms_user") || "{}").id || ""; }
  catch { return ""; }
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Student["status"] }) {
  if (status === "submitted")
    return <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-300">✅ Илгээсэн</span>;
  if (status === "in_progress")
    return <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-medium text-amber-300">⏳ Явцтай</span>;
  return <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs font-medium text-slate-500">— Эхлээгүй</span>;
}

// ─── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "from-emerald-400 to-cyan-400" : pct >= 40 ? "from-sky-400 to-blue-400" : "from-amber-400 to-orange-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400">{pct}%</span>
    </div>
  );
}

// ─── Feedback modal ────────────────────────────────────────────────────────────

function FeedbackModal({
  student, submissionId, onClose, onSent,
}: {
  student: Student; submissionId: string;
  onClose: () => void; onSent: (grade: number, text: string) => void;
}) {
  const [grade, setGrade] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [gradeError, setGradeError] = useState("");

  const send = async () => {
    const g = Number(grade);
    if (!grade || isNaN(g) || g < 0 || g > 100) { setGradeError("0–100 оноо оруулна уу"); return; }
    if (!text.trim()) return;
    setSending(true);
    try {
      await fetch(`${API_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructor_id: getInstructorId(),
          student_id: student.id,
          submission_id: submissionId,
          grade: g,
          comment: text.trim(),
        }),
      });
    } catch { /* server offline */ }
    setSending(false);
    onSent(g, text.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-[28px] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-100">{student.name}</p>
            <p className="text-xs text-slate-500">Санал хүргэх</p>
          </div>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5 text-slate-500 hover:text-slate-300" />
          </button>
        </div>

        <div>
          <p className="mb-1.5 text-xs text-slate-500">Оноо өгөх (0–100)</p>
          <input
            type="number" min={0} max={100}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
            placeholder="95"
            value={grade}
            onChange={(e) => { setGrade(e.target.value); setGradeError(""); }}
          />
          {gradeError && <p className="mt-1 text-xs text-rose-400">{gradeError}</p>}
        </div>

        <div>
          <p className="mb-1.5 text-xs text-slate-500">Санал</p>
          <textarea
            className="h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
            placeholder="Санал бичнэ үү..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-400/15 px-4 py-3 text-sm font-medium text-sky-200 ring-1 ring-sky-400/30 transition hover:bg-sky-400/25 disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Илгээх
        </button>
      </div>
    </div>
  );
}

// ─── Expanded row ──────────────────────────────────────────────────────────────

function ExpandedRow({
  student, onApprove, onFeedback,
}: {
  student: Student;
  onApprove: (subId: string) => void;
  onFeedback: (subId: string) => void;
}) {
  if (student.submissions.length === 0) {
    return (
      <tr>
        <td colSpan={6} className="pb-4 pt-1">
          <div className="mx-4 rounded-2xl border border-white/8 bg-white/3 px-5 py-6 text-center text-sm text-slate-500">
            Илгээсэн ажил байхгүй байна
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      {student.submissions.map((sub) => (
        <tr key={sub.id}>
          <td colSpan={6} className="pb-4 pt-1">
            <div className="mx-4 rounded-2xl border border-sky-400/15 bg-sky-400/5 p-5 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Accuracy</p>
                  <p className="font-mono text-emerald-300 font-semibold">{sub.accuracy}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Илгээсэн</p>
                  <p className="text-slate-200">{sub.submittedAt}</p>
                </div>
                {sub.grade !== undefined && (
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Оноо</p>
                    <p className="font-semibold text-amber-300">{sub.grade}/100</p>
                  </div>
                )}
              </div>

              {sub.notes && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Тайлбар</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{sub.notes}</p>
                </div>
              )}

              {sub.feedback && (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-500 mb-1">Багшийн санал</p>
                  <p className="text-sm text-slate-300">{sub.feedback}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                {sub.grade === undefined && (
                  <button
                    type="button"
                    onClick={() => onApprove(sub.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-400/20"
                  >
                    <Check className="h-3.5 w-3.5" /> Батлах
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onFeedback(sub.id)}
                  className="flex items-center gap-1.5 rounded-xl border border-sky-400/20 bg-sky-400/8 px-4 py-2 text-xs font-medium text-sky-300 transition hover:bg-sky-400/15"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Санал өгөх
                </button>
              </div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<{ student: Student; subId: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/instructor/students`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error();
        const json = await res.json();
        const rows: Student[] = (json.students ?? []).map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          caseLabel: s.case_label ?? "Case 1",
          progress: s.progress ?? 0,
          accuracy: s.accuracy ?? "-",
          status: s.status ?? "not_started",
          submissions: s.submissions ?? [],
        }));
        setStudents(rows);
      } catch {
        setStudents(MOCK_STUDENTS);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const toggleRow = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const handleApprove = (studentId: string, subId: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id !== studentId ? s :
        {
          ...s,
          submissions: s.submissions.map((sub) =>
            sub.id !== subId ? sub : { ...sub, grade: 100 }
          ),
        }
      )
    );
    fetch(`${API_URL}/api/instructor/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submission_id: subId, instructor_id: getInstructorId() }),
    }).catch(() => {});
  };

  const handleFeedbackSent = (studentId: string, subId: string, grade: number, text: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id !== studentId ? s :
        {
          ...s,
          submissions: s.submissions.map((sub) =>
            sub.id !== subId ? sub : { ...sub, grade, feedback: text }
          ),
        }
      )
    );
  };

  const submittedCount = students.filter((s) => s.status === "submitted").length;
  const inProgressCount = students.filter((s) => s.status === "in_progress").length;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">Багш</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-50">Сурагчид</h1>
        <p className="mt-1 text-sm text-slate-400">Оюутны явц болон ажлын илгээлтийг хянана уу</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Нийт оюутан", value: students.length, color: "text-slate-50" },
          { label: "Илгээсэн", value: submittedCount, color: "text-emerald-300" },
          { label: "Явцтай", value: inProgressCount, color: "text-amber-300" },
        ].map((c) => (
          <div key={c.label} className="glass-panel rounded-[28px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{c.label}</p>
            <p className={`mt-2 text-3xl font-semibold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden rounded-[28px]">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Ачааллаж байна…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {["#", "Нэр", "Case", "Явц", "Accuracy", "Статус", ""].map((h) => (
                    <th key={h} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => {
                  const expanded = expandedId === s.id;
                  return (
                    <>
                      <tr
                        key={s.id}
                        className={`cursor-pointer border-b border-white/5 transition hover:bg-white/3 ${expanded ? "bg-sky-400/5" : ""}`}
                        onClick={() => toggleRow(s.id)}
                      >
                        <td className="px-5 py-4 text-slate-500">{i + 1}</td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium text-slate-100">{s.name}</p>
                            <p className="text-xs text-slate-500">{s.email}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-300">{s.caseLabel}</td>
                        <td className="px-5 py-4"><ProgressBar pct={s.progress} /></td>
                        <td className="px-5 py-4 font-mono text-sm text-slate-200">{s.accuracy}</td>
                        <td className="px-5 py-4"><StatusBadge status={s.status} /></td>
                        <td className="px-5 py-4 text-slate-500">
                          {expanded
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />}
                        </td>
                      </tr>

                      {expanded && (
                        <ExpandedRow
                          student={s}
                          onApprove={(subId) => handleApprove(s.id, subId)}
                          onFeedback={(subId) => setFeedbackTarget({ student: s, subId })}
                        />
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Feedback modal */}
      {feedbackTarget && (
        <FeedbackModal
          student={feedbackTarget.student}
          submissionId={feedbackTarget.subId}
          onClose={() => setFeedbackTarget(null)}
          onSent={(grade, text) =>
            handleFeedbackSent(feedbackTarget.student.id, feedbackTarget.subId, grade, text)
          }
        />
      )}
    </section>
  );
}
