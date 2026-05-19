/**
 * English locale — Rituel.
 *
 * Tone: warm, intimate, present-tense. Avoid corporate beauty copy.
 * Match the French softness — Rituel is a journal, not a coach.
 */
import type { LocaleDict } from './fr';

export const en: LocaleDict = {
  onboarding: {
    skip: 'Skip',
    next: 'Continue',
    start: 'Begin',
    slide1: {
      kicker: 'WELCOME',
      headline: 'Your beauty journal\nawaits.',
      subtitle: 'An intimate space, made for you. Not a coach, not a social feed — just your story, day after day.',
    },
    slide2: {
      kicker: 'YOUR RHYTHM',
      headline: 'Every check-in\nmatters.',
      subtitle: 'One emoji, one free note. Rituel remembers each moment to accompany you better. The Glow Timeline holds your story.',
    },
    slide3: {
      kicker: 'COMMUNITY',
      headline: 'Inspired by those\nlike you.',
      subtitle: "Share your rituals, save what moves you. No comparison, no aggressive algorithm — a collective journal.",
    },
  },

  score: {
    title: 'Rituel Score',
    subtitle: 'A soft note on your beauty rhythm.',
    levelLabels: {
      grounded: 'Grounded',
      flowing: 'Flowing',
      glowing: 'Glowing',
      tending: 'Tender',
      resting: 'At rest',
    },
    breakdown: {
      checkins: 'Check-ins',
      routines: 'Rituals',
      reflections: 'Reflections',
      community: 'Community',
    },
    note: 'Your score reflects your attention to yourself, not a performance.',
    backToHome: 'Back',
  },

  common: {
    back: 'Back',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    confirm: 'Confirm',
    later: 'Later',
    loading: 'One moment…',
    error: 'Something went wrong. Try again.',
    retry: 'Retry',
    optional: 'Optional',
    edit: 'Edit',
    done: 'Done',
  },
};
