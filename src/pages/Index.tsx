import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LeafIcon } from "@/onboarding/components/LeafIcon";

const GOAL_LABEL: Record<string, string> = {
  fat_loss: "Fat loss",
  muscle_gain: "Muscle gain",
  recomp: "Recomposition",
  maintain: "Maintenance",
};

type Member = { id: string; name: string; is_onboarded: boolean; member_type: string; auth_user_id: string | null };

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<{ name: string; goal: string | null; calories: number | null; household_name: string } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth?mode=signin"); return; }

    (async () => {
      const { data: u, error } = await supabase
        .from("users")
        .select("id, name, is_onboarded, household_id, households(name)")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      console.log("[Index] users lookup", { authUserId: user.id, row: u, error });

      if (error) { console.error(error); return; }
      if (!u) { navigate("/onboarding"); return; }
      if (!u.is_onboarded) { navigate("/onboarding"); return; }

      const { data: mp } = await supabase
        .from("user_metabolic_profile")
        .select("goal, goal_calories")
        .eq("user_id", u.id)
        .eq("is_active", true)
        .maybeSingle();

      const { data: hhMembers } = await supabase
        .from("users")
        .select("id, name, is_onboarded, member_type, auth_user_id")
        .eq("household_id", u.household_id);

      setMe({
        name: u.name,
        goal: mp?.goal ?? null,
        calories: mp?.goal_calories ? Math.round(Number(mp.goal_calories)) : null,
        household_name: (u.households as any)?.name ?? "Your household",
      });
      setMembers((hhMembers ?? []) as Member[]);
      setReady(true);
    })();
  }, [user, loading, navigate]);

  if (loading || !ready) return <div className="min-h-screen bg-background" />;

  return (
    <main className="min-h-screen bg-background px-6 py-10 max-w-xl mx-auto">
      <div className="flex items-center gap-2 text-primary mb-6">
        <LeafIcon className="h-6 w-6" />
        <span className="font-display font-semibold">{me?.household_name}</span>
      </div>

      <h1 className="font-display text-4xl font-semibold leading-tight">Your plan is on its way.</h1>
      <p className="mt-3 text-muted-foreground">
        The weekly meal planner is being built. Come back soon — your first week will be ready to plan.
      </p>

      <section className="mt-8 rounded-2xl bg-card border border-border p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="font-display text-lg font-semibold">{me?.name}</div>
          {me?.goal && (
            <span className="inline-flex items-center px-3 h-7 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {GOAL_LABEL[me.goal] ?? me.goal}
            </span>
          )}
        </div>
        {me?.calories != null && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Daily calorie target</div>
            <div className="text-3xl font-display font-semibold mt-1 tabular-nums">
              {me.calories.toLocaleString()} <span className="text-base text-muted-foreground">kcal</span>
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
                    ? m.is_onboarded
                      ? "Active"
                      : "Awaiting profile"
                    : m.member_type === "passive_adult"
                    ? "Passive adult"
                    : "Child"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Button onClick={() => navigate("/settings")} className="w-full h-14 text-base mt-8">
        View my profile
      </Button>
    </main>
  );
}
