-- ============================================================================
-- ADD STATUS FIELD TO PRINTED_LABELS
-- ============================================================================
-- Purpose: Add status tracking for printed labels lifecycle
-- Dependencies: printed_labels table
-- Author: Day 8 - QR Label Action Implementation
-- Date: January 27, 2026
-- ============================================================================

-- Add status column if it doesn't exist
DO $$
BEGIN
    -- Check if status column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'printed_labels' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.printed_labels 
        ADD COLUMN status TEXT DEFAULT 'active' CHECK (
            status IN ('active', 'near_expiry', 'expired', 'wasted', 'used')
        );
        
        -- Add index for status queries
        CREATE INDEX IF NOT EXISTS idx_printed_labels_status 
            ON public.printed_labels(status);
            
        -- Add index for combined status/date queries
        CREATE INDEX IF NOT EXISTS idx_printed_labels_status_date 
            ON public.printed_labels(status, created_at);
            
        RAISE NOTICE '✅ Status column added to printed_labels table';
    ELSE
        RAISE NOTICE '⚠️  Status column already exists in printed_labels table';
    END IF;
END $$;