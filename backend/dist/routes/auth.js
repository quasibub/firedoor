"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const joi_1 = __importDefault(require("joi"));
const database_1 = __importDefault(require("../config/database"));
const router = express_1.default.Router();
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
});
router.post('/login', async (req, res) => {
    console.error('DEBUG: Login route hit - testing deployment');
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
        }
        const { email, password } = value;
        console.error('DEBUG: Looking for user with email: ' + email);
        const { rows } = await database_1.default.query('SELECT id, email, password_hash, name, role FROM users WHERE email = $1', [email]);
        console.error('DEBUG: Query returned ' + rows.length + ' rows');
        if (rows.length > 0) {
            console.error('DEBUG: User found - email: ' + rows[0].email + ', role: ' + rows[0].role);
        }
        if (rows.length === 0) {
            console.error('DEBUG: No user found with email: ' + email);
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
            });
        }
        const user = rows[0];
        console.error('DEBUG: Comparing password for user: ' + user.email);
        const isMatch = await bcryptjs_1.default.compare(password, user.password_hash);
        console.error('DEBUG: Password match result: ' + isMatch);
        if (!isMatch) {
            console.error('DEBUG: Password mismatch for user: ' + user.email);
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
            });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
});
router.get('/me', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No token, authorization denied',
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const { rows } = await database_1.default.query('SELECT id, email, name, role FROM users WHERE id = $1', [decoded.userId]);
        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Token is not valid',
            });
        }
        const user = rows[0];
        return res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({
            success: false,
            error: 'Token is not valid',
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map