import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/_authenticated/manage/$id")({
  head: () => ({
    meta: [
      { title: "Manage wedding — Umshado" },
      { name: "description", content: "Manage RSVPs, lobola and gift stores." },
      { property: "og:title", content: "Manage wedding — Umshado" },
      { property: "og:description", content: "Manage RSVPs, lobola and gift stores." },
    ],
  }),
  component: Manage,
});

const str = (f: FormData, k: string) => String(f.get(k) || "").trim() || null;

function Manage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["manage", id] });
  const { data } = useQuery({
    queryKey: ["manage", id],
    queryFn: async () => {
      const [w, r, l, s] = await Promise.all([
        supabase.from("weddings").select("*").eq("id", id).single(),
        supabase.from("rsvps").select("*").eq("wedding_id", id).order("created_at", { ascending: false }),
        supabase.from("lobola_items").select("*").eq("wedding_id", id).order("created_at"),
        supabase.from("registry_stores").select("*").eq("wedding_id", id).order("created_at"),
      ]);
      if (w.error) throw w.error;
      return { w: w.data, rsvps: r.data ?? [], items: l.data ?? [], stores: s.data ?? [] };
    },
  });
  if (!data) return <div><SiteHeader /><p className="p-20 text-center text-muted-foreground">Loading…</p></div>;
  const { w, rsvps, items, stores } = data;
  const attending = rsvps.filter((r) => r.attending);
  const headcount = attending.reduce((n, r) => n + r.guest_count, 0);

  async function saveDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const { error } = await supabase.from("weddings").update({
      partner_one: str(f, "partner_one") ?? w.partner_one,
      partner_two: str(f, "partner_two") ?? w.partner_two,
      wedding_date: str(f, "wedding_date"), venue: str(f, "venue"), story: str(f, "story"),
      lobola_date: str(f, "lobola_date"), lobola_venue: str(f, "lobola_venue"), lobola_details: str(f, "lobola_details"),
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved"); refresh();
  }

  async function addItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; const f = new FormData(form);
    const { error } = await supabase.from("lobola_items").insert({ wedding_id: id, title: str(f, "title")!, notes: str(f, "notes") });
    if (error) { toast.error(error.message); return; }
    form.reset(); refresh();
  }

  async function addStore(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; const f = new FormData(form);
    let url = str(f, "url")!;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    const { error } = await supabase.from("registry_stores").insert({ wedding_id: id, name: str(f, "name")!, url, description: str(f, "description") });
    if (error) { toast.error(error.message); return; }
    form.reset(); refresh();
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/w/${w.slug}` : "";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link to="/dashboard" className="text-sm text-muted-foreground">← My weddings</Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-5xl">{w.partner_one} &amp; {w.partner_two}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Link copied — share it with guests"); }}>Copy guest link</Button>
            <Button asChild><Link to="/w/$slug" params={{ slug: w.slug }}>View page</Link></Button>
          </div>
        </div>

        <Tabs defaultValue="rsvps" className="mt-10">
          <TabsList>
            <TabsTrigger value="rsvps">RSVPs</TabsTrigger>
            <TabsTrigger value="lobola">Lobola tracker</TabsTrigger>
            <TabsTrigger value="stores">Gift stores</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="rsvps" className="mt-6">
            <div className="grid grid-cols-3 gap-4">
              <Stat label="Replies" value={rsvps.length} />
              <Stat label="Attending" value={attending.length} />
              <Stat label="Total guests" value={headcount} />
            </div>
            <div className="mt-6 divide-y rounded-2xl border bg-card">
              {rsvps.length === 0 && <p className="p-6 text-muted-foreground">No RSVPs yet. Share your guest link!</p>}
              {rsvps.map((r) => (
                <div key={r.id} className="flex flex-wrap items-start justify-between gap-2 p-5">
                  <div>
                    <p className="font-semibold">{r.name} {r.email && <span className="font-normal text-muted-foreground">· {r.email}</span>}</p>
                    {r.dietary && <p className="text-sm text-muted-foreground">Dietary: {r.dietary}</p>}
                    {r.message && <p className="mt-1 text-sm italic">"{r.message}"</p>}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={r.attending ? "default" : "outline"}>{r.attending ? `Yes · ${r.guest_count}` : "No"}</Badge>
                    {r.attending && <Badge variant="secondary" className="capitalize">{r.events}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="lobola" className="mt-6">
            <p className="text-sm text-muted-foreground">Private to you — guests never see this list.</p>
            <form onSubmit={addItem} className="mt-4 grid gap-3 rounded-2xl border bg-secondary/50 p-5 md:grid-cols-[1fr_1fr_auto]">
              <Input name="title" required placeholder="e.g. 10 cows / cash equivalent" />
              <Input name="notes" placeholder="Notes" />
              <Button type="submit">Add item</Button>
            </form>
            <div className="mt-4 space-y-3">
              {items.map((it) => (
                <div key={it.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5">
                  <div>
                    <p className="font-semibold">{it.title}</p>
                    {it.notes && <p className="text-sm text-muted-foreground">{it.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {(["discussing", "agreed", "delivered"] as const).map((s) => (
                      <Button key={s} size="sm" variant={it.status === s ? "default" : "outline"} className="capitalize"
                        onClick={async () => { await supabase.from("lobola_items").update({ status: s }).eq("id", it.id); refresh(); }}>{s}</Button>
                    ))}
                    <Button size="sm" variant="ghost" onClick={async () => { await supabase.from("lobola_items").delete().eq("id", it.id); refresh(); }}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stores" className="mt-6">
            <form onSubmit={addStore} className="grid gap-3 rounded-2xl border bg-secondary/50 p-5 md:grid-cols-[1fr_1.4fr_1fr_auto]">
              <Input name="name" required placeholder="Store name, e.g. Woolworths" />
              <Input name="url" required placeholder="Registry link" />
              <Input name="description" placeholder="What to shop for" />
              <Button type="submit">Add store</Button>
            </form>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {stores.map((s) => (
                <div key={s.id} className="rounded-2xl border bg-card p-5">
                  <p className="font-display text-2xl">{s.name}</p>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-primary">{s.url}</a>
                  {s.description && <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>}
                  <Button size="sm" variant="ghost" className="mt-2" onClick={async () => { await supabase.from("registry_stores").delete().eq("id", s.id); refresh(); }}>Remove</Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <form onSubmit={saveDetails} className="space-y-6 rounded-2xl border bg-card p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field name="partner_one" label="Partner one" value={w.partner_one} />
                <Field name="partner_two" label="Partner two" value={w.partner_two} />
                <Field name="wedding_date" label="Wedding date" type="date" value={w.wedding_date} />
                <Field name="venue" label="Wedding venue" value={w.venue} />
              </div>
              <div><Label>Your story</Label><Textarea name="story" defaultValue={w.story ?? ""} rows={4} /></div>
              <h3 className="text-2xl">Lobola ceremony (shown to guests)</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field name="lobola_date" label="Lobola date" type="date" value={w.lobola_date} />
                <Field name="lobola_venue" label="Lobola venue" value={w.lobola_venue} />
              </div>
              <div><Label>What guests should know</Label><Textarea name="lobola_details" defaultValue={w.lobola_details ?? ""} rows={4} placeholder="Dress code, which family is hosting, arrival time…" /></div>
              <Button type="submit">Save details</Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-4xl">{value}</p>
    </div>
  );
}

function Field({ name, label, value, type = "text" }: { name: string; label: string; value: string | null; type?: string }) {
  return <div><Label>{label}</Label><Input name={name} type={type} defaultValue={value ?? ""} /></div>;
}
