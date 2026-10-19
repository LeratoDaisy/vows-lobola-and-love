import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";

export function SiteHeader() {
  const { user } = useSession();
  const navigate = useNavigate();
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-2xl text-foreground">Umshado</Link>
        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Button asChild variant="ghost"><Link to="/dashboard">My weddings</Link></Button>
              <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild><Link to="/auth">Create your wedding</Link></Button>
          )}
        </nav>
      </div>
    </header>
  );
}
