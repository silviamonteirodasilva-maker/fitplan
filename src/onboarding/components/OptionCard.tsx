import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Props {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  disabled?: boolean;
}

export function OptionCard({ selected, onClick, title, description, meta, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full text-left rounded-2xl border-2 p-5 transition-all bg-card",
        "hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary shadow-[var(--shadow-card)]" : "border-border",
        disabled && "opacity-50 cursor-not-allowed hover:border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-lg font-semibold text-foreground">{title}</div>
          {description && <div className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{description}</div>}
          {meta && <div className="mt-2 text-xs text-accent font-medium">{meta}</div>}
        </div>
        {selected && (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Check className="h-4 w-4" />
          </div>
        )}
      </div>
    </button>
  );
}
