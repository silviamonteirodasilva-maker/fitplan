// Lightweight validators for onboarding fields. Returns null when valid, else an error message.

export function validateName(v: string): string | null {
  const s = v.trim();
  if (!s) return "Please enter your name";
  if (s.length < 2) return "Name must be at least 2 characters";
  if (!/^[\p{L} \-']+$/u.test(s)) return "Letters, spaces and hyphens only";
  return null;
}

export function validateDob(v: string): string | null {
  if (!v) return "Please enter your date of birth";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "Please enter a valid date";
  const y = d.getFullYear();
  if (y < 1920) return "Year must be 1920 or later";
  const today = new Date();
  if (d > today) return "Date cannot be in the future";
  // Age >= 10
  const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
  if (d > tenYearsAgo) return "You must be at least 10 years old";
  return null;
}

export function validateWeightKg(v: number | undefined): string | null {
  if (v === undefined || v === null || isNaN(v)) return "Please enter your weight";
  if (v < 30) return "Weight must be at least 30 kg";
  if (v > 300) return "Weight must be 300 kg or less";
  return null;
}

export function validateHeightCm(v: number | undefined): string | null {
  if (v === undefined || v === null || isNaN(v)) return "Please enter your height";
  if (v < 100) return "Height must be at least 100 cm";
  if (v > 250) return "Height must be 250 cm or less";
  return null;
}

export function validateBodyFatPct(v: number | undefined): string | null {
  if (v === undefined || v === null || v === 0 || isNaN(v as number)) return null; // optional
  if (v < 3) return "Body fat must be at least 3%";
  if (v > 60) return "Body fat must be 60% or less";
  return null;
}
