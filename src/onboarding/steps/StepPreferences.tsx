import { StepShell } from "../components/StepShell";
import { OptionCard } from "../components/OptionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { OnboardingState, CookingSkill } from "../state";

const RESTRICTIONS = ["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Nut-free", "Halal", "Kosher", "Low FODMAP"];
const SKILLS: { v: CookingSkill; title: string; description: string }[] = [
  { v: "beginner", title: "Beginner", description: "I follow recipes step by step" },
  { v: "intermediate", title: "Intermediate", description: "I'm comfortable in the kitchen" },
  { v: "advanced", title: "Advanced", description: "I improvise and adapt freely" },
];
const COOK_TIMES = [15, 30, 45, 60, 90];

interface Props {
  state: OnboardingState;
  onPatch: (p: Partial<OnboardingState["preferences"]>) => void;
  onNext: () => void;
  onBack: () => void;
  step: number;
  total: number;
}

export function StepPreferences({ state, onPatch, onNext, onBack, step, total }: Props) {
  const p = state.preferences;
  const valid = !!p.cooking_skill;
  const toggle = (r: string) => {
    const has = p.dietary_restrictions.includes(r);
    onPatch({ dietary_restrictions: has ? p.dietary_restrictions.filter(x => x !== r) : [...p.dietary_restrictions, r] });
  };
  const ctIdx = COOK_TIMES.indexOf(p.max_cook_time_minutes);
  return (
    <StepShell
      step={step} total={total} onBack={onBack}
      title="Let's filter your recipe library"
      subtitle="These shape what recipes you see. You can always change them in settings."
      footer={<Button onClick={onNext} disabled={!valid} className="w-full h-14 text-base">Continue</Button>}
    >
      <div className="space-y-3">
        <Label>Dietary restrictions</Label>
        <div className="flex flex-wrap gap-2">
          {RESTRICTIONS.map((r) => {
            const sel = p.dietary_restrictions.includes(r);
            return (
              <button key={r} type="button" onClick={() => toggle(r)}
                className={cn(
                  "px-4 h-10 rounded-full border-2 text-sm font-medium transition-all",
                  sel ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/60"
                )}>
                {r}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dis">Ingredients you dislike or avoid</Label>
        <Input id="dis" className="h-12"
          placeholder="e.g. mushrooms, tofu, coriander"
          value={p.disliked_ingredients}
          onChange={(e) => onPatch({ disliked_ingredients: e.target.value })} />
      </div>

      <div className="space-y-3">
        <Label>Cooking skill</Label>
        {SKILLS.map((s) => (
          <OptionCard key={s.v} selected={p.cooking_skill === s.v} onClick={() => onPatch({ cooking_skill: s.v })} title={s.title} description={s.description} />
        ))}
      </div>

      <div className="space-y-3">
        <Label>Do you have a Thermomix?</Label>
        <div className="grid grid-cols-2 gap-2">
          {[true, false].map((b) => (
            <button key={String(b)} type="button" onClick={() => onPatch({ has_thermomix: b })}
              className={cn(
                "h-12 rounded-xl border-2 font-medium transition-all",
                p.has_thermomix === b ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/60"
              )}>
              {b ? "Yes" : "No"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label>Maximum cook time per session</Label>
          <span className="text-sm font-medium text-primary">
            {p.max_cook_time_minutes === 90 ? "90+" : p.max_cook_time_minutes} min
          </span>
        </div>
        <Slider
          min={0} max={4} step={1}
          value={[ctIdx >= 0 ? ctIdx : 2]}
          onValueChange={([v]) => onPatch({ max_cook_time_minutes: COOK_TIMES[v] })}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          {COOK_TIMES.map((t) => <span key={t}>{t === 90 ? "90+" : t}</span>)}
        </div>
      </div>
    </StepShell>
  );
}
