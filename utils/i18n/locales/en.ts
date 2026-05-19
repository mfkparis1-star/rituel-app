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

  skinQuiz: {
    header: {
      stepLabel: 'Question {n} / {total}',
      skip: 'Skip',
    },
    nav: {
      continue: 'Continue',
      finish: 'Finish',
      save: 'Save',
      saving: 'One moment…',
      later: 'Later',
    },
    text: {
      placeholder: 'Optional, just for you…',
    },
    q: {
      skin_type: {
        label: 'How would you describe your skin day to day?',
        hint: 'No wrong answer.',
        choices: {
          sec: 'Rather dry',
          mixte: 'Combination',
          gras: 'Rather oily',
          normal: 'Normal',
          sensible: 'Sensitive',
          unknown: "I'm not sure",
        },
      },
      concerns: {
        label: "What's on your mind these days?",
        hint: 'Up to 3 · Optional',
        choices: {
          rougeurs: 'Redness',
          secheresse: 'Dryness',
          brillance: 'Shine',
          imperfections: 'Breakouts',
          taches: 'Spots',
          sensibilite: 'Sensitivity',
          fatigue: 'Tiredness',
          unknown: 'Nothing in particular',
        },
      },
      sensitivity: {
        label: 'Does your skin react easily?',
        hint: 'To new products, weather, stress.',
        choices: {
          souvent: 'Often',
          parfois: 'Sometimes',
          rarement: 'Rarely',
          unknown: "I'm not sure",
        },
      },
      routine_level: {
        label: 'What does your current routine look like?',
        hint: '',
        choices: {
          basique: 'Simple — cleanser + moisturizer',
          intermediaire: 'Intermediate — a few actives',
          avancee: 'Rich — multiple steps',
          aucune: 'No real routine',
        },
      },
      goal: {
        label: 'What would you like to offer your skin this month?',
        hint: 'No metric goal, just an intention.',
        choices: {
          hydratation: 'More hydration',
          eclat: 'Glow',
          apaisement: 'Calm',
          equilibre: 'Balance',
          aucun: 'Nothing specific',
        },
      },
      self_note: {
        label: 'A note for yourself?',
        hint: 'Optional · 140 characters',
      },
    },
    summary: {
      kicker: 'HERE IS YOUR PROFILE',
      title: 'A note on your skin, as it is today.',
      subtitle: 'Rituel remembers it so you are accompanied with more softness. You can update it whenever you want.',
      empty: "You skipped every question. That's a choice too.",
      noteLabel: 'NOTE',
      rowLabels: {
        skin_type: 'Skin type',
        concerns: 'On your mind',
        sensitivity: 'Sensitivity',
        routine_level: 'Routine',
        goal: 'Intention',
      },
    },
  },

  checkin: {
    back: 'Back',
    kicker: 'TODAY\'S CHECK-IN',
    title: 'How is your skin?',
    subtitle: 'A moment for you. This signal helps us tune your recommendations.',
    alreadyToday: "You've already checked in today. You can add another if your feeling has shifted.",
    noteLabel: 'A note (optional)',
    notePlaceholder: 'Hydration, sleep, an event…',
    save: 'Save',
    error: {
      title: "Couldn't save",
      body: 'Something went wrong. Try again in a moment.',
    },
    emojis: {
      glowing: 'Radiant',
      good: 'Good',
      neutral: 'Neutral',
      tired: 'Tired',
      rough: 'Rough',
    },
  },

  glowTimeline: {
    kicker: 'JOURNAL',
    title: 'Your journey',
    subtitle: 'Every check-in, every analysis, every ritual shared. Your beauty story, day after day.',
    needSignIn: 'Sign in to open your journal.',
    scoreChipLabel: 'This week, you are',
    emptyTitle: 'Your journal begins today',
    emptyCta: 'Do my check-in',
    relative: {
      today: 'Today',
      yesterday: 'Yesterday',
    },
    item: {
      kindAnalysis: 'Skin analysis',
      kindPost: 'Post',
      hintCheckin: 'Hold to delete',
      hintPost: 'Hold to edit or delete',
    },
    actions: {
      checkin: {
        deleteTitle: 'Delete this entry?',
        deleteBody: 'This note will be removed from your journal.',
        delete: 'Delete',
        cancel: 'Cancel',
        errorTitle: 'Error',
        errorBody: "Couldn't delete. Try again in a moment.",
      },
      post: {
        sheetTitle: 'Post',
        edit: 'Edit caption',
        delete: 'Delete',
        cancel: 'Cancel',
        editTitle: 'Edit caption',
        editSave: 'Save',
        editInvalidTitle: 'Invalid caption',
        editInvalidBody: 'The caption must be between 4 and 280 characters.',
        editErrorTitle: 'Error',
        editErrorBody: "Couldn't update. Try again in a moment.",
        deleteTitle: 'Delete this post?',
        deleteBody: 'It will disappear from your journal and from the community.',
        deleteErrorBody: "Couldn't delete. Try again in a moment.",
      },
    },
  },

  auth: {
    brand: 'RITUEL',
    signin: {
      title: 'Sign in',
      subtitle: 'Find your beauty ritual again',
      submit: 'Sign in',
      forgot: 'Forgot password?',
      switchPrompt: "Don't have an account yet?",
      switchLink: 'Sign up',
    },
    signup: {
      title: 'Create account',
      subtitle: 'Start your account to begin',
      submit: 'Create my account',
      switchPrompt: 'Already have an account?',
      switchLink: 'Sign in',
      legalPrefix: 'By signing up, you accept our ',
      legalTerms: 'Terms of Service',
      legalAnd: ' and our ',
      legalPrivacy: 'Privacy Policy',
      legalSuffix: '.',
    },
    fields: {
      nameLabel: 'NAME',
      namePlaceholder: 'Your name',
      emailLabel: 'EMAIL',
      emailPlaceholder: 'you@email.com',
      passwordLabel: 'PASSWORD',
      passwordPlaceholder: '••••••••',
    },
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
