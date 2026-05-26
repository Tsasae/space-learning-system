"""
ml_runner.py — runs a named ML notebook via papermill.
Called by the Express /api/ml/analyze endpoint via stdin JSON.

Usage (stdin):
  echo '{"algorithm": "random_forest", "params": {...}}' | python3 backend/ml_runner.py

Supported algorithms: random_forest, linear_regression, kmeans, pca, cnn
"""
import json
import os
import sys
import traceback

import papermill as pm

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESULT_PATH = "/tmp/ml_result.json"

NOTEBOOK_MAP = {
    "random_forest":    os.path.join(BASE_DIR, "notebooks", "random_forest.ipynb"),
    "linear_regression":os.path.join(BASE_DIR, "notebooks", "linear_regression.ipynb"),
    "kmeans":           os.path.join(BASE_DIR, "notebooks", "kmeans_clustering.ipynb"),
    "pca":              os.path.join(BASE_DIR, "notebooks", "pca_analysis.ipynb"),
    "cnn":              os.path.join(BASE_DIR, "notebooks", "cnn_classifier.ipynb"),
}


def run_notebook(algorithm: str, params: dict) -> dict:
    notebook_path = NOTEBOOK_MAP.get(algorithm)
    if not notebook_path:
        return {"error": f"Unknown algorithm '{algorithm}'. Valid: {list(NOTEBOOK_MAP.keys())}"}
    if not os.path.exists(notebook_path):
        return {"error": f"Notebook not found: {notebook_path}. Run create_notebooks.py first."}

    output_path = f"/tmp/output_{algorithm}.ipynb"

    # Remove stale result from a previous run
    if os.path.exists(RESULT_PATH):
        os.remove(RESULT_PATH)

    try:
        pm.execute_notebook(
            notebook_path,
            output_path,
            parameters=params,
            kernel_name="python3",
            log_output=False,
            progress_bar=False,
        )
    except Exception as e:
        # Even when papermill raises, the notebook may have saved a partial result
        if not os.path.exists(RESULT_PATH):
            return {"error": str(e), "traceback": traceback.format_exc()}

    if os.path.exists(RESULT_PATH):
        try:
            with open(RESULT_PATH, "r") as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            return {"error": f"Result file is not valid JSON: {e}"}

    return {"error": "Notebook ran but produced no /tmp/ml_result.json"}


if __name__ == "__main__":
    try:
        payload = json.loads(sys.stdin.read())
        algorithm = payload.get("algorithm", "")
        params    = payload.get("params", {})
        result    = run_notebook(algorithm, params)
    except Exception as e:
        result = {"error": str(e), "traceback": traceback.format_exc()}

    print(json.dumps(result))
