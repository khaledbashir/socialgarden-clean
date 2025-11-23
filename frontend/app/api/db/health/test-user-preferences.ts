import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

/**
 * Test endpoint to verify user_preferences table connectivity
 * Access via: GET /api/db/health/test-user-preferences
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DB TEST] Testing user_preferences table access...');

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Test 1: Check if table exists
      console.log('📋 [DB TEST] Checking if user_preferences table exists...');
      const [tableExists] = await connection.execute(
        'SHOW TABLES LIKE ?',
        ['user_preferences']
      );
      console.log('✅ [DB TEST] Table exists check:', (tableExists as any[]).length > 0 ? 'PASS' : 'FAIL');

      // Test 2: Check table structure
      console.log('🏗️ [DB TEST] Checking table structure...');
      const [columns] = await connection.execute(
        'DESCRIBE user_preferences'
      );
      console.log('✅ [DB TEST] Table columns:', (columns as any[]).map((col: any) => col.Field));

      // Test 3: Try the exact query that's failing
      console.log('🔎 [DB TEST] Testing the exact query from user preferences API...');
      const [rows] = await connection.execute(
        'SELECT preference_key, preference_value FROM user_preferences WHERE user_id = ?',
        ['test-user']
      );
      console.log('✅ [DB TEST] Query executed successfully, rows returned:', (rows as any[]).length);

      // Test 4: Test with backticks (case-sensitive)
      console.log('🎯 [DB TEST] Testing with backticks...');
      const [rowsBackticks] = await connection.execute(
        'SELECT `preference_key`, `preference_value` FROM `user_preferences` WHERE `user_id` = ?',
        ['test-user']
      );
      console.log('✅ [DB TEST] Query with backticks executed successfully, rows returned:', (rowsBackticks as any[]).length);

      // Test 5: Check current database
      console.log('💾 [DB TEST] Checking current database...');
      const [currentDb] = await connection.execute('SELECT DATABASE() as current_db');
      console.log('✅ [DB TEST] Current database:', (currentDb as any[])[0]?.current_db);

      return NextResponse.json({
        status: 'success',
        message: 'All database tests passed',
        results: {
          tableExists: (tableExists as any[]).length > 0,
          columns: (columns as any[]).map((col: any) => ({
            field: col.Field,
            type: col.Type,
            null: col.Null
          })),
          queryResult: {
            row_count: (rows as any[]).length,
            status: 'success'
          },
          backtickQueryResult: {
            row_count: (rowsBackticks as any[]).length,
            status: 'success'
          },
          currentDatabase: (currentDb as any[])[0]?.current_db
        }
      });
    } finally {
      connection.release();
      console.log('🔓 [DB TEST] Connection released');
    }
  } catch (error: any) {
    console.error('❌ [DB TEST] Database test failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database test failed',
        error: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}
