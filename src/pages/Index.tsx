import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { addDays, format, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, MoreVertical, LogOut, Settings as SettingsIcon, Pause, CalendarDays, LayoutGrid, Square, Search, Utensils } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LeafIcon } from "@/onboarding/components/LeafIcon";
import { MEAL_SLOTS, MealSlotKey, weekDays, isoDay, dayLabel } from "@/plan/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ViewMode = "day" | "3day" | "week";
type Slot = { id: string; day_of_week: number; meal_type: string; recipe_id: string | null; slot_state: string; notes: string | null; recipes?: { name: string; calories_per_serving: number | null; cook_time_minutes: number | null } | null };
type Recipe = { id: string; name: string; meal_type: string; calories_per_serving: number | null; protein_per_serving_g: number | null; carbs_per_serving_g: number | null; fat_per_serving_g: number | null; cook_time_minutes: number | null; tags: string[] | null; base_batch_servings: number; default_lasts_days: number; freezer_lasts_days: number | null; has_thermomix_variant: boolean };

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [household, setHousehold] = useState<{ id: string; name: string; plan_start_date: string | null } | null>(null);
  const [me, setMe] = useState<{ id: string; name: string; is_household_admin: boolean } | null>(null);
  const [weekStart, setWeekStart] = useState(1);
  const [activeSlots, setActiveSlots] = useState<MealSlotKey[]>(["breakfast", "lunch", "dinner"]);
  const [view, setView] = useState<ViewMode>(() => (localStorage.getItem("planView") as ViewMode) || "week");
  const [refDate, setRefDate] = useState(new Date());
  const [plan, setPlan] = useState<{ id: string; status: string } | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [pause, setPause] = useState<{ id: string; reason: string } | null>(null);
  const [planMode, setPlanMode] = useState<string | null>(null);
  const [showPlanChoice, setShowPlanChoice] = useState(false);
  const [pauseSheetOpen, setPauseSheetOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{ day: number; meal: MealSlotKey; existing?: Slot } | null>(null);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const days = useMemo(() => weekDays(weekStart, refDate), [weekStart, refDate]);

  const loadPlan = useCallback(async (hhId: string, weekStartDay: number) => {
    const start = weekDays(weekStartDay, refDate)[0];
    const startIso = isoDay(start);
    const { data: existing } = await supabase.from("weekly_plans")
      .select("id, status").eq("household_id", hhId).eq("week_start_date", startIso).maybeSingle();
    if (!existing) {
      setPlan(null); setSlots([]);
      const stored = localStorage.getItem(`planMode:${hhId}`);
      if (!stored) setShowPlanChoice(true);
      else if (stored === "empty") await createEmptyPlan(hhId, startIso);
      else if (stored === "auto") await autoGenerate(hhId, startIso);
      return;
    }
    setPlan(existing);
    const { data: ws } = await supabase.from("weekly_plan_slots")
      .select("id, day_of_week, meal_type, recipe_id, slot_state, notes, recipes(name, calories_per_serving, cook_time_minutes)")
      .eq("weekly_plan_id", existing.id);
    setSlots((ws ?? []) as any);
  }, [refDate]);

  const createEmptyPlan = async (hhId: string, startIso: string) => {
    const { data, error } = await supabase.from("weekly_plans")
      .insert({ household_id: hhId, week_start_date: startIso, status: "draft" }).select().single();
    if (error) { toast.error(error.message); return; }
    setPlan(data); setSlots([]); setShowPlanChoice(false);
  };

  const autoGenerate = async (hhId: string, startIso: string) => {
    const { count } = await supabase.from("recipes").select("id", { count: "exact", head: true }).eq("is_published", true);
    if (!count) {
      toast.message("Add some recipes to your library first, then we can suggest a plan.");
      await createEmptyPlan(hhId, startIso);
      return;
    }
    const { data: plan } = await supabase.from("weekly_plans")
      .insert({ household_id: hhId, week_start_date: startIso, status: "draft" }).select().single();
    if (!plan) return;
    const inserts: any[] = [];
    for (let dow = 0; dow < 7; dow++) {
      for (const slot of MEAL_SLOTS) {
        if (!activeSlots.includes(slot.key)) continue;
        const { data: recipes } = await supabase.from("recipes")
          .select("id").eq("meal_type", slot.key).eq("is_published", true).limit(20);
        if (!recipes?.length) continue;
        const pick = recipes[Math.floor(Math.random() * recipes.length)];
        inserts.push({ weekly_plan_id: plan.id, day_of_week: dow, meal_type: slot.key, recipe_id: pick.id, slot_state: "planned" });
      }
    }
    if (inserts.length) await supabase.from("weekly_plan_slots").insert(inserts);
    setShowPlanChoice(false);
    await loadPlan(hhId, weekStart);
  };

  // Bootstrap
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const { data: u, error: uErr } = await supabase.from("users")
        .select("id, name, is_onboarded, is_household_admin, household_id, households(id, name, plan_start_date)")
        .eq("auth_user_id", user.id).maybeSingle();
      console.log("[Index] users lookup", { authUserId: user.id, row: u, error: uErr });
      if (!u) { navigate("/onboarding"); return; }
      if (!u.is_onboarded) { navigate("/onboarding"); return; }
      const hh = u.households as any;
      // Plan-start gate
      if (hh?.plan_start_date) {
        const psd = new Date(hh.plan_start_date); psd.setHours(0,0,0,0);
        const today = new Date(); today.setHours(0,0,0,0);
        if (psd > today && !sessionStorage.getItem(`planStartSeen:${hh.id}`)) {
          sessionStorage.setItem(`planStartSeen:${hh.id}`, "1");
          navigate("/plan-start"); return;
        }
      }
      setHousehold(hh);
      setMe({ id: u.id, name: u.name, is_household_admin: u.is_household_admin });

      // Meal config
      let { data: cfg } = await supabase.from("household_meal_config").select("*").eq("household_id", u.household_id).maybeSingle();
      if (!cfg) {
        const { data: created } = await supabase.from("household_meal_config")
          .insert({ household_id: u.household_id }).select().single();
        cfg = created;
      }
      if (cfg) {
        setWeekStart(cfg.week_start_day);
        setActiveSlots(MEAL_SLOTS.filter(s => (cfg as any)[s.configKey]).map(s => s.key) as MealSlotKey[]);
      }
      const { data: hp } = await supabase.from("household_preferences").select("default_plan_mode").eq("household_id", u.household_id).maybeSingle();
      setPlanMode(hp?.default_plan_mode ?? null);

      // Active pause
      const { data: p } = await supabase.from("plan_pauses").select("id, reason")
        .eq("user_id", u.id).is("resumed_at", null).maybeSingle();
      if (p) setPause(p);

      await loadPlan(u.household_id, cfg?.week_start_day ?? 1);
      setBootstrapping(false);
    })();
  }, [user, loading, navigate, loadPlan]);

  useEffect(() => { localStorage.setItem("planView", view); }, [view]);

  const setSlotState = async (slot: Slot, slot_state: "planned" | "eating_out" | "skipped", recipe_id: string | null = null) => {
    const { error } = await supabase.from("weekly_plan_slots").update({ slot_state, recipe_id }).eq("id", slot.id);
    if (error) { toast.error(error.message); return; }
    setSlots(s => s.map(x => x.id === slot.id ? { ...x, slot_state, recipe_id } : x));
  };

  const upsertSlot = async (day: number, meal: MealSlotKey, recipe_id: string | null, slot_state = "planned") => {
    if (!plan) return;
    const existing = slots.find(s => s.day_of_week === day && s.meal_type === meal);
    if (existing) {
      const { error } = await supabase.from("weekly_plan_slots")
        .update({ recipe_id, slot_state }).eq("id", existing.id);
      if (error) { toast.error(error.message); return; }
      setSlots(s => s.map(x => x.id === existing.id ? { ...x, recipe_id, slot_state } : x));
    } else {
      const { data, error } = await supabase.from("weekly_plan_slots")
        .insert({ weekly_plan_id: plan.id, day_of_week: day, meal_type: meal, recipe_id, slot_state })
        .select("id, day_of_week, meal_type, recipe_id, slot_state, notes, recipes(name, calories_per_serving, cook_time_minutes)").single();
      if (error) { toast.error(error.message); return; }
      setSlots(s => [...s, data as any]);
    }
  };

  const saveNotes = async (slot: Slot, notes: string) => {
    await supabase.from("weekly_plan_slots").update({ notes }).eq("id", slot.id);
    setSlots(s => s.map(x => x.id === slot.id ? { ...x, notes } : x));
  };

  const openBrowser = async (mealType: MealSlotKey) => {
    const { data } = await supabase.from("recipes").select("*").eq("is_published", true).eq("meal_type", mealType).limit(50);
    setRecipes((data ?? []) as any);
    setBrowserOpen(true);
  };

  if (loading || bootstrapping) return <div className="min-h-screen bg-background" />;

  // PAUSED state
  if (pause) return <PausedScreen pause={pause} onResume={async () => {
    if (!me) return;
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("plan_pauses").update({ resumed_at: today }).eq("id", pause.id);
    // Adjust profile dates
    const { data: pauseRow } = await supabase.from("plan_pauses").select("paused_at").eq("id", pause.id).single();
    if (pauseRow) {
      const days = Math.max(0, Math.round((+new Date(today) - +new Date(pauseRow.paused_at)) / 86400000));
      const { data: mp } = await supabase.from("user_metabolic_profile")
        .select("id, plan_end_date, review_date").eq("user_id", me.id).eq("is_active", true).maybeSingle();
      if (mp) {
        const shift = (d: string | null) => d ? new Date(+new Date(d) + days * 86400000).toISOString().slice(0,10) : d;
        await supabase.from("user_metabolic_profile").update({
          plan_end_date: shift(mp.plan_end_date), review_date: shift(mp.review_date) ?? mp.review_date,
        }).eq("id", mp.id);
      }
      toast.success(`Welcome back. Plan adjusted by ${days} day${days === 1 ? "" : "s"}.`);
      if (days > 14) toast.message("It's been a couple of weeks. We recommend a quick weigh-in to keep your targets accurate.");
    }
    setPause(null);
  }} />;

  // Plan-mode choice
  if (showPlanChoice && household) return (
    <main className="min-h-screen bg-background flex flex-col px-6 py-10 max-w-md mx-auto">
      <h1 className="font-display text-3xl font-semibold">How do you want to start?</h1>
      <p className="text-muted-foreground mt-2">You can change this any time in settings.</p>
      <div className="space-y-3 mt-6">
        <ChoiceCard title="Build it for me" body="We'll suggest a week of meals based on your preferences. Swap anything you don't like."
          onClick={async () => {
            const { data: s } = await supabase.from("weekly_plans").select("week_start_date").limit(0);
            const startIso = isoDay(weekDays(weekStart, refDate)[0]);
            await autoGenerate(household.id, startIso);
          }} />
        <ChoiceCard title="I'll choose my own meals" body="Start with an empty week and pick everything yourself."
          onClick={async () => createEmptyPlan(household.id, isoDay(weekDays(weekStart, refDate)[0]))} />
      </div>
      <label className="flex items-center gap-2 mt-6 text-sm text-muted-foreground">
        <input type="checkbox" onChange={(e) => {
          if (e.target.checked) localStorage.setItem(`planMode:${household.id}`, "auto");
          else localStorage.removeItem(`planMode:${household.id}`);
        }} /> Remember my choice
      </label>
    </main>
  );

  const slotFor = (dow: number, meal: MealSlotKey) => slots.find(s => s.day_of_week === dow && s.meal_type === meal);
  const visibleDays = view === "week" ? days : view === "3day" ? days.slice(0, 3) : [days.find(d => isSameDay(d, refDate)) ?? days[0]];

  const totalSlotsCount = activeSlots.length * 7;
  const filledCount = slots.filter(s => s.slot_state === "planned" && s.recipe_id).length + slots.filter(s => s.slot_state !== "planned").length;
  const progressPct = totalSlotsCount > 0 ? Math.round((filledCount / totalSlotsCount) * 100) : 0;

  const statusPill = (() => {
    if (!plan) return { label: "Planning in progress", cls: "bg-muted text-muted-foreground" };
    if (plan.status === "confirmed") return { label: "Plan confirmed", cls: "bg-secondary text-secondary-foreground" };
    return { label: "Planning in progress", cls: "bg-muted text-muted-foreground" };
  })();

  return (
    <main className="min-h-screen bg-background pb-32">
      <header className="px-4 py-3 flex items-center justify-between border-b">
        <div>
          <div className="flex items-center gap-2 font-display font-semibold">
            <LeafIcon className="h-5 w-5 text-primary" />
            {household?.name ?? `Week of ${format(days[0], "d MMM")}`}
          </div>
          <span className={cn("inline-block mt-1 text-xs px-2 py-0.5 rounded-full", statusPill.cls)}>{statusPill.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <ViewToggle view={view} onChange={setView} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setPauseSheetOpen(true)}><Pause className="h-4 w-4 mr-2" /> Pause plan</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}><SettingsIcon className="h-4 w-4 mr-2" /> Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}><LogOut className="h-4 w-4 mr-2" /> Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="px-3 py-2 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setRefDate(d => addDays(d, view === "day" ? -1 : view === "3day" ? -3 : -7))}><ChevronLeft className="h-5 w-5" /></Button>
        <div className="text-sm font-medium">{format(visibleDays[0], "d MMM")}{visibleDays.length > 1 && ` – ${format(visibleDays[visibleDays.length - 1], "d MMM")}`}</div>
        <Button variant="ghost" size="icon" onClick={() => setRefDate(d => addDays(d, view === "day" ? 1 : view === "3day" ? 3 : 7))}><ChevronRight className="h-5 w-5" /></Button>
      </div>

      {totalSlotsCount === 0 ? (
        <EmptyState body="No meal slots active. Visit settings to enable some." />
      ) : (
        <div className="px-2 overflow-x-auto">
          <div className="grid gap-2" style={{ gridTemplateColumns: `90px repeat(${visibleDays.length}, minmax(110px, 1fr))` }}>
            <div />
            {visibleDays.map((d, i) => {
              const today = isSameDay(d, new Date());
              const lbl = dayLabel(d);
              return (
                <div key={i} className={cn("text-center py-2 rounded-md", today && "bg-secondary/50")}>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{lbl.day}</div>
                  <div className="font-display font-semibold">{lbl.date}</div>
                </div>
              );
            })}
            {activeSlots.map(meal => {
              const slotMeta = MEAL_SLOTS.find(s => s.key === meal)!;
              return (
                <div key={meal} className="contents">
                  <div className="flex items-center text-xs font-medium text-muted-foreground pr-2">{slotMeta.label}</div>
                  {visibleDays.map((d, di) => {
                    const dow = (d.getDay() - weekStart + 7) % 7;
                    const s = slotFor(dow, meal);
                    return (
                      <button key={di}
                        onClick={() => setActiveSlot({ day: dow, meal, existing: s })}
                        className={cn("border rounded-lg p-2 min-h-[68px] text-left hover:border-primary transition-colors bg-card text-card-foreground",
                          isSameDay(d, new Date()) && "ring-1 ring-primary/20")}>
                        {s?.slot_state === "eating_out" ? (
                          <div className="text-xs text-accent flex items-center gap-1"><Utensils className="h-3 w-3" /> Eating out</div>
                        ) : s?.slot_state === "skipped" ? (
                          <div className="text-xs text-muted-foreground">—</div>
                        ) : s?.recipe_id && s.recipes ? (
                          <>
                            <div className="text-sm font-medium truncate">{s.recipes.name}</div>
                            {s.recipes.calories_per_serving && <div className="text-xs text-muted-foreground mt-1">{Math.round(s.recipes.calories_per_serving)} kcal</div>}
                          </>
                        ) : (
                          <div className="text-2xl text-muted-foreground/50 font-light">+</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="text-xs text-muted-foreground">{filledCount} of {totalSlotsCount} meals planned</div>
          <div className="h-2 bg-muted rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <Button size="sm" variant="outline"
          disabled={!(plan?.status === "confirmed" || progressPct >= 80)}
          onClick={() => toast.message("Shopping list coming soon.")}>List</Button>
        <Button size="sm" disabled={!plan || plan.status === "confirmed"}
          onClick={async () => {
            if (!plan) return;
            await supabase.from("weekly_plans").update({ status: "confirmed" }).eq("id", plan.id);
            setPlan({ ...plan, status: "confirmed" });
            toast.success("Plan confirmed");
          }}>{plan?.status === "confirmed" ? "Confirmed" : "Confirm"}</Button>
      </div>

      {/* Slot sheet */}
      <Sheet open={!!activeSlot} onOpenChange={(o) => !o && setActiveSlot(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          {activeSlot && (
            <>
              <SheetHeader><SheetTitle className="font-display">{MEAL_SLOTS.find(s => s.key === activeSlot.meal)?.label}</SheetTitle></SheetHeader>
              <Tabs defaultValue="recipe" className="mt-4">
                <TabsList className="grid grid-cols-3 w-full"><TabsTrigger value="recipe">Recipe</TabsTrigger><TabsTrigger value="portions">Portions</TabsTrigger><TabsTrigger value="notes">Notes</TabsTrigger></TabsList>
                <TabsContent value="recipe" className="space-y-3 mt-4">
                  {activeSlot.existing?.recipe_id && activeSlot.existing.recipes ? (
                    <div className="border rounded-lg p-4">
                      <div className="font-medium">{activeSlot.existing.recipes.name}</div>
                      {activeSlot.existing.recipes.calories_per_serving && <div className="text-sm text-muted-foreground mt-1">{Math.round(activeSlot.existing.recipes.calories_per_serving)} kcal · {activeSlot.existing.recipes.cook_time_minutes ?? "–"} min</div>}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No recipe assigned yet.</p>}
                  <Button className="w-full" onClick={() => openBrowser(activeSlot.meal)}>{activeSlot.existing?.recipe_id ? "Swap recipe" : "Choose a recipe"}</Button>
                  {activeSlot.existing && (
                    <>
                      <Button variant="outline" className="w-full" onClick={async () => { await setSlotState(activeSlot.existing!, "eating_out"); setActiveSlot(null); }}><Utensils className="h-4 w-4 mr-2" /> Mark as eating out</Button>
                      <Button variant="ghost" className="w-full" onClick={async () => { await setSlotState(activeSlot.existing!, "skipped"); setActiveSlot(null); }}>Skip this meal</Button>
                    </>
                  )}
                </TabsContent>
                <TabsContent value="portions" className="mt-4">
                  <p className="text-sm text-muted-foreground">Per-person portions calculated once recipes are assigned and confirmed.</p>
                </TabsContent>
                <TabsContent value="notes" className="mt-4">
                  <NotesField slot={activeSlot.existing} onSave={(notes) => activeSlot.existing && saveNotes(activeSlot.existing, notes)} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Recipe browser */}
      <Sheet open={browserOpen} onOpenChange={setBrowserOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl h-[90vh] overflow-y-auto">
          <SheetHeader><SheetTitle className="font-display">Choose a recipe</SheetTitle></SheetHeader>
          <RecipeBrowser recipes={recipes}
            onPick={async (r) => {
              if (!activeSlot) return;
              await upsertSlot(activeSlot.day, activeSlot.meal, r.id, "planned");
              setBrowserOpen(false); setActiveSlot(null);
            }} />
        </SheetContent>
      </Sheet>

      {/* Pause sheet */}
      <PauseSheet open={pauseSheetOpen} onOpenChange={setPauseSheetOpen} userId={me?.id} onPaused={(p) => setPause(p)} />
    </main>
  );
}

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const item = (v: ViewMode, icon: React.ReactNode, label: string) => (
    <Button variant={view === v ? "secondary" : "ghost"} size="icon" aria-label={label} onClick={() => onChange(v)}>{icon}</Button>
  );
  return (
    <div className="flex">
      {item("day", <Square className="h-4 w-4" />, "Day view")}
      {item("3day", <LayoutGrid className="h-4 w-4" />, "3-day view")}
      {item("week", <CalendarDays className="h-4 w-4" />, "Week view")}
    </div>
  );
}

function ChoiceCard({ title, body, onClick }: { title: string; body: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left border rounded-2xl p-5 hover:border-primary transition-colors bg-card">
      <div className="font-display font-semibold text-lg">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{body}</div>
    </button>
  );
}

function EmptyState({ body }: { body: string }) {
  return <div className="text-center text-muted-foreground py-16 px-6">{body}</div>;
}

function NotesField({ slot, onSave }: { slot?: Slot; onSave: (n: string) => void }) {
  const [v, setV] = useState(slot?.notes ?? "");
  if (!slot) return <p className="text-sm text-muted-foreground">Save a recipe first to add notes.</p>;
  return (
    <div className="space-y-2">
      <Textarea value={v} onChange={(e) => setV(e.target.value)} placeholder="Add a note for this meal…" rows={5} />
      <Button onClick={() => onSave(v)} size="sm">Save note</Button>
    </div>
  );
}

function RecipeBrowser({ recipes, onPick }: { recipes: Recipe[]; onPick: (r: Recipe) => void }) {
  const [q, setQ] = useState("");
  const filtered = recipes.filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()));
  if (recipes.length === 0) return <p className="mt-6 text-sm text-muted-foreground">No recipes yet. Add some to your library to start picking meals.</p>;
  return (
    <div className="mt-4 space-y-3">
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recipes…" className="pl-9" />
      </div>
      <div className="space-y-2">
        {filtered.map(r => (
          <button key={r.id} onClick={() => onPick(r)} className="w-full text-left border rounded-lg p-3 hover:border-primary bg-card">
            <div className="flex items-center justify-between">
              <div className="font-medium">{r.name}</div>
              {r.has_thermomix_variant && <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">TM</span>}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {r.calories_per_serving && `${Math.round(r.calories_per_serving)} kcal · `}
              {r.cook_time_minutes && `${r.cook_time_minutes} min · `}
              {r.base_batch_servings} servings · keeps {r.default_lasts_days}d{r.freezer_lasts_days ? ` / ${r.freezer_lasts_days}d frozen` : ""}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PausedScreen({ pause, onResume }: { pause: { reason: string }; onResume: () => void }) {
  const copy = pause.reason === "sickness"
    ? "Rest up. Eat what your body asks for — whole foods, hydration, whatever feels right. No plan to follow today."
    : pause.reason === "holiday"
    ? "Enjoy your time away. Nothing to track, nothing to plan."
    : "Plan paused. Take the time you need.";
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <Pause className="h-10 w-10 text-muted-foreground mb-4" />
      <h1 className="font-display text-3xl font-semibold">Plan paused</h1>
      <p className="text-muted-foreground mt-3 max-w-md">{copy}</p>
      <Button onClick={onResume} className="mt-8">I'm back</Button>
    </main>
  );
}

function PauseSheet({ open, onOpenChange, userId, onPaused }: { open: boolean; onOpenChange: (o: boolean) => void; userId?: string; onPaused: (p: { id: string; reason: string }) => void }) {
  const [reason, setReason] = useState<"sickness" | "holiday" | "other" | null>(null);
  const [returnDate, setReturnDate] = useState("");
  const [notes, setNotes] = useState("");
  const [endDate, setEndDate] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) return;
    supabase.from("user_metabolic_profile").select("plan_end_date").eq("user_id", userId).eq("is_active", true).maybeSingle()
      .then(({ data }) => setEndDate(data?.plan_end_date ?? null));
  }, [open, userId]);

  const projected = useMemo(() => {
    if (!endDate || !returnDate) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const ret = new Date(returnDate);
    const days = Math.max(0, Math.round((+ret - +today) / 86400000));
    return new Date(+new Date(endDate) + days * 86400000).toISOString().slice(0, 10);
  }, [endDate, returnDate]);

  const submit = async () => {
    if (!reason || !userId) return;
    const { data, error } = await supabase.from("plan_pauses")
      .insert({ user_id: userId, reason, expected_return_date: returnDate || null, notes: notes || null })
      .select("id, reason").single();
    if (error) { toast.error(error.message); return; }
    onPaused(data as any); onOpenChange(false);
  };

  const card = reason === "sickness"
    ? "Your plan end date will shift forward by however many days you're paused. You won't lose any progress — your plan stays the same length, it just finishes a little later. Rest first."
    : reason === "holiday"
    ? "Your plan end date will move forward to account for your time away. Same plan, same goals — the calendar just adjusts around your life."
    : reason === "other"
    ? "Your plan end date will shift forward by the number of days you're paused, so your full plan stays intact."
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader><SheetTitle className="font-display">Taking a break?</SheetTitle></SheetHeader>
        <div className="space-y-3 mt-4">
          <ReasonCard title="I'm not feeling well" body="Plan paused. Eat what feels right. No targets, no pressure." active={reason === "sickness"} onClick={() => setReason("sickness")} />
          <ReasonCard title="I'm on holiday" body="Enjoy it. Your plan will be here when you're back." active={reason === "holiday"} onClick={() => setReason("holiday")} />
          <ReasonCard title="Other reason" body="Tell us a bit if you'd like." active={reason === "other"} onClick={() => setReason("other")} />
          {reason === "other" && (
            <Textarea placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          )}
          {reason && (
            <>
              <div>
                <label className="text-sm font-medium">When do you expect to be back? (optional)</label>
                <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
              </div>
              <div className="bg-secondary/40 rounded-lg p-3 text-sm text-secondary-foreground">{card}</div>
              {projected && endDate && (
                <div className="text-xs text-muted-foreground">Current end date: {endDate} → New end date: {projected}</div>
              )}
              <Button className="w-full" onClick={submit}>Pause plan</Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ReasonCard({ title, body, active, onClick }: { title: string; body: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("w-full text-left border rounded-xl p-4 transition-colors", active ? "border-primary bg-secondary/30" : "hover:border-primary/50")}>
      <div className="font-medium">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{body}</div>
    </button>
  );
}
