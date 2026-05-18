"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pg_1 = require("pg");
const router = (0, express_1.Router)();
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
// Feedback илгээх
router.post('/', async (req, res) => {
    try {
        const { instructor_id, student_id, grade, comment, material_id } = req.body;
        const result = await pool.query(`INSERT INTO feedback (instructor_id, student_id, grade, comment, material_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`, [instructor_id, student_id, grade, comment, material_id || null]);
        res.json({ success: true, feedback: result.rows[0] });
    }
    catch (err) {
        console.error('Feedback error:', err);
        res.status(500).json({ success: false, error: 'Feedback илгээх алдаа' });
    }
});
// Student-ийн feedback авах
router.get('/:student_id', async (req, res) => {
    try {
        const result = await pool.query(`SELECT f.*, u.name as instructor_name
       FROM feedback f
       LEFT JOIN users u ON f.instructor_id = u.id
       WHERE f.student_id = $1
       ORDER BY f.created_at DESC`, [req.params.student_id]);
        res.json({ success: true, feedback: result.rows });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Алдаа' });
    }
});
exports.default = router;
