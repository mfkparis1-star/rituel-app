# Optical Intelligence Layer

**Statut:** Planifié — Phase 20 / 21
**Type:** Couche silencieuse de précision optique (silent optical accuracy layer)

## Ce que ce N'EST PAS
- **PAS** un nouvel écran « analyse scientifique ».
- **PAS** un optimiseur clinique / dermatologique.
- **PAS** une leçon de physique visible pour l'utilisateur.

## Décision produit
Rituel ne deviendra pas un clinical optimizer. La physique optique reste
**entièrement en arrière-plan** : son seul rôle est de rendre les flux IA
existants (Skin Analysis, Makeup, Glow) plus cohérents et plus « premium ».
On n'ajoute aucune surface produit nouvelle.

## Critère de réussite : l'invisibilité
L'utilisateur ne voit jamais la physique. Il perçoit seulement des résultats
plus cohérents d'une photo à l'autre, et une sensation plus premium. Si la
couche devient visible, elle a échoué.

## Architecture (pipeline)
1. **Photo captured** — flux caméra/galerie existant, inchangé.
2. **On-device normalization**
   - white balance
   - exposure normalization
3. **Optical signal extraction**
   - redness
   - shine / specular reflection
   - tone uniformity
4. **Hidden context injected into `claude-proxy`** — les signaux deviennent un
   contexte caché ajouté au prompt (jamais affiché).
5. **More consistent AI result** — la sortie IA varie moins selon l'éclairage
   ou l'appareil.

## Périmètre par phase
### Phase 20 — Skin Analysis
- Normalisation de la photo + extraction des signaux optiques.
- Injection du contexte caché dans le flux Skin Analysis.

### Phase 21 — Glow & Makeup
- Glow Timeline : « light-language » (cohérence d'éclairage entre snapshots).
- Makeup : suggestions tenant compte de l'éclairage / métamérisme.

## Garde-fous (guardrails)
- No clinical / dermatology positioning.
- No visible physics lesson.
- No medical claims.
- No "feelinmyskin"-style optimizer drift.
- ADN « luxury intimate beauty journal » préservé : intime, élégant,
  réflexif, ton soft luxury. Pas de registre clinique ni performance.

## Notes
- Couche placée AVANT l'appel IA (pré-traitement), pas après.
- Aucune migration DB requise par le concept lui-même ; à ré-évaluer au moment
  de l'implémentation.
- Hors périmètre du sprint build-free actuel (Phase 19D). Document de vision.
