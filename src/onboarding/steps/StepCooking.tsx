import { StepShell } from "../components/StepShell";
import { OptionCard } from "../components/OptionCard";
import { Stepper } from "../components/Stepper";
import { HintIcon } from "../components/HintIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { OnboardingState, CookingStyle } from "../state";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STYLES: { v: CookingStyle; title: string; description: string }[] = [
  { v: "meal_prep", title: "Meal prep", description: "You cook in bulk on one or two days and eat from containers during the week. Efficient, consistent, minimal daily effort." },
  { v: "fresh", title: "Fresh daily", description: "You prefer cooking on the day. Meals are fresher but require more time during the week." },
  { v: "mixed", title: "A mix of both", description: "Some meals prepped ahead, some cooked fresh. Most common for busy households." },
];

interface Props {
  state: OnboardingState;
  onPatch: (p: Partial<OnboardingState["cooking"]>) => void;
  onNext: () => void;
  onBack: () => void;
  step: number;
  total: number;
}

export function StepCooking({ state, onPatch, onNext, onBack, step, total }: Props) {
  const c = state.cooking;
  const valid = !!c.cooking_style && c.preferred_shopping_day >= 0 && !!c.plan_start_date;

  return (
    <StepShell
      step={step} total={total} onBack={onBack}
      title="How does your household cook?"
      subtitle="This shapes your weekly plan, shopping list timing, and batch cook schedule."
      footer={<Button onClick={onNext} disabled={!valid} className="w-full h-14 text-base">Continue</Button>}
    >
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Label htmlFor="psd" className="flex-1">When would you like to start your plan?</Label>
          <HintIcon>Your plan runs in weekly cycles starting on Monday. Picking a date gives us a clear Week 1.</HintIcon>
        </div>
        <Input id="psd" type="date" className="h-12" value={c.plan_start_date}
          onChange={(e) => onPatch({ plan_start_date: e.target.value })} />
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Label className="flex-1">Which day works best for your grocery shop?</Label>
          <HintIcon>Your shopping list is generated the day before this so it's ready when you need it.</HintIcon>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS.map((d, i) => (
            <button key={d} type="button" onClick={() => onPatch({ preferred_shopping_day: i })}
              className={cn(
                "h-12 rounded-xl border-2 text-xs font-semibold transition-all",
                c.preferred_shopping_day === i ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/60"
              )}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>How do you prefer to handle meals during the week?</Label>
        {STYLES.map((s) => (
          <OptionCard key={s.v} selected={c.cooking_style === s.v} onClick={() => onPatch({ cooking_style: s.v })}
            title={s.title} description={s.description} />
        ))}
      </div>

      {c.cooking_style && c.cooking_style !== "fresh" && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-start gap-2">
            <Label className="flex-1">How many cooking sessions per week are realistic?</Label>
            <HintIcon>We'll batch your recipes around these sessions so you're not cooking every day. One Sunday prep session can cover 4–5 days of meals.</HintIcon>
          </div>
          <Stepper value={c.cooking_sessions_per_week} min={1} max={5}
            onChange={(n) => onPatch({ cooking_sessions_per_week: n })} />
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-start gap-2">
          <Label className="flex-1">How many days in a row are you comfortable eating the same meal?</Label>
          <HintIcon>Batch cooking means eating the same meal multiple times. This tells us how far to stretch each batch before rotating to a different recipe.</HintIcon>
        </div>
        <Stepper value={c.max_fresh_cook_days} min={1} max={5}
          onChange={(n) => onPatch({ max_fresh_cook_days: n })} />
      </div>
    </StepShell>
  );
}
