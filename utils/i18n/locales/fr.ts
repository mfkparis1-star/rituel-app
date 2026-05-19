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

  // Skin profile quiz (Phase 17E)
  skinQuiz: {
    header: {
      stepLabel: 'Question {n} / {total}',
      skip: 'Sauter',
    },
    nav: {
      continue: 'Continuer',
      finish: 'Terminer',
      save: 'Sauvegarder',
      saving: 'Un instant…',
      later: 'Plus tard',
    },
    text: {
      placeholder: 'Optionnel, juste pour toi…',
    },
    q: {
      skin_type: {
        label: 'Comment décrirais-tu ta peau au quotidien ?',
        hint: "Aucune réponse n'est mauvaise.",
        choices: {
          sec: 'Plutôt sèche',
          mixte: 'Mixte',
          gras: 'Plutôt grasse',
          normal: 'Normale',
          sensible: 'Sensible',
          unknown: 'Je ne sais pas',
        },
      },
      concerns: {
        label: "Qu'est-ce qui retient ton attention en ce moment ?",
        hint: "Jusqu'à 3 choix · Facultatif",
        choices: {
          rougeurs: 'Rougeurs',
          secheresse: 'Sécheresse',
          brillance: 'Brillance',
          imperfections: 'Imperfections',
          taches: 'Taches',
          sensibilite: 'Sensibilité',
          fatigue: 'Fatigue',
          unknown: 'Rien en particulier',
        },
      },
      sensitivity: {
        label: 'Ta peau réagit-elle facilement ?',
        hint: 'Aux changements de produit, climat, stress.',
        choices: {
          souvent: 'Souvent',
          parfois: 'Parfois',
          rarement: 'Rarement',
          unknown: 'Je ne sais pas',
        },
      },
      routine_level: {
        label: 'À quoi ressemble ta routine actuelle ?',
        hint: '',
        choices: {
          basique: 'Simple — nettoyant + hydratant',
          intermediaire: 'Intermédiaire — quelques actifs',
          avancee: 'Riche — plusieurs étapes',
          aucune: 'Pas vraiment de routine',
        },
      },
      goal: {
        label: "Qu'aimerais-tu offrir à ta peau ce mois-ci ?",
        hint: "Pas d'objectif chiffré, juste une intention.",
        choices: {
          hydratation: "Plus d'hydratation",
          eclat: "De l'éclat",
          apaisement: "De l'apaisement",
          equilibre: "De l'équilibre",
          aucun: 'Rien de particulier',
        },
      },
      self_note: {
        label: 'Une note pour toi-même ?',
        hint: 'Facultatif · 140 caractères',
      },
    },
    summary: {
      kicker: 'VOICI TON PROFIL',
      title: "Une note sur ta peau, telle qu'elle est aujourd'hui.",
      subtitle: "Rituel s'en souvient pour t'accompagner avec plus de douceur. Tu peux le mettre à jour quand tu veux.",
      empty: "Tu as préféré passer toutes les questions. C'est aussi un choix.",
      noteLabel: 'NOTE',
      rowLabels: {
        skin_type: 'Type de peau',
        concerns: 'Attention',
        sensitivity: 'Sensibilité',
        routine_level: 'Routine',
        goal: 'Intention',
      },
    },
  },

  // Daily skin check-in (Phase 16C)
  checkin: {
    back: 'Retour',
    kicker: 'CHECK-IN DU JOUR',
    title: 'Comment va ta peau ?',
    subtitle: 'Un instant pour toi. Ce signal nous aide à affiner tes recommandations.',
    alreadyToday: "Tu as déjà fait ton check-in aujourd'hui. Tu peux en ajouter un autre si ton ressenti a changé.",
    noteLabel: 'Une note (optionnel)',
    notePlaceholder: 'Hydratation, sommeil, événement…',
    save: 'Enregistrer',
    error: {
      title: 'Enregistrement impossible',
      body: 'Une erreur est survenue. Réessaye dans un instant.',
    },
    emojis: {
      glowing: 'Rayonnante',
      good: 'Bien',
      neutral: 'Neutre',
      tired: 'Fatiguée',
      rough: 'Difficile',
    },
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
