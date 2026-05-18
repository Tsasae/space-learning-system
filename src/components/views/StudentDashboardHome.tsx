import { API_URL } from '../../config';
import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Database,
  ExternalLink,
  FlaskConical,
  Loader2,
  Rocket,
  Satellite,
  Trophy,
  Zap,
} from "lucide-react";
import { useUIStore } from "../../store/uiStore";
import { ViewKey } from "../../types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface APODItem {
  title: string;
  url: string;
  date: string;
  explanation: string;
  media_type: "image" | "video";
  hdurl?: string;
}

interface SubmissionRecord {
  id: string;
  exercise_type: string;
  accuracy?: number;
  submitted_at: string;
  grade?: number;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const STUDY_PARTS = [
  { number: 1, title: "Introduction to AI in Planetary Science", short: "AI in Planetary Science" },
  { number: 2, title: "AI-Based Crater Chronology", short: "Crater Chronology" },
  { number: 3, title: "Volcanic Structure Detection", short: "Volcanic Structures" },
  { number: 4, title: "AI Surrogate Models", short: "Surrogate Models" },
  { number: 5, title: "Isotope & Terrain Classification", short: "Isotope Classification" },
  { number: 6, title: "Challenges & Conclusion", short: "Challenges & Future" },
];

const EXERCISES = [
  { title: "CNN Crater Classification", sub: "NASA NEO өгөгдөл" },
  { title: "RF vs Neural Network", sub: "Crater features" },
  { title: "Surrogate Physics Model", sub: "Physics equation" },
];

const TECH_BADGES = [
  { label: "Python", color: "bg-blue-400/10 text-blue-300 border-blue-400/20" },
  { label: "TensorFlow", color: "bg-orange-400/10 text-orange-300 border-orange-400/20" },
  { label: "scikit-learn", color: "bg-amber-400/10 text-amber-300 border-amber-400/20" },
  { label: "NASA API", color: "bg-sky-400/10 text-sky-300 border-sky-400/20" },
  { label: "Jupyter", color: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20" },
  { label: "Random Forest", color: "bg-violet-400/10 text-violet-300 border-violet-400/20" },
];

const ASSIGNMENTS = [
  { id: "rf-vs-nn", title: "RF vs Neural Network", due: "Өнөөдөр", urgent: true },
  { id: "surrogate", title: "Surrogate Physics Model", due: "3 хоногт", urgent: false },
];



const MOCK_ACTIVITY = [
  { icon: "", text: "Part 2 дууссан", time: "2 цагийн өмнө" },
  { icon: "", text: "Exercise 1 илгээсэн — 95% accuracy", time: "Өчигдөр" },
  { icon: "", text: "NASA NEO өгөгдөл судалсан", time: "2 өдрийн өмнө" },
  { icon: "", text: "Part 1 дууссан", time: "3 өдрийн өмнө" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUser(): { name: string; id: string } {
  try {
    const u = JSON.parse(localStorage.getItem("lms_user") || "{}");
    return { name: u.name || "Student", id: String(u.id || "") };
  } catch {
    return { name: "Student", id: "" };
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  iconColor,
  bg,
  value,
  label,
  sub,
  progress,
}: {
  icon: React.ElementType;
  iconColor: string;
  bg: string;
  value: string | number;
  label: string;
  sub?: string;
  progress?: number;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/8">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <p className="text-2xl font-bold text-slate-50">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-400">{label}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
      {progress != null && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function PartRow({
  part,
  done,
  current,
}: {
  part: { number: number; title: string };
  done: boolean;
  current: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2 ${current ? "bg-sky-400/10 ring-1 ring-sky-400/20" : ""}`}>
      {done ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
      ) : current ? (
        <Clock className="h-4 w-4 shrink-0 text-amber-400" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-slate-700" />
      )}
      <span className={`flex-1 text-xs ${done ? "text-emerald-300" : current ? "text-sky-200 font-medium" : "text-slate-500"}`}>
        Part {part.number}: {part.title}
      </span>
      {done && (
        <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">100%</span>
      )}
    </div>
  );
}

// Small gallery card (used in left column)
function APODSmallCard({ item }: { item: APODItem }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 transition-all duration-300 hover:border-sky-400/30 hover:shadow-lg hover:shadow-sky-400/10">
      <div className="aspect-video overflow-hidden bg-slate-900">
        <img
          src={item.url}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-3">
        <p className="truncate text-xs font-medium text-slate-200">{item.title}</p>
        <p className="mt-0.5 text-[10px] text-slate-500">{item.date}</p>
      </div>
    </div>
  );
}

// Large gallery card (NASA section)
function APODGalleryCard({ item }: { item: APODItem }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={item.hdurl ?? item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-2xl border border-white/10 transition-all duration-300 hover:border-sky-400/40 hover:shadow-xl hover:shadow-sky-400/10"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative h-48 overflow-hidden bg-slate-900">
        <img
          src={item.url}
          alt={item.title}
          className={`h-full w-full object-cover transition-transform duration-500 ${hovered ? "scale-110" : "scale-100"}`}
          loading="lazy"
        />
        {/* Always-on gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Date badge top-right */}
        <span className="absolute right-2 top-2 rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] text-slate-300 backdrop-blur-sm">
          {item.date}
        </span>

        {/* Title + explanation overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="line-clamp-1 text-xs font-semibold text-white">{item.title}</p>
          <p
            className={`mt-1 text-[10px] leading-relaxed text-slate-300 transition-all duration-300 ${
              hovered ? "line-clamp-3 opacity-100" : "line-clamp-0 opacity-0 max-h-0"
            }`}
          >
            {item.explanation.slice(0, 120)}…
          </p>
        </div>
      </div>
    </a>
  );
}

// Skeleton placeholder for loading
function APODSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/5">
      <div className="h-48 animate-pulse bg-white/8" />
      <div className="p-3 space-y-1.5">
        <div className="h-2.5 w-3/4 animate-pulse rounded-full bg-white/10" />
        <div className="h-2 w-1/2 animate-pulse rounded-full bg-white/8" />
      </div>
    </div>
  );
}

// Live dot badge
function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
      LIVE
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StudentDashboardHome() {
  const user = getUser();
  const { setActiveView } = useUIStore();

  const [apodItems, setApodItems] = useState<APODItem[]>([]);
  const [apodLoading, setApodLoading] = useState(true);
  const [completedParts, setCompletedParts] = useState<Set<number>>(new Set());
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [neoCount, setNeoCount] = useState<number | null>(null);

  useEffect(() => {
    // APOD — fetch 6 images for both the small gallery and the big NASA section
    fetch(`${API_URL}/api/nasa/apod?count=6`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) setApodItems(json.data);
      })
      .catch(() => {})
      .finally(() => setApodLoading(false));

    // NEO asteroid count for dataset card
    fetch(`${API_URL}/api/nasa/neo`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.near_earth_objects) {
          let total = 0;
          Object.values(json.data.near_earth_objects).forEach((day: any) => { total += day.length; });
          setNeoCount(total);
        }
      })
      .catch(() => {});

    if (!user.id) return;

    fetch(`${API_URL}/api/submissions/progress/${user.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setCompletedParts(
            new Set<number>(
              (json.progress as { part_number: number; completed: boolean }[])
                .filter((p) => p.completed)
                .map((p) => p.part_number)
            )
          );
        }
      })
      .catch(() => {});

    fetch(`${API_URL}/api/submissions/student/${user.id}`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setSubmissions(json.submissions ?? []); })
      .catch(() => {});
  }, [user.id]);

  // Derived
  const progressPct = Math.round((completedParts.size / STUDY_PARTS.length) * 100);
  const currentPart = STUDY_PARTS.find((p) => !completedParts.has(p.number)) ?? STUDY_PARTS[STUDY_PARTS.length - 1];
  const latestSub = submissions.find((s) => s.grade != null);
  const imageItems = apodItems.filter((i) => i.media_type === "image");
  const heroPic = imageItems[0] ?? null;
  const smallGalleryPics = imageItems.slice(0, 3);
  const bigGalleryPics = imageItems.slice(0, 6);

  const activityItems =
    submissions.length > 0
      ? submissions.slice(0, 4).map((s) => ({
          icon: "📝",
          text: `${s.exercise_type} илгээсэн${s.accuracy != null ? ` — ${s.accuracy}% accuracy` : ""}`,
          time: new Date(s.submitted_at).toLocaleDateString("mn-MN"),
        }))
      : MOCK_ACTIVITY;

  return (
    <div className="space-y-8">
      {/* ── SECTION 1: HERO BANNER ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-[32px] border border-white/10"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #082f49 60%, #0c4a6e 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-32 h-48 w-48 rounded-full bg-cyan-400/8 blur-3xl" />

        <div className="relative grid gap-8 p-8 xl:grid-cols-[1fr_380px]">
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-400">STUDENT VIEW</p>
              <h1 className="mt-2 text-3xl font-bold text-white">
                Сайн уу, {user.name}! <span className="not-italic"></span>
              </h1>
              <p className="mt-2 text-base text-sky-200/80">Study Case 1 AI for Lunar Formation &amp; Structure</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Ерөнхий явц</span>
                <span className="font-bold text-sky-300">{progressPct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                {completedParts.size} / {STUDY_PARTS.length} хэсэг дууссан
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActiveView("courses" as ViewKey)}
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 active:scale-95"
              >
                Үргэлжлүүлэх →
              </button>
              <button
                type="button"
                onClick={() => setActiveView("courses" as ViewKey)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                Хичээл үзэх
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            {apodLoading ? (
              <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
              </div>
            ) : heroPic ? (
              <div className="group relative w-full overflow-hidden rounded-2xl border border-white/20 shadow-2xl shadow-black/50">
                <img
                  src={heroPic.url}
                  alt={heroPic.title}
                  className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-amber-300 backdrop-blur-sm">
                    <Satellite className="h-3 w-3" /> NASA Astronomy Picture of the Day
                  </span>
                  <p className="line-clamp-2 text-sm font-medium text-white drop-shadow">{heroPic.title}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{heroPic.date}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Satellite className="h-12 w-12 text-slate-600" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: STATS ROW ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          iconColor="text-sky-300"
          bg="bg-sky-400/10"
          value={`${progressPct}%`}
          label="Хичээлийн явц"
          progress={progressPct}
        />
        <StatCard
          icon={FlaskConical}
          iconColor="text-violet-300"
          bg="bg-violet-400/10"
          value={`${submissions.length}/3`}
          label="Дасгал дууссан"
          sub={`${Math.max(0, 3 - submissions.length)} дасгал үлдсэн`}
        />
        <StatCard
          icon={Trophy}
          iconColor="text-amber-300"
          bg="bg-amber-400/10"
          value={latestSub?.grade ?? "—"}
          label="Сүүлийн оноо"
          sub={latestSub ? latestSub.exercise_type : "Exercise 1"}
        />
        <StatCard
          icon={Zap}
          iconColor="text-orange-300"
          bg="bg-orange-400/10"
          value="3"
          label="Өдөр дараалан"
          sub=" Keep going!"
        />
      </div>

      {/* ── SECTION 2B: COURSE OVERVIEW ────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-6 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-sky-400" />
          <p className="text-sm font-semibold text-slate-100">Study Case 1 Тойм</p>
          <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[10px] font-medium text-sky-300">
            Course Overview
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Column 1: Course content */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Хичээлийн агуулга</p>
            <p className="mt-1 text-xs text-slate-500">6 хэсэгт хуваагдсан</p>
            <div className="mt-4 space-y-2">
              {STUDY_PARTS.map((part) => {
                const done = completedParts.has(part.number);
                return (
                  <div key={part.number} className="flex items-center gap-2.5">
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      done ? "bg-emerald-400/15 text-emerald-400" : "bg-white/10 text-slate-400"
                    }`}>
                      {done ? "✓" : part.number}
                    </div>
                    <span className={`text-xs ${done ? "text-emerald-300 line-through decoration-emerald-400/40" : "text-slate-300"}`}>
                      {part.short}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Exercises */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Дасгалууд</p>
            <p className="mt-1 text-xs text-slate-500">3 практик дасгал</p>
            <div className="mt-4 space-y-3">
              {EXERCISES.map((ex, i) => (
                <div
                  key={ex.title}
                  className="rounded-xl border border-violet-400/15 bg-violet-400/5 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                    <p className="text-xs font-medium text-slate-200">{ex.title}</p>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 pl-5">{ex.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Technologies */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Ашиглах технологи</p>
            <p className="mt-1 text-xs text-slate-500">Гол хэрэгслүүд</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {TECH_BADGES.map((badge) => (
                <span
                  key={badge.label}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${badge.color}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: TWO COLUMNS ─────────────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Current part card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">Үргэлжлүүлэх хичээл</p>
                <h3 className="mt-1 text-base font-semibold text-slate-100">
                  Part {currentPart.number}: {currentPart.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveView("courses" as ViewKey)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-200 transition hover:bg-sky-400/20"
              >
                Нээх →
              </button>
            </div>
            <div className="mt-4 space-y-1">
              {STUDY_PARTS.map((part) => (
                <PartRow
                  key={part.number}
                  part={part}
                  done={completedParts.has(part.number)}
                  current={part.number === currentPart.number}
                />
              ))}
            </div>
          </div>

          {/* Small APOD gallery */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Satellite className="h-4 w-4 text-amber-300" />
                <p className="text-sm font-semibold text-slate-100">NASA Өнөөдрийн зураг</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveView("spatial" as ViewKey)}
                className="text-xs text-sky-400 transition hover:text-sky-300"
              >
                Цааш үзэх →
              </button>
            </div>
            <div className="mt-4">
              {apodLoading ? (
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-white/8">
                      <div className="aspect-video animate-pulse bg-white/8" />
                      <div className="p-3 space-y-1.5">
                        <div className="h-2 w-3/4 animate-pulse rounded-full bg-white/10" />
                        <div className="h-2 w-1/2 animate-pulse rounded-full bg-white/8" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : smallGalleryPics.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">NASA өгөгдөл байхгүй байна</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {smallGalleryPics.map((item) => (
                    <APODSmallCard key={item.date + item.title} item={item} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">
          {/* Assignments */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">Ойртож буй даалгавар</p>
            <div className="mt-4 space-y-3">
              {ASSIGNMENTS.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-3 py-3 transition hover:bg-white/8"
                >
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-white/20" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-200">{a.title}</p>
                    <span
                      className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        a.urgent ? "bg-amber-400/15 text-amber-300" : "bg-white/10 text-slate-400"
                      }`}
                    >
                      {a.due}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveView("courses" as ViewKey)}
                    className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:bg-white/10"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Activity timeline */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">Сүүлийн идэвхжилт</p>
            <div className="relative mt-4">
              {activityItems.map((item, i) => (
                <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < activityItems.length - 1 && (
                    <div className="absolute left-4 top-8 h-full w-px bg-white/10" />
                  )}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-sm">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-xs text-slate-300">{item.text}</p>
                    <p className="mt-0.5 text-[10px] text-slate-600">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">Миний амжилтууд</p>
            <div className="mt-4 space-y-2">
             
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: NASA IMAGES GALLERY ─────────────────────────────────── */}
      <div>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10">
            <Rocket className="h-4 w-4 text-amber-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">NASA Одон орон судлалын зургууд</p>
            <p className="text-xs text-slate-500">Astronomy Picture of the Day · Дарж томруулан үзнэ үү</p>
          </div>
        </div>

        {apodLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <APODSkeleton key={i} />)}
          </div>
        ) : bigGalleryPics.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-16 text-slate-500">
            <p className="text-sm">NASA зураг ачааллах боломжгүй байна</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {bigGalleryPics.map((item) => (
              <APODGalleryCard key={item.date + item.title} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 5: DATASET SECTION ─────────────────────────────────────── */}
      <div>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/10">
            <Database className="h-4 w-4 text-emerald-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">Судалгааны өгөгдлийн сан</p>
            <p className="text-xs text-slate-500">Research Datasets · Судалгаанд ашиглах өгөгдлүүд</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Card 1: NASA NEO */}
          <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-sky-400/30 hover:bg-white/8">
            <div className="mb-3 flex items-start justify-between">
              <span className="text-3xl"></span>
              <LiveBadge />
            </div>
            <p className="text-sm font-semibold text-slate-100">Near Earth Objects</p>
            <p className="mt-1 text-xs text-slate-400">Дэлхийд ойртсон asteroid-уудын мэдээлэл</p>
            {neoCount !== null && (
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-sky-300">{neoCount}</span>
                <span className="text-xs text-slate-500">asteroid (өнөөдөр)</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setActiveView("spatial" as ViewKey)}
              className="mt-auto pt-4 inline-flex items-center gap-1.5 rounded-xl border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-xs font-medium text-sky-200 transition hover:bg-sky-400/20"
            >
              Өгөгдөл харах →
            </button>
          </div>

          {/* Card 2: NASA APOD */}
          <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-amber-400/30 hover:bg-white/8">
            <div className="mb-3 flex items-start justify-between">
              <span className="text-3xl"></span>
              <LiveBadge />
            </div>
            <p className="text-sm font-semibold text-slate-100">Astronomy Picture of Day</p>
            <p className="mt-1 text-xs text-slate-400">NASA-гийн өдөр тутмын одон орны зураг</p>
            {heroPic && (
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                <img src={heroPic.url} alt={heroPic.title} className="h-20 w-full object-cover" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setActiveView("spatial" as ViewKey)}
              className="mt-auto pt-4 inline-flex items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-200 transition hover:bg-amber-400/20"
            >
              Зураг үзэх →
            </button>
          </div>

          {/* Card 3: Lunar Dataset */}
          <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-violet-400/30 hover:bg-white/8">
            <div className="mb-3">
              <span className="text-3xl"></span>
            </div>
            <p className="text-sm font-semibold text-slate-100">Lunar Surface Data</p>
            <p className="mt-1 text-xs text-slate-400">LROC polar mosaic, Moon Mineralogy Mapper</p>
            <div className="mt-3 space-y-1.5">
              {["LROC Polar Mosaic", "Moon Mineralogy Mapper", "Crater Age Dataset"].map((d) => (
                <div key={d} className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="h-1 w-1 rounded-full bg-violet-400/60" />
                  {d}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActiveView("lab" as ViewKey)}
              className="mt-auto pt-4 inline-flex items-center gap-1.5 rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-xs font-medium text-violet-200 transition hover:bg-violet-400/20"
            >
              Судлах →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
