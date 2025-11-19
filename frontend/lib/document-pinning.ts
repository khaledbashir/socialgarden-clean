/**
 * Utility functions for pinning documents in AnythingLLM workspaces
 * 
 * This module implements the 2-step workflow:
 * 1. Upload document (returns docPath/location)
 * 2. Pin document using docPath
 */

/**
 * File upload status types
 */
export type UploadStatus = "pending" | "uploading" | "pinning" | "success" | "error";

/**
 * File upload progress information
 */
export interface FileUploadProgress {
    id: string;
    file: File;
    status: UploadStatus;
    progress: number; // 0-100
    docPath?: string;
    error?: string;
    wordCount?: number;
    tokenCount?: number;
}

/**
 * Pins a document to a workspace after upload
 * 
 * @param workspaceSlug - The workspace slug where the document should be pinned
 * @param docPath - The document path (location) returned from upload API
 * @returns Promise<boolean> - true if pinning succeeded, false otherwise
 */
export async function pinDocumentToWorkspace(
    workspaceSlug: string,
    docPath: string,
): Promise<boolean> {
    if (!workspaceSlug || !docPath) {
        console.warn("⚠️ Cannot pin document: missing workspaceSlug or docPath");
        return false;
    }

    try {
        const pinResponse = await fetch(
            `/api/anythingllm/workspace/${encodeURIComponent(workspaceSlug)}/update-pin`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    docPath: docPath,
                    pinStatus: true,
                }),
            },
        );

        if (pinResponse.ok) {
            console.log("✅ Document pinned successfully:", docPath);
            return true;
        } else {
            const errorText = await pinResponse.text().catch(() => "");
            console.warn("⚠️ Failed to pin document:", errorText);
            return false;
        }
    } catch (pinError) {
        console.error("❌ Error pinning document:", pinError);
        return false;
    }
}

/**
 * Handles the complete document upload and pinning workflow
 * 
 * This function extracts the docPath from the upload response and pins the document.
 * It follows the mandatory 2-step sequence: Upload -> Pin
 * 
 * @param uploadResponseData - The JSON response from the document upload API
 * @param workspaceSlug - The workspace slug where the document should be pinned
 * @returns Promise<{ pinned: boolean; docPath: string | null }> - Pin status and document path
 */
export async function handleDocumentUploadAndPin(
    uploadResponseData: {
        success?: boolean;
        documents?: Array<{ location?: string; [key: string]: any }>;
    },
    workspaceSlug: string,
): Promise<{ pinned: boolean; docPath: string | null }> {
    // Step 1: Extract docPath from upload response
    const docPath =
        uploadResponseData?.documents?.[0]?.location || null;

    if (!docPath) {
        console.warn("⚠️ No document location found in upload response");
        return { pinned: false, docPath: null };
    }

    // Step 2: Pin the document
    const pinned = await pinDocumentToWorkspace(workspaceSlug, docPath);

    return { pinned, docPath };
}

/**
 * Uploads a single file and pins it to the workspace
 * 
 * @param file - The file to upload
 * @param workspaceSlug - The workspace slug
 * @param onProgress - Optional callback to update progress
 * @returns Promise with upload result
 */
export async function uploadAndPinSingleFile(
    file: File,
    workspaceSlug: string,
    onProgress?: (progress: FileUploadProgress) => void,
): Promise<{
    success: boolean;
    docPath?: string;
    error?: string;
    wordCount?: number;
    tokenCount?: number;
}> {
    const fileId = `${Date.now()}-${Math.random()}`;
    const progress: FileUploadProgress = {
        id: fileId,
        file,
        status: "uploading",
        progress: 0,
    };

    // Validate file type
    const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
    ];
    const validExtensions = [".pdf", ".doc", ".docx", ".txt", ".md"];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    const isValidType =
        validTypes.includes(file.type) || validExtensions.includes(fileExtension);

    if (!isValidType) {
        const error = "Unsupported file type. Please upload PDF, Word, or text files.";
        progress.status = "error";
        progress.error = error;
        onProgress?.(progress);
        return { success: false, error };
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        const error = "File size exceeds 50MB limit.";
        progress.status = "error";
        progress.error = error;
        onProgress?.(progress);
        return { success: false, error };
    }

    onProgress?.({ ...progress, status: "uploading", progress: 10 });

    try {
        // Step 1: Upload the file
        const formData = new FormData();
        formData.append("file", file);
        formData.append("workspaceSlug", workspaceSlug);

        const metadata = {
            title: file.name,
            docAuthor: "User Upload",
            description: `Document uploaded via workspace chat`,
            docSource: "Workspace Chat Upload",
        };
        formData.append("metadata", JSON.stringify(metadata));

        onProgress?.({ ...progress, status: "uploading", progress: 30 });

        const response = await fetch("/api/anythingllm/document/upload", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error =
                errorData.error ||
                `Upload failed: ${response.status} ${response.statusText}`;
            progress.status = "error";
            progress.error = error;
            onProgress?.(progress);
            return { success: false, error };
        }

        onProgress?.({ ...progress, status: "uploading", progress: 70 });

        const data = await response.json();

        if (!data.success || !data.documents || data.documents.length === 0) {
            const error = "Upload succeeded but no document was returned";
            progress.status = "error";
            progress.error = error;
            onProgress?.(progress);
            return { success: false, error };
        }

        const doc = data.documents[0];
        const docPath = doc.location;

        if (!docPath) {
            const error = "No document location found in upload response";
            progress.status = "error";
            progress.error = error;
            onProgress?.(progress);
            return { success: false, error };
        }

        // Step 2: Pin the document
        onProgress?.({
            ...progress,
            status: "pinning",
            progress: 80,
            docPath,
        });

        const pinned = await pinDocumentToWorkspace(workspaceSlug, docPath);

        if (!pinned) {
            // Upload succeeded but pinning failed - still consider it a partial success
            console.warn("⚠️ Document uploaded but pinning failed:", docPath);
        }

        onProgress?.({
            ...progress,
            status: "success",
            progress: 100,
            docPath,
            wordCount: doc.wordCount,
            tokenCount: doc.token_count_estimate,
        });

        return {
            success: true,
            docPath,
            wordCount: doc.wordCount,
            tokenCount: doc.token_count_estimate,
        };
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Failed to upload document";
        progress.status = "error";
        progress.error = errorMessage;
        onProgress?.(progress);
        return { success: false, error: errorMessage };
    }
}

