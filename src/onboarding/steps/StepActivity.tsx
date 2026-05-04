import { StepShell } from "../components/StepShell";
import { OptionCard } from "../components/OptionCard";
import { Stepper } from "../components/Stepper";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { OnboardingState, JobType, CardioIntensity, NeatLevel } from "../state";

const JOBS: { v: JobType; label: string }[] = [
  { v: "sedentary", label: "Desk job / mostly sitting" },
  { v: "light", label: "On my feet some of the day" },
  { v: "moderate", label: "Physically active job" },
  { v: "physical", label: "Manual labour / very physical" },
];

const NEATS: { v: NeatLevel; label: string }[] = [
  { v: "low", label: "I barely move between workouts" },
  { v: "medium", label: "I walk around, do errands, stay somewhat active" },
  { v: "high", label: "I am on the go most of the day" },
];

interface Props {
  state: OnboardingState;
  onPatch: (p: Partial<OnboardingState["activity"]>) => void;
  onNext: () => void;
  onBack: () => void;
  step: number;
  total: number;
}

export function StepActivity({ state, onPatch, onNext, onBack, step, total }: Props) {
  const a = state.activity;
  const valid = !!a.job_type && !!a.neat_level;
  return (
    <StepShell
      step={step} total={total} onBack={onBack}
      title="What does your week actually look like?"
      subtitle="Be honest — overestimating activity is the most common reason calorie targets feel off."
      footer={<Button onClick={onNext} disabled={!valid} className="w-full h-14 text-base">Continue</Button>}
    >
      <div className="space-y-3">
        <Label>Job type</Label>
        {JOBS.map((j) => (
          <OptionCard key={j.v} selected={a.job_type === j.v} onClick={() => onPatch({ job_type: j.v })} title={j.label} />
        ))}
      </div>

      <Section title="Strength training">
        <div>
          <Label className="text-sm text-muted-foreground">Sessions per week</Label>
          <Stepper value={a.weekly_lifting_sessions} onChange={(n) => onPatch({ weekly_lifting_sessions: n })} />
        </div>
        {a.weekly_lifting_sessions > 0 && (
          <div className="space-y-2 mt-3">
            <Label className="text-sm text-muted-foreground">Average session length</Label>
            <Select value={String(a.avg_lifting_minutes)} onValueChange={(v) => onPatch({ avg_lifting_minutes: parseInt(v) })}>
              <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[30, 45, 60, 75, 90].map((m) => <SelectItem key={m} value={String(m)}>{m} min</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </Section>

      <Section title="Cardio">
        <div>
          <Label className="text-sm text-muted-foreground">Sessions per week</Label>
          <Stepper value={a.weekly_cardio_sessions} onChange={(n) => onPatch({ weekly_cardio_sessions: n })} />
        </div>
        {a.weekly_cardio_sessions > 0 && (
          <>
            <div className="space-y-2 mt-3">
              <Label className="text-sm text-muted-foreground">Average session length</Label>
              <Select value={String(a.avg_cardio_minutes)} onValueChange={(v) => onPatch({ avg_cardio_minutes: parseInt(v) })}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[20, 30, 45, 60, 90].map((m) => <SelectItem key={m} value={String(m)}>{m} min</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 mt-3">
              <Label className="text-sm text-muted-foreground">Intensity</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "moderate", "high"] as CardioIntensity[]).map((i) => (
                  <button key={i} type="button" onClick={() => onPatch({ cardio_intensity: i })}
                    className={cn(
                      "h-11 rounded-xl border-2 capitalize text-sm font-medium transition-all",
                      a.cardio_intensity === i ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/60"
                    )}>
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </Section>

      <Section title="Yoga / mobility">
        <div>
          <Label className="text-sm text-muted-foreground">Sessions per week</Label>
          <Stepper value={a.weekly_yoga_sessions} onChange={(n) => onPatch({ weekly_yoga_sessions: n })} />
        </div>
      </Section>

      <div className="space-y-3">
        <Label>General daily movement outside of exercise</Label>
        {NEATS.map((n) => (
          <OptionCard key={n.v} selected={a.neat_level === n.v} onClick={() => onPatch({ neat_level: n.v })} title={n.label} />
        ))}
      </div>
    </StepShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="font-display text-lg font-semibold">{title}</div>
      {children}
    </div>
  );
}
