-- Add homes feature to the database

-- Create homes table
CREATE TABLE IF NOT EXISTS homes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    address TEXT,
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add home_id column to inspections table
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS home_id UUID REFERENCES homes(id);

-- Add home_id column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS home_id UUID REFERENCES homes(id);

-- Add home_id column to users table (to assign users to specific homes)
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_id UUID REFERENCES homes(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inspections_home_id ON inspections(home_id);
CREATE INDEX IF NOT EXISTS idx_tasks_home_id ON tasks(home_id);
CREATE INDEX IF NOT EXISTS idx_users_home_id ON users(home_id);

-- Insert default homes (you can modify these as needed)
INSERT INTO homes (id, name, address, contact_person, contact_email, contact_phone) VALUES
    (gen_random_uuid(), 'Sunrise Care Home', '123 Sunrise Avenue, London', 'Sarah Johnson', 'sarah@sunrisecare.com', '020 1234 5678'),
    (gen_random_uuid(), 'Maple Gardens', '456 Maple Street, Manchester', 'Michael Brown', 'michael@maplegardens.com', '0161 234 5678'),
    (gen_random_uuid(), 'Riverside Lodge', '789 Riverside Road, Birmingham', 'Emma Wilson', 'emma@riversidelodge.com', '0121 345 6789')
ON CONFLICT (name) DO NOTHING;

-- Update trigger for homes table
DROP TRIGGER IF EXISTS update_homes_updated_at ON homes;
CREATE TRIGGER update_homes_updated_at BEFORE UPDATE ON homes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 