"""Generate all 5 ML Jupyter notebooks for the Lunar Cloud LMS system."""
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
NOTEBOOKS_DIR = os.path.join(BASE_DIR, "notebooks")
os.makedirs(NOTEBOOKS_DIR, exist_ok=True)


# ─── helpers ──────────────────────────────────────────────────────────────────

def make_notebook(params_src: str, code_src: str, name: str) -> dict:
    def to_lines(src):
        lines = src.strip().splitlines()
        return [l + "\n" for l in lines[:-1]] + [lines[-1]] if lines else []

    return {
        "cells": [
            {
                "cell_type": "code",
                "execution_count": None,
                "id": f"{name}-params",
                "metadata": {"tags": ["parameters"]},
                "outputs": [],
                "source": to_lines(params_src),
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "id": f"{name}-main",
                "metadata": {},
                "outputs": [],
                "source": to_lines(code_src),
            },
        ],
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3",
            },
            "language_info": {
                "codemirror_mode": {"name": "ipython", "version": 3},
                "file_extension": ".py",
                "mimetype": "text/x-python",
                "name": "python",
                "version": "3.8.0",
            },
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }


# ─── NOTEBOOK 1: Random Forest ────────────────────────────────────────────────

RF_PARAMS = """
dataset_url = ""
dataset_base64 = ""
target_column = ""
n_estimators = 100
test_size = 0.2
"""

RF_CODE = """
import pandas as pd
import numpy as np
import json, io, base64, warnings
warnings.filterwarnings('ignore')
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                              f1_score, r2_score, mean_squared_error,
                              mean_absolute_error, confusion_matrix)

result = {}
try:
    # ── Load data ──────────────────────────────────────────────────────────────
    if dataset_url:
        ext = dataset_url.split('.')[-1].lower()
        df = (pd.read_excel(dataset_url) if ext in ['xlsx', 'xls']
              else pd.read_json(dataset_url) if ext == 'json'
              else pd.read_csv(dataset_url))
    elif dataset_base64:
        raw = base64.b64decode(dataset_base64)
        try:
            df = pd.read_csv(io.BytesIO(raw))
        except Exception:
            df = pd.read_excel(io.BytesIO(raw))
    else:
        from sklearn.datasets import load_iris
        iris = load_iris()
        df = pd.DataFrame(iris.data, columns=iris.feature_names)
        df['target'] = iris.target
        if not target_column:
            target_column = 'target'

    # ── Detect target ──────────────────────────────────────────────────────────
    tgt = target_column if target_column else df.columns[-1]
    if tgt not in df.columns:
        raise ValueError(f"Target column '{tgt}' not found. Available: {list(df.columns)}")

    # ── Preprocessing ──────────────────────────────────────────────────────────
    df = df.dropna(subset=[tgt]).copy()
    for col in df.columns:
        if df[col].dtype == 'object':
            m = df[col].mode()
            df[col] = df[col].fillna(m[0] if len(m) > 0 else 'missing')
        else:
            df[col] = df[col].fillna(df[col].median())
    for col in df.select_dtypes(include='object').columns:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))

    X = df.drop(columns=[tgt])
    y = df[tgt]
    is_clf = (y.nunique() < 10) or str(y.dtype) in ['object', 'bool', 'category']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=float(test_size), random_state=42, stratify=y if is_clf else None)

    # ── Train ──────────────────────────────────────────────────────────────────
    if is_clf:
        model = RandomForestClassifier(n_estimators=int(n_estimators), random_state=42)
    else:
        model = RandomForestRegressor(n_estimators=int(n_estimators), random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    # ── Metrics ────────────────────────────────────────────────────────────────
    result = {
        'algorithm': 'random_forest',
        'task_type': 'classification' if is_clf else 'regression',
        'metrics': {}
    }
    if is_clf:
        result['metrics']['accuracy']  = round(float(accuracy_score(y_test, y_pred)), 4)
        result['metrics']['precision'] = round(float(precision_score(y_test, y_pred, average='weighted', zero_division=0)), 4)
        result['metrics']['recall']    = round(float(recall_score(y_test, y_pred, average='weighted', zero_division=0)), 4)
        result['metrics']['f1_score']  = round(float(f1_score(y_test, y_pred, average='weighted', zero_division=0)), 4)
        result['confusion_matrix'] = confusion_matrix(y_test, y_pred).tolist()
    else:
        result['metrics']['r2_score'] = round(float(r2_score(y_test, y_pred)), 4)
        result['metrics']['rmse']     = round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 4)
        result['metrics']['mae']      = round(float(mean_absolute_error(y_test, y_pred)), 4)

    feat_imp = sorted(zip(X.columns.tolist(), model.feature_importances_.tolist()), key=lambda x: -x[1])
    result['feature_importance'] = [{'feature': f, 'importance': round(float(i), 4)} for f, i in feat_imp]

    n_s = min(20, len(y_test))
    if is_clf:
        result['sample_predictions'] = [
            {'actual': int(a), 'predicted': int(p)}
            for a, p in zip(y_test.values[:n_s], y_pred[:n_s])
        ]
    else:
        result['sample_predictions'] = [
            {'actual': round(float(a), 4), 'predicted': round(float(p), 4)}
            for a, p in zip(y_test.values[:n_s], y_pred[:n_s])
        ]

except Exception as e:
    import traceback
    result = {'error': str(e), 'traceback': traceback.format_exc()}

with open('/tmp/ml_result.json', 'w') as f:
    json.dump(result, f)
print(json.dumps(result, indent=2))
"""

