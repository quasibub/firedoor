"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function addHomesFeature() {
    try {
        console.log('🏠 Adding homes feature to database...');
        const sqlPath = path_1.default.join(__dirname, 'add-homes-feature.sql');
        const sqlContent = fs_1.default.readFileSync(sqlPath, 'utf8');
        const statements = sqlContent.split(';').filter(stmt => stmt.trim());
        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.substring(0, 50) + '...');
                await database_1.default.query(statement);
            }
        }
        console.log('✅ Homes feature added successfully!');
        console.log('🔍 Verifying changes...');
        const { rows: homes } = await database_1.default.query('SELECT COUNT(*) as count FROM homes');
        console.log(`Found ${homes[0].count} homes in database`);
        const { rows: inspections } = await database_1.default.query('SELECT COUNT(*) as count FROM inspections WHERE home_id IS NOT NULL');
        console.log(`Found ${inspections[0].count} inspections with home_id`);
        const { rows: tasks } = await database_1.default.query('SELECT COUNT(*) as count FROM tasks WHERE home_id IS NOT NULL');
        console.log(`Found ${tasks[0].count} tasks with home_id`);
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
addHomesFeature();
//# sourceMappingURL=add-homes-feature.js.map