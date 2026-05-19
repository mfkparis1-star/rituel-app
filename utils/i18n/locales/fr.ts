/**
 * French locale — source of truth for Rituel copy.
 *
 * Tone: luxury intimate beauty journal. Soft, feminine, present.
 * Default to "tu" form. "vous" reserved for legal copy only.
 *
 * Keys are flat dotted paths: namespace.section.key
 */
export const fr = {
  onboarding: {
    skip: 'Passer',
    next: 'Continuer',
    start: 'Commencer',
    slide1: {
      kicker: 'BIENVENUE',
      headline: 'Votre journal de beauté\nvous attend.',
      subtitle: "Un espace intime, pensé pour vous. Pas un coach, pas un réseau social — juste votre histoire, jour après jour.",
    },
    slide2: {
      kicker: 'VOTRE RYTHME',
      headline: 'Chaque check-in\ncompte.',
      subtitle: 'Un emoji, une note libre. Rituel se rappelle de chaque instant pour mieux vous accompagner. La Glow Timeline garde votre histoire.',
    },
    slide3: {
      kicker: 'COMMUNAUTÉ',
      headline: 'Inspirée par celles\nqui vous ressemblent.',
      subtitle: "Partagez vos rituels, sauvegardez vos inspirations. Pas de comparaisons, pas d'algorithme agressif — un journal collectif.",
    },
  },

  score: {
    title: 'Rituel Score',
    subtitle: 'Une note douce de ton rythme beauté.',
    levelLabels: {
      grounded: 'Posée',
      flowing: 'Fluide',
      glowing: 'Lumineuse',
      tending: 'Tendre',
      resting: 'Au repos',
    },
    breakdown: {
      checkins: 'Check-ins',
      routines: 'Rituels',
      reflections: 'Réflexions',
      community: 'Communauté',
    },
    note: 'Ton score reflète ton attention à toi-même, pas une performance.',
    backToHome: 'Retour',
  },

  common: {
    back: 'Retour',
    cancel: 'Annuler',
    save: 'Sauvegarder',
    delete: 'Supprimer',
    confirm: 'Confirmer',
    later: 'Plus tard',
    loading: 'Un instant…',
    error: 'Une erreur est survenue. Réessaye.',
    retry: 'Réessayer',
    optional: 'Facultatif',
    edit: 'Modifier',
    done: 'Terminé',
  },
} as const;

// Deep widen: replace every literal string in `typeof fr` with `string`.
// Source of truth structure stays in fr (with `as const`), but EN/TR
// locales can freely use any string for each leaf.
type DeepWidenStrings<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
  ? readonly DeepWidenStrings<U>[]
  : T extends object
  ? { [K in keyof T]: DeepWidenStrings<T[K]> }
  : T;

export type LocaleDict = DeepWidenStrings<typeof fr>;
