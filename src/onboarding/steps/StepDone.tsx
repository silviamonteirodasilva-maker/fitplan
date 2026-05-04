import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
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
        <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-6">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="text-4xl font-display font-semibold leading-tight">Your household plan is ready.</h1>
        <p className="mt-3 text-muted-foreground">Here's a quick summary of what we set up.</p>

        <div className="mt-8 rounded-2xl bg-card border border-border p-5 space-y-4">
          <Row label="Household" value={state.household.name} />
          <Row label={state.user.name} value={`${labelForGoal(r.goal)} · ${r.goal_calories} kcal/day`} />
          {state.members.map((m, i) => (
            <Row key={i} label={m.name || `Member ${i + 2}`} value={m.type === "active" ? "Active member (invited)" : "Passive adult"} />
          ))}
        </div>

        {activeMembers.length > 0 && (
          <div className="mt-4 rounded-xl bg-accent/10 border border-accent/30 p-4 text-sm space-y-1">
            {activeMembers.map((m, i) => (
              <div key={i}><Check className="inline h-4 w-4 mr-1 text-accent" />We've sent an invite to {m.name} at {m.email}. They'll be asked to complete their own profile when they join.</div>
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
