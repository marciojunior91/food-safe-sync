-- ============================================================================
-- BRIDGE: PRINTED_LABELS DISCARDED → WASTE_LOGS
-- ============================================================================
-- Purpose: When a printed label transitions to status='wasted' (via the
--          Expiring Soon → Discard flow), automatically insert a matching
--          row into waste_logs so the Analytics module sees a single,
--          unified waste stream.
--
-- Source field mapping:
--   printed_labels.product_name   → waste_logs.item_name
--   printed_labels.category_name  → waste_logs.category
--   printed_labels.quantity       → waste_logs.quantity (numeric cast, fallback 1)
--   printed_labels.unit           → waste_logs.unit (fallback 'unit')
--   printed_labels.action_notes   → waste_logs.reason (lowercased, fallback 'expired')
--   printed_labels.action_notes   → waste_logs.notes  (full text preserved)
--   printed_labels.organization_id → waste_logs.organization_id
--   auth.uid()                    → waste_logs.logged_by (the user marking discard)
--
-- This is an additive bridge — it never updates or deletes from waste_logs;
-- a re-trigger (e.g. status flips back to 'wasted' twice) is guarded by an
-- idempotency check (one waste_log per printed_label).
-- ============================================================================

-- 1. Ensure there is a stable link between waste_logs and the originating label.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'waste_logs'
      AND column_name = 'source_label_id'
  ) THEN
    ALTER TABLE public.waste_logs
      ADD COLUMN source_label_id UUID
      REFERENCES public.printed_labels(id) ON DELETE SET NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_waste_logs_source_label_unique
      ON public.waste_logs(source_label_id)
      WHERE source_label_id IS NOT NULL;
  END IF;
END $$;

-- 2. Reason normaliser: maps free-text discard notes into the canonical
--    waste_logs.reason values used by the analytics view.
--    Canonical set: spoilage | expired | preparation_error | over_production
--                 | temperature_issue | quality_issue | damaged | other
CREATE OR REPLACE FUNCTION public.normalize_waste_reason(notes TEXT)
RETURNS TEXT AS $$
DECLARE
  n TEXT := lower(coalesce(notes, ''));
BEGIN
  IF n = '' THEN
    RETURN 'expired';
  ELSIF n ~ '(spoil|mold|moldy|moldy|off|smell|rancid|bad)' THEN
    RETURN 'spoilage';
  ELSIF n ~ '(expir|use[- ]?by|past date|too old)' THEN
    RETURN 'expired';
  ELSIF n ~ '(temp|temperature|cold chain|warm|freezer|fridge)' THEN
    RETURN 'temperature_issue';
  ELSIF n ~ '(over[- ]?prod|too much|excess|leftover)' THEN
    RETURN 'over_production';
  ELSIF n ~ '(prep|prepar|mistake|error|wrong|burn)' THEN
    RETURN 'preparation_error';
  ELSIF n ~ '(damag|broken|crushed|leak|contamin)' THEN
    RETURN 'damaged';
  ELSIF n ~ '(quality|texture|taste|color)' THEN
    RETURN 'quality_issue';
  ELSE
    RETURN 'other';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Trigger function: on transition to status='wasted', insert into waste_logs.
CREATE OR REPLACE FUNCTION public.handle_label_discarded()
RETURNS TRIGGER AS $$
DECLARE
  v_qty_numeric NUMERIC;
BEGIN
  -- Only fire on a transition INTO 'wasted'
  IF NEW.status IS DISTINCT FROM 'wasted' THEN
    RETURN NEW;
  END IF;
  IF OLD.status IS NOT DISTINCT FROM 'wasted' THEN
    RETURN NEW;  -- already wasted, idempotent no-op
  END IF;

  -- Idempotency guard: skip if a waste_log already exists for this label
  IF EXISTS (
    SELECT 1 FROM public.waste_logs WHERE source_label_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  -- Parse the free-text quantity ("2", "2.5", "1 kg") into a number; default 1.
  BEGIN
    v_qty_numeric := COALESCE(NULLIF(regexp_replace(coalesce(NEW.quantity, '1'), '[^0-9.]', '', 'g'), '')::numeric, 1);
  EXCEPTION WHEN OTHERS THEN
    v_qty_numeric := 1;
  END;

  INSERT INTO public.waste_logs (
    organization_id,
    logged_by,
    item_name,
    quantity,
    unit,
    reason,
    category,
    estimated_cost,
    notes,
    source_label_id,
    logged_at
  ) VALUES (
    NEW.organization_id,
    COALESCE(auth.uid(), NEW.prepared_by::uuid),
    NEW.product_name,
    v_qty_numeric,
    COALESCE(NEW.unit, 'unit'),
    public.normalize_waste_reason(NEW.action_notes),
    NEW.category_name,
    NULL, -- cost is unknown until products carry unit-cost
    NEW.action_notes,
    NEW.id,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS printed_labels_to_waste_logs ON public.printed_labels;
CREATE TRIGGER printed_labels_to_waste_logs
  AFTER UPDATE OF status ON public.printed_labels
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_label_discarded();

-- 4. Backfill: any existing 'wasted' label that doesn't have a waste_log yet.
INSERT INTO public.waste_logs (
  organization_id,
  logged_by,
  item_name,
  quantity,
  unit,
  reason,
  category,
  notes,
  source_label_id,
  logged_at
)
SELECT
  pl.organization_id,
  COALESCE(pl.prepared_by::uuid, (SELECT user_id FROM public.profiles WHERE organization_id = pl.organization_id LIMIT 1)),
  pl.product_name,
  COALESCE(NULLIF(regexp_replace(coalesce(pl.quantity, '1'), '[^0-9.]', '', 'g'), '')::numeric, 1),
  COALESCE(pl.unit, 'unit'),
  public.normalize_waste_reason(pl.action_notes),
  pl.category_name,
  pl.action_notes,
  pl.id,
  COALESCE(pl.created_at, NOW())
FROM public.printed_labels pl
WHERE pl.status = 'wasted'
  AND pl.organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.waste_logs wl WHERE wl.source_label_id = pl.id
  );

DO $$
BEGIN
  RAISE NOTICE '✅ printed_labels → waste_logs bridge installed';
  RAISE NOTICE '✅ Existing wasted labels backfilled into waste_logs';
END $$;
