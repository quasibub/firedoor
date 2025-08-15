# PDF Upload Test Guide

## Overview
The Fire Door Inspection App now supports uploading PDF inspection reports and automatically extracting data to create inspections and tasks.

## How to Test

### 1. Start the Backend Server
```bash
cd backend
npm run dev
```

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```

### 3. Test PDF Upload
1. Navigate to the Inspections page
2. Click the "Upload PDF" button
3. Select a PDF file containing fire door inspection data
4. Review the extracted data
5. Confirm to create the inspection and tasks

## Expected PDF Content Format

The system looks for the following patterns in PDF text:

### Location Information
- "Location: [location name]"
- "Site: [site name]"
- "Building: [building name]"
- "Floor: [floor number]"
- "Wing: [wing name]"

### Inspector Information
- "Inspector: [inspector name]"
- "Inspected by: [inspector name]"
- "By: [inspector name]"

### Date Information
- "Date: [date]"
- "Inspected on: [date]"
- "On: [date]"

### Door Counts
- "Total doors: [number]"
- "Doors inspected: [number]"
- "Compliant: [number]"
- "Passing: [number]"
- "Non-compliant: [number]"
- "Failing: [number]"
- "Critical: [number]"
- "Urgent: [number]"

### Issues
- "Door [ID]: [issue description]"
- "Fire door [ID]: [issue description]"
- "Issue: [issue description]"
- "Problem: [issue description]"
- "Defect: [issue description]"

### Notes
- "Notes: [notes]"
- "Comments: [comments]"
- "Summary: [summary]"
- "Conclusion: [conclusion]"

## Sample PDF Content

Here's an example of what the PDF content might look like:

```
FIRE DOOR INSPECTION REPORT

Location: Main Building - Floor 1
Inspector: John Smith
Date: 15/01/2024

Total doors inspected: 12
Compliant doors: 10
Non-compliant doors: 2
Critical issues: 1

ISSUES FOUND:

Door FD-001: Hinge loose, requires immediate repair
Fire door FD-002: Gap exceeds 4mm, needs adjustment
Door FD-003: Missing door closer, critical safety issue

Notes: Overall condition is good, but immediate attention needed for critical issues.
```

## Features

### Automatic Data Extraction
- Extracts location, inspector, date, and door counts
- Identifies issues and assigns severity levels
- Generates tasks automatically from found issues

### Task Generation
- Creates tasks for each identified issue
- Assigns priority based on keywords (critical, urgent, high, medium, low)
- Links tasks to specific door IDs when available

### User Interface
- Drag-and-drop PDF upload
- Preview of extracted data before confirmation
- Visual indicators for task priorities
- Success/error feedback

## API Endpoints

### POST /api/pdf-upload
Uploads and processes a PDF file.

**Request:**
- Content-Type: multipart/form-data
- Body: PDF file with field name 'pdf'

**Response:**
```json
{
  "message": "PDF processed successfully",
  "inspection": {
    "id": "uuid",
    "location": "extracted location",
    "inspectorName": "extracted inspector",
    "date": "extracted date",
    "status": "completed",
    "totalDoors": 12,
    "compliantDoors": 10,
    "nonCompliantDoors": 2,
    "criticalIssues": 1,
    "notes": "extracted notes"
  },
  "tasks": [
    {
      "id": "uuid",
      "inspectionId": "inspection-uuid",
      "title": "task title",
      "description": "task description",
      "status": "pending",
      "priority": "critical",
      "doorId": "FD-001"
    }
  ],
  "extractedText": "first 500 characters of extracted text...",
  "totalPages": 3
}
```

## Error Handling

The system handles various error scenarios:
- Invalid file types (non-PDF)
- File size limits (10MB max)
- PDF parsing errors
- Missing or corrupted files
- Network errors

## Security Features

- File type validation
- File size limits
- Automatic file cleanup after processing
- Input sanitization
- Error message sanitization 