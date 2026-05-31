import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import nasaRoutes from './routes/nasa';
import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';
import feedbackRoutes from './routes/feedback';
import submissionsRoutes from './routes/submissions';
import bigqueryRoutes from './routes/bigquery';
import coursesRoutes from './routes/courses';
import instructorRoutes from './routes/instructor';
import mlRoutes from './routes/ml';
import progressRoutes from './routes/progress';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({ 
  origin: [
    'http://localhost:5173',
    'https://space-learning-system.vercel.app',
    'https://space-learning-system-ngze0jc5m.vercel.app',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean) 
}));
app.use(express.json());

app.use('/api/nasa', nasaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/bigquery', bigqueryRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/progress', progressRoutes);
app.use('/uploads', require('express').static('uploads'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── Database migrations ────────────────────────────────────────────────────────
async function runMigrations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'student',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    // Course materials table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_materials (
        id SERIAL PRIMARY KEY,
        title TEXT,
        file_url TEXT,
        file_name TEXT,
        file_type TEXT,
        link_url TEXT,
        link_type TEXT,
        content_type TEXT,
        instructor_id TEXT,
        is_published BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
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

    // Live progress tracking columns (added after initial release)
    await pool.query(`
      ALTER TABLE course_progress
        ADD COLUMN IF NOT EXISTS seen_slides JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS progress_percent DECIMAL(5,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_progress_activity
        ON course_progress(course_id, last_activity_at DESC)
    `);

    console.log('✅ Database migrations completed');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

// Start server after migrations
runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
