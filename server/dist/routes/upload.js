"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const pg_1 = require("pg");
const router = (0, express_1.Router)();
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const dir = path_1.default.join(__dirname, '../../uploads');
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.ppt', '.pptx', '.ipynb'];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext))
            cb(null, true);
        else
            cb(new Error('Зөвхөн PDF, PPT, PPTX, IPYNB файл зөвшөөрнө'));
    }
});
// File upload
router.post('/file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ success: false, error: 'Файл байхгүй' });
        const { title, instructor_id } = req.body;
        const fileUrl = `http://localhost:8000/uploads/${req.file.filename}`;
        const fileType = path_1.default.extname(req.file.originalname).toLowerCase().replace('.', '');
        const contentType = fileType === 'ipynb' ? 'notebook' : 'slide';
        const result = await pool.query(`INSERT INTO course_materials 
       (title, file_url, file_name, file_type, content_type, instructor_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [title || req.file.originalname, fileUrl, req.file.originalname, fileType, contentType, instructor_id || null]);
        res.json({ success: true, material: result.rows[0] });
    }
    catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ success: false, error: 'Upload алдаа' });
    }
});
// Link хадгалах
router.post('/link', async (req, res) => {
    try {
        const { url, type, title, instructor_id } = req.body;
        if (!url)
            return res.status(400).json({ success: false, error: 'URL байхгүй' });
        const contentType = type?.includes('Notebook') ? 'notebook' :
            type?.includes('NASA') ? 'nasa' : 'slide';
        const result = await pool.query(`INSERT INTO course_materials 
       (title, link_url, link_type, content_type, instructor_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`, [title || url, url, type, contentType, instructor_id || null]);
        res.json({ success: true, material: result.rows[0] });
    }
    catch (err) {
        console.error('Link error:', err);
        res.status(500).json({ success: false, error: 'Link хадгалах алдаа' });
    }
});
// Бүх материал авах
router.get('/courses', async (req, res) => {
    try {
        const result = await pool.query(`SELECT m.*, u.name as instructor_name 
       FROM course_materials m
       LEFT JOIN users u ON m.instructor_id = u.id
       WHERE m.is_published = true
       ORDER BY m.created_at DESC`);
        res.json({ success: true, courses: result.rows });
    }
    catch (err) {
        console.error('Courses fetch error:', err);
        res.status(500).json({ success: false, error: 'Алдаа' });
    }
});
// Устгах
router.delete('/courses/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM course_materials WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Устгах алдаа' });
    }
});
exports.default = router;
