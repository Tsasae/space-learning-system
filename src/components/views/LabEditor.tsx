import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Play, Zap, Upload, Link2, RefreshCw,
  AlertTriangle, CheckCircle2, Brain, TrendingUp,
  Target, Layers, Activity, GitBranch,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ScatterChart, Scatter, LineChart, Line, Legend, ComposedChart, Cell, ZAxis,
} from 'recharts';
import { useTranslation } from '../../i18n/useTranslation';
import { Language } from '../../types';
import { SectionHeader } from '../common/SectionHeader';
import { API_URL } from '../../config';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PALETTE = ['#38bdf8', '#34d399', '#f59e0b', '#f87171', '#a78bfa', '#22d3ee', '#fb923c'];

const DEMO_DATASETS: Record<AlgoId, { url: string; target: string; description: string }> = {
  random_forest: {
    url: 'https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv',
    target: 'Survived',
    description: 'Titanic — 891 зорчигчийн амьд үлдсэн эсэхийг таамаглана',
  },
  linear_regression: {
    url: 'https://raw.githubusercontent.com/selva86/datasets/master/BostonHousing.csv',
    target: 'medv',
    description: 'Boston Housing — орон сууцны үнэ таамаглана',
  },
  kmeans: {
    url: 'https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv',
    target: '',
    description: 'Iris цэцэг — 3 төрлөөр бүлэглэнэ',
  },
  pca: {
    url: 'https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv',
    target: '',
    description: 'Iris цэцэг — 2D болгон харуулна',
  },
  cnn: {
    url: '',
    target: '',
    description: 'Зургийн файл upload хийнэ үү',
  },
};

// ─── Types ─────────────────────────────────────────────────────────────────────

type AlgoId = 'random_forest' | 'linear_regression' | 'kmeans' | 'pca' | 'cnn';

interface RFResult {
  algorithm: 'random_forest'; task_type: 'classification' | 'regression';
  metrics: Record<string, number>;
  feature_importance: { feature: string; importance: number }[];
  confusion_matrix?: number[][];
  sample_predictions: { actual: number; predicted: number }[];
}
interface LRResult {
  algorithm: 'linear_regression'; regularization: string;
  metrics: Record<string, number>;
  coefficients: { feature: string; coefficient: number }[];
  predicted_vs_actual: { actual: number; predicted: number }[];
}
interface KMResult {
  algorithm: 'kmeans'; n_clusters: number;
  metrics: Record<string, number>;
  elbow_data: { k: number; inertia: number }[];
  cluster_plot: { x: number; y: number; cluster: number }[];
  cluster_sizes: { cluster: number; count: number }[];
}
interface PCAResult {
  algorithm: 'pca'; n_components: number;
  explained_variance: number[];
  cumulative_variance: number[];
  components_plot: { pc1: number; pc2: number; label: string }[];
  loadings: { feature: string; pc1: number; pc2?: number }[];
}
interface CNNResult {
  algorithm: 'cnn'; num_classes: number;
  metrics: Record<string, number>;
  training_history: { epoch: number; accuracy: number; val_accuracy: number; loss: number; val_loss: number }[];
  class_names: string[];
  sample_predictions: { image_index: number; actual: string; predicted: string; confidence: number }[];
}

type MLResult = RFResult | LRResult | KMResult | PCAResult | CNNResult;
interface LogEntry { text: string; level: 'info' | 'success' | 'error' | 'warn' | 'default' }

// ─── Algorithm metadata ─────────────────────────────────────────────────────────

interface AlgoMeta {
  label: string;
  icon: React.ReactNode;
  description: string;
  defaultParams: Record<string, number | string>;
  showTargetColumn: boolean;
}

