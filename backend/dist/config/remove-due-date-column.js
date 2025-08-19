"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
async function removeDueDateColumn() {
    try {
        console.log('🔄 Removing due_date column from tasks table...');
        const { rows } = await database_1.default.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND column_name = 'due_date'
    `);
        if (rows.length > 0) {
            await database_1.default.query('ALTER TABLE tasks DROP COLUMN due_date');
            console.log('✅ Removed due_date column from tasks table');
        }
        else {
            console.log('ℹ️  due_date column does not exist in tasks table');
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
    removeDueDateColumn()
        .then(() => {
        console.log('✅ Migration complete');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    });
}
exports.default = removeDueDateColumn;
//# sourceMappingURL=remove-due-date-column.js.map