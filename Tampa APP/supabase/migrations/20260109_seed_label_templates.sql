-- Seed Standard Label Templates
-- Date: January 9, 2026
-- Purpose: Add standard pre-built templates for common use cases

INSERT INTO label_templates (name, description, is_default, zpl_code) VALUES
('Standard Food Label', 'Standard format for all food items with full allergen information', true, NULL),
('Quick Print Label', 'Simplified format for quick printing with minimal info', false, NULL),
('Allergen Warning Label', 'Emphasized allergen information for high-risk items', false, NULL),
('Prepared Foods Label', 'Specialized format for in-house prepared items with recipe info', false, NULL),
('Raw Ingredients Label', 'Simple format for unprocessed ingredients with storage info', false, NULL)
ON CONFLICT (name) DO NOTHING;

-- Verify
SELECT id, name, description, is_default 
FROM label_templates 
ORDER BY is_default DESC, name;
