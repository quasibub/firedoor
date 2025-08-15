# Database Setup Guide

## Prerequisites

1. **PostgreSQL** installed and running on your system
2. **Node.js** 18+ installed

## Quick Setup

### 1. Install PostgreSQL

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Install with default settings
- Remember the password you set for the `postgres` user

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL as postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE fire_door_inspection;

# Exit psql
\q
```

### 3. Configure Environment

Create a `.env` file in the `backend` directory:

```bash
# Backend Environment Variables

# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/fire_door_inspection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fire_door_inspection
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Replace `your_password` with the password you set during PostgreSQL installation.**

### 4. Run Migrations

```bash
cd backend
npm run migrate
npm run init-db # optional sample data
```

This will:
- Apply all database migrations
- (Optional) Add sample data for development

### 5. Start the Application

```bash
# From the root directory
npm run dev
```

## Troubleshooting

### Database Connection Issues

1. **Check if PostgreSQL is running:**
   ```bash
   # Windows
   services.msc  # Look for "postgresql-x64-14" service
   
   # macOS
   brew services list | grep postgresql
   
   # Linux
   sudo systemctl status postgresql
   ```

2. **Test connection:**
   ```bash
   psql -h localhost -U postgres -d fire_door_inspection
   ```

3. **Check environment variables:**
   - Ensure `.env` file exists in `backend` directory
   - Verify password matches your PostgreSQL installation

### Common Issues

- **"password authentication failed"**: Check your password in `.env`
- **"database does not exist"**: Run the database creation step
- **"connection refused"**: Ensure PostgreSQL is running

## Production Setup

For production deployment, use Azure Database for PostgreSQL as specified in the deployment guide. 