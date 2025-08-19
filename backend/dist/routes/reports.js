"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const router = express_1.default.Router();
let mockReports = [
    {
        id: '1',
        inspectionId: '1',
        title: 'Main Building - Floor 1 Fire Door Inspection Report',
        type: 'inspection',
        status: 'completed',
        generatedBy: 'John Inspector',
        generatedAt: '2024-01-15T16:30:00Z',
        summary: {
            totalDoors: 12,
            compliantDoors: 10,
            nonCompliantDoors: 2,
            criticalIssues: 1,
            complianceRate: 83.3,
        },
        findings: [
            {
                doorId: 'FD-001',
                issue: 'Damaged door closer',
                severity: 'high',
                recommendation: 'Replace door closer immediately',
            },
            {
                doorId: 'FD-002',
                issue: 'Door frame misalignment',
                severity: 'medium',
                recommendation: 'Adjust door frame alignment',
            },
        ],
        recommendations: [
            'Replace damaged door closer on FD-001',
            'Fix door frame alignment on FD-002',
            'Schedule follow-up inspection in 30 days',
        ],
        fileUrl: '/reports/inspection-1.pdf',
    },
    {
        id: '2',
        inspectionId: '2',
        title: 'West Wing - Floor 2 Fire Door Inspection Report',
        type: 'inspection',
        status: 'draft',
        generatedBy: 'John Inspector',
        generatedAt: '2024-01-14T15:45:00Z',
        summary: {
            totalDoors: 8,
            compliantDoors: 3,
            nonCompliantDoors: 5,
            criticalIssues: 2,
            complianceRate: 37.5,
        },
        findings: [
            {
                doorId: 'FD-003',
                issue: 'Worn out fire door seals',
                severity: 'critical',
                recommendation: 'Replace fire door seals immediately',
            },
            {
                doorId: 'FD-004',
                issue: 'Missing door closer',
                severity: 'high',
                recommendation: 'Install door closer',
            },
        ],
        recommendations: [
            'Replace fire door seals on FD-003 (URGENT)',
            'Install missing door closer on FD-004',
            'Conduct comprehensive review of all fire doors',
        ],
        fileUrl: null,
    },
];
const generateReportSchema = joi_1.default.object({
    inspectionId: joi_1.default.string().required(),
    type: joi_1.default.string().valid('inspection', 'summary', 'compliance').required(),
    title: joi_1.default.string().optional(),
});
router.get('/', async (req, res) => {
    try {
        const { type, status, inspectionId, page = 1, limit = 10 } = req.query;
        let filteredReports = [...mockReports];
        if (type) {
            filteredReports = filteredReports.filter(report => report.type === type);
        }
        if (status) {
            filteredReports = filteredReports.filter(report => report.status === status);
        }
        if (inspectionId) {
            filteredReports = filteredReports.filter(report => report.inspectionId === inspectionId);
        }
        filteredReports.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
        const startIndex = (Number(page) - 1) * Number(limit);
        const endIndex = startIndex + Number(limit);
        const paginatedReports = filteredReports.slice(startIndex, endIndex);
        return res.json({
            success: true,
            data: paginatedReports,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(filteredReports.length / Number(limit)),
                totalItems: filteredReports.length,
                itemsPerPage: Number(limit),
            },
        });
    }
    catch (error) {
        console.error('Get reports error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const report = mockReports.find(r => r.id === req.params.id);
        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Report not found',
            });
        }
        return res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        console.error('Get report error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
});
router.post('/generate', async (req, res) => {
    try {
        const { error, value } = generateReportSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message,
            });
        }
        const newReport = {
            id: (mockReports.length + 1).toString(),
            ...value,
            title: value.title || `Report for Inspection ${value.inspectionId}`,
            status: 'completed',
            generatedBy: 'John Inspector',
            generatedAt: new Date().toISOString(),
            summary: {
                totalDoors: 10,
                compliantDoors: 8,
                nonCompliantDoors: 2,
                criticalIssues: 1,
                complianceRate: 80.0,
            },
            findings: [
                {
                    doorId: 'FD-001',
                    issue: 'Sample issue',
                    severity: 'medium',
                    recommendation: 'Sample recommendation',
                },
            ],
            recommendations: [
                'Sample recommendation 1',
                'Sample recommendation 2',
            ],
            fileUrl: `/reports/report-${Date.now()}.pdf`,
        };
        mockReports.push(newReport);
        return res.status(201).json({
            success: true,
            data: newReport,
        });
    }
    catch (error) {
        console.error('Generate report error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
});
router.get('/:id/download', async (req, res) => {
    try {
        const report = mockReports.find(r => r.id === req.params.id);
        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Report not found',
            });
        }
        if (!report.fileUrl) {
            return res.status(404).json({
                success: false,
                error: 'Report file not available',
            });
        }
        return res.json({
            success: true,
            downloadUrl: report.fileUrl,
            message: 'Download URL generated successfully',
        });
    }
    catch (error) {
        console.error('Download report error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const reportIndex = mockReports.findIndex(r => r.id === req.params.id);
        if (reportIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Report not found',
            });
        }
        mockReports.splice(reportIndex, 1);
        return res.json({
            success: true,
            message: 'Report deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete report error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=reports.js.map