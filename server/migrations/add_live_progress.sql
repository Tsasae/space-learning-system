-- ============================================================
-- course_progress хүснэгтэд live tracking-д зориулсан баганууд нэмэх
-- ============================================================
-- Одоо байгаа хүснэгтийг ЭВДЭХГҮЙГЭЭР зөвхөн шинэ багана нэмнэ.
-- seen_slides: үзсэн slide-уудын түлхүүр (["0-0","0-1",...]) JSONB массив
-- progress_percent: тооцоолсон нийт хувь (0..100)
-- last_activity_at: хамгийн сүүлд идэвхжсэн агшин (live indicator-д)

ALTER TABLE course_progress
  ADD COLUMN IF NOT EXISTS seen_slides JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS progress_percent DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

-- Багшийн dashboard-д "хэн идэвхтэй сурч байна"-г хурдан харахад
CREATE INDEX IF NOT EXISTS idx_progress_activity
  ON course_progress(course_id, last_activity_at DESC);
