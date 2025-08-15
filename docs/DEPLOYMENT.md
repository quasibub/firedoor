# Deployment Guide - Fire Door Inspection App

This guide covers deploying the Fire Door Inspection App to Azure cloud services.

## Prerequisites

- Azure subscription
- Azure CLI installed and configured
- Node.js 18+ installed
- Git repository access

## Azure Resources Setup

### 1. Azure Database for PostgreSQL

```bash
# Create resource group
az group create --name fire-door-app-rg --location eastus

# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group fire-door-app-rg \
  --name fire-door-db \
  --location eastus \
  --admin-user postgres \
  --admin-password <your-password> \
  --sku-name Standard_B1ms \
  --version 14

# Create database
az postgres flexible-server db create \
  --resource-group fire-door-app-rg \
  --server-name fire-door-db \
  --database-name fire_door_inspection
```

### 2. Azure Blob Storage

```bash
# Create storage account
az storage account create \
  --resource-group fire-door-app-rg \
  --name firedoorstorage \
  --location eastus \
  --sku Standard_LRS

# Create container
az storage container create \
  --account-name firedoorstorage \
  --name fire-door-documents
```

### 3. Azure App Service (Backend)

```bash
# Create App Service plan
az appservice plan create \
  --resource-group fire-door-app-rg \
  --name fire-door-backend-plan \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --resource-group fire-door-app-rg \
  --plan fire-door-backend-plan \
  --name fire-door-backend \
  --runtime "NODE|18-lts"

# Configure environment variables
az webapp config appsettings set \
  --resource-group fire-door-app-rg \
  --name fire-door-backend \
  --settings \
    NODE_ENV=production \
    DATABASE_URL="postgresql://postgres:<password>@fire-door-db.postgres.database.azure.com:5432/fire_door_inspection" \
    JWT_SECRET="<your-jwt-secret>" \
    AZURE_STORAGE_CONNECTION_STRING="<storage-connection-string>"
```

### 4. Azure Static Web Apps (Frontend)

```bash
# Create Static Web App
az staticwebapp create \
  --resource-group fire-door-app-rg \
  --name fire-door-frontend \
  --location eastus \
  --source https://github.com/your-username/fire-door-inspection-app \
  --branch main \
  --app-location frontend \
  --api-location backend \
  --output-location build
```

### 5. Azure Active Directory B2C

1. Go to Azure Portal
2. Create new Azure AD B2C tenant
3. Register application
4. Configure user flows
5. Update environment variables with B2C details

## Environment Configuration

### Backend Environment Variables

```bash
# Set in Azure App Service Configuration
NODE_ENV=production
DATABASE_URL=postgresql://postgres:<password>@fire-door-db.postgres.database.azure.com:5432/fire_door_inspection
JWT_SECRET=<your-jwt-secret>
AZURE_STORAGE_CONNECTION_STRING=<storage-connection-string>
AZURE_AD_B2C_TENANT=<your-tenant>
AZURE_AD_B2C_CLIENT_ID=<your-client-id>
AZURE_AD_B2C_CLIENT_SECRET=<your-client-secret>
FRONTEND_URL=https://fire-door-frontend.azurestaticapps.net
```

### Frontend Environment Variables

```bash
# Set in Static Web App Configuration
REACT_APP_API_URL=https://fire-door-backend.azurewebsites.net/api
REACT_APP_AUTH_DOMAIN=<your-b2c-domain>
REACT_APP_CLIENT_ID=<your-b2c-client-id>
REACT_APP_REDIRECT_URI=https://fire-door-frontend.azurestaticapps.net
```

## Database Migration

```bash
# Connect to database and run migrations
psql "postgresql://postgres:<password>@fire-door-db.postgres.database.azure.com:5432/fire_door_inspection"

# Run SQL scripts for table creation
\i scripts/create_tables.sql
```

## Deployment Process

### 1. Build and Deploy Backend

```bash
# Build backend
cd backend
npm run build

# Deploy to Azure App Service
az webapp deployment source config-zip \
  --resource-group fire-door-app-rg \
  --name fire-door-backend \
  --src dist.zip
```

### 2. Build and Deploy Frontend

```bash
# Build frontend
cd frontend
npm run build

# Deploy to Static Web Apps (via GitHub Actions)
git add .
git commit -m "Deploy to production"
git push origin main
```

## Monitoring and Logging

### Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --resource-group fire-door-app-rg \
  --app fire-door-insights \
  --location eastus \
  --kind web

# Connect to App Service
az monitor app-insights component connect-webapp \
  --resource-group fire-door-app-rg \
  --app fire-door-insights \
  --web-app fire-door-backend
```

### Azure Monitor

- Set up alerts for database connections
- Monitor App Service performance
- Track blob storage usage

## Security Considerations

1. **HTTPS Only**: All endpoints use HTTPS
2. **CORS Configuration**: Restrict to specific domains
3. **Rate Limiting**: Implement API rate limiting
4. **Authentication**: Use Azure AD B2C for user management
5. **Database Security**: Use connection pooling and prepared statements
6. **Environment Variables**: Never commit secrets to repository

## Cost Optimization

- Use Basic tier for development
- Scale up only when needed
- Monitor usage with Azure Cost Management
- Use reserved instances for production

## Troubleshooting

### Common Issues

1. **Database Connection**: Check firewall rules and connection string
2. **CORS Errors**: Verify frontend URL in backend configuration
3. **Authentication**: Ensure B2C tenant and app registration are correct
4. **File Uploads**: Verify blob storage permissions and connection string

### Logs

```bash
# View App Service logs
az webapp log tail --name fire-door-backend --resource-group fire-door-app-rg

# View Static Web App logs
az staticwebapp logs show --name fire-door-frontend --resource-group fire-door-app-rg
```

## Backup and Recovery

### Database Backup

```bash
# Enable automated backups
az postgres flexible-server update \
  --resource-group fire-door-app-rg \
  --name fire-door-db \
  --backup-retention-days 7
```

### File Storage Backup

- Enable soft delete on blob storage
- Configure lifecycle management
- Regular backup of critical documents

## Performance Optimization

1. **CDN**: Enable Azure CDN for static assets
2. **Caching**: Implement Redis cache for frequently accessed data
3. **Database**: Use connection pooling and query optimization
4. **Images**: Compress and optimize uploaded images 