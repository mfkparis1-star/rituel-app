-- Rituel: AI Skin Analysis - Supabase Migration
-- Run this in Supabase SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS skin_issues text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS skin_analyzed_at timestamptz;

-- skin_type column already exists from onboarding
-- This migration only adds the new columns needed for AI analysis
