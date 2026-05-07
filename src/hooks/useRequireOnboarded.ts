import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Me = { id: string; household_id: string; name: string; is_household_admin: boolean };

let cached: Me | null = null;

/**
 * Auth guard for protected routes.
 * - Not logged in -> /auth?mode=signin
 * - Logged in, no users row OR is_onboarded=false -> /onboarding
 * - Logged in & onboarded -> returns the cached `me` row
 */
export function useRequireOnboarded() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(cached);
  const [ready, setReady] = useState(!!cached);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      cached = null;
      navigate("/auth?mode=signin", { replace: true });
      return;
    }
    if (cached) {
      setMe(cached);
      setReady(true);
      return;
    }
    (async () => {
      const { data: u, error } = await supabase
        .from("users")
        .select("id, household_id, name, is_household_admin, is_onboarded")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (error) { console.error("[useRequireOnboarded]", error); return; }
      if (!u || !u.is_onboarded) {
        navigate("/onboarding", { replace: true });
        return;
      }
      cached = { id: u.id, household_id: u.household_id, name: u.name, is_household_admin: u.is_household_admin };
      setMe(cached);
      setReady(true);
    })();
  }, [user, loading, navigate]);

  return { me, ready, authUser: user };
}

export function clearOnboardedCache() { cached = null; }