# ─── NOTEBOOK 2: Linear Regression ───────────────────────────────────────────

LR_PARAMS = """
dataset_url = ""
dataset_base64 = ""
target_column = ""
test_size = 0.2
regularization = "none"
alpha = 1.0
"""

LR_CODE = """
import pandas as pd
import numpy as np
import json, io, base64, warnings
warnings.filterwarnings('ignore')
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

result = {}
try:
    # ── Load data ──────────────────────────────────────────────────────────────
    if dataset_url:
        ext = dataset_url.split('.')[-1].lower()
        df = (pd.read_excel(dataset_url) if ext in ['xlsx', 'xls']
              else pd.read_json(dataset_url) if ext == 'json'
              else pd.read_csv(dataset_url))
    elif dataset_base64:
        raw = base64.b64decode(dataset_base64)
        try:
            df = pd.read_csv(io.BytesIO(raw))
        except Exception:
            df = pd.read_excel(io.BytesIO(raw))
    else:
        from sklearn.datasets import load_diabetes
        diab = load_diabetes()
        df = pd.DataFrame(diab.data, columns=diab.feature_names)
        df['target'] = diab.target
        if not target_column:
            target_column = 'target'

    tgt = target_column if target_column else df.columns[-1]
    if tgt not in df.columns:
        raise ValueError(f"Target column '{tgt}' not found. Available: {list(df.columns)}")

    # ── Preprocessing ──────────────────────────────────────────────────────────
    df = df.dropna(subset=[tgt]).copy()
    for col in df.columns:
        if df[col].dtype == 'object':
            m = df[col].mode()
            df[col] = df[col].fillna(m[0] if len(m) > 0 else 'missing')
        else:
            df[col] = df[col].fillna(df[col].median())
    for col in df.select_dtypes(include='object').columns:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))

    X = df.drop(columns=[tgt])
    y = df[tgt]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=float(test_size), random_state=42)

    # ── Train ──────────────────────────────────────────────────────────────────
    reg = str(regularization).lower() if regularization else 'none'
    if reg == 'ridge':
        model = Ridge(alpha=float(alpha))
    elif reg == 'lasso':
        model = Lasso(alpha=float(alpha), max_iter=10000)
    else:
        model = LinearRegression()
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    mse = float(mean_squared_error(y_test, y_pred))
    result = {
        'algorithm': 'linear_regression',
        'regularization': reg,
        'metrics': {
            'r2_score': round(float(r2_score(y_test, y_pred)), 4),
            'rmse':     round(float(np.sqrt(mse)), 4),
            'mae':      round(float(mean_absolute_error(y_test, y_pred)), 4),
            'mse':      round(mse, 4),
        }
    }

    coeffs = model.coef_.tolist() if hasattr(model.coef_, 'tolist') else list(model.coef_)
    result['coefficients'] = [
        {'feature': col, 'coefficient': round(float(c), 4)}
        for col, c in zip(X.columns.tolist(), coeffs)
    ]

    n_s = min(50, len(y_test))
    result['predicted_vs_actual'] = [
        {'actual': round(float(a), 4), 'predicted': round(float(p), 4)}
        for a, p in zip(y_test.values[:n_s], y_pred[:n_s])
    ]

except Exception as e:
    import traceback
    result = {'error': str(e), 'traceback': traceback.format_exc()}

with open('/tmp/ml_result.json', 'w') as f:
    json.dump(result, f)
print(json.dumps(result, indent=2))
"""

