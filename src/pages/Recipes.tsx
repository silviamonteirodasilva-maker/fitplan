import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Clock, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRequireOnboarded } from "@/hooks/useRequireOnboarded";
import { MEAL_TYPE_LABEL, TAG_OPTIONS } from "@/recipes/constants";
import { cn } from "@/lib/utils";

type Recipe = {
  id: string;
  name: string;
  meal_type: string;
  cook_time_minutes: number | null;
  prep_time_minutes: number | null;
  base_batch_servings: number;
  calories_per_serving: number | null;
  protein_per_serving_g: number | null;
  carbs_per_serving_g: number | null;
  fat_per_serving_g: number | null;
  has_thermomix_variant: boolean;
  source: string;
  household_id: string | null;
  tags: string[] | null;
};

type MealFilter = "all" | "breakfast" | "lunch" | "dinner" | "snack";
type CookTimeFilter = "any" | "u30" | "u60";
type SourceFilter = "all" | "mine" | "library";

export default function Recipes() {
  const navigate = useNavigate();
  const { me, ready } = useRequireOnboarded();
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [hasThermomix, setHasThermomix] = useState(false);
  const [q, setQ] = useState("");
  const [meal, setMeal] = useState<MealFilter>("all");
  const [cookTime, setCookTime] = useState<CookTimeFilter>("any");
  const [source, setSource] = useState<SourceFilter>("all");
  const [tags, setTags] = useState<string[]>([]);
  const [thermomixOnly, setThermomixOnly] = useState(false);

  useEffect(() => {
    if (!ready || !me) return;
    (async () => {
      const [{ data: rs }, { data: prefs }] = await Promise.all([
        supabase.from("recipes")
          .select("id, name, meal_type, cook_time_minutes, prep_time_minutes, base_batch_servings, calories_per_serving, protein_per_serving_g, carbs_per_serving_g, fat_per_serving_g, has_thermomix_variant, source, household_id, tags")
          .eq("is_published", true)
          .order("name"),
        supabase.from("user_preferences").select("has_thermomix").eq("user_id", me.id).maybeSingle(),
      ]);
      setRecipes((rs ?? []) as Recipe[]);
      setHasThermomix(!!prefs?.has_thermomix);
    })();
  }, [ready, me]);

  const filtered = useMemo(() => {
    if (!recipes) return [];
    const ql = q.trim().toLowerCase();
    return recipes.filter(r => {
      if (ql && !r.name.toLowerCase().includes(ql)) return false;
      if (meal !== "all") {
        if (meal === "snack") { if (r.meal_type !== "snack_am" && r.meal_type !== "snack_pm") return false; }
        else if (r.meal_type !== meal) return false;
      }
      if (cookTime !== "any") {
        const ct = (r.cook_time_minutes ?? 0) + (r.prep_time_minutes ?? 0);
        if (cookTime === "u30" && ct > 30) return false;
        if (cookTime === "u60" && ct > 60) return false;
      }
      if (source === "mine" && r.source !== "user_submitted") return false;
      if (source === "library" && r.source === "user_submitted") return false;
      if (thermomixOnly && !r.has_thermomix_variant) return false;
      if (tags.length) {
        const rt = (r.tags ?? []).map(t => t.toLowerCase());
        if (!tags.every(t => rt.includes(t.toLowerCase()))) return false;
      }
      return true;
    });
  }, [recipes, q, meal, cookTime, source, tags, thermomixOnly]);

  const anyFilter = meal !== "all" || cookTime !== "any" || source !== "all" || tags.length > 0 || thermomixOnly || q.length > 0;
  const clearAll = () => { setMeal("all"); setCookTime("any"); setSource("all"); setTags([]); setThermomixOnly(false); setQ(""); };

  if (!ready || recipes === null) return <div className="min-h-screen bg-background" />;

  return (
    <main className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ChevronLeft className="h-5 w-5" /></Button>
          <h1 className="font-display text-xl font-semibold flex-1">Recipes</h1>
          <Button size="sm" onClick={() => navigate("/recipes/new")}><Plus className="h-4 w-4" />Add recipe</Button>
        </div>
        <div className="max-w-3xl mx-auto px-4 pb-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recipes..." className="pl-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            <FilterGroup label="Meal" value={meal} onChange={(v) => setMeal(v as MealFilter)} options={[
              { v: "all", l: "All" }, { v: "breakfast", l: "Breakfast" }, { v: "lunch", l: "Lunch" },
              { v: "dinner", l: "Dinner" }, { v: "snack", l: "Snack" },
            ]} />
            <FilterGroup label="Time" value={cookTime} onChange={(v) => setCookTime(v as CookTimeFilter)} options={[
              { v: "any", l: "Any time" }, { v: "u30", l: "<30 min" }, { v: "u60", l: "<60 min" },
            ]} />
            <FilterGroup label="Source" value={source} onChange={(v) => setSource(v as SourceFilter)} options={[
              { v: "all", l: "All" }, { v: "mine", l: "My recipes" }, { v: "library", l: "Library" },
            ]} />
            {hasThermomix && (
              <Chip active={thermomixOnly} onClick={() => setThermomixOnly(v => !v)}>Thermomix only</Chip>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {TAG_OPTIONS.map(t => (
              <Chip key={t} active={tags.includes(t)} onClick={() => setTags(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t])}>{t}</Chip>
            ))}
          </div>
          {anyFilter && (
            <button onClick={clearAll} className="text-xs text-primary font-medium underline">Clear all</button>
          )}
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 pt-6">
        {filtered.length === 0 ? (
          <EmptyState anyFilter={anyFilter} onClear={clearAll} onAdd={() => navigate("/recipes/new")} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map(r => <RecipeCard key={r.id} r={r} onClick={() => navigate(`/recipes/${r.id}`)} />)}
          </div>
        )}
      </section>
    </main>
  );
}

