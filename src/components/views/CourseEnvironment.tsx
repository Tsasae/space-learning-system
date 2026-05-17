import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { SectionHeader } from "../common/SectionHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BulletSlide {
  title: string;
  type?: "bullets";
  bullets: string[];
  notes: string;
}

interface CodeSlide {
  title: string;
  type: "code";
  language: string;
  code: string;
  notes: string;
}

type Slide = BulletSlide | CodeSlide;

interface Part {
  label: string;
  title: string;
  slides: Slide[];
}

// ─── Course Data ──────────────────────────────────────────────────────────────

const PARTS: Part[] = [
  {
    label: "Part 1",
    title: "Introduction to AI in Planetary Science",
    slides: [
      {
        title: "Why Study the Moon?",
        bullets: [
          "Moon preserves early Solar System history",
          "No atmosphere → surface features remain",
          "Natural laboratory for planetary science",
          "Important for future human space missions",
        ],
        notes:
          "The Moon's lack of atmosphere means its surface retains impact records from billions of years ago — a time capsule unavailable anywhere else in our Solar System.",
      },
      {
        title: "Importance of Crater Dating",
        bullets: [
          "Crater density estimates surface age",
          "More craters → older surface",
          "Builds lunar geological timeline",
          "Supports mission landing site selection",
        ],
        notes:
          "By counting craters per unit area, scientists can estimate when a region last experienced major resurfacing — analogous to measuring sediment layers on Earth.",
      },
      {
        title: "Resource Exploration",
        bullets: [
          "Detection of water ice (polar regions)",
          "Identification of Helium-3 deposits",
          "Mapping mineral distribution",
          "Supporting sustainable lunar bases",
        ],
        notes:
          "Helium-3 is a rare isotope on Earth but abundant on the Moon — a potential fuel source for future nuclear fusion reactors, making resource mapping strategically critical.",
      },
      {
        title: "AI in Space Research",
        bullets: [
          "Automated crater detection using CNNs",
          "Mars rover autonomous navigation",
          "Satellite image classification",
          "AI-assisted planetary simulation",
        ],
        notes:
          "Deep learning models trained on labeled satellite imagery can detect thousands of craters per hour — far exceeding any human analyst's throughput.",
      },
      {
        title: "Why AI?",
        bullets: [
          "Large satellite datasets",
          "Manual analysis is slow",
          "AI enables automation + pattern recognition",
          "Faster scientific discovery",
        ],
        notes:
          "Modern missions like LRO generate terabytes of imagery. Only automated pipelines can process this volume at the pace science demands.",
      },
    ],
  },
  {
    label: "Part 2",
    title: "AI-Based Crater Chronology Modeling",
    slides: [
      {
        title: "What is Crater Chronology?",
        bullets: [
          "Surface age estimation method",
          "Based on crater density",
          "Older surfaces = more craters",
          "Used for Moon, Mars, Mercury",
        ],
        notes:
          "Crater chronology is the primary tool for absolute age-dating of planetary surfaces where no rock samples are available to return to Earth for lab analysis.",
      },
      {
        title: "AI Approach",
        bullets: [
          "Input: Lunar satellite images",
          "CNN extracts crater features",
          "Density estimation",
          "Output: Age prediction (regression)",
        ],
        notes:
          "A regression head replaces the typical classification layer — the network outputs a scalar representing millions of years rather than a class label.",
      },
      {
        title: "Example Code - Crater Age Prediction",
        type: "code",
        language: "python",
        code: `import torch
import torch.nn as nn
import torchvision.models as models

# Pretrained CNN
model = models.resnet18(pretrained=True)

# Modify final layer for regression
model.fc = nn.Linear(model.fc.in_features, 1)

# Forward pass
dummy_input = torch.randn(1, 3, 224, 224)
output = model(dummy_input)
print('Predicted Age:', output.item())`,
        notes:
          "We fine-tune ResNet-18 rather than train from scratch — transfer learning dramatically reduces the labeled data required for planetary imagery tasks.",
      },
    ],
  },
  {
    label: "Part 3",
    title: "Volcanic Structure Detection",
    slides: [
      {
        title: "Volcanic Structures on Moon",
        bullets: [
          "Lava plains (Maria) - dark basaltic regions",
          "Volcanic domes - rounded structures",
          "Pyroclastic deposits - explosive eruption remains",
          "Important for lunar thermal history",
        ],
        notes:
          "The dark Maria visible to the naked eye are ancient lava seas — studying their extent reveals how geologically active the early Moon truly was.",
      },
      {
        title: "CNN for Detection",
        bullets: [
          "Input: Satellite images 128×128",
          "Conv2D layers extract features",
          "Binary classification: Volcanic / Non-volcanic",
          "Sigmoid activation → probability output",
        ],
        notes:
          "Sigmoid output lets us set confidence thresholds — we might require >0.85 probability before flagging a region as volcanic to reduce false positives.",
      },
      {
        title: "Example Code - CNN Classifier",
        type: "code",
        language: "python",
        code: `import tensorflow as tf
from tensorflow.keras import layers, models

model = models.Sequential([
    layers.Conv2D(32, (3,3), activation='relu', input_shape=(128,128,3)),
    layers.MaxPooling2D(2,2),
    layers.Conv2D(64, (3,3), activation='relu'),
    layers.MaxPooling2D(2,2),
    layers.Flatten(),
    layers.Dense(64, activation='relu'),
    layers.Dense(1, activation='sigmoid')
])

model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
model.summary()`,
        notes:
          "Two Conv2D blocks are typically sufficient for 128×128 inputs — deeper architectures risk overfitting on the small labeled lunar datasets currently available.",
      },
    ],
  },
  {
    label: "Part 4",
    title: "AI Surrogate Models",
    slides: [
      {
        title: "What is a Surrogate Model?",
        bullets: [
          "AI approximation of physics simulation",
          "Learns input→output relationship",
          "Replaces expensive calculations",
          "Seconds instead of hours",
        ],
        notes:
          "High-fidelity planetary simulations can take days on HPC clusters. A surrogate trained on simulation outputs enables rapid parameter sweeps for mission planning.",
      },
      {
        title: "Workflow",
        bullets: [
          "Step 1: Run physics simulation",
          "Step 2: Generate dataset",
          "Step 3: Train neural network",
          "Step 4: Fast predictions",
        ],
        notes:
          "The dataset generation step is the bottleneck — even 1 000 simulation runs can take weeks, so active learning strategies are used to sample parameter space efficiently.",
      },
      {
        title: "Example Code - Surrogate Model",
        type: "code",
        language: "python",
        code: `import numpy as np
from sklearn.neural_network import MLPRegressor

# Synthetic dataset
X = np.random.rand(1000, 5)  # 5 physical parameters
y = np.sum(X, axis=1)        # simulation output

model = MLPRegressor(hidden_layer_sizes=(64,64), activation='relu', max_iter=500)
model.fit(X, y)

prediction = model.predict(X[:5])
print('Predictions:', prediction)`,
        notes:
          "MLPRegressor from scikit-learn is a great starting point — swap it for a PyTorch model when you need GPU acceleration or custom architectures.",
      },
    ],
  },
  {
    label: "Part 5",
    title: "Isotope & Terrain Classification",
    slides: [
      {
        title: "Overview",
        bullets: [
          "Classify planetary surface materials",
          "Uses isotope ratios and spectral data",
          "Random Forest, SVM, Neural Networks",
          "Output: terrain type map",
        ],
        notes:
          "Spectral reflectance curves are unique fingerprints for surface minerals — AI models can process millions of spectra far faster than human geologists.",
      },
      {
        title: "Terrain Classes",
        bullets: [
          "Lava plains",
          "Cratered regions",
          "Highlands / mountains",
          "Pyroclastic deposits",
        ],
        notes:
          "Class boundaries are often fuzzy in practice — transition zones between highlands and maria require probabilistic outputs rather than hard classification.",
      },
      {
        title: "Example Code - Random Forest",
        type: "code",
        language: "python",
        code: `from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import numpy as np

X = np.random.rand(500, 10)  # 10 isotope features
y = np.random.randint(0, 3, 500)  # 3 terrain classes

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

accuracy = model.score(X_test, y_test)
print('Accuracy:', accuracy)`,
        notes:
          "Random Forests provide built-in feature importance scores — a valuable insight for identifying which isotope ratios are most diagnostic of each terrain type.",
      },
    ],
  },
  {
    label: "Part 6",
    title: "Challenges & Conclusion",
    slides: [
      {
        title: "Challenges",
        bullets: [
          "Limited labeled lunar data",
          "Class imbalance in terrain types",
          "Noise in satellite images",
          "Overfitting with small datasets",
        ],
        notes:
          "Data augmentation (flipping, rotation, brightness jitter) and transfer learning are the primary mitigations for small labeled dataset sizes in planetary science.",
      },
      {
        title: "Conclusion",
        bullets: [
          "AI transforms planetary science",
          "CNN → image understanding",
          "Surrogate models → fast simulation",
          "ML → classification & prediction",
        ],
        notes:
          "The convergence of high-resolution satellite data and modern AI marks a step-change for planetary science — what took years of manual mapping now takes days.",
      },
    ],
  },
];

