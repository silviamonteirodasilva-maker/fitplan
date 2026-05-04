import { useState, ReactNode } from "react";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  label?: string;
  className?: string;
}

export function HintIcon({ children, label = "More info", className }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-center w-5 h-5 rounded-full text-muted-foreground hover:text-primary transition-colors",
          className
        )}
      >
        <Info className="h-4 w-4" />
      </button>
      {open && (
        <div className="mt-2 rounded-xl bg-secondary text-secondary-foreground p-3 text-xs leading-relaxed relative pr-8">
          {children}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 text-secondary-foreground/60 hover:text-secondary-foreground"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
