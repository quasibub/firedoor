"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
async function fixDuplicateCompletedAtColumns() {
    try {
        console.log('🔄 Fixing duplicate completed_at columns...');
        const { rows: allColumns } = await database_1.default.query(`
      SELECT column_name, data_type, ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      ORDER BY ordinal_position
    `);
        console.log('All columns in tasks table:', allColumns);
        const { rows: completedAtColumns } = await database_1.default.query(`
      SELECT column_name, data_type, ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND column_name = 'completed_at'
      ORDER BY ordinal_position
    `);
        console.log('Found completed_at columns:', completedAtColumns);
        if (completedAtColumns.length > 1) {
            console.log('⚠️  Found duplicate completed_at columns. Fixing...');
            for (let i = 0; i < completedAtColumns.length; i++) {
                console.log(`Dropping completed_at column ${i + 1}...`);
                try {
                    await database_1.default.query('ALTER TABLE tasks DROP COLUMN completed_at');
                }
                catch (error) {
                    console.log(`Column ${i + 1} already dropped or doesn't exist`);
                }
            }
            console.log('Adding single completed_at column...');
            await database_1.default.query('ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE');
            console.log('✅ Duplicate columns fixed');
        }
        else if (completedAtColumns.length === 1) {
            console.log('✅ Only one completed_at column found - no duplicates');
        }
        else {
            console.log('ℹ️  No completed_at columns found, adding one...');
            await database_1.default.query('ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE');
        }
        const { rows: finalCheck } = await database_1.default.query(`
      SELECT column_name, data_type, ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND column_name = 'completed_at'
    `);
        console.log('Final completed_at columns:', finalCheck);
        console.log('🎉 Migration completed successfully');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
    finally {
        await database_1.default.end();
    }
}
if (require.main === module) {
    fixDuplicateCompletedAtColumns()
        .then(() => {
        console.log('✅ Migration complete');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    });
}
exports.default = fixDuplicateCompletedAtColumns;
//# sourceMappingURL=fix-duplicate-completed-at.js.map