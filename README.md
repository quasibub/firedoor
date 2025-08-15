# Fire Door Inspection & Remediation App

A comprehensive web application for streamlining fire door inspections and remediation tracking across care homes.

## 🏗️ Architecture

- **Frontend**: React with TypeScript, hosted on Azure Static Web Apps
- **Backend**: Node.js with Express, hosted on Azure App Service
- **Database**: Azure Database for PostgreSQL
- **File Storage**: Azure Blob Storage
- **Authentication**: Azure Active Directory B2C
- **Task Generation**: Azure Functions for automated PDF processing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL (for local development)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Set up environment variables (see `.env.example` files in frontend and backend)

4. Start development servers:
   ```bash
   npm run dev
   ```

This will start both frontend (port 3000) and backend (port 5000) servers concurrently.

## 📁 Project Structure

```
fire-door-inspection-app/
├── frontend/          # React TypeScript application
├── backend/           # Node.js Express API
├── docs/             # Documentation
└── README.md
```

## 🔧 Development

- **Frontend**: `npm run dev:frontend`
- **Backend**: `npm run dev:backend`
- **Both**: `npm run dev`

## 🏗️ Build

```bash
npm run build
```

## 📋 Features

- User authentication and role-based access control
- Dashboard for inspection status overview
- Photo uploads for fire door documentation
- Task tracking and remediation management
- **PDF Upload & Automatic Task Generation**: Upload fire door inspection PDFs and automatically extract data to create inspections and tasks
- Real-time progress monitoring

## 🔒 Security

- Azure AD B2C authentication
- Role-based access control
- Secure file storage with Azure Blob Storage
- Environment-based configuration

## 📊 Monitoring

- Azure Monitor integration
- Application Insights for performance tracking
- Usage analytics and reporting

## 💰 Cost Optimization

Designed for minimal costs with pay-as-you-go Azure pricing, suitable for low-frequency usage by small teams.

## 📄 PDF Upload Feature

The app now supports uploading fire door inspection PDF reports and automatically extracting data to create inspections and tasks.

### How to Use PDF Upload

1. Navigate to the Inspections page
2. Click the "Upload PDF" button
3. Drag and drop or select a PDF file
4. Review the extracted data and generated tasks
5. Confirm to create the inspection and tasks

### Supported PDF Content

The system automatically extracts:
- Location information
- Inspector details
- Inspection date
- Door counts (total, compliant, non-compliant, critical)
- Individual issues with severity levels
- Notes and comments

### Testing

Use the sample content in `sample-inspection-content.txt` to create a test PDF file. See `test-pdf-upload.md` for detailed testing instructions. 