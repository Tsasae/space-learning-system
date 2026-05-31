import { Router, Request, Response } from 'express';
import { BigQuery } from '@google-cloud/bigquery';
import { cache } from '../middleware/cache';

const router = Router();

import fs from 'fs';
import os from 'os';

let bigquery: BigQuery;

if (process.env.GOOGLE_CREDENTIALS_BASE64) {
  const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf8');
  const tmpFile = os.tmpdir() + '/bigquery-key.json';
  fs.writeFileSync(tmpFile, decoded);
  bigquery = new BigQuery({
    projectId: 'lunar-lms-bigquery',
    keyFilename: tmpFile
  });
} else {
  bigquery = new BigQuery({
    projectId: 'lunar-lms-bigquery',
    keyFilename: '/home/tsatsral/Documents/lms-websystem /credentials/bigquery-key.json'
  });
}

// Нийт статистик
router.get('/stats', cache(900), async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_records,
        COUNTIF(confidence = 'high') as high_confidence,
        COUNTIF(confidence = 'nominal') as nominal_confidence,
        COUNTIF(confidence = 'low') as low_confidence,
        ROUND(AVG(bright_ti4), 2) as avg_brightness,
        MIN(acq_date) as earliest_date,
        MAX(acq_date) as latest_date
      FROM \`bigquery-public-data.nasa_wildfire.past_week\`
    `;
    const [rows] = await bigquery.query(query);
    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Өгөгдөл татах
router.get('/wildfire', cache(900), async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 1000;
    const confidence = req.query.confidence as string || 'high';

    const query = `
      SELECT latitude, longitude, bright_ti4, confidence, acq_date, satellite
      FROM \`bigquery-public-data.nasa_wildfire.past_week\`
      WHERE confidence = @confidence
      LIMIT @limit
    `;
    const [rows] = await bigquery.query({
      query,
      params: { confidence, limit },
    });
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ML загварын үнэлгээ
router.get('/ml-results', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT *
      FROM ML.EVALUATE(
        MODEL \`lunar-lms-bigquery.wildfire_dataset.confidence_model\`,
        (SELECT latitude, longitude, bright_ti4,
                IF(confidence = 'high', 1, 0) as label
         FROM \`bigquery-public-data.nasa_wildfire.past_week\`))
    `;
    const [rows] = await bigquery.query(query);
    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Landsat 9.6M бичлэг статистик
router.get('/landsat-stats', cache(3600), async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_scenes,
        COUNT(DISTINCT spacecraft_id) as satellites,
        MIN(date_acquired) as earliest,
        MAX(date_acquired) as latest,
        ROUND(AVG(cloud_cover), 2) as avg_cloud_cover
      FROM \`bigquery-public-data.cloud_storage_geo_index.landsat_index\`
      WHERE cloud_cover IS NOT NULL
    `;
    const [rows] = await bigquery.query(query);
    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Landsat ML үнэлгээ
router.get('/landsat-ml', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT *
      FROM ML.EVALUATE(
        MODEL \`lunar-lms-bigquery.wildfire_dataset.landsat_model\`,
        (SELECT
          EXTRACT(YEAR FROM date_acquired) as year,
          EXTRACT(MONTH FROM date_acquired) as month,
          spacecraft_id,
          cloud_cover,
          north_lat - south_lat as lat_range,
          east_lon - west_lon as lon_range,
          cloud_cover as label
        FROM \`bigquery-public-data.cloud_storage_geo_index.landsat_index\`
        WHERE cloud_cover IS NOT NULL AND cloud_cover >= 0))
    `;
    const [rows] = await bigquery.query(query);
    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Landsat дагуул бүрийн статистик
router.get('/landsat-by-satellite', cache(3600), async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT spacecraft_id,
        COUNT(*) as scene_count,
        ROUND(AVG(cloud_cover), 2) as avg_cloud,
        MIN(date_acquired) as first_date,
        MAX(date_acquired) as last_date
      FROM \`bigquery-public-data.cloud_storage_geo_index.landsat_index\`
      WHERE cloud_cover IS NOT NULL
      GROUP BY spacecraft_id
      ORDER BY scene_count DESC
    `;
    const [rows] = await bigquery.query(query);
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// Landsat жинхэн өгөгдөл — ML-д зориулсан
router.get('/landsat-raw', async (req, res) => {
  try {
    const query = `
      SELECT cloud_cover, north_lat, south_lat, east_lon, west_lon
      FROM \`bigquery-public-data.cloud_storage_geo_index.landsat_index\`
      WHERE cloud_cover IS NOT NULL AND RAND() < 0.001
      LIMIT 5000
    `;
    const [rows] = await bigquery.query(query);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;