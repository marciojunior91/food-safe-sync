-- Fix zebra_printers table schema inconsistency
-- The table has columns named differently than expected by the types

-- Check if table exists and fix column names
DO $$
BEGIN
    -- Rename darkness to default_darkness if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zebra_printers' 
        AND column_name = 'darkness'
    ) THEN
        ALTER TABLE zebra_printers RENAME COLUMN darkness TO default_darkness;
        RAISE NOTICE 'Renamed darkness to default_darkness';
    END IF;

    -- Rename speed to default_print_speed if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zebra_printers' 
        AND column_name = 'speed'
    ) THEN
        ALTER TABLE zebra_printers RENAME COLUMN speed TO default_print_speed;
        RAISE NOTICE 'Renamed speed to default_print_speed';
    END IF;

    -- Rename paper_width to label_width_mm if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zebra_printers' 
        AND column_name = 'paper_width'
    ) THEN
        ALTER TABLE zebra_printers RENAME COLUMN paper_width TO label_width_mm;
        RAISE NOTICE 'Renamed paper_width to label_width_mm';
    END IF;

    -- Rename paper_height to label_height_mm if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zebra_printers' 
        AND column_name = 'paper_height'
    ) THEN
        ALTER TABLE zebra_printers RENAME COLUMN paper_height TO label_height_mm;
        RAISE NOTICE 'Renamed paper_height to label_height_mm';
    END IF;

    -- Rename dpi to print_density_dpi if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zebra_printers' 
        AND column_name = 'dpi'
    ) THEN
        ALTER TABLE zebra_printers RENAME COLUMN dpi TO print_density_dpi;
        RAISE NOTICE 'Renamed dpi to print_density_dpi';
    END IF;

    -- Rename last_seen to last_seen_at if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zebra_printers' 
        AND column_name = 'last_seen'
    ) THEN
        ALTER TABLE zebra_printers RENAME COLUMN last_seen TO last_seen_at;
        RAISE NOTICE 'Renamed last_seen to last_seen_at';
    END IF;

    -- Add websocket_port column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zebra_printers' 
        AND column_name = 'websocket_port'
    ) THEN
        ALTER TABLE zebra_printers ADD COLUMN websocket_port INTEGER;
        RAISE NOTICE 'Added websocket_port column';
    END IF;

    -- Add enabled column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zebra_printers' 
        AND column_name = 'enabled'
    ) THEN
        ALTER TABLE zebra_printers ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE 'Added enabled column';
    END IF;

END $$;

-- Update comments to reflect new column names
COMMENT ON COLUMN zebra_printers.default_darkness IS 'Print darkness setting (0-30, higher = darker)';
COMMENT ON COLUMN zebra_printers.default_print_speed IS 'Print speed setting (2-12, higher = faster)';
COMMENT ON COLUMN zebra_printers.label_width_mm IS 'Label width in millimeters';
COMMENT ON COLUMN zebra_printers.label_height_mm IS 'Label height in millimeters';
COMMENT ON COLUMN zebra_printers.print_density_dpi IS 'Print density in DPI (203 or 300)';
COMMENT ON COLUMN zebra_printers.last_seen_at IS 'Last time printer was seen online';
COMMENT ON COLUMN zebra_printers.websocket_port IS 'WebSocket port for Zebra Printer Setup App (6101, 9100, or 9200)';
COMMENT ON COLUMN zebra_printers.enabled IS 'Whether the printer is enabled for use';

-- Verify the fix
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    -- Check for expected columns
    SELECT ARRAY_AGG(column_name)
    INTO missing_columns
    FROM (
        VALUES 
            ('default_darkness'),
            ('default_print_speed'),
            ('label_width_mm'),
            ('label_height_mm'),
            ('print_density_dpi'),
            ('last_seen_at'),
            ('websocket_port'),
            ('enabled')
    ) AS expected(column_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'zebra_printers'
        AND columns.column_name = expected.column_name
    );

    IF missing_columns IS NOT NULL THEN
        RAISE WARNING 'Missing columns in zebra_printers: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ All expected columns present in zebra_printers table';
    END IF;
END $$;
