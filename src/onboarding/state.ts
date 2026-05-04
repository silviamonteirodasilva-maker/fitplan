// Onboarding draft state — reducer + types

export type FitnessGoal = "fat_loss" | "muscle_gain" | "recomp" | "maintain";
export type Sex = "male" | "female";
export type JobType = "sedentary" | "light" | "moderate" | "physical";
export type CardioIntensity = "low" | "moderate" | "high";
export type NeatLevel = "low" | "medium" | "high";
export type CookingSkill = "beginner" | "intermediate" | "advanced";
export type MemberType = "active" | "passive_adult" | "child";

export interface MemberDraft {
  type: MemberType;
  name: string;
  email?: string;
  sex?: Sex;
  date_of_birth?: string;
  weight_kg?: number;
  detailsProvided?: boolean; // for passive: did they fill details
}

export interface OnboardingState {
  step: number;
  goal?: FitnessGoal;
  household: { name: string; size: number };
  user: {
    name: string;
    date_of_birth: string;
    sex?: Sex;
    weight_kg?: number;
    height_cm?: number;
    body_fat_pct?: number;
  };
  activity: {
    job_type?: JobType;
    weekly_lifting_sessions: number;
    avg_lifting_minutes: number;
    weekly_cardio_sessions: number;
    avg_cardio_minutes: number;
    cardio_intensity: CardioIntensity;
    weekly_yoga_sessions: number;
    neat_level?: NeatLevel;
  };
  preferences: {
    dietary_restrictions: string[];
    disliked_ingredients: string;
    cooking_skill?: CookingSkill;
    has_thermomix: boolean;
    max_cook_time_minutes: number;
  };
  addMembersNow: boolean;
  members: MemberDraft[];
  currentMemberIdx: number;
}

export const initialState: OnboardingState = {
  step: 1,
  household: { name: "", size: 1 },
  user: { name: "", date_of_birth: "" },
  activity: {
    weekly_lifting_sessions: 0,
    avg_lifting_minutes: 60,
    weekly_cardio_sessions: 0,
    avg_cardio_minutes: 30,
    cardio_intensity: "moderate",
    weekly_yoga_sessions: 0,
  },
  preferences: {
    dietary_restrictions: [],
    disliked_ingredients: "",
    has_thermomix: false,
    max_cook_time_minutes: 45,
  },
  addMembersNow: false,
  members: [],
  currentMemberIdx: 0,
};

export type Action =
  | { type: "next" }
  | { type: "back" }
  | { type: "goto"; step: number }
  | { type: "patch"; patch: Partial<OnboardingState> }
  | { type: "patchUser"; patch: Partial<OnboardingState["user"]> }
  | { type: "patchHousehold"; patch: Partial<OnboardingState["household"]> }
  | { type: "patchActivity"; patch: Partial<OnboardingState["activity"]> }
  | { type: "patchPreferences"; patch: Partial<OnboardingState["preferences"]> }
  | { type: "setMember"; idx: number; member: MemberDraft }
  | { type: "initMembers"; count: number };

export function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case "next": return { ...state, step: state.step + 1 };
    case "back": return { ...state, step: Math.max(1, state.step - 1) };
    case "goto": return { ...state, step: action.step };
    case "patch": return { ...state, ...action.patch };
    case "patchUser": return { ...state, user: { ...state.user, ...action.patch } };
    case "patchHousehold": return { ...state, household: { ...state.household, ...action.patch } };
    case "patchActivity": return { ...state, activity: { ...state.activity, ...action.patch } };
    case "patchPreferences": return { ...state, preferences: { ...state.preferences, ...action.patch } };
    case "initMembers": {
      const extras = Math.max(0, action.count - 1);
      const members: MemberDraft[] = Array.from({ length: extras }, () => ({ type: "passive_adult", name: "" }));
      return { ...state, members, currentMemberIdx: 0 };
    }
    case "setMember": {
      const members = [...state.members];
      members[action.idx] = action.member;
      return { ...state, members };
    }
    default: return state;
  }
}

export function ageFromDob(dob: string): number {
  if (!dob) return 30;
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}
