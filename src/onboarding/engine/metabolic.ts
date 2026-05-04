// Pure metabolic engine: BMR, TDEE, goal calories, macros, review date.
import type { OnboardingState, FitnessGoal } from "../state";
import { ageFromDob } from "../state";

export interface MetabolicResult {
  bmr: number;
  bmr_formula: "mifflin_st_jeor" | "katch_mcardle";
  tdee: number;
  goal_calories: number;
  goal_protein_g: number;
  goal_carbs_g: number;
  goal_fat_g: number;
  weekly_change_target_kg: number;
  deficit_capped: boolean;
  calories_floored: boolean;
  review_days: number;
  goal: FitnessGoal;
}

const JOB_BASE: Record<string, number> = { sedentary: 1.2, light: 1.35, moderate: 1.5, physical: 1.7 };
const NEAT_BONUS: Record<string, number> = { low: 0, medium: 0.05, high: 0.1 };
const CARDIO_INTENSITY: Record<string, number> = { low: 5, moderate: 8, high: 11 };

export function computeMetabolic(s: OnboardingState): MetabolicResult {
  const goal: FitnessGoal = s.goal ?? "maintain";
  const sex = s.user.sex ?? "female";
  const weight = s.user.weight_kg ?? 70;
  const height = s.user.height_cm ?? 170;
  const age = ageFromDob(s.user.date_of_birth);
  const bf = s.user.body_fat_pct;

  let bmr: number;
  let bmr_formula: "mifflin_st_jeor" | "katch_mcardle";
  if (bf && bf > 0) {
    const lbm = weight * (1 - bf / 100);
    bmr = 370 + 21.6 * lbm;
    bmr_formula = "katch_mcardle";
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age + (sex === "male" ? 5 : -161);
    bmr_formula = "mifflin_st_jeor";
  }

  const jobMult = JOB_BASE[s.activity.job_type ?? "sedentary"] ?? 1.2;
  const neatBonus = NEAT_BONUS[s.activity.neat_level ?? "low"] ?? 0;

  // Exercise calories per week from sessions/minutes
  const liftingKcal = s.activity.weekly_lifting_sessions * s.activity.avg_lifting_minutes * 6;
  const cardioKcal =
    s.activity.weekly_cardio_sessions *
    s.activity.avg_cardio_minutes *
    (CARDIO_INTENSITY[s.activity.cardio_intensity] ?? 8);
  const yogaKcal = s.activity.weekly_yoga_sessions * (s.activity.avg_yoga_minutes ?? 45) * 4;
  const dailyExerciseKcal = (liftingKcal + cardioKcal + yogaKcal) / 7;

  const tdee = Math.round(bmr * (jobMult + neatBonus) + dailyExerciseKcal);

  let target = tdee;
  let deficit_capped = false;
  let calories_floored = false;

  if (goal === "fat_loss") {
    let deficit = 400;
    if (deficit > 500) { deficit = 500; deficit_capped = true; }
    target = tdee - deficit;
  } else if (goal === "muscle_gain") {
    target = tdee + 250;
  }

  const floor = sex === "male" ? 1700 : 1500;
  if (target < floor) { target = floor; calories_floored = true; }

  // Macros
  const proteinPerKg = goal === "fat_loss" || goal === "recomp" ? 2.0 : 1.6;
  const protein_g = Math.round(weight * proteinPerKg);
  const fat_g = Math.round((target * 0.27) / 9);
  const carbs_g = Math.max(0, Math.round((target - protein_g * 4 - fat_g * 9) / 4));

  const review_days = goal === "recomp" ? 42 : goal === "maintain" ? 56 : 28;
  const weekly_change_target_kg =
    goal === "fat_loss"
      ? -((tdee - target) * 7) / 7700
      : goal === "muscle_gain"
      ? ((target - tdee) * 7) / 7700
      : 0;

  return {
    bmr: Math.round(bmr),
    bmr_formula,
    tdee,
    goal_calories: Math.round(target),
    goal_protein_g: protein_g,
    goal_carbs_g: carbs_g,
    goal_fat_g: fat_g,
    weekly_change_target_kg: Number(weekly_change_target_kg.toFixed(2)),
    deficit_capped,
    calories_floored,
    review_days,
    goal,
  };
}