const ALGO_META: Record<AlgoId, AlgoMeta> = {
  random_forest: {
    label: 'Random Forest',
    icon: <GitBranch className="h-4 w-4" />,
    description: 'Auto-detects classification or regression. Computes feature importance on any tabular CSV/Excel/JSON.',
    defaultParams: { n_estimators: 100, test_size: 0.2 },
    showTargetColumn: true,
  },
  linear_regression: {
    label: 'Linear Regression',
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Regression with optional Ridge (L2) or Lasso (L1) regularization. Best for continuous targets.',
    defaultParams: { test_size: 0.2, regularization: 'none', alpha: 1.0 },
    showTargetColumn: true,
  },
  kmeans: {
    label: 'K-Means',
    icon: <Target className="h-4 w-4" />,
    description: 'Unsupervised clustering with elbow method. Visualizes clusters in PCA-reduced 2D space.',
    defaultParams: { n_clusters: 3, max_clusters: 10 },
    showTargetColumn: false,
  },
  pca: {
    label: 'PCA',
    icon: <Layers className="h-4 w-4" />,
    description: 'Dimensionality reduction — shows explained variance per component and the 2D component scatter.',
    defaultParams: { n_components: 2 },
    showTargetColumn: true,
  },
  cnn: {
    label: 'CNN',
    icon: <Brain className="h-4 w-4" />,
    description: 'Image classifier. Upload a ZIP where each sub-folder is a class label — or run the synthetic demo.',
    defaultParams: { num_classes: 2, epochs: 5, img_size: 64 },
    showTargetColumn: false,
  },
};

const ALGO_ORDER: AlgoId[] = ['random_forest', 'linear_regression', 'kmeans', 'pca', 'cnn'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const LOG_COLOR: Record<LogEntry['level'], string> = {
  info: 'text-sky-300', success: 'text-emerald-300',
  error: 'text-red-400', warn: 'text-amber-300', default: 'text-slate-400',
};

const fmt = (v: number) => (Math.abs(v) >= 1 ? v.toFixed(3) : v.toFixed(4));

// ─── UI primitives ─────────────────────────────────────────────────────────────

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-[10px] uppercase tracking-widest text-slate-500">{label.replace(/_/g, ' ')}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-sky-300">{fmt(value)}</p>
    </div>
  );
}

