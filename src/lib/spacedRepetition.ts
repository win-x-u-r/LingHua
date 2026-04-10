import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * SM-2-inspired spaced repetition algorithm for Ling Hua vocabulary reviews.
 */

interface NextReview {
  ease: number;
  interval: number;
  repetitions: number;
}

/**
 * Map a pronunciation score (0-100) to an SM-2 quality value (1-5).
 */
function scoreToQuality(score: number): number {
  if (score >= 85) return 5; // perfect
  if (score >= 60) return 3; // passing
  return 1; // fail
}

/**
 * Calculate next review parameters using SM-2-inspired logic.
 *
 * @param score        Pronunciation score 0-100
 * @param currentEase  Current ease factor (default 2.5)
 * @param currentInterval  Current interval in days
 * @param reps         Number of consecutive successful repetitions
 */
export function calculateNextReview(
  score: number,
  currentEase: number,
  currentInterval: number,
  reps: number
): NextReview {
  const q = scoreToQuality(score);

  // SM-2 ease adjustment: ease + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  let newEase = currentEase + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEase < 1.3) newEase = 1.3;

  let newInterval: number;
  let newReps: number;

  if (q < 3) {
    // Failed — reset
    newInterval = 0;
    newReps = 0;
  } else {
    newReps = reps + 1;
    if (newReps === 1) {
      newInterval = 1;
    } else if (newReps === 2) {
      newInterval = 3;
    } else {
      newInterval = Math.round(currentInterval * newEase);
    }
  }

  return { ease: newEase, interval: newInterval, repetitions: newReps };
}

/**
 * Upsert a word review record after a pronunciation attempt.
 */
export async function updateWordReview(
  supabaseClient: SupabaseClient,
  userId: string,
  vocabId: string,
  score: number
): Promise<void> {
  const table = supabaseClient.from("word_reviews" as any);

  // Check for existing review record
  const { data: existing } = await (table as any)
    .select("*")
    .eq("user_id", userId)
    .eq("vocab_id", vocabId)
    .single();

  const now = new Date();

  if (existing) {
    const { ease, interval, repetitions } = calculateNextReview(
      score,
      existing.ease_factor,
      existing.interval_days,
      existing.repetitions
    );

    const nextReviewDate = new Date(now);
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    await supabaseClient
      .from("word_reviews" as any)
      .update({
        ease_factor: ease,
        interval_days: interval,
        repetitions,
        last_score: score,
        total_attempts: (existing.total_attempts || 0) + 1,
        best_score: Math.max(existing.best_score || 0, score),
        next_review_date: nextReviewDate.toISOString().split("T")[0],
        updated_at: now.toISOString(),
      } as any)
      .eq("id", existing.id);
  } else {
    const { ease, interval, repetitions } = calculateNextReview(score, 2.5, 0, 0);

    const nextReviewDate = new Date(now);
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    await supabaseClient.from("word_reviews" as any).insert({
      user_id: userId,
      vocab_id: vocabId,
      ease_factor: ease,
      interval_days: interval,
      repetitions,
      last_score: score,
      total_attempts: 1,
      best_score: score,
      next_review_date: nextReviewDate.toISOString().split("T")[0],
    } as any);
  }
}

export interface DueWord {
  id: string;
  hanzi: string;
  pinyin: string;
  arabic_translation: string;
  level: string;
  image_url?: string;
  category?: string;
  review_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  last_score: number;
  best_score: number;
  next_review_date: string;
}

/**
 * Fetch words that are due for review (next_review_date <= today).
 * Joins word_reviews with the vocab table.
 */
export async function getDueWords(
  supabaseClient: SupabaseClient,
  userId: string,
  level?: string
): Promise<DueWord[]> {
  const today = new Date().toISOString().split("T")[0];

  let query = supabaseClient
    .from("word_reviews" as any)
    .select(
      "id, ease_factor, interval_days, repetitions, last_score, best_score, next_review_date, vocab_id, vocab!inner(id, hanzi, pinyin, arabic_translation, level, image_url, category)"
    )
    .eq("user_id", userId)
    .lte("next_review_date", today)
    .order("next_review_date", { ascending: true });

  const { data, error } = await query;

  if (error || !data) return [];

  // Flatten the joined result
  let results: DueWord[] = (data as any[]).map((row: any) => ({
    id: row.vocab.id,
    hanzi: row.vocab.hanzi,
    pinyin: row.vocab.pinyin,
    arabic_translation: row.vocab.arabic_translation,
    level: row.vocab.level,
    image_url: row.vocab.image_url,
    category: row.vocab.category,
    review_id: row.id,
    ease_factor: row.ease_factor,
    interval_days: row.interval_days,
    repetitions: row.repetitions,
    last_score: row.last_score,
    best_score: row.best_score,
    next_review_date: row.next_review_date,
  }));

  if (level) {
    results = results.filter((w) => w.level === level);
  }

  return results;
}

export interface WeakWord {
  id: string;
  hanzi: string;
  pinyin: string;
  arabic_translation: string;
  level: string;
  last_score: number;
  best_score: number;
  total_attempts: number;
}

/**
 * Fetch words with the lowest scores for practice suggestions.
 */
export async function getWeakWords(
  supabaseClient: SupabaseClient,
  userId: string,
  limit: number = 10
): Promise<WeakWord[]> {
  const { data, error } = await supabaseClient
    .from("word_reviews" as any)
    .select(
      "last_score, best_score, total_attempts, vocab_id, vocab!inner(id, hanzi, pinyin, arabic_translation, level)"
    )
    .eq("user_id", userId)
    .order("last_score", { ascending: true })
    .limit(limit);

  if (error || !data) return [];

  return (data as any[]).map((row: any) => ({
    id: row.vocab.id,
    hanzi: row.vocab.hanzi,
    pinyin: row.vocab.pinyin,
    arabic_translation: row.vocab.arabic_translation,
    level: row.vocab.level,
    last_score: row.last_score,
    best_score: row.best_score,
    total_attempts: row.total_attempts,
  }));
}
