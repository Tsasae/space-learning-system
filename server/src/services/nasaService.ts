import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import NodeCache from 'node-cache';
import https from 'https';

const cache = new NodeCache({ stdTTL: 86400 });
const NASA_KEY = process.env.NASA_API_KEY;
const BASE_URL = 'https://api.nasa.gov';

const client = axios.create({
  timeout: 15000,
  httpsAgent: new https.Agent({ rejectUnauthorized: false })
});

console.log('NASA_KEY:', NASA_KEY);

export const getAPOD = async (count = 9) => {
  const cacheKey = `apod_${count}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await client.get(`${BASE_URL}/planetary/apod`, {
      params: { api_key: NASA_KEY, count }
    });
    cache.set(cacheKey, response.data);
    return response.data;
  } catch (err: any) {
    console.error('APOD Error:', err.message, err.code);
    throw err;
  }
};

export const getNEO = async () => {
  const cacheKey = 'neo_today';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const today = new Date().toISOString().split('T')[0];
  const response = await client.get(`${BASE_URL}/neo/rest/v1/feed`, {
    params: { api_key: NASA_KEY, start_date: today, end_date: today }
  });
  cache.set(cacheKey, response.data);
  return response.data;
};
