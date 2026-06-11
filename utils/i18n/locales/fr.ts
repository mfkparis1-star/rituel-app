/**
 * French locale — source of truth for Rituel copy.
 *
 * Tone: luxury intimate beauty journal. Soft, feminine, present.
 * Default to "tu" form. "vous" reserved for legal copy only.
 *
 * Keys are flat dotted paths: namespace.section.key
 */
export const fr = {
  tabs: {
    home: 'Accueil',
    products: 'Produits',
    studio: 'Studio IA',
    community: 'Communauté',
    profile: 'Profil',
  },
  compatibility: {
    title: 'Compatibilité',
    slot1Label: 'Actif 1',
    slot2Label: 'Actif 2',
    slotEmpty: 'Choisir un actif',
    choosePrompt1: 'Choisis le premier actif à vérifier',
    choosePrompt2: 'Choisis le second actif',
    newCheck: 'Nouvelle vérification',
    reset: 'Réinitialiser',
    share: 'Partager',
    shareFallback1: 'J\'ai vérifié la compatibilité de mes actifs sur Rituel ✦',
    shareFallback2: 'Découvre si tes actifs font bon ménage sur Rituel.',
    tipLabel: 'Conseil',
    verdict: {
      compatible: 'Compatibles',
      caution: 'Avec précaution',
      avoid: 'À éviter ensemble',
    },
  },
  archive: {
    title: 'Mon archive',
    subtitle: 'Tes produits, ton suivi',
    searchPlaceholder: 'Rechercher un produit…',
    stats: {
      total: 'Total',
      active: 'Actifs',
      finished: 'Terminés',
    },
    filters: {
      all: 'Tous',
      active: 'Actifs',
      finished: 'Terminés',
      stocked: 'En réserve',
    },
    emptyTitle: 'Ton archive est vide',
    emptySubtitle: 'Ajoute ton premier produit pour commencer ton suivi.',
    swipeDelete: 'Supprimer',
    deleteAlert: {
      title: 'Supprimer ce produit ?',
      cancel: 'Annuler',
      confirm: 'Supprimer',
      errorTitle: 'Oups',
      errorBody: 'La suppression a échoué. Réessaie.',
    },
  },
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
    ai: {
      ctaLabel: 'Analyse complète avec l\'IA',
      ctaSubtitle: 'Recommandations personnalisées · Profil détaillé',
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

  skinProfileAnalysis: {
    title: 'Ton analyse personnalisée',
    kicker: 'PROFIL DE PEAU',
    loading: 'Analyse en cours…',
    loadingSub: 'Quelques secondes pour interpréter tes réponses.',
    error: {
      title: 'Analyse impossible',
      body: 'Une erreur est survenue. Réessaie dans un instant.',
      retry: 'Réessayer',
    },
    empty: {
      title: 'Profil de peau manquant',
      body: 'Complète d\'abord le questionnaire pour recevoir ton analyse.',
      cta: 'Faire le questionnaire',
    },
    parametersHeader: 'Ta peau en cinq nuances',
    parameters: {
      hydration: 'Hydratation',
      luminosity: 'Éclat',
      sensitivity: 'Sensibilité',
      poreVisibility: 'Pores',
      pigmentation: 'Uniformité',
    },
    levels: {
      low: 'Faible',
      medium: 'Moyenne',
      high: 'Élevée',
    },
    narrativeHeader: 'Ton portrait',
    recommendationsHeader: 'Pistes pour toi',
    disclaimer: 'Conseils cosmétiques, pas un diagnostic médical.',
    back: 'Retour',
    updatedAt: 'Mis à jour le {date}',
    refresh: 'Refaire l\'analyse',
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

  // Glow Timeline (Phase 16D)
  glowTimeline: {
    kicker: 'JOURNAL',
    title: 'Ton parcours',
    subtitle: 'Chaque check-in, chaque analyse, chaque rituel partagé. Ton histoire beauté, jour après jour.',
    needSignIn: 'Connecte-toi pour ouvrir ton journal.',
    scoreChipLabel: 'Cette semaine, tu es',
    emptyTitle: 'Ton journal commence aujourd\u2019hui',
    emptyCta: 'Faire mon check-in',
    relative: {
      today: 'Aujourd\u2019hui',
      yesterday: 'Hier',
    },
    item: {
      kindAnalysis: 'Analyse de peau',
      kindPost: 'Publication',
      hintCheckin: 'Maintiens pour supprimer',
      hintPost: 'Maintiens pour modifier ou supprimer',
    },
    actions: {
      checkin: {
        deleteTitle: 'Supprimer cette entrée ?',
        deleteBody: 'Cette note sera retirée de ton journal.',
        delete: 'Supprimer',
        cancel: 'Annuler',
        errorTitle: 'Erreur',
        errorBody: 'Suppression impossible. Réessaye dans un instant.',
      },
      post: {
        sheetTitle: 'Publication',
        edit: 'Modifier la légende',
        delete: 'Supprimer',
        cancel: 'Annuler',
        editTitle: 'Modifier la légende',
        editSave: 'Enregistrer',
        editInvalidTitle: 'Légende invalide',
        editInvalidBody: 'La légende doit faire entre 4 et 280 caractères.',
        editErrorTitle: 'Erreur',
        editErrorBody: 'Modification impossible. Réessaye dans un instant.',
        deleteTitle: 'Supprimer cette publication ?',
        deleteBody: 'Elle disparaîtra de ton journal et de la communauté.',
        deleteErrorBody: 'Suppression impossible. Réessaye dans un instant.',
      },
    },
  },

  // Auth — sign-in / sign-up forms (Phase 19.6a)
  auth: {
    brand: 'RITUEL',
    signin: {
      title: 'Connexion',
      subtitle: 'Retrouve ton rituel beauté',
      submit: 'Se connecter',
      forgot: 'Mot de passe oublié ?',
      switchPrompt: 'Pas encore de compte ?',
      switchLink: "S'inscrire",
    },
    signup: {
      title: 'Inscription',
      subtitle: 'Crée ton compte pour commencer',
      submit: 'Créer mon compte',
      switchPrompt: 'Déjà inscrite ?',
      switchLink: 'Se connecter',
      // Legal copy keeps the vous form intentionally.
      legalPrefix: 'En vous inscrivant, vous acceptez nos ',
      legalTerms: 'Conditions générales',
      legalAnd: ' et notre ',
      legalPrivacy: 'Politique de confidentialité',
      legalSuffix: '.',
    },
    fields: {
      nameLabel: 'NOM',
      namePlaceholder: 'Votre nom',
      emailLabel: 'EMAIL',
      emailPlaceholder: 'vous@email.com',
      passwordLabel: 'MOT DE PASSE',
      passwordPlaceholder: '••••••••',
    },
    divider: {
      or: 'ou',
    },
    google: {
      button: 'Continuer avec Google',
    },
    apple: {
      button: 'Continuer avec Apple',
    },
      profile: {
      namePlaceholder: 'Ton prénom',
      skinTypePrefix: 'Peau ',
      premiumBadge: 'RITUEL PRO',
      stats: {
        products: 'Produit',
        analysis: 'Analyse',
        routine: 'Routine',
      },
      analysis: {
        kicker: 'ANALYSE',
        title: "Mettre à jour l'analyse",
        subtitle: 'Garde tes recommandations synchronisées avec ta peau.',
        cta: 'Lancer',
      },
      credits: {
        title: 'Crédits IA',
        loading: 'Chargement...',
        availableOne: '{n} crédit disponible',
        availableMany: '{n} crédits disponibles',
      },
      premium: {
        kicker: 'PREMIUM',
        title: 'Active toute la puissance IA',
        subtitle: 'Analyses complètes, routines IA, crédits et recommandations premium.',
        cta: 'Découvrir Premium',
        restoreTitle: 'Restaurer mes achats',
        restoreSubtitle: 'Tu as déjà acheté Rituel Pro ?',
        restoreLoading: 'Restauration en cours...',
      },
      sections: {
        subscription: 'ABONNEMENT',
        forYou: 'POUR TOI',
        inMyRitual: 'DANS MON RITUEL',
        discoverSkin: 'DÉCOUVRIR MA PEAU',
        quickAccess: 'ACCÈS RAPIDE',
      },
      subscription: {
        rituelProTitle: 'Rituel Pro',
      },
      reco: {
        kicker: 'RECOMMANDATION',
        title: 'Commence ton rituel ce soir',
        subtitle: 'Une routine apaisante pour prendre soin de toi.',
      },
      skinQuiz: {
        title: 'Mon profil de peau',
        subtitle: 'Quelques questions douces pour mieux t\'accompagner.',
        emptyTitle: 'Complète ton profil de peau',
        emptySubtitle: 'Pour des recommandations vraiment personnalisées',
        update: 'Mettre à jour',
        summary: {
          skinType: 'Peau {value}',
          sensitivity: 'Sensibilité {value}',
          goal: 'Objectif : {value}',
        },
      },
      rows: {
        journal: { title: 'Mon journal', subtitle: 'Ton parcours beauté, jour après jour' },
        energy: { title: 'Mon énergie', subtitle: 'Ton reflet du moment' },
        favorites: { title: 'Mes favoris', subtitle: 'Tes inspirations sauvegardées' },
        archive: { title: 'Mon archive', subtitle: 'Tes produits, ton suivi' },
        ritual: { title: 'Mon rituel', subtitle: 'Routine matin et soir' },
        signOut: { title: 'Se déconnecter', subtitle: 'Quitter cette session' },
        deleteAccount: { title: 'Supprimer mon compte', subtitle: 'Action définitive — toutes tes données seront effacées' },
      },
    },
    alerts: {
      signOut: {
        title: 'Déconnexion',
        body: 'Vous voulez vraiment vous déconnecter ?',
        cancel: 'Annuler',
        confirm: 'Se déconnecter',
      },
      deleteAccount: {
        title: 'Supprimer mon compte',
        body: "Cette action est définitive. Toutes tes données — produits, routines, analyses, achats — seront supprimées.\n\nTon abonnement Apple, s'il existe, continue d'être facturé jusqu'à la prochaine date de renouvellement. Tu peux l'annuler depuis Réglages > Apple ID > Abonnements.",
        cancel: 'Annuler',
        continue: 'Continuer',
        confirmTitle: 'Confirmer la suppression',
        confirmBody: 'Es-tu absolument sûr ? Cette action ne peut pas être annulée.',
        confirmCancel: 'Annuler',
        confirmDelete: 'Supprimer définitivement',
        errorTitle: 'Suppression impossible',
        errorBody: 'Une erreur est survenue. Réessaye dans un instant ou contacte-nous.',
        successTitle: 'Compte supprimé',
        successBody: "Toutes tes données ont été supprimées. Merci d'avoir essayé Rituel.",
        retryTitle: 'Suppression impossible',
        retryBody: 'Une erreur est survenue. Réessaye dans un instant.',
      },
      restore: {
        successTitle: 'Achats restaurés',
        successBody: 'Ton abonnement Rituel Pro est actif.',
        emptyTitle: 'Aucun achat trouvé',
        emptyBody: "Nous n'avons pas trouvé d'achat actif lié à ton compte.",
        errorTitle: 'Restauration impossible',
        errorBody: 'Une erreur est survenue. Réessaye plus tard.',
      },
      avatar: {
        permissionTitle: 'Accès aux photos refusé',
        permissionBody: "Active l'accès aux photos dans Réglages pour ajouter une photo de profil.",
        permissionCancel: 'Annuler',
        permissionOpenSettings: 'Ouvrir Réglages',
        uploadErrorTitle: 'Erreur',
        uploadErrorBody: 'Téléchargement impossible. Réessaye dans un instant.',
      },
      name: {
        updateErrorTitle: 'Erreur',
        updateErrorBody: 'Mise à jour impossible.',
      },
      subscription: {
        activeUntil: 'Actif jusqu\u2019au {date}',
        activeFallback: 'Abonnement actif',
      },
      oauth: {
        errorTitle: 'Connexion impossible',
        errorBody: 'Une erreur est survenue. Réessaie.',
        cancelledTitle: 'Connexion annulée',
        cancelledBody: 'Tu peux réessayer quand tu veux.',
      },
    },
},

  // Saved / favorites screen (Phase 19.7)
  saved: {
    needSignIn: 'Connecte-toi pour voir tes favoris.',
    back: 'Retour',
    kicker: 'INSPIRATIONS',
    title: 'Mes favoris',
    subtitle: 'Les rituels et les inspirations que tu as choisis de garder.',
    emptyTitle: 'Ton tableau d\u2019inspirations',
    anonymous: 'Anonyme',
    justNow: 'à l\u2019instant',
  },

  // Product discovery — "Dans son rituel" (Phase 19.7)
  productDiscovery: {
    kicker: 'DANS LES RITUELS',
    titleFallback: 'Produit',
    emptyTitle: 'Pas encore partagé',
    othersLabel: 'EGALEMENT DANS CE RITUEL',
    memberFallback: 'Membre',
    justNow: 'à l\u2019instant',
  },

  // Add product screen (Phase 19.7)
  // categories.* keys are the FR canonical DB values (no migration);
  // only the displayed label is translated.
  addProduct: {
    kicker: 'ARCHIVE',
    title: 'Ajouter un produit',
    methodManual: 'Saisie manuelle',
    brandLabel: 'MARQUE',
    nameLabel: 'NOM DU PRODUIT',
    categoryLabel: 'CATÉGORIE',
    statusLabel: 'STATUT',
    save: 'Enregistrer',
    errorSignIn: 'Connectez-vous pour enregistrer.',
    errorEmpty: 'Veuillez remplir tous les champs.',
    authAlert: {
      title: 'Connexion requise',
      body: 'Connectez-vous pour ajouter un produit à votre archive.',
      cancel: 'Annuler',
      signIn: 'Se connecter',
    },
    statuses: { active: 'En cours', stocked: 'En stock', finished: 'Terminé' },
    categories: {
      Nettoyant: 'Nettoyant', Hydratant: 'Hydratant', 'Sérum': 'Sérum',
      SPF: 'SPF', Tonique: 'Tonique', Masque: 'Masque',
      Maquillage: 'Maquillage', Parfum: 'Parfum', Corps: 'Corps', Cheveux: 'Cheveux',
    },
  },

  // Paywall / premium upsell (Phase 19.7)
  paywall: {
    heroLabel: 'RITUEL PREMIUM',
    heroTitle: 'Active toute la puissance de Rituel',
    heroSub: 'Analyses complètes, recommandations IA et accès premium.',
    benefits: {
      analyses: 'Analyses IA complètes',
      reco: 'Recommandations personnalisées',
      unlimited: 'Accès illimité à toutes les fonctionnalités',
    },
    plans: {
      monthlyTitle: 'Mensuel',
      yearlyTitle: 'Annuel',
      yearlyHint: 'Soit 1,49 €/mois',
      badge: 'MEILLEURE OFFRE',
    },
    continue: 'Continuer',
    restore: 'Restaurer mes achats',
    compliance: 'Abonnement renouvelé automatiquement sauf annulation 24h avant la fin de la période en cours. Annulation possible à tout moment depuis votre compte App Store.',
    legalTerms: 'Conditions',
    legalPrivacy: 'Confidentialité',
    alerts: {
      welcomeTitle: 'Bienvenue dans Rituel Premium',
      welcomeBody: 'Tu as maintenant accès à toutes les fonctionnalités premium.',
      receivedTitle: 'Achat reçu',
      receivedBody: 'Ton abonnement sera activé sous peu.',
      errorTitle: 'Achat impossible',
      errorBody: 'Une erreur est survenue. Réessaie dans un instant.',
      restoreSuccessTitle: 'Achats restaurés',
      restoreSuccessBody: 'Ton abonnement Rituel Premium est actif.',
      restoreEmptyTitle: 'Aucun achat trouvé',
      restoreEmptyBody: "Nous n'avons pas trouvé d'achat actif lié à ton compte.",
      restoreErrorTitle: 'Restauration impossible',
      restoreErrorBody: 'Une erreur est survenue. Réessaye dans un instant.',
    },
  },

  // AI Studio hub (Phase 19.8)
  aiStudio: {
    kicker: 'STUDIO IA',
    title: 'Tes outils beauté',
    subtitle: 'Cinq expériences IA pour révéler ta peau',
    hero: {
      label: 'ANALYSE IA',
      title: 'Analyse de peau IA',
      subtitle: 'Détecte ton type de peau, tes besoins et les produits manquants.',
      cta: 'Commencer',
    },
    tools: {
      makeup: { label: 'MAQUILLAGE', title: 'Studio Maquillage', description: 'Looks personnalisés selon ton événement.' },
      routine: { label: 'ROUTINE', title: 'Mon rituel', description: 'Compose et optimise ta routine matin et soir.' },
      compatibility: { label: 'INGRÉDIENTS', title: 'Compatibilité ingrédients', description: 'Vérifie si tes produits font bon ménage.' },
    },
    history: {
      title: 'Mes derniers résultats',
      justNow: "à l'instant",
      typeMakeup: 'Maquillage',
      typeRoutine: 'Routine',
      typeSkin: 'Analyse de peau',
    },
    premium: {
      subtitle: 'Analyses illimitées, routines IA et recommandations personnalisées.',
      label: 'PREMIUM',
      title: 'Débloque tout',
      cta: 'Passer Premium',
    },
  },

  // Home / dashboard (Phase 19.10) — built across 3 slices.
  home: {
    greeting: { morning: 'Bonjour', afternoon: 'Bel après-midi', evening: 'Bonsoir' },
    subtitle: 'Prête pour ton rituel beauté ?',
    checkin: { label: 'CHECK-IN DU JOUR', title: 'Comment va ta peau aujourd\u2019hui ?', subtitle: '10 secondes pour ajuster ton rituel du jour.' },
    sections: {
      today: 'Aujourd\u2019hui',
      thisWeek: 'Cette semaine',
      aboutYou: 'À propos de toi',
      selectedForYou: 'Sélectionné pour toi',
      seeAll: 'Voir tout →',
    },
    analysisHero: {
      label: 'ANALYSE IA',
      title: 'Refais ton analyse',
      subtitle: 'Tes besoins évoluent. Une nouvelle photo, des conseils mis à jour.',
      cta: 'Lancer l\u2019analyse',
    },
      reflection: {
      label: 'RÉFLEXION DU JOUR',
      prompt: 'Recevez une réflexion personnelle sur votre peau et votre rituel.',
      receive: 'Recevoir ma réflexion',
      another: 'Une autre réflexion',
      loading: 'Un instant…',
      tomorrow: 'Une nouvelle réflexion demain.',
    },
    today: {
      waiting: 'Ta peau attend son rituel',
      advice: {
        glowing: 'Profite. Garde ta routine telle quelle aujourd\u2019hui.',
        good: 'Routine de base. Hydratation + SPF.',
        neutral: 'Ajoute un sérum apaisant ce soir.',
        tired: 'Allège : nettoyant doux + crème riche, pas d\u2019actifs ce soir.',
        rough: 'Pause des actifs. Crème barrière + masque hydratant.',
        none: 'Un check-in de 10 secondes suffit pour ajuster tes conseils du jour.',
      },
    },
    week: {
      emptyTitle: 'Ton rythme commence ici',
      emptySub: 'Fais ton premier check-in pour construire ton suivi beauté de la semaine.',
    },
    about: {
      skinTypeLabel: 'TYPE DE PEAU',
      observationsLabel: 'OBSERVATIONS',
      routineLabel: 'ROUTINE',
      routineStepsOne: '{n} étape',
      routineStepsMany: '{n} étapes',
      routineEmpty: 'Pas encore configurée',
      emptyTitle: 'Rituel apprend à te connaître',
      emptySub: 'Lance ta première analyse pour adapter tes conseils à ta peau, ton rythme et tes produits.',
      analyzeCta: 'Analyser ma peau',
    },
},

  // Skin analysis AI flow (Phase 19.11) — UI only.
  // AI result content + skin-type label come from utils/skinAnalysis.ts
  // (already FR/EN/TR aware via the lang param).
  skinAnalysis: {
    title: 'Analyse IA de votre peau',
    tipsLabel: 'POUR UN MEILLEUR RÉSULTAT',
    tips: { light: 'Lumière naturelle', noMakeup: 'Sans maquillage', centered: 'Visage centré' },
    takePhoto: 'Prendre une photo',
    fromGallery: 'Choisir depuis la galerie',
    loadingTitle: 'Analyse en cours…',
    loadingSub: 'Notre IA examine votre peau',
    errorTitle: 'Analyse impossible',
    errorFallback: 'Une erreur est survenue. Réessayez.',
    retry: 'Réessayer',
    skinTypePrefix: 'Peau ',
    sections: { issues: 'Problèmes détectés', recommendations: 'Recommandations', missing: 'Produits manquants' },
    newAnalysis: 'Nouvelle analyse',
    permission: {
      title: 'Permission requise',
      camera: "Veuillez autoriser l'accès à la caméra.",
      photos: "Veuillez autoriser l'accès aux photos.",
    },
  },

  // Post create / share ritual (Phase 19.12)
  // emotions.* keys are FR canonical DB values (posts.emotion); only the
  // displayed chip label is translated. No migration.
  postNew: {
    needSignIn: 'Connecte-toi pour partager ton rituel.',
    back: 'Retour',
    kicker: 'NOUVEAU RITUEL',
    title: 'Partage ton instant',
    subtitle: 'Une note, une photo, un rituel. Ton journal beauté est privé par défaut, mais ce que tu publies ici est partagé avec la communauté Rituel.',
    addPhoto: 'Ajouter une photo',
    addPhotoSub: 'Optionnel · format portrait',
    noteLabel: 'Ta note',
    notePlaceholder: 'Comment se sent ta peau aujourd\u2019hui ? Quel rituel as-tu suivi ?',
    emotionLabel: 'Comment t\'es-tu sentie ?',
    emotionHint: 'Facultatif',
    productsLabel: 'PRODUITS DE TON RITUEL',
    productsHint: 'Touche pour retirer · Facultatif',
    publish: 'Publier',
    emotions: {
      Apaisant: 'Apaisant', 'Réconfortant': 'Réconfortant', Lumineux: 'Lumineux',
      'Énergisant': 'Énergisant', Fragile: 'Fragile', Doux: 'Doux',
    },
    alerts: {
      permissionTitle: 'Accès aux photos refusé',
      permissionBody: 'Active l\u2019accès aux photos dans Réglages pour ajouter une image à ta publication.',
      permissionCancel: 'Annuler',
      permissionOpenSettings: 'Ouvrir Réglages',
      uploadErrorTitle: 'Erreur',
      uploadErrorBody: 'Téléchargement de l\u2019image impossible. Réessaye.',
      publishErrorTitle: 'Erreur',
      publishErrorBody: 'Publication impossible. Réessaye dans un instant.',
    },
  },

  community: {
    title: 'Communauté',
    subtitle: 'Découvrez les routines des femmes comme vous',
    discovery: {
      pourToi: 'Pour toi',
      recents: 'Récents',
    },
    fallbackHint: 'On affine tes inspirations à mesure que la communauté grandit.',
    filters: {
      all: 'Tous',
      dry: 'Sèche',
      oily: 'Grasse',
      combination: 'Mixte',
      normal: 'Normale',
    },
    skinLabel: {
      dry: 'Peau sèche',
      oily: 'Peau grasse',
      combination: 'Peau mixte',
      normal: 'Peau normale',
    },
    empty: {
      title: 'Pas encore de routines',
      subtitle: 'Les routines partagées par la communauté apparaîtront ici.',
    },
    memberFallback: 'Membre',
    anonymous: 'Anonyme',
    productsUsed: 'PRODUITS UTILISÉS',
    likes: 'j\'aime',
    translate: {
      action: 'Traduire',
      loading: 'Traduction...',
      original: 'Original',
    },
    alerts: {
      menuTitle: 'Publication',
      editCaption: 'Modifier la légende',
      delete: 'Supprimer',
      close: 'Fermer',
      cancel: 'Annuler',
      save: 'Enregistrer',
      invalidCaptionTitle: 'Légende invalide',
      invalidCaptionBody: 'La légende doit faire entre 4 et 280 caractères.',
      errorTitle: 'Erreur',
      editError: 'Modification impossible. Réessaye dans un instant.',
      deleteConfirmTitle: 'Supprimer cette publication ?',
      deleteConfirmBody: 'Elle disparaîtra de la communauté.',
      deleteError: 'Suppression impossible. Réessaye dans un instant.',
    },
  },
  routine: {
    title: 'Ma Routine',
    subtitle: 'Construisez une routine simple et cohérente.',
    segment: { morning: 'Matin', evening: 'Soir' },
    empty: {
      title: 'Votre routine est prête à être construite',
      addStep: '+ Ajouter une étape',
    },
    swipeDelete: 'Supprimer',
    optimizeCta: 'Optimiser avec l\'IA',
    shareCta: 'Partager ma routine',
    addModal: {
      kickerMorning: 'ROUTINE MATIN',
      kickerEvening: 'ROUTINE SOIR',
      title: 'Nouvelle étape',
      productLabel: 'NOM DU PRODUIT',
      brandLabel: 'MARQUE (optionnel)',
      save: 'Enregistrer',
    },
    optimizeModal: {
      kicker: 'OPTIMISATION IA',
      title: 'Ta routine, mieux pensée',
      loading: 'Analyse en cours...',
      errorTitle: 'Oups',
      retry: 'Réessayer',
      sectionImprovements: 'AMÉLIORATIONS',
      sectionMissing: 'CATÉGORIES MANQUANTES',
      sectionRecommendations: 'RECOMMANDATIONS',
      close: 'Fermer',
    },
    alerts: {
      signInTitle: 'Connexion requise',
      signInManageBody: 'Connectez-vous pour gérer votre routine.',
      signInAddBody: 'Connectez-vous pour ajouter une étape.',
      cancel: 'Annuler',
      signInAction: 'Se connecter',
      deleteStepTitle: 'Supprimer l\'étape',
      deleteStepBody: 'Voulez-vous supprimer "{name}" ?',
      delete: 'Supprimer',
      errorTitle: 'Erreur',
      deleteError: 'Suppression impossible.',
      unlockError: 'Impossible de débloquer l\'optimisation. Réessaye dans un instant.',
    },
  },
  makeup: {
    hero: {
      kicker: 'STUDIO MAQUILLAGE',
      title: 'Découvre ton maquillage parfait',
      ctaContinue: 'Continuer',
      ctaChoose: 'Choisis un événement',
    },
    occasionSection: 'Choisis l\'événement',
    continueBtn: 'Continuer',
    howItWorks: 'Comment ça marche',
    features: {
      0: { label: 'ARCHIVE', title: 'Utilise ton archive', description: 'L\'IA suggère des looks à partir de tes produits.' },
      1: { label: 'COMPLET', title: 'Produits manquants', description: 'Découvre ce qu\'il te faut pour réaliser le look.' },
      2: { label: 'PERSONNALISÉ', title: 'Adapté à l\'événement', description: 'Chaque suggestion correspond à ton occasion.' },
    },
    selfie: {
      title: 'Ajoute un selfie',
      remove: 'Retirer',
      generate: 'Générer mes looks',
      skip: 'Continuer sans selfie',
    },
    generating: 'Création de tes looks...',
    result: {
      title: 'Tes 3 looks',
      lookPrefix: 'LOOK',
      steps: 'ÉTAPES',
      products: 'PRODUITS',
      toComplete: 'À COMPLÉTER',
      restart: 'Recommencer',
    },
    errorTitle: 'Oups',
    retry: 'Réessayer',
    alerts: {
      permissionTitle: 'Autorisation requise',
      cameraPermission: 'Veuillez autoriser l\'accès à la caméra.',
      galleryPermission: 'Veuillez autoriser l\'accès à la photothèque.',
      addSelfieTitle: 'Ajouter un selfie',
      addSelfieBody: 'Choisis comment tu veux ajouter ta photo.',
      takeSelfie: 'Prendre un selfie',
      chooseGallery: 'Choisir depuis la galerie',
      cancel: 'Annuler',
      chooseOccasionTitle: 'Choisis un événement',
    },
  },
  common: {
    time: {
    justNow: 'à l\'instant',
    minutesAgo: 'il y a {n} min',
    hoursAgo: 'il y a {n} h',
    daysAgo: 'il y a {n} j',
    },
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
