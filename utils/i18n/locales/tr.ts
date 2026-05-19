/**
 * Turkish locale — Rituel.
 *
 * Tone: yumuşak, samimi, kadınsı. "Sen" formu kullan — asla "siz".
 * Rituel bir günlüktür, koç değildir hissi her zaman.
 */
import type { LocaleDict } from './fr';

export const tr: LocaleDict = {
  onboarding: {
    skip: 'Atla',
    next: 'Devam et',
    start: 'Başla',
    slide1: {
      kicker: 'HOŞ GELDİN',
      headline: 'Güzellik günlüğün\nseni bekliyor.',
      subtitle: 'Sana özel, samimi bir alan. Bir koç değil, bir sosyal medya değil — sadece senin hikâyen, gün gün.',
    },
    slide2: {
      kicker: 'KENDİ RİTMİN',
      headline: 'Her check-in\nönemli.',
      subtitle: 'Bir emoji, kısa bir not. Rituel her anı hatırlar, sana daha iyi eşlik etmek için. Glow Timeline hikâyeni saklar.',
    },
    slide3: {
      kicker: 'TOPLULUK',
      headline: 'Sana benzeyenlerden\nilham al.',
      subtitle: 'Rituellerini paylaş, ilham aldıklarını sakla. Karşılaştırma yok, agresif algoritma yok — ortak bir günlük.',
    },
  },

  score: {
    title: 'Rituel Skoru',
    subtitle: 'Güzellik ritmin üzerine yumuşak bir not.',
    levelLabels: {
      grounded: 'Dengeli',
      flowing: 'Akışta',
      glowing: 'Işıltılı',
      tending: 'Şefkatli',
      resting: 'Dinlenmede',
    },
    breakdown: {
      checkins: 'Check-in',
      routines: 'Ritueller',
      reflections: 'Yansımalar',
      community: 'Topluluk',
    },
    note: 'Skorun kendine gösterdiğin özeni yansıtır, bir performans değildir.',
    backToHome: 'Geri',
  },

  common: {
    back: 'Geri',
    cancel: 'İptal',
    save: 'Kaydet',
    delete: 'Sil',
    confirm: 'Onayla',
    later: 'Daha sonra',
    loading: 'Bir an…',
    error: 'Bir hata oluştu. Tekrar dene.',
    retry: 'Tekrar dene',
    optional: 'İsteğe bağlı',
    edit: 'Düzenle',
    done: 'Tamam',
  },
};
