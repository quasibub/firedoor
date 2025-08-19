"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("../config/database"));
const joi_1 = __importDefault(require("joi"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = express_1.default.Router();
const createUserSchema = joi_1.default.object({
    name: joi_1.default.string().required().min(2).max(100),
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required().min(6),
    role: joi_1.default.string().valid('admin', 'inspector', 'workman').required(),
});
const updateUserSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(100),
    email: joi_1.default.string().email(),
    password: joi_1.default.string().min(6).optional(),
    role: joi_1.default.string().valid('admin', 'inspector', 'workman'),
});
router.get('/', async (req, res) => {
    try {
        const { rows } = await database_1.default.query('SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC');
        return res.json({
            success: true,
            data: rows
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await database_1.default.query('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        return res.json({
            success: true,
            data: rows[0]
        });
    }
    catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch user'
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const { error, value } = createUserSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: `Validation error: ${error.details[0].message}`
            });
        }
        const { name, email, password, role } = value;
        const existingUser = await database_1.default.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Email already exists'
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const { rows } = await database_1.default.query('INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at, updated_at', [name, email, hashedPassword, role]);
        return res.status(201).json({
            success: true,
            data: rows[0]
        });
    }
    catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create user'
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateUserSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: `Validation error: ${error.details[0].message}`
            });
        }
        const existingUser = await database_1.default.query('SELECT id FROM users WHERE id = $1', [id]);
        if (existingUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        if (value.email) {
            const emailCheck = await database_1.default.query('SELECT id FROM users WHERE email = $1 AND id != $2', [value.email, id]);
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Email already exists'
                });
            }
        }
        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;
        if (value.name) {
            updateFields.push(`name = $${paramCount}`);
            updateValues.push(value.name);
            paramCount++;
        }
        if (value.email) {
            updateFields.push(`email = $${paramCount}`);
            updateValues.push(value.email);
            paramCount++;
        }
        if (value.password) {
            const hashedPassword = await bcryptjs_1.default.hash(value.password, 10);
            updateFields.push(`password_hash = $${paramCount}`);
            updateValues.push(hashedPassword);
            paramCount++;
        }
        if (value.role) {
            updateFields.push(`role = $${paramCount}`);
            updateValues.push(value.role);
            paramCount++;
        }
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }
        updateValues.push(id);
        const { rows } = await database_1.default.query(`UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING id, name, email, role, created_at, updated_at`, updateValues);
        return res.json({
            success: true,
            data: rows[0]
        });
    }
    catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update user'
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const existingUser = await database_1.default.query('SELECT id FROM users WHERE id = $1', [id]);
        if (existingUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        await database_1.default.query('DELETE FROM users WHERE id = $1', [id]);
        return res.json({
            success: true,
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete user'
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map