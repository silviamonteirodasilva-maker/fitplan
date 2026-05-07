import { useReducer, useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { initialState, reducer, type MemberDraft, type OnboardingState } from "@/onboarding/state";
import { computeMetabolic } from "@/onboarding/engine/metabolic";
import { StepWelcome } from "@/onboarding/steps/StepWelcome";
import { StepGoal } from "@/onboarding/steps/StepGoal";
import { StepHousehold } from "@/onboarding/steps/StepHousehold";
import { StepBiometrics } from "@/onboarding/steps/StepBiometrics";
import { StepActivity } from "@/onboarding/steps/StepActivity";
import { StepPreferences } from "@/onboarding/steps/StepPreferences";
import { StepCooking } from "@/onboarding/steps/StepCooking";
import { StepSummary } from "@/onboarding/steps/StepSummary";
import { StepMembersChoice } from "@/onboarding/steps/StepMembersChoice";
import { StepMember } from "@/onboarding/steps/StepMember";
import { StepDone } from "@/onboarding/steps/StepDone";
import { toast } from "sonner";
import { setOnboardedCache } from "@/hooks/useRequireOnboarded";

// ----------------------------------------------------------------------------
// Step orchestration — admin (full) flow vs invite-only (shortened) flow
// ----------------------------------------------------------------------------
// Full admin flow (10 steps + dynamic members):
//   1 Welcome, 2 Goal, 3 Household, 4 Biometrics, 5 Activity,
//   6 Preferences, 7 Cooking, 8 Summary, 9 MembersChoice (if size>1),
//   10..(10+N-1) Members (if "Add now"), last: Done
// Invite-only flow (4 steps):
//   1 Goal, 2 Biometrics, 3 Activity, 4 Preferences, 5 Done

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [submitting, setSubmitting] = useState(false);
  const [invitedRow, setInvitedRow] = useState<{ id: string; household_id: string; name: string } | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  // On mount, detect whether this user is joining via invite (existing users row with matching email)
  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      // Already linked?
      const { data: linked } = await supabase
        .from("users")
        .select("id, household_id, name, is_onboarded")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (linked?.is_onboarded) { navigate("/"); return; }
      if (linked) {
        // Already linked but not onboarded — treat as invite-only continuation
        setInvitedRow({ id: linked.id, household_id: linked.household_id, name: linked.name });
        dispatch({ type: "patch", patch: { inviteOnly: true, user: { ...state.user, name: linked.name ?? "" } } });
        setBootstrapped(true);
        return;
      }
      // Look for a pending invite row matching email
      if (user.email) {
        const { data: invite } = await supabase
          .from("users")
          .select("id, household_id, name")
          .ilike("email", user.email)
          .is("auth_user_id", null)
          .maybeSingle();
        if (invite) {
          // Claim it
          const { error: claimErr } = await supabase
            .from("users")
            .update({ auth_user_id: user.id })
            .eq("id", invite.id);
          if (!claimErr) {
            setInvitedRow(invite);
            dispatch({ type: "patch", patch: { inviteOnly: true, user: { ...state.user, name: invite.name ?? "" } } });
          }
        }
      }
      setBootstrapped(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const extras = Math.max(0, state.household.size - 1);
  const showMembersChoice = !state.inviteOnly && state.household.size > 1;
  const memberStepsCount = !state.inviteOnly && state.addMembersNow ? extras : 0;

  const totalSteps = useMemo(() => {
    if (state.inviteOnly) return 5; // Goal, Bio, Activity, Prefs, Done
    let n = 8; // 1..8
    if (showMembersChoice) n += 1;
    n += memberStepsCount;
    n += 1; // Done
    return n;
  }, [state.inviteOnly, showMembersChoice, memberStepsCount]);

  if (loading || !bootstrapped) return <div className="min-h-screen bg-background" />;
  if (!user) { navigate("/auth"); return null; }

  const next = () => dispatch({ type: "next" });
  const back = () => dispatch({ type: "back" });

  // ------------------ SUBMIT (full admin flow) ------------------
  const submitFull = async () => {
    setSubmitting(true);
    try {
      const r = computeMetabolic(state);
      const today = new Date().toISOString().slice(0, 10);
      const planEnd = new Date();
      planEnd.setDate(planEnd.getDate() + r.review_days);
      const planEndStr = planEnd.toISOString().slice(0, 10);

      const { data: { session } } = await supabase.auth.getSession();
      console.log("[submitFull] auth.uid() =", session?.user?.id ?? "null — no active session");
      if (!session) throw new Error("No active session — please sign in again before completing setup.");

      const { data: hh, error: hhErr } = await supabase
        .from("households")
        .insert({ name: state.household.name, plan_start_date: state.cooking.plan_start_date, plan_duration_weeks: 12 })
        .select().single();
      if (hhErr) throw hhErr;

      const { data: usr, error: usrErr } = await supabase
        .from("users")
        .insert({
          auth_user_id: user.id,
          household_id: hh.id,
          name: state.user.name,
          email: user.email,
          date_of_birth: state.user.date_of_birth,
          role: "primary",
          member_type: "active",
          is_household_admin: true,
          is_onboarded: true,
        })
        .select().single();
      if (usrErr) throw usrErr;

      await writeProfileFor(usr.id, state, r, today, planEndStr);

      // household_preferences
      const { error: hpErr } = await supabase.from("household_preferences").insert({
        household_id: hh.id,
        preferred_shopping_day: state.cooking.preferred_shopping_day,
        topup_shopping_day: state.cooking.topup_shopping_day,
        cooking_sessions_per_week: state.cooking.cooking_sessions_per_week,
        cooking_style: state.cooking.cooking_style ?? "mixed",
        max_fresh_cook_days: state.cooking.max_fresh_cook_days,
      });
      if (hpErr) throw hpErr;

      // additional members
      for (const m of state.members) {
        if (!m.name.trim()) continue;
        const { data: mUser, error: mErr } = await supabase
          .from("users")
          .insert({
            household_id: hh.id,
            name: m.name,
            email: m.email ?? null,
            date_of_birth: m.date_of_birth ?? null,
            role: "member",
            member_type: m.type,
            created_by_user_id: usr.id,
            is_household_admin: false,
            is_onboarded: m.type === "active" ? false : true,
          })
          .select().single();
        if (mErr) throw mErr;

        if (m.type === "passive_adult" && m.detailsProvided && m.sex) {
          await supabase.from("user_biometrics").insert({
            user_id: mUser.id,
            sex: m.sex,
            weight_kg: m.weight_kg ?? 70,
            height_cm: 170,
            is_estimated: true,
          });
        }
      }

      toast.success("All set!");
      setOnboardedCache({ id: usr.id, household_id: hh.id, name: state.user.name, is_household_admin: true });
      navigate("/");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? "Something went wrong saving your plan");
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------ SUBMIT (invite-only) ------------------
  const submitInvite = async () => {
    if (!invitedRow) return;
    setSubmitting(true);
    try {
      const r = computeMetabolic(state);
      const today = new Date().toISOString().slice(0, 10);
      const planEnd = new Date();
      planEnd.setDate(planEnd.getDate() + r.review_days);
      const planEndStr = planEnd.toISOString().slice(0, 10);

      const { error: updErr } = await supabase
        .from("users")
        .update({
          name: state.user.name || invitedRow.name,
          date_of_birth: state.user.date_of_birth,
          is_onboarded: true,
          member_type: "active",
        })
        .eq("id", invitedRow.id);
      if (updErr) throw updErr;

      await writeProfileFor(invitedRow.id, state, r, today, planEndStr);
      toast.success("All set!");
      setOnboardedCache({ id: invitedRow.id, household_id: invitedRow.household_id, name: state.user.name || invitedRow.name, is_household_admin: false });
      navigate("/");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? "Something went wrong saving your plan");
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------- ROUTING --------------------
  const s = state.step;

  // ---------- INVITE-ONLY FLOW ----------
  if (state.inviteOnly) {
    if (s === 1) return <StepGoal state={state} step={1} total={totalSteps}
        onChange={(g) => dispatch({ type: "patch", patch: { goal: g } })}
        onNext={next} onBack={() => {}} />;
    if (s === 2) return <StepBiometrics state={state} step={2} total={totalSteps}
        onPatch={(p) => dispatch({ type: "patchUser", patch: p })}
        onPatchUnit={(u) => dispatch({ type: "patch", patch: { unitSystem: u } })}
        onNext={next} onBack={back} />;
    if (s === 3) return <StepActivity state={state} step={3} total={totalSteps}
        onPatch={(p) => dispatch({ type: "patchActivity", patch: p })}
        onNext={next} onBack={back} />;
    if (s === 4) return <StepPreferences state={state} step={4} total={totalSteps}
        onPatch={(p) => dispatch({ type: "patchPreferences", patch: p })}
        onNext={next} onBack={back} />;
    return <StepDone state={state} submitting={submitting} onSubmit={submitInvite} />;
  }

  // ---------- FULL ADMIN FLOW ----------
  if (s === 1) return <StepWelcome onNext={next} />;
  if (s === 2) return <StepGoal state={state} step={2} total={totalSteps}
      onChange={(g) => dispatch({ type: "patch", patch: { goal: g } })}
      onNext={next} onBack={back} />;
  if (s === 3) return <StepHousehold state={state} step={3} total={totalSteps}
      onChangeName={(v) => dispatch({ type: "patchHousehold", patch: { name: v } })}
      onChangeSize={(n) => { dispatch({ type: "patchHousehold", patch: { size: n } }); dispatch({ type: "initMembers", count: n }); }}
      onNext={next} onBack={back} />;
  if (s === 4) return <StepBiometrics state={state} step={4} total={totalSteps}
      onPatch={(p) => dispatch({ type: "patchUser", patch: p })}
      onPatchUnit={(u) => dispatch({ type: "patch", patch: { unitSystem: u } })}
      onNext={next} onBack={back} />;
  if (s === 5) return <StepActivity state={state} step={5} total={totalSteps}
      onPatch={(p) => dispatch({ type: "patchActivity", patch: p })}
      onNext={next} onBack={back} />;
  if (s === 6) return <StepPreferences state={state} step={6} total={totalSteps}
      onPatch={(p) => dispatch({ type: "patchPreferences", patch: p })}
      onNext={next} onBack={back} />;
  if (s === 7) return <StepCooking state={state} step={7} total={totalSteps}
      onPatch={(p) => dispatch({ type: "patchCooking", patch: p })}
      onNext={next} onBack={back} />;
  if (s === 8) {
    const onNext = () => {
      if (showMembersChoice) next();
      else dispatch({ type: "goto", step: 999 });
    };
    return <StepSummary state={state} step={8} total={totalSteps} onNext={onNext} onBack={back} />;
  }
  if (s === 9 && showMembersChoice) {
    const onNext = () => {
      if (state.addMembersNow && extras > 0) next();
      else dispatch({ type: "goto", step: 999 });
    };
    return <StepMembersChoice value={state.addMembersNow}
      onChoose={(now) => dispatch({ type: "patch", patch: { addMembersNow: now } })}
      onNext={onNext} onBack={back} step={9} total={totalSteps} />;
  }
  if (showMembersChoice && state.addMembersNow && s >= 10 && s < 10 + extras) {
    const idx = s - 10;
    const isLast = idx === extras - 1;
    const onMNext = () => { if (isLast) dispatch({ type: "goto", step: 999 }); else next(); };
    return <StepMember
      idx={idx} total={extras}
      member={state.members[idx] ?? { type: "passive_adult", name: "" }}
      onChange={(m: MemberDraft) => dispatch({ type: "setMember", idx, member: m })}
      onNext={onMNext} onBack={back}
      step={s} totalSteps={totalSteps} isLast={isLast} />;
  }
  return <StepDone state={state} submitting={submitting} onSubmit={submitFull} />;
}

// Helper: write biometrics, activity, preferences, metabolic profile, macro distribution for given user_id
async function writeProfileFor(
  userId: string,
  state: OnboardingState,
  r: ReturnType<typeof computeMetabolic>,
  today: string,
  planEndStr: string,
) {
  const { data: bio, error: bioErr } = await supabase.from("user_biometrics").insert({
    user_id: userId,
    sex: state.user.sex!,
    weight_kg: state.user.weight_kg!,
    height_cm: state.user.height_cm!,
    body_fat_pct: state.user.body_fat_pct ?? null,
    is_estimated: false,
  }).select().single();
  if (bioErr) throw bioErr;

  const { data: act, error: actErr } = await supabase.from("user_activity_profile").insert({
    user_id: userId,
    job_type: state.activity.job_type!,
    weekly_lifting_sessions: state.activity.weekly_lifting_sessions,
    avg_lifting_minutes: state.activity.avg_lifting_minutes,
    weekly_cardio_sessions: state.activity.weekly_cardio_sessions,
    avg_cardio_minutes: state.activity.avg_cardio_minutes,
    cardio_intensity: state.activity.cardio_intensity,
    weekly_yoga_sessions: state.activity.weekly_yoga_sessions,
    avg_yoga_minutes: state.activity.avg_yoga_minutes,
    neat_level: state.activity.neat_level!,
  }).select().single();
  if (actErr) throw actErr;

  const hasThermomix = state.preferences.available_appliances.includes("Thermomix");
  const { error: prefErr } = await supabase.from("user_preferences").insert({
    user_id: userId,
    dietary_restrictions: state.preferences.dietary_restrictions,
    disliked_ingredients: state.preferences.disliked_ingredients,
    cooking_skill: state.preferences.cooking_skill!,
    has_thermomix: hasThermomix,
    available_appliances: state.preferences.available_appliances,
    max_cook_time_minutes: state.preferences.max_cook_time_minutes,
  });
  if (prefErr) throw prefErr;

  const { data: mp, error: mpErr } = await supabase.from("user_metabolic_profile").insert({
    user_id: userId,
    biometrics_id: bio.id,
    activity_profile_id: act.id,
    bmr: r.bmr, bmr_formula: r.bmr_formula, tdee: r.tdee, goal: r.goal,
    goal_calories: r.goal_calories, goal_protein_g: r.goal_protein_g,
    goal_carbs_g: r.goal_carbs_g, goal_fat_g: r.goal_fat_g,
    plan_start_date: today, plan_end_date: planEndStr, review_date: planEndStr,
    deficit_capped: r.deficit_capped, calories_floored: r.calories_floored,
    weekly_change_target_kg: r.weekly_change_target_kg, is_active: true,
  }).select().single();
  if (mpErr) throw mpErr;

  const { error: mmdErr } = await supabase.from("meal_macro_distribution").insert({ metabolic_profile_id: mp.id });
  if (mmdErr) throw mmdErr;
}
