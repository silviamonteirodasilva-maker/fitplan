import { useRef, useState } from "react";
import { StepShell } from "../components/StepShell";
import { HintIcon } from "../components/HintIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { scrollToNext } from "../utils/scroll";
import {
  validateName, validateDob, validateWeightKg, validateHeightCm, validateBodyFatPct,
} from "../utils/validators";
import type { OnboardingState, Sex, UnitSystem } from "../state";

interface Props {
  state: OnboardingState;
  onPatch: (p: Partial<OnboardingState["user"]>) => void;
  onPatchUnit: (u: UnitSystem) => void;
  onNext: () => void;
  onBack: () => void;
  step: number;
  total: number;
}

const todayISO = new Date().toISOString().slice(0, 10);
const dobMaxISO = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 10);
  return d.toISOString().slice(0, 10);
})();

export function StepBiometrics({ state, onPatch, onPatchUnit, onNext, onBack, step, total }: Props) {
  const u = state.user;
  const unit = state.unitSystem;

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const mark = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const measureRef = useRef<HTMLDivElement>(null);

  const [lbs, setLbs] = useState<string>(
    u.weight_kg && unit === "imperial" ? (u.weight_kg / 0.453592).toFixed(1) : ""
  );
  const [ft, setFt] = useState<string>(() => {
    if (u.height_cm && unit === "imperial") {
      const totalIn = u.height_cm / 2.54;
      return String(Math.floor(totalIn / 12));
    }
    return "";
  });
  const [inches, setIn] = useState<string>(() => {
    if (u.height_cm && unit === "imperial") {
      const totalIn = u.height_cm / 2.54;
      return String(Math.round(totalIn % 12));
    }
    return "";
  });

  const errs = {
    name: validateName(u.name ?? ""),
    dob: validateDob(u.date_of_birth ?? ""),
    weight: validateWeightKg(u.weight_kg),
    height: validateHeightCm(u.height_cm),
    bf: validateBodyFatPct(u.body_fat_pct),
  };
  const valid = !!u.sex && !errs.name && !errs.dob && !errs.weight && !errs.height && !errs.bf;

  const onLbs = (v: string) => {
    setLbs(v);
    const n = parseFloat(v);
    onPatch({ weight_kg: isFinite(n) && n > 0 ? +(n * 0.453592).toFixed(2) : undefined });
  };
  const onFtIn = (f: string, i: string) => {
    setFt(f); setIn(i);
    const fn = parseFloat(f) || 0;
    const inn = parseFloat(i) || 0;
    const cm = fn * 30.48 + inn * 2.54;
    onPatch({ height_cm: cm > 0 ? +cm.toFixed(1) : undefined });
  };

  const Err = ({ msg }: { msg: string | null }) =>
    msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;

  return (
    <StepShell
      step={step} total={total} onBack={onBack}
      title="Tell us about you"
      subtitle="These numbers let us calculate exactly how much energy your body needs. We use them to set your calorie and macro targets — not to judge."
      footer={<Button onClick={onNext} disabled={!valid} className="w-full h-14 text-base">Continue</Button>}
    >
      <div className="rounded-xl border border-border bg-card p-1 grid grid-cols-2 gap-1">
        {(["metric", "imperial"] as UnitSystem[]).map((sys) => (
          <button
            key={sys}
            type="button"
            onClick={() => onPatchUnit(sys)}
            className={cn(
              "h-10 rounded-lg text-sm font-medium capitalize transition-all",
              unit === sys ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {sys === "metric" ? "Metric (kg / cm)" : "Imperial (lbs / ft)"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Your name</Label>
        <Input
          id="name" className="h-12" value={u.name}
          onBlur={() => mark("name")}
          onChange={(e) => onPatch({ name: e.target.value })}
          aria-invalid={!!(touched.name && errs.name)}
          maxLength={60}
        />
        {touched.name && <Err msg={errs.name} />}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dob">Date of birth</Label>
        <Input
          id="dob" type="date" className="h-12"
          value={u.date_of_birth}
          min="1920-01-01" max={dobMaxISO}
          onBlur={() => mark("dob")}
          onChange={(e) => onPatch({ date_of_birth: e.target.value })}
          aria-invalid={!!(touched.dob && errs.dob)}
        />
        {touched.dob && <Err msg={errs.dob} />}
        <p className="text-xs text-muted-foreground">Today's date allowed up to {todayISO}</p>
      </div>

      <div className="space-y-2">
        <Label>Sex</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["male", "female"] as Sex[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { onPatch({ sex: s }); scrollToNext(measureRef.current); }}
              className={cn(
                "h-12 rounded-xl border-2 capitalize font-medium transition-all",
                u.sex === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/60"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Used only for BMR calculation. We know this is reductive — more options coming.</p>
      </div>

      <div ref={measureRef}>
      {unit === "metric" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="w">Weight (kg)</Label>
            <Input id="w" type="number" inputMode="decimal" step="0.1" min={30} max={300} className="h-12"
              value={u.weight_kg ?? ""}
              onBlur={() => mark("weight")}
              onChange={(e) => onPatch({ weight_kg: e.target.value ? parseFloat(e.target.value) : undefined })}
              aria-invalid={!!(touched.weight && errs.weight)} />
            {touched.weight && <Err msg={errs.weight} />}
          </div>
          <div className="space-y-2">
            <Label htmlFor="h">Height (cm)</Label>
            <Input id="h" type="number" inputMode="decimal" min={100} max={250} className="h-12"
              value={u.height_cm ?? ""}
              onBlur={() => mark("height")}
              onChange={(e) => onPatch({ height_cm: e.target.value ? parseFloat(e.target.value) : undefined })}
              aria-invalid={!!(touched.height && errs.height)} />
            {touched.height && <Err msg={errs.height} />}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="wlb">Weight (lbs)</Label>
            <Input id="wlb" type="number" inputMode="decimal" step="0.1" className="h-12"
              value={lbs}
              onBlur={() => mark("weight")}
              onChange={(e) => onLbs(e.target.value)}
              aria-invalid={!!(touched.weight && errs.weight)} />
            {touched.weight && <Err msg={errs.weight} />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hft">Height (ft)</Label>
              <Input id="hft" type="number" inputMode="numeric" className="h-12"
                value={ft}
                onBlur={() => mark("height")}
                onChange={(e) => onFtIn(e.target.value, inches)}
                aria-invalid={!!(touched.height && errs.height)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hin">Height (in)</Label>
              <Input id="hin" type="number" inputMode="numeric" className="h-12"
                value={inches}
                onBlur={() => mark("height")}
                onChange={(e) => onFtIn(ft, e.target.value)}
                aria-invalid={!!(touched.height && errs.height)} />
            </div>
          </div>
          {touched.height && <Err msg={errs.height} />}
        </div>
      )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bf">Body fat % (optional)</Label>
        <Input id="bf" type="number" inputMode="decimal" step="0.1" min={3} max={60} className="h-12"
          value={u.body_fat_pct ?? ""}
          onBlur={() => mark("bf")}
          onChange={(e) => onPatch({ body_fat_pct: e.target.value ? parseFloat(e.target.value) : undefined })}
          aria-invalid={!!(touched.bf && errs.bf)} />
        {touched.bf && <Err msg={errs.bf} />}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Where do I find this?</span>
          <HintIcon label="Body fat info">
            Check Apple Health under Body Measurements, Samsung Health, or your smart scale app.
            Most modern scales estimate this automatically. If you had a DEXA scan, use that number — it's the most accurate.
          </HintIcon>
        </div>
        <p className="text-xs text-muted-foreground">If you know this, we'll use the more accurate Katch-McArdle formula. Leave blank if unsure.</p>
      </div>
    </StepShell>
  );
}
