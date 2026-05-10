import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Plus, Trash2, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRequireOnboarded } from "@/hooks/useRequireOnboarded";
import { TAG_OPTIONS, UNIT_OPTIONS, STORE_CATEGORIES, STORE_CATEGORY_LABEL } from "@/recipes/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type IngredientRow = {
  key: string;
  ingredient_id: string | null;
  name: string;
  quantity: string;
  unit: string;
  is_optional: boolean;
  note: string;
  // for new ingredient creation
  isNew: boolean;
  cal: string; protein: string; carbs: string; fat: string;
  store_category: string;
};
type StepRow = { key: string; instruction: string; thermomix: string };

const blankIng = (): IngredientRow => ({
  key: crypto.randomUUID(), ingredient_id: null, name: "", quantity: "", unit: "g",
  is_optional: false, note: "", isNew: false,
  cal: "", protein: "", carbs: "", fat: "", store_category: "other",
});
const blankStep = (): StepRow => ({ key: crypto.randomUUID(), instruction: "", thermomix: "" });

export default function RecipeForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { me, ready } = useRequireOnboarded();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mealType, setMealType] = useState<string>("lunch");
  const [tags, setTags] = useState<string[]>([]);
  const [servings, setServings] = useState(4);
  const [prep, setPrep] = useState<string>("");
  const [cook, setCook] = useState<string>("");
  const [lasts, setLasts] = useState(3);
  const [canFreeze, setCanFreeze] = useState(false);
  const [freezerLasts, setFreezerLasts] = useState(30);
  const [hasThermomix, setHasThermomix] = useState(false);
  const [ingredients, setIngredients] = useState<IngredientRow[]>([blankIng()]);
  const [steps, setSteps] = useState<StepRow[]>([blankStep()]);
  const [saving, setSaving] = useState(false);
  const [usedInPlan, setUsedInPlan] = useState(false);
  const [editLocked, setEditLocked] = useState(false);

  useEffect(() => {
    if (!ready || !me || !isEdit) return;
    (async () => {
      const { data: r } = await supabase.from("recipes").select("*").eq("id", id).maybeSingle();
      if (!r) { navigate("/recipes"); return; }
      if (r.source !== "user_submitted" || r.household_id !== me.household_id) {
        setEditLocked(true);
        return;
      }
      setName(r.name);
      setDescription(r.description ?? "");
      setMealType(r.meal_type);
      setTags(r.tags ?? []);
      setServings(r.base_batch_servings);
      setPrep(r.prep_time_minutes?.toString() ?? "");
      setCook(r.cook_time_minutes?.toString() ?? "");
      setLasts(r.default_lasts_days);
      setCanFreeze(!!r.freezer_lasts_days);
      if (r.freezer_lasts_days) setFreezerLasts(r.freezer_lasts_days);
      setHasThermomix(r.has_thermomix_variant);

      const [{ data: ri }, { data: rs }, { data: slots }] = await Promise.all([
        supabase.from("recipe_ingredients").select("*, ingredients(*)").eq("recipe_id", id),
        supabase.from("recipe_steps").select("*").eq("recipe_id", id).order("step_number"),
        supabase.from("weekly_plan_slots").select("id").eq("recipe_id", id).limit(1),
      ]);
      setIngredients((ri ?? []).map(i => ({
        key: i.id, ingredient_id: i.ingredient_id, name: i.ingredients?.name ?? "",
        quantity: String(i.quantity_per_batch), unit: i.unit, is_optional: i.is_optional,
        note: i.note ?? "", isNew: false,
        cal: "", protein: "", carbs: "", fat: "", store_category: i.ingredients?.store_category ?? "other",
      })));
      setSteps((rs ?? []).map(s => ({ key: s.id, instruction: s.instruction, thermomix: s.thermomix_instruction ?? "" })));
      setUsedInPlan((slots ?? []).length > 0);
    })();
  }, [ready, me, id, isEdit, navigate]);

  const valid = name.trim().length > 0 && servings > 0 && ingredients.some(i => i.name.trim() && Number(i.quantity) > 0) && steps.some(s => s.instruction.trim());

  const save = async () => {
    if (!me || !valid) return;
    setSaving(true);
    try {
      // Resolve ingredients: lookup or create
      const resolved = await Promise.all(ingredients.filter(i => i.name.trim() && Number(i.quantity) > 0).map(async (i) => {
        let ingredient_id = i.ingredient_id;
        if (!ingredient_id) {
          const { data: existing } = await supabase.from("ingredients").select("id").ilike("name", i.name.trim()).maybeSingle();
          if (existing) ingredient_id = existing.id;
          else {
            const { data: created, error } = await supabase.from("ingredients").insert({
              name: i.name.trim(),
              calories_per_100g: Number(i.cal) || 0,
              protein_per_100g: Number(i.protein) || 0,
              carbs_per_100g: Number(i.carbs) || 0,
              fat_per_100g: Number(i.fat) || 0,
              store_category: i.store_category as any,
            }).select("id").single();
            if (error) throw error;
            ingredient_id = created.id;
          }
        }
        return { ...i, ingredient_id, qty: Number(i.quantity) };
      }));

      // Compute per-serving macros — based on grams. Only weight-unit ingredients contribute precisely;
      // for non-gram units we use the entered quantity treated as grams as a best-effort fallback.
      const totals = { kcal: 0, p: 0, c: 0, f: 0 };
      for (const r of resolved) {
        const { data: ing } = await supabase.from("ingredients")
          .select("calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g")
          .eq("id", r.ingredient_id!).single();
        if (!ing) continue;
        const grams = r.qty;
        totals.kcal += (grams / 100) * Number(ing.calories_per_100g);
        totals.p += (grams / 100) * Number(ing.protein_per_100g);
        totals.c += (grams / 100) * Number(ing.carbs_per_100g);
        totals.f += (grams / 100) * Number(ing.fat_per_100g);
      }
      const perServing = {
        calories_per_serving: totals.kcal / servings,
        protein_per_serving_g: totals.p / servings,
        carbs_per_serving_g: totals.c / servings,
        fat_per_serving_g: totals.f / servings,
      };

      let recipeId = id;
      const recipePayload = {
        name: name.trim(),
        description: description.trim() || null,
        meal_type: mealType as any,
        tags: tags.length ? tags : null,
        base_batch_servings: servings,
        prep_time_minutes: prep ? Number(prep) : null,
        cook_time_minutes: cook ? Number(cook) : null,
        default_lasts_days: lasts,
        freezer_lasts_days: canFreeze ? freezerLasts : null,
        has_thermomix_variant: hasThermomix,
        ...perServing,
      };

      if (isEdit) {
        const { error } = await supabase.from("recipes").update(recipePayload).eq("id", id!);
        if (error) throw error;
        await supabase.from("recipe_ingredients").delete().eq("recipe_id", id!);
        await supabase.from("recipe_steps").delete().eq("recipe_id", id!);
      } else {
        const { data: created, error } = await supabase.from("recipes").insert({
          ...recipePayload,
          source: "user_submitted",
          household_id: me.household_id,
          created_by_user_id: me.id,
        }).select("id").single();
        if (error) throw error;
        recipeId = created.id;
      }

      // Insert ingredients
      const ingRows = resolved.map(r => ({
        recipe_id: recipeId!, ingredient_id: r.ingredient_id!,
        quantity_per_batch: r.qty, unit: r.unit, is_optional: r.is_optional, note: r.note || null,
      }));
      if (ingRows.length) {
        const { error } = await supabase.from("recipe_ingredients").insert(ingRows);
        if (error) throw error;
      }
      // Insert steps
      const stepRows = steps.filter(s => s.instruction.trim()).map((s, idx) => ({
        recipe_id: recipeId!, step_number: idx + 1, instruction: s.instruction.trim(),
        thermomix_instruction: hasThermomix && s.thermomix.trim() ? s.thermomix.trim() : null,
      }));
      if (stepRows.length) {
        const { error } = await supabase.from("recipe_steps").insert(stepRows);
        if (error) throw error;
      }
      toast.success("Recipe saved");
      navigate(`/recipes/${recipeId}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? "Could not save recipe");
    } finally {
      setSaving(false);
    }
  };

  if (!ready) return <div className="min-h-screen bg-background" />;

  if (editLocked) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 max-w-md mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" />Back</Button>
        <h1 className="text-2xl font-semibold mt-6">Can't edit this recipe</h1>
        <p className="text-muted-foreground mt-2">This is a shared recipe and can't be edited. Duplicate it to make your own version.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-5 w-5" /></Button>
          <h1 className="text-xl font-semibold flex-1">{isEdit ? "Edit recipe" : "New recipe"}</h1>
          <Button size="sm" disabled={!valid || saving} onClick={save}>{saving ? "..." : "Save"}</Button>
        </div>
      </header>

      <section className="max-w-2xl mx-auto px-4 pt-6 space-y-8">
        {isEdit && usedInPlan && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
            This recipe is used in your current week plan. Saving changes will recalculate all portions.
          </div>
        )}

        {/* Basic info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Basic info</h2>
          <div>
            <Label>Recipe name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. High-protein oats" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What makes this recipe worth making?" />
          </div>
          <div>
            <Label>Meal type *</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="snack_am">Snack (AM)</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="snack_pm">Snack (PM)</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {TAG_OPTIONS.map(t => (
                <button key={t} type="button"
                  onClick={() => setTags(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t])}
                  className={cn("px-3 h-8 rounded-full text-xs font-medium border",
                    tags.includes(t) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border")}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Batch */}
        <div className="space-y-4 border-t pt-6">
          <h2 className="text-lg font-semibold">Batch details</h2>
          <Stepper label="Servings per batch *" value={servings} onChange={setServings} min={1} max={50} />
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Prep (min)</Label><Input type="number" value={prep} onChange={(e) => setPrep(e.target.value)} /></div>
            <div><Label>Cook (min)</Label><Input type="number" value={cook} onChange={(e) => setCook(e.target.value)} /></div>
          </div>
          <Stepper label="Keeps in fridge (days)" value={lasts} onChange={setLasts} min={1} max={14} />
          <div className="flex items-center justify-between"><Label>Can be frozen</Label><Switch checked={canFreeze} onCheckedChange={setCanFreeze} /></div>
          {canFreeze && <Stepper label="Keeps in freezer (days)" value={freezerLasts} onChange={setFreezerLasts} min={1} max={365} />}
          <div className="flex items-center justify-between"><Label>Has Thermomix variant</Label><Switch checked={hasThermomix} onCheckedChange={setHasThermomix} /></div>
        </div>

        {/* Ingredients */}
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Ingredients</h2>
            <Button variant="outline" size="sm" onClick={() => setIngredients(s => [...s, blankIng()])}><Plus className="h-4 w-4" />Add</Button>
          </div>
          <div className="space-y-3">
            {ingredients.map((ing, idx) => (
              <IngredientRowEditor
                key={ing.key}
                row={ing}
                onChange={(r) => setIngredients(s => s.map((x, i) => i === idx ? r : x))}
                onRemove={() => setIngredients(s => s.filter((_, i) => i !== idx))}
              />
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Steps</h2>
            <Button variant="outline" size="sm" onClick={() => setSteps(s => [...s, blankStep()])}><Plus className="h-4 w-4" />Add step</Button>
          </div>
          <div className="space-y-3">
            {steps.map((st, idx) => (
              <div key={st.key} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">{idx + 1}</div>
                  <div className="flex-1 space-y-2">
                    <Textarea value={st.instruction} onChange={(e) => setSteps(s => s.map((x, i) => i === idx ? { ...x, instruction: e.target.value } : x))} placeholder="Describe this step…" />
                    {hasThermomix && (
                      <Textarea value={st.thermomix} onChange={(e) => setSteps(s => s.map((x, i) => i === idx ? { ...x, thermomix: e.target.value } : x))} placeholder="Thermomix instruction (optional)" className="text-sm" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" onClick={() => idx > 0 && setSteps(s => { const n = [...s]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; return n; })}><GripVertical className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setSteps(s => s.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Stepper({ label, value, onChange, min, max }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number }) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" type="button" onClick={() => onChange(Math.max(min, value - 1))}>−</Button>
        <span className="w-10 text-center tabular-nums font-semibold">{value}</span>
        <Button variant="outline" size="icon" type="button" onClick={() => onChange(Math.min(max, value + 1))}>+</Button>
      </div>
    </div>
  );
}

function IngredientRowEditor({ row, onChange, onRemove }: { row: IngredientRow; onChange: (r: IngredientRow) => void; onRemove: () => void }) {
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; store_category: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!row.name.trim() || row.ingredient_id) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from("ingredients").select("id, name, store_category").ilike("name", `%${row.name}%`).limit(5);
      setSuggestions(data ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [row.name, row.ingredient_id]);

  const exact = suggestions.find(s => s.name.toLowerCase() === row.name.trim().toLowerCase());

  return (
    <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={row.name}
            onChange={(e) => onChange({ ...row, name: e.target.value, ingredient_id: null, isNew: false })}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Ingredient name"
          />
          {showSuggestions && suggestions.length > 0 && !row.ingredient_id && (
            <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-md border border-border bg-popover shadow-md max-h-48 overflow-y-auto">
              {suggestions.map(s => (
                <button key={s.id} type="button" onClick={() => onChange({ ...row, ingredient_id: s.id, name: s.name, isNew: false, store_category: s.store_category })}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-muted">
                  {s.name}
                </button>
              ))}
              {!exact && row.name.trim() && (
                <button type="button" onClick={() => onChange({ ...row, ingredient_id: null, isNew: true })}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-muted text-primary font-medium">
                  + Create new ingredient: "{row.name.trim()}"
                </button>
              )}
            </div>
          )}
        </div>
        <Input className="w-20" type="number" value={row.quantity} onChange={(e) => onChange({ ...row, quantity: e.target.value })} placeholder="Qty" />
        <Select value={row.unit} onValueChange={(v) => onChange({ ...row, unit: v })}>
          <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
          <SelectContent>
            {UNIT_OPTIONS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={onRemove}><Trash2 className="h-4 w-4" /></Button>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <label className="flex items-center gap-1"><input type="checkbox" checked={row.is_optional} onChange={(e) => onChange({ ...row, is_optional: e.target.checked })} />Optional</label>
        <Input value={row.note} onChange={(e) => onChange({ ...row, note: e.target.value })} placeholder="Note (e.g. or maple syrup)" className="h-8 text-xs" />
      </div>
      {row.isNew && !row.ingredient_id && (
        <div className="rounded-md bg-muted p-3 space-y-2 text-xs">
          <div className="font-semibold">New ingredient · per 100g</div>
          <div className="grid grid-cols-4 gap-2">
            <Input placeholder="kcal" value={row.cal} onChange={(e) => onChange({ ...row, cal: e.target.value })} />
            <Input placeholder="P (g)" value={row.protein} onChange={(e) => onChange({ ...row, protein: e.target.value })} />
            <Input placeholder="C (g)" value={row.carbs} onChange={(e) => onChange({ ...row, carbs: e.target.value })} />
            <Input placeholder="F (g)" value={row.fat} onChange={(e) => onChange({ ...row, fat: e.target.value })} />
          </div>
          <Select value={row.store_category} onValueChange={(v) => onChange({ ...row, store_category: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STORE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{STORE_CATEGORY_LABEL[c]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
