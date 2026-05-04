import { Button } from "@/components/ui/button";
import { LeafIcon } from "../components/LeafIcon";

export function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-8">
          <LeafIcon className="h-8 w-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-semibold leading-tight text-foreground">
          Your kitchen, your goals, your plan.
        </h1>
        <p className="mt-5 text-muted-foreground text-base leading-relaxed">
          We'll ask you a few questions to build a meal plan calibrated to your body, your household, and your life. Takes about 3 minutes.
        </p>
      </main>
      <footer className="px-6 pb-10">
        <Button onClick={onNext} className="w-full max-w-md mx-auto h-14 text-base flex" size="lg">
          Let's start
        </Button>
      </footer>
    </div>
  );
}
