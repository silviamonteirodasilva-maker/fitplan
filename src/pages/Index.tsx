import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { LeafIcon } from "@/onboarding/components/LeafIcon";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<{ name: string; is_onboarded: boolean } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }
    supabase
      .from("users")
      .select("name, is_onboarded")
      .eq("auth_user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data || !data.is_onboarded) {
          navigate("/onboarding");
        } else {
          setProfile(data);
        }
        setChecking(false);
      });
  }, [user, loading, navigate]);

  if (loading || checking) return <div className="min-h-screen bg-background" />;

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-2 font-display font-semibold text-lg">
          <LeafIcon className="h-5 w-5 text-primary" /> Kitchen
        </div>
        <Button variant="ghost" size="sm" onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}>
          <LogOut className="h-4 w-4 mr-1.5" /> Sign out
        </Button>
      </header>
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto">
        <h1 className="text-4xl font-display font-semibold leading-tight">
          Welcome back{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Your weekly plan is being prepared. The full meal planner view is coming next.
        </p>
      </section>
    </main>
  );
};

export default Index;
