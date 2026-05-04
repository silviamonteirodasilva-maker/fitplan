import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface Props {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}

export function Stepper({ value, onChange, min = 0, max = 7, suffix }: Props) {
  return (
    <div className="flex items-center gap-4">
      <Button
        type="button" variant="outline" size="icon"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="h-11 w-11 rounded-full"
        aria-label="Decrease"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <div className="flex-1 text-center">
        <span className="text-2xl font-display font-semibold tabular-nums">{value}</span>
        {suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
      </div>
      <Button
        type="button" variant="outline" size="icon"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="h-11 w-11 rounded-full"
        aria-label="Increase"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
