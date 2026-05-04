import { StepShell } from "../components/StepShell";
import { OptionCard } from "../components/OptionCard";
import { Button } from "@/components/ui/button";

interface Props {
  selected?: boolean;
  value?: boolean;
  onChoose: (now: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  step: number;
  total: number;
}

export function StepMembersChoice({ value, onChoose, onNext, onBack, step, total }: Props) {
  return (
    <StepShell
      step={step} total={total} onBack={onBack}
      title="Who else are you cooking for?"
      subtitle="Other household members eat the same meals. We need to know who they are to calculate shopping quantities correctly. You can add their details now or later."
      footer={<Button onClick={onNext} disabled={value === undefined} className="w-full h-14 text-base">Continue</Button>}
    >
      <div className="space-y-3">
        <OptionCard
          selected={value === true}
          onClick={() => onChoose(true)}
          title="Add now"
          description="Takes 2 minutes per person. We'll ask for basic info so portions and shopping quantities are accurate from day one."
        />
        <OptionCard
          selected={value === false}
          onClick={() => onChoose(false)}
          title="Add later"
          description="We'll set other members to a standard portion for now. You can add their details any time in Settings."
        />
      </div>
    </StepShell>
  );
}
