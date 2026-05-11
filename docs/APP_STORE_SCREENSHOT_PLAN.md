# App Store Screenshot Plan — Rituel 1.3.0

## Specs
- iPhone 6.7" (1290 × 2796) — required
- iPhone 6.5" (1284 × 2778) — required
- iPad 12.9" (2048 × 2732) — optional
- All in French (primary locale)
- Then English + Turkish localized after launch

## Story arc (8 screenshots, in order)

### 1. Adaptive Home
**Title:** Votre journal de beauté commence ici
**Subtitle:** Une routine qui s'adapte à votre jour
**Capture:** Home tab with check-in card visible, "Cette semaine" block showing emojis, "À propos de toi" with skin type + memory
**Demo data needed:** at least 3 recent check-ins, profile.memory populated with skin_type

### 2. AI Studio
**Title:** L'intelligence beauté qui vous comprend
**Subtitle:** 5 outils IA personnalisés
**Capture:** AI Studio tab showing all 5 cards (Analyse, AI Studio chat, Maquillage, Optimisation, Compatibilité)
**Demo data:** none required, static UI

### 3. Glow Timeline (Phase 16D — NEW)
**Title:** Votre histoire beauté, jour après jour
**Subtitle:** Chaque rituel, chaque ressenti
**Capture:** Glow Timeline screen with at least 5 entries across 2-3 days (mix of check-ins + 1 analysis milestone + 1 own post)
**Demo data:** populated checkins + memory.last_analysis_summary + 1-2 own posts

### 4. Rituel Score (Phase 16D — NEW)
**Title:** Votre énergie, en douceur
**Subtitle:** Un reflet, pas une note
**Capture:** Score screen with big "76" + "En rituel" label + 5-signal breakdown
**Demo data:** account with high activity to hit "En rituel" tier (51-75)

### 5. Community (Phase 16D — NEW)
**Title:** Inspirée par une communauté qui comprend
**Subtitle:** Pour toi, sélectionné avec soin
**Capture:** Community feed with "Pour toi / Récents" toggle visible at top, 2-3 posts with images, like + bookmark icons
**Demo data:** 5+ posts in feed from diverse skin types

### 6. Saved / Mes favoris (Phase 16D — NEW)
**Title:** Votre tableau d'inspirations
**Subtitle:** Gardez ce qui vous parle
**Capture:** Saved screen with 3-4 saved posts in cream cards
**Demo data:** user has saved 3+ posts

### 7. Routine builder
**Title:** Construisez votre rituel matin et soir
**Subtitle:** Étape par étape, avec vos produits
**Capture:** Routine tab — Matin slot with 4-5 steps showing product_name + brand
**Demo data:** matin routine with 4 well-chosen steps (Nettoyant, Tonique, Sérum, Crème)

### 8. Viral share card (Phase 16E — NEW)
**Title:** Partagez vos découvertes
**Subtitle:** Une carte éditoriale en un geste
**Capture:** iPhone simulator showing iOS share sheet open with the compatibility card preview visible
**Demo data:** completed compatibility check (e.g., Retinol + Vitamine C → Prudence)

## App Store Metadata Copy

### Subtitle (30 chars max)
**FR:** Votre journal beauté intime
**EN:** Your intimate beauty diary
**TR:** Kişisel güzellik günlüğünüz

### Promotional Text (170 chars max)
**FR:** Nouvelle version : votre journal beauté, votre score d'énergie, et une communauté qui vous comprend. Découvrez Rituel autrement.

### Description (4000 chars max)
**FR:** (existing 1.2.0 description + insert these paragraphs after intro)

**Votre journal de beauté quotidien**
Check-in en un emoji, note libre si vous le souhaitez. Rituel se rappelle de chaque instant pour mieux vous accompagner. Pas de streak anxiogène, pas de score à atteindre — juste votre histoire.

**Glow Timeline et votre énergie**
Toutes vos analyses, vos check-ins et vos publications dans une chronologie douce. Votre Rituel Score reflète votre cohérence sans jamais vous juger : Naissant, En éveil, En rituel, Rayonnant.

**Une communauté qui vous ressemble**
Partagez vos rituels, sauvegardez vos inspirations, découvrez d'autres routines compatibles avec votre type de peau. Pas de comparaisons, pas d'algorithme agressif — un journal collectif.

**Partagez vos découvertes**
Transformez votre vérification de compatibilité ou votre routine en une carte éditoriale prête à partager sur Stories. Format luxe, jamais cheap.

### Release Notes (4000 chars max) — 1.3.0
**FR:**
Rituel 1.3.0 — Une mise à jour majeure qui transforme l'app en véritable journal de beauté intime.

NOUVEAUTÉS
- Glow Timeline : votre parcours beauté chronologique
- Rituel Score : reflet doux de votre énergie sur 100
- Communauté V1 : publier, aimer, sauvegarder, découvrir
- Édition et suppression de vos entrées de journal
- Cartes partageables : compatibilité et routine au format Stories
- Découverte personnalisée par type de peau

AMÉLIORATIONS
- Sécurité renforcée sur toutes vos données privées
- Performances accrues sur les écrans communauté et journal
- Cohérence visuelle affinée sur l'ensemble de l'app

Merci d'utiliser Rituel. Votre rituel mérite ce qu'il y a de plus doux.

## Capture process
1. Use iOS Simulator (iPhone 15 Pro Max for 6.7")
2. Run app in production build via TestFlight
3. Seed demo account with the data requirements above
4. Use Cmd+S to capture, or Devices > Screenshot in simulator menu
5. Final assets: 1290×2796 PNG, no status bar overlay needed (simulator chrome OK in App Store Connect)

## Order matters
First 3 screenshots are visible without scrolling on App Store. Lead with Adaptive Home → AI Studio → Glow Timeline to communicate "personal, intelligent, longitudinal" in the first impression.