# ─── NOTEBOOK 3: KMeans Clustering ───────────────────────────────────────────

KM_PARAMS = """
dataset_url = ""
dataset_base64 = ""
n_clusters = 3
max_clusters = 10
"""

KM_CODE = """
import pandas as pd
import numpy as np
import json, io, base64, warnings
warnings.filterwarnings('ignore')
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score

result = {}
try:
    # ── Load data ──────────────────────────────────────────────────────────────
    if dataset_url:
        ext = dataset_url.split('.')[-1].lower()
        df = (pd.read_excel(dataset_url) if ext in ['xlsx', 'xls']
              else pd.read_json(dataset_url) if ext == 'json'
              else pd.read_csv(dataset_url))
    elif dataset_base64:
        raw = base64.b64decode(dataset_base64)
        try:
            df = pd.read_csv(io.BytesIO(raw))
        except Exception:
            df = pd.read_excel(io.BytesIO(raw))
    else:
        from sklearn.datasets import make_blobs
        X_demo, _ = make_blobs(n_samples=200, centers=3, random_state=42)
        df = pd.DataFrame(X_demo, columns=['feature_1', 'feature_2'])

    # ── Keep numeric only ──────────────────────────────────────────────────────
    df_num = df.select_dtypes(include=[np.number]).dropna()
    if df_num.shape[1] < 2:
        raise ValueError('Need at least 2 numeric columns for clustering')

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(df_num)

    # ── Elbow method ───────────────────────────────────────────────────────────
    k_max = min(int(max_clusters), len(X_scaled) - 1, 15)
    elbow_data = []
    for k in range(2, k_max + 1):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        km.fit(X_scaled)
        elbow_data.append({'k': k, 'inertia': round(float(km.inertia_), 4)})

    # ── Final clustering ───────────────────────────────────────────────────────
    k = int(n_clusters)
    km_final = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = km_final.fit_predict(X_scaled)

    sil = float(silhouette_score(X_scaled, labels)) if k > 1 and len(set(labels)) > 1 else 0.0

    # ── PCA 2D for plot ────────────────────────────────────────────────────────
    pca = PCA(n_components=2)
    X_2d = pca.fit_transform(X_scaled)
    n_plot = min(200, len(X_2d))
    cluster_plot = [
        {'x': round(float(X_2d[i, 0]), 4), 'y': round(float(X_2d[i, 1]), 4), 'cluster': int(labels[i])}
        for i in range(n_plot)
    ]

    unique, counts = np.unique(labels, return_counts=True)
    cluster_sizes = [{'cluster': int(c), 'count': int(cnt)} for c, cnt in zip(unique, counts)]

    result = {
        'algorithm': 'kmeans',
        'n_clusters': k,
        'metrics': {
            'inertia': round(float(km_final.inertia_), 4),
            'silhouette_score': round(sil, 4),
        },
        'elbow_data': elbow_data,
        'cluster_plot': cluster_plot,
        'cluster_sizes': cluster_sizes,
    }

except Exception as e:
    import traceback
    result = {'error': str(e), 'traceback': traceback.format_exc()}

with open('/tmp/ml_result.json', 'w') as f:
    json.dump(result, f)
print(json.dumps(result, indent=2))
"""

# ─── NOTEBOOK 4: PCA Analysis ────────────────────────────────────────────────

PCA_PARAMS = """
dataset_url = ""
dataset_base64 = ""
n_components = 2
target_column = ""
"""

