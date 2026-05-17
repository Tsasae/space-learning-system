import { useEffect, useState } from "react";
import { FlaskConical, Play, Save, Square, Terminal, Zap } from "lucide-react";
import { useTranslation } from "../../i18n/useTranslation";
import { Language } from "../../types";
import { SectionHeader } from "../common/SectionHeader";

const EXERCISES: Record<string, { title: string; code: string }> = {
  "crater-cnn": {
    title: "Exercise 1: CNN Crater Classification",
    code: `import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from sklearn.model_selection import train_test_split

# 1000 crater images, 64x64 pixels, RGB
X = np.random.rand(1000, 64, 64, 3)
y = np.random.randint(0, 2, 1000)  # 0=small crater, 1=large crater

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

model = models.Sequential([
    layers.Conv2D(32, (3,3), activation='relu', input_shape=(64,64,3)),
    layers.MaxPooling2D(2,2),
    layers.Conv2D(64, (3,3), activation='relu'),
    layers.MaxPooling2D(2,2),
    layers.Flatten(),
    layers.Dense(64, activation='relu'),
    layers.Dense(1, activation='sigmoid')
])

model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
history = model.fit(X_train, y_train, epochs=5, batch_size=32, validation_split=0.1)

loss, accuracy = model.evaluate(X_test, y_test)
print("CNN Test Accuracy:", accuracy)`,
  },
  "rf-vs-nn": {
    title: "Exercise 2: Random Forest vs Neural Network",
    code: `from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import numpy as np

X = np.random.rand(500, 10)
y = np.random.randint(0, 2, 500)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

rf_model = RandomForestClassifier(n_estimators=100)
rf_model.fit(X_train, y_train)
rf_acc = accuracy_score(y_test, rf_model.predict(X_test))
print("Random Forest Accuracy:", rf_acc)

nn_model = MLPClassifier(hidden_layer_sizes=(32,32), max_iter=500)
nn_model.fit(X_train, y_train)
nn_acc = accuracy_score(y_test, nn_model.predict(X_test))
print("Neural Network Accuracy:", nn_acc)`,
  },
  surrogate: {
    title: "Exercise 3: Surrogate Physics Model",
    code: `import numpy as np
from sklearn.neural_network import MLPRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

X = np.random.rand(1000, 3)
y = 3*X[:,0] + 2*X[:,1]**2 - X[:,2]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

model = MLPRegressor(hidden_layer_sizes=(32,32), activation='relu', max_iter=500)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
mse = mean_squared_error(y_test, y_pred)
print("Surrogate model MSE:", mse)
print("Example predictions:", y_pred[:5])`,
  },
};

// ─── Right-panel data ─────────────────────────────────────────────────────────

type LogColor = 'emerald' | 'sky' | 'default';
interface LogLine { text: string; color: LogColor; }
interface PanelData {
  logs: LogLine[];
  vizTitle: string;
  vizDescription: string;
  datasets: string[];
}

const PANEL_DATA: Record<string, PanelData> = {
  'crater-cnn': {
    logs: [
      { text: '[kernel] NASA NEO dataset loaded: 50+ asteroids', color: 'emerald' },
      { text: '[model] RandomForestClassifier initialized', color: 'default' },
      { text: '[train] Training on NASA real data...', color: 'default' },
      { text: '[result] Accuracy: 0.9524', color: 'default' },
      { text: '[result] Safe asteroids: 48, Hazardous: 3', color: 'default' },
      { text: '[status] Analysis complete! ✓', color: 'sky' },
    ],
    vizTitle: 'NASA NEO Analysis',
    vizDescription: 'Feature importance & asteroid distribution chart',
    datasets: ['NASA NEO Feed (Jan 2024)', '50 asteroids', '4 features: diameter, velocity, distance, hazardous'],
  },
  'rf-vs-nn': {
    logs: [
      { text: '[kernel] Dataset loaded: 500 samples, 10 features', color: 'emerald' },
      { text: '[model] RandomForest: training...', color: 'default' },
      { text: '[model] NeuralNetwork: training...', color: 'default' },
      { text: '[result] Random Forest Accuracy: 0.52', color: 'default' },
      { text: '[result] Neural Network Accuracy: 0.54', color: 'default' },
      { text: '[status] Comparison complete! ✓', color: 'sky' },
    ],
    vizTitle: 'Model Comparison',
    vizDescription: 'Random Forest vs Neural Network accuracy bar chart',
    datasets: ['Synthetic crater dataset', '500 samples', '10 numerical features'],
  },
  surrogate: {
    logs: [
      { text: '[kernel] Physics equation: y = 3x1 + 2x2² - x3', color: 'emerald' },
      { text: '[data] Generated 1000 simulation samples', color: 'default' },
      { text: '[model] MLPRegressor training...', color: 'default' },
      { text: '[result] MSE: 0.000823', color: 'default' },
      { text: '[result] R² Score: 0.9987', color: 'default' },
      { text: '[status] Surrogate model ready! ✓', color: 'sky' },
    ],
    vizTitle: 'Physics Approximation',
    vizDescription: 'Actual vs Predicted scatter plot (R²=0.9987)',
    datasets: ['Physics simulation data', '1000 samples', '3 input parameters'],
  },
};

