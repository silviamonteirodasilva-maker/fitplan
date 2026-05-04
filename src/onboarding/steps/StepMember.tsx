import { StepShell } from "../components/StepShell";
import { OptionCard } from "../components/OptionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { MemberDraft, Sex } from "../state";

interface Props {
  idx: number;
  total: number;
  member: MemberDraft;
  onChange: (m: MemberDraft) => void;
  onNext: () => void;
  onBack: () => void;
  step: number;
  totalSteps: number;
  isLast: boolean;
}

export function StepMember({ idx, total, member, onChange, onNext, onBack, step, totalSteps, isLast }: Props) {
  const valid = (() => {
    if (member.type === "active") return member.name.trim() && /\S+@\S+\.\S+/.test(member.email ?? "");
    if (member.type === "passive_adult") return member.name.trim().length > 0;
    return false;
  })();

  return (
    <StepShell
      step={step} total={totalSteps} onBack={onBack}
      title={`Person ${idx + 2} of ${total + 1}`}
      subtitle="Who else is in the household?"
      footer={<Button onClick={onNext} disabled={!valid} className="w-full h-14 text-base">{isLast ? "Continue" : "Next person"}</Button>}
    >
      <div className="space-y-3">
        <Label>Member type</Label>
        <OptionCard selected={member.type === "active"} onClick={() => onChange({ ...member, type: "active" })}
          title="They'll use the app" description="We'll send them an invite to set up their own profile." />
        <OptionCard selected={member.type === "passive_adult"} onClick={() => onChange({ ...member, type: "passive_adult" })}
          title="I'll manage their plan" description="You enter their info — portions are calculated from it." />
        <OptionCard selected={false} disabled onClick={() => {}}
          title="It's a child (coming soon)" description="Child nutrition support is coming in a future update." />
      </div>

      {member.type === "active" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="mn">Name</Label>
            <Input id="mn" className="h-12" value={member.name} onChange={(e) => onChange({ ...member, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="me">Email address</Label>
            <Input id="me" type="email" className="h-12" value={member.email ?? ""} onChange={(e) => onChange({ ...member, email: e.target.value })} />
            <p className="text-xs text-muted-foreground">We'll send an invite when you finish onboarding.</p>
          </div>
        </>
      )}

      {member.type === "passive_adult" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="pn">Name</Label>
            <Input id="pn" className="h-12" value={member.name} onChange={(e) => onChange({ ...member, name: e.target.value })} />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
            <div>
              <div className="font-medium">Add their details now?</div>
              <p className="text-xs text-muted-foreground">Improves portion accuracy. Skip to use a standard serving.</p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ ...member, detailsProvided: !member.detailsProvided })}
              className={cn(
                "h-7 w-12 rounded-full p-0.5 transition-colors",
                member.detailsProvided ? "bg-primary" : "bg-muted-foreground/30"
              )}
            >
              <div className={cn("h-6 w-6 bg-white rounded-full shadow transition-transform", member.detailsProvided && "translate-x-5")} />
            </button>
          </div>

          {member.detailsProvided && (
            <>
              <div className="space-y-2">
                <Label>Sex</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["male", "female"] as Sex[]).map((s) => (
                    <button key={s} type="button" onClick={() => onChange({ ...member, sex: s })}
                      className={cn(
                        "h-12 rounded-xl border-2 capitalize font-medium transition-all",
                        member.sex === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/60"
                      )}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdob">Date of birth</Label>
                <Input id="pdob" type="date" className="h-12" value={member.date_of_birth ?? ""} onChange={(e) => onChange({ ...member, date_of_birth: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw">Approximate weight (kg, optional)</Label>
                <Input id="pw" type="number" step="0.1" className="h-12" value={member.weight_kg ?? ""}
                  onChange={(e) => onChange({ ...member, weight_kg: e.target.value ? parseFloat(e.target.value) : undefined })} />
              </div>
            </>
          )}
        </>
      )}
    </StepShell>
  );
}
