export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      batch_cooks: {
        Row: {
          cooked_on: string
          id: string
          is_frozen: boolean
          lasts_until: string
          notes: string | null
          recipe_id: string
          total_servings: number
          weekly_plan_id: string
        }
        Insert: {
          cooked_on: string
          id?: string
          is_frozen?: boolean
          lasts_until: string
          notes?: string | null
          recipe_id: string
          total_servings: number
          weekly_plan_id: string
        }
        Update: {
          cooked_on?: string
          id?: string
          is_frozen?: boolean
          lasts_until?: string
          notes?: string | null
          recipe_id?: string
          total_servings?: number
          weekly_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_cooks_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_cooks_weekly_plan_id_fkey"
            columns: ["weekly_plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          id: string
          name: string
          plan_duration_weeks: number
          plan_start_date: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan_duration_weeks?: number
          plan_start_date?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan_duration_weeks?: number
          plan_start_date?: string | null
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          calories_per_100g: number
          carbs_per_100g: number
          created_at: string
          fat_per_100g: number
          grams_per_unit: number | null
          id: string
          name: string
          protein_per_100g: number
          store_category: Database["public"]["Enums"]["store_category"]
          unit_type: Database["public"]["Enums"]["unit_type"]
        }
        Insert: {
          calories_per_100g: number
          carbs_per_100g: number
          created_at?: string
          fat_per_100g: number
          grams_per_unit?: number | null
          id?: string
          name: string
          protein_per_100g: number
          store_category?: Database["public"]["Enums"]["store_category"]
          unit_type?: Database["public"]["Enums"]["unit_type"]
        }
        Update: {
          calories_per_100g?: number
          carbs_per_100g?: number
          created_at?: string
          fat_per_100g?: number
          grams_per_unit?: number | null
          id?: string
          name?: string
          protein_per_100g?: number
          store_category?: Database["public"]["Enums"]["store_category"]
          unit_type?: Database["public"]["Enums"]["unit_type"]
        }
        Relationships: []
      }
      meal_macro_distribution: {
        Row: {
          breakfast_pct: number
          dinner_pct: number
          id: string
          lunch_pct: number
          metabolic_profile_id: string
          snack_am_pct: number
          snack_pm_pct: number
        }
        Insert: {
          breakfast_pct?: number
          dinner_pct?: number
          id?: string
          lunch_pct?: number
          metabolic_profile_id: string
          snack_am_pct?: number
          snack_pm_pct?: number
        }
        Update: {
          breakfast_pct?: number
          dinner_pct?: number
          id?: string
          lunch_pct?: number
          metabolic_profile_id?: string
          snack_am_pct?: number
          snack_pm_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_macro_distribution_metabolic_profile_id_fkey"
            columns: ["metabolic_profile_id"]
            isOneToOne: false
            referencedRelation: "user_metabolic_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          id: string
          ingredient_id: string
          is_optional: boolean
          note: string | null
          quantity_per_batch: number
          recipe_id: string
          unit: string
        }
        Insert: {
          id?: string
          ingredient_id: string
          is_optional?: boolean
          note?: string | null
          quantity_per_batch: number
          recipe_id: string
          unit: string
        }
        Update: {
          id?: string
          ingredient_id?: string
          is_optional?: boolean
          note?: string | null
          quantity_per_batch?: number
          recipe_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_steps: {
        Row: {
          id: string
          instruction: string
          recipe_id: string
          step_number: number
          thermomix_instruction: string | null
        }
        Insert: {
          id?: string
          instruction: string
          recipe_id: string
          step_number: number
          thermomix_instruction?: string | null
        }
        Update: {
          id?: string
          instruction?: string
          recipe_id?: string
          step_number?: number
          thermomix_instruction?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          base_batch_servings: number
          calories_per_serving: number | null
          carbs_per_serving_g: number | null
          cook_time_minutes: number | null
          created_at: string
          default_lasts_days: number
          description: string | null
          external_id: string | null
          fat_per_serving_g: number | null
          freezer_lasts_days: number | null
          has_thermomix_variant: boolean
          id: string
          is_published: boolean
          meal_type: Database["public"]["Enums"]["meal_type"]
          name: string
          prep_time_minutes: number | null
          protein_per_serving_g: number | null
          source: Database["public"]["Enums"]["recipe_source"]
          tags: string[] | null
        }
        Insert: {
          base_batch_servings?: number
          calories_per_serving?: number | null
          carbs_per_serving_g?: number | null
          cook_time_minutes?: number | null
          created_at?: string
          default_lasts_days?: number
          description?: string | null
          external_id?: string | null
          fat_per_serving_g?: number | null
          freezer_lasts_days?: number | null
          has_thermomix_variant?: boolean
          id?: string
          is_published?: boolean
          meal_type: Database["public"]["Enums"]["meal_type"]
          name: string
          prep_time_minutes?: number | null
          protein_per_serving_g?: number | null
          source?: Database["public"]["Enums"]["recipe_source"]
          tags?: string[] | null
        }
        Update: {
          base_batch_servings?: number
          calories_per_serving?: number | null
          carbs_per_serving_g?: number | null
          cook_time_minutes?: number | null
          created_at?: string
          default_lasts_days?: number
          description?: string | null
          external_id?: string | null
          fat_per_serving_g?: number | null
          freezer_lasts_days?: number | null
          has_thermomix_variant?: boolean
          id?: string
          is_published?: boolean
          meal_type?: Database["public"]["Enums"]["meal_type"]
          name?: string
          prep_time_minutes?: number | null
          protein_per_serving_g?: number | null
          source?: Database["public"]["Enums"]["recipe_source"]
          tags?: string[] | null
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          batch_cook_id: string | null
          id: string
          ingredient_id: string
          is_checked: boolean
          shopping_list_id: string
          store_category: Database["public"]["Enums"]["store_category"]
          total_quantity: number
          unit: string
        }
        Insert: {
          batch_cook_id?: string | null
          id?: string
          ingredient_id: string
          is_checked?: boolean
          shopping_list_id: string
          store_category: Database["public"]["Enums"]["store_category"]
          total_quantity: number
          unit: string
        }
        Update: {
          batch_cook_id?: string | null
          id?: string
          ingredient_id?: string
          is_checked?: boolean
          shopping_list_id?: string
          store_category?: Database["public"]["Enums"]["store_category"]
          total_quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_batch_cook_id_fkey"
            columns: ["batch_cook_id"]
            isOneToOne: false
            referencedRelation: "batch_cooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          generated_at: string
          id: string
          weekly_plan_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          weekly_plan_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          weekly_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_weekly_plan_id_fkey"
            columns: ["weekly_plan_id"]
            isOneToOne: true
            referencedRelation: "weekly_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_profile: {
        Row: {
          avg_cardio_minutes: number
          avg_lifting_minutes: number
          cardio_intensity: Database["public"]["Enums"]["cardio_intensity"]
          id: string
          job_type: Database["public"]["Enums"]["job_type"]
          neat_level: Database["public"]["Enums"]["neat_level"]
          updated_at: string
          user_id: string
          weekly_cardio_sessions: number
          weekly_lifting_sessions: number
          weekly_yoga_sessions: number
        }
        Insert: {
          avg_cardio_minutes?: number
          avg_lifting_minutes?: number
          cardio_intensity?: Database["public"]["Enums"]["cardio_intensity"]
          id?: string
          job_type?: Database["public"]["Enums"]["job_type"]
          neat_level?: Database["public"]["Enums"]["neat_level"]
          updated_at?: string
          user_id: string
          weekly_cardio_sessions?: number
          weekly_lifting_sessions?: number
          weekly_yoga_sessions?: number
        }
        Update: {
          avg_cardio_minutes?: number
          avg_lifting_minutes?: number
          cardio_intensity?: Database["public"]["Enums"]["cardio_intensity"]
          id?: string
          job_type?: Database["public"]["Enums"]["job_type"]
          neat_level?: Database["public"]["Enums"]["neat_level"]
          updated_at?: string
          user_id?: string
          weekly_cardio_sessions?: number
          weekly_lifting_sessions?: number
          weekly_yoga_sessions?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_biometrics: {
        Row: {
          body_fat_pct: number | null
          height_cm: number
          id: string
          is_estimated: boolean
          recorded_at: string
          sex: Database["public"]["Enums"]["sex_type"]
          user_id: string
          weight_kg: number
        }
        Insert: {
          body_fat_pct?: number | null
          height_cm: number
          id?: string
          is_estimated?: boolean
          recorded_at?: string
          sex: Database["public"]["Enums"]["sex_type"]
          user_id: string
          weight_kg: number
        }
        Update: {
          body_fat_pct?: number | null
          height_cm?: number
          id?: string
          is_estimated?: boolean
          recorded_at?: string
          sex?: Database["public"]["Enums"]["sex_type"]
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_biometrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_metabolic_profile: {
        Row: {
          activity_profile_id: string
          biometrics_id: string
          bmr: number
          bmr_formula: string
          calculated_at: string
          calories_floored: boolean
          deficit_capped: boolean
          goal: Database["public"]["Enums"]["fitness_goal"]
          goal_calories: number
          goal_carbs_g: number
          goal_fat_g: number
          goal_protein_g: number
          id: string
          is_active: boolean
          plan_end_date: string | null
          plan_start_date: string | null
          review_date: string
          tdee: number
          user_id: string
          weekly_change_target_kg: number | null
        }
        Insert: {
          activity_profile_id: string
          biometrics_id: string
          bmr: number
          bmr_formula: string
          calculated_at?: string
          calories_floored?: boolean
          deficit_capped?: boolean
          goal: Database["public"]["Enums"]["fitness_goal"]
          goal_calories: number
          goal_carbs_g: number
          goal_fat_g: number
          goal_protein_g: number
          id?: string
          is_active?: boolean
          plan_end_date?: string | null
          plan_start_date?: string | null
          review_date: string
          tdee: number
          user_id: string
          weekly_change_target_kg?: number | null
        }
        Update: {
          activity_profile_id?: string
          biometrics_id?: string
          bmr?: number
          bmr_formula?: string
          calculated_at?: string
          calories_floored?: boolean
          deficit_capped?: boolean
          goal?: Database["public"]["Enums"]["fitness_goal"]
          goal_calories?: number
          goal_carbs_g?: number
          goal_fat_g?: number
          goal_protein_g?: number
          id?: string
          is_active?: boolean
          plan_end_date?: string | null
          plan_start_date?: string | null
          review_date?: string
          tdee?: number
          user_id?: string
          weekly_change_target_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_metabolic_profile_activity_profile_id_fkey"
            columns: ["activity_profile_id"]
            isOneToOne: false
            referencedRelation: "user_activity_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_metabolic_profile_biometrics_id_fkey"
            columns: ["biometrics_id"]
            isOneToOne: false
            referencedRelation: "user_biometrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_metabolic_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plan_portions: {
        Row: {
          calculated_at: string
          id: string
          scaled_calories: number | null
          scaled_carbs_g: number | null
          scaled_fat_g: number | null
          scaled_protein_g: number | null
          scaled_servings: number
          slot_id: string
          user_id: string
        }
        Insert: {
          calculated_at?: string
          id?: string
          scaled_calories?: number | null
          scaled_carbs_g?: number | null
          scaled_fat_g?: number | null
          scaled_protein_g?: number | null
          scaled_servings?: number
          slot_id: string
          user_id: string
        }
        Update: {
          calculated_at?: string
          id?: string
          scaled_calories?: number | null
          scaled_carbs_g?: number | null
          scaled_fat_g?: number | null
          scaled_protein_g?: number | null
          scaled_servings?: number
          slot_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plan_portions_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "weekly_plan_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_plan_portions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          cooking_skill: string | null
          dietary_restrictions: string[] | null
          disliked_ingredients: string[] | null
          has_thermomix: boolean
          id: string
          max_cook_time_minutes: number | null
          preferred_meal_types:
            | Database["public"]["Enums"]["meal_type"][]
            | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cooking_skill?: string | null
          dietary_restrictions?: string[] | null
          disliked_ingredients?: string[] | null
          has_thermomix?: boolean
          id?: string
          max_cook_time_minutes?: number | null
          preferred_meal_types?:
            | Database["public"]["Enums"]["meal_type"][]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cooking_skill?: string | null
          dietary_restrictions?: string[] | null
          disliked_ingredients?: string[] | null
          has_thermomix?: boolean
          id?: string
          max_cook_time_minutes?: number | null
          preferred_meal_types?:
            | Database["public"]["Enums"]["meal_type"][]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          created_by_user_id: string | null
          date_of_birth: string | null
          email: string | null
          household_id: string
          id: string
          is_onboarded: boolean
          member_type: Database["public"]["Enums"]["member_type"]
          name: string
          role: Database["public"]["Enums"]["household_role"]
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          household_id: string
          id?: string
          is_onboarded?: boolean
          member_type?: Database["public"]["Enums"]["member_type"]
          name: string
          role?: Database["public"]["Enums"]["household_role"]
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          household_id?: string
          id?: string
          is_onboarded?: boolean
          member_type?: Database["public"]["Enums"]["member_type"]
          name?: string
          role?: Database["public"]["Enums"]["household_role"]
        }
        Relationships: [
          {
            foreignKeyName: "users_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_check_ins: {
        Row: {
          body_fat_pct: number | null
          checked_in_at: string
          energy_level: number | null
          general_feeling: number | null
          id: string
          meals_on_plan_pct: number | null
          muscle_kg: number | null
          notes: string | null
          sleep_quality: number | null
          training_goal_met: boolean | null
          user_id: string
          week_number: number
          weight_kg: number
        }
        Insert: {
          body_fat_pct?: number | null
          checked_in_at?: string
          energy_level?: number | null
          general_feeling?: number | null
          id?: string
          meals_on_plan_pct?: number | null
          muscle_kg?: number | null
          notes?: string | null
          sleep_quality?: number | null
          training_goal_met?: boolean | null
          user_id: string
          week_number: number
          weight_kg: number
        }
        Update: {
          body_fat_pct?: number | null
          checked_in_at?: string
          energy_level?: number | null
          general_feeling?: number | null
          id?: string
          meals_on_plan_pct?: number | null
          muscle_kg?: number | null
          notes?: string | null
          sleep_quality?: number | null
          training_goal_met?: boolean | null
          user_id?: string
          week_number?: number
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_plan_slots: {
        Row: {
          batch_cook_id: string | null
          day_of_week: number
          id: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          recipe_id: string | null
          weekly_plan_id: string
        }
        Insert: {
          batch_cook_id?: string | null
          day_of_week: number
          id?: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          recipe_id?: string | null
          weekly_plan_id: string
        }
        Update: {
          batch_cook_id?: string | null
          day_of_week?: number
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          recipe_id?: string | null
          weekly_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_plan_slots_batch_cook_id_fkey"
            columns: ["batch_cook_id"]
            isOneToOne: false
            referencedRelation: "batch_cooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_plan_slots_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_plan_slots_weekly_plan_id_fkey"
            columns: ["weekly_plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_plans: {
        Row: {
          created_at: string
          household_id: string
          id: string
          status: Database["public"]["Enums"]["plan_status"]
          week_start_date: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          status?: Database["public"]["Enums"]["plan_status"]
          week_start_date: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          status?: Database["public"]["Enums"]["plan_status"]
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_plans_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_household_id: { Args: never; Returns: string }
    }
    Enums: {
      cardio_intensity: "low" | "moderate" | "high"
      fitness_goal: "fat_loss" | "muscle_gain" | "recomp" | "maintain"
      household_role: "primary" | "partner" | "member"
      job_type: "sedentary" | "light" | "moderate" | "physical"
      meal_type:
        | "breakfast"
        | "snack_am"
        | "lunch"
        | "snack_pm"
        | "dinner"
        | "coffee"
        | "addon"
      member_type: "active" | "passive_adult" | "child"
      neat_level: "low" | "medium" | "high"
      plan_status: "draft" | "confirmed" | "shopping_done" | "completed"
      recipe_source:
        | "anytime_fitness_pdf"
        | "spoonacular"
        | "manual"
        | "user_submitted"
      sex_type: "male" | "female"
      store_category:
        | "produce"
        | "dairy"
        | "meat"
        | "fish"
        | "grains"
        | "legumes"
        | "frozen"
        | "condiments"
        | "oils"
        | "nuts_seeds"
        | "supplements"
        | "other"
      unit_type: "weight" | "volume" | "count"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cardio_intensity: ["low", "moderate", "high"],
      fitness_goal: ["fat_loss", "muscle_gain", "recomp", "maintain"],
      household_role: ["primary", "partner", "member"],
      job_type: ["sedentary", "light", "moderate", "physical"],
      meal_type: [
        "breakfast",
        "snack_am",
        "lunch",
        "snack_pm",
        "dinner",
        "coffee",
        "addon",
      ],
      member_type: ["active", "passive_adult", "child"],
      neat_level: ["low", "medium", "high"],
      plan_status: ["draft", "confirmed", "shopping_done", "completed"],
      recipe_source: [
        "anytime_fitness_pdf",
        "spoonacular",
        "manual",
        "user_submitted",
      ],
      sex_type: ["male", "female"],
      store_category: [
        "produce",
        "dairy",
        "meat",
        "fish",
        "grains",
        "legumes",
        "frozen",
        "condiments",
        "oils",
        "nuts_seeds",
        "supplements",
        "other",
      ],
      unit_type: ["weight", "volume", "count"],
    },
  },
} as const
