import { StepShell } from "../components/StepShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { OnboardingState } from "../state";

interface Props {
  state: OnboardingState;
  onChangeName: (v: string) => void;
  onChangeSize: (n: number) => void;
  onNext: () => void;
  onBack: () => void;
  step: number;
  total: number;
}

export function StepHousehold({ state, onChangeName, onChangeSize, onNext, onBack, step, total }: Props) {
  const sizes = [1, 2, 3, 4, 5];
  const valid = state.household.name.trim().length > 0;
  return (
    <StepShell
      step={step} total={total} onBack={onBack}
      title="Who are you cooking for?"
      subtitle="This shapes your shopping list and cooking quantities. Everyone in the household eats the same meals — portions adjust to each person's goals."
      footer={<Button onClick={onNext} disabled={!valid} className="w-full h-14 text-base">Continue</Button>}
    >
      <div className="space-y-2">
        <Label htmlFor="hhname">What would you like to call your household?</Label>
        <Input
          id="hhname" className="h-12"
          placeholder="e.g. Sílvi & Jan, The Smiths, Just me"
          value={state.household.name}
          onChange={(e) => onChangeName(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <Label>How many people are in your household?</Label>
        <div className="grid grid-cols-5 gap-2">
          {sizes.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChangeSize(n)}
              className={cn(
                "h-14 rounded-xl border-2 font-display text-lg font-semibold transition-all",
                state.household.size === n
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/60"
              )}
            >
              {n === 5 ? "5+" : n}
            </button>
          ))}
        </div>
      </div>
    </StepShell>
  );
}
