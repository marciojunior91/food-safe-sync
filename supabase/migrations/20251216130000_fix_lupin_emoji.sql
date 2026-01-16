-- Fix Lupin allergen emoji
-- The beans emoji (🫘) may not render properly in all browsers/devices
-- Update to a more universally supported emoji

UPDATE public.allergens 
SET icon = '🌿'  -- Herb emoji - more appropriate for lupin and better supported
WHERE name = 'Lupin';

-- Note: Lupin is a legume, but using 🌿 (herb/plant) is more recognizable
-- and has better cross-platform support than 🫘 (beans emoji)
