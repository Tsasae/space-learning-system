import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Init tables ────────────────────────────────────────────────────────────────
pool.query(`
  CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    exercise_type TEXT,
    notebook_content TEXT,
    result_output TEXT,
    accuracy DECIMAL(5,2),
    submitted_at TIMESTAMPTZ DEFAULT NOW()
  )
`).catch((err) => console.error('[submissions] table init error:', err));

pool.query(`
  CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER,
    student_id TEXT NOT NULL,
    grade DECIMAL(5,2),
    comment TEXT,
    material_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`).catch((err) => console.error('[submissions] feedback table init error:', err));

// Дасгал submit хийх
router.post('/', async (req: Request, res: Response) => {
  try {
    const { student_id, exercise_type, notebook_content, result_output, accuracy } = req.body;

    const result = await pool.query(
      `INSERT INTO submissions (student_id, exercise_type, notebook_content, result_output, accuracy)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [student_id, exercise_type, notebook_content, result_output, accuracy]
    );

    res.json({ success: true, submission: result.rows[0] });
  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ success: false, error: 'Submit алдаа' });
  }
});

// Student-ийн submissions харах
router.get('/student/:student_id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name as student_name,
              f.grade, f.comment as feedback_comment, f.created_at as feedback_date,
              u2.name as instructor_name
       FROM submissions s
       LEFT JOIN users u ON s.student_id = u.id
       LEFT JOIN feedback f ON f.student_id = s.student_id
       LEFT JOIN users u2 ON f.instructor_id = u2.id
       WHERE s.student_id = $1
       ORDER BY s.submitted_at DESC`,
      [req.params.student_id]
    );
    res.json({ success: true, submissions: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// Instructor бүх submissions харах
router.get('/all', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name as student_name, u.email as student_email,
              f.grade, f.comment as feedback_comment
       FROM submissions s
       LEFT JOIN users u ON s.student_id = u.id
       LEFT JOIN feedback f ON f.student_id = s.student_id
       ORDER BY s.submitted_at DESC`
    );
    res.json({ success: true, submissions: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// Progress хадгалах
router.post('/progress', async (req: Request, res: Response) => {
  try {
    const { student_id, part_number, part_title } = req.body;

    await pool.query(
      `INSERT INTO student_progress (student_id, part_number, part_title, completed, completed_at)
       VALUES ($1, $2, $3, true, NOW())
       ON CONFLICT (student_id, part_number) DO UPDATE SET completed = true, completed_at = NOW()`,
      [student_id, part_number, part_title]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Progress алдаа' });
  }
});

// Progress авах
router.get('/progress/:student_id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM student_progress WHERE student_id = $1 ORDER BY part_number`,
      [req.params.student_id]
    );
    res.json({ success: true, progress: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

export default router;