const DEFAULT_PANEL: PanelData = {
  logs: [
    { text: '[kernel] Dataset mounted: /datasets/lroc_polar_mosaic.nc', color: 'emerald' },
    { text: '[kernel] Reflectance layer extracted successfully.', color: 'default' },
    { text: '[viz] Rendering preview heatmap...', color: 'default' },
    { text: '[runtime] 1.84s | GPU memory 3.2 GB', color: 'sky' },
  ],
  vizTitle: '',
  vizDescription: 'Lunar reflectance chart / map canvas',
  datasets: ['LROC polar mosaic', 'Moon Mineralogy Mapper subset', 'Apollo seismic sample'],
};

const LOG_COLOR: Record<LogColor, string> = {
  emerald: 'text-emerald-300',
  sky: 'text-sky-200',
  default: '',
};

export function LabEditor({ language }: { language: Language }) {
  const { t } = useTranslation(language);
  const [iframeSrc, setIframeSrc] = useState('http://localhost:8888');
  const [exerciseTitle, setExerciseTitle] = useState<string | null>(null);
  const [exerciseParam, setExerciseParam] = useState<string | null>(null);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("exercise");
    if (param && EXERCISES[param]) {
      setIframeSrc(`http://localhost:8888/notebooks/exercise-${param}.ipynb`);
      setExerciseTitle(EXERCISES[param].title);
      setExerciseParam(param);
    }
  }, []);

  const panel = (exerciseParam && PANEL_DATA[exerciseParam]) ? PANEL_DATA[exerciseParam] : DEFAULT_PANEL;

  return (
    <section className="space-y-6">
      <SectionHeader
        action={
          <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            <Zap className="h-4 w-4" />
            GPU: A100 selected
          </div>
        }
        description={t("virtualLabDesc")}
        eyebrow={t("virtualLab")}
        title={t("virtualLabTitle")}
      />

      {exerciseTitle && (
        <div className="flex items-center gap-3 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-5 py-3">
          <FlaskConical className="h-4 w-4 shrink-0 text-sky-300" />
          <p className="text-sm font-medium text-sky-100">{exerciseTitle}</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-panel rounded-[28px] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-sky-300/15 px-3 py-2 text-xs font-medium text-sky-100">
                kernel: python 3.11
              </span>
              <span className="rounded-2xl bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-100">
                status: idle
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-2xl bg-sky-300/15 px-4 py-2 text-sm text-sky-100" type="button">
                <span className="inline-flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Run
                </span>
              </button>
              <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200" type="button">
                <span className="inline-flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  Stop
                </span>
              </button>
              <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200" type="button">
                <span className="inline-flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </span>
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/10">
            <iframe
              src={iframeSrc}
              style={{ width: '100%', height: '100%', border: 'none', minHeight: '600px' }}
              title="Jupyter Notebook"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-[28px] p-5">
            <p className="text-sm font-medium text-slate-100">{t("outputConsole")}</p>
            <div className="mt-4 rounded-[24px] border border-white/10 bg-[#091425] p-4 font-mono text-sm leading-7 text-slate-300">
              {panel.logs.map((line, i) => (
                <p key={i} className={LOG_COLOR[line.color]}>{line.text}</p>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[28px] p-5">
            <p className="text-sm font-medium text-slate-100">{t("visualizationPreview")}</p>
            <div className="grid-overlay mt-4 flex h-56 flex-col items-center justify-center gap-2 rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-950 to-slate-900">
              {panel.vizTitle && (
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{panel.vizTitle}</p>
              )}
              <div className="rounded-full bg-sky-300/10 px-4 py-2 text-sm text-sky-100">
                {panel.vizDescription}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-amber-200" />
              <p className="text-sm font-medium text-slate-100">{t("attachedDatasets")}</p>
            </div>
            <div className="space-y-3">
              {panel.datasets.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
