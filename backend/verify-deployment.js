#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Run this after deploying to verify your app is working correctly
 */

const { Pool } = require('pg');
const express = require('express');

console.log('🔍 Fire Door App Deployment Verification');
console.log('=====================================\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
const requiredEnvVars = [
  'NODE_ENV',
  'DATABASE_URL',
  'JWT_SECRET',
  'AZURE_STORAGE_CONNECTION_STRING',
  'FRONTEND_URLS'
];

let envCheckPassed = true;
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('SECRET') || varName.includes('PASSWORD') ? '***SET***' : value.substring(0, 50)}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    envCheckPassed = false;
  }
});

console.log('');

// Test database connection
async function testDatabase() {
  console.log('🗄️  Database Connection Test:');
  
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log(`✅ Database connected successfully`);
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   Version: ${result.rows[0].db_version.substring(0, 50)}...`);
    
    // Test basic table access
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`✅ Database tables accessible: ${tablesResult.rows.length} tables found`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    await pool.end();
    return true;
  } catch (error) {
    console.log(`❌ Database connection failed: ${error.message}`);
    return false;
  }
}

// Test basic Express app
function testExpressApp() {
  console.log('\n🚀 Express App Test:');
  
  try {
    const app = express();
    const testPort = process.env.PORT || 8080;
    
    app.get('/test', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        port: testPort,
        nodeEnv: process.env.NODE_ENV
      });
    });
    
    const server = app.listen(testPort, () => {
      console.log(`✅ Express app started successfully on port ${testPort}`);
      server.close();
    });
    
    return true;
  } catch (error) {
    console.log(`❌ Express app test failed: ${error.message}`);
    return false;
  }
}

// Test Azure Storage connection
async function testAzureStorage() {
  console.log('\n☁️  Azure Storage Test:');
  
  try {
    const { BlobServiceClient } = require('@azure/storage-blob');
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    
    const containerClient = blobServiceClient.getContainerClient(
      process.env.BLOB_CONTAINER || 'fire-door-documents'
    );
    
    // Test if we can list containers
    const containers = [];
    for await (const container of blobServiceClient.listContainers()) {
      containers.push(container.name);
    }
    
    console.log(`✅ Azure Storage connected successfully`);
    console.log(`   Available containers: ${containers.join(', ')}`);
    
    // Test if we can access the target container
    const containerExists = await containerClient.exists();
    if (containerExists) {
      console.log(`✅ Target container '${process.env.BLOB_CONTAINER}' exists and accessible`);
    } else {
      console.log(`⚠️  Target container '${process.env.BLOB_CONTAINER}' doesn't exist (will be created automatically)`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Azure Storage test failed: ${error.message}`);
    return false;
  }
}

// Main verification
async function runVerification() {
  console.log('Starting verification...\n');
  
  const results = {
    environment: envCheckPassed,
    database: false,
    express: false,
    storage: false
  };
  
  // Run tests
  results.database = await testDatabase();
  results.express = testExpressApp();
  results.storage = await testAzureStorage();
  
  // Summary
  console.log('\n📊 Verification Summary:');
  console.log('========================');
  console.log(`Environment Variables: ${results.environment ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database Connection: ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Express App: ${results.express ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Azure Storage: ${results.storage ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Your deployment should be working correctly.');
    console.log('\nNext steps:');
    console.log('1. Test your health check endpoint: GET /health');
    console.log('2. Test your API endpoints');
    console.log('3. Verify frontend can connect to backend');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues before proceeding.');
    console.log('\nCommon fixes:');
    if (!results.environment) console.log('- Set all required environment variables');
    if (!results.database) console.log('- Check database connection string and firewall rules');
    if (!results.express) console.log('- Verify Node.js and dependencies are installed');
    if (!results.storage) console.log('- Check Azure Storage connection string and permissions');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run verification if this file is executed directly
if (require.main === module) {
  runVerification().catch(error => {
    console.error('❌ Verification failed with error:', error);
    process.exit(1);
  });
}

module.exports = { runVerification };
