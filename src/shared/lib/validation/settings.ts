export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; fields: Record<string, string> };

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;
const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

export interface ProfileInput {
  displayName?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  socials?: {
    twitter?: string;
    instagram?: string;
    behance?: string;
    artstation?: string;
    tiktok?: string;
  };
}

export function validateProfile(raw: unknown): ValidationResult<ProfileInput> {
  const fields: Record<string, string> = {};
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, fields: { _: "Cuerpo inválido" } };
  }
  const b = raw as Record<string, unknown>;
  const out: ProfileInput = {};

  if (b.displayName !== undefined) {
    if (typeof b.displayName !== "string") fields.displayName = "Tipo inválido";
    else if (b.displayName.length > 60) fields.displayName = "Máximo 60 caracteres";
    else out.displayName = b.displayName.trim();
  }
  if (b.username !== undefined) {
    if (typeof b.username !== "string") fields.username = "Tipo inválido";
    else {
      const u = b.username.toLowerCase().trim();
      if (!USERNAME_RE.test(u)) {
        fields.username = "3-30 caracteres: letras minúsculas, números, _";
      } else out.username = u;
    }
  }
  if (b.bio !== undefined) {
    if (typeof b.bio !== "string") fields.bio = "Tipo inválido";
    else if (b.bio.length > 300) fields.bio = "Máximo 300 caracteres";
    else out.bio = b.bio;
  }
  if (b.location !== undefined) {
    if (typeof b.location !== "string") fields.location = "Tipo inválido";
    else if (b.location.length > 80) fields.location = "Máximo 80 caracteres";
    else out.location = b.location.trim();
  }
  if (b.website !== undefined) {
    if (typeof b.website !== "string") fields.website = "Tipo inválido";
    else if (b.website && !URL_RE.test(b.website)) fields.website = "URL inválida";
    else out.website = b.website.trim();
  }
  if (b.socials !== undefined) {
    if (typeof b.socials !== "object" || b.socials === null) {
      fields.socials = "Tipo inválido";
    } else {
      const s = b.socials as Record<string, unknown>;
      const cleaned: ProfileInput["socials"] = {};
      const keys: Array<keyof NonNullable<ProfileInput["socials"]>> = [
        "twitter",
        "instagram",
        "behance",
        "artstation",
        "tiktok",
      ];
      for (const k of keys) {
        const v = s[k];
        if (v === undefined || v === "") continue;
        if (typeof v !== "string") {
          fields[`socials.${k}`] = "Tipo inválido";
          continue;
        }
        if (!URL_RE.test(v)) {
          fields[`socials.${k}`] = "URL inválida";
          continue;
        }
        cleaned[k] = v.trim();
      }
      out.socials = cleaned;
    }
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, value: out };
}

export function validateEmail(value: unknown): ValidationResult<string> {
  if (typeof value !== "string") return { ok: false, fields: { email: "Tipo inválido" } };
  const v = value.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return { ok: false, fields: { email: "Email inválido" } };
  }
  return { ok: true, value: v };
}

export function validatePassword(value: unknown): ValidationResult<string> {
  if (typeof value !== "string") return { ok: false, fields: { newPassword: "Tipo inválido" } };
  if (value.length < 8) {
    return { ok: false, fields: { newPassword: "Mínimo 8 caracteres" } };
  }
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    return { ok: false, fields: { newPassword: "Debe incluir letras y números" } };
  }
  return { ok: true, value };
}

export interface PreferencesInput {
  theme?: "dark" | "light" | "system";
  locale?: "es" | "en";
}

export function validatePreferences(raw: unknown): ValidationResult<PreferencesInput> {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, fields: { _: "Cuerpo inválido" } };
  }
  const b = raw as Record<string, unknown>;
  const out: PreferencesInput = {};
  const fields: Record<string, string> = {};

  if (b.theme !== undefined) {
    if (b.theme === "dark" || b.theme === "light" || b.theme === "system") out.theme = b.theme;
    else fields.theme = "Valor inválido";
  }
  if (b.locale !== undefined) {
    if (b.locale === "es" || b.locale === "en") out.locale = b.locale;
    else fields.locale = "Valor inválido";
  }
  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, value: out };
}

const NOTIF_KEYS = ["likes", "comments", "follows", "saves", "weeklyDigest"] as const;
export type NotificationInput = Partial<Record<(typeof NOTIF_KEYS)[number], boolean>>;

export function validateNotifications(raw: unknown): ValidationResult<NotificationInput> {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, fields: { _: "Cuerpo inválido" } };
  }
  const b = raw as Record<string, unknown>;
  const out: NotificationInput = {};
  const fields: Record<string, string> = {};
  for (const k of NOTIF_KEYS) {
    if (b[k] === undefined) continue;
    if (typeof b[k] !== "boolean") fields[k] = "Tipo inválido";
    else out[k] = b[k] as boolean;
  }
  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, value: out };
}

const PRIVACY_KEYS = ["profilePublic", "showEmail", "allowMessages", "allowFollow"] as const;
export type PrivacyInput = Partial<Record<(typeof PRIVACY_KEYS)[number], boolean>>;

export function validatePrivacy(raw: unknown): ValidationResult<PrivacyInput> {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, fields: { _: "Cuerpo inválido" } };
  }
  const b = raw as Record<string, unknown>;
  const out: PrivacyInput = {};
  const fields: Record<string, string> = {};
  for (const k of PRIVACY_KEYS) {
    if (b[k] === undefined) continue;
    if (typeof b[k] !== "boolean") fields[k] = "Tipo inválido";
    else out[k] = b[k] as boolean;
  }
  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, value: out };
}
