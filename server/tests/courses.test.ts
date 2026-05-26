// courses.ts нь module load үед CREATE TABLE query дуудна,
// тиймээс mock default нь mockResolvedValue({ rows: [] }) байх ёстой
jest.mock('pg', () => {
  const mockQuery = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
  const MockPool = jest.fn(() => ({ query: mockQuery }));
  (MockPool as any).__mockQuery = mockQuery;
  return { Pool: MockPool };
});

import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import coursesRouter from '../src/routes/courses';

const mockQuery: jest.Mock = (Pool as any).__mockQuery;

const app = express();
app.use(express.json());
app.use('/api/courses', coursesRouter);

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
});

const mockCourse = {
  id: 1,
  title: 'Remote Sensing 101',
  description: 'Intro course',
  instructor_id: '10',
  materials: {},
  parts: [],
  assignment: {},
  quiz: {},
  published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  instructor_name: 'Instructor A',
  student_count: '5',
};

// ── GET /api/courses ───────────────────────────────────────────────────────────
describe('GET /api/courses', () => {
  test('200 - returns list of published courses', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockCourse] });

    const res = await request(app).get('/api/courses');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.courses).toHaveLength(1);
    expect(res.body.courses[0].title).toBe('Remote Sensing 101');
  });

  test('200 - returns empty list when no courses', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/courses');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.courses).toHaveLength(0);
  });

  test('500 - database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/api/courses');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ── GET /api/courses/my-progress ──────────────────────────────────────────────
describe('GET /api/courses/my-progress', () => {
  test('200 - returns courses with progress=0 when no studentId', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockCourse] });

    const res = await request(app).get('/api/courses/my-progress');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].progress).toBe(0);
  });

  test('200 - calculates progress=75 when material+exercise+quiz done', async () => {
    const progressRow = {
      material_viewed: true,
      exercise_submitted: true,
      quiz_score: 80,
      certificate_issued: false,
    };
    mockQuery
      .mockResolvedValueOnce({ rows: [mockCourse] })     // courses list
      .mockResolvedValueOnce({ rows: [progressRow] });   // progress for course 1

    const res = await request(app)
      .get('/api/courses/my-progress')
      .query({ student_id: 'student_123' });

    expect(res.status).toBe(200);
    expect(res.body.data[0].progress).toBe(75);
    expect(res.body.data[0].quiz_score).toBe(80);
  });

  test('200 - calculates progress=100 when certificate issued', async () => {
    const progressRow = {
      material_viewed: true,
      exercise_submitted: true,
      quiz_score: 90,
      certificate_issued: true,
    };
    mockQuery
      .mockResolvedValueOnce({ rows: [mockCourse] })
      .mockResolvedValueOnce({ rows: [progressRow] });

    const res = await request(app)
      .get('/api/courses/my-progress')
      .query({ student_id: 'student_123' });

    expect(res.status).toBe(200);
    expect(res.body.data[0].progress).toBe(100);
    expect(res.body.data[0].certificate_issued).toBe(true);
  });

  test('200 - returns empty array when no courses exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/courses/my-progress');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  test('500 - database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/api/courses/my-progress');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ── GET /api/courses/:id ───────────────────────────────────────────────────────
describe('GET /api/courses/:id', () => {
  test('200 - returns single course by id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockCourse] });

    const res = await request(app).get('/api/courses/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.course.id).toBe(1);
    expect(res.body.data.id).toBe(1);
  });

  test('200 - course not found returns success:false', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/courses/999');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  test('500 - database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/api/courses/1');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ── PATCH /api/courses/:id/progress ───────────────────────────────────────────
describe('PATCH /api/courses/:id/progress', () => {
  test('200 - updates progress for a student', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const res = await request(app)
      .patch('/api/courses/1/progress')
      .send({ student_id: 'student_1', material_viewed: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  test('200 - skips DB update when no student_id', async () => {
    const res = await request(app)
      .patch('/api/courses/1/progress')
      .send({ material_viewed: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('200 - sets certificate_issued with timestamp', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const res = await request(app)
      .patch('/api/courses/1/progress')
      .send({
        student_id: 'student_1',
        certificate_issued: true,
        quiz_score: 95,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('500 - database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .patch('/api/courses/1/progress')
      .send({ student_id: 'student_1', material_viewed: true });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ── POST /api/courses ──────────────────────────────────────────────────────────
describe('POST /api/courses', () => {
  test('200 - creates a new course', async () => {
    const created = { ...mockCourse, id: 2, title: 'New Course' };
    mockQuery.mockResolvedValueOnce({ rows: [created] });

    const res = await request(app)
      .post('/api/courses')
      .send({ title: 'New Course', description: 'Desc' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.course.title).toBe('New Course');
  });

  test('200 - creates course with all optional fields', async () => {
    const full = {
      ...mockCourse,
      id: 3,
      title: 'Full Course',
      parts: [{ number: 1, title: 'Part 1' }],
      quiz: { questions: [] },
    };
    mockQuery.mockResolvedValueOnce({ rows: [full] });

    const res = await request(app)
      .post('/api/courses')
      .send({
        title: 'Full Course',
        description: 'Desc',
        parts: [{ number: 1, title: 'Part 1' }],
        quiz: { questions: [] },
        published: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('500 - database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .post('/api/courses')
      .send({ title: 'New Course' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ── PUT /api/courses/:id ───────────────────────────────────────────────────────
describe('PUT /api/courses/:id', () => {
  test('200 - updates course title', async () => {
    const updated = { ...mockCourse, title: 'Updated Title' };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });

    const res = await request(app)
      .put('/api/courses/1')
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.course.title).toBe('Updated Title');
  });

  test('200 - updates published status', async () => {
    const updated = { ...mockCourse, published: false };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });

    const res = await request(app)
      .put('/api/courses/1')
      .send({ published: false });

    expect(res.status).toBe(200);
    expect(res.body.course.published).toBe(false);
  });

  test('404 - course not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put('/api/courses/999')
      .send({ title: 'Updated' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('500 - database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .put('/api/courses/1')
      .send({ title: 'Updated' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
