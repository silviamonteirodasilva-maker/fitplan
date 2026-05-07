import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LeafIcon } from "@/onboarding/components/LeafIcon";
import { useRequireOnboarded } from "@/hooks/useRequireOnboarded";

const GOAL_LABEL: Record<string, string> = {
  fat_loss: "Fat loss",
  muscle_gain: "Muscle gain",
  recomp: "Recomposition",
  maintain: "Maintenance",
};

type Member = { id: string; name: string; is_onboarded: boolean; member_type: string; auth_user_id: string | null };

export default function Index() {
  const navigate = useNavigate();
  const { me, ready } = useRequireOnboarded();
  const [data, setData] = useState<{ name: string; goal: string | null; calories: number | null; household_name: string } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!ready || !me) return;
    (async () => {
      const [{ data: hh }, { data: mp }, { data: hhMembers }] = await Promise.all([
        supabase.from("households").select("name").eq("id", me.household_id).maybeSingle(),
        supabase.from("user_metabolic_profile").select("goal, goal_calories").eq("user_id", me.id).eq("is_active", true).maybeSingle(),
        supabase.from("users").select("id, name, is_onboarded, member_type, auth_user_id").eq("household_id", me.household_id),
      ]);
      setData({
        name: me.name,
        goal: mp?.goal ?? null,
        calories: mp?.goal_calories ? Math.round(Number(mp.goal_calories)) : null,
        household_name: hh?.name ?? "Your household",
      });
      setMembers((hhMembers ?? []) as Member[]);
    })();
  }, [ready, me]);

  if (!ready || !data) return <div className="min-h-screen bg-background" />;

  return (
    <main className="min-h-screen bg-background px-6 py-10 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-primary">
          <LeafIcon className="h-6 w-6" />
          <span className="font-display font-semibold">{data.household_name}</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/recipes")}>Recipes</Button>
      </div>

      <h1 className="font-display text-4xl font-semibold leading-tight">Your plan is on its way.</h1>
      <p className="mt-3 text-muted-foreground">
        The weekly meal planner is being built. Come back soon — your first week will be ready to plan.
      </p>

      <section className="mt-8 rounded-2xl bg-card border border-border p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="font-display text-lg font-semibold">{data.name}</div>
          {data.goal && (
            <span className="inline-flex items-center px-3 h-7 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {GOAL_LABEL[data.goal] ?? data.goal}
            </span>
          )}
        </div>
        {data.calories != null && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Daily calorie target</div>
            <div className="text-3xl font-display font-semibold mt-1 tabular-nums">
              {data.calories.toLocaleString()} <span className="text-base text-muted-foreground">kcal</span>
            </div>
          </div>
        )}
      </section>

      {members.length > 0 && (
        <section className="mt-4 rounded-2xl bg-card border border-border p-5">
          <div className="font-display text-base font-semibold mb-3">Household</div>
          <ul className="space-y-2 text-sm">
            {members.map((m) => (
              <li key={m.id} className="flex justify-between">
                <span className="text-foreground">{m.name}</span>
                <span className="text-muted-foreground">
                  {m.member_type === "active"
                    ? m.is_onboarded ? "Active" : "Awaiting profile"
                    : m.member_type === "passive_adult" ? "Passive adult" : "Child"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 mt-8">
        <Button variant="outline" onClick={() => navigate("/settings")} className="h-14 text-base">View profile</Button>
        <Button onClick={() => navigate("/recipes")} className="h-14 text-base">Browse recipes</Button>
      </div>
    </main>
  );
}