function MetricsGrid({ metrics }: { metrics: Record<string, number> }) {
  const entries = Object.entries(metrics).filter(([, v]) => typeof v === 'number');
  return (
    <div className={`grid gap-2 ${entries.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
      {entries.map(([k, v]) => <MetricCard key={k} label={k} value={v} />)}
    </div>
  );
}

function ParamSlider({
  label, value, min, max, step, onChange,
}: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="font-mono text-sky-300">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-sky-400"
      />
    </div>
  );
}

// ─── Recharts custom tooltip ───────────────────────────────────────────────────

function CT({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/20 bg-slate-900/95 px-3 py-2 text-xs shadow-xl">
      {label !== undefined && <p className="mb-1 text-slate-400">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? '#94a3b8' }}>
          {p.name}: <span className="font-mono">{typeof p.value === 'number' ? p.value.toFixed(4) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Charts ────────────────────────────────────────────────────────────────────

function FeatureImportanceChart({ data }: { data: { feature: string; importance: number }[] }) {
  const top = data.slice(0, 10);
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, top.length * 28)}>
      <BarChart layout="vertical" data={top} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#ffffff10" />
        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 'auto']} />
        <YAxis type="category" dataKey="feature" width={120} tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <Tooltip content={<CT />} />
        <Bar dataKey="importance" radius={4}>
          {top.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function PredVsActualChart({ data }: { data: { actual: number; predicted: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ScatterChart margin={{ left: 8, right: 16, top: 8, bottom: 20 }}>
        <CartesianGrid stroke="#ffffff10" />
        <XAxis dataKey="actual" name="Actual" tick={{ fill: '#64748b', fontSize: 10 }}
          label={{ value: 'Actual', position: 'insideBottom', dy: 14, fill: '#64748b', fontSize: 10 }} />
        <YAxis dataKey="predicted" name="Predicted" tick={{ fill: '#64748b', fontSize: 10 }}
          label={{ value: 'Predicted', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
        <Tooltip content={<CT />} />
        <ZAxis range={[30, 30]} />
        <Scatter data={data} fill="#38bdf8" fillOpacity={0.65} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function CoefficientsChart({ data }: { data: { feature: string; coefficient: number }[] }) {
  const top = [...data].sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient)).slice(0, 10);
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, top.length * 28)}>
      <BarChart layout="vertical" data={top} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#ffffff10" />
        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
        <YAxis type="category" dataKey="feature" width={120} tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <Tooltip content={<CT />} />
        <Bar dataKey="coefficient" radius={4}>
          {top.map((d, i) => <Cell key={i} fill={d.coefficient >= 0 ? '#38bdf8' : '#f87171'} fillOpacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ElbowChart({ data, optimalK }: { data: { k: number; inertia: number }[]; optimalK: number }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ left: 8, right: 16, top: 4, bottom: 16 }}>
        <CartesianGrid stroke="#ffffff10" />
        <XAxis dataKey="k" tick={{ fill: '#64748b', fontSize: 10 }}
          label={{ value: 'k', position: 'insideBottom', dy: 12, fill: '#64748b', fontSize: 10 }} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
        <Tooltip content={<CT />} />
        <Line type="monotone" dataKey="inertia" stroke="#38bdf8" strokeWidth={2}
          dot={(props: any) => {
            const { cx, cy, payload } = props;
            return (
              <circle key={`dot-${payload.k}`} cx={cx} cy={cy}
                r={payload.k === optimalK ? 6 : 3}
                fill={payload.k === optimalK ? '#34d399' : '#38bdf8'}
                stroke="none" />
            );
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ClusterScatterChart({ data }: { data: { x: number; y: number; cluster: number }[] }) {
  const clusters = Array.from(new Set(data.map(d => d.cluster))).sort((a, b) => a - b);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ScatterChart margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid stroke="#ffffff10" />
        <XAxis dataKey="x" name="PC1" tick={{ fill: '#64748b', fontSize: 10 }} />
        <YAxis dataKey="y" name="PC2" tick={{ fill: '#64748b', fontSize: 10 }} />
        <ZAxis range={[30, 30]} />
        <Tooltip content={<CT />} />
        <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
        {clusters.map((c, i) => (
          <Scatter key={c} name={`Cluster ${c}`}
            data={data.filter(d => d.cluster === c)}
            fill={PALETTE[i % PALETTE.length]} fillOpacity={0.75} />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function ClusterSizesChart({ data }: { data: { cluster: number; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke="#ffffff10" />
        <XAxis dataKey="cluster" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `C${v}`} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
        <Tooltip content={<CT />} formatter={(v: any) => [v, 'Count']} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function VarianceChart({ explained, cumulative }: { explained: number[]; cumulative: number[] }) {
  const data = explained.map((v, i) => ({
    component: `PC${i + 1}`,
    variance: +(v * 100).toFixed(2),
    cumulative: +(cumulative[i] * 100).toFixed(2),
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={data} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid stroke="#ffffff10" />
        <XAxis dataKey="component" tick={{ fill: '#64748b', fontSize: 10 }} />
        <YAxis yAxisId="pct" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }}
          tickFormatter={v => `${v}%`} />
        <Tooltip content={<CT />} formatter={(v: any) => [`${v}%`]} />
        <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
        <Bar yAxisId="pct" dataKey="variance" name="Explained %" fill="#38bdf8" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
        <Line yAxisId="pct" type="monotone" dataKey="cumulative" name="Cumulative %" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function PCAScatterChart({ data }: { data: { pc1: number; pc2: number; label: string }[] }) {
  const labels = Array.from(new Set(data.map(d => d.label || 'unlabeled')));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ScatterChart margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid stroke="#ffffff10" />
        <XAxis dataKey="pc1" name="PC1" tick={{ fill: '#64748b', fontSize: 10 }} />
        <YAxis dataKey="pc2" name="PC2" tick={{ fill: '#64748b', fontSize: 10 }} />
        <ZAxis range={[30, 30]} />
        <Tooltip content={<CT />} />
        <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
        {labels.map((lbl, i) => (
          <Scatter key={lbl} name={lbl}
            data={data.filter(d => (d.label || 'unlabeled') === lbl)}
            fill={PALETTE[i % PALETTE.length]} fillOpacity={0.75} />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function TrainingChart({ history, mode }: {
  history: CNNResult['training_history'];
  mode: 'accuracy' | 'loss';
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={history} margin={{ left: 8, right: 16, top: 4, bottom: 16 }}>
        <CartesianGrid stroke="#ffffff10" />
        <XAxis dataKey="epoch" tick={{ fill: '#64748b', fontSize: 10 }}
          label={{ value: 'Epoch', position: 'insideBottom', dy: 12, fill: '#64748b', fontSize: 10 }} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }}
          domain={mode === 'accuracy' ? [0, 1] : ['auto', 'auto']} />
        <Tooltip content={<CT />} />
        <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
        <Line type="monotone" dataKey={mode} name={`Train ${mode}`}
          stroke="#38bdf8" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey={`val_${mode}`} name={`Val ${mode}`}
          stroke="#34d399" strokeWidth={2} dot={false} strokeDasharray="5 3" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ConfusionMatrix({ matrix }: { matrix: number[][] }) {
  const n = matrix.length;
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">Confusion Matrix</p>
      <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${n}, 2.75rem)` }}>
        {matrix.map((row, i) => row.map((val, j) => (
          <div key={`${i}-${j}`}
            className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold ${
              i === j ? 'bg-emerald-400/20 text-emerald-300' : 'bg-red-400/10 text-red-300'
            }`}>
            {val}
          </div>
        )))}
      </div>
    </div>
  );
}

// ─── Results renderer ─────────────────────────────────────────────────────────

function ResultsView({ result }: { result: MLResult }) {
  const [cnnMode, setCnnMode] = useState<'accuracy' | 'loss'>('accuracy');
  const [kmTab, setKmTab] = useState<'scatter' | 'elbow' | 'sizes'>('scatter');

  if ((result as any).error) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300 font-mono break-all">
        {(result as any).error}
      </div>
    );
  }

  switch (result.algorithm) {

    case 'random_forest': {
      const r = result as RFResult;
      return (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <span className={`rounded-lg px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
              r.task_type === 'classification' ? 'bg-sky-400/20 text-sky-300' : 'bg-violet-400/20 text-violet-300'
            }`}>{r.task_type}</span>
          </div>
          <MetricsGrid metrics={r.metrics} />
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">Feature Importance (top 10)</p>
            <FeatureImportanceChart data={r.feature_importance} />
          </div>
          {r.task_type === 'regression'
            ? <div>
                <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">Predicted vs Actual</p>
                <PredVsActualChart data={r.sample_predictions as any} />
              </div>
            : r.confusion_matrix && <ConfusionMatrix matrix={r.confusion_matrix} />
          }
        </div>
      );
    }

    case 'linear_regression': {
      const r = result as LRResult;
      return (
        <div className="space-y-5">
          {r.regularization !== 'none' && (
            <span className="rounded-lg bg-amber-400/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-300">
              {r.regularization} regularization
            </span>
          )}
          <MetricsGrid metrics={r.metrics} />
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">Predicted vs Actual (up to 50)</p>
            <PredVsActualChart data={r.predicted_vs_actual} />
          </div>
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">Coefficients (top 10 by magnitude)</p>
            <CoefficientsChart data={r.coefficients} />
          </div>
        </div>
      );
    }

    case 'kmeans': {
      const r = result as KMResult;
      return (
        <div className="space-y-5">
          <MetricsGrid metrics={r.metrics} />
          <div className="flex gap-1">
            {(['scatter', 'elbow', 'sizes'] as const).map(tab => (
              <button key={tab} onClick={() => setKmTab(tab)}
                className={`rounded-xl px-3 py-1.5 text-xs transition ${
                  kmTab === tab ? 'bg-sky-400/20 text-sky-200' : 'text-slate-500 hover:text-slate-300'
                }`}>
                {tab === 'scatter' ? '⬤ Clusters' : tab === 'elbow' ? '📉 Elbow' : '▦ Sizes'}
              </button>
            ))}
          </div>
          {kmTab === 'scatter' && <ClusterScatterChart data={r.cluster_plot} />}
          {kmTab === 'elbow'   && <ElbowChart data={r.elbow_data} optimalK={r.n_clusters} />}
          {kmTab === 'sizes'   && <ClusterSizesChart data={r.cluster_sizes} />}
        </div>
      );
    }

    case 'pca': {
      const r = result as PCAResult;
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {r.explained_variance.map((v, i) => (
              <MetricCard key={i} label={`PC${i + 1} variance`} value={v} />
            ))}
          </div>
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">Explained Variance per Component</p>
            <VarianceChart explained={r.explained_variance} cumulative={r.cumulative_variance} />
          </div>
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">2D Component Space</p>
            <PCAScatterChart data={r.components_plot} />
          </div>
        </div>
      );
    }

    case 'cnn': {
      const r = result as CNNResult;
      return (
        <div className="space-y-5">
          <MetricsGrid metrics={r.metrics} />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Training History</p>
              <div className="flex gap-1">
                {(['accuracy', 'loss'] as const).map(m => (
                  <button key={m} onClick={() => setCnnMode(m)}
                    className={`rounded-lg px-2 py-1 text-[10px] transition ${
                      cnnMode === m ? 'bg-sky-400/20 text-sky-200' : 'text-slate-500'
                    }`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <TrainingChart history={r.training_history} mode={cnnMode} />
          </div>
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">
              Sample Predictions — classes: {r.class_names.join(', ')}
            </p>
            <div className="space-y-2">
              {r.sample_predictions.slice(0, 6).map((p, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${p.actual === p.predicted ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className="text-slate-500">#{p.image_index}</span>
                  <span className="text-slate-300">actual: <b className="text-slate-100">{p.actual}</b></span>
                  <span className="text-slate-300">pred: <b className="text-slate-100">{p.predicted}</b></span>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-sky-400" style={{ width: `${p.confidence * 100}%` }} />
                    </div>
                    <span className="font-mono text-sky-300">{(p.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  }
}

// ─── Config Panel ──────────────────────────────────────────────────────────────

function ConfigPanel({
  algo, params, onParamChange,
  datasetUrl, setDatasetUrl,
  datasetFileName, onFileUpload,
  targetColumn, setTargetColumn,
  loading, elapsed, onRun, onStop,
}: {
  algo: AlgoId;
  params: Record<string, number | string>;
  onParamChange: (k: string, v: number | string) => void;
  datasetUrl: string;
  setDatasetUrl: (v: string) => void;
  datasetFileName: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  targetColumn: string;
  setTargetColumn: (v: string) => void;
  loading: boolean;
  elapsed: number;
  onRun: () => void;
  onStop: () => void;
}) {
  const meta = ALGO_META[algo];
  const demo = DEMO_DATASETS[algo];
  const isDemo = demo.url !== '' && datasetUrl === demo.url;
  const fileRef = useRef<HTMLInputElement>(null);
  const inputCls = 'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-sky-400/50 focus:outline-none';

  return (
    <div className="glass-panel space-y-5 rounded-[28px] p-5">
      {/* Description */}
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <p className="text-sm text-slate-200">{meta.description}</p>
        <p className="mt-1 text-xs text-slate-500">No dataset required — demo data used when empty</p>
      </div>

      {/* Dataset */}
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">
          {algo === 'cnn' ? 'Image Dataset (ZIP)' : 'Tabular Dataset'}
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder={algo === 'cnn' ? 'ZIP URL (optional)' : 'CSV / Excel / JSON URL (optional)'}
              value={datasetUrl}
              onChange={e => setDatasetUrl(e.target.value)}
              className={`${inputCls} pl-8 ${isDemo ? 'pr-24' : ''}`}
            />
            {isDemo && (
              <span className="absolute right-3 top-1.5 rounded-md bg-sky-400/15 px-2 py-1 text-[10px] font-medium text-sky-300">
                Demo data
              </span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            title="Upload file"
            className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-300 transition hover:bg-white/10"
          >
            <Upload className="h-4 w-4" />
          </button>
          <input ref={fileRef} type="file" className="hidden"
            accept=".csv,.xlsx,.xls,.json,.zip" onChange={onFileUpload} />
        </div>

        {demo.description && (
          <p className="text-xs text-slate-500">{demo.description}</p>
        )}

        {datasetFileName && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            {datasetFileName}
          </div>
        )}

        {meta.showTargetColumn && (
          <input
            type="text"
            placeholder='Target column (e.g. "species", "price")'
            value={targetColumn}
            onChange={e => setTargetColumn(e.target.value)}
            className={inputCls}
          />
        )}
      </div>

      {/* Parameters */}
      <div className="space-y-4">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">Parameters</p>

        {algo === 'random_forest' && (
          <>
            <ParamSlider label="n_estimators" value={params.n_estimators as number}
              min={10} max={500} step={10} onChange={v => onParamChange('n_estimators', v)} />
            <ParamSlider label="test_size" value={params.test_size as number}
              min={0.1} max={0.4} step={0.05} onChange={v => onParamChange('test_size', v)} />
          </>
        )}

        {algo === 'linear_regression' && (
          <>
            <div>
              <p className="mb-1 text-xs text-slate-400">regularization</p>
              <select value={params.regularization as string}
                onChange={e => onParamChange('regularization', e.target.value)}
                className={inputCls}>
                <option value="none">None (OLS)</option>
                <option value="ridge">Ridge (L2)</option>
                <option value="lasso">Lasso (L1)</option>
              </select>
            </div>
            {params.regularization !== 'none' && (
              <div>
                <div className="mb-1 flex justify-between text-xs text-slate-400">
                  <span>alpha</span>
                  <span className="font-mono text-sky-300">{params.alpha}</span>
                </div>
                <input type="number" min={0.001} max={100} step={0.1}
                  value={params.alpha as number}
                  onChange={e => onParamChange('alpha', Number(e.target.value))}
                  className={inputCls} />
              </div>
            )}
            <ParamSlider label="test_size" value={params.test_size as number}
              min={0.1} max={0.4} step={0.05} onChange={v => onParamChange('test_size', v)} />
          </>
        )}

        {algo === 'kmeans' && (
          <>
            <ParamSlider label="n_clusters" value={params.n_clusters as number}
              min={2} max={15} step={1} onChange={v => onParamChange('n_clusters', v)} />
            <ParamSlider label="max_clusters (elbow range)" value={params.max_clusters as number}
              min={5} max={20} step={1} onChange={v => onParamChange('max_clusters', v)} />
          </>
        )}

        {algo === 'pca' && (
          <ParamSlider label="n_components" value={params.n_components as number}
            min={2} max={10} step={1} onChange={v => onParamChange('n_components', v)} />
        )}

        {algo === 'cnn' && (
          <>
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>num_classes</span>
                <span className="font-mono text-sky-300">{params.num_classes}</span>
              </div>
              <input type="number" min={2} max={20} step={1}
                value={params.num_classes as number}
                onChange={e => onParamChange('num_classes', Number(e.target.value))}
                className={inputCls} />
            </div>
            <ParamSlider label="epochs" value={params.epochs as number}
              min={1} max={20} step={1} onChange={v => onParamChange('epochs', v)} />
            <div>
              <p className="mb-1 text-xs text-slate-400">img_size</p>
              <select value={params.img_size as number}
                onChange={e => onParamChange('img_size', Number(e.target.value))}
                className={inputCls}>
                <option value={32}>32 × 32</option>
                <option value={64}>64 × 64</option>
                <option value={128}>128 × 128</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Run / Stop */}
      <button
        onClick={loading ? onStop : onRun}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition ${
          loading
            ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25'
            : 'bg-sky-400/20 text-sky-200 hover:bg-sky-400/30'
        }`}
      >
        {loading ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Stop &nbsp;
            <span className="font-mono text-xs opacity-70">{elapsed}s</span>
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Run Analysis
          </>
        )}
      </button>
    </div>
  );
}

