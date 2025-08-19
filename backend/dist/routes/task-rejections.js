"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const database_1 = __importDefault(require("../config/database"));
const router = express_1.default.Router();
const rejectTaskSchema = joi_1.default.object({
    rejection_reason: joi_1.default.string().required().min(10).max(1000),
    alternative_suggestion: joi_1.default.string().optional().allow('').max(1000)
});
router.post('/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        console.log('Reject task request:', { taskId, body: req.body });
        const { error, value } = rejectTaskSchema.validate(req.body);
        if (error) {
            console.log('Validation error:', error.details[0].message);
            return res.status(400).json({ error: error.details[0].message });
        }
        let rejectedBy = req.user?.id;
        if (!rejectedBy) {
            const { rows: users } = await database_1.default.query('SELECT id FROM users LIMIT 1');
            if (users.length > 0) {
                rejectedBy = users[0].id;
            }
            else {
                return res.status(400).json({ error: 'No users available in the system' });
            }
        }
        const { rows: [task] } = await database_1.default.query(`
      SELECT id, status FROM tasks WHERE id = $1
    `, [taskId]);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        if (task.status === 'completed') {
            return res.status(400).json({ error: 'Cannot reject a completed task' });
        }
        if (task.status === 'rejected') {
            return res.status(400).json({ error: 'Task is already rejected' });
        }
        await database_1.default.query('BEGIN');
        try {
            const { rows: [rejection] } = await database_1.default.query(`
        INSERT INTO task_rejections (task_id, rejected_by, rejection_reason, alternative_suggestion)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [taskId, rejectedBy, value.rejection_reason, value.alternative_suggestion]);
            await database_1.default.query(`
        UPDATE tasks SET status = 'rejected' WHERE id = $1
      `, [taskId]);
            await database_1.default.query('COMMIT');
            return res.status(201).json({
                message: 'Task rejected successfully',
                rejection
            });
        }
        catch (error) {
            await database_1.default.query('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        console.error('Reject task error:', error);
        return res.status(500).json({ error: 'Failed to reject task' });
    }
});
router.get('/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const { rows: [rejection] } = await database_1.default.query(`
      SELECT tr.*, u.name as rejected_by_name
      FROM task_rejections tr
      LEFT JOIN users u ON tr.rejected_by = u.id
      WHERE tr.task_id = $1
      ORDER BY tr.rejected_at DESC
      LIMIT 1
    `, [taskId]);
        if (!rejection) {
            return res.status(404).json({ error: 'No rejection found for this task' });
        }
        return res.json({ rejection });
    }
    catch (error) {
        console.error('Get rejection error:', error);
        return res.status(500).json({ error: 'Failed to get rejection' });
    }
});
router.put('/:taskId/resolve', async (req, res) => {
    try {
        const { taskId } = req.params;
        const { new_status = 'pending' } = req.body;
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can resolve rejections' });
        }
        const { rows: [task] } = await database_1.default.query(`
      SELECT id, status FROM tasks WHERE id = $1
    `, [taskId]);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        if (task.status !== 'rejected') {
            return res.status(400).json({ error: 'Task is not rejected' });
        }
        await database_1.default.query(`
      UPDATE tasks SET status = $1 WHERE id = $2
    `, [new_status, taskId]);
        return res.json({
            message: 'Rejection resolved successfully',
            task_id: taskId,
            new_status
        });
    }
    catch (error) {
        console.error('Resolve rejection error:', error);
        return res.status(500).json({ error: 'Failed to resolve rejection' });
    }
});
exports.default = router;
//# sourceMappingURL=task-rejections.js.map