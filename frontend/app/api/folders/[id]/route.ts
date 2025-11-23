import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const ANYTHINGLLM_URL = process.env.ANYTHINGLLM_URL || 'https://ahmad-anything-llm.840tjq.easypanel.host';
const ANYTHINGLLM_API_KEY = process.env.ANYTHINGLLM_API_KEY || 'process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY';

/**
 * GET /api/folders/[id]
 * Get a specific folder by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const folders = await query(
      'SELECT id, name, workspace_slug, workspace_id, embed_id, created_at, updated_at FROM folders WHERE id = ?',
      [id]
    );
    
    if (folders.length === 0) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }
    
    return NextResponse.json(folders[0]);
  } catch (error) {
    console.error('❌ Failed to fetch folder:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch folder', 
      details: String(error)
    }, { status: 500 });
  }
}

/**
 * PUT /api/folders/[id]
 * Update a folder (rename, etc.)
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    await query(
      'UPDATE folders SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, id]
    );
    
    return NextResponse.json({ 
      id, 
      name,
      message: 'Folder updated successfully'
    });
  } catch (error) {
    console.error('❌ Failed to update folder:', error);
    return NextResponse.json({ 
      error: 'Failed to update folder', 
      details: String(error)
    }, { status: 500 });
  }
}

/**
 * DELETE /api/folders/[id]
 * Delete a folder and all associated SOWs, threads, and AnythingLLM workspace
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    console.log(`🗑️ [Folder Delete] Deleting folder: ${id}`);
    
    // Step 1: Get folder details (including workspace_slug)
    const folders = await query(
      'SELECT id, name, workspace_slug FROM folders WHERE id = ?',
      [id]
    );
    
    if (folders.length === 0) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }
    
    const folder = folders[0];
    const workspaceSlug = folder.workspace_slug;
    
    console.log(`📁 Folder found: ${folder.name} with workspace_slug: ${workspaceSlug}`);
    
    // Step 2: Delete AnythingLLM workspace and cascade delete all threads
    if (workspaceSlug) {
      console.log(`🏢 Attempting to delete AnythingLLM workspace: ${workspaceSlug}`);
      
      try {
        const deleteResponse = await fetch(
          `${ANYTHINGLLM_URL}/api/v1/workspace/${workspaceSlug}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (deleteResponse.ok) {
          console.log(`✅ AnythingLLM workspace deleted: ${workspaceSlug}`);
        } else {
          const errorText = await deleteResponse.text();
          console.warn(`⚠️ Failed to delete AnythingLLM workspace (${deleteResponse.status}): ${errorText}`);
          // Continue with database deletion even if AnythingLLM fails
        }
      } catch (anythingLLMError) {
        console.error(`❌ Error deleting AnythingLLM workspace:`, anythingLLMError);
        // Continue with database deletion even if AnythingLLM fails
      }
    }
    
    // Step 3: Get all SOWs in this folder before deleting
    const sows = await query(
      'SELECT id FROM sows WHERE folder_id = ?',
      [id]
    );
    
    console.log(`📄 Found ${sows.length} SOWs to delete in this folder`);
    
    // Step 4: Delete all SOWs (this cascades to activities, comments, etc. due to foreign keys)
    if (sows.length > 0) {
      const sowIds = sows.map((s: any) => s.id);
      const placeholders = sowIds.map(() => '?').join(',');
      
      // Delete activities, comments, acceptances, rejections (they have foreign keys to sows)
      await query(`DELETE FROM sow_activities WHERE sow_id IN (${placeholders})`, sowIds);
      await query(`DELETE FROM sow_comments WHERE sow_id IN (${placeholders})`, sowIds);
      await query(`DELETE FROM sow_acceptances WHERE sow_id IN (${placeholders})`, sowIds);
      await query(`DELETE FROM sow_rejections WHERE sow_id IN (${placeholders})`, sowIds);
      await query(`DELETE FROM ai_conversations WHERE sow_id IN (${placeholders})`, sowIds);
      
      // Finally delete the SOWs
      await query(`DELETE FROM sows WHERE folder_id = ?`, [id]);
      
      console.log(`✅ Deleted ${sows.length} SOWs and all related data`);
    }
    
    // Step 5: Delete the folder itself
    await query('DELETE FROM folders WHERE id = ?', [id]);
    
    console.log(`✅ [Folder Delete] Folder deleted successfully: ${id}`);
    
    return NextResponse.json({ 
      message: 'Folder and all associated data deleted successfully',
      deletedFolder: folder.name,
      deletedSOWsCount: sows.length
    });
  } catch (error) {
    console.error('❌ [Folder Delete] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete folder', 
      details: String(error)
    }, { status: 500 });
  }
}
