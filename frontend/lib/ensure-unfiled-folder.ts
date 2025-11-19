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
      throw new Error('Failed to create Unfiled folder');
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
    // Return a fallback - we'll create it inline if needed
    return {
      id: UNFILED_FOLDER_ID,
      name: UNFILED_FOLDER_NAME,
    };
  }
}
