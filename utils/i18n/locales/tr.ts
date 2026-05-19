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

  skinQuiz: {
    header: {
      stepLabel: 'Soru {n} / {total}',
      skip: 'Atla',
    },
    nav: {
      continue: 'Devam et',
      finish: 'Bitir',
      save: 'Kaydet',
      saving: 'Bir an…',
      later: 'Daha sonra',
    },
    text: {
      placeholder: 'İsteğe bağlı, sadece sana özel…',
    },
    q: {
      skin_type: {
        label: 'Cildini günlük olarak nasıl tanımlarsın?',
        hint: 'Yanlış cevap yok.',
        choices: {
          sec: 'Daha çok kuru',
          mixte: 'Karma',
          gras: 'Daha çok yağlı',
          normal: 'Normal',
          sensible: 'Hassas',
          unknown: 'Emin değilim',
        },
      },
      concerns: {
        label: 'Bu aralar dikkatini ne çekiyor?',
        hint: 'En fazla 3 · İsteğe bağlı',
        choices: {
          rougeurs: 'Kızarıklık',
          secheresse: 'Kuruluk',
          brillance: 'Parlama',
          imperfections: 'Sivilceler',
          taches: 'Lekeler',
          sensibilite: 'Hassasiyet',
          fatigue: 'Yorgunluk',
          unknown: 'Özel bir şey yok',
        },
      },
      sensitivity: {
        label: 'Cildin kolay tepki veriyor mu?',
        hint: 'Ürün değişikliği, hava, stres karşısında.',
        choices: {
          souvent: 'Sık sık',
          parfois: 'Bazen',
          rarement: 'Nadiren',
          unknown: 'Emin değilim',
        },
      },
      routine_level: {
        label: 'Şu anki rutinin nasıl?',
        hint: '',
        choices: {
          basique: 'Basit — temizleyici + nemlendirici',
          intermediaire: 'Orta — birkaç aktif',
          avancee: 'Zengin — birden fazla adım',
          aucune: 'Belirli bir rutinim yok',
        },
      },
      goal: {
        label: 'Bu ay cildine ne sunmak istersin?',
        hint: 'Sayısal hedef değil, sadece bir niyet.',
        choices: {
          hydratation: 'Daha fazla nem',
          eclat: 'Işıltı',
          apaisement: 'Yatışma',
          equilibre: 'Denge',
          aucun: 'Özel bir şey değil',
        },
      },
      self_note: {
        label: 'Kendine bir not?',
        hint: 'İsteğe bağlı · 140 karakter',
      },
    },
    summary: {
      kicker: 'İŞTE PROFİLİN',
      title: 'Cildine dair bir not, bugün olduğu gibi.',
      subtitle: 'Rituel bunu hatırlar, sana daha yumuşak eşlik etmek için. İstediğin zaman güncelleyebilirsin.',
      empty: 'Tüm soruları geçmeyi tercih ettin. Bu da bir seçim.',
      noteLabel: 'NOT',
      rowLabels: {
        skin_type: 'Cilt tipi',
        concerns: 'Dikkat',
        sensitivity: 'Hassasiyet',
        routine_level: 'Rutin',
        goal: 'Niyet',
      },
    },
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
