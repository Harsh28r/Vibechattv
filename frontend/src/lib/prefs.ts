export type Gender = "male" | "female" | "other";
export type PrefGender = "any" | Gender;

export type MatchPrefs = {
  gender: Gender;
  lookingFor: PrefGender;
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

const STORAGE_KEY = "camify_match_prefs_v1";

export const defaultPrefs: MatchPrefs = {
  gender: "other",
  lookingFor: "any",
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
    interests: prefs.interests,
    preferences: {
      gender: prefs.lookingFor,
      country: "ANY" as const,
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
