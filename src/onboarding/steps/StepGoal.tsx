import { useRef } from "react";
import { StepShell } from "../components/StepShell";
import { OptionCard } from "../components/OptionCard";
import { Button } from "@/components/ui/button";
import { scrollToNext } from "../utils/scroll";
import type { FitnessGoal, OnboardingState } from "../state";

const GOALS: { value: FitnessGoal; title: string; description: string; meta: string }[] = [
  { value: "fat_loss", title: "Lose fat", description: "A moderate 300–500 kcal deficit. Protects muscle, keeps energy stable, sustainable for 8–16 weeks before a planned break.", meta: "Expect 0.25–0.5 kg per week" },
  { value: "muscle_gain", title: "Build muscle", description: "A small 200–300 kcal surplus combined with enough protein and progressive training. Faster gains lead mostly to fat.", meta: "Expect 0.25–0.5 kg of muscle per month" },
  { value: "recomp", title: "Recomposition", description: "Lose fat and gain muscle at the same time by eating at maintenance with very high protein. Best if new to training, returning, or with significant fat to lose.", meta: "Skip the bulk and cut cycle" },
  { value: "maintain", title: "Maintain", description: "You're happy with your composition and want a structured, nutritious plan that supports training and energy.", meta: "Calories match your daily burn" },
];

interface Props {
  state: OnboardingState;
  onChange: (g: FitnessGoal) => void;
  onNext: () => void;
  onBack: () => void;
  step: number;
  total: number;
}

export function StepGoal({ state, onChange, onNext, onBack, step, total }: Props) {
  const continueRef = useRef<HTMLButtonElement>(null);

  const handlePick = (g: FitnessGoal) => {
    onChange(g);
    scrollToNext(continueRef.current, { highlight: false });
  };

  return (
    <StepShell
      step={step} total={total} onBack={onBack}
      title="What's your main goal right now?"
      footer={
        <Button ref={continueRef} onClick={onNext} disabled={!state.goal} className="w-full h-14 text-base">Continue</Button>
      }
    >
      <div className="space-y-3">
        {GOALS.map((g) => (
          <OptionCard
            key={g.value}
            selected={state.goal === g.value}
            onClick={() => handlePick(g.value)}
            title={g.title}
            description={g.description}
            meta={g.meta}
          />
        ))}
      </div>
    </StepShell>
  );
}