PCA_CODE = """
import pandas as pd
import numpy as np
import json, io, base64, warnings
warnings.filterwarnings('ignore')
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler, LabelEncoder

result = {}
try:
    # ── Load data ──────────────────────────────────────────────────────────────
    if dataset_url:
        ext = dataset_url.split('.')[-1].lower()
        df = (pd.read_excel(dataset_url) if ext in ['xlsx', 'xls']
              else pd.read_json(dataset_url) if ext == 'json'
              else pd.read_csv(dataset_url))
    elif dataset_base64:
        raw = base64.b64decode(dataset_base64)
        try:
            df = pd.read_csv(io.BytesIO(raw))
        except Exception:
            df = pd.read_excel(io.BytesIO(raw))
    else:
        from sklearn.datasets import load_iris
        iris = load_iris()
        df = pd.DataFrame(iris.data, columns=iris.feature_names)
        df['species'] = [iris.target_names[t] for t in iris.target]
        if not target_column:
            target_column = 'species'

    # ── Separate label column ──────────────────────────────────────────────────
    label_series = None
    if target_column and target_column in df.columns:
        label_series = df[target_column].astype(str)
        df_features = df.drop(columns=[target_column])
    else:
        df_features = df.copy()

    df_num = df_features.select_dtypes(include=[np.number])
    df_num = df_num.fillna(df_num.median())
    if df_num.shape[1] < 2:
        raise ValueError('Need at least 2 numeric columns for PCA')

    n_comp = min(int(n_components), df_num.shape[1], df_num.shape[0])

    # ── Run PCA ────────────────────────────────────────────────────────────────
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(df_num)
    pca = PCA(n_components=n_comp)
    X_pca = pca.fit_transform(X_scaled)

    exp_var = [round(float(v), 4) for v in pca.explained_variance_ratio_]
    cum_var = [round(float(v), 4) for v in np.cumsum(pca.explained_variance_ratio_)]

    n_plot = min(200, len(X_pca))
    pc1 = X_pca[:n_plot, 0]
    pc2 = X_pca[:n_plot, 1] if n_comp > 1 else np.zeros(n_plot)

    if label_series is not None:
        labels_arr = label_series.values[:n_plot]
        components_plot = [
            {'pc1': round(float(pc1[i]), 4), 'pc2': round(float(pc2[i]), 4), 'label': str(labels_arr[i])}
            for i in range(n_plot)
        ]
    else:
        components_plot = [
            {'pc1': round(float(pc1[i]), 4), 'pc2': round(float(pc2[i]), 4), 'label': ''}
            for i in range(n_plot)
        ]

    loadings = []
    for j, feat in enumerate(df_num.columns):
        entry = {'feature': str(feat), 'pc1': round(float(pca.components_[0, j]), 4)}
        if n_comp > 1:
            entry['pc2'] = round(float(pca.components_[1, j]), 4)
        loadings.append(entry)

    result = {
        'algorithm': 'pca',
        'n_components': n_comp,
        'explained_variance': exp_var,
        'cumulative_variance': cum_var,
        'components_plot': components_plot,
        'loadings': loadings,
    }

except Exception as e:
    import traceback
    result = {'error': str(e), 'traceback': traceback.format_exc()}

with open('/tmp/ml_result.json', 'w') as f:
    json.dump(result, f)
print(json.dumps(result, indent=2))
"""

# ─── NOTEBOOK 5: CNN Classifier ───────────────────────────────────────────────

CNN_PARAMS = """
dataset_url = ""
dataset_base64 = ""
num_classes = 2
epochs = 5
img_size = 64
"""

