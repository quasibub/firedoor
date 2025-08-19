"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("../config/database"));
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const tasksQuery = `
      SELECT 
        t.id,
        t.door_id,
        t.location,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        t.completed_at,
        t.notes,
        t.category,
        t.created_at,
        i.location as inspection_location,
        i.inspector_name,
        i.date as inspection_date
      FROM tasks t
      LEFT JOIN inspections i ON t.inspection_id = i.id
      ORDER BY t.created_at DESC
    `;
        const { rows: tasks } = await database_1.default.query(tasksQuery);
        const photosQuery = `
      SELECT 
        tp.id,
        tp.task_id,
        tp.photo_type,
        tp.description,
        tp.photo_url,
        tp.uploaded_at as created_at,
        u.name as uploaded_by_name
      FROM task_photos tp
      LEFT JOIN users u ON tp.uploaded_by = u.id
      ORDER BY tp.uploaded_at DESC
    `;
        const { rows: photos } = await database_1.default.query(photosQuery);
        const rejectionsQuery = `
      SELECT 
        tr.id,
        tr.task_id,
        tr.rejection_reason,
        tr.alternative_suggestion,
        tr.rejected_at as created_at,
        u.name as rejected_by_name
      FROM task_rejections tr
      LEFT JOIN users u ON tr.rejected_by = u.id
      ORDER BY tr.rejected_at DESC
    `;
        const { rows: rejections } = await database_1.default.query(rejectionsQuery);
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const pendingTasks = tasks.filter(t => t.status === 'pending').length;
        const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
        const rejectedTasks = tasks.filter(t => t.status === 'rejected').length;
        const cancelledTasks = tasks.filter(t => t.status === 'cancelled').length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const criticalTasks = tasks.filter(t => t.priority === 'critical');
        const highTasks = tasks.filter(t => t.priority === 'high');
        const mediumTasks = tasks.filter(t => t.priority === 'medium');
        const lowTasks = tasks.filter(t => t.priority === 'low');
        const categories = [...new Set(tasks.map(t => t.category))];
        const categoryStats = categories.map(category => {
            const categoryTasks = tasks.filter(t => t.category === category);
            const categoryCompleted = categoryTasks.filter(t => t.status === 'completed').length;
            return {
                category,
                total: categoryTasks.length,
                completed: categoryCompleted,
                completionRate: categoryTasks.length > 0 ? Math.round((categoryCompleted / categoryTasks.length) * 100) : 0
            };
        });
        const locations = [...new Set(tasks.map(t => t.location))];
        const locationStats = locations.map(location => {
            const locationTasks = tasks.filter(t => t.location === location);
            const locationCompleted = locationTasks.filter(t => t.status === 'completed').length;
            return {
                location,
                total: locationTasks.length,
                completed: locationCompleted,
                completionRate: locationTasks.length > 0 ? Math.round((locationCompleted / locationTasks.length) * 100) : 0
            };
        });
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentCompletions = tasks.filter(t => t.completed_at && new Date(t.completed_at) >= thirtyDaysAgo);
        const recentPhotos = photos.filter(p => new Date(p.created_at) >= thirtyDaysAgo);
        const recentRejections = rejections.filter(r => new Date(r.created_at) >= thirtyDaysAgo);
        const report = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalTasks,
                completedTasks,
                pendingTasks,
                inProgressTasks,
                rejectedTasks,
                cancelledTasks,
                completionRate
            },
            priorityBreakdown: {
                critical: {
                    total: criticalTasks.length,
                    completed: criticalTasks.filter(t => t.status === 'completed').length,
                    pending: criticalTasks.filter(t => t.status === 'pending').length,
                    inProgress: criticalTasks.filter(t => t.status === 'in-progress').length,
                    rejected: criticalTasks.filter(t => t.status === 'rejected').length
                },
                high: {
                    total: highTasks.length,
                    completed: highTasks.filter(t => t.status === 'completed').length,
                    pending: highTasks.filter(t => t.status === 'pending').length,
                    inProgress: highTasks.filter(t => t.status === 'in-progress').length,
                    rejected: highTasks.filter(t => t.status === 'rejected').length
                },
                medium: {
                    total: mediumTasks.length,
                    completed: mediumTasks.filter(t => t.status === 'completed').length,
                    pending: mediumTasks.filter(t => t.status === 'pending').length,
                    inProgress: mediumTasks.filter(t => t.status === 'in-progress').length,
                    rejected: mediumTasks.filter(t => t.status === 'rejected').length
                },
                low: {
                    total: lowTasks.length,
                    completed: lowTasks.filter(t => t.status === 'completed').length,
                    pending: lowTasks.filter(t => t.status === 'pending').length,
                    inProgress: lowTasks.filter(t => t.status === 'in-progress').length,
                    rejected: lowTasks.filter(t => t.status === 'rejected').length
                }
            },
            categoryStats,
            locationStats,
            recentActivity: {
                completions: recentCompletions.length,
                photos: recentPhotos.length,
                rejections: recentRejections.length
            },
            tasks: tasks.map(task => {
                const taskPhotos = photos.filter(p => p.task_id === task.id);
                const taskRejections = rejections.filter(r => r.task_id === task.id);
                return {
                    ...task,
                    photos: taskPhotos,
                    rejections: taskRejections
                };
            })
        };
        return res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        console.error('Error generating remediation report:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate remediation report'
        });
    }
});
router.get('/date-range', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required'
            });
        }
        const tasksQuery = `
      SELECT 
        t.id,
        t.door_id,
        t.location,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        t.completed_at,
        t.notes,
        t.category,
        t.created_at,
        i.location as inspection_location,
        i.inspector_name,
        i.date as inspection_date
      FROM tasks t
      LEFT JOIN inspections i ON t.inspection_id = i.id
      WHERE t.created_at >= $1 AND t.created_at <= $2
      ORDER BY t.created_at DESC
    `;
        const { rows: tasks } = await database_1.default.query(tasksQuery, [startDate, endDate]);
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const report = {
            startDate,
            endDate,
            generatedAt: new Date().toISOString(),
            summary: {
                totalTasks,
                completedTasks,
                completionRate
            },
            tasks
        };
        return res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        console.error('Error generating date range report:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate date range report'
        });
    }
});
exports.default = router;
//# sourceMappingURL=remediation-reports.js.map