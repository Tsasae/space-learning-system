import { useState } from 'react';
import { Play, Loader2, Sparkles } from 'lucide-react';
import { API_URL } from '../../config';

interface PredictionPanelProps {
  modelId: string;
  featureNames: string[];
  taskType?: 'classification' | 'regression';
}

interface ProbaItem { class: number; probability: number }
interface PredictResult {
  task_type: 'classification' | 'regression';
  prediction: number;
  probabilities?: ProbaItem[];
}

const fmt = (v: number) => (Math.abs(v) >= 1 ? v.toFixed(3) : v.toFixed(4));

export default function PredictionPanel({ modelId, featureNames }: PredictionPanelProps) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(featureNames.map((f) => [f, '']))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResult | null>(null);

  const handleChange = (feature: string, v: string) =>
    setValues((prev) => ({ ...prev, [feature]: v }));

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const features: Record<string, number> = {};
    for (const f of featureNames) {
      const num = Number(values[f]);
      if (values[f] === '' || Number.isNaN(num)) {
        setError(`"${f}" талбарт тоон утга оруулна уу`);
        setLoading(false);
        return;
      }
      features[f] = num;
    }

    try {
      const resp = await fetch(`${API_URL}/api/ml/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: modelId, features }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error ?? resp.statusText);
      }
      setResult(data.result as PredictResult);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-300" />
        <h3 className="text-sm font-semibold tracking-wide text-slate-200">
          Прогноз — сурсан загвараар туршиж үзэх
        </h3>
      </div>

      <p className="mb-4 text-xs text-slate-400">
        Feature тус бүрийн утгыг оруулаад загвараар прогноз гаргана.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {featureNames.map((f) => (
          <label key={f} className="block">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">
              {f.replace(/_/g, ' ')}
            </span>
            <input
              type="number"
              step="any"
              value={values[f]}
              onChange={(e) => handleChange(f, e.target.value)}
              placeholder="0"
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-400/40 focus:bg-white/10"
            />
          </label>
        ))}
      </div>

      <button
        onClick={handlePredict}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-100 transition hover:bg-emerald-400/20 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        {loading ? 'Тооцоолж байна…' : 'Прогноз гаргах'}
      </button>

      {error && (
        <p className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-400/5 p-4">
          {result.task_type === 'regression' ? (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">
                Прогнозлосон утга
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-sky-300">
                {fmt(result.prediction)}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">
                Прогнозлосон анги (class)
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-300">
                {result.prediction}
              </p>

              {result.probabilities && result.probabilities.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {result.probabilities.map((p) => (
                    <div key={p.class} className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-xs text-slate-400">
                        Class {p.class}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-sky-400/70"
                          style={{ width: `${Math.round(p.probability * 100)}%` }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right text-xs tabular-nums text-slate-300">
                        {(p.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
