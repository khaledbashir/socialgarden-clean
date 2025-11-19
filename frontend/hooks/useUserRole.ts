import { useState, useEffect, useCallback } from "react";

export type UserRole = "admin" | "editor" | "viewer" | null;

interface UserRoleData {
    role: UserRole;
    userId: string;
    loading: boolean;
    error: string | null;
}

/**
 * Hook to manage user role and permissions
 * Fetches user role from API and provides role checking utilities
 * 
 * @param userId - User identifier (defaults to "default-user")
 * @returns { role, userId, loading, error, isAdmin, isEditor, canEdit, canDelete, refetch }
 */
export function useUserRole(userId: string = "default-user"): UserRoleData & {
    isAdmin: boolean;
    isEditor: boolean;
    canEdit: boolean;
    canDelete: boolean;
    refetch: () => Promise<void>;
} {
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch user role from server
    const fetchUserRole = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch("/api/user/role", {
                headers: {
                    "x-user-id": userId,
                },
            });

            if (!response.ok) {
                // If endpoint doesn't exist or returns error, default to viewer
                console.warn(
                    `⚠️ User role endpoint returned ${response.status}. Defaulting to viewer role.`,
                );
                setRole("viewer");
                setLoading(false);
                return;
            }

            const data = await response.json();
            const userRole = (data.role || "viewer") as UserRole;
            setRole(userRole);
        } catch (err: any) {
            console.warn(
                "⚠️ Could not fetch user role. Defaulting to viewer role.",
                err,
            );
            setError(err.message);
            // Default to viewer on error - most restrictive
            setRole("viewer");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchUserRole();
    }, [fetchUserRole]);

    // Role checking utilities
    const isAdmin = role === "admin";
    const isEditor = role === "editor" || isAdmin;
    const canEdit = isEditor; // Editors and admins can edit
    const canDelete = isAdmin; // Only admins can delete (workspaces, SOWs, rate cards)

    return {
        role,
        userId,
        loading,
        error,
        isAdmin,
        isEditor,
        canEdit,
        canDelete,
        refetch: fetchUserRole,
    };
}

