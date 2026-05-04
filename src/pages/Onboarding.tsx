import { useReducer, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { initialState, reducer, type MemberDraft } from "@/onboarding/state";
import { computeMetabolic } from "@/onboarding/engine/metabolic";
import { StepWelcome } from "@/onboarding/steps/StepWelcome";
import { StepGoal } from "@/onboarding/steps/StepGoal";
import { StepHousehold } from "@/onboarding/steps/StepHousehold";
import { StepBiometrics } from "@/onboarding/steps/StepBiometrics";
import { StepActivity } from "@/onboarding/steps/StepActivity";
import { StepPreferences } from "@/onboarding/steps/StepPreferences";
import { StepSummary } from "@/onboarding/steps/StepSummary";
import { StepMembersChoice } from "@/onboarding/steps/StepMembersChoice";
import { StepMember } from "@/onboarding/steps/StepMember";
import { StepDone } from "@/onboarding/steps/StepDone";
import { toast } from "sonner";

const FIXED_STEPS = 7; // Steps 1-7 always shown
// Step indices (1-based):
// 1 Welcome, 2 Goal, 3 Household, 4 Biometrics, 5 Activity, 6 Preferences, 7 Summary
// 8 MembersChoice (only if size>1)
// 9..(9+extras-1) Members (only if "Add now")
// last: Done

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [submitting, setSubmitting] = useState(false);

  const extras = Math.max(0, state.household.size - 1);
  const showMembersChoice = state.household.size > 1;
  const memberStepsCount = state.addMembersNow ? extras : 0;

  const totalSteps = useMemo(() => {
    let n = FIXED_STEPS; // 1..7
    if (showMembersChoice) n += 1; // step 8
    n += memberStepsCount;
    n += 1; // Done
    return n;
  }, [showMembersChoice, memberStepsCount]);

  if (loading) return null;
  if (!user) {
    navigate("/auth");
    return null;
  }

  const next = () => dispatch({ type: "next" });
  const back = () => dispatch({ type: "back" });

  const submit = async () => {
    setSubmitting(true);
    try {
      const r = computeMetabolic(state);
      const today = new Date().toISOString().slice(0, 10);
      const planEnd = new Date();
      planEnd.setDate(planEnd.getDate() + r.review_days);
      const planEndStr = planEnd.toISOString().slice(0, 10);

      // 1. household
      const { data: hh, error: hhErr } = await supabase
        .from("households")
        .insert({ name: state.household.name, plan_start_date: today, plan_duration_weeks: 12 })
        .select()
        .single();
      if (hhErr) throw hhErr;

      // 2. primary user
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
          is_onboarded: true,
        })
        .select()
        .single();
      if (usrErr) throw usrErr;

      // 3. biometrics
      const { data: bio, error: bioErr } = await supabase
        .from("user_biometrics")
        .insert({
          user_id: usr.id,
          sex: state.user.sex!,
          weight_kg: state.user.weight_kg!,
          height_cm: state.user.height_cm!,
          body_fat_pct: state.user.body_fat_pct ?? null,
          is_estimated: false,
        })
        .select()
        .single();
      if (bioErr) throw bioErr;

      // 4. activity
      const { data: act, error: actErr } = await supabase
        .from("user_activity_profile")
        .insert({
          user_id: usr.id,
          job_type: state.activity.job_type!,
          weekly_lifting_sessions: state.activity.weekly_lifting_sessions,
          avg_lifting_minutes: state.activity.avg_lifting_minutes,
          weekly_cardio_sessions: state.activity.weekly_cardio_sessions,
          avg_cardio_minutes: state.activity.avg_cardio_minutes,
          cardio_intensity: state.activity.cardio_intensity,
          weekly_yoga_sessions: state.activity.weekly_yoga_sessions,
          neat_level: state.activity.neat_level!,
        })
        .select()
        .single();
      if (actErr) throw actErr;

      // 5. preferences
      const disliked = state.preferences.disliked_ingredients
        .split(",").map((s) => s.trim()).filter(Boolean);
      const { error: prefErr } = await supabase
        .from("user_preferences")
        .insert({
          user_id: usr.id,
          dietary_restrictions: state.preferences.dietary_restrictions,
          disliked_ingredients: disliked,
          cooking_skill: state.preferences.cooking_skill!,
          has_thermomix: state.preferences.has_thermomix,
          max_cook_time_minutes: state.preferences.max_cook_time_minutes,
        });
      if (prefErr) throw prefErr;

      // 6. metabolic profile
      const { data: mp, error: mpErr } = await supabase
        .from("user_metabolic_profile")
        .insert({
          user_id: usr.id,
          biometrics_id: bio.id,
          activity_profile_id: act.id,
          bmr: r.bmr,
          bmr_formula: r.bmr_formula,
          tdee: r.tdee,
          goal: r.goal,
          goal_calories: r.goal_calories,
          goal_protein_g: r.goal_protein_g,
          goal_carbs_g: r.goal_carbs_g,
          goal_fat_g: r.goal_fat_g,
          plan_start_date: today,
          plan_end_date: planEndStr,
          review_date: planEndStr,
          deficit_capped: r.deficit_capped,
          calories_floored: r.calories_floored,
          weekly_change_target_kg: r.weekly_change_target_kg,
          is_active: true,
        })
        .select()
        .single();
      if (mpErr) throw mpErr;

      // 7. meal_macro_distribution defaults
      const { error: mmdErr } = await supabase
        .from("meal_macro_distribution")
        .insert({ metabolic_profile_id: mp.id });
      if (mmdErr) throw mmdErr;

      // 8. additional members
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
            is_onboarded: m.type === "active" ? false : true,
          })
          .select()
          .single();
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
      navigate("/");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? "Something went wrong saving your plan");
    } finally {
      setSubmitting(false);
    }
  };

  // Step routing
  const s = state.step;
  if (s === 1) return <StepWelcome onNext={next} />;
  if (s === 2) return <StepGoal state={state} onChange={(g) => dispatch({ type: "patch", patch: { goal: g } })} onNext={next} onBack={back} step={2} total={totalSteps} />;
  if (s === 3) return <StepHousehold state={state} onChangeName={(v) => dispatch({ type: "patchHousehold", patch: { name: v } })} onChangeSize={(n) => { dispatch({ type: "patchHousehold", patch: { size: n } }); dispatch({ type: "initMembers", count: n }); }} onNext={next} onBack={back} step={3} total={totalSteps} />;
  if (s === 4) return <StepBiometrics state={state} onPatch={(p) => dispatch({ type: "patchUser", patch: p })} onNext={next} onBack={back} step={4} total={totalSteps} />;
  if (s === 5) return <StepActivity state={state} onPatch={(p) => dispatch({ type: "patchActivity", patch: p })} onNext={next} onBack={back} step={5} total={totalSteps} />;
  if (s === 6) return <StepPreferences state={state} onPatch={(p) => dispatch({ type: "patchPreferences", patch: p })} onNext={next} onBack={back} step={6} total={totalSteps} />;
  if (s === 7) {
    const onNext = () => {
      if (showMembersChoice) next();
      else dispatch({ type: "goto", step: 999 }); // jump to done
    };
    return <StepSummary state={state} onNext={onNext} onBack={back} step={7} total={totalSteps} />;
  }
  if (s === 8 && showMembersChoice) {
    const onNext = () => {
      if (state.addMembersNow && extras > 0) next();
      else dispatch({ type: "goto", step: 999 });
    };
    return <StepMembersChoice
      value={state.addMembersNow}
      onChoose={(now) => dispatch({ type: "patch", patch: { addMembersNow: now } })}
      onNext={onNext} onBack={back} step={8} total={totalSteps}
    />;
  }
  // Member steps
  if (showMembersChoice && state.addMembersNow && s >= 9 && s < 9 + extras) {
    const idx = s - 9;
    const isLast = idx === extras - 1;
    const onMNext = () => { if (isLast) dispatch({ type: "goto", step: 999 }); else next(); };
    return <StepMember
      idx={idx} total={extras}
      member={state.members[idx] ?? { type: "passive_adult", name: "" }}
      onChange={(m: MemberDraft) => dispatch({ type: "setMember", idx, member: m })}
      onNext={onMNext} onBack={back}
      step={s} totalSteps={totalSteps} isLast={isLast}
    />;
  }
  // Done
  return <StepDone state={state} submitting={submitting} onSubmit={submit} />;
}
