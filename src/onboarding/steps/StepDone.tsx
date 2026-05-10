import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import type { OnboardingState } from "../state";
import { computeMetabolic } from "../engine/metabolic";

interface Props {
  state: OnboardingState;
  submitting: boolean;
  onSubmit: () => void;
}

export function StepDone({ state, submitting, onSubmit }: Props) {
  const r = computeMetabolic(state);
  const activeMembers = state.members.filter((m) => m.type === "active");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 px-6 max-w-xl mx-auto w-full pt-12">
        <img src="/brand/pinch-mark.svg" alt="pinch" className="w-14 h-14 mb-6" />
        <h1 className="text-4xl font-medium leading-tight" style={{ letterSpacing: '-0.04em' }}>You're all set.</h1>
        <p className="mt-3 text-muted-foreground">Here's a quick summary of your household.</p>

        <div className="mt-8 rounded-2xl bg-card border border-border p-5 space-y-4">
          <Row label="Household" value={state.household.name} />
          <Row label={`${state.user.name} (you)`} value={`${labelForGoal(r.goal)} · ${r.goal_calories} kcal/day`} />
          {state.members.map((m, i) => {
            const name = m.name || `Member ${i + 2}`;
            if (m.type === "active") {
              return <Row key={i} label={name} value={`Waiting for ${m.name || "them"} to complete their profile.`} />;
            }
            return <Row key={i} label={name} value="Passive adult" />;
          })}
        </div>

        {activeMembers.length > 0 && (
          <div className="mt-4 rounded-xl bg-secondary/20 border border-secondary/40 p-4 text-sm space-y-1">
            {activeMembers.map((m, i) => (
              <div key={i}><Check className="inline h-4 w-4 mr-1 text-secondary" />We've sent an invite to {m.name} at {m.email}.</div>
            ))}
          </div>
        )}
      </main>
      <footer className="px-6 pb-10 max-w-xl mx-auto w-full">
        <Button onClick={onSubmit} disabled={submitting} className="w-full h-14 text-base">
          {submitting ? "Setting up..." : "Go to my weekly plan →"}
        </Button>
      </footer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

function labelForGoal(g: string) {
  return { fat_loss: "Lose fat", muscle_gain: "Build muscle", recomp: "Recomposition", maintain: "Maintain" }[g] ?? g;
}
