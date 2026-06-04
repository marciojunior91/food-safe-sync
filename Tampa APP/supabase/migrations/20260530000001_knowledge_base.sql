-- ============================================================================
-- KNOWLEDGE BASE
-- ============================================================================
-- Purpose: Admin-managed CRUD for help articles surfaced to all org members.
--          Replaces the placeholder data + "Coming Soon" banner in
--          src/pages/KnowledgeBase.tsx.
-- Tables : knowledge_base_categories (admin-editable category list)
--          knowledge_base_articles   (article body + metadata + view counter)
-- RLS    : SELECT for any org member on published rows.
--          INSERT/UPDATE/DELETE restricted to admins (mirrors training_courses).
--          View counter incremented via SECURITY DEFINER RPC so staff can read.
-- ============================================================================

-- ── 1. Categories ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.knowledge_base_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,                       -- optional emoji
  sort_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

ALTER TABLE public.knowledge_base_categories ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_kb_categories_org
  ON public.knowledge_base_categories(organization_id);

DROP POLICY IF EXISTS "Org members read kb categories" ON public.knowledge_base_categories;
CREATE POLICY "Org members read kb categories"
  ON public.knowledge_base_categories FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage kb categories" ON public.knowledge_base_categories;
CREATE POLICY "Admins manage kb categories"
  ON public.knowledge_base_categories FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND public.has_any_role(auth.uid(), ARRAY['admin']::app_role[])
  );

-- ── 2. Articles ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.knowledge_base_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.knowledge_base_categories(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,                   -- short summary for cards
  content TEXT NOT NULL,          -- markdown body
  is_published BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  UNIQUE(organization_id, slug)
);

ALTER TABLE public.knowledge_base_articles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_kb_articles_org
  ON public.knowledge_base_articles(organization_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_category
  ON public.knowledge_base_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_published
  ON public.knowledge_base_articles(organization_id, is_published, published_at);

DROP POLICY IF EXISTS "Org members read published articles" ON public.knowledge_base_articles;
CREATE POLICY "Org members read published articles"
  ON public.knowledge_base_articles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND (
      is_published = true
      OR public.has_any_role(auth.uid(), ARRAY['admin']::app_role[])
    )
  );

DROP POLICY IF EXISTS "Admins manage articles" ON public.knowledge_base_articles;
CREATE POLICY "Admins manage articles"
  ON public.knowledge_base_articles FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND public.has_any_role(auth.uid(), ARRAY['admin']::app_role[])
  );