CNN_CODE = """
import json, io, base64, warnings, os
warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import numpy as np

result = {}
try:
    # ── Check required deps ────────────────────────────────────────────────────
    try:
        from PIL import Image
        import tensorflow as tf
        tf.get_logger().setLevel('ERROR')
    except ImportError as e:
        raise ImportError(f"Missing dependency: {e}. Run: pip install pillow tensorflow")

    img_sz = int(img_size)
    n_cls = int(num_classes)
    n_epochs = int(epochs)

    # ── Image loaders ──────────────────────────────────────────────────────────
    def load_from_zip(zip_bytes):
        import zipfile
        zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
        images, labels, class_names = [], [], []
        for name in sorted(zf.namelist()):
            low = name.lower()
            if not any(low.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']):
                continue
            parts = [p for p in name.replace('\\\\', '/').split('/') if p and not p.startswith('.')]
            if len(parts) < 2:
                continue
            cls = parts[-2]
            if cls not in class_names:
                class_names.append(cls)
            lbl = class_names.index(cls)
            try:
                img = Image.open(io.BytesIO(zf.read(name))).convert('RGB')
                img = img.resize((img_sz, img_sz))
                images.append(np.array(img, dtype=np.float32) / 255.0)
                labels.append(lbl)
            except Exception:
                continue
        return np.array(images), np.array(labels), class_names

    # ── Load or generate data ──────────────────────────────────────────────────
    raw_data = None
    if dataset_url:
        import urllib.request
        with urllib.request.urlopen(dataset_url, timeout=30) as r:
            raw_data = r.read()
    elif dataset_base64:
        raw_data = base64.b64decode(dataset_base64)

    X, y, class_names = None, None, None
    if raw_data:
        try:
            X, y, class_names = load_from_zip(raw_data)
        except Exception:
            pass

    if X is None or len(X) == 0:
        # Synthetic demo dataset
        np.random.seed(42)
        n_demo = max(40, n_cls * 20)
        X = np.random.rand(n_demo, img_sz, img_sz, 3).astype(np.float32)
        y = np.repeat(np.arange(n_cls), n_demo // n_cls)[:n_demo]
        class_names = [f'class_{i}' for i in range(n_cls)]

    actual_cls = max(n_cls, len(class_names))
    class_names = (class_names + [f'class_{i}' for i in range(len(class_names), actual_cls)])[:actual_cls]

    # ── Build CNN ──────────────────────────────────────────────────────────────
    split = int(len(X) * 0.8)
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]

    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(img_sz, img_sz, 3)),
        tf.keras.layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.MaxPooling2D(2, 2),
        tf.keras.layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.MaxPooling2D(2, 2),
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(actual_cls, activation='softmax'),
    ])
    model.compile(optimizer='adam',
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])

    hist_obj = model.fit(X_train, y_train,
                         epochs=n_epochs,
                         validation_data=(X_val, y_val),
                         verbose=0,
                         batch_size=16)
    h = hist_obj.history

    training_history = [
        {
            'epoch':        i + 1,
            'accuracy':     round(float(h['accuracy'][i]), 4),
            'val_accuracy': round(float(h['val_accuracy'][i]), 4),
            'loss':         round(float(h['loss'][i]), 4),
            'val_loss':     round(float(h['val_loss'][i]), 4),
        }
        for i in range(len(h['accuracy']))
    ]

    n_s = min(10, len(X_val))
    preds = model.predict(X_val[:n_s], verbose=0)
    pred_cls = np.argmax(preds, axis=1)
    sample_preds = [
        {
            'image_index': i,
            'actual':      class_names[int(y_val[i])] if int(y_val[i]) < len(class_names) else str(int(y_val[i])),
            'predicted':   class_names[int(pred_cls[i])] if int(pred_cls[i]) < len(class_names) else str(int(pred_cls[i])),
            'confidence':  round(float(preds[i][pred_cls[i]]), 4),
        }
        for i in range(n_s)
    ]

    result = {
        'algorithm': 'cnn',
        'num_classes': actual_cls,
        'metrics': {
            'accuracy':     round(float(h['accuracy'][-1]), 4),
            'val_accuracy': round(float(h['val_accuracy'][-1]), 4),
            'loss':         round(float(h['loss'][-1]), 4),
            'val_loss':     round(float(h['val_loss'][-1]), 4),
        },
        'training_history': training_history,
        'class_names': class_names,
        'sample_predictions': sample_preds,
    }

except Exception as e:
    import traceback
    result = {'error': str(e), 'traceback': traceback.format_exc()}

with open('/tmp/ml_result.json', 'w') as f:
    json.dump(result, f)
print(json.dumps(result, indent=2))
"""

# ─── Generate all notebooks ───────────────────────────────────────────────────

NOTEBOOKS = {
    "random_forest":    (RF_PARAMS,  RF_CODE),
    "linear_regression":(LR_PARAMS,  LR_CODE),
    "kmeans_clustering":(KM_PARAMS,  KM_CODE),
    "pca_analysis":     (PCA_PARAMS, PCA_CODE),
    "cnn_classifier":   (CNN_PARAMS, CNN_CODE),
}

for name, (params_src, code_src) in NOTEBOOKS.items():
    nb = make_notebook(params_src, code_src, name)
    path = os.path.join(NOTEBOOKS_DIR, f"{name}.ipynb")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(nb, f, indent=1, ensure_ascii=False)
    print(f"Created: {path}")

print("\nAll 5 notebooks created successfully.")
