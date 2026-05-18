import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Pool } from 'pg';
import { Readable } from 'stream';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.ppt', '.pptx', '.ipynb'];
    const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Зөвхөн PDF, PPT, PPTX, IPYNB файл зөвшөөрнө'));
  }
});

const uploadToCloudinary = (buffer: Buffer, filename: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', public_id: `lms/${filename}`, use_filename: true },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

router.post('/file', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Файл байхгүй' });
    const { title, instructor_id } = req.body;
    const filename = Date.now() + '-' + req.file.originalname;
    const cloudResult = await uploadToCloudinary(req.file.buffer, filename);
    const fileUrl = cloudResult.secure_url;
    const fileType = req.file.originalname.split('.').pop()?.toLowerCase();
    const contentType = fileType === 'ipynb' ? 'notebook' : 'slide';
    const result = await pool.query(
      `INSERT INTO course_materials (title, file_url, file_name, file_type, content_type, instructor_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title || req.file.originalname, fileUrl, req.file.originalname, fileType, contentType, instructor_id || null]
    );
    res.json({ success: true, material: result.rows[0] });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, error: 'Upload алдаа' });
  }
});

router.post('/link', async (req: Request, res: Response) => {
  try {
    const { url, type, title, instructor_id } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL байхгүй' });
    const contentType = type?.includes('Notebook') ? 'notebook' : type?.includes('NASA') ? 'nasa' : 'slide';
    const result = await pool.query(
      `INSERT INTO course_materials (title, link_url, link_type, content_type, instructor_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title || url, url, type, contentType, instructor_id || null]
    );
    res.json({ success: true, material: result.rows[0] });
  } catch (err) {
    console.error('Link error:', err);
    res.status(500).json({ success: false, error: 'Link хадгалах алдаа' });
  }
});

router.get('/courses', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT m.*, u.name as instructor_name 
       FROM course_materials m
       LEFT JOIN users u ON m.instructor_id::integer = u.id
       WHERE m.is_published = true
       ORDER BY m.created_at DESC`
    );
    res.json({ success: true, courses: result.rows });
  } catch (err) {
    console.error('Courses fetch error:', err);
    res.status(500).json({ success: false, error: 'Алдаа' });
  }
});

router.delete('/courses/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM course_materials WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Устгах алдаа' });
  }
});

export default router;
