"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const database_1 = __importDefault(require("../config/database"));
const router = express_1.default.Router();
const createTaskSchema = joi_1.default.object({
    inspection_id: joi_1.default.string().required(),
    door_id: joi_1.default.string().required(),
    location: joi_1.default.string().required(),
    description: joi_1.default.string().required(),
    priority: joi_1.default.string().valid('low', 'medium', 'high', 'critical').required(),
    assigned_to: joi_1.default.string().required(),
    notes: joi_1.default.string().optional(),
});
const updateTaskSchema = joi_1.default.object({
    status: joi_1.default.string().valid('pending', 'in-progress', 'completed', 'cancelled').optional(),
    assigned_to: joi_1.default.string().optional(),
    completed_at: joi_1.default.date().iso().optional(),
    notes: joi_1.default.string().optional(),
});
router.get('/', async (req, res) => {
    try {
        const { status, priority, inspectionId, home_id, page = 1, limit = 10 } = req.query;
        let query = `
      SELECT t.*, h.name as home_name 
      FROM tasks t
      LEFT JOIN homes h ON t.home_id = h.id
    `;
        const params = [];
        const conditions = [];
        if (status) {
            conditions.push('t.status = $' + (params.length + 1));
            params.push(status);
        }
        if (priority) {
            conditions.push('t.priority = $' + (params.length + 1));
            params.push(priority);
        }
        if (inspectionId) {
            conditions.push('t.inspection_id = $' + (params.length + 1));
            params.push(inspectionId);
        }
        if (home_id) {
            conditions.push('t.home_id = $' + (params.length + 1));
            params.push(home_id);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        const countQuery = query.replace('SELECT t.*, h.name as home_name', 'SELECT COUNT(*)');
        const { rows: countResult } = await database_1.default.query(countQuery, params);
        const totalCount = parseInt(countResult[0].count);
        query += ' ORDER BY CASE t.priority WHEN \'critical\' THEN 0 WHEN \'high\' THEN 1 WHEN \'medium\' THEN 2 WHEN \'low\' THEN 3 END, t.created_at DESC';
        const offset = (Number(page) - 1) * Number(limit);
        query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(Number(limit), offset);
        const { rows: tasks } = await database_1.default.query(query, params);
        return res.json({
            success: true,
            data: tasks,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(totalCount / Number(limit)),
                totalItems: totalCount,
                itemsPerPage: Number(limit),
            },
        });
    }
    catch (error) {
        console.error('Get tasks error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { rows } = await database_1.default.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Task not found',
            });
        }
        return res.json({
            success: true,
            data: rows[0],
        });
    }
    catch (error) {
        console.error('Get task error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const { error, value } = createTaskSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
        }
        const { rows: [newTask] } = await database_1.default.query(`
      INSERT INTO tasks (inspection_id, door_id, location, title, description, status, priority, category, assigned_to, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
            value.inspection_id,
            value.door_id,
            value.location,
            value.description,
            value.description,
            'pending',
            value.priority,
            'General',
            value.assigned_to,
            value.notes || ''
        ]);
        return res.status(201).json({
            success: true,
            data: newTask,
        });
    }
    catch (error) {
        console.error('Create task error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { error, value } = updateTaskSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
        }
        const updateFields = [];
        const params = [];
        let paramCount = 1;
        if (value.status !== undefined) {
            updateFields.push(`status = $${paramCount++}`);
            params.push(value.status);
        }
        if (value.assigned_to !== undefined) {
            updateFields.push(`assigned_to = $${paramCount++}`);
            params.push(value.assigned_to);
        }
        if (value.completed_at !== undefined) {
            updateFields.push(`completed_at = $${paramCount++}`);
            params.push(value.completed_at);
        }
        if (value.notes !== undefined) {
            updateFields.push(`notes = $${paramCount++}`);
            params.push(value.notes);
        }
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update',
            });
        }
        params.push(req.params.id);
        const { rows } = await database_1.default.query(`
      UPDATE tasks 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `, params);
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Task not found',
            });
        }
        return res.json({
            success: true,
            data: rows[0],
        });
    }
    catch (error) {
        console.error('Update task error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { rowCount } = await database_1.default.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
        if (rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Task not found',
            });
        }
        return res.json({
            success: true,
            message: 'Task deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete task error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=tasks.js.map