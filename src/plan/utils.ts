import { addDays, format, startOfDay } from "date-fns";

export const MEAL_SLOTS = [
  { key: "breakfast", label: "Breakfast", configKey: "show_breakfast" },
  { key: "snack_am", label: "Morning snack", configKey: "show_snack_am" },
  { key: "lunch", label: "Lunch", configKey: "show_lunch" },
  { key: "snack_pm", label: "Afternoon snack", configKey: "show_snack_pm" },
  { key: "dinner", label: "Dinner", configKey: "show_dinner" },
  { key: "coffee", label: "Coffee", configKey: "show_coffee" },
  { key: "addon", label: "Add-on", configKey: "show_addon" },
] as const;

export type MealSlotKey = typeof MEAL_SLOTS[number]["key"];

export function startOfWeek(weekStartDay: number, ref = new Date()): Date {
  const d = startOfDay(ref);
  const diff = (d.getDay() - weekStartDay + 7) % 7;
  return addDays(d, -diff);
}

export function weekDays(weekStartDay: number, ref = new Date()): Date[] {
  const start = startOfWeek(weekStartDay, ref);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function dayLabel(d: Date) {
  return { day: format(d, "EEE"), date: format(d, "d") };
}
