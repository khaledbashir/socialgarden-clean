"use client";

import React from "react";
import { useUserRole } from "@/hooks/useUserRole";

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles?: ("admin" | "editor" | "viewer")[];
    requireAdmin?: boolean;
    requireEditor?: boolean;
    fallback?: React.ReactNode;
    userId?: string;
}

/**
 * RoleGuard component - Conditionally renders children based on user role
 * 
 * @param children - Content to render if role check passes
 * @param allowedRoles - Array of roles that can access this content (default: all)
 * @param requireAdmin - Shortcut: only admins can access (overrides allowedRoles)
 * @param requireEditor - Shortcut: editors and admins can access (overrides allowedRoles)
 * @param fallback - Content to render if role check fails (default: null)
 * @param userId - User identifier (defaults to "default-user")
 */
export function RoleGuard({
    children,
    allowedRoles,
    requireAdmin = false,
    requireEditor = false,
    fallback = null,
    userId = "default-user",
}: RoleGuardProps) {
    const { role, loading, isAdmin, isEditor } = useUserRole(userId);

    // Show nothing while loading
    if (loading) {
        return null;
    }

    // Check access based on requirements
    let hasAccess = false;

    if (requireAdmin) {
        hasAccess = isAdmin;
    } else if (requireEditor) {
        hasAccess = isEditor;
    } else if (allowedRoles) {
        hasAccess = allowedRoles.includes(role || "viewer");
    } else {
        // No restrictions - allow all
        hasAccess = true;
    }

    return hasAccess ? <>{children}</> : <>{fallback}</>;
}

