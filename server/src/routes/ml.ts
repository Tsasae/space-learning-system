import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const router = Router();

// Project root: server/src/routes/ → ../../.. = lms-websystem root
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const ML_RUNNER    = path.join(PROJECT_ROOT, 'backend', 'ml_runner.py');
const RESULT_PATH  = '/tmp/ml_result.json';

// Prefer project venv python so sklearn/tensorflow are available
const VENV_PYTHON = path.join(PROJECT_ROOT, '.venv', 'bin', 'python3');
const PYTHON_BIN  = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : 'python3';

const VALID_ALGORITHMS = new Set([
  'random_forest',
  'linear_regression',
  'kmeans',
  'pca',
  'cnn',
]);

// POST /api/ml/analyze
router.post('/analyze', (req: Request, res: Response) => {
  const {
    algorithm,
    dataset_url    = '',
    dataset_base64 = '',
    target_column  = '',
    params         = {},
  } = req.body;

  if (!algorithm) {
    return res.status(400).json({ success: false, error: 'algorithm is required' });
  }
  if (!VALID_ALGORITHMS.has(algorithm)) {
    return res.status(400).json({
      success: false,
      error: `Unknown algorithm '${algorithm}'. Valid: ${[...VALID_ALGORITHMS].join(', ')}`,
    });
  }

  const payload = JSON.stringify({
    algorithm,
    params: { dataset_url, dataset_base64, target_column, ...params },
  });

  // Remove stale result so we don't accidentally return an old one
  if (fs.existsSync(RESULT_PATH)) {
    try { fs.unlinkSync(RESULT_PATH); } catch (_) {}
  }

  const py = spawn(PYTHON_BIN, [ML_RUNNER], { cwd: PROJECT_ROOT });

  let stdout = '';
  let stderr = '';
  let responded = false;

  // 5-minute hard timeout (ML training can be slow)
  const timer = setTimeout(() => {
    if (!responded) {
      responded = true;
      py.kill('SIGKILL');
      res.status(504).json({ success: false, error: 'ML analysis timed out (5 min limit)' });
    }
  }, 5 * 60 * 1000);

  py.stdin.write(payload);
  py.stdin.end();

  py.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  py.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  py.on('error', (err) => {
    clearTimeout(timer);
    if (!responded) {
      responded = true;
      res.status(500).json({ success: false, error: `Failed to start Python: ${err.message}` });
    }
  });

  py.on('close', () => {
    clearTimeout(timer);
    if (responded) return;
    responded = true;

    // Prefer the result file (written inside the notebook)
    if (fs.existsSync(RESULT_PATH)) {
      try {
        const result = JSON.parse(fs.readFileSync(RESULT_PATH, 'utf8'));
        if (result.error) {
          return res.status(500).json({ success: false, ...result });
        }
        return res.json({ success: true, result });
      } catch (parseErr: any) {
        return res.status(500).json({ success: false, error: `Invalid JSON in result: ${parseErr.message}` });
      }
    }

    // Fall back to stdout (last JSON line)
    const lines = stdout.trim().split('\n').filter(Boolean);
    const lastLine = lines[lines.length - 1];
    if (lastLine) {
      try {
        const result = JSON.parse(lastLine);
        if (result.error) {
          return res.status(500).json({ success: false, ...result });
        }
        return res.json({ success: true, result });
      } catch (_) {}
    }

    return res.status(500).json({
      success: false,
      error: 'ML runner produced no output',
      stderr: stderr.slice(0, 1000),
    });
  });
});

// GET /api/ml/algorithms — list supported algorithms
router.get('/algorithms', (_req: Request, res: Response) => {
  res.json({
    success: true,
    algorithms: [
      { id: 'random_forest',    label: 'Random Forest',     task: 'classification/regression' },
      { id: 'linear_regression',label: 'Linear Regression', task: 'regression'                },
      { id: 'kmeans',           label: 'K-Means Clustering', task: 'clustering'               },
      { id: 'pca',              label: 'PCA Analysis',       task: 'dimensionality_reduction'  },
      { id: 'cnn',              label: 'CNN Classifier',     task: 'image_classification'      },
    ],
  });
});

export default router;
