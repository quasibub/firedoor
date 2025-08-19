"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
async function clearDatabase() {
    try {
        console.log('🗑️  Clearing database...');
        console.log('📝 Clearing tasks...');
        await database_1.default.query('DELETE FROM tasks');
        console.log('📝 Clearing inspections...');
        await database_1.default.query('DELETE FROM inspections');
        console.log('📝 Clearing users...');
        await database_1.default.query('DELETE FROM users');
        console.log('✅ Database cleared successfully');
    }
    catch (error) {
        console.error('❌ Database clearing failed:', error);
        throw error;
    }
}
if (require.main === module) {
    clearDatabase()
        .then(() => {
        console.log('✅ Database clearing complete');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Database clearing failed:', error);
        process.exit(1);
    });
}
exports.default = clearDatabase;
//# sourceMappingURL=clear-db.js.map