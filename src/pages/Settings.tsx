import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useRequireOnboarded } from "@/hooks/useRequireOnboarded";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MEAL_SLOTS } from "@/plan/utils";
import { toast } from "sonner";

const REQUIRED_SLOTS = ["breakfast", "lunch", "dinner"] as const;

export default function Settings() {
  const navigate = useNavigate();
  const { me, ready } = useRequireOnboarded();
  const [profile, setProfile] = useState<{ goal: string | null; calories: number | null }>({ goal: null, calories: null });
  const [cfg, setCfg] = useState<any>(null);
  const [planMode, setPlanMode] = useState<string>("ask");
  const [members, setMembers] = useState<{ id: string; name: string; is_household_admin: boolean }[]>([]);

  useEffect(() => {
    if (!ready || !me) return;
    (async () => {
      const { data: mp } = await supabase.from("user_metabolic_profile").select("goal, goal_calories").eq("user_id", me.id).eq("is_active", true).maybeSingle();
      setProfile({ goal: mp?.goal ?? null, calories: mp?.goal_calories ? Math.round(Number(mp.goal_calories)) : null });
      let { data: c } = await supabase.from("household_meal_config").select("*").eq("household_id", me.household_id).maybeSingle();
      if (!c) {
        const { data: created } = await supabase.from("household_meal_config").insert({ household_id: me.household_id }).select().single();
        c = created;
      }
      setCfg(c);
      const { data: hp } = await supabase.from("household_preferences").select("default_plan_mode").eq("household_id", me.household_id).maybeSingle();
      setPlanMode(hp?.default_plan_mode ?? "ask");
      const { data: ms } = await supabase.from("users").select("id, name, is_household_admin").eq("household_id", me.household_id);
      setMembers(ms ?? []);
    })();
  }, [ready, me]);

  const updateCfg = async (patch: any) => {
    if (!me || !cfg) return;
    if (!me.is_household_admin) { toast.error("Only the household admin can change this."); return; }
    const next = { ...cfg, ...patch };
    // Ensure at least one of breakfast/lunch/dinner stays on
    if (!next.show_breakfast && !next.show_lunch && !next.show_dinner) {
      toast.error("Keep at least one of breakfast, lunch or dinner."); return;
    }
    setCfg(next);
    const { error } = await supabase.from("household_meal_config").update(patch).eq("id", cfg.id);
    if (error) toast.error(error.message);
  };

  const updatePlanMode = async (v: string) => {
    if (!me) return;
    setPlanMode(v);
    await supabase.from("household_preferences").update({ default_plan_mode: v }).eq("household_id", me.household_id);
  };

  const transferAdmin = async (targetId: string) => {
    if (!me) return;
    if (!confirm("Are you sure? They will take over shopping and cooking settings.")) return;
    await supabase.from("users").update({ is_household_admin: false }).eq("id", me.id);
    await supabase.from("users").update({ is_household_admin: true }).eq("id", targetId);
    toast.success("Admin transferred.");
    navigate("/");
  };

  if (loading || !cfg) return <div className="min-h-screen bg-background" />;

  const isAdmin = me?.is_household_admin ?? false;

  return (
    <main className="min-h-screen bg-background pb-12">
      <header className="px-4 py-3 border-b flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ChevronLeft className="h-5 w-5" /></Button>
        <h1 className="font-display text-xl font-semibold">Settings</h1>
      </header>

      <section className="max-w-md mx-auto px-4 py-6 space-y-8">
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="font-display text-lg font-semibold">{me?.name ?? "—"}</div>
          <div className="mt-2 text-sm text-muted-foreground">Goal: <span className="text-foreground font-medium">{profile.goal ? (({fat_loss:"Fat loss",muscle_gain:"Muscle gain",recomp:"Recomposition",maintain:"Maintenance"} as Record<string,string>)[profile.goal] ?? profile.goal) : "—"}</span></div>
          <div className="mt-1 text-sm text-muted-foreground">Daily calories: <span className="text-foreground font-medium tabular-nums">{profile.calories != null ? `${profile.calories.toLocaleString()} kcal` : "—"}</span></div>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold mb-3">Meal slots</h2>
          {!isAdmin && <p className="text-xs text-muted-foreground mb-3">Read-only — only the household admin can change these.</p>}
          <div className="space-y-3">
            {MEAL_SLOTS.map(s => (
              <div key={s.key} className="flex items-center justify-between">
                <Label htmlFor={s.key}>{s.label}</Label>
                <Switch id={s.key} disabled={!isAdmin} checked={!!cfg[s.configKey]} onCheckedChange={(v) => updateCfg({ [s.configKey]: v })} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold mb-3">Week start day</h2>
          <Select value={String(cfg.week_start_day)} onValueChange={(v) => updateCfg({ week_start_day: Number(v) })} disabled={!isAdmin}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Sunday</SelectItem>
              <SelectItem value="1">Monday</SelectItem>
              <SelectItem value="2">Tuesday</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold mb-3">Plan defaults</h2>
          <Label className="text-sm">Default plan mode</Label>
          <Select value={planMode} onValueChange={updatePlanMode} disabled={!isAdmin}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ask">Ask each week</SelectItem>
              <SelectItem value="auto">Suggest a plan</SelectItem>
              <SelectItem value="empty">Start empty</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold mb-3">Household admin</h2>
          <p className="text-sm text-muted-foreground mb-3">Current admin: {members.find(m => m.is_household_admin)?.name ?? "—"}</p>
          {isAdmin && members.filter(m => !m.is_household_admin).length > 0 && (
            <div className="space-y-2">
              {members.filter(m => !m.is_household_admin).map(m => (
                <Button key={m.id} variant="outline" className="w-full justify-between" onClick={() => transferAdmin(m.id)}>
                  Transfer admin to {m.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
