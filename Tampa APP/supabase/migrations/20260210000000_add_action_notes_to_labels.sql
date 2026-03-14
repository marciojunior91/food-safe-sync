-- ============================================================================
-- ADD ACTION NOTES TO PRINTED_LABELS
-- ============================================================================
-- Purpose: Store the reason when a label is extended, discarded or consumed.
--          Enables future audit queries such as "why was this batch discarded?"
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'printed_labels'
          AND column_name  = 'action_notes'
    ) THEN
        ALTER TABLE public.printed_labels
            ADD COLUMN action_notes TEXT;

        COMMENT ON COLUMN public.printed_labels.action_notes
            IS 'Optional reason recorded when status changes (extend / discard / consume)';

        RAISE NOTICE '✅ action_notes column added to printed_labels';
    ELSE
        RAISE NOTICE '⚠️  action_notes column already exists';
    END IF;
END $$;
