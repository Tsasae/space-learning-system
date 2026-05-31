import { useCallback, useEffect, useState } from 'react';
import { Users, FileCheck, Activity, RefreshCw } from 'lucide-react';
import { API_URL } from '../../config';
import { useUIStore } from '../../store/uiStore';
import { useTranslation } from '../../i18n/useTranslation';

function timeAgo(iso: string | null): string {
  if (!iso) return 'Идэвхгүй';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Дөнгөж сая';
  if (min < 60) return `${min} мин өмнө`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} цаг өмнө`;
  return `${Math.floor(hr / 24)} өдрийн өмнө`;
}

function isLive(iso: string | null): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 5 * 60 * 1000;
}

interface CourseOpt {
  id: number;
  title: string;
}
interface StudentProgress {
  student_id: string;
  student_name: string | null;
  progress_percent: number | null;
  exercise_submitted: boolean;
  quiz_score: number | null;
  last_activity_at: string | null;
  seen_count: number;
}
interface Submission {
  id: number;
  student_name: string | null;
  exercise_type: string | null;
  accuracy: number | null;
  submitted_at: string | null;
  grade: number | null;
}

export default function InstructorHome() {
  const { language } = useUIStore();
  const { t } = useTranslation(language);

  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/instructor/courses`)
      .then((r) => r.json())
      .then((d) => {
        const list: CourseOpt[] = (d.courses ?? []).map((c: any) => ({
          id: c.id,
          title: c.title,
        }));
        setCourses(list);
        if (list.length > 0) setCourseId(list[0].id);
      })
      .catch(() => setCourses([]));
  }, []);

  const loadData = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [progRes, subRes] = await Promise.all([
        fetch(`${API_URL}/api/progress/course/${courseId}`).then((r) => r.json()),
        fetch(`${API_URL}/api/instructor/submissions`).then((r) => r.json()),
      ]);
      setStudents(progRes.success ? progRes.students ?? [] : []);
      setSubmissions(subRes.success ? subRes.submissions ?? [] : []);
    } catch {
      setStudents([]);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const id = setInterval(loadData, 30000);
    return () => clearInterval(id);
  }, [loadData]);

  const activeCount = students.filter((s) => isLive(s.last_activity_at)).length;
  const avgProgress =
    students.length > 0
      ? Math.round(
          students.reduce((sum, s) => sum + (Number(s.progress_percent) || 0), 0) /
            students.length
        )
      : 0;
  const pendingSubs = submissions.filter((s) => s.grade == null).length;

  // suppress unused warning — t() available for future keys
  void t;

  return (
    <section className="space-y-6">
      {/* ── Толгой ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">
            Багшийн хяналт
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-100">
            Оюутны явц ба даалгаврын илгээлт
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Оюутнуудын хичээлийн явц болон даалгаврын илгээлтийг бодит хугацаанд хянах
          </p>
        </div>

        <div className="flex items-center gap-2">
          {courses.length > 0 && (
            <select
              value={courseId ?? ''}
              onChange={(e) => setCourseId(Number(e.target.value))}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 outline-none"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Шинэчлэх
          </button>
        </div>
      </div>

      {/* ── Хураангуй картууд ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Бүртгэлтэй оюутан"
          value={`${students.length}`}
          sub={`${activeCount} идэвхтэй (сүүлийн 5 мин)`}
          accent="sky"
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Дундаж явц"
          value={`${avgProgress}%`}
          sub="бүх оюутны дундаж"
          accent="emerald"
        />
        <StatCard
          icon={<FileCheck className="h-5 w-5" />}
          label="Хүлээгдэж буй илгээлт"
          value={`${pendingSubs}`}
          sub="үнэлгээ хүлээж буй"
          accent="violet"
        />
      </div>

      {/* ── Оюутны явцын хүснэгт ──────────────────────────────────────────── */}
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Оюутны хичээлийн явц</h2>
        {students.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            {loading ? 'Ачаалж байна…' : 'Энэ курст одоогоор оюутны идэвхжил алга байна.'}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-slate-500">
                  <th className="pb-3">Оюутан</th>
                  <th className="pb-3">Явц</th>
                  <th className="pb-3">Даалгавар</th>
                  <th className="pb-3">Шалгалт</th>
                  <th className="pb-3">Сүүлд идэвхжсэн</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.student_id} className="border-t border-white/5">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isLive(s.last_activity_at) ? 'bg-emerald-400' : 'bg-slate-600'
                          }`}
                        />
                        <span className="text-slate-200">
                          {s.student_name ?? s.student_id}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
                            style={{ width: `${Number(s.progress_percent) || 0}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-slate-300">
                          {Math.round(Number(s.progress_percent) || 0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      {s.exercise_submitted ? (
                        <span className="text-emerald-300">Илгээсэн</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 tabular-nums text-slate-300">
                      {s.quiz_score != null ? `${s.quiz_score}` : '—'}
                    </td>
                    <td className="py-3 text-slate-400">{timeAgo(s.last_activity_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Сүүлийн илгээлтүүд ────────────────────────────────────────────── */}
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Сүүлийн даалгаврын илгээлт</h2>
        {submissions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            {loading ? 'Ачаалж байна…' : 'Илгээлт алга байна.'}
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {submissions.slice(0, 8).map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3"
              >
                <div>
                  <p className="text-sm text-slate-200">{sub.student_name ?? '—'}</p>
                  <p className="text-xs text-slate-500">
                    {sub.exercise_type ?? 'Даалгавар'} · {timeAgo(sub.submitted_at)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {sub.accuracy != null && (
                    <span className="text-xs text-slate-400">
                      Нарийвчлал {Math.round(Number(sub.accuracy))}%
                    </span>
                  )}
                  {sub.grade != null ? (
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                      Үнэлсэн: {sub.grade}
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-300">
                      Хүлээгдэж буй
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const ACCENTS: Record<string, string> = {
  sky: 'text-sky-300 bg-sky-400/10',
  emerald: 'text-emerald-300 bg-emerald-400/10',
  violet: 'text-violet-300 bg-violet-400/10',
};

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${ACCENTS[accent]}`}>
          {icon}
        </span>
        <span className="text-xs uppercase tracking-widest text-slate-500">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  );
}
