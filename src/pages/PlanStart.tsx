import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRequireOnboarded } from "@/hooks/useRequireOnboarded";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function PlanStart() {
  const navigate = useNavigate();
  const { me, ready } = useRequireOnboarded();
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [weekStart, setWeekStart] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready || !me) return;
    (async () => {
      const { data: hh } = await supabase.from("households").select("plan_start_date").eq("id", me.household_id).maybeSingle();
      setHouseholdId(me.household_id);
      const psd = hh?.plan_start_date;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const planDate = psd ? new Date(psd) : nextWeekday(1);
      if (planDate <= today) { navigate("/"); return; }
      setDate(planDate);
      const { data: cfg } = await supabase.from("household_meal_config")
        .select("week_start_day").eq("household_id", me.household_id).maybeSingle();
      if (cfg) setWeekStart(cfg.week_start_day);
    })();
  }, [ready, me, navigate]);

  const confirm = async () => {
    if (!householdId || !date) return;
    setSaving(true);
    const iso = date.toISOString().slice(0, 10);
    const { error } = await supabase.from("households").update({ plan_start_date: iso }).eq("id", householdId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    navigate("/");
  };

  if (!ready || !date) return <div className="min-h-screen bg-background" />;

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10">
      <div className="max-w-md w-full">
        <h1 className="font-medium text-3xl sm:text-4xl leading-tight" style={{ letterSpacing: '-0.04em' }}>
          Your plan starts on {format(date, "EEEE, d LLL")}.
        </h1>
        <p className="mt-3 text-muted-foreground">
          That gives you a few days to browse recipes and do your first shop. No rush.
        </p>

        <div className="mt-8 space-y-3">
          <label className="text-sm font-medium">Change start date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-12", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            We recommend starting on your next {DAY_NAMES[weekStart]} — it gives you the weekend to prep.
          </p>
        </div>

        <Button onClick={confirm} disabled={saving} className="w-full h-12 mt-8">
          Sounds good →
        </Button>
      </div>
    </main>
  );
}

function nextWeekday(target: number) {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  const diff = (target - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}
