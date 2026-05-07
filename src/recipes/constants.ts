// Shared types and helpers for recipe screens
export const MEAL_TYPES = ["breakfast", "snack_am", "lunch", "snack_pm", "dinner"] as const;
export type MealType = typeof MEAL_TYPES[number];

export const MEAL_TYPE_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  snack_am: "Snack",
  snack_pm: "Snack",
  lunch: "Lunch",
  dinner: "Dinner",
  coffee: "Coffee",
  addon: "Add-on",
};

export const STORE_CATEGORIES = [
  "produce", "dairy", "meat", "fish", "grains", "legumes",
  "frozen", "condiments", "oils", "nuts_seeds", "supplements", "other",
] as const;

export const STORE_CATEGORY_LABEL: Record<string, string> = {
  produce: "Produce",
  dairy: "Dairy",
  meat: "Meat",
  fish: "Fish",
  grains: "Grains",
  legumes: "Legumes",
  frozen: "Frozen",
  condiments: "Condiments",
  oils: "Oils",
  nuts_seeds: "Nuts & seeds",
  supplements: "Supplements",
  other: "Other",
};

export const TAG_OPTIONS = [
  "High protein", "Meal prep", "Vegetarian", "Vegan",
  "Gluten-free", "Post-workout", "Family friendly", "Take to work",
];

export const UNIT_OPTIONS = ["g", "ml", "tsp", "tbsp", "cup", "piece"];
