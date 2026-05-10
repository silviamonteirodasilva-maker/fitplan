import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const slides = [
  {
    title: "your kitchen, finally figured out.",
    body: (
      <>
        a meal planner that doesn't take itself seriously.{" "}
        <span style={{ color: '#FF2D87' }}>(it does take your protein seriously.)</span>
      </>
    ),
    art: (
      <svg viewBox="0 0 200 200" className="w-56 h-56" fill="none">
        <circle cx="100" cy="110" r="60" fill="#D4FF3D" opacity="0.25" />
        <ellipse cx="100" cy="125" rx="55" ry="18" fill="#FF2D87" opacity="0.15" />
        <path d="M55 110 Q100 80 145 110" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" />
        <circle cx="80" cy="100" r="6" fill="#D4FF3D" />
        <circle cx="115" cy="95" r="5" fill="#FF2D87" />
        <circle cx="125" cy="105" r="4" fill="#D4FF3D" />
      </svg>
    ),
  },
  {
    title: "two of you, one kitchen.",
    body: "Everyone eats the same meals. Portions adjust automatically to each person's targets.",
    art: (
      <svg viewBox="0 0 200 200" className="w-56 h-56" fill="none">
        <circle cx="70" cy="80" r="22" fill="#FF2D87" />
        <circle cx="130" cy="80" r="22" fill="#D4FF3D" />
        <rect x="45" y="105" width="50" height="55" rx="14" fill="#FF2D87" />
        <rect x="105" y="105" width="50" height="55" rx="14" fill="#D4FF3D" />
      </svg>
    ),
  },
  {
    title: "cook once, eat for days.",
    body: "Smart batch cooking means fewer sessions, less waste, and a shopping list that's always accurate.",
    art: (
      <svg viewBox="0 0 200 200" className="w-56 h-56" fill="none">
        <rect x="40" y="80" width="120" height="80" rx="14" fill="#F5F1EB" stroke="#0A0A0A" strokeWidth="1.5" />
        <rect x="40" y="80" width="120" height="20" rx="6" fill="#0A0A0A" />
        <circle cx="60" cy="90" r="3" fill="#FAFAFA" />
        <circle cx="80" cy="90" r="3" fill="#FAFAFA" />
        <circle cx="100" cy="90" r="3" fill="#FAFAFA" />
        <path d="M70 65 Q75 50 80 65 M95 60 Q100 45 105 60 M120 65 Q125 50 130 65"
          stroke="#D4FF3D" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "science-backed, life-proof.",
    body: "Targets calculated from your body and your routine. Flexible enough for real life — holidays, sick days, busy weeks.",
    art: (
      <svg viewBox="0 0 200 200" className="w-56 h-56" fill="none">
        <path d="M30 150 Q70 120 100 100 T170 50" stroke="#0A0A0A" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="170" cy="50" r="14" fill="#D4FF3D" />
        <path d="M164 50 l5 5 l8 -10" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    if (localStorage.getItem("hasSeenWelcome") === "true") {
      navigate("/auth", { replace: true });
    }
  }, [navigate]);

  const finish = (path: string) => {
    localStorage.setItem("hasSeenWelcome", "true");
    navigate(path);
  };

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -40 && idx < slides.length - 1) setIdx(idx + 1);
    if (dx > 40 && idx > 0) setIdx(idx - 1);
    startX.current = null;
  };

  const slide = slides[idx];
  const isLast = idx === slides.length - 1;
  const isFirst = idx === 0;

  return (
    <main
      className={`min-h-screen flex flex-col transition-colors duration-300 ${isFirst ? "bg-pinch-ink" : "bg-background"}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <header className="px-6 py-5 flex items-center justify-between">
        <img
          src={isFirst ? "/brand/pinch-wordmark-dark.svg" : "/brand/pinch-wordmark-light.svg"}
          alt="pinch"
          className="h-7"
        />
        {idx > 0 && (
          <button
            onClick={() => finish("/auth")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Skip
          </button>
        )}
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto">
        <div className="mb-10">{slide.art}</div>
        <h1
          className={`text-3xl sm:text-4xl font-medium leading-tight tracking-tight ${isFirst ? "text-pinch-milk" : "text-foreground"}`}
          style={{ letterSpacing: '-0.04em' }}
        >
          {slide.title}
        </h1>
        <p className={`mt-4 text-base leading-relaxed ${isFirst ? "text-pinch-milk/70" : "text-muted-foreground"}`}>
          {slide.body}
        </p>
      </section>

      <div className="flex justify-center gap-2 py-6">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === idx
                ? `w-8 ${isFirst ? "bg-pinch-hot-pink" : "bg-pinch-ink"}`
                : `w-2 ${isFirst ? "bg-pinch-milk/30" : "bg-border"}`
            }`}
          />
        ))}
      </div>

      <div className="px-6 pb-10 max-w-md w-full mx-auto space-y-3">
        {!isLast ? (
          <Button
            onClick={() => setIdx(idx + 1)}
            className={`w-full h-12 ${isFirst ? "bg-pinch-hot-pink text-pinch-ink hover:bg-pinch-hot-pink/90 border-0" : ""}`}
          >
            Next
          </Button>
        ) : (
          <>
            <Button onClick={() => finish("/auth?mode=signup")} className="w-full h-12">Get started</Button>
            <Button onClick={() => finish("/auth?mode=signin")} variant="outline" className="w-full h-12">
              I already have an account
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
