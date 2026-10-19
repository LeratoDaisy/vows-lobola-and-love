import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { formatDate, slugify } from "@/lib/use-session";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My weddings — Umshado" },
      { name: "description", content: "Manage your wedding pages." },
      { property: "og:title", content: "My weddings — Umshado" },
      { property: "og:description", content: "Manage your wedding pages." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { userId } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: weddings = [] } = useQuery({
    queryKey: ["my-weddings", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("weddings").select("*").eq("owner_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [one, setOne] = useState("");
  const [two, setTwo] = useState("");
  const [date, setDate] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const slug = `${slugify(one)}-and-${slugify(two)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("weddings").insert({ owner_id: userId, partner_one: one, partner_two: two, wedding_date: date || null, slug });
    if (error) { toast.error(error.message); return; }
    setOne(""); setTwo(""); setDate("");
    qc.invalidateQueries({ queryKey: ["my-weddings"] });
    toast.success("Wedding page created");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1fr_380px]">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-3 text-5xl">My weddings</h1>
          <div className="mt-8 space-y-4">
            {weddings.length === 0 && <p className="text-muted-foreground">No wedding pages yet. Create your first one.</p>}
            {weddings.map((w) => (
              <div key={w.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-6 shadow-soft">
                <div>
                  <h2 className="text-3xl">{w.partner_one} &amp; {w.partner_two}</h2>
                  <p className="text-sm text-muted-foreground">{formatDate(w.wedding_date)}</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline"><Link to="/w/$slug" params={{ slug: w.slug }}>View page</Link></Button>
                  <Button asChild><Link to="/manage/$id" params={{ id: w.id }}>Manage</Link></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <form onSubmit={create} className="h-fit space-y-4 rounded-2xl border bg-secondary/50 p-6">
          <h2 className="text-2xl">New wedding page</h2>
          <div><Label>Partner one</Label><Input required maxLength={60} value={one} onChange={(e) => setOne(e.target.value)} placeholder="Thandi" /></div>
          <div><Label>Partner two</Label><Input required maxLength={60} value={two} onChange={(e) => setTwo(e.target.value)} placeholder="Sipho" /></div>
          <div><Label>Wedding date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <Button type="submit" className="w-full">Create page</Button>
        </form>
      </div>
    </div>
  );
}
