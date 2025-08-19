"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../config/database"));
const blobStorage_1 = __importDefault(require("../services/blobStorage"));
const pdfParse = require('pdf-parse');
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});
const extractFireDoorTasks = (pdfText) => {
    const inspection = {
        location: '',
        date: '',
        inspector: '',
        totalDoors: 0,
        compliantDoors: 0,
        nonCompliantDoors: 0
    };
    const clientMatch = pdfText.match(/Client \/ Site\s*\n\s*([^\n]+)/i);
    if (clientMatch)
        inspection.location = clientMatch[1].trim();
    const dateMatch = pdfText.match(/Conducted on\s*\n\s*(\d{1,2}\s+\w+\s+\d{4})/i);
    if (dateMatch)
        inspection.date = dateMatch[1];
    const inspectorMatch = pdfText.match(/Fire Door Inspector\s*\n\s*([^\n]+)/i);
    if (inspectorMatch)
        inspection.inspector = inspectorMatch[1].trim();
    const tasks = extractDoorTasks(pdfText);
    const uniqueDoors = new Set(tasks.map(t => t.doorId));
    inspection.nonCompliantDoors = uniqueDoors.size;
    inspection.totalDoors = uniqueDoors.size;
    return { inspection, tasks };
};
const extractDoorTasks = (pdfText) => {
    const tasks = [];
    const remedialActionMappings = [
        {
            pattern: /Adjust and rehang the door\/frame to ensure gaps are 2-4mm\s*on the latch, top, and hinge sides\s*Yes/i,
            title: 'Adjust door gaps to 2-4mm',
            description: 'Adjust and rehang the door/frame to ensure gaps are 2-4mm on the latch, top, and hinge sides',
            category: 'Gap Adjustment',
            priority: 'medium'
        },
        {
            pattern: /Bottom gap - Install a hardwood strip to the bottom of the\s*door \(FD30 only\)\s*Yes/i,
            title: 'Install hardwood strip to bottom',
            description: 'Install a hardwood strip to the bottom of the door (FD30 only)',
            category: 'Gap Adjustment',
            priority: 'medium'
        },
        {
            pattern: /Confirmation\/evidence required to confirm the\s*material\/product used to repair doorset\s*Yes/i,
            title: 'Provide repair documentation',
            description: 'Confirmation/evidence required to confirm the material/product used to repair doorset',
            category: 'Documentation',
            priority: 'low'
        },
        {
            pattern: /Door leaf - Repair damage to door leaf using approved repair\s*techniques?\s*Yes/i,
            title: 'Repair door leaf damage',
            description: 'Repair damage to door leaf using approved repair techniques',
            category: 'Structural Repairs',
            priority: 'medium'
        },
        {
            pattern: /Door lipping to be replaced and ensure it is securely fixed\s*Yes/i,
            title: 'Replace door lipping',
            description: 'Replace door lipping and ensure it is securely fixed',
            category: 'Structural Repairs',
            priority: 'medium'
        },
        {
            pattern: /Door stops to be replaced or repaired\s*Yes/i,
            title: 'Replace/repair door stops',
            description: 'Replace or repair door stops',
            category: 'Structural Repairs',
            priority: 'medium'
        },
        {
            pattern: /Frame - \/architrave to be repaired using approved repair\s*technique\s*Yes/i,
            title: 'Repair frame/architrave',
            description: 'Repair frame/architrave using approved repair technique',
            category: 'Structural Repairs',
            priority: 'medium'
        },
        {
            pattern: /Frame - to be repaired or replace doorset to achieve certified\s*doorset\s*Yes/i,
            title: 'Repair/replace frame for certification',
            description: 'Repair or replace doorset to achieve certified doorset',
            category: 'Structural Repairs',
            priority: 'high'
        },
        {
            pattern: /Handle - Requires tightening\s*Yes/i,
            title: 'Tighten handle',
            description: 'Handle requires tightening',
            category: 'Hardware Issues',
            priority: 'high'
        },
        {
            pattern: /Handle - To be replaced\s*Yes/i,
            title: 'Replace handle',
            description: 'Handle needs to be replaced',
            category: 'Hardware Issues',
            priority: 'high'
        },
        {
            pattern: /Hinges - Replace all hinges with certified hinges\s*Yes/i,
            title: 'Replace all hinges',
            description: 'Replace all hinges with certified hinges',
            category: 'Hardware Issues',
            priority: 'medium'
        },
        {
            pattern: /Hinges - Require intumescent pads installed\s*Yes/i,
            title: 'Install intumescent pads on hinges',
            description: 'Install intumescent pads on hinges',
            category: 'Hardware Issues',
            priority: 'medium'
        },
        {
            pattern: /Latch\/lock to be replaced for certified latch\/lock\s*Yes/i,
            title: 'Replace latch/lock',
            description: 'Replace with certified latch/lock',
            category: 'Hardware Issues',
            priority: 'medium'
        },
        {
            pattern: /Seals - Replace all seals\s*Yes/i,
            title: 'Replace all seals',
            description: 'Replace all door seals',
            category: 'Seal Replacement',
            priority: 'high'
        },
        {
            pattern: /Seals - Install drop down seal\s*Yes/i,
            title: 'Install drop down seal',
            description: 'Install drop down seal',
            category: 'Seal Replacement',
            priority: 'medium'
        },
        {
            pattern: /Seals - Install smoke seals\s*Yes/i,
            title: 'Install smoke seals',
            description: 'Install smoke seals',
            category: 'Seal Replacement',
            priority: 'high'
        },
        {
            pattern: /Seals - Install intumescent seals\s*Yes/i,
            title: 'Install intumescent seals',
            description: 'Install intumescent seals',
            category: 'Seal Replacement',
            priority: 'high'
        },
        {
            pattern: /Seals - Install threshold seal\s*Yes/i,
            title: 'Install threshold seal',
            description: 'Install threshold seal',
            category: 'Seal Replacement',
            priority: 'medium'
        },
        {
            pattern: /Seals - Replace threshold seal\s*Yes/i,
            title: 'Replace threshold seal',
            description: 'Replace threshold seal',
            category: 'Seal Replacement',
            priority: 'medium'
        },
        {
            pattern: /Seal architrave to wall\s*Yes/i,
            title: 'Seal architrave to wall',
            description: 'Seal gap between architrave and wall',
            category: 'Structural Repairs',
            priority: 'medium'
        },
        {
            pattern: /Door closer - Requires adjusting or repairing\s*Yes/i,
            title: 'Adjust/repair door closer',
            description: 'Door closer requires adjusting or repairing',
            category: 'Hardware Issues',
            priority: 'medium'
        },
        {
            pattern: /Doorset to be replaced with ['"]FD30s['"] fire rated doorset.*?\s*Yes/i,
            title: 'Replace entire doorset',
            description: 'Replace with FD30s fire rated doorset (certified installer required)',
            category: 'Complete Replacement',
            priority: 'critical'
        }
    ];
    const doorSections = pdfText.split(/Door identification number/i);
    doorSections.forEach((section, index) => {
        if (index === 0)
            return;
        let doorId = '';
        let fullLocation = '';
        const locationMatch = section.match(/Location of door.*?\n([^\n]+)\n([^\n]+)/i) ||
            section.match(/Location of door.*?\nBedroom\s*\n([^\n]+)/i) ||
            section.match(/Location of door.*?\n([^\n]+)/i);
        if (locationMatch) {
            if (locationMatch[2]) {
                fullLocation = `${locationMatch[1].trim()} ${locationMatch[2].trim()}`;
                doorId = locationMatch[2].trim();
            }
            else {
                fullLocation = locationMatch[1].trim();
                const idMatch = fullLocation.match(/(\d+[A-Z]?)$/);
                doorId = idMatch ? idMatch[1] : fullLocation;
            }
        }
        if (!doorId) {
            const numberMatch = section.match(/^[\s]*(\d+)/);
            if (numberMatch) {
                doorId = numberMatch[1];
            }
        }
        if (!doorId)
            doorId = `Door-${index}`;
        if (!fullLocation)
            fullLocation = doorId;
        const remedialMatch = section.match(/Remedial Action([\s\S]*?)(?:Compliance Rating|$)/i);
        if (remedialMatch) {
            const remedialSection = remedialMatch[1];
            remedialActionMappings.forEach(action => {
                if (remedialSection.match(action.pattern)) {
                    tasks.push({
                        doorId: doorId,
                        location: fullLocation,
                        title: `${doorId} - ${action.title}`,
                        description: action.description,
                        category: action.category,
                        priority: action.priority,
                        status: 'pending'
                    });
                }
            });
        }
    });
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    tasks.sort((a, b) => {
        const prioDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (prioDiff !== 0)
            return prioDiff;
        return naturalSort(a.doorId, b.doorId);
    });
    return tasks;
};
const naturalSort = (a, b) => {
    const regex = /(\d+)([A-Z]?)/;
    const aMatch = a.match(regex);
    const bMatch = b.match(regex);
    if (aMatch && bMatch) {
        const aNum = parseInt(aMatch[1]);
        const bNum = parseInt(bMatch[1]);
        if (aNum !== bNum)
            return aNum - bNum;
        const aLetter = aMatch[2] || '';
        const bLetter = bMatch[2] || '';
        return aLetter.localeCompare(bLetter);
    }
    return a.localeCompare(b);
};
const debugExtraction = (pdfText) => {
    console.log('=== PDF EXTRACTION DEBUG ===');
    const doorStart = pdfText.indexOf('Door identification number');
    if (doorStart > -1) {
        const sampleSection = pdfText.substring(doorStart, doorStart + 2000);
        console.log('Sample door section:');
        console.log(sampleSection);
        const locationMatch = sampleSection.match(/Location of door.*?\n([^\n]+)\n([^\n]+)/i);
        console.log('Location match:', locationMatch);
        const remedialStart = sampleSection.indexOf('Remedial Action');
        if (remedialStart > -1) {
            console.log('Remedial section found at position:', remedialStart);
            const remedialSample = sampleSection.substring(remedialStart, remedialStart + 500);
            console.log('Remedial sample:', remedialSample);
        }
    }
    return true;
};
function convertTasksToDatabaseFormat(tasks, inspectionId, homeId) {
    return tasks.map(task => ({
        id: (0, uuid_1.v4)(),
        inspection_id: inspectionId,
        door_id: task.doorId,
        location: task.location,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        category: task.category,
        assigned_to: null,
        completed_at: null,
        notes: '',
        issues: task.description,
        home_id: homeId
    }));
}
router.post('/', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }
        await blobStorage_1.default.ensureContainerExists();
        const uploadResult = await blobStorage_1.default.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, 'pdfs');
        if (!uploadResult.success) {
            return res.status(500).json({ error: 'Failed to upload PDF to storage', details: uploadResult.error });
        }
        const pdfData = await pdfParse(req.file.buffer);
        if (process.env.DEBUG_PDF) {
            debugExtraction(pdfData.text);
        }
        const { inspection, tasks } = extractFireDoorTasks(pdfData.text);
        console.log(`Extracted ${tasks.length} tasks from PDF`);
        let homeId = req.query.home_id;
        if (!homeId) {
            const { rows: homes } = await database_1.default.query('SELECT id FROM homes LIMIT 1');
            if (homes.length > 0) {
                homeId = homes[0].id;
            }
            else {
                return res.status(400).json({ error: 'No homes available in the system' });
            }
        }
        const inspectionId = (0, uuid_1.v4)();
        const { rows: [savedInspection] } = await database_1.default.query(`
      INSERT INTO inspections (id, location, inspector_name, date, status, total_doors, compliant_doors, non_compliant_doors, critical_issues, notes, home_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
            inspectionId,
            inspection.location || 'Unknown Location',
            inspection.inspector || 'Unknown Inspector',
            inspection.date || new Date().toISOString().split('T')[0],
            'completed',
            inspection.totalDoors || 0,
            inspection.compliantDoors || 0,
            inspection.nonCompliantDoors || 0,
            tasks.filter(t => t.priority === 'critical').length,
            `Extracted ${tasks.length} remedial tasks from PDF`,
            homeId
        ]);
        const dbTasks = convertTasksToDatabaseFormat(tasks, inspectionId, homeId);
        const savedTasks = [];
        for (const task of dbTasks) {
            const { rows: [savedTask] } = await database_1.default.query(`
        INSERT INTO tasks (id, inspection_id, door_id, location, title, description, status, priority, category, assigned_to, completed_at, notes, issues, home_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
                task.id,
                task.inspection_id,
                task.door_id,
                task.location,
                task.title,
                task.description,
                task.status,
                task.priority,
                task.category,
                task.assigned_to,
                task.completed_at,
                task.notes,
                task.issues,
                task.home_id
            ]);
            savedTasks.push(savedTask);
        }
        return res.status(200).json({
            message: 'PDF processed successfully',
            pdfUrl: uploadResult.url,
            blobName: uploadResult.blobName,
            inspection: savedInspection,
            tasks: savedTasks,
            summary: {
                totalDoors: inspection.totalDoors,
                compliantDoors: inspection.compliantDoors,
                nonCompliantDoors: inspection.nonCompliantDoors,
                totalTasks: savedTasks.length,
                criticalTasks: savedTasks.filter(t => t.priority === 'critical').length,
                highPriorityTasks: savedTasks.filter(t => t.priority === 'high').length,
                mediumPriorityTasks: savedTasks.filter(t => t.priority === 'medium').length,
                lowPriorityTasks: savedTasks.filter(t => t.priority === 'low').length,
                byCategory: tasks.reduce((acc, t) => {
                    acc[t.category] = (acc[t.category] || 0) + 1;
                    return acc;
                }, {})
            },
            extractedText: pdfData.text.substring(0, 500) + '...',
            totalPages: pdfData.numpages,
        });
    }
    catch (error) {
        console.error('PDF processing error:', error);
        return res.status(500).json({
            error: 'Failed to process PDF',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/health', (req, res) => {
    return res.status(200).json({
        status: 'OK',
        message: 'PDF upload service is running',
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=pdf-upload.js.map