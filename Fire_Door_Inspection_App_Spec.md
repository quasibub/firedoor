
# Fire Door Inspection & Remediation App - Technical Specification

## 1. Overview

This app is designed to streamline fire door inspections and remediation tracking across care homes. It allows users to upload inspection reports, extract actionable tasks, and monitor progress until completion.

## 2. Front-End

The front-end will be built using **React** and hosted on **Azure Static Web Apps** for scalable and secure delivery. It will include:

- User authentication  
- A dashboard to display inspection status  
- Photo uploads  
- Task tracking  

## 3. Back-End

The back-end will use **Node.js with Express**, hosted on **Azure App Service**. It will:

- Handle business logic  
- Manage APIs for data exchange between front-end and database  
- Interface with Azure Blob Storage and Azure Functions  

## 4. Database

**Azure Database for PostgreSQL** will be used to store:

- Inspection data  
- Remediation tasks  
- User accounts  
- Metadata about uploaded reports and images  

## 5. File Storage

**Azure Blob Storage** will securely store uploaded PDFs and images associated with each inspection and remediation task.

## 6. Authentication

User authentication and role-based access control will be managed via **Azure Active Directory B2C**.

## 7. Automated Task Generation

An **Azure Function** will trigger on PDF upload to:

- Extract relevant inspection data using OCR/text parsing  
- Auto-generate a list of remediation tasks linked to specific fire doors  
- Write these tasks to the database  

## 8. Monitoring and Analytics

**Azure Monitor** and **Application Insights** will track application performance and provide usage analytics.

## 9. Cost Efficiency

The architecture is designed to keep costs minimal, suitable for low-frequency usage by a small number of users. **Pay-as-you-go Azure pricing** ensures affordability and scalability.
