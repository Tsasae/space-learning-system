import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Ensure quiz_submissions table ─────────────────────────────────────────────
pool.query(`
  CREATE TABLE IF NOT EXISTS quiz_submissions (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    course_id INTEGER,
    answers JSONB DEFAULT '[]',
    score NUMERIC,
    passed BOOLEAN DEFAULT false,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
  )
`).catch((err) => console.error('[instructor] quiz_submissions init error:', err));

// ── GET /api/instructor/students ──────────────────────────────────────────────
// Returns all students with their progress and latest submission info
router.get('/students', async (_req: Request, res: Response) => {
  try {
    const studentsResult = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM users u
       WHERE u.role = 'student'
       ORDER BY u.name`
    );

    const students = await Promise.all(
      studentsResult.rows.map(async (u) => {
        // Progress
        const progResult = await pool.query(
          `SELECT COUNT(*) AS completed FROM course_progress WHERE student_id = $1 AND certificate_issued = true`,
          [u.id]
        );
        const completed = Number(progResult.rows[0]?.completed ?? 0);
        const progress = Math.min(100, Math.round((completed / 3) * 100));

        // Latest submission
        const subResult = await pool.query(
          `SELECT s.id, s.accuracy, s.result_output as notes, s.submitted_at,
                  f.grade, f.comment as feedback
           FROM submissions s
           LEFT JOIN feedback f ON f.student_id = s.student_id
           WHERE s.student_id = $1
           ORDER BY s.submitted_at DESC`,
          [u.id]
        );

        const submissions = subResult.rows.map((r) => ({
          id: r.id,
          accuracy: r.accuracy ? `${Number(r.accuracy).toFixed(2)}%` : '-',
          notes: r.notes ?? '',
          submittedAt: (r.submitted_at ?? '').toString().slice(0, 10),
          grade: r.grade ?? undefined,
          feedback: r.feedback ?? undefined,
        }));

        const latestAcc = submissions[0]?.accuracy ?? '-';
        const status =
          submissions.length > 0 ? 'submitted'
          : progress > 0 ? 'in_progress'
          : 'not_started';

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          case_label: 'Case 1',
          progress,
          accuracy: latestAcc,
          status,
          submissions,
        };
      })
    );

    res.json({ success: true, students });
  } catch (err) {
    console.error('[instructor] students error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// ── GET /api/instructor/submissions ──────────────────────────────────────────
router.get('/submissions', async (_req: Request, res: Response) => {
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
    console.error('[instructor] submissions error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// ── POST /api/instructor/approve ──────────────────────────────────────────────
router.post('/approve', async (req: Request, res: Response) => {
  try {
    const { submission_id, instructor_id } = req.body;
    await pool.query(
      `INSERT INTO feedback (instructor_id, student_id, grade, comment)
       SELECT $1, student_id, 100, 'Батлагдлаа'
       FROM submissions WHERE id = $2
       ON CONFLICT DO NOTHING`,
      [instructor_id, submission_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[instructor] approve error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// ── POST /api/quiz — create quiz ──────────────────────────────────────────────
router.post('/quiz', async (req: Request, res: Response) => {
  try {
    const { course_id, questions, pass_threshold, time_limit } = req.body;

    await pool.query(
      `UPDATE courses
       SET quiz = $1
       WHERE id = $2`,
      [JSON.stringify({ questions, pass_threshold, time_limit }), course_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[instructor] quiz create error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// ── GET /api/instructor/quiz/:courseId ────────────────────────────────────────
router.get('/quiz/:courseId', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT quiz FROM courses WHERE id = $1',
      [req.params.courseId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Олдсонгүй' });
    }
    res.json({ success: true, quiz: result.rows[0].quiz });
  } catch (err) {
    console.error('[instructor] quiz get error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// ── POST /api/instructor/quiz/submit ─────────────────────────────────────────
router.post('/quiz/submit', async (req: Request, res: Response) => {
  try {
    const { student_id, course_id, answers, score } = req.body;
    const passed = score >= 75;

    const result = await pool.query(
      `INSERT INTO quiz_submissions (student_id, course_id, answers, score, passed)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [student_id, course_id, JSON.stringify(answers), score, passed]
    );

    res.json({ success: true, result: result.rows[0] });
  } catch (err) {
    console.error('[instructor] quiz submit error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// ── GET /api/instructor/courses ───────────────────────────────────────────────
// Returns courses created by logged-in instructor with student count + avg score
router.get('/courses', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        (SELECT COUNT(DISTINCT cp.student_id) FROM course_progress cp WHERE cp.course_id = c.id) AS student_count,
        0 AS avg_score,
        (SELECT COUNT(*) FROM submissions s WHERE s.exercise_type IS NOT NULL) AS submission_count
       FROM courses c
       WHERE c.published = true
       ORDER BY c.created_at DESC`
    );
    res.json({ success: true, courses: result.rows });
  } catch (err) {
    console.error('[instructor] courses list error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// ── GET /api/instructor/courses/:id ──────────────────────────────────────────
router.get('/courses/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Олдсонгүй' });
    }
    res.json({ success: true, course: result.rows[0] });
  } catch (err) {
    console.error('[instructor] course get error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// ── PUT /api/instructor/courses/:id ──────────────────────────────────────────
router.put('/courses/:id', async (req: Request, res: Response) => {
  try {
    const { title, description, parts, assignment, quiz } = req.body;
    const result = await pool.query(
      `UPDATE courses
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           parts = COALESCE($3, parts),
           assignment = COALESCE($4, assignment),
           quiz = COALESCE($5, quiz)
       WHERE id = $6
       RETURNING *`,
      [
        title, description,
        parts ? JSON.stringify(parts) : null,
        assignment ? JSON.stringify(assignment) : null,
        quiz ? JSON.stringify(quiz) : null,
        req.params.id,
      ]
    );
    res.json({ success: true, course: result.rows[0] });
  } catch (err) {
    console.error('[instructor] course update error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// ── PATCH /api/instructor/courses/:id — update status ────────────────────────
router.patch('/courses/:id', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const published = status === 'published';
    await pool.query('UPDATE courses SET published = $1 WHERE id = $2', [published, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// ── DELETE /api/instructor/courses/:id — soft delete ─────────────────────────
router.delete('/courses/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('UPDATE courses SET published = false WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[instructor] course delete error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// ── GET /api/instructor/courses/:id/students ──────────────────────────────────
router.get('/courses/:id/students', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email,
              COUNT(cp.id) as completed_parts,
              MAX(s.accuracy) as best_accuracy,
              MAX(f.grade) as grade
       FROM users u
       LEFT JOIN course_progress cp ON cp.student_id = u.id::text
       LEFT JOIN submissions s ON s.student_id = u.id
       LEFT JOIN feedback f ON f.student_id = u.id
       WHERE u.role = 'student'
       GROUP BY u.id, u.name, u.email
       ORDER BY u.name`
    );
    res.json({ success: true, students: result.rows });
  } catch (err) {
    console.error('[instructor] course students error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

export default router;
