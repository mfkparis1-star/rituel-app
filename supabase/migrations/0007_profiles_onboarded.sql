-- Phase 16F.1 — Welcome onboarding flag
-- Adds an `onboarded` boolean to profiles so the welcome flow runs
-- exactly once per user. Default false; flipped to true when the user
-- finishes the 3-slide onboarding or taps "Passer".
--
-- Safe to re-run.

alter table public.profiles
  add column if not exists onboarded boolean not null default false;

comment on column public.profiles.onboarded is
  'true once the user has seen (or skipped) the welcome onboarding. Set to false to re-trigger.';
