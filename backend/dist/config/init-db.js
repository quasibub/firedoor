"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function initializeDatabase() {
    try {
        console.log('🔄 Initializing database...');
        const schemaPath = path_1.default.join(__dirname, 'schema.sql');
        const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
        try {
            await database_1.default.query(schema);
        }
        catch (error) {
            if (error.code === '42710') {
                console.log('ℹ️  Some objects already exist, continuing...');
            }
            else {
                console.error('❌ Error executing schema:', error.message);
                throw error;
            }
        }
        console.log('✅ Database schema created successfully');
        const { rows: existingUsers } = await database_1.default.query('SELECT COUNT(*) FROM users');
        if (parseInt(existingUsers[0].count) === 0) {
            console.log('📝 Adding sample data...');
            const hashedPassword = await bcryptjs_1.default.hash('password', 10);
            await database_1.default.query(`
        INSERT INTO users (email, password_hash, name, role) 
        VALUES 
          ('inspector@example.com', $1, 'John Inspector', 'inspector'),
          ('admin@example.com', $1, 'Admin User', 'admin')
      `, [hashedPassword]);
            const { rows: [inspection] } = await database_1.default.query(`
        INSERT INTO inspections (location, inspector_name, date, status, total_doors, compliant_doors, non_compliant_doors, critical_issues, notes)
        VALUES ('Main Building - Floor 1', 'John Inspector', '2024-01-15', 'completed', 12, 10, 2, 1, 'Overall good condition, minor issues found')
        RETURNING id
      `);
            await database_1.default.query(`
         INSERT INTO tasks (inspection_id, door_id, location, title, description, priority, status, assigned_to, category)
         VALUES 
           ($1, 'FD-001', 'Main Building - Floor 1', 'Replace damaged door closer', 'Door closer needs replacement due to wear', 'high', 'in-progress', 'John Inspector', 'Hardware Issues'),
           ($1, 'FD-002', 'Main Building - Floor 1', 'Fix door frame alignment', 'Door frame slightly misaligned', 'medium', 'pending', 'John Inspector', 'Structural Repairs')
       `, [inspection.id]);
            console.log('✅ Sample data added successfully');
        }
        else {
            console.log('ℹ️  Database already contains data, skipping sample data');
        }
        console.log('🎉 Database initialization completed successfully');
    }
    catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}
if (require.main === module) {
    initializeDatabase()
        .then(() => {
        console.log('✅ Database setup complete');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    });
}
exports.default = initializeDatabase;
//# sourceMappingURL=init-db.js.map