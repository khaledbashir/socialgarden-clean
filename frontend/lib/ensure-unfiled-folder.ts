/**
 * Ensure "Unfiled" folder exists
 * This is the default location for new SOWs before they're organized into folders
 */

export const UNFILED_FOLDER_ID = 'unfiled-default';
export const UNFILED_FOLDER_NAME = 'Unfiled';

export async function ensureUnfiledFolder(): Promise<{ id: string; name: string; workspaceSlug?: string }> {
  try {
    // Check if Unfiled folder already exists
    const foldersResponse = await fetch('/api/folders');
    
    if (!foldersResponse.ok) {
      console.warn('⚠️ Failed to fetch folders, will create Unfiled folder');
      // Continue to create folder below
    } else {
      const folders = await foldersResponse.json();
      
      // Ensure folders is an array
      if (!Array.isArray(folders)) {
        console.warn('⚠️ Folders response is not an array:', folders);
        // Continue to create folder below
      } else {
        const unfiledFolder = folders.find(
          (f: any) => f.id === UNFILED_FOLDER_ID || f.name === UNFILED_FOLDER_NAME
        );

        if (unfiledFolder) {
          console.log('✅ Unfiled folder already exists:', unfiledFolder.id);
          return {
            id: unfiledFolder.id,
            name: unfiledFolder.name,
            workspaceSlug: unfiledFolder.workspace_slug,
          };
        }
      }
    }

    // Create Unfiled folder if it doesn't exist
    console.log('📁 Creating Unfiled folder...');
    const createResponse = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: UNFILED_FOLDER_ID,
        name: UNFILED_FOLDER_NAME,
        workspaceSlug: null, // No AnythingLLM workspace needed
        workspaceId: null,
        embedId: null,
      }),
    });

    if (!createResponse.ok) {
      // Try to get error details
      let errorMessage = 'Failed to create Unfiled folder';
      try {
        const errorData = await createResponse.json();
        errorMessage = errorData.error || errorData.details || errorMessage;
        
        // If folder already exists (duplicate), try to find it
        if (errorData.details && errorData.details.includes('Duplicate')) {
          console.log('🔄 Unfiled folder might already exist, fetching again...');
          const foldersResponse = await fetch('/api/folders');
          if (foldersResponse.ok) {
            const folders = await foldersResponse.json();
            const existing = folders.find(
              (f: any) => f.id === UNFILED_FOLDER_ID || f.name === UNFILED_FOLDER_NAME
            );
            if (existing) {
              console.log('✅ Found existing Unfiled folder:', existing.id);
              return {
                id: existing.id,
                name: existing.name,
                workspaceSlug: existing.workspace_slug,
              };
            }
          }
        }
      } catch (parseError) {
        // Couldn't parse error, use default message
      }
      
      // If we get here, creation failed but we'll return fallback
      console.warn('⚠️ Could not create Unfiled folder, using fallback');
      return {
        id: UNFILED_FOLDER_ID,
        name: UNFILED_FOLDER_NAME,
      };
    }

    const newFolder = await createResponse.json();
    console.log('✅ Unfiled folder created:', newFolder.id);

    return {
      id: newFolder.id,
      name: newFolder.name,
      workspaceSlug: newFolder.workspaceSlug,
    };
  } catch (error) {
    console.error('❌ Error ensuring Unfiled folder:', error);
    // Return a fallback - the app will work without it, we'll create it inline if needed
    // Don't throw - just return fallback so app can continue
    return {
      id: UNFILED_FOLDER_ID,
      name: UNFILED_FOLDER_NAME,
    };
  }
}
