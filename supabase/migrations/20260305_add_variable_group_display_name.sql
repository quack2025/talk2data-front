-- Add display_name column to variable_groups for short, LLM-friendly group names
ALTER TABLE variable_groups ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
