import { useState } from "react";
import { StepShell } from "../components/StepShell";
import { Button } from "@/components/ui/button";
import { computeMetabolic } from "../engine/metabolic";
import type { OnboardingState, FitnessGoal } from "../state";
import { Flame, Beef, Wheat, Droplet, ChevronDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  state: OnboardingState;
  onNext: () => void;
  onBack: () => void;
  step: number;
  total: number;
}

const GOAL_PILL: Record<FitnessGoal, { label: string; cls: string }> = {
  fat_loss:    { label: "Fat loss plan",       cls: "bg-accent text-accent-foreground" },
  muscle_gain: { label: "Muscle gain plan",    cls: "bg-primary text-primary-foreground" },
  recomp:      { label: "Recomposition plan",  cls: "bg-[hsl(210,30%,55%)] text-white" },
  maintain:    { label: "Maintenance plan",    cls: "bg-muted text-foreground" },
};

export function StepSummary({ state, onNext, onBack, step, total }: Props) {
  const r = computeMetabolic(state);
  const [showMore, setShowMore] = useState(false);

  const planEnd = new Date();
  planEnd.setDate(planEnd.getDate() + r.review_days);
  const planEndStr = planEnd.toLocaleDateString(undefined, { month: "long", day: "numeric" });
  const weeks = Math.round(r.review_days / 7);

  // Macro pie data with kcal weighting
  const proteinKcal = r.goal_protein_g * 4;
  const carbsKcal = r.goal_carbs_g * 4;
  const fatKcal = r.goal_fat_g * 9;
  const totalKcal = proteinKcal + carbsKcal + fatKcal || 1;
  const pieData = [
    { name: "Protein", grams: r.goal_protein_g, kcal: proteinKcal, color: "hsl(var(--accent))" },
    { name: "Carbs", grams: r.goal_carbs_g, kcal: carbsKcal, color: "hsl(40 80% 55%)" },
    { name: "Fat", grams: r.goal_fat_g, kcal: fatKcal, color: "hsl(var(--primary-glow))" },
  ];

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

  const pill = GOAL_PILL[r.goal];

  return (
    <StepShell
      step={step} total={total} onBack={onBack}
      title="Here's your personalised plan"
      footer={<Button onClick={onNext} className="w-full h-14 text-base">This looks good, let's continue</Button>}
    >
      <div className="rounded-3xl bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] text-primary-foreground p-6 shadow-[var(--shadow-card)]">
        <span className={`inline-flex items-center px-3 h-7 rounded-full text-xs font-semibold ${pill.cls}`}>
          {pill.label}
        </span>
        <div className="text-sm opacity-80 uppercase tracking-wider mt-4">Daily calorie target</div>
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
        <div className="rounded-2xl bg-card border border-border p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <div className="font-display text-base font-semibold mb-2">Your macro split</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="kcal"
                    nameKey="name"
                    cx="50%" cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                    isAnimationActive
                    animationDuration={600}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, _name, item: any) => {
                      const pct = Math.round((Number(value) / totalKcal) * 100);
                      return [`${item.payload.grams}g · ${pct}%`, item.payload.name];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {pieData.map((d) => {
                const pct = Math.round((d.kcal / totalKcal) * 100);
                return (
                  <div key={d.name} className="flex flex-col items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <div className="font-medium text-foreground">{d.name}</div>
                    <div className="text-muted-foreground tabular-nums">{d.grams}g · {pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-border space-y-1.5 text-xs text-muted-foreground">
            <div><span className="text-foreground font-medium">BMR:</span> {r.bmr} kcal — base burn at rest ({r.bmr_formula === "katch_mcardle" ? "Katch-McArdle" : "Mifflin-St Jeor"})</div>
            <div><span className="text-foreground font-medium">TDEE:</span> {r.tdee} kcal — total daily burn including job, training, and movement</div>
            <div><span className="text-foreground font-medium">Review date:</span> {planEndStr}</div>
          </div>
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
