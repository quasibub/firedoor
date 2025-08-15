exports.up = async function(knex) {
  await knex.raw(`
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tasks'
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE tasks ADD COLUMN notes TEXT;
    END IF;
END $$;
`);
};

exports.down = async function(knex) {
  await knex.schema.table('tasks', table => {
    table.dropColumn('notes');
  });
};