function FilterGroup({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div className="flex gap-1 shrink-0">
      {options.map(o => (
        <Chip key={o.v} active={value === o.v} onClick={() => onChange(o.v)}>{o.l}</Chip>
      ))}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 inline-flex items-center px-3 h-8 rounded-full text-xs font-medium border transition-colors",
        active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function RecipeCard({ r, onClick }: { r: Recipe; onClick: () => void }) {
  const tt = (r.cook_time_minutes ?? 0) + (r.prep_time_minutes ?? 0);
  return (
    <button onClick={onClick} className="text-left rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-shadow flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <div className="font-display font-semibold text-sm leading-snug line-clamp-2 flex-1">{r.name}</div>
      </div>
      <div className="flex flex-wrap gap-1">
        <span className="inline-flex items-center px-2 h-5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
          {MEAL_TYPE_LABEL[r.meal_type] ?? r.meal_type}
        </span>
        {r.source === "user_submitted" && (
          <span className="inline-flex items-center px-2 h-5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground">My recipe</span>
        )}
        {r.has_thermomix_variant && (
          <span className="inline-flex items-center px-2 h-5 rounded-full text-[10px] font-medium bg-accent text-accent-foreground">TM</span>
        )}
      </div>
      {tt > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />{tt} min
        </div>
      )}
      <div className="text-[11px] text-muted-foreground tabular-nums">
        {Math.round(Number(r.calories_per_serving ?? 0))} kcal · P{Math.round(Number(r.protein_per_serving_g ?? 0))} · C{Math.round(Number(r.carbs_per_serving_g ?? 0))} · F{Math.round(Number(r.fat_per_serving_g ?? 0))}
      </div>
      <div className="text-[11px] text-muted-foreground">Makes {r.base_batch_servings}</div>
      {r.tags && r.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {r.tags.slice(0, 3).map(t => (
            <span key={t} className="inline-flex items-center px-1.5 h-4 rounded-full text-[9px] font-medium bg-muted text-muted-foreground">{t}</span>
          ))}
        </div>
      )}
    </button>
  );
}

function EmptyState({ anyFilter, onClear, onAdd }: { anyFilter: boolean; onClear: () => void; onAdd: () => void }) {
  if (anyFilter) {
    return (
      <div className="text-center py-16">
        <h2 className="font-display text-xl font-semibold">No recipes match these filters.</h2>
        <p className="text-muted-foreground mt-2 text-sm">Try removing a filter or adding a new recipe.</p>
        <Button onClick={onClear} variant="outline" className="mt-4">Clear filters</Button>
      </div>
    );
  }
  return (
    <div className="text-center py-16">
      <h2 className="font-display text-xl font-semibold">Your recipe library is empty.</h2>
      <p className="text-muted-foreground mt-2 text-sm">Add your first recipe to start planning meals, or we'll seed a starter library for you.</p>
      <Button onClick={onAdd} className="mt-4">Add a recipe</Button>
    </div>
  );
}
