import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const folders = await query('SELECT id, name, workspace_slug, workspace_id, embed_id, created_at, updated_at FROM folders ORDER BY created_at DESC');
    return NextResponse.json(folders);
  } catch (error) {
    console.error('❌ Failed to fetch folders:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch folders', 
      details: String(error) 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, workspaceSlug, workspaceId, embedId } = body;
    
    console.log('🏢 Creating folder with data:', { 
      name, 
      workspaceSlug, 
      workspaceId, 
      embedId, 
    });
    
    const folderId = crypto.randomUUID();
    const finalEmbedId = typeof embedId === 'number' ? embedId : (embedId ? parseInt(embedId, 10) : null);
    
    // 🔧 CRITICAL FIX: Handle duplicate workspace_slug gracefully
    // If workspace_slug already exists, don't insert duplicate - return existing folder info
    if (workspaceSlug) {
      const existingFolders = await query(
        'SELECT id, name, workspace_slug, workspace_id, embed_id, created_at, updated_at FROM folders WHERE workspace_slug = ?',
        [workspaceSlug]
      );
      
      if (existingFolders.length > 0) {
        console.log(`🔄 Workspace slug '${workspaceSlug}' already exists, returning existing folder`);
        const existingFolder = existingFolders[0];
        return NextResponse.json({ 
          id: existingFolder.id,
          name: existingFolder.name,
          workspaceSlug: existingFolder.workspace_slug,
          workspaceId: existingFolder.workspace_id,
          embedId: existingFolder.embed_id,
          existing: true // Flag that this is an existing workspace
        }, { status: 200 }); // Return 200 instead of 201 since it's not new
      }
    }
    
    await query(
      'INSERT INTO folders (id, name, workspace_slug, workspace_id, embed_id) VALUES (?, ?, ?, ?, ?)',
      [folderId, name, workspaceSlug || null, workspaceId || null, finalEmbedId]
    );
    
    return NextResponse.json({ 
      id: folderId, 
      name, 
      workspaceSlug,
      workspaceId,
      embedId,
      existing: false // Flag that this is a new folder
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Failed to create folder:', error);
    
    // 🔧 CRITICAL FIX: Check if this is a duplicate entry error and handle gracefully
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      console.log('🔄 Duplicate workspace detected, attempting to find existing folder');
      
      // Extract workspace slug from request body (need to re-parse since body was already consumed)
      let workspaceSlug = null;
      try {
        // Try to get workspace slug from the error message
        const errorMatch = error.message.match(/Duplicate entry '(.+?)'/);
        if (errorMatch && errorMatch[1]) {
          workspaceSlug = errorMatch[1];
        }
      } catch (parseError) {
        console.warn('Could not extract workspace slug from error:', parseError);
      }
      
      if (workspaceSlug) {
        try {
          const existingFolders = await query(
            'SELECT id, name, workspace_slug, workspace_id, embed_id, created_at, updated_at FROM folders WHERE workspace_slug = ?',
            [workspaceSlug]
          );
          
          if (existingFolders.length > 0) {
            const existingFolder = existingFolders[0];
            console.log(`✅ Found existing folder for workspace slug '${workspaceSlug}': ${existingFolder.name}`);
            return NextResponse.json({ 
              id: existingFolder.id,
              name: existingFolder.name,
              workspaceSlug: existingFolder.workspace_slug,
              workspaceId: existingFolder.workspace_id,
              embedId: existingFolder.embed_id,
              existing: true,
              message: 'Using existing workspace due to duplicate constraint'
            }, { status: 200 });
          }
        } catch (findError) {
          console.error('❌ Failed to find existing folder after duplicate error:', findError);
        }
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to create folder', 
      details: String(error)
    }, { status: 500 });
  }
}
