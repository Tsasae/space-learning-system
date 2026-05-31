import sys, json, io, base64, os, uuid
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, r2_score, mean_squared_error
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import silhouette_score

# ── Сурсан загваруудыг хадгалах хавтас (predict-д дахин ачаална) ────────────────
MODEL_DIR = os.environ.get('ML_MODEL_DIR', '/tmp/ml_models')
os.makedirs(MODEL_DIR, exist_ok=True)


def save_model(model, feature_names, task_type):
    """Сурсан загварыг диск рүү хадгалж, model_id буцаана."""
    model_id = str(uuid.uuid4())
    joblib.dump(
        {'model': model, 'features': list(feature_names), 'task_type': task_type},
        os.path.join(MODEL_DIR, f'{model_id}.joblib'),
    )
    return model_id


def load_data(params):
    url = params.get('dataset_url', '')
    b64 = params.get('dataset_base64', '')
    if url:
        return pd.read_csv(url)
    elif b64:
        return pd.read_csv(io.BytesIO(base64.b64decode(b64)))
    else:
        from sklearn.datasets import load_iris
        iris = load_iris()
        df = pd.DataFrame(iris.data, columns=iris.feature_names)
        df['target'] = iris.target
        return df


def preprocess(df):
    for col in df.columns:
        if df[col].dtype in ['float64', 'int64', 'float32', 'int32']:
            df[col] = df[col].fillna(df[col].median())
        else:
            mode = df[col].mode()
            df[col] = df[col].fillna(mode[0] if len(mode) > 0 else 'unknown')
    le = LabelEncoder()
    for col in df.select_dtypes(include='object').columns:
        df[col] = le.fit_transform(df[col].astype(str))
    return df


payload = json.loads(sys.stdin.read())

# ════════════════════════════════════════════════════════════════════════════════
# PREDICT MODE — сурсан загвараар шинэ өгөгдөл дээр прогноз гаргах
# payload = { "mode": "predict", "model_id": "...", "features": {col: value, ...} }
# ════════════════════════════════════════════════════════════════════════════════
if payload.get('mode') == 'predict':
    model_id = payload.get('model_id', '')
    feats = payload.get('features', {})
    model_path = os.path.join(MODEL_DIR, f'{model_id}.joblib')

    if not model_id or not os.path.exists(model_path):
        print(json.dumps({'error': 'Загвар олдсонгүй. Эхлээд сургалт явуулна уу.'}))
        sys.exit(0)

    bundle = joblib.load(model_path)
    model = bundle['model']
    columns = bundle['features']
    task_type = bundle.get('task_type', 'classification')

    try:
        row = [float(feats[c]) for c in columns]
    except (KeyError, ValueError, TypeError) as e:
        print(json.dumps({'error': f'Feature утга дутуу/буруу байна: {e}'}))
        sys.exit(0)

    X = pd.DataFrame([row], columns=columns)
    pred = model.predict(X)[0]

    out = {
        'mode': 'predict',
        'task_type': task_type,
        'prediction': round(float(pred), 4) if task_type == 'regression' else int(pred),
        'feature_names': columns,
    }

    # Ангиллын хувьд анги тус бүрийн магадлал
    if task_type == 'classification' and hasattr(model, 'predict_proba'):
        proba = model.predict_proba(X)[0]
        classes = model.classes_
        out['probabilities'] = [
            {'class': int(c), 'probability': round(float(p), 4)}
            for c, p in zip(classes, proba)
        ]

    print(json.dumps(out))
    sys.exit(0)

# ════════════════════════════════════════════════════════════════════════════════
# TRAIN MODE (анхдагч) — өмнөх үйлдэл хэвээр, дээр нь загвар хадгалалт нэмэгдсэн
# ════════════════════════════════════════════════════════════════════════════════
algorithm = payload['algorithm']
params = payload.get('params', {})
target_column = params.get('target_column', '')

df = load_data(params)
df = preprocess(df)

result = {}

