import { API_URL } from '../../config';
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  BookPlus,
  CheckCircle,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  FlaskConical,
  Globe,
  Link2,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Star,
  Trash2,
  Upload,
  User,
  X,
  Zap,
} from "lucide-react";
import { SectionHeader } from "../common/SectionHeader";
import { useUIStore } from "../../store/uiStore";
import { useTranslation } from "../../i18n/useTranslation";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentType = string;

interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  date: string;
  url?: string;
  size?: string;
  content_type?: string;
  link_type?: string;
}

interface ApiContentItem {
  id: string;
  title: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  link_url?: string;
  link_type?: string;
  content_type: string;
  instructor_name?: string;
  created_at: string;
}

interface FeedbackEntry {
  id: string;
  grade: number;
  text: string;
  date: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  progress: number;
  avatar: string;
  feedback: FeedbackEntry[];
}

// ─── Mock students ─────────────────────────────────────────────────────────────

const MOCK_STUDENTS: Student[] = [
  {
    id: "s1",
    name: "Bat-Erdene Gantulga",
    email: "student@lms.com",
    progress: 75,
    avatar: "BG",
    feedback: [
      { id: "f1", grade: 88, text: "Great work on the satellite imagery analysis. Keep pushing on the neural net tuning.", date: "2026-04-20" },
    ],
  },
  {
    id: "s2",
    name: "Nominchimeg Dash",
    email: "nomin@lms.com",
    progress: 45,
    avatar: "ND",
    feedback: [
      { id: "f2", grade: 62, text: "Needs more focus on the HPC pipeline section. Review the SLURM job script examples.", date: "2026-04-18" },
    ],
  },
  {
    id: "s3",
    name: "Tserenpuntsag Bold",
    email: "tserenpu@lms.com",
    progress: 90,
    avatar: "TB",
    feedback: [
      { id: "f3", grade: 96, text: "Excellent performance across all modules. Ready for capstone project.", date: "2026-04-22" },
    ],
  },
];

