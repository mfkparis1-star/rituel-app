-- Phase 17A — Post emotion tag (beauty ritual emotion, optional)
--
-- Adds an optional emotion tag to community posts. Six soft states:
-- Apaisant, Réconfortant, Lumineux, Énergisant, Fragile, Doux.
--
-- Design notes (do not lose):
-- - No enum, no check constraint — iteration friendliness over rigor.
-- - Nullable, default null — existing posts keep null gracefully.
-- - This is a beauty ritual emotion, NOT a mood tracker / mental
--   health signal. The app never reads this column for wellness
--   inference. Display only, soft italic copper capsule, no badge.
--
-- Safe to re-run.

alter table public.posts
  add column if not exists emotion text;

comment on column public.posts.emotion is
  'Optional beauty ritual emotion tag (Apaisant, Reconfortant, Lumineux, Energisant, Fragile, Doux). Display-only, no enum constraint for iteration ease.';
