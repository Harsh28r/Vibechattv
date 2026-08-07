export type Gender = "male" | "female" | "other";
export type PrefGender = "any" | Gender;

export type MatchPrefs = {
  gender: Gender;
  lookingFor: PrefGender;
  country: string;
  lookingCountry: string;
  interests: string[];
};

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export const LOOKING_FOR_OPTIONS: { value: PrefGender; label: string }[] = [
  { value: "any", label: "Anyone" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export const COUNTRY_OPTIONS = [
  { code: "ANY", label: "Worldwide" },
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "BR", label: "Brazil" },
  { code: "PH", label: "Philippines" },
  { code: "PK", label: "Pakistan" },
  { code: "BD", label: "Bangladesh" },
  { code: "AE", label: "UAE" },
  { code: "SG", label: "Singapore" },
  { code: "NG", label: "Nigeria" },
] as const;

export const INTEREST_OPTIONS = [
  "Gaming",
  "Music",
  "Movies",
  "Sports",
  "Travel",
  "Food",
  "Art",
  "Tech",
  "Books",
  "Fitness",
  "Pets",
  "Photography",
  "Languages",
  "Other",
] as const;

const STORAGE_KEY = "camify_match_prefs_v2";

export const defaultPrefs: MatchPrefs = {
  gender: "other",
  lookingFor: "any",
  country: "ANY",
  lookingCountry: "ANY",
  interests: [],
};

export function loadPrefs(): MatchPrefs {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPrefs;
    const parsed = JSON.parse(raw) as Partial<MatchPrefs>;
    return {
      gender: parsed.gender ?? defaultPrefs.gender,
      lookingFor: parsed.lookingFor ?? defaultPrefs.lookingFor,
      country: parsed.country ?? defaultPrefs.country,
      lookingCountry: parsed.lookingCountry ?? defaultPrefs.lookingCountry,
      interests: Array.isArray(parsed.interests)
        ? parsed.interests.slice(0, 5)
        : [],
    };
  } catch {
    return defaultPrefs;
  }
}

export function savePrefs(prefs: MatchPrefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function prefsToSearchPayload(prefs: MatchPrefs) {
  return {
    gender: prefs.gender,
    country: prefs.country === "ANY" ? undefined : prefs.country,
    interests: prefs.interests,
    preferences: {
      gender: prefs.lookingFor,
      country: prefs.lookingCountry || "ANY",
    },
  };
}

export const REPORT_REASONS = [
  "Inappropriate behavior",
  "Nudity / explicit",
  "Harassment",
  "Underage suspicion",
  "Spam / scam",
  "Other",
] as const;
