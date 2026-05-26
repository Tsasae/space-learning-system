jest.mock('pg', () => {
  const mockQuery = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
  const MockPool = jest.fn(() => ({ query: mockQuery }));
  (MockPool as any).__mockQuery = mockQuery;
  return { Pool: MockPool };
});

import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import submissionsRouter from '../src/routes/submissions';

const mockQuery: jest.Mock = (Pool as any).__mockQuery;

const app = express();
app.use(express.json());
app.use('/api/submissions', submissionsRouter);

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
});

const mockSubmission = {
  id: 1,
  student_id: 1,
  exercise_type: 'crater-cnn',
  notebook_content: '{"cells":[]}',
  result_output: 'accuracy: 0.85',
  accuracy: 85.0,
  submitted_at: new Date().toISOString(),
  student_name: 'Test Student',
  student_email: 'student@test.com',
  grade: null,
  feedback_comment: null,
  feedback_date: null,
  instructor_name: null,
};

// ── POST /api/submissions ──────────────────────────────────────────────────────
describe('POST /api/submissions', () => {
  test('200 - creates a new submission', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockSubmission] });

    const res = await request(app)
      .post('/api/submissions')
      .send({
        student_id: 1,
        exercise_type: 'crater-cnn',
        notebook_content: '{"cells":[]}',
        result_output: 'accuracy: 0.85',
        accuracy: 85.0,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.submission.exercise_type).toBe('crater-cnn');
    expect(res.body.submission.accuracy).toBe(85.0);
  });

  test('200 - creates submission with surrogate exercise type', async () => {
    const submission = { ...mockSubmission, exercise_type: 'surrogate' };
    mockQuery.mockResolvedValueOnce({ rows: [submission] });

    const res = await request(app)
      .post('/api/submissions')
      .send({ student_id: 1, exercise_type: 'surrogate', accuracy: 72.5 });

    expect(res.status).toBe(200);
    expect(res.body.submission.exercise_type).toBe('surrogate');
  });

  test('500 - database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .post('/api/submissions')
      .send({ student_id: 1, exercise_type: 'crater-cnn' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ── GET /api/submissions/student/:student_id ───────────────────────────────────
describe('GET /api/submissions/student/:student_id', () => {
  test('200 - returns submissions for a student', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockSubmission] });

    const res = await request(app).get('/api/submissions/student/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.submissions).toHaveLength(1);
    expect(res.body.submissions[0].exercise_type).toBe('crater-cnn');
  });

  test('200 - returns multiple submissions ordered by date', async () => {
    const sub2 = { ...mockSubmission, id: 2, exercise_type: 'surrogate' };
    mockQuery.mockResolvedValueOnce({ rows: [sub2, mockSubmission] });

    const res = await request(app).get('/api/submissions/student/1');

    expect(res.status).toBe(200);
    expect(res.body.submissions).toHaveLength(2);
  });

  test('200 - returns empty array when no submissions', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/submissions/student/999');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.submissions).toHaveLength(0);
  });

  test('500 - database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/api/submissions/student/1');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ── GET /api/submissions/all ───────────────────────────────────────────────────
describe('GET /api/submissions/all', () => {
  test('200 - returns all submissions (instructor view)', async () => {
    const sub2 = { ...mockSubmission, id: 2, student_id: 2, student_name: 'Student B' };
    mockQuery.mockResolvedValueOnce({ rows: [mockSubmission, sub2] });

    const res = await request(app).get('/api/submissions/all');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.submissions).toHaveLength(2);
  });

  test('200 - includes student email in response', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockSubmission] });

    const res = await request(app).get('/api/submissions/all');

    expect(res.status).toBe(200);
    expect(res.body.submissions[0].student_email).toBe('student@test.com');
  });

  test('200 - returns empty array when no submissions', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/submissions/all');

    expect(res.status).toBe(200);
    expect(res.body.submissions).toHaveLength(0);
  });

  test('500 - database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/api/submissions/all');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ── POST /api/submissions/progress ────────────────────────────────────────────
describe('POST /api/submissions/progress', () => {
  test('200 - saves part progress', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const res = await request(app)
      .post('/api/submissions/progress')
      .send({ student_id: '1', part_number: 1, part_title: 'Intro to Remote Sensing' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  test('200 - upserts existing progress (ON CONFLICT)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const res = await request(app)
      .post('/api/submissions/progress')
      .send({ student_id: '1', part_number: 2, part_title: 'Part 2' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('500 - database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .post('/api/submissions/progress')
      .send({ student_id: '1', part_number: 1 });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ── GET /api/submissions/progress/:student_id ─────────────────────────────────
describe('GET /api/submissions/progress/:student_id', () => {
  const mockProgress = [
    { id: 1, student_id: '1', part_number: 1, part_title: 'Part 1', completed: true, completed_at: new Date().toISOString() },
    { id: 2, student_id: '1', part_number: 2, part_title: 'Part 2', completed: true, completed_at: new Date().toISOString() },
    { id: 3, student_id: '1', part_number: 3, part_title: 'Part 3', completed: false, completed_at: null },
  ];

  test('200 - returns all progress records for student', async () => {
    mockQuery.mockResolvedValueOnce({ rows: mockProgress });

    const res = await request(app).get('/api/submissions/progress/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.progress).toHaveLength(3);
    expect(res.body.progress[0].part_number).toBe(1);
    expect(res.body.progress[0].completed).toBe(true);
  });

  test('200 - returns empty progress for new student', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/submissions/progress/999');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.progress).toHaveLength(0);
  });

  test('500 - database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/api/submissions/progress/1');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
