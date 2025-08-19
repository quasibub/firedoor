"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
async function createTestTasks() {
    try {
        console.log('🔄 Creating test tasks...');
        const { rows: inspections } = await database_1.default.query('SELECT id FROM inspections LIMIT 1');
        let inspectionId;
        if (inspections.length === 0) {
            console.log('Creating test inspection...');
            const { rows: [inspection] } = await database_1.default.query(`
        INSERT INTO inspections (location, inspector_name, date, total_doors, compliant_doors, non_compliant_doors)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, ['Test Building', 'John Inspector', new Date(), 10, 7, 3]);
            inspectionId = inspection.id;
        }
        else {
            inspectionId = inspections[0].id;
        }
        const testTasks = [
            {
                door_id: '1A',
                location: 'Ground Floor - Main Entrance',
                title: '1A - Adjust door gaps to 2-4mm',
                description: 'Adjust and rehang the door/frame to ensure gaps are 2-4mm on the latch, top, and hinge sides',
                priority: 'high',
                category: 'Gap Adjustment',
                assigned_to: 'current_user'
            },
            {
                door_id: '2B',
                location: 'First Floor - Bedroom',
                title: '2B - Replace door closer',
                description: 'Replace the door closer with a certified fire-rated closer',
                priority: 'medium',
                category: 'Hardware Replacement',
                assigned_to: 'current_user'
            },
            {
                door_id: '3C',
                location: 'Second Floor - Office',
                title: '3C - Install intumescent strips',
                description: 'Install intumescent strips around the door frame to ensure proper fire sealing',
                priority: 'critical',
                category: 'Fire Sealing',
                assigned_to: 'current_user'
            },
            {
                door_id: '4D',
                location: 'Basement - Storage',
                title: '4D - Replace entire doorset',
                description: 'Replace with FD30s fire rated doorset (certified installer required)',
                priority: 'critical',
                category: 'Complete Replacement',
                assigned_to: 'current_user'
            }
        ];
        for (const task of testTasks) {
            const { rows: [newTask] } = await database_1.default.query(`
        INSERT INTO tasks (inspection_id, door_id, location, title, description, priority, category, assigned_to, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, title
      `, [
                inspectionId,
                task.door_id,
                task.location,
                task.title,
                task.description,
                task.priority,
                task.category,
                task.assigned_to,
                'pending'
            ]);
            console.log(`✅ Created task: ${newTask.title}`);
        }
        console.log('🎉 Test tasks created successfully');
        const { rows: taskCount } = await database_1.default.query('SELECT COUNT(*) as count FROM tasks');
        console.log(`Total tasks in database: ${taskCount[0].count}`);
    }
    catch (error) {
        console.error('❌ Failed to create test tasks:', error);
        throw error;
    }
    finally {
        await database_1.default.end();
    }
}
if (require.main === module) {
    createTestTasks()
        .then(() => {
        console.log('✅ Test tasks creation complete');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Test tasks creation failed:', error);
        process.exit(1);
    });
}
exports.default = createTestTasks;
//# sourceMappingURL=create-test-tasks.js.map