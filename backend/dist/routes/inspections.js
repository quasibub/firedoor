"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const database_1 = __importDefault(require("../config/database"));
const router = express_1.default.Router();
const createInspectionSchema = joi_1.default.object({
    location: joi_1.default.string().required(),
    totalDoors: joi_1.default.number().integer().min(1).required(),
    notes: joi_1.default.string().optional(),
});
const updateInspectionSchema = joi_1.default.object({
    status: joi_1.default.string().valid('pending', 'in-progress', 'completed').optional(),
    compliantDoors: joi_1.default.number().integer().min(0).optional(),
    nonCompliantDoors: joi_1.default.number().integer().min(0).optional(),
    criticalIssues: joi_1.default.number().integer().min(0).optional(),
    notes: joi_1.default.string().optional(),
});
router.get('/', async (req, res) => {
    try {
        const { status, location, page = 1, limit = 10 } = req.query;
        let query = `
      SELECT i.*, h.name as home_name 
      FROM inspections i
      LEFT JOIN homes h ON i.home_id = h.id
    `;
        const params = [];
        const conditions = [];
        if (status) {
            conditions.push('i.status = $' + (params.length + 1));
            params.push(status);
        }
        if (location) {
            conditions.push('i.location ILIKE $' + (params.length + 1));
            params.push(`%${location}%`);
        }
        if (req.query.home_id) {
            conditions.push('i.home_id = $' + (params.length + 1));
            params.push(req.query.home_id);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        const countQuery = query.replace('SELECT i.*, h.name as home_name', 'SELECT COUNT(*)');
        const { rows: countResult } = await database_1.default.query(countQuery, params);
        const totalCount = parseInt(countResult[0].count);
        query += ' ORDER BY i.created_at DESC';
        const offset = (Number(page) - 1) * Number(limit);
        query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(Number(limit), offset);
        const { rows: inspections } = await database_1.default.query(query, params);
        return res.json({
            success: true,
            data: inspections,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(totalCount / Number(limit)),
                totalItems: totalCount,
                itemsPerPage: Number(limit),
            },
        });
    }
    catch (error) {
        console.error('Get inspections error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { rows } = await database_1.default.query('SELECT * FROM inspections WHERE id = $1', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Inspection not found',
            });
        }
        return res.json({
            success: true,
            data: rows[0],
        });
    }
    catch (error) {
        console.error('Get inspection error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const { error, value } = createInspectionSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
        }
        const { rows: [newInspection] } = await database_1.default.query(`
      INSERT INTO inspections (location, inspector_name, date, status, total_doors, compliant_doors, non_compliant_doors, critical_issues, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
            value.location,
            'John Inspector',
            new Date().toISOString().split('T')[0],
            'pending',
            value.totalDoors,
            0,
            0,
            0,
            value.notes || ''
        ]);
        return res.status(201).json({
            success: true,
            data: newInspection,
        });
    }
    catch (error) {
        console.error('Create inspection error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { error, value } = updateInspectionSchema.validate(req.body);
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
        if (value.compliantDoors !== undefined) {
            updateFields.push(`compliant_doors = $${paramCount++}`);
            params.push(value.compliantDoors);
        }
        if (value.nonCompliantDoors !== undefined) {
            updateFields.push(`non_compliant_doors = $${paramCount++}`);
            params.push(value.nonCompliantDoors);
        }
        if (value.criticalIssues !== undefined) {
            updateFields.push(`critical_issues = $${paramCount++}`);
            params.push(value.criticalIssues);
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
      UPDATE inspections 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `, params);
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Inspection not found',
            });
        }
        return res.json({
            success: true,
            data: rows[0],
        });
    }
    catch (error) {
        console.error('Update inspection error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { rowCount } = await database_1.default.query('DELETE FROM inspections WHERE id = $1', [req.params.id]);
        if (rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Inspection not found',
            });
        }
        return res.json({
            success: true,
            message: 'Inspection deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete inspection error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=inspections.js.map