import { Request, Response, NextFunction } from 'express';

interface Entry {
  body: unknown;
  expiresAt: number;
}

const store = new Map<string, Entry>();

/**
 * @param ttlSeconds Хэдэн секунд хадгалах вэ
 */
export function cache(ttlSeconds: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== 'GET') return next();

    const key = req.originalUrl;
    const hit = store.get(key);
    const now = Date.now();

    if (hit && hit.expiresAt > now) {
      res.setHeader('X-Cache', 'HIT');
      res.json(hit.body);
      return;
    }

    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        store.set(key, { body, expiresAt: now + ttlSeconds * 1000 });
      }
      return originalJson(body);
    };

    next();
  };
}

export function clearCache(): void {
  store.clear();
}

// Хугацаа дууссан entry-үүдийг үе үе цэвэрлэх
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}, 10 * 60 * 1000).unref();
