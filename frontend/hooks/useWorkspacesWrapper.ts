"use client";

// Import the original hook and re-export it
import useWorkspacesOriginal from "./useWorkspaces";

// Re-export as both named and default export
export const useWorkspaces = useWorkspacesOriginal;
export default useWorkspacesOriginal;
