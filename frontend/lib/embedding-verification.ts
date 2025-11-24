/**
 * Polls the embedding status endpoint until documents are ready
 * 
 * @param workspaceSlug - The workspace slug to check
 * @param maxAttempts - Maximum number of polling attempts (default: 30)
 * @param intervalMs - Interval between attempts in milliseconds (default: 2000)
 * @returns Promise<boolean> - true if embedding is complete, false if timeout
 */
export async function waitForEmbeddingCompletion(
    workspaceSlug: string,
    maxAttempts: number = 30,
    intervalMs: number = 2000,
): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const response = await fetch(
                `/api/anythingllm/workspace/${encodeURIComponent(workspaceSlug)}/embedding-status`,
            );

            if (!response.ok) {
                console.warn(
                    `⚠️ Embedding status check failed (attempt ${attempt + 1}/${maxAttempts})`,
                );
                await new Promise((resolve) => setTimeout(resolve, intervalMs));
                continue;
            }

            const data = await response.json();

            if (data.ready) {
                console.log(
                    `✅ Embedding complete: ${data.embeddedCount}/${data.documentsCount} documents ready`,
                );
                return true;
            }

            console.log(
                `⏳ Embedding in progress: ${data.embeddedCount}/${data.documentsCount} documents ready (attempt ${attempt + 1}/${maxAttempts})`,
            );

            // Wait before next attempt
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
        } catch (error) {
            console.error(`❌ Error checking embedding status:`, error);
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
    }

    console.warn(
        `⚠️ Embedding verification timed out after ${maxAttempts} attempts`,
    );
    return false;
}
