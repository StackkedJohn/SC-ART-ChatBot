-- Migration to fix "General" subcategory naming issue
-- This script renames generic "General" subcategories to be more descriptive
-- and reorganizes content hierarchy

-- First, let's check what we have and rename any "General" subcategories
-- to meaningful names based on their parent category

-- For each category, if there's a "General" subcategory, rename it or handle content properly

-- Option 1: Rename "General" subcategories to match their parent category name
UPDATE subcategories s
SET name = c.name || ' Resources',
    description = COALESCE(s.description, 'General resources for ' || c.name)
FROM categories c
WHERE s.category_id = c.id
  AND s.name = 'General';

-- Option 2: For categories that only have "General" subcategory and minimal other structure,
-- you may want to move content directly under the category (requires application changes)
-- or create properly named subcategories

-- Add a comment to track this migration
COMMENT ON TABLE subcategories IS 'Migration applied: Renamed generic "General" subcategories to descriptive names';
