// ============================================================
// Types TypeScript correspondant aux tables SQL Server
// (basepfe sur DESKTOP-H7B9HA5)
// Les tableaux sont stockés comme JSON strings dans NVARCHAR(MAX)
// ============================================================

// ── Application Status ──────────────────────────────────────────────────────
export type ApplicationStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "sent"
  | "followed_up"
  | "interview"
  | "declined";

// ── Search Status ───────────────────────────────────────────────────────────
export type SearchStatus = "idle" | "running" | "done" | "error";

// ── Profile ────────────────────────────────────────────────────────────────
export interface Profile {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  linkedinUrl?: string | null;
  location?: string | null;
  /** Stocké en JSON: '["France","Germany"]' */
  targetCountries?: string | null;
  /** Stocké en JSON: '["React","Node.js"]' */
  skills?: string | null;
  /** Stocké en JSON: '["French","English"]' */
  languages?: string | null;
  educationLevel?: string | null;
  fieldOfStudy?: string | null;
  availableFrom?: string | null;
  durationMonths?: number | null;
  cvContent?: string | null;
  cvFileName?: string | null;
  /** Stocké en JSON */
  keywords?: string | null;
  /** Stocké en JSON */
  excludeKeywords?: string | null;
  minMatchScore?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// Helpers pour parser/stringifier les champs JSON tableau
export const parseJsonArray = (value: string | null | undefined): string[] => {
  if (!value) return [];
  try {
    return JSON.parse(value) as string[];
  } catch {
    return [];
  }
};

export const stringifyArray = (arr: string[]): string =>
  JSON.stringify(arr);

// ── Search Session ─────────────────────────────────────────────────────────
export interface SearchSession {
  id: number;
  status?: SearchStatus | null;
  offersFound?: number | null;
  offersAnalyzed?: number | null;
  /** Stocké en JSON */
  sources?: string | null;
  log?: string | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
}

// ── Offer ──────────────────────────────────────────────────────────────────
export interface Offer {
  id: number;
  sessionId?: number | null;
  title: string;
  company: string;
  location?: string | null;
  country?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  description?: string | null;
  /** Stocké en JSON */
  requirements?: string | null;
  matchScore?: number | null;
  matchReason?: string | null;
  status?: ApplicationStatus | null;
  adaptedCv?: string | null;
  coverLetter?: string | null;
  linkedinMessage?: string | null;
  /** Stocké en JSON (objet) */
  aiAnalysis?: string | null;
  postedAt?: string | null;
  deadline?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// ── Application ────────────────────────────────────────────────────────────
export interface Application {
  id: number;
  offerId?: number | null;
  status?: ApplicationStatus | null;
  sentAt?: Date | null;
  followUpAt?: Date | null;
  notes?: string | null;
  response?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// ── LinkedIn Credentials ───────────────────────────────────────────────────
export interface LinkedinCredentials {
  id: number;
  email: string;
  passwordHint?: string | null;
  sessionCookies?: string | null;
  lastConnected?: Date | null;
  isActive?: boolean | null;
  createdAt?: Date | null;
}
