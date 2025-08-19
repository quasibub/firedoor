"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
async function addCompletedAtColumn() {
    try {
        console.log('🔄 Adding completed_at column to tasks table...');
        const { rows } = await database_1.default.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND column_name = 'completed_at'
    `);
        if (rows.length === 0) {
            await database_1.default.query('ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE');
            console.log('✅ Added completed_at column to tasks table');
        }
        else {
            console.log('ℹ️  completed_at column already exists in tasks table');
        }
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
    addCompletedAtColumn()
        .then(() => {
        console.log('✅ Migration complete');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    });
}
exports.default = addCompletedAtColumn;
//# sourceMappingURL=add-completed-at-column.js.map