-- ── 3. Auto-update updated_at + published_at ──────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_kb_article_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  IF NEW.is_published = true AND OLD.is_published IS DISTINCT FROM true THEN
    NEW.published_at := COALESCE(NEW.published_at, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kb_articles_set_timestamps ON public.knowledge_base_articles;
CREATE TRIGGER kb_articles_set_timestamps
  BEFORE UPDATE ON public.knowledge_base_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_kb_article_update();

-- ── 4. View-counter RPC (staff can bump views without UPDATE permission) ──
CREATE OR REPLACE FUNCTION public.increment_kb_article_view(article_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.knowledge_base_articles
    SET views = views + 1
    WHERE id = article_id
      AND organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_kb_article_view(UUID) TO authenticated;

-- ── 5. Seed default categories + starter articles per existing org ────────
DO $$
DECLARE
  v_org RECORD;
  v_admin UUID;
  v_cat_food UUID;
  v_cat_equipment UUID;
  v_cat_allergen UUID;
  v_cat_cleaning UUID;
BEGIN
  FOR v_org IN SELECT id FROM public.organizations LOOP
    -- Skip if categories already seeded
    IF EXISTS (
      SELECT 1 FROM public.knowledge_base_categories WHERE organization_id = v_org.id
    ) THEN
      CONTINUE;
    END IF;

    SELECT user_id INTO v_admin
      FROM public.profiles
      WHERE organization_id = v_org.id
      LIMIT 1;
    IF v_admin IS NULL THEN CONTINUE; END IF;

    INSERT INTO public.knowledge_base_categories (organization_id, name, icon, sort_order)
      VALUES
        (v_org.id, 'Food Safety',         '🛡️', 10),
        (v_org.id, 'Equipment Operation', '🔧', 20),
        (v_org.id, 'Allergen Management', '⚠️', 30),
        (v_org.id, 'Cleaning Protocols',  '🧽', 40),
        (v_org.id, 'Storage Guidelines',  '❄️', 50),
        (v_org.id, 'Health & Hygiene',    '🧼', 60),
        (v_org.id, 'Emergency Procedures','🚨', 70),
        (v_org.id, 'Recipes & Procedures','📖', 80);

    SELECT id INTO v_cat_food       FROM public.knowledge_base_categories WHERE organization_id = v_org.id AND name = 'Food Safety';
    SELECT id INTO v_cat_equipment  FROM public.knowledge_base_categories WHERE organization_id = v_org.id AND name = 'Equipment Operation';
    SELECT id INTO v_cat_allergen   FROM public.knowledge_base_categories WHERE organization_id = v_org.id AND name = 'Allergen Management';
    SELECT id INTO v_cat_cleaning   FROM public.knowledge_base_categories WHERE organization_id = v_org.id AND name = 'Cleaning Protocols';

    INSERT INTO public.knowledge_base_articles
      (organization_id, category_id, author_id, title, slug, excerpt, content, is_published, published_at)
    VALUES
      (v_org.id, v_cat_food, v_admin,
       'Food Temperature Safety Guidelines',
       'food-temperature-safety-guidelines',
       'Cold and hot holding temperatures, the danger zone, and what to log.',
       E'# Food Temperature Safety Guidelines\n\n## The Danger Zone\nBacteria grow fastest between **4°C and 60°C** (40°F–140°F). Keep cold food **at or below 4°C** and hot food **at or above 60°C**.\n\n## Cold Holding\n- Fridges: 0–4°C\n- Freezers: -18°C or colder\n- Salad bars / cold counters: ≤ 4°C, checked every 2 hours\n\n## Hot Holding\n- Bain-maries / hot counters: ≥ 60°C\n- Reheated food: reach **75°C internal** within 2 hours of removing from the fridge\n\n## Logging\nLog all critical temperatures at the start of each shift and every 4 hours after that. Use the **Routine Tasks** module to schedule these checks.\n',
       true, NOW()),

      (v_org.id, v_cat_equipment, v_admin,
       'How to Use the Bluetooth Label Printer',
       'how-to-use-bluetooth-label-printer',
       'Pair once, print everywhere. Step-by-step pairing and troubleshooting.',
       E'# How to Use the Bluetooth Label Printer\n\n## First-time pairing\n1. Open the printer and check it is powered on (top LED steady).\n2. In Tampa, go to **Settings → Printer**.\n3. Tap **Search for Bluetooth Printers**.\n4. Select your printer when it appears in the picker.\n5. Wait for the **Paired & Connected** confirmation.\n\nOnce paired, the device is remembered. You can print labels from anywhere in the app without re-pairing.\n\n## Troubleshooting\n- **Picker shows again on print** → Make sure you completed the first-pair flow on Settings → Printer (not by pressing print from a label screen).\n- **Not connecting** → Power-cycle the printer; the app will silently reconnect on the next print.\n- **Forgotten printer?** → Settings → Printer → **Forget** clears the saved pairing.\n',
       true, NOW()),

      (v_org.id, v_cat_allergen, v_admin,
       'Allergen Cross-Contamination Prevention',
       'allergen-cross-contamination-prevention',
       'Clean as you go, dedicated tools, and labelling rules to keep customers safe.',
       E'# Allergen Cross-Contamination Prevention\n\nFood allergens can be life-threatening even in trace amounts. Treat allergen control as a non-negotiable critical control point.\n\n## Rules\n1. **Wash hands** with hot soapy water before handling allergen-free orders.\n2. Use **separate, colour-coded** chopping boards and utensils.\n3. **Sanitise** prep surfaces between products that contain different allergens.\n4. Store allergens (especially nuts) in **sealed, labelled containers** on the bottom shelf to avoid drips.\n5. Always check the recipe in Tampa **Labeling** for the full allergen list before plating.\n\n## Communication\nWhen a customer flags an allergy, repeat it back to the chef and tag the order in the POS. The kitchen should call out the allergy on every step from prep to pass.\n',
       true, NOW()),

      (v_org.id, v_cat_cleaning, v_admin,
       'Daily, Weekly and Monthly Cleaning Checklists',
       'cleaning-checklists',
       'Cadence-based deep-clean and sanitation tasks you can route through Routine Tasks.',
       E'# Cleaning Checklists\n\n## Daily\n- Wipe down all food-contact surfaces after each service\n- Sanitise sinks, taps, and door handles\n- Empty and sanitise the bin\n- Mop floors at close of business\n\n## Weekly\n- Deep-clean the fridge interior (rotate stock, check expiry dates)\n- De-grease range hoods, splashbacks, and the inside of the oven\n- Clean ice machine seals\n\n## Monthly\n- Pull out fridges and freezers and clean behind them\n- Descale dishwasher and coffee machine\n- Inspect and clean the grease trap\n\nAll of these can be scheduled in **Routine Tasks** so they appear on the team''s home page on the right day.\n',
       true, NOW());
  END LOOP;
END $$;

DO $$
BEGIN
  RAISE NOTICE '✅ Knowledge Base tables, RLS, and starter content installed';
END $$;
