"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const pg_1 = require("pg");
const router = (0, express_1.Router)();
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Email эсвэл нууц үг буруу' });
        }
        const user = result.rows[0];
        const validPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, error: 'Email эсвэл нууц үг буруу' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({
            success: true,
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role }
        });
    }
    catch (err) {
        console.error('Auth error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role = 'student' } = req.body;
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const result = await pool.query('INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role', [email, hashedPassword, name, role]);
        const user = result.rows[0];
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({ success: true, token, user });
    }
    catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ success: false, error: 'Email бүртгэлтэй байна' });
        }
        console.error('Auth error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token)
            return res.status(401).json({ success: false, error: 'Token байхгүй' });
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        const result = await pool.query('SELECT id, email, name, role FROM users WHERE id = $1', [decoded.id]);
        res.json({ success: true, user: result.rows[0] });
    }
    catch (err) {
        res.status(401).json({ success: false, error: 'Token хүчингүй' });
    }
});
exports.default = router;
