import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Clock, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useRequireOnboarded } from "@/hooks/useRequireOnboarded";
import { MEAL_TYPE_LABEL, STORE_CATEGORY_LABEL } from "@/recipes/constants";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type Recipe = any;

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { me, ready } = useRequireOnboarded();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [hasThermomix, setHasThermomix] = useState(false);
  const [showThermomix, setShowThermomix] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!ready || !me || !id) return;
    (async () => {
      const [{ data: r }, { data: ri }, { data: rs }, { data: prefs }, { data: mp }] = await Promise.all([
        supabase.from("recipes").select("*").eq("id", id).maybeSingle(),
        supabase.from("recipe_ingredients").select("*, ingredients(*)").eq("recipe_id", id),
        supabase.from("recipe_steps").select("*").eq("recipe_id", id).order("step_number"),
        supabase.from("user_preferences").select("has_thermomix").eq("user_id", me.id).maybeSingle(),
        supabase.from("user_metabolic_profile").select("goal_calories, goal_protein_g, goal_carbs_g, goal_fat_g").eq("user_id", me.id).eq("is_active", true).maybeSingle(),
      ]);
      setRecipe(r);
      setIngredients(ri ?? []);
      setSteps(rs ?? []);
      const hasTm = !!prefs?.has_thermomix;
      setHasThermomix(hasTm);
      setShowThermomix(hasTm && !!r?.has_thermomix_variant);
      setProfile(mp);
    })();
  }, [ready, me, id]);

  if (!ready || !recipe) return <div className="min-h-screen bg-background" />;

  const isOwn = recipe.source === "user_submitted" && recipe.household_id === me?.household_id;
  const tt = (recipe.cook_time_minutes ?? 0) + (recipe.prep_time_minutes ?? 0);

  const grouped = ingredients.reduce<Record<string, any[]>>((acc, i) => {
    const cat = i.ingredients?.store_category ?? "other";
    (acc[cat] ??= []).push(i);
    return acc;
  }, {});

  // preview portion using lunch share (0.30) of profile calories
  const preview = profile && recipe.calories_per_serving
    ? (() => {
        const targetKcal = Number(profile.goal_calories) * 0.30;
        const servings = targetKcal / Number(recipe.calories_per_serving);
        return {
          servings,
          kcal: servings * Number(recipe.calories_per_serving),
          protein: servings * Number(recipe.protein_per_serving_g ?? 0),
          carbs: servings * Number(recipe.carbs_per_serving_g ?? 0),
          fat: servings * Number(recipe.fat_per_serving_g ?? 0),
        };
      })()
    : null;

  const onDelete = async () => {
    if (!confirm("Delete this recipe?")) return;
    const { error } = await supabase.from("recipes").delete().eq("id", recipe.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Recipe deleted");
    navigate("/recipes");
  };

  return (
    <main className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/recipes")}><ChevronLeft className="h-5 w-5" /></Button>
          <h1 className="font-display text-base font-semibold flex-1 truncate">{recipe.name}</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwn && <DropdownMenuItem onClick={() => navigate(`/recipes/${recipe.id}/edit`)}><Pencil className="h-4 w-4" />Edit recipe</DropdownMenuItem>}
              {isOwn && <DropdownMenuItem onClick={onDelete}><Trash2 className="h-4 w-4" />Delete</DropdownMenuItem>}
              <DropdownMenuItem disabled>Use in plan (coming soon)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <section className="max-w-2xl mx-auto px-4 pt-6">
        <h2 className="font-display text-3xl font-semibold leading-tight">{recipe.name}</h2>
        {recipe.description && <p className="text-muted-foreground mt-2">{recipe.description}</p>}

        <div className="flex flex-wrap gap-2 mt-4">
          <Badge>{MEAL_TYPE_LABEL[recipe.meal_type] ?? recipe.meal_type}</Badge>
          {isOwn && <Badge variant="secondary">My recipe</Badge>}
          {recipe.has_thermomix_variant && <Badge variant="accent">Thermomix</Badge>}
          {(recipe.tags ?? []).map((t: string) => (
            <Badge key={t} variant="muted">{t}</Badge>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
          {recipe.prep_time_minutes && <Stat label="Prep" value={`${recipe.prep_time_minutes} min`} />}
          {recipe.cook_time_minutes && <Stat label="Cook" value={`${recipe.cook_time_minutes} min`} />}
          {tt > 0 && <Stat label="Total" value={`${tt} min`} />}
        </div>

        <div className="mt-3 text-sm text-muted-foreground">
          Makes {recipe.base_batch_servings} servings · Keeps {recipe.default_lasts_days} days
          {recipe.freezer_lasts_days ? ` · Freezer ${recipe.freezer_lasts_days} days` : ""}
        </div>

        {/* Macros */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="grid grid-cols-4 gap-2 text-center">
            <Macro label="Calories" value={`${Math.round(Number(recipe.calories_per_serving ?? 0))}`} unit="kcal" />
            <Macro label="Protein" value={`${Math.round(Number(recipe.protein_per_serving_g ?? 0))}`} unit="g" />
            <Macro label="Carbs" value={`${Math.round(Number(recipe.carbs_per_serving_g ?? 0))}`} unit="g" />
            <Macro label="Fat" value={`${Math.round(Number(recipe.fat_per_serving_g ?? 0))}`} unit="g" />
          </div>
          <div className="text-xs text-muted-foreground text-center mt-3">
            Per serving (based on {recipe.base_batch_servings} servings per batch)
          </div>
        </div>

        {preview && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <div className="font-display font-semibold mb-1">Your portion</div>
            <div className="text-xs text-muted-foreground mb-3">Preview (lunch target)</div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <Macro label="Servings" value={preview.servings.toFixed(1)} unit="" />
              <Macro label="kcal" value={`${Math.round(preview.kcal)}`} unit="" />
              <Macro label="Protein" value={`${Math.round(preview.protein)}`} unit="g" />
              <Macro label="Fat" value={`${Math.round(preview.fat)}`} unit="g" />
            </div>
          </div>
        )}

        {/* Ingredients */}
        <div className="mt-8">
          <h3 className="font-display text-xl font-semibold">Ingredients</h3>
          <p className="text-xs text-muted-foreground mb-4">For {recipe.base_batch_servings} servings</p>
          <div className="space-y-4">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{STORE_CATEGORY_LABEL[cat] ?? cat}</div>
                <ul className="space-y-1.5">
                  {items.map(i => (
                    <li key={i.id} className="flex items-start gap-2 text-sm">
                      <span className="tabular-nums text-foreground/80 min-w-[80px]">
                        {Number(i.quantity_per_batch)} {i.unit}
                      </span>
                      <span className="flex-1">
                        {i.ingredients?.name ?? "—"}
                        {i.is_optional && <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">Optional</span>}
                        {i.note && <span className="text-muted-foreground"> — {i.note}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-semibold">How to make it</h3>
            {hasThermomix && recipe.has_thermomix_variant && (
              <div className="inline-flex rounded-full border border-border p-0.5 text-xs">
                <button onClick={() => setShowThermomix(false)} className={`px-3 h-7 rounded-full ${!showThermomix ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Standard</button>
                <button onClick={() => setShowThermomix(true)} className={`px-3 h-7 rounded-full ${showThermomix ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Thermomix</button>
              </div>
            )}
          </div>
          <ol className="space-y-3">
            {steps.map(s => (
              <li key={s.id} className="rounded-2xl border border-border bg-card p-4 flex gap-3">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">{s.step_number}</div>
                <div className="text-sm leading-relaxed">{showThermomix && s.thermomix_instruction ? s.thermomix_instruction : s.instruction}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="fixed bottom-0 inset-x-0 border-t bg-background/95 backdrop-blur p-4">
        <div className="max-w-2xl mx-auto">
          <Button className="w-full h-12" onClick={() => toast.info("Plan assignment coming soon.")}>Use in plan</Button>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-semibold mt-1 flex items-center justify-center gap-1"><Clock className="h-3 w-3" />{value}</div>
    </div>
  );
}
function Macro({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-xl font-semibold tabular-nums">{value}<span className="text-xs text-muted-foreground ml-0.5">{unit}</span></div>
    </div>
  );
}
function Badge({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "secondary" | "accent" | "muted" }) {
  const cls = {
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border-transparent",
    accent: "bg-accent text-accent-foreground border-transparent",
    muted: "bg-muted text-muted-foreground border-transparent",
  }[variant];
  return <span className={`inline-flex items-center px-2.5 h-6 rounded-full text-xs font-medium border ${cls}`}>{children}</span>;
}
