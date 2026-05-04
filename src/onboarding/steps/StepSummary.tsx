import { useState } from "react";
import { StepShell } from "../components/StepShell";
import { Button } from "@/components/ui/button";
import { computeMetabolic } from "../engine/metabolic";
import type { OnboardingState } from "../state";
import { Flame, Beef, Wheat, Droplet, ChevronDown } from "lucide-react";

interface Props {
  state: OnboardingState;
  onNext: () => void;
  onBack: () => void;
  step: number;
  total: number;
}

export function StepSummary({ state, onNext, onBack, step, total }: Props) {
  const r = computeMetabolic(state);
  const [showMore, setShowMore] = useState(false);

  const planEnd = new Date();
  planEnd.setDate(planEnd.getDate() + r.review_days);
  const planEndStr = planEnd.toLocaleDateString(undefined, { month: "long", day: "numeric" });
  const weeks = Math.round(r.review_days / 7);

  let explanation = "";
  if (r.goal === "fat_loss") {
    const deficit = r.tdee - r.goal_calories;
    explanation = `Your body burns around ${r.tdee} kcal per day. We've set a ${deficit} kcal deficit, which puts you on track to lose roughly ${Math.abs(r.weekly_change_target_kg).toFixed(2)} kg per week. After ${planEndStr}, we'll move you to a maintenance phase — this is important for hormonal health and long-term results.`;
  } else if (r.goal === "muscle_gain") {
    explanation = `We've added a ${r.goal_calories - r.tdee} kcal surplus above your daily burn. Combined with enough protein and training, this supports muscle growth while minimising unnecessary fat gain.`;
  } else if (r.goal === "recomp") {
    explanation = `Your calories match your daily burn exactly. The high protein target drives muscle growth while the calorie balance prevents fat gain. Recomp is slower than a dedicated bulk or cut — but you're doing both at once.`;
  } else {
    explanation = `Your calories match your daily burn. Macros are set to support your training and keep energy stable.`;
  }

  return (
    <StepShell
      step={step} total={total} onBack={onBack}
      title="Here's your personalised plan"
      footer={<Button onClick={onNext} className="w-full h-14 text-base">This looks good, let's continue</Button>}
    >
      <div className="rounded-3xl bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] text-primary-foreground p-6 shadow-[var(--shadow-card)]">
        <div className="text-sm opacity-80 uppercase tracking-wider">Daily calorie target</div>
        <div className="text-5xl font-display font-semibold mt-1 tabular-nums">
          {r.goal_calories.toLocaleString()} <span className="text-2xl opacity-80">kcal</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-6">
          <Macro icon={<Beef className="h-4 w-4" />} label="Protein" value={`${r.goal_protein_g}g`} />
          <Macro icon={<Wheat className="h-4 w-4" />} label="Carbs" value={`${r.goal_carbs_g}g`} />
          <Macro icon={<Droplet className="h-4 w-4" />} label="Fat" value={`${r.goal_fat_g}g`} />
        </div>
        <div className="mt-6 pt-5 border-t border-white/15 flex justify-between text-sm">
          <div><div className="opacity-80 flex items-center gap-1.5"><Flame className="h-3.5 w-3.5" />Daily burn (TDEE)</div><div className="font-semibold mt-0.5 tabular-nums">{r.tdee.toLocaleString()} kcal</div></div>
          <div className="text-right"><div className="opacity-80">Plan duration</div><div className="font-semibold mt-0.5">{weeks} weeks</div></div>
        </div>
      </div>

      <p className="text-foreground/90 leading-relaxed">{explanation}</p>

      {r.calories_floored && (
        <div className="rounded-xl bg-accent/10 border border-accent/30 text-foreground p-4 text-sm">
          We adjusted your calories slightly upward to meet a safe minimum. Going below this can slow your metabolism and affect recovery.
        </div>
      )}
      {r.deficit_capped && (
        <div className="rounded-xl bg-accent/10 border border-accent/30 text-foreground p-4 text-sm">
          We capped your deficit at 500 kcal. Larger deficits increase muscle loss and make the plan harder to sustain.
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="flex items-center gap-2 text-sm text-primary font-medium"
      >
        Explain this more
        <ChevronDown className={`h-4 w-4 transition-transform ${showMore ? "rotate-180" : ""}`} />
      </button>
      {showMore && (
        <div className="rounded-2xl bg-muted p-5 space-y-2 text-sm text-muted-foreground">
          <div><b className="text-foreground">BMR:</b> {r.bmr} kcal — your body's base burn at rest, calculated using the {r.bmr_formula === "katch_mcardle" ? "Katch-McArdle" : "Mifflin-St Jeor"} formula.</div>
          <div><b className="text-foreground">TDEE:</b> {r.tdee} kcal — your total daily burn including job, training, and movement.</div>
          <div><b className="text-foreground">Macros:</b> protein scaled to your bodyweight; fat at ~27% of calories; carbs filling the remainder.</div>
          <div><b className="text-foreground">Review date:</b> {planEndStr} — we'll check in and adjust based on your progress.</div>
        </div>
      )}
    </StepShell>
  );
}

function Macro({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-xs opacity-80">{icon}{label}</div>
      <div className="text-xl font-display font-semibold mt-1 tabular-nums">{value}</div>
    </div>
  );
}
