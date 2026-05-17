import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Pool } from 'pg';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.ppt', '.pptx', '.ipynb'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Зөвхөн PDF, PPT, PPTX, IPYNB файл зөвшөөрнө'));
  }
});

// File upload
router.post('/file', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Файл байхгүй' });

    const { title, instructor_id } = req.body;
    const fileUrl = `http://localhost:8000/uploads/${req.file.filename}`;
    const fileType = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const contentType = fileType === 'ipynb' ? 'notebook' : 'slide';

    const result = await pool.query(
      `INSERT INTO course_materials 
       (title, file_url, file_name, file_type, content_type, instructor_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title || req.file.originalname, fileUrl, req.file.originalname, fileType, contentType, instructor_id || null]
    );

    res.json({ success: true, material: result.rows[0] });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, error: 'Upload алдаа' });
  }
});

// Link хадгалах
router.post('/link', async (req: Request, res: Response) => {
  try {
    const { url, type, title, instructor_id } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL байхгүй' });

    const contentType = type?.includes('Notebook') ? 'notebook' : 
                        type?.includes('NASA') ? 'nasa' : 'slide';

    const result = await pool.query(
      `INSERT INTO course_materials 
       (title, link_url, link_type, content_type, instructor_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title || url, url, type, contentType, instructor_id || null]
    );

    res.json({ success: true, material: result.rows[0] });
  } catch (err) {
    console.error('Link error:', err);
    res.status(500).json({ success: false, error: 'Link хадгалах алдаа' });
  }
});

// Бүх материал авах
router.get('/courses', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT m.*, u.name as instructor_name 
       FROM course_materials m
       LEFT JOIN users u ON m.instructor_id = u.id
       WHERE m.is_published = true
       ORDER BY m.created_at DESC`
    );
    res.json({ success: true, courses: result.rows });
  } catch (err) {
    console.error('Courses fetch error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

// Устгах
router.delete('/courses/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM course_materials WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Устгах алдаа' });
  }
});

export default router;