if algorithm == 'random_forest':
    if target_column and target_column in df.columns:
        X = df.drop(columns=[target_column])
        y = df[target_column]
    else:
        X = df.iloc[:, :-1]
        y = df.iloc[:, -1]
        target_column = df.columns[-1]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    if y.nunique() <= 10:
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        result = {
            'algorithm': 'random_forest',
            'task_type': 'classification',
            'metrics': {
                'accuracy': round(float(accuracy_score(y_test, y_pred)), 4),
                'precision': round(float(precision_score(y_test, y_pred, average='weighted', zero_division=0)), 4),
                'recall': round(float(recall_score(y_test, y_pred, average='weighted', zero_division=0)), 4),
                'f1_score': round(float(f1_score(y_test, y_pred, average='weighted', zero_division=0)), 4),
            },
            'feature_importance': sorted([
                {'feature': col, 'importance': round(float(imp), 4)}
                for col, imp in zip(X.columns, model.feature_importances_)
            ], key=lambda x: -x['importance'])[:10],
        }
        # ── ШИНЭ: загвар хадгалах → prediction боломжтой болгох ──
        result['model_id'] = save_model(model, X.columns, 'classification')
        result['feature_names'] = list(X.columns)
    else:
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        result = {
            'algorithm': 'random_forest',
            'task_type': 'regression',
            'metrics': {
                'r2_score': round(float(r2_score(y_test, y_pred)), 4),
                'rmse': round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 4),
                'mae': round(float(np.mean(np.abs(y_test.values - y_pred))), 4),
            },
            'feature_importance': sorted([
                {'feature': col, 'importance': round(float(imp), 4)}
                for col, imp in zip(X.columns, model.feature_importances_)
            ], key=lambda x: -x['importance'])[:10],
        }
        # ── ШИНЭ: загвар хадгалах ──
        result['model_id'] = save_model(model, X.columns, 'regression')
        result['feature_names'] = list(X.columns)

elif algorithm == 'linear_regression':
    if target_column and target_column in df.columns:
        X = df.drop(columns=[target_column])
        y = df[target_column]
    else:
        X = df.iloc[:, :-1]
        y = df.iloc[:, -1]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = LinearRegression()
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    result = {
        'algorithm': 'linear_regression',
        'metrics': {
            'r2_score': round(float(r2_score(y_test, y_pred)), 4),
            'rmse': round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 4),
            'mae': round(float(np.mean(np.abs(y_test.values - y_pred))), 4),
        },
        'coefficients': [
            {'feature': col, 'coefficient': round(float(c), 4)}
            for col, c in zip(X.columns, model.coef_)
        ][:10],
        'predicted_vs_actual': [
            {'actual': round(float(a), 2), 'predicted': round(float(p), 2)}
            for a, p in zip(list(y_test)[:50], list(y_pred)[:50])
        ]
    }
    # ── ШИНЭ: загвар хадгалах ──
    result['model_id'] = save_model(model, X.columns, 'regression')
    result['feature_names'] = list(X.columns)

elif algorithm == 'kmeans':
    X = df.select_dtypes(include=[np.number])
    X_scaled = StandardScaler().fit_transform(X)
    n_clusters = int(params.get('n_clusters', 3))
    elbow = []
    for k in range(2, min(11, len(X))):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        km.fit(X_scaled)
        elbow.append({'k': k, 'inertia': round(float(km.inertia_), 2)})
    model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = model.fit_predict(X_scaled)
    sil = silhouette_score(X_scaled, labels) if n_clusters > 1 else 0
    pca2 = PCA(n_components=2)
    coords = pca2.fit_transform(X_scaled)
    unique, counts = np.unique(labels, return_counts=True)
    result = {
        'algorithm': 'kmeans',
        'n_clusters': n_clusters,
        'metrics': {
            'inertia': round(float(model.inertia_), 2),
            'silhouette_score': round(float(sil), 4)
        },
        'elbow_data': elbow,
        'cluster_plot': [
            {'x': round(float(coords[i, 0]), 3), 'y': round(float(coords[i, 1]), 3), 'cluster': int(labels[i])}
            for i in range(min(200, len(coords)))
        ],
        'cluster_sizes': [
            {'cluster': int(c), 'count': int(n)} for c, n in zip(unique, counts)
        ]
    }

elif algorithm == 'pca':
    X = df.select_dtypes(include=[np.number])
    X_scaled = StandardScaler().fit_transform(X)
    n_components = min(int(params.get('n_components', 2)), X.shape[1])
    model = PCA(n_components=n_components)
    coords = model.fit_transform(X_scaled)
    result = {
        'algorithm': 'pca',
        'n_components': n_components,
        'metrics': {
            'explained_variance': [round(float(v), 4) for v in model.explained_variance_ratio_],
            'cumulative_variance': round(float(sum(model.explained_variance_ratio_)), 4)
        },
        'components_plot': [
            {'pc1': round(float(coords[i, 0]), 3), 'pc2': round(float(coords[i, 1]), 3) if n_components > 1 else 0}
            for i in range(min(200, len(coords)))
        ],
        'loadings': [
            {'feature': col, 'pc1': round(float(model.components_[0, j]), 4)}
            for j, col in enumerate(X.columns)
        ]
    }

print(json.dumps(result))
