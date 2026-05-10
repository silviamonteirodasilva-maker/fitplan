import { ReactNode } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface Props {
  step: number;
  total: number;
  onBack?: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
}

export function StepShell({ step, total, onBack, title, subtitle, children, footer }: Props) {
  const pct = (step / total) * 100;
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 pt-6 pb-4 max-w-xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-4">
          {onBack ? (
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back" className="-ml-2">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : <div className="w-10" />}
          <Progress value={pct} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{step}/{total}</span>
        </div>
      </header>

      <main className="flex-1 px-4 max-w-xl mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-medium text-foreground leading-tight">{title}</h1>
        {subtitle && <p className="mt-3 text-muted-foreground text-base leading-relaxed">{subtitle}</p>}
        <div className="mt-8 space-y-6 pb-32">{children}</div>
      </main>

      <footer className="sticky bottom-0 bg-gradient-to-t from-background via-background to-background/0 pt-6 pb-6 px-4">
        <div className="max-w-xl mx-auto">{footer}</div>
      </footer>
    </div>
  );
}
