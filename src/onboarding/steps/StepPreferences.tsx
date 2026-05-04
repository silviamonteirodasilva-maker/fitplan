import { useState } from "react";
import { StepShell } from "../components/StepShell";
import { OptionCard } from "../components/OptionCard";
import { HintIcon } from "../components/HintIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { OnboardingState, CookingSkill } from "../state";

const RESTRICTIONS = [
  "Vegetarian", "Vegan", "Pescatarian", "Gluten-free", "Dairy-free",
  "Lactose intolerant", "Nut-free", "Egg-free", "Soy-free", "Halal",
  "Kosher", "Low FODMAP", "Low carb", "Diabetic-friendly",
];

const COMMON_DISLIKES = [
  "Mushrooms", "Tofu", "Coriander / Cilantro", "Olives", "Blue cheese",
  "Anchovies", "Liver", "Lamb", "Beetroot", "Brussels sprouts",
  "Aubergine / Eggplant", "Courgette", "Celery", "Fennel",
  "Raw onion", "Spicy food", "Fish sauce",
];

const APPLIANCES = [
  "Thermomix", "Air fryer", "Instant Pot / pressure cooker", "Slow cooker",
  "Blender / food processor", "Rice cooker", "Sous vide", "Steamer",
  "Standard oven", "Hob only",
];

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
  const [customInput, setCustomInput] = useState("");
  const valid = !!p.cooking_skill;

  const toggleArr = (key: "dietary_restrictions" | "disliked_ingredients" | "available_appliances", v: string) => {
    const arr = p[key];
    onPatch({ [key]: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] } as any);
  };

  const addCustomDislike = () => {
    const v = customInput.trim();
    if (!v) return;
    if (!p.disliked_ingredients.includes(v)) {
      onPatch({ disliked_ingredients: [...p.disliked_ingredients, v] });
    }
    setCustomInput("");
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
              <button key={r} type="button" onClick={() => toggleArr("dietary_restrictions", r)}
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

      <div className="space-y-3">
        <Label>Ingredients you dislike or avoid</Label>
        <p className="text-xs text-muted-foreground">Tap any you'd rather not see. Add your own at the bottom.</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_DISLIKES.map((d) => {
            const sel = p.disliked_ingredients.includes(d);
            return (
              <button key={d} type="button" onClick={() => toggleArr("disliked_ingredients", d)}
                className={cn(
                  "px-3 h-9 rounded-full border-2 text-sm font-medium transition-all",
                  sel ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/60"
                )}>
                {d}
              </button>
            );
          })}
          {p.disliked_ingredients.filter((d) => !COMMON_DISLIKES.includes(d)).map((d) => (
            <button key={d} type="button" onClick={() => toggleArr("disliked_ingredients", d)}
              className="px-3 h-9 rounded-full border-2 border-primary bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5">
              {d} <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomDislike(); } }}
            placeholder="Anything else? Type and add"
            className="h-12 flex-1"
          />
          <Button type="button" variant="outline" onClick={addCustomDislike} className="h-12">Add</Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Label className="flex-1">Which appliances do you cook with?</Label>
          <HintIcon>We use this to filter recipes by equipment needed. You'll only see recipes you can actually make.</HintIcon>
        </div>
        <p className="text-xs text-muted-foreground">Select all that apply.</p>
        <div className="flex flex-wrap gap-2">
          {APPLIANCES.map((ap) => {
            const sel = p.available_appliances.includes(ap);
            return (
              <button key={ap} type="button" onClick={() => toggleArr("available_appliances", ap)}
                className={cn(
                  "px-3 h-9 rounded-full border-2 text-sm font-medium transition-all",
                  sel ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/60"
                )}>
                {ap}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Label className="flex-1">Cooking skill</Label>
          <HintIcon>This helps us match recipe complexity to your comfort level. You can always change this in settings as your skills grow.</HintIcon>
        </div>
        {SKILLS.map((s) => (
          <OptionCard key={s.v} selected={p.cooking_skill === s.v} onClick={() => onPatch({ cooking_skill: s.v })} title={s.title} description={s.description} />
        ))}
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
