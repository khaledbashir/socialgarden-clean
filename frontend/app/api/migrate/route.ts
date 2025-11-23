import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Running database migration: Add workspace columns to folders table');
    
    // Check if columns already exist
    const columns = await query('SHOW COLUMNS FROM folders');
    const columnNames = columns.map((col: any) => col.Field);
    
    console.log('Existing columns:', columnNames);
    
    // Add workspace_slug if it doesn't exist
    if (!columnNames.includes('workspace_slug')) {
      console.log('Adding workspace_slug column...');
      await query('ALTER TABLE folders ADD COLUMN workspace_slug VARCHAR(255) AFTER name');
      console.log('✅ Added workspace_slug');
    } else {
      console.log('workspace_slug already exists');
    }
    
    // Add workspace_id if it doesn't exist
    if (!columnNames.includes('workspace_id')) {
      console.log('Adding workspace_id column...');
      await query('ALTER TABLE folders ADD COLUMN workspace_id INT AFTER workspace_slug');
      console.log('✅ Added workspace_id');
    } else {
      console.log('workspace_id already exists');
    }
    
    // Add embed_id if it doesn't exist
    if (!columnNames.includes('embed_id')) {
      console.log('Adding embed_id column...');
      await query('ALTER TABLE folders ADD COLUMN embed_id BIGINT AFTER workspace_id');
      console.log('✅ Added embed_id');
    } else {
      console.log('embed_id already exists - checking type...');
      // Fix existing column type if needed
      await query('ALTER TABLE folders MODIFY COLUMN embed_id BIGINT');
      console.log('✅ Updated embed_id to BIGINT');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully',
      columns: await query('SHOW COLUMNS FROM folders')
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
