#!/usr/bin/env node
/**
 * Database Migration Runner
 * Runs SQL migrations for the Social Garden SOW system
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: process.env.DB_HOST || '168.231.115.219',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'sg_sow_user',
  password: process.env.DB_PASSWORD || 'SG_sow_2025_SecurePass!',
  database: process.env.DB_NAME || 'socialgarden_sow',
  multipleStatements: true, // Allow multiple SQL statements
};

async function runMigration(migrationFile) {
  console.log('🔧 Database Config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
    password: dbConfig.password ? '***SET***' : '***NOT SET***',
  });

  console.log(`\n🚀 Running migration: ${migrationFile}`);

  let connection;
  try {
    // Read migration file (database folder is at root level, not in frontend)
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL:');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));

    // Connect to database
    console.log('\n🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Execute migration
    console.log('\n⚡ Executing migration...');
    const [results] = await connection.query(sql);
    console.log('✅ Migration executed successfully');
    
    if (results) {
      console.log('📊 Results:', results);
    }

    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    if (error.sql) {
      console.error('\n🔍 Failed SQL:');
      console.error(error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Get migration file from command line or use default
const migrationFile = process.argv[2] || '003_create_sows_table.sql';
runMigration(migrationFile);