const EXERCISES = [
  {
    id: 1,
    title: "CNN Crater Classification",
    description: "Train a CNN to classify small vs large craters using image data",
    path: "/virtual-lab?exercise=crater-cnn",
  },
  {
    id: 2,
    title: "Random Forest vs Neural Network",
    description: "Compare RF and MLP accuracy on tabular crater features",
    path: "/virtual-lab?exercise=rf-vs-nn",
  },
  {
    id: 3,
    title: "Surrogate Physics Model",
    description: "Build a surrogate model to approximate a physics equation",
    path: "/virtual-lab?exercise=surrogate",
  },
];

// ─── Code Block ───────────────────────────────────────────────────────────────

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-2">
        <span className="text-xs font-medium text-slate-400">{language}</span>
        <span className="h-2 w-2 rounded-full bg-emerald-400/60" />
      </div>
      <pre className="overflow-x-auto bg-black/30 p-5 text-sm leading-relaxed text-slate-200">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CourseEnvironment() {
  const [activePart, setActivePart] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);
  const [publishedCourses, setPublishedCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/courses")
      .then((r) => r.json())
      .then((j) => { if (j.success) setPublishedCourses(j.courses ?? j.data ?? []); })
      .catch(() => {})
      .finally(() => setCoursesLoading(false));
  }, []);

  if (!coursesLoading && publishedCourses.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-center">
        <div>
          <p className="text-4xl">📚</p>
          <p className="mt-3 font-medium text-white">Одоогоор хичээл байхгүй байна</p>
          <p className="mt-1 text-sm text-slate-400">
            Багш хичээл оруулсны дараа энд харагдана
          </p>
        </div>
      </div>
    );
  }

  const part = PARTS[activePart];
  const slide = part.slides[slideIndex];
  const totalSlides = part.slides.length;
  const progress = ((slideIndex + 1) / totalSlides) * 100;

  function goToPart(index: number) {
    setActivePart(index);
    setSlideIndex(0);
    setNotesOpen(false);
  }

  function prev() {
    if (slideIndex > 0) setSlideIndex((i) => i - 1);
  }

  function next() {
    if (slideIndex < totalSlides - 1) setSlideIndex((i) => i + 1);
  }

  return (
    <section className="space-y-8">
      <SectionHeader
        action={
          <button
            className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-100"
            type="button"
          >
            Start Learning
          </button>
        }
        description="Case 1 — AI for Lunar Formation & Structure. Step through six modular parts covering AI applications in planetary science."
        eyebrow="Course Environment"
        title="AI for Lunar Formation & Structure"
      />

      {/* ── Part tabs ─────────────────────────────────────────────────────── */}
      <div className="glass-panel rounded-[28px] p-6">
        <div className="flex flex-wrap gap-2">
          {PARTS.map((p, i) => (
            <button
              key={p.label}
              type="button"
              onClick={() => goToPart(i)}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
                activePart === i
                  ? "bg-sky-400/20 text-sky-100 ring-1 ring-sky-400/30"
                  : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Active part title */}
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
          {part.title}
        </p>

        {/* ── Progress bar ────────────────────────────────────────────────── */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-xs text-slate-400">
            Slide {slideIndex + 1} of {totalSlides}
          </span>
        </div>

        {/* ── Slide ───────────────────────────────────────────────────────── */}
        <div className="mt-6 rounded-[20px] border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-slate-50">{slide.title}</h2>

          <div className="mt-5">
            {slide.type === "code" ? (
              <CodeBlock code={slide.code} language={slide.language} />
            ) : (
              <ul className="space-y-3">
                {(slide as BulletSlide).bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Speaker notes */}
          <div className="mt-6 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => setNotesOpen((o) => !o)}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${notesOpen ? "rotate-180" : ""}`}
              />
              Speaker notes
            </button>
            {notesOpen && (
              <p className="mt-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm italic text-slate-400 leading-relaxed">
                {slide.notes}
              </p>
            )}
          </div>
        </div>

        {/* ── Navigation buttons ──────────────────────────────────────────── */}
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={prev}
            disabled={slideIndex === 0}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          {/* Slide dot indicators */}
          <div className="flex gap-1.5">
            {part.slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSlideIndex(i)}
                className={`h-2 w-2 rounded-full transition-all ${
                  i === slideIndex ? "w-5 bg-sky-400" : "bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            disabled={slideIndex === totalSlides - 1}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Practice Exercises ────────────────────────────────────────────── */}
      <div>
        <p className="mb-5 text-lg font-semibold text-slate-50">Practice Exercises</p>
        <div className="grid gap-4 md:grid-cols-3">
          {EXERCISES.map((ex) => (
            <div
              key={ex.id}
              className="glass-panel flex flex-col gap-4 rounded-[28px] p-6"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-400/10 text-sm font-bold text-sky-200">
                {ex.id}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-100">{ex.title}</p>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{ex.description}</p>
              </div>
              <button
                type="button"
                onClick={() => { window.location.href = ex.path; }}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 transition-colors hover:bg-white/10"
              >
                Open in Virtual Lab
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
