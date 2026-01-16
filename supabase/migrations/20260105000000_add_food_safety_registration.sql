-- Add food safety registration number to organizations table
-- This is equivalent to Brazil's SIF (Serviço de Inspeção Federal)
-- In Australia, this would be the Food Business Registration Number

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS food_safety_registration VARCHAR(50);

COMMENT ON COLUMN organizations.food_safety_registration IS 'Food safety registration number (e.g., SIF in Brazil, Food Business Registration in Australia)';
