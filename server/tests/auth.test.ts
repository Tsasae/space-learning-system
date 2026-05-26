// pg-г mock хийнэ — route файл import хийхээс өмнө хийх ёстой (Jest hoists)
jest.mock('pg', () => {
  const mockQuery = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
  const MockPool = jest.fn(() => ({ query: mockQuery }));
  (MockPool as any).__mockQuery = mockQuery;
  return { Pool: MockPool };
});

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$hashed_password$'),
  compare: jest.fn(),
}));

import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import authRouter from '../src/routes/auth';

const mockQuery: jest.Mock = (Pool as any).__mockQuery;
const mockBcryptCompare = bcrypt.compare as jest.Mock;
const mockBcryptHash = bcrypt.hash as jest.Mock;

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
  mockBcryptCompare.mockReset();
  mockBcryptHash.mockResolvedValue('$hashed_password$');
});

// ── POST /api/auth/login ───────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  const mockUser = {
    id: 1,
    email: 'user@test.com',
    password: '$hashed$',
    name: 'Test User',
    role: 'student',
  };

  test('200 - valid credentials returns token and user', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
    mockBcryptCompare.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toMatchObject({
      id: 1,
      email: 'user@test.com',
      role: 'student',
    });
  });

  test('401 - email not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nouser@test.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  test('401 - wrong password', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
    mockBcryptCompare.mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('500 - database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ── POST /api/auth/register ────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  const newUser = {
    id: 2,
    email: 'new@test.com',
    name: 'New User',
    role: 'student',
  };

  test('200 - successful registration returns token', async () => {
    mockBcryptHash.mockResolvedValueOnce('$hashed$');
    mockQuery.mockResolvedValueOnce({ rows: [newUser] });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@test.com', password: 'password123', name: 'New User' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('new@test.com');
  });

  test('200 - default role is student', async () => {
    mockBcryptHash.mockResolvedValueOnce('$hashed$');
    mockQuery.mockResolvedValueOnce({ rows: [newUser] });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@test.com', password: 'pass', name: 'User' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('student');
  });

  test('400 - duplicate email (code 23505)', async () => {
    mockBcryptHash.mockResolvedValueOnce('$hashed$');
    const dupError = Object.assign(new Error('duplicate key'), { code: '23505' });
    mockQuery.mockRejectedValueOnce(dupError);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'existing@test.com', password: 'password123', name: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Email/);
  });

  test('500 - database error', async () => {
    mockBcryptHash.mockResolvedValueOnce('$hashed$');
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@test.com', password: 'password123', name: 'Test' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  const validToken = jwt.sign(
    { id: 1, email: 'user@test.com', role: 'student' },
    'test-secret'
  );

  test('200 - valid Bearer token returns user', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, email: 'user@test.com', name: 'Test User', role: 'student' }],
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('user@test.com');
  });

  test('401 - no Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('401 - invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid_token_xyz');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('401 - token signed with wrong secret', async () => {
    const badToken = jwt.sign({ id: 1 }, 'wrong-secret');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${badToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
