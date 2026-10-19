import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/use-session";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/w/$slug")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "You're invited — Umshado" },
      { name: "description", content: "RSVP, see lobola details and shop the couple's gift stores." },
      { property: "og:title", content: "You're invited — Umshado" },
      { property: "og:description", content: "RSVP, see lobola details and shop the couple's gift stores." },
    ],
  }),
  component: WeddingPage,
});

function WeddingPage() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["wedding", slug],
    queryFn: async () => {
      const { data: w, error } = await supabase.from("weddings").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!w) return null;
      const { data: stores } = await supabase.from("registry_stores").select("*").eq("wedding_id", w.id).order("created_at");
      return { w, stores: stores ?? [] };
    },
  });

  if (isLoading) return <div className="p-20 text-center text-muted-foreground">Loading…</div>;
  if (!data) return <div className="p-20 text-center"><h1 className="text-4xl">Wedding not found</h1></div>;
  const { w, stores } = data;
  const hasLobola = w.lobola_date || w.lobola_venue || w.lobola_details;

  return (
    <div className="min-h-screen">
      <section className="relative">
        <img src={hero} alt="" width={1600} height={1008} className="h-[70vh] w-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 text-center text-primary-foreground">
          <p className="text-xs uppercase tracking-[0.35em]">Together with their families</p>
          <h1 className="mt-4 text-6xl md:text-8xl">{w.partner_one} <span className="italic">&amp;</span> {w.partner_two}</h1>
          <p className="mt-4 text-lg">{formatDate(w.wedding_date)}{w.venue ? ` · ${w.venue}` : ""}</p>
          <Button asChild size="lg" className="mt-8"><a href="#rsvp">RSVP</a></Button>
        </div>
      </section>

      {w.story && (
        <section className="mx-auto max-w-2xl px-6 py-20 text-center">
          <p className="eyebrow">Our story</p>
          <p className="mt-6 whitespace-pre-line font-display text-2xl leading-relaxed">{w.story}</p>
        </section>
      )}

      {hasLobola && (
        <section className="bg-secondary/60">
          <div className="mx-auto max-w-4xl px-6 py-20">
            <p className="eyebrow">Umembeso · Lobola</p>
            <h2 className="mt-3 text-5xl">The lobola ceremony</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <Info label="When" value={w.lobola_date ? formatDate(w.lobola_date) : "To be announced"} />
              <Info label="Where" value={w.lobola_venue || "To be announced"} />
            </div>
            {w.lobola_details && <p className="mt-8 whitespace-pre-line text-lg">{w.lobola_details}</p>}
          </div>
        </section>
      )}

      {stores.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <p className="eyebrow">Gift registry</p>
          <h2 className="mt-3 text-5xl">Shop for the couple</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((s) => (
              <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="group rounded-2xl border bg-card p-6 shadow-soft transition hover:-translate-y-1">
                <h3 className="text-3xl">{s.name}</h3>
                {s.description && <p className="mt-2 text-muted-foreground">{s.description}</p>}
                <p className="mt-6 text-sm font-semibold text-primary">Visit store →</p>
              </a>
            ))}
          </div>
        </section>
      )}

      <RsvpForm weddingId={w.id} showLobola={!!hasLobola} />
      <footer className="py-10 text-center text-sm text-muted-foreground">Made with Umshado</footer>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-6">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </div>
  );
}

function RsvpForm({ weddingId, showLobola }: { weddingId: string; showLobola: boolean }) {
  const [done, setDone] = useState(false);
  const [attending, setAttending] = useState(true);
  const [events, setEvents] = useState<"wedding" | "lobola" | "both">("wedding");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "").trim();
    if (!name) return toast.error("Please enter your name");
    setBusy(true);
    const { error } = await supabase.from("rsvps").insert({
      wedding_id: weddingId,
      name: name.slice(0, 120),
      email: String(f.get("email") || "").trim().slice(0, 255) || null,
      attending,
      guest_count: attending ? Math.min(20, Math.max(1, Number(f.get("guests") || 1))) : 0,
      events: showLobola ? events : "wedding",
      dietary: String(f.get("dietary") || "").slice(0, 500) || null,
      message: String(f.get("message") || "").slice(0, 1000) || null,
    });
    setBusy(false);
    if (error) return toast.error("Could not send RSVP. Please try again.");
    setDone(true);
  }

  return (
    <section id="rsvp" className="mx-auto max-w-xl px-6 py-20">
      <p className="eyebrow text-center">Kindly reply</p>
      <h2 className="mt-3 text-center text-5xl">RSVP</h2>
      {done ? (
        <p className="mt-10 rounded-2xl bg-secondary p-8 text-center font-display text-2xl">Ngiyabonga! Your RSVP has been received.</p>
      ) : (
        <form onSubmit={submit} className="mt-10 space-y-5 rounded-2xl border bg-card p-8 shadow-soft">
          <div><Label htmlFor="name">Full name</Label><Input id="name" name="name" required maxLength={120} /></div>
          <div><Label htmlFor="email">Email (optional)</Label><Input id="email" name="email" type="email" maxLength={255} /></div>
          <div>
            <Label>Will you attend?</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button type="button" variant={attending ? "default" : "outline"} onClick={() => setAttending(true)}>Joyfully accept</Button>
              <Button type="button" variant={!attending ? "default" : "outline"} onClick={() => setAttending(false)}>Regretfully decline</Button>
            </div>
          </div>
          {attending && (
            <>
              {showLobola && (
                <div>
                  <Label>Which celebrations?</Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(["wedding", "lobola", "both"] as const).map((o) => (
                      <Button key={o} type="button" variant={events === o ? "default" : "outline"} onClick={() => setEvents(o)} className="capitalize">{o}</Button>
                    ))}
                  </div>
                </div>
              )}
              <div><Label htmlFor="guests">Number of guests (incl. you)</Label><Input id="guests" name="guests" type="number" min={1} max={20} defaultValue={1} /></div>
              <div><Label htmlFor="dietary">Dietary needs</Label><Input id="dietary" name="dietary" maxLength={500} /></div>
            </>
          )}
          <div><Label htmlFor="message">Message for the couple</Label><Textarea id="message" name="message" maxLength={1000} /></div>
          <Button type="submit" className="w-full" size="lg" disabled={busy}>Send RSVP</Button>
        </form>
      )}
    </section>
  );
}
