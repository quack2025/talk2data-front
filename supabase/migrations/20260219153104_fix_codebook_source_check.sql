-- Fix codebook_source constraint to allow 'seeded' and 'inherited' values
-- 'seeded' = user selected "Start with predefined categories"
-- 'inherited' = used in NewWave flow
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_codebook_source_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_codebook_source_check
  CHECK (codebook_source IS NULL OR codebook_source IN ('generate', 'inherit', 'inherited', 'upload', 'seeded'));
