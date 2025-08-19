# 🚀 Fire Door App Deployment Checklist

## Pre-Deployment Setup

### 1. Azure Resources ✅
- [ ] Resource group created
- [ ] PostgreSQL database created and accessible
- [ ] Storage account created with blob container
- [ ] App Service plan created
- [ ] App Service created
- [ ] Static Web App created

### 2. Environment Variables ✅

#### Backend (Azure App Service Configuration)
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL=postgresql://postgres:<password>@fire-door-db.postgres.database.azure.com:5432/fire_door_inspection?sslmode=require`
- [ ] `JWT_SECRET=<secure-random-string>`
- [ ] `AZURE_STORAGE_CONNECTION_STRING=<connection-string>`
- [ ] `FRONTEND_URLS=https://<your-swa>.azurestaticapps.net`

#### Frontend (Static Web App Configuration)
- [ ] `REACT_APP_API_URL=https://fire-door-backend.azurewebsites.net/api`
- [ ] `REACT_APP_AUTH_DOMAIN=<your-b2c-domain>`
- [ ] `REACT_APP_CLIENT_ID=<your-b2c-client-id>`

### 3. Database Setup ✅
- [ ] Database firewall allows App Service IP
- [ ] Database user has proper permissions
- [ ] SSL connection enabled
- [ ] Database schema initialized

### 4. Security Configuration ✅
- [ ] JWT secret is secure (32+ characters)
- [ ] CORS origins properly configured
- [ ] Azure AD B2C configured (if using)
- [ ] Storage account permissions set

## Deployment Steps

### 1. Backend Deployment
```bash
# Build the application
cd backend
npm run build

# Deploy to Azure App Service
# (Use Azure CLI, GitHub Actions, or Azure DevOps)
```

### 2. Frontend Deployment
```bash
# Build the application
cd frontend
npm run build

# Deploy to Static Web App
# (Usually automatic via GitHub Actions)
```

## Post-Deployment Verification

### 1. Health Check ✅
```bash
curl https://fire-door-backend.azurewebsites.net/health
```
Expected: `{"status":"OK","timestamp":"...","uptime":...}`

### 2. Database Connection ✅
```bash
# Run verification script
cd backend
node verify-deployment.js
```

### 3. Frontend Connectivity ✅
- [ ] Frontend loads without errors
- [ ] Can connect to backend API
- [ ] Authentication works (if configured)
- [ ] File uploads work (if configured)

### 4. Monitoring ✅
- [ ] App Service logs show no errors
- [ ] Database connection pool healthy
- [ ] Response times acceptable
- [ ] No 5xx errors in logs

## Common Crash Causes & Quick Fixes

### 🚨 Immediate Crashes

1. **Missing Environment Variables**
   - Check Azure App Service Configuration
   - Ensure all required vars are set

2. **Database Connection Failed**
   - Verify DATABASE_URL format
   - Check firewall rules
   - Ensure SSL is enabled

3. **Port Conflicts**
   - Remove PORT from env vars
   - Let Azure handle port assignment

4. **Missing Dependencies**
   - Ensure `npm install` runs after build
   - Check package.json includes all deps

### 🔧 Gradual Degradation

1. **Memory Issues**
   - Check App Service plan size
   - Monitor memory usage

2. **Database Connection Pool Exhaustion**
   - Check connection pool settings
   - Monitor active connections

3. **Rate Limiting**
   - Adjust rate limit settings
   - Check if legitimate traffic is being blocked

## Emergency Recovery

### If App Won't Start
1. Check App Service logs immediately
2. Verify environment variables
3. Test database connectivity
4. Restart App Service

### If App Starts But Crashes
1. Check application logs
2. Verify all dependencies are installed
3. Test individual components
4. Check resource limits

### If Frontend Can't Connect
1. Verify CORS configuration
2. Check backend health endpoint
3. Verify API URL in frontend config
4. Check network connectivity

## Support Commands

```bash
# View App Service logs
az webapp log tail --name fire-door-backend --resource-group fire-door-app-rg

# Check App Service status
az webapp show --name fire-door-backend --resource-group fire-door-app-rg

# Restart App Service
az webapp restart --name fire-door-backend --resource-group fire-door-app-rg

# Test database connection
psql "postgresql://postgres:<password>@fire-door-db.postgres.database.azure.com:5432/fire_door_inspection?sslmode=require"
```

## Success Indicators 🎯

- ✅ Health check returns 200 OK
- ✅ Database queries execute successfully
- ✅ Frontend loads and connects to backend
- ✅ File uploads work (if applicable)
- ✅ Authentication flows work (if configured)
- ✅ No errors in App Service logs
- ✅ Response times under 2 seconds

## Next Steps After Successful Deployment

1. Set up monitoring and alerting
2. Configure automated backups
3. Set up CI/CD pipeline
4. Document deployment process
5. Plan scaling strategy
