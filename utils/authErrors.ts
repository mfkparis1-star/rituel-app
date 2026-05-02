/**
 * Auth error mapping — localized error messages for Supabase auth errors.
 *
 * Phase 14.5 Step 3: FR-only.
 * Structure ready for FR/EN/TR expansion in a later locale phase.
 */
export type Lang = 'fr' | 'en' | 'tr';

const MESSAGES: Record<string, Record<Lang, string>> = {
  invalid_credentials: {
    fr: 'Email ou mot de passe incorrect.',
    en: 'Invalid email or password.',
    tr: 'E-posta veya şifre hatalı.',
  },
  email_not_confirmed: {
    fr: 'Veuillez confirmer votre email avant de vous connecter.',
    en: 'Please confirm your email before signing in.',
    tr: 'Giriş yapmadan önce e-postanızı onaylayın.',
  },
  user_already_registered: {
    fr: 'Un compte existe déjà avec cet email.',
    en: 'An account already exists with this email.',
    tr: 'Bu e-posta ile zaten bir hesap var.',
  },
  weak_password: {
    fr: 'Le mot de passe doit contenir au moins 6 caractères.',
    en: 'Password must be at least 6 characters.',
    tr: 'Şifre en az 6 karakter olmalı.',
  },
  invalid_email: {
    fr: 'Format d\'email invalide.',
    en: 'Invalid email format.',
    tr: 'Geçersiz e-posta formatı.',
  },
  network: {
    fr: 'Pas de connexion. Vérifiez votre réseau et réessayez.',
    en: 'No connection. Check your network and try again.',
    tr: 'Bağlantı yok. Ağı kontrol edip tekrar deneyin.',
  },
  rate_limit: {
    fr: 'Trop de tentatives. Réessayez dans quelques minutes.',
    en: 'Too many attempts. Try again in a few minutes.',
    tr: 'Çok fazla deneme. Birkaç dakika sonra tekrar deneyin.',
  },
  empty_field: {
    fr: 'Veuillez remplir tous les champs.',
    en: 'Please fill in all fields.',
    tr: 'Lütfen tüm alanları doldurun.',
  },
  reset_sent: {
    fr: 'Un email de réinitialisation a été envoyé.',
    en: 'A reset email has been sent.',
    tr: 'Sıfırlama e-postası gönderildi.',
  },
  signup_check_email: {
    fr: 'Vérifiez votre email pour confirmer votre compte.',
    en: 'Check your email to confirm your account.',
    tr: 'Hesabınızı onaylamak için e-postanızı kontrol edin.',
  },
  unknown: {
    fr: 'Une erreur est survenue. Réessayez.',
    en: 'Something went wrong. Try again.',
    tr: 'Bir hata oluştu. Tekrar deneyin.',
  },
};

/**
 * Map a Supabase error to a localized message.
 * Falls back to "unknown" for unrecognized errors.
 */
export function mapAuthError(error: any, lang: Lang = 'fr'): string {
  if (!error) return MESSAGES.unknown[lang];

  const msg: string = (error.message || '').toLowerCase();
  const code: string = (error.code || error.status || '').toString();

  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return MESSAGES.invalid_credentials[lang];
  }
  if (msg.includes('email not confirmed') || msg.includes('not_confirmed')) {
    return MESSAGES.email_not_confirmed[lang];
  }
  if (msg.includes('already registered') || msg.includes('already_registered') || msg.includes('user_already_exists')) {
    return MESSAGES.user_already_registered[lang];
  }
  if (msg.includes('password') && (msg.includes('short') || msg.includes('characters') || msg.includes('weak'))) {
    return MESSAGES.weak_password[lang];
  }
  if (msg.includes('invalid email') || msg.includes('invalid_email')) {
    return MESSAGES.invalid_email[lang];
  }
  if (msg.includes('network') || msg.includes('failed to fetch') || code === 'NETWORK_ERROR') {
    return MESSAGES.network[lang];
  }
  if (msg.includes('rate') || msg.includes('too many') || code === '429') {
    return MESSAGES.rate_limit[lang];
  }

  return MESSAGES.unknown[lang];
}

/**
 * Helper for known status codes (e.g. 'reset_sent' after resetPasswordForEmail).
 */
export function localizedAuthInfo(code: keyof typeof MESSAGES, lang: Lang = 'fr'): string {
  return MESSAGES[code]?.[lang] ?? MESSAGES.unknown[lang];
}