import { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL } from '../config';

export interface ProgressBreakdown {
  material: number;
  assignment: number;
  quiz: number;
}

export interface ProgressState {
  total: number;
  breakdown: ProgressBreakdown;
  seenCount: number;
  totalSlides: number;
  lastActivityAt: string | null;
}

const EMPTY: ProgressState = {
  total: 0,
  breakdown: { material: 0, assignment: 0, quiz: 0 },
  seenCount: 0,
  totalSlides: 0,
  lastActivityAt: null,
};

// Slide-ыг "үзсэн" гэж тооцох босго (мс)
const SEEN_THRESHOLD_MS = 3000;

export function useProgressTracking(
  studentId: string | undefined,
  courseId: number | undefined
) {
  const [progress, setProgress] = useState<ProgressState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const sentRef = useRef<Set<string>>(new Set());

  const applyServer = useCallback((j: any) => {
    if (!j?.success) return;
    setProgress({
      total: j.progress_percent ?? j.total ?? 0,
      breakdown: j.breakdown ?? {
        material: j.material ?? 0,
        assignment: j.assignment ?? 0,
        quiz: j.quiz ?? 0,
      },
      seenCount: j.seen_count ?? j.seenCount ?? 0,
      totalSlides: j.total_slides ?? j.totalSlides ?? 0,
      lastActivityAt: j.last_activity_at ?? null,
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!studentId || !courseId) return;
    setLoading(true);
    try {
      const r = await fetch(
        `${API_URL}/api/progress?student_id=${encodeURIComponent(studentId)}&course_id=${courseId}`
      );
      const j = await r.json();
      applyServer(j);
      if (Array.isArray(j.seen_slides)) {
        j.seen_slides.forEach((k: string) => sentRef.current.add(k));
      }
    } catch {
      /* чимээгүй унтраах */
    } finally {
      setLoading(false);
    }
  }, [studentId, courseId, applyServer]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Slide үзсэнийг бүртгэх (3 сек timer). Cleanup функц буцаана.
  const markSlideSeen = useCallback(
    (slideKey: string): (() => void) => {
      if (!studentId || !courseId) return () => {};
      if (sentRef.current.has(slideKey)) return () => {};

      const timer = setTimeout(async () => {
        sentRef.current.add(slideKey);
        try {
          const r = await fetch(`${API_URL}/api/progress/slide-seen`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student_id: studentId,
              course_id: courseId,
              slide_key: slideKey,
            }),
          });
          applyServer(await r.json());
        } catch {
          sentRef.current.delete(slideKey);
        }
      }, SEEN_THRESHOLD_MS);

      return () => clearTimeout(timer);
    },
    [studentId, courseId, applyServer]
  );

  const recompute = useCallback(async () => {
    if (!studentId || !courseId) return;
    try {
      const r = await fetch(`${API_URL}/api/progress/recompute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, course_id: courseId }),
      });
      applyServer(await r.json());
    } catch {
      /* ignore */
    }
  }, [studentId, courseId, applyServer]);

  return { progress, loading, markSlideSeen, refresh, recompute, SEEN_THRESHOLD_MS };
}
