"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const pg_1 = require("pg");
const nasa_1 = __importDefault(require("./routes/nasa"));
const auth_1 = __importDefault(require("./routes/auth"));
const upload_1 = __importDefault(require("./routes/upload"));
const feedback_1 = __importDefault(require("./routes/feedback"));
const submissions_1 = __importDefault(require("./routes/submissions"));
const bigquery_1 = __importDefault(require("./routes/bigquery"));
const courses_1 = __importDefault(require("./routes/courses"));
const instructor_1 = __importDefault(require("./routes/instructor"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'https://space-learning-system.vercel.app',
        process.env.FRONTEND_URL || ''
    ].filter(Boolean)
}));
app.use(express_1.default.json());
app.use('/api/nasa', nasa_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/feedback', feedback_1.default);
app.use('/api/submissions', submissions_1.default);
app.use('/api/bigquery', bigquery_1.default);
app.use('/api/courses', courses_1.default);
app.use('/api/instructor', instructor_1.default);
app.use('/uploads', require('express').static('uploads'));
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// ── Database migrations ────────────────────────────────────────────────────────
async function runMigrations() {
    const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        // Courses table
        await pool.query(`
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
    `);
        // Course-level progress (separate from part-level student_progress)
        await pool.query(`
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
    `);
        // Part-level progress (existing table — ensure it exists too)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS student_progress (
        id SERIAL PRIMARY KEY,
        student_id TEXT NOT NULL,
        part_number INTEGER NOT NULL,
        part_title TEXT,
        completed BOOLEAN DEFAULT false,
        completed_at TIMESTAMPTZ,
        UNIQUE(student_id, part_number)
      )
    `);
        console.log('✅ Database migrations completed');
    }
    catch (err) {
        console.error('Migration error:', err);
    }
    finally {
        await pool.end();
    }
}
// Start server after migrations
runMigrations().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
