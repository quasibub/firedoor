# Deployment Troubleshooting Guide

## Common Crash Causes & Solutions

### 1. Database Connection Failures

**Symptoms:**
- App starts but crashes immediately
- Error logs show "connection refused" or "authentication failed"
- Health check endpoint fails

**Solutions:**
```bash
# Check if database is accessible from App Service
az webapp log tail --name fire-door-backend --resource-group fire-door-app-rg

# Verify firewall rules allow App Service IP
az postgres flexible-server firewall-rule list --resource-group fire-door-app-rg --server-name fire-door-db

# Test database connection manually
psql "postgresql://postgres:<password>@fire-door-db.postgres.database.azure.com:5432/fire_door_inspection?sslmode=require"
```

### 2. Environment Variable Issues

**Check these in Azure App Service Configuration:**
- `DATABASE_URL` - Must include `sslmode=require`
- `JWT_SECRET` - Must be a valid string
- `AZURE_STORAGE_CONNECTION_STRING` - Must be valid
- `NODE_ENV=production`
- `PORT=8080` (or let Azure set it automatically)

### 3. Port Configuration

**Problem:** App expects port 8080 but Azure might use different port
**Solution:** Remove PORT from environment variables, let Azure handle it

### 4. Missing Dependencies

**Check package.json and ensure all dependencies are installed:**
```bash
# In App Service, verify node_modules exists
# Check if build process completed successfully
```

### 5. CORS Configuration

**Problem:** Frontend can't connect to backend
**Solution:** Ensure FRONTEND_URLS includes your Static Web App URL

## Quick Debugging Steps

### Step 1: Check App Service Logs
```bash
az webapp log tail --name fire-door-backend --resource-group fire-door-app-rg
```

### Step 2: Test Database Connection
```bash
# From App Service console or SSH
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('DB Error:', err);
  else console.log('DB OK:', res.rows[0]);
  pool.end();
});
"
```

### Step 3: Check Environment Variables
```bash
# In App Service console
node -e "console.log('NODE_ENV:', process.env.NODE_ENV)"
node -e "console.log('PORT:', process.env.PORT)"
node -e "console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)"
```

### Step 4: Test Basic Express App
```bash
# Create minimal test.js in App Service
echo "
const express = require('express');
const app = express();
app.get('/test', (req, res) => res.json({status: 'OK'}));
app.listen(process.env.PORT || 8080, () => console.log('Test server running'));
" > test.js

# Run it
node test.js
```

## Environment Variable Checklist

### Backend (Azure App Service)
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL=postgresql://postgres:<password>@fire-door-db.postgres.database.azure.com:5432/fire_door_inspection?sslmode=require`
- [ ] `JWT_SECRET=<secure-random-string>`
- [ ] `AZURE_STORAGE_CONNECTION_STRING=<connection-string>`
- [ ] `FRONTEND_URLS=https://<your-swa>.azurestaticapps.net`

### Frontend (Static Web App)
- [ ] `REACT_APP_API_URL=https://fire-door-backend.azurewebsites.net/api`
- [ ] `REACT_APP_AUTH_DOMAIN=<your-b2c-domain>`
- [ ] `REACT_APP_CLIENT_ID=<your-b2c-client-id>`

## Common Error Messages & Solutions

### "Cannot find module"
- **Cause:** Dependencies not installed
- **Solution:** Ensure `npm install` runs after build

### "ECONNREFUSED"
- **Cause:** Database connection failed
- **Solution:** Check firewall rules and connection string

### "JWT_SECRET is not defined"
- **Cause:** Missing environment variable
- **Solution:** Set JWT_SECRET in App Service Configuration

### "CORS error"
- **Cause:** Frontend URL not in allowed origins
- **Solution:** Update FRONTEND_URLS in backend configuration

## Recovery Steps

1. **Immediate:** Check App Service logs
2. **Verify:** Environment variables are set correctly
3. **Test:** Database connectivity
4. **Restart:** App Service after fixing issues
5. **Monitor:** Health check endpoint

## Health Check Endpoint

Your app has a health check at `/health` - use this to verify the app is running:

```bash
curl https://fire-door-backend.azurewebsites.net/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-XX...",
  "uptime": 123.45
}
```
