"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function addWorkmenFeatures() {
    try {
        console.log('🔄 Adding workmen features to database...');
        const sqlPath = path_1.default.join(__dirname, 'add-workmen-features.sql');
        const sqlContent = fs_1.default.readFileSync(sqlPath, 'utf8');
        const statements = sqlContent.split(';').filter(stmt => stmt.trim());
        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.substring(0, 50) + '...');
                await database_1.default.query(statement);
            }
        }
        console.log('✅ Workmen features added successfully');
        console.log('🔍 Verifying changes...');
        const { rows: tables } = await database_1.default.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('task_photos', 'task_rejections')
    `);
        console.log('New tables created:', tables);
        const { rows: userConstraints } = await database_1.default.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints 
      WHERE constraint_name LIKE '%users_role%'
    `);
        console.log('User role constraints:', userConstraints);
        const { rows: taskConstraints } = await database_1.default.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints 
      WHERE constraint_name LIKE '%tasks_status%'
    `);
        console.log('Task status constraints:', taskConstraints);
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
    addWorkmenFeatures()
        .then(() => {
        console.log('✅ Migration complete');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    });
}
exports.default = addWorkmenFeatures;
//# sourceMappingURL=add-workmen-features.js.map