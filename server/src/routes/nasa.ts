import { Router, Request, Response } from 'express';
import { getAPOD, getNEO } from '../services/nasaService';

const router = Router();

router.get('/apod', async (req: Request, res: Response) => {
  try {
    const count = Math.min(Math.max(parseInt(req.query.count as string) || 9, 1), 20);
    const data = await getAPOD(count);
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('NASA Error:', err.response?.data || err.message);
    res.status(500).json({ 
      success: false, 
      error: err.response?.data || err.message 
    });
  }
});

router.get('/neo', async (req: Request, res: Response) => {
  try {
    const data = await getNEO();
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('NEO Error:', err.response?.data || err.message);
    res.status(500).json({ 
      success: false, 
      error: err.response?.data || err.message 
    });
  }
});

export default router;