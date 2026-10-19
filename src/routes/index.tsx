import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Umshado — Your wedding, RSVPs & lobola in one place" },
      { name: "description", content: "Create a beautiful wedding page. Guests RSVP, see lobola details and shop your gift stores." },
      { property: "og:title", content: "Umshado — Your wedding, RSVPs & lobola in one place" },
      { property: "og:description", content: "Create a beautiful wedding page. Guests RSVP, see lobola details and shop your gift stores." },
    ],
  }),
  component: Index,
});

const features = [
  { title: "RSVPs", body: "Guests reply in seconds for the wedding, the lobola, or both. You see every answer in one list." },
  { title: "Lobola", body: "Share ceremony details with family, and keep a private tracker of what has been discussed, agreed and delivered." },
  { title: "Gift stores", body: "Link the stores where you're registered so guests can shop for you straight from your page." },
];

function Index() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="relative">
        <img src={hero} alt="Wedding rings, flowers and beadwork" width={1600} height={1008} className="h-[78vh] w-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-6xl px-6 pb-16 text-primary-foreground">
            <p className="text-xs uppercase tracking-[0.3em] opacity-90">Umshado · Wedding pages</p>
            <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] md:text-7xl">From lobola to "I do", all in one place.</h1>
            <p className="mt-5 max-w-xl text-lg opacity-90">Make your wedding page, collect RSVPs and share where guests can shop for your gifts.</p>
            <Button asChild size="lg" className="mt-8"><Link to="/auth">Create your wedding page</Link></Button>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-24 md:grid-cols-3">
        {features.map((f, i) => (
          <div key={f.title}>
            <p className="eyebrow">0{i + 1}</p>
            <h2 className="mt-3 text-3xl">{f.title}</h2>
            <p className="mt-3 text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
