-- Allow tasks without an inspection (ad-hoc doors added by workmen)
-- Tasks with null inspection_id are doors found on-site that were not on the original report
ALTER TABLE tasks ALTER COLUMN inspection_id DROP NOT NULL;