// ─── Main LabEditor ────────────────────────────────────────────────────────────

export function LabEditor({ language }: { language: Language }) {
  const { t } = useTranslation(language);

  const [selectedAlgo, setSelectedAlgo] = useState<AlgoId>('random_forest');
  const [params, setParams] = useState<Record<string, number | string>>(ALGO_META.random_forest.defaultParams);
  const [datasetUrl, setDatasetUrl] = useState(DEMO_DATASETS.random_forest.url);
  const [datasetBase64, setDatasetBase64] = useState('');
  const [datasetFileName, setDatasetFileName] = useState<string | null>(null);
  const [targetColumn, setTargetColumn] = useState(DEMO_DATASETS.random_forest.target);
  const [result, setResult] = useState<MLResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([
    { text: '[system] ML Workbench ready — pick an algorithm and click Run Analysis', level: 'info' },
  ]);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((text: string, level: LogEntry['level'] = 'default') => {
    const ts = new Date().toLocaleTimeString('en', { hour12: false });
    setLogs(prev => [...prev.slice(-40), { text: `[${ts}] ${text}`, level }]);
  }, []);

  const switchAlgo = (algo: AlgoId) => {
    setSelectedAlgo(algo);
    setParams(ALGO_META[algo].defaultParams);
    setDatasetUrl(DEMO_DATASETS[algo].url);
    setTargetColumn(DEMO_DATASETS[algo].target);
    setDatasetBase64('');
    setDatasetFileName(null);
    setResult(null);
    setError(null);
  };

  // Map ?exercise= URL param to algorithm tab on mount
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('exercise');
    if (p === 'crater-cnn')  switchAlgo('cnn');
    else if (p === 'rf-vs-nn') switchAlgo('random_forest');
    else if (p === 'surrogate') switchAlgo('linear_regression');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const full = evt.target?.result as string;
      setDatasetBase64(full.split(',')[1] ?? full);
      setDatasetUrl('');
      setDatasetFileName(file.name);
      addLog(`File loaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleRun = async () => {
    abortRef.current = new AbortController();
    setLoading(true);
    setElapsed(0);
    setResult(null);
    setError(null);
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);

    addLog(`Starting ${ALGO_META[selectedAlgo].label}...`, 'info');
    if (datasetUrl)     addLog(`Dataset URL: ${datasetUrl}`, 'default');
    else if (datasetBase64) addLog(`Using uploaded file: ${datasetFileName}`, 'default');
    else                addLog('No dataset provided — using demo data', 'default');

    try {
      const resp = await fetch(`${API_URL}/api/ml/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          algorithm: selectedAlgo,
          dataset_url: datasetUrl,
          dataset_base64: datasetBase64,
          target_column: targetColumn,
          params,
        }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: resp.statusText }));
        throw new Error(err.error ?? resp.statusText);
      }

      const data = await resp.json();
      if (data.success) {
        setResult(data.result);
        addLog(`Analysis complete ✓  (${elapsed}s)`, 'success');
      } else {
        throw new Error(data.error ?? 'Unknown server error');
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        addLog('Analysis cancelled', 'warn');
      } else {
        setError(e.message);
        addLog(`Error: ${e.message}`, 'error');
      }
    } finally {
      setLoading(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(false);
    addLog('Stopped by user', 'warn');
  };

  const jupyterUrl = 'https://jupyter.cloudlms.xyz/hub/user-redirect/lab/tree/free-experiment.ipynb';

  return (
    <section className="space-y-6">
      <SectionHeader
        action={
          <a href={jupyterUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-100 transition hover:bg-emerald-400/20">
            <Zap className="h-4 w-4" />
            Open JupyterHub
          </a>
        }
        description={t('virtualLabDesc')}
        eyebrow={t('virtualLab')}
        title={t('virtualLabTitle')}
      />

      {/* Algorithm selector tabs */}
      <div className="flex flex-wrap gap-2">
        {ALGO_ORDER.map(algo => {
          const meta = ALGO_META[algo];
          const active = algo === selectedAlgo;
          return (
            <button key={algo} onClick={() => switchAlgo(algo)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${
                active
                  ? 'border border-sky-400/30 bg-sky-400/20 text-sky-200'
                  : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
              }`}>
              {meta.icon}
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Main grid: config left, results right */}
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <ConfigPanel
          algo={selectedAlgo}
          params={params}
          onParamChange={(k, v) => setParams(prev => ({ ...prev, [k]: v }))}
          datasetUrl={datasetUrl}
          setDatasetUrl={setDatasetUrl}
          datasetFileName={datasetFileName}
          onFileUpload={handleFileUpload}
          targetColumn={targetColumn}
          setTargetColumn={setTargetColumn}
          loading={loading}
          elapsed={elapsed}
          onRun={handleRun}
          onStop={handleStop}
        />

        <div className="space-y-4">
          {/* Results panel */}
          <div className="glass-panel min-h-[420px] rounded-[28px] p-5">
            {loading && (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-400/30 border-t-sky-400" />
                <p className="text-sm text-slate-400">
                  Running {ALGO_META[selectedAlgo].label}
                  <span className="ml-2 font-mono text-xs text-slate-500">{elapsed}s</span>
                </p>
                <p className="text-xs text-slate-600">Large datasets or CNN training may take up to 5 minutes</p>
              </div>
            )}

            {!loading && error && (
              <div className="space-y-3 rounded-2xl border border-red-400/20 bg-red-400/10 p-5">
                <div className="flex items-center gap-2 text-red-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">Analysis failed</span>
                </div>
                <p className="break-all font-mono text-xs text-red-300/80">{error}</p>
                <p className="text-xs text-slate-500">
                  Make sure the backend server is running (<code>npm run dev</code> in{' '}
                  <code>server/</code>) with the <code>.venv</code> Python.
                </p>
              </div>
            )}

            {!loading && !error && result && <ResultsView result={result} />}

            {!loading && !error && !result && (
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <Activity className="h-8 w-8 text-slate-700" />
                <p className="text-sm text-slate-500">
                  Select an algorithm and click{' '}
                  <strong className="text-slate-400">Run Analysis</strong>
                </p>
                <p className="text-xs text-slate-600">No dataset needed — demo data runs automatically</p>
              </div>
            )}
          </div>

          {/* Console */}
          <div className="glass-panel rounded-[28px] p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${loading ? 'animate-pulse bg-emerald-400' : 'bg-slate-600'}`} />
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Console</p>
            </div>
            <div className="max-h-32 overflow-y-auto rounded-2xl border border-white/10 bg-[#060d17] p-3 font-mono text-xs leading-6">
              {logs.map((log, i) => (
                <p key={i} className={LOG_COLOR[log.level]}>{log.text}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
