import { StepShell } from "../components/StepShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { OnboardingState, Sex } from "../state";

interface Props {
  state: OnboardingState;
  onPatch: (p: Partial<OnboardingState["user"]>) => void;
  onNext: () => void;
  onBack: () => void;
  step: number;
  total: number;
}

export function StepBiometrics({ state, onPatch, onNext, onBack, step, total }: Props) {
  const u = state.user;
  const valid =
    u.name.trim() &&
    u.date_of_birth &&
    u.sex &&
    typeof u.weight_kg === "number" && u.weight_kg > 0 &&
    typeof u.height_cm === "number" && u.height_cm > 0;

  return (
    <StepShell
      step={step} total={total} onBack={onBack}
      title="Tell us about you"
      subtitle="These numbers let us calculate exactly how much energy your body needs. We use them to set your calorie and macro targets — not to judge."
      footer={<Button onClick={onNext} disabled={!valid} className="w-full h-14 text-base">Continue</Button>}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" className="h-12" value={u.name} onChange={(e) => onPatch({ name: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dob">Date of birth</Label>
        <Input id="dob" type="date" className="h-12" value={u.date_of_birth} onChange={(e) => onPatch({ date_of_birth: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label>Sex</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["male", "female"] as Sex[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onPatch({ sex: s })}
              className={cn(
                "h-12 rounded-xl border-2 capitalize font-medium transition-all",
                u.sex === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/60"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Used only for BMR calculation (Mifflin-St Jeor formula). We know this is reductive — more options coming.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="w">Weight (kg)</Label>
          <Input id="w" type="number" inputMode="decimal" step="0.1" className="h-12"
            value={u.weight_kg ?? ""}
            onChange={(e) => onPatch({ weight_kg: e.target.value ? parseFloat(e.target.value) : undefined })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="h">Height (cm)</Label>
          <Input id="h" type="number" inputMode="decimal" className="h-12"
            value={u.height_cm ?? ""}
            onChange={(e) => onPatch({ height_cm: e.target.value ? parseFloat(e.target.value) : undefined })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bf">Body fat % (optional)</Label>
        <Input id="bf" type="number" inputMode="decimal" step="0.1" className="h-12"
          value={u.body_fat_pct ?? ""}
          onChange={(e) => onPatch({ body_fat_pct: e.target.value ? parseFloat(e.target.value) : undefined })} />
        <p className="text-xs text-muted-foreground">If you know this from a DEXA scan or smart scale, it unlocks a more accurate BMR formula (Katch-McArdle). Leave blank if unsure.</p>
      </div>
    </StepShell>
  );
}