// Link type values chosen so server pattern-matches correctly:
//   type.includes('Notebook') → content_type 'notebook'
//   type.includes('NASA')     → content_type 'nasa'
//   otherwise                 → content_type 'slide'
const LINK_TYPES = [
  { value: "drive", label: "Google Drive (PPT/PDF)" },
  { value: "GitHub Notebook", label: "GitHub Notebook (.ipynb)" },
  { value: "NASA Earthdata", label: "NASA Earthdata" },
  { value: "NASA API", label: "NASA API (NEO/APOD)" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInstructorId(): string {
  try {
    return JSON.parse(localStorage.getItem("lms_user") || "{}").id || "";
  } catch {
    return "";
  }
}

function mapApiType(item: ApiContentItem): ContentType {
  if (item.link_type) return item.link_type;
  const ext = (item.file_type ?? "").toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "ipynb") return "notebook";
  return "ppt";
}

function apiToContentItem(item: ApiContentItem): ContentItem {
  return {
    id: item.id,
    title: item.title,
    type: mapApiType(item),
    date: (item.created_at || "").slice(0, 10),
    url: item.file_url || item.link_url,
    content_type: item.content_type,
    link_type: item.link_type,
  };
}

function contentIcon(type: ContentType) {
  switch (type) {
    case "pdf":             return <FileText className="size-4 text-rose-300" />;
    case "ppt": case "pptx": return <BookOpen className="size-4 text-orange-300" />;
    case "notebook": case "ipynb": return <FlaskConical className="size-4 text-violet-300" />;
    case "nasa-earthdata": case "NASA Earthdata": return <Globe className="size-4 text-emerald-300" />;
    case "nasa-api": case "NASA API": return <Zap className="size-4 text-amber-300" />;
    case "drive":           return <FileText className="size-4 text-blue-300" />;
    case "github": case "GitHub Notebook": return <FlaskConical className="size-4 text-purple-300" />;
    default:                return <FileText className="size-4 text-slate-400" />;
  }
}

function typeLabel(type: ContentType) {
  switch (type) {
    case "pdf":             return "PDF";
    case "ppt": case "pptx": return "PPT/PPTX";
    case "notebook": case "ipynb": return "Notebook";
    case "nasa-earthdata": case "NASA Earthdata": return "NASA Earthdata";
    case "nasa-api": case "NASA API":  return "NASA API";
    case "drive":           return "Google Drive";
    case "github": case "GitHub Notebook": return "GitHub Notebook";
    default:                return type;
  }
}

function progressColor(pct: number) {
  if (pct >= 80) return "from-emerald-400 to-cyan-400";
  if (pct >= 50) return "from-sky-400 to-blue-400";
  return "from-amber-400 to-orange-400";
}

// ─── UploadFileTab ─────────────────────────────────────────────────────────────

function UploadFileTab({ onRefresh }: { onRefresh: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState("");

  const handleFile = (f: File) => {
    setFile(f);
    setStatus("idle");
    setProgress(0);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const upload = async () => {
    if (!title.trim()) {
      setTitleError("Гарчиг оруулна уу");
      return;
    }
    if (!file) return;
    setTitleError("");
    setStatus("uploading");
    setProgress(0);

    const ticker = setInterval(() => {
      setProgress((p) => Math.min(p + 12, 90));
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      formData.append("instructor_id", getInstructorId());

      const res = await fetch(`${API_URL}/api/upload/file`, {
        method: "POST",
        body: formData,
      });
      clearInterval(ticker);
      setProgress(100);
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      setResultUrl(json.material?.file_url ?? "");
      setStatus("done");
      setTitle("");
      setFile(null);
      onRefresh();
    } catch {
      clearInterval(ticker);
      setStatus("error");
    }
  };

  return (
    <div className="space-y-4">
      {/* Title input */}
      <div>
        <input
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400/40"
          placeholder="Лекцийн гарчиг оруулна уу..."
          value={title}
          onChange={(e) => { setTitle(e.target.value); setTitleError(""); }}
        />
        {titleError && <p className="mt-1 text-xs text-rose-400">{titleError}</p>}
      </div>

      {/* Drop zone */}
      <div
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition-colors ${
          dragging ? "border-sky-400 bg-sky-400/10" : "border-white/20 bg-white/5 hover:border-white/30"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          accept=".pdf,.ppt,.pptx,.ipynb"
          className="sr-only"
          type="file"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <Upload className="size-8 text-sky-300/70" />
        <p className="text-sm text-slate-400">
          Drag & drop or <span className="text-sky-300">browse</span>
        </p>
        <p className="text-xs text-slate-600">.pdf · .ppt · .pptx · .ipynb</p>
      </div>

      {file && (
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Paperclip className="size-4 shrink-0 text-sky-300" />
            <span className="truncate text-sm text-slate-200">{file.name}</span>
            <span className="shrink-0 text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
          </div>
          <button type="button" onClick={() => { setFile(null); setStatus("idle"); }}>
            <X className="size-4 text-slate-500 hover:text-slate-300" />
          </button>
        </div>
      )}

      {status === "uploading" && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle className="size-4" />
          <span>Амжилттай байршуулагдлаа</span>
          {resultUrl && (
            <a className="ml-auto flex items-center gap-1 text-xs text-sky-300 underline" href={resultUrl} rel="noreferrer" target="_blank">
              View <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
          Upload failed. Check that the server is running on port 8000.
        </div>
      )}

      <button
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-400/15 px-4 py-3 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-400/25 disabled:opacity-40"
        disabled={!file || status === "uploading"}
        type="button"
        onClick={upload}
      >
        {status === "uploading" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        Upload File
      </button>
    </div>
  );
}

// ─── AddLinkTab ───────────────────────────────────────────────────────────────

const NASA_API_PRESETS = {
  NEO: {
    url: `${API_URL}/api/nasa/neo`,
    description: "Real-time asteroid tracking data from NASA NeoWs API",
  },
  APOD: {
    url: `${API_URL}/api/nasa/apod`,
    description: "NASA Astronomy Picture of the Day collection",
  },
} as const;

function AddLinkTab({ onRefresh }: { onRefresh: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState(LINK_TYPES[0].value);
  const [nasaSubtype, setNasaSubtype] = useState<"NEO" | "APOD">("NEO");
  const [manualUrl, setManualUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isNasaApi = type === "NASA API";
  const isEarthdata = type === "NASA Earthdata";

  const resolvedUrl = isNasaApi
    ? NASA_API_PRESETS[nasaSubtype].url
    : manualUrl;

  const resolvedDescription = isNasaApi
    ? NASA_API_PRESETS[nasaSubtype].description
    : description;

  const resolvedLinkType = isNasaApi
    ? nasaSubtype
    : isEarthdata
    ? "Earthdata"
    : undefined;

  // Auto-fill description when NASA API subtype changes
  const handleNasaSubtype = (sub: "NEO" | "APOD") => {
    setNasaSubtype(sub);
    setDescription(NASA_API_PRESETS[sub].description);
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    setManualUrl("");
    if (newType === "NASA API") {
      setDescription(NASA_API_PRESETS[nasaSubtype].description);
    } else {
      setDescription("");
    }
    setError("");
  };

  const add = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!isNasaApi && !manualUrl.trim()) { setError("URL is required."); return; }
    setError("");
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/upload/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: resolvedUrl,
          type,
          title: title.trim(),
          ...(resolvedLinkType ? { link_type: resolvedLinkType } : {}),
          ...(resolvedDescription ? { description: resolvedDescription } : {}),
          instructor_id: getInstructorId(),
        }),
      });
    } catch {
      // server offline — item won't persist but we still refresh
    } finally {
      setTitle("");
      setManualUrl("");
      setDescription("");
      setLoading(false);
      onRefresh();
    }
  };

  return (
    <div className="space-y-3">
      <input
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400/40"
        placeholder="Content title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Type selector */}
      <div className="relative">
        <select
          className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-slate-200 outline-none focus:border-sky-400/40"
          value={type}
          onChange={(e) => handleTypeChange(e.target.value)}
        >
          {LINK_TYPES.map((lt) => (
            <option key={lt.value} className="bg-[#0f1c2e]" value={lt.value}>{lt.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      </div>

      {/* NASA API: radio subtype selector */}
      {isNasaApi && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Dataset type</p>
          <div className="flex gap-4">
            {(["NEO", "APOD"] as const).map((sub) => (
              <label key={sub} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="nasa-subtype"
                  value={sub}
                  checked={nasaSubtype === sub}
                  onChange={() => handleNasaSubtype(sub)}
                  className="accent-amber-400"
                />
                <span className="text-sm text-slate-200">
                  {sub === "NEO" ? "NEO — Near Earth Objects" : "APOD — Astronomy Picture of the Day"}
                </span>
              </label>
            ))}
          </div>
          <div className="rounded-xl bg-black/20 px-3 py-2 text-xs text-slate-400 font-mono break-all">
            {NASA_API_PRESETS[nasaSubtype].url}
          </div>
          <p className="text-xs text-slate-400 italic">{NASA_API_PRESETS[nasaSubtype].description}</p>
        </div>
      )}

      {/* Earthdata / other: manual URL + description */}
      {!isNasaApi && (
        <>
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400/40"
            placeholder={isEarthdata ? "https://earthdata.nasa.gov/..." : "https://…  *"}
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
          />
          <textarea
            className="h-20 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400/40"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </>
      )}

      {error && <p className="text-xs text-rose-400">{error}</p>}
      <button
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-400/15 px-4 py-3 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-400/25 disabled:opacity-40"
        disabled={loading}
        type="button"
        onClick={add}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Add Link
      </button>
    </div>
  );
}

// ─── Shared action button primitives ─────────────────────────────────────────

function BtnGhost({ href, onClick, children }: { href?: string; onClick?: () => void; children: React.ReactNode }) {
  const cls = "flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-sky-400/30 hover:text-sky-300";
  if (href) return <a className={cls} href={href} rel="noreferrer" target="_blank">{children}</a>;
  return <button className={cls} type="button" onClick={onClick}>{children}</button>;
}

// ─── SlideCard ────────────────────────────────────────────────────────────────

function SlideCard({ item, onDelete }: { item: ContentItem; onDelete: (id: string) => void }) {
  return (
    <div className="glass-panel flex items-start gap-3 rounded-2xl p-4">
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/8">
        {contentIcon(item.type)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-100">{item.title}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
          <span>{typeLabel(item.type)}</span>
          <span>·</span>
          <Clock className="size-3" />
          <span>{item.date}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <BtnGhost href={item.url}>
            <ExternalLink className="size-3" /> Preview
          </BtnGhost>
          <button className="flex items-center gap-1 rounded-xl border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs text-sky-300 transition-colors hover:bg-sky-400/20" type="button">
            <Send className="size-3" /> Send to Students
          </button>
          <button
            className="flex items-center gap-1 rounded-xl border border-rose-400/10 bg-rose-400/8 px-3 py-1 text-xs text-rose-400 transition-colors hover:bg-rose-400/15"
            type="button"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="size-3" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── NotebookCard ─────────────────────────────────────────────────────────────

function NotebookCard({ item, onDelete }: { item: ContentItem; onDelete: (id: string) => void }) {
  const isGitHub = item.link_type === "GitHub Notebook" || item.type === "GitHub Notebook" || item.type === "github";
  return (
    <div className="glass-panel flex items-start gap-3 rounded-2xl p-4">
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/8">
        <FlaskConical className="size-4 text-violet-300" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-100">{item.title}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
          <span>{typeLabel(item.type)}</span>
          <span>·</span>
          <Clock className="size-3" />
          <span>{item.date}</span>
        </div>
        {isGitHub && item.url && (
          <div className="mt-2">
            <a
              className="inline-flex max-w-full items-center gap-1 truncate rounded-lg border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-xs text-purple-300"
              href={item.url}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="size-3 shrink-0" />
              <span className="truncate">{item.url}</span>
            </a>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="flex items-center gap-1 rounded-xl border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs text-violet-300 transition-colors hover:bg-violet-400/20"
            type="button"
            onClick={() => { window.location.href = "/virtual-lab"; }}
          >
            <FlaskConical className="size-3" /> Open in Virtual Lab
          </button>
          <button className="flex items-center gap-1 rounded-xl border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs text-sky-300 transition-colors hover:bg-sky-400/20" type="button">
            <Send className="size-3" /> Send to Students
          </button>
          <button
            className="flex items-center gap-1 rounded-xl border border-rose-400/10 bg-rose-400/8 px-3 py-1 text-xs text-rose-400 transition-colors hover:bg-rose-400/15"
            type="button"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="size-3" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── NasaCard ─────────────────────────────────────────────────────────────────

function NasaCard({ item, onDelete }: { item: ContentItem; onDelete: (id: string) => void }) {
  const isLive = item.link_type === "NASA API" || item.type === "NASA API" || item.type === "nasa-api";
  return (
    <div className="glass-panel flex items-start gap-3 rounded-2xl p-4">
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/8">
        {isLive ? <Zap className="size-4 text-amber-300" /> : <Globe className="size-4 text-emerald-300" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-slate-100">{item.title}</p>
          {isLive && (
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
              <span className="size-1.5 animate-pulse rounded-full bg-amber-400" />
              LIVE
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
          <span>{typeLabel(item.type)}</span>
          <span>·</span>
          <Clock className="size-3" />
          <span>{item.date}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <BtnGhost href={item.url}>
            <ExternalLink className="size-3" /> Preview Data
          </BtnGhost>
          <button className="flex items-center gap-1 rounded-xl border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs text-sky-300 transition-colors hover:bg-sky-400/20" type="button">
            <Send className="size-3" /> Send to Students
          </button>
          <button
            className="flex items-center gap-1 rounded-xl border border-rose-400/10 bg-rose-400/8 px-3 py-1 text-xs text-rose-400 transition-colors hover:bg-rose-400/15"
            type="button"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="size-3" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── StudentCard ──────────────────────────────────────────────────────────────

function StudentCard({ student, selected, onClick }: { student: Student; selected: boolean; onClick: () => void }) {
  return (
    <button
      className={`w-full rounded-2xl border p-4 text-left transition-colors ${
        selected ? "border-sky-400/40 bg-sky-400/10" : "border-white/10 bg-white/5 hover:border-white/20"
      }`}
      type="button"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400/30 to-cyan-400/20 text-sm font-semibold text-sky-200">
          {student.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-100">{student.name}</p>
          <p className="truncate text-xs text-slate-500">{student.email}</p>
        </div>
        <span className={`text-sm font-semibold ${
          student.progress >= 80 ? "text-emerald-300" : student.progress >= 50 ? "text-sky-300" : "text-amber-300"
        }`}>
          {student.progress}%
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all ${progressColor(student.progress)}`}
          style={{ width: `${student.progress}%` }}
        />
      </div>
    </button>
  );
}

// ─── FeedbackPanel ────────────────────────────────────────────────────────────

function FeedbackPanel({ student, onClose }: { student: Student; onClose: () => void }) {
  const [grade, setGrade] = useState("");
  const [text, setText] = useState("");
  const [history, setHistory] = useState<FeedbackEntry[]>(student.feedback);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    const g = Number(grade);
    if (!text.trim() || isNaN(g) || g < 0 || g > 100) return;
    setSending(true);
    try {
      await fetch(`${API_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructor_id: getInstructorId(),
          student_id: student.id,
          grade: g,
          comment: text.trim(),
        }),
      });
    } catch {
      // server offline — still show local confirmation
    }
    const entry: FeedbackEntry = {
      id: `f${Date.now()}`,
      grade: g,
      text: text.trim(),
      date: new Date().toISOString().slice(0, 10),
    };
    setHistory((h) => [entry, ...h]);
    setGrade("");
    setText("");
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  };

  return (
    <div className="glass-panel space-y-5 rounded-[28px] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400/30 to-cyan-400/20 text-sm font-semibold text-sky-200">
            {student.avatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">{student.name}</p>
            <p className="text-xs text-slate-500">Feedback form</p>
          </div>
        </div>
        <button type="button" onClick={onClose}>
          <X className="size-5 text-slate-500 hover:text-slate-300" />
        </button>
      </div>

      <div className="space-y-3">
        <input
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400/40"
          max={100} min={0}
          placeholder="Grade (0 – 100)"
          type="number"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />
        <textarea
          className="h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400/40"
          placeholder="Write your feedback…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {sent && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle className="size-4" /> Feedback sent!
          </div>
        )}
        <button
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-400/15 px-4 py-3 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-400/25 disabled:opacity-40"
          disabled={sending}
          type="button"
          onClick={send}
        >
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Send Feedback
        </button>
      </div>

      {history.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">History</p>
          <div className="relative space-y-4 pl-5">
            <div className="absolute left-0 top-0 h-full w-px bg-white/10" />
            {history.map((entry) => (
              <div key={entry.id} className="relative">
                <div className="absolute -left-[21px] top-1 flex size-3 items-center justify-center rounded-full bg-sky-400/30 ring-2 ring-sky-400/40">
                  <div className="size-1.5 rounded-full bg-sky-400" />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="size-3.5 text-amber-300" />
                      <span className="text-sm font-semibold text-amber-200">{entry.grade}/100</span>
                    </div>
                    <span className="text-xs text-slate-600">{entry.date}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{entry.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Case sidebar items ────────────────────────────────────────────────────────

const STUDY_CASES = [
  { id: 1, label: "Study Case 1", sub: "AI for Lunar Formation" },
  { id: 2, label: "Study Case 2", sub: "Remote Sensing" },
  { id: 3, label: "Study Case 3", sub: "HPC Fundamentals" },
];

// ─── Main component ────────────────────────────────────────────────────────────

export function InstructorDashboard() {
  const { setActiveView, language } = useUIStore();
  const { t } = useTranslation(language);
  const [uploadTab, setUploadTab] = useState<"file" | "link">("file");
  const [content, setContent] = useState<ContentItem[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeCase, setActiveCase] = useState(1);

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/upload/courses`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      const items: ApiContentItem[] = json.courses ?? [];
      setContent(items.map(apiToContentItem));
    } catch {
      // server may be offline; keep current list
    } finally {
      setContentLoading(false);
    }
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/upload/courses/${id}`, { method: "DELETE" });
    } finally {
      fetchContent();
    }
  };

  return (
    <section className="space-y-6">
      <SectionHeader
        description={t("manageCourse")}
        eyebrow={t("courseManagement")}
        title={t("instructorDashboard")}
      />

      <div className="grid gap-6 xl:grid-cols-[200px_3fr_2fr]">
        {/* ── CASE SIDEBAR ── */}
        <div className="glass-panel flex flex-col rounded-[28px] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
            {t("courses")}
          </p>
          <div className="flex flex-col gap-2">
            {STUDY_CASES.map((c) => (
              <button
                key={c.id}
                className={`rounded-2xl px-3 py-3 text-left transition ${
                  activeCase === c.id
                    ? "bg-sky-400/15 ring-1 ring-sky-300/30"
                    : "hover:bg-white/5"
                }`}
                type="button"
                onClick={() => setActiveCase(c.id)}
              >
                <p className={`text-sm font-medium ${activeCase === c.id ? "text-sky-200" : "text-slate-300"}`}>
                  {c.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 leading-snug">{c.sub}</p>
              </button>
            ))}
          </div>
          <div className="mt-auto pt-4">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-3 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20"
              type="button"
              onClick={() => setActiveView("createCourse")}
            >
              <BookPlus className="h-4 w-4" />
              {t("newCourse")}
            </button>
          </div>
        </div>

        {/* ── LEFT: Course Content Manager ── */}
        <div className="space-y-6">
          <div className="glass-panel rounded-[28px] p-6">
            <div className="flex items-center gap-2">
              <Upload className="size-4 text-sky-300" />
              <p className="text-sm font-semibold text-slate-100">{t("courseContentManager")}</p>
            </div>

            <div className="mt-5 flex gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
              {(["file", "link"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-colors ${
                    uploadTab === tab ? "bg-sky-400/20 text-sky-200" : "text-slate-400 hover:text-slate-300"
                  }`}
                  type="button"
                  onClick={() => setUploadTab(tab)}
                >
                  {tab === "file" ? <Paperclip className="size-4" /> : <Link2 className="size-4" />}
                  {tab === "file" ? "Upload File" : "Add Link"}
                </button>
              ))}
            </div>

            <div className="mt-5">
              {uploadTab === "file" ? (
                <UploadFileTab onRefresh={fetchContent} />
              ) : (
                <AddLinkTab onRefresh={fetchContent} />
              )}
            </div>
          </div>

          {/* Content list — grouped by content_type */}
          {contentLoading ? (
            <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" />
              Loading content…
            </div>
          ) : content.length === 0 ? (
            <div className="glass-panel flex flex-col items-center gap-3 rounded-2xl py-12 text-center">
              <FileText className="size-10 text-slate-600" />
              <p className="text-sm text-slate-500">No content yet — upload a file or add a link above.</p>
            </div>
          ) : (() => {
            const slides   = content.filter((i) => i.content_type === "slide");
            const notebooks = content.filter((i) => i.content_type === "notebook");
            const nasa     = content.filter((i) => i.content_type === "nasa");

            return (
              <div className="space-y-6">
                {slides.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                       Slides &amp; Documents ({slides.length})
                    </p>
                    {slides.map((item) => (
                      <SlideCard key={item.id} item={item} onDelete={handleDelete} />
                    ))}
                  </div>
                )}
                {notebooks.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                       Jupyter Notebooks ({notebooks.length})
                    </p>
                    {notebooks.map((item) => (
                      <NotebookCard key={item.id} item={item} onDelete={handleDelete} />
                    ))}
                  </div>
                )}
                {nasa.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                       NASA Datasets ({nasa.length})
                    </p>
                    {nasa.map((item) => (
                      <NasaCard key={item.id} item={item} onDelete={handleDelete} />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── RIGHT: Student Management ── */}
        <div className="space-y-6">
          <div className="glass-panel rounded-[28px] p-6">
            <div className="flex items-center gap-2">
              <User className="size-4 text-sky-300" />
              <p className="text-sm font-semibold text-slate-100">{t("studentManagement")}</p>
            </div>
            <div className="mt-5 space-y-3">
              {MOCK_STUDENTS.map((s) => (
                <StudentCard
                  key={s.id}
                  selected={selectedStudent?.id === s.id}
                  student={s}
                  onClick={() => setSelectedStudent((prev) => (prev?.id === s.id ? null : s))}
                />
              ))}
            </div>
            {!selectedStudent && (
              <p className="mt-4 flex items-center gap-2 text-xs text-slate-600">
                <MessageSquare className="size-3.5" />
                Click a student to open their feedback form
              </p>
            )}
          </div>

          {selectedStudent && (
            <FeedbackPanel
              key={selectedStudent.id}
              student={selectedStudent}
              onClose={() => setSelectedStudent(null)}
            />
          )}
        </div>
      </div>
    </section>
  );
}
