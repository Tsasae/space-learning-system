import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Жингийн тохиргоо (нэг газар) ────────────────────────────────────────────────
const W_MATERIAL = 40;
const W_ASSIGNMENT = 30;
const W_QUIZ = 30;

// ── Туслах: курсын нийт slide тоог parts JSONB-аас тоолох ───────────────────────
function countTotalSlides(parts: any): number {
  if (!Array.isArray(parts)) return 0;
  return parts.reduce((sum: number, p: any) => {
    const slides = p?.slides;
    return sum + (Array.isArray(slides) ? slides.length : 0);
  }, 0);
}

// ── Туслах: нийт хувийг тооцоолох ────────────────────────────────────────────────
function calcPercent(
  totalSlides: number,
  seenCount: number,
  assignmentSubmitted: boolean,
  quizScore: number | null
): { total: number; material: number; assignment: number; quiz: number } {
  const material =
    totalSlides > 0 ? (Math.min(seenCount, totalSlides) / totalSlides) * W_MATERIAL : 0;
  const assignment = assignmentSubmitted ? W_ASSIGNMENT : 0;
  const quiz = quizScore != null ? (quizScore / 100) * W_QUIZ : 0;
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    total: round1(material + assignment + quiz),
    material: round1(material),
    assignment: round1(assignment),
    quiz: round1(quiz),
  };
}

// ── Туслах: progress мөрийг дахин тооцоолж хадгалах ─────────────────────────────
async function recompute(studentId: string, courseId: number) {
  const [courseRes, progRes] = await Promise.all([
    pool.query('SELECT parts FROM courses WHERE id = $1', [courseId]),
    pool.query(
      'SELECT * FROM course_progress WHERE student_id = $1 AND course_id = $2',
      [studentId, courseId]
    ),
  ]);

  const totalSlides = countTotalSlides(courseRes.rows[0]?.parts);
  const row = progRes.rows[0] ?? {};
  const seen: string[] = Array.isArray(row.seen_slides) ? row.seen_slides : [];
  const assignmentSubmitted = !!row.exercise_submitted;
  const quizScore = row.quiz_score != null ? Number(row.quiz_score) : null;

  const pct = calcPercent(totalSlides, seen.length, assignmentSubmitted, quizScore);

  await pool.query(
    `UPDATE course_progress
       SET progress_percent = $1, last_activity_at = NOW(), updated_at = NOW()
     WHERE student_id = $2 AND course_id = $3`,
    [pct.total, studentId, courseId]
  );

  return { ...pct, seenCount: seen.length, totalSlides };
}

// ════════════════════════════════════════════════════════════════════════════════
// POST /api/progress/slide-seen
// body: { student_id, course_id, slide_key }
// ════════════════════════════════════════════════════════════════════════════════
router.post('/slide-seen', async (req: Request, res: Response) => {
  try {
    const { student_id, course_id, slide_key } = req.body;
    if (!student_id || !course_id || slide_key == null) {
      return res.status(400).json({ success: false, error: 'Дутуу параметр' });
    }

    await pool.query(
      `INSERT INTO course_progress (student_id, course_id, seen_slides, last_activity_at)
         VALUES ($1, $2, $3::jsonb, NOW())
       ON CONFLICT (student_id, course_id) DO UPDATE SET
         seen_slides = (
           SELECT COALESCE(jsonb_agg(DISTINCT elem), '[]'::jsonb)
           FROM jsonb_array_elements_text(
             course_progress.seen_slides || $3::jsonb
           ) AS elem
         ),
         last_activity_at = NOW(),
         updated_at = NOW()`,
      [student_id, course_id, JSON.stringify([String(slide_key)])]
    );

    const result = await recompute(student_id, Number(course_id));
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[progress] slide-seen error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// POST /api/progress/recompute
// body: { student_id, course_id }
// ════════════════════════════════════════════════════════════════════════════════
router.post('/recompute', async (req: Request, res: Response) => {
  try {
    const { student_id, course_id } = req.body;
    if (!student_id || !course_id) {
      return res.status(400).json({ success: false, error: 'Дутуу параметр' });
    }
    const result = await recompute(student_id, Number(course_id));
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[progress] recompute error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/progress?student_id=&course_id=
// ════════════════════════════════════════════════════════════════════════════════
router.get('/', async (req: Request, res: Response) => {
  try {
    const studentId = req.query.student_id as string;
    const courseId = Number(req.query.course_id);
    if (!studentId || !courseId) {
      return res.status(400).json({ success: false, error: 'Дутуу параметр' });
    }

    const [courseRes, progRes] = await Promise.all([
      pool.query('SELECT parts FROM courses WHERE id = $1', [courseId]),
      pool.query(
        'SELECT * FROM course_progress WHERE student_id = $1 AND course_id = $2',
        [studentId, courseId]
      ),
    ]);

    const totalSlides = countTotalSlides(courseRes.rows[0]?.parts);
    const row = progRes.rows[0] ?? {};
    const seen: string[] = Array.isArray(row.seen_slides) ? row.seen_slides : [];
    const pct = calcPercent(
      totalSlides,
      seen.length,
      !!row.exercise_submitted,
      row.quiz_score != null ? Number(row.quiz_score) : null
    );

    res.json({
      success: true,
      progress_percent: pct.total,
      breakdown: { material: pct.material, assignment: pct.assignment, quiz: pct.quiz },
      seen_slides: seen,
      seen_count: seen.length,
      total_slides: totalSlides,
      exercise_submitted: !!row.exercise_submitted,
      quiz_score: row.quiz_score != null ? Number(row.quiz_score) : null,
      last_activity_at: row.last_activity_at ?? null,
    });
  } catch (err) {
    console.error('[progress] get error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// GET /api/progress/course/:courseId — багшид: бүх сурагчийн live явц
// ════════════════════════════════════════════════════════════════════════════════
router.get('/course/:courseId', async (req: Request, res: Response) => {
  try {
    const courseId = Number(req.params.courseId);
    const result = await pool.query(
      `SELECT cp.student_id, u.name AS student_name,
              cp.progress_percent, cp.exercise_submitted,
              cp.quiz_score, cp.last_activity_at,
              jsonb_array_length(COALESCE(cp.seen_slides, '[]'::jsonb)) AS seen_count
       FROM course_progress cp
       LEFT JOIN users u ON cp.student_id::text = u.id::text
       WHERE cp.course_id = $1
       ORDER BY cp.last_activity_at DESC NULLS LAST`,
      [courseId]
    );
    res.json({ success: true, students: result.rows });
  } catch (err) {
    console.error('[progress] course error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

export default router;
