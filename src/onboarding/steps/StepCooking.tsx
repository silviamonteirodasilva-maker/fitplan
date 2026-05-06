import { StepShell } from "../components/StepShell";
import { OptionCard } from "../components/OptionCard";
import { Stepper } from "../components/Stepper";
import { HintIcon } from "../components/HintIcon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { OnboardingState, CookingStyle } from "../state";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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

// Onboarding currently uses Monday (week_start_day = 1) as the week boundary.
const WEEK_START = 1;

function nextWeekStart(weekStart: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const diff = (weekStart - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function fmt(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function StepCooking({ state, onPatch, onNext, onBack, step, total }: Props) {
  const c = state.cooking;
  const valid = !!c.cooking_style && c.preferred_shopping_day >= 0 && !!c.plan_start_date;

  const startA = nextWeekStart(WEEK_START);
  const startB = new Date(startA); startB.setDate(startB.getDate() + 7);
  const startOptions = [
    { iso: iso(startA), label: `Next ${DAY_FULL[WEEK_START]}`, sub: fmt(startA) },
    { iso: iso(startB), label: "The week after", sub: fmt(startB) },
  ];

  // Ensure plan_start_date snaps to a valid option
  if (c.plan_start_date !== startOptions[0].iso && c.plan_start_date !== startOptions[1].iso) {
    onPatch({ plan_start_date: startOptions[0].iso });
  }

  return (
    <StepShell
      step={step} total={total} onBack={onBack}
      title="How does your household cook?"
      subtitle="This shapes your weekly plan, shopping list timing, and batch cook schedule."
      footer={<Button onClick={onNext} disabled={!valid} className="w-full h-14 text-base">Continue</Button>}
    >
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Label className="flex-1">When would you like to start your plan?</Label>
          <HintIcon>Your plan runs in weekly cycles. Picking a week boundary keeps your shopping list, batch cooks and check-ins aligned.</HintIcon>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {startOptions.map((o) => (
            <button key={o.iso} type="button" onClick={() => onPatch({ plan_start_date: o.iso })}
              className={cn(
                "h-auto py-3 px-3 rounded-xl border-2 text-left transition-all",
                c.plan_start_date === o.iso ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/60"
              )}>
              <div className="text-sm font-semibold text-foreground">{o.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{o.sub}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Label className="flex-1">Main shop day</Label>
          <HintIcon>Your shopping list is generated the day before this so it's ready when you need it.</HintIcon>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS.map((d, i) => (
            <button key={d} type="button" onClick={() => onPatch({ preferred_shopping_day: i, topup_shopping_day: c.topup_shopping_day === i ? null : c.topup_shopping_day })}
              className={cn(
                "h-12 rounded-xl border-2 text-xs font-semibold transition-all",
                c.preferred_shopping_day === i ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/60"
              )}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Label className="flex-1">Top-up shop <span className="text-muted-foreground font-normal">(optional)</span></Label>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Fresh fish, greens, and soft produce keep 2–3 days. A mid-week top-up means better quality food in the second half of your week.
        </p>
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS.map((d, i) => {
            const disabled = i === c.preferred_shopping_day;
            const selected = c.topup_shopping_day === i;
            return (
              <button key={d} type="button" disabled={disabled}
                onClick={() => onPatch({ topup_shopping_day: selected ? null : i })}
                className={cn(
                  "h-12 rounded-xl border-2 text-xs font-semibold transition-all",
                  disabled && "opacity-30 cursor-not-allowed",
                  selected ? "border-primary bg-primary text-primary-foreground" :
                  "border-border bg-card hover:border-primary/60"
                )}>
                {d}
              </button>
            );
          })}
        </div>
        {c.topup_shopping_day !== null && (
          <button type="button" onClick={() => onPatch({ topup_shopping_day: null })}
            className="text-xs text-muted-foreground underline">Clear top-up day</button>
        )}
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
