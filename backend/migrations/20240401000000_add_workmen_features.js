exports.up = async function(knex) {
  await knex.raw(`
-- Update users table to include workmen role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('inspector', 'admin', 'workman'));

-- Add task photos table
CREATE TABLE IF NOT EXISTS task_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    photo_url VARCHAR(500) NOT NULL,
    photo_type VARCHAR(50) DEFAULT 'completion' CHECK (photo_type IN ('before', 'after', 'completion', 'rejection')),
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Add task rejections table
CREATE TABLE IF NOT EXISTS task_rejections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    rejected_by UUID NOT NULL REFERENCES users(id),
    rejection_reason TEXT NOT NULL,
    rejected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    alternative_suggestion TEXT
);

-- Update tasks table to support rejection status
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'in-progress', 'completed', 'rejected', 'cancelled'));

-- Add indexes for new tables
CREATE INDEX IF NOT EXISTS idx_task_photos_task_id ON task_photos(task_id);
CREATE INDEX IF NOT EXISTS idx_task_rejections_task_id ON task_rejections(task_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create trigger for task_photos
DROP TRIGGER IF EXISTS update_task_photos_updated_at ON task_photos;
CREATE TRIGGER update_task_photos_updated_at BEFORE UPDATE ON task_photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for task_rejections
DROP TRIGGER IF EXISTS update_task_rejections_updated_at ON task_rejections;
CREATE TRIGGER update_task_rejections_updated_at BEFORE UPDATE ON task_rejections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`);
};

exports.down = async function(knex) {
  await knex.raw(`
DROP TRIGGER IF EXISTS update_task_photos_updated_at ON task_photos;
DROP TRIGGER IF EXISTS update_task_rejections_updated_at ON task_rejections;
DROP INDEX IF EXISTS idx_task_photos_task_id;
DROP INDEX IF EXISTS idx_task_rejections_task_id;
DROP INDEX IF EXISTS idx_users_role;
DROP TABLE IF EXISTS task_photos;
DROP TABLE IF EXISTS task_rejections;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('inspector', 'admin'));
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'in-progress', 'completed'));
`);
};
