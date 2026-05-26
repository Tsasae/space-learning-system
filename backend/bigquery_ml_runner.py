import sys, json, os
import pandas as pd
from google.cloud import bigquery
import uuid

payload = json.loads(sys.stdin.read())
algorithm = payload['algorithm']
params = payload.get('params', {})
dataset_url = params.get('dataset_url', '')
target_column = params.get('target_column', '')

PROJECT_ID = os.environ.get('BIGQUERY_PROJECT_ID', 'lunar-lms-project')
DATASET_ID = os.environ.get('BIGQUERY_DATASET_ID', 'ml_models')
TABLE_ID = f"temp_data_{uuid.uuid4().hex[:8]}"
MODEL_ID = f"temp_model_{uuid.uuid4().hex[:8]}"

client = bigquery.Client(project=PROJECT_ID)

# Load data
df = pd.read_csv(dataset_url)
if len(df) > 100000:
    df = df.sample(n=100000, random_state=42)

# Preprocessing — dtype-aware fillna
for col in df.columns:
    if df[col].dtype in ['float64', 'int64', 'float32', 'int32']:
        df[col] = df[col].fillna(df[col].median())
    else:
        mode = df[col].mode()
        df[col] = df[col].fillna(mode[0] if len(mode) > 0 else 'unknown')

# Upload to BigQuery temp table
table_ref = f"{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}"
job = client.load_table_from_dataframe(df, table_ref)
job.result()

algorithm_map = {
    'random_forest':    'RANDOM_FOREST_CLASSIFIER',
    'linear_regression':'LINEAR_REG',
    'kmeans':           'KMEANS',
    'pca':              'PCA',
}
bq_model_type = algorithm_map.get(algorithm, 'RANDOM_FOREST_CLASSIFIER')

n_unique = df[target_column].nunique() if target_column and target_column in df.columns else 0
if algorithm == 'random_forest' and n_unique > 10:
    bq_model_type = 'RANDOM_FOREST_REGRESSOR'

model_ref = f"{PROJECT_ID}.{DATASET_ID}.{MODEL_ID}"
feature_cols = ', '.join(df.columns)

if algorithm in ['kmeans', 'pca']:
    create_query = f"""
    CREATE OR REPLACE MODEL `{model_ref}`
    OPTIONS (model_type='{bq_model_type}', num_clusters=3)
    AS SELECT {feature_cols}
    FROM `{table_ref}`
    """
else:
    create_query = f"""
    CREATE OR REPLACE MODEL `{model_ref}`
    OPTIONS (model_type='{bq_model_type}',
             input_label_cols=['{target_column}'])
    AS SELECT {feature_cols}
    FROM `{table_ref}`
    """

train_job = client.query(create_query)
train_job.result()

if algorithm in ['kmeans', 'pca']:
    eval_query = f"SELECT * FROM ML.EVALUATE(MODEL `{model_ref}`)"
else:
    eval_query = f"""
    SELECT * FROM ML.EVALUATE(MODEL `{model_ref}`,
    (SELECT {feature_cols} FROM `{table_ref}`))
    """

eval_results = client.query(eval_query).result()
metrics = {}
for row in eval_results:
    metrics = dict(row)

importance = []
try:
    imp_query = f"""
    SELECT * FROM ML.FEATURE_IMPORTANCE(MODEL `{model_ref}`)
    ORDER BY importance_weight DESC LIMIT 10
    """
    for row in client.query(imp_query).result():
        importance.append({
            'feature':    row.processed_input,
            'importance': round(float(row.importance_weight), 4),
        })
except Exception:
    pass

formatted_metrics = {}
for k, v in metrics.items():
    try:
        formatted_metrics[k] = round(float(v), 4)
    except Exception:
        formatted_metrics[k] = v

result = {
    'algorithm':         algorithm,
    'engine':            'BigQuery ML',
    'rows_processed':    len(df),
    'table_id':          TABLE_ID,
    'model_id':          MODEL_ID,
    'metrics':           formatted_metrics,
    'feature_importance':importance,
}

client.delete_table(table_ref, not_found_ok=True)

print(json.dumps(result))
