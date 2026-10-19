CREATE TABLE public.weddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  partner_one text NOT NULL,
  partner_two text NOT NULL,
  wedding_date date,
  venue text,
  story text,
  lobola_date date,
  lobola_venue text,
  lobola_details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.weddings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weddings TO authenticated;
GRANT ALL ON public.weddings TO service_role;
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view weddings" ON public.weddings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owners insert weddings" ON public.weddings FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update weddings" ON public.weddings FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners delete weddings" ON public.weddings FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE public.rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  email text CHECK (email IS NULL OR char_length(email) <= 255),
  attending boolean NOT NULL DEFAULT true,
  guest_count int NOT NULL DEFAULT 1 CHECK (guest_count BETWEEN 0 AND 20),
  events text NOT NULL DEFAULT 'wedding' CHECK (events IN ('wedding','lobola','both')),
  dietary text CHECK (dietary IS NULL OR char_length(dietary) <= 500),
  message text CHECK (message IS NULL OR char_length(message) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.rsvps TO anon;
GRANT SELECT, INSERT, DELETE ON public.rsvps TO authenticated;
GRANT ALL ON public.rsvps TO service_role;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can RSVP" ON public.rsvps FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id));
CREATE POLICY "Owners view rsvps" ON public.rsvps FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.owner_id = auth.uid()));
CREATE POLICY "Owners delete rsvps" ON public.rsvps FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.owner_id = auth.uid()));

CREATE TABLE public.lobola_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  title text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'discussing' CHECK (status IN ('discussing','agreed','delivered')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lobola_items TO authenticated;
GRANT ALL ON public.lobola_items TO service_role;
ALTER TABLE public.lobola_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage lobola items" ON public.lobola_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.owner_id = auth.uid()));

CREATE TABLE public.registry_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.registry_stores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registry_stores TO authenticated;
GRANT ALL ON public.registry_stores TO service_role;
ALTER TABLE public.registry_stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stores" ON public.registry_stores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owners manage stores" ON public.registry_stores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.owner_id = auth.uid()));