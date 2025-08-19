-- Migration: Add notes column to tasks table
-- This script adds the missing notes column that the PDF upload functionality expects

-- Add notes column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE tasks ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to tasks table';
    ELSE
        RAISE NOTICE 'notes column already exists in tasks table';
    END IF;
END $$; 