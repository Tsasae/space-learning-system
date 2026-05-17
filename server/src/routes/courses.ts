import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Init tables ────────────────────────────────────────────────────────────────
pool.query(`
  CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    instructor_id TEXT,
    materials JSONB DEFAULT '{}',
    parts JSONB DEFAULT '[]',
    assignment JSONB DEFAULT '{}',
    quiz JSONB DEFAULT '{}',
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`).catch((err) => console.error('[courses] table init error:', err));

pool.query(`
  CREATE TABLE IF NOT EXISTS course_progress (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    material_viewed BOOLEAN DEFAULT false,
    exercise_submitted BOOLEAN DEFAULT false,
    exercise_accuracy DECIMAL(5,2),
    quiz_score DECIMAL(5,2),
    quiz_answers JSONB,
    certificate_issued BOOLEAN DEFAULT false,
    certificate_issued_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id)
  )
`).catch((err) => console.error('[courses] course_progress init error:', err));

// ── GET /api/courses — list all published courses ──────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.name as instructor_name,
        COUNT(DISTINCT cp.student_id) as student_count
      FROM courses c
      LEFT JOIN users u ON c.instructor_id::text = u.id::text
      LEFT JOIN course_progress cp ON c.id = cp.course_id
      WHERE c.published = true
      GROUP BY c.id, u.name
      ORDER BY c.created_at ASC
    `);
    res.json({ success: true, courses: result.rows, data: result.rows });
  } catch (err) {
    console.error('[courses] list error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// ── GET /api/courses/my-progress — courses with student progress ───────────────
// NOTE: must be defined before /:id to avoid route conflict
router.get('/my-progress', async (req: Request, res: Response) => {
  try {
    const studentId = (req.query.student_id as string) ?? '';

    const coursesResult = await pool.query(
      `SELECT * FROM courses WHERE published = true ORDER BY created_at ASC`
    );

    if (coursesResult.rows.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const courses = await Promise.all(
      coursesResult.rows.map(async (course) => {
        let progressRow: any = {};
        if (studentId) {
          const pr = await pool.query(
            `SELECT * FROM course_progress WHERE student_id = $1 AND course_id = $2`,
            [studentId, course.id]
          );
          progressRow = pr.rows[0] ?? {};
        }

        let progress = 0;
        if (progressRow.material_viewed)    progress = 25;
        if (progressRow.exercise_submitted) progress = 50;
        if (progressRow.quiz_score != null) progress = 75;
        if (progressRow.certificate_issued) progress = 100;

        return {
          ...course,
          material_viewed:    progressRow.material_viewed    ?? false,
          exercise_submitted: progressRow.exercise_submitted ?? false,
          quiz_score:         progressRow.quiz_score         ?? null,
          certificate_issued: progressRow.certificate_issued ?? false,
          progress,
        };
      })
    );

    res.json({ success: true, data: courses });
  } catch (err) {
    console.error('[courses] my-progress error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// ── GET /api/courses/:id — single course ──────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM courses WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.json({ success: false, error: 'Хичээл олдсонгүй' });
    }
    res.json({ success: true, course: result.rows[0], data: result.rows[0] });
  } catch (err) {
    console.error('[courses] get error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// ── PATCH /api/courses/:id/progress — update student progress ─────────────────
router.patch('/:id/progress', async (req: Request, res: Response) => {
  try {
    const courseId = Number(req.params.id);
    const {
      student_id,
      material_viewed,
      exercise_submitted,
      exercise_accuracy,
      quiz_score,
      quiz_answers,
      certificate_issued,
    } = req.body;

    if (!student_id) return res.json({ success: true });

    await pool.query(`
      INSERT INTO course_progress
        (student_id, course_id, material_viewed, exercise_submitted, exercise_accuracy,
         quiz_score, quiz_answers, certificate_issued, certificate_issued_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
        CASE WHEN $8 = true THEN NOW() ELSE NULL END, NOW())
      ON CONFLICT (student_id, course_id) DO UPDATE SET
        material_viewed    = COALESCE($3, course_progress.material_viewed),
        exercise_submitted = COALESCE($4, course_progress.exercise_submitted),
        exercise_accuracy  = COALESCE($5, course_progress.exercise_accuracy),
        quiz_score         = COALESCE($6, course_progress.quiz_score),
        quiz_answers       = COALESCE($7, course_progress.quiz_answers),
        certificate_issued = COALESCE($8, course_progress.certificate_issued),
        certificate_issued_at = CASE
          WHEN $8 = true AND course_progress.certificate_issued = false THEN NOW()
          ELSE course_progress.certificate_issued_at
        END,
        updated_at = NOW()
    `, [
      student_id, courseId,
      material_viewed    ?? null,
      exercise_submitted ?? null,
      exercise_accuracy  ?? null,
      quiz_score         ?? null,
      quiz_answers       ? JSON.stringify(quiz_answers) : null,
      certificate_issued ?? null,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('[courses] progress update error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// ── POST /api/courses — create a new course ────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, materials, parts, assignment, quiz, published } = req.body;
    const result = await pool.query(
      `INSERT INTO courses (title, description, materials, parts, assignment, quiz, published)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        title,
        description ?? '',
        JSON.stringify(materials ?? {}),
        JSON.stringify(parts ?? []),
        JSON.stringify(assignment ?? {}),
        JSON.stringify(quiz ?? {}),
        published !== undefined ? published : true,
      ]
    );
    res.json({ success: true, course: result.rows[0] });
  } catch (err) {
    console.error('[courses] create error:', err);
    res.status(500).json({ success: false, error: 'Хичээл үүсгэхэд алдаа гарлаа' });
  }
});

// ── PUT /api/courses/:id — update course ───────────────────────────────────────
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, description, materials, parts, assignment, quiz, published } = req.body;
    const result = await pool.query(
      `UPDATE courses
       SET title       = COALESCE($1, title),
           description = COALESCE($2, description),
           materials   = COALESCE($3, materials),
           parts       = COALESCE($4, parts),
           assignment  = COALESCE($5, assignment),
           quiz        = COALESCE($6, quiz),
           published   = COALESCE($7, published),
           updated_at  = NOW()
       WHERE id = $8 RETURNING *`,
      [
        title, description,
        materials  ? JSON.stringify(materials)  : null,
        parts      ? JSON.stringify(parts)      : null,
        assignment ? JSON.stringify(assignment) : null,
        quiz       ? JSON.stringify(quiz)       : null,
        published,
        req.params.id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Хичээл олдсонгүй' });
    }
    res.json({ success: true, course: result.rows[0] });
  } catch (err) {
    console.error('[courses] update error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

export default router;
