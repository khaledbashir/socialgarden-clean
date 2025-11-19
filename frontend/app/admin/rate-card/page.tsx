"use client";

import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Save, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from "next/navigation";

interface RateCardRole {
    id: string;
    roleName: string;
    hourlyRate: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface FormData {
    roleName: string;
    hourlyRate: string;
}

export default function RateCardManagementPage() {
    const router = useRouter();
    const { role, loading: roleLoading, isAdmin } = useUserRole();
    const [roles, setRoles] = useState<RateCardRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Redirect non-admin users
    useEffect(() => {
        if (!roleLoading && !isAdmin) {
            router.push("/");
        }
    }, [roleLoading, isAdmin, router]);

    // Don't render content until role is loaded
    if (roleLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-600">Checking permissions...</p>
                </div>
            </div>
        );
    }

    // Don't render if not admin
    if (!isAdmin) {
        return null;
    }

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({
        roleName: "",
        hourlyRate: "",
    });
    const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
    const [submitting, setSubmitting] = useState(false);

    // Fetch all roles
    const fetchRoles = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch("/api/rate-card");
            const result = await response.json();

            if (result.success) {
                setRoles(result.data);
            } else {
                setError(result.error || "Failed to fetch rate card roles");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred while fetching roles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    // Validate form
    const validateForm = (): boolean => {
        const errors: Partial<FormData> = {};

        if (!formData.roleName.trim()) {
            errors.roleName = "Role name is required";
        }

        const rate = parseFloat(formData.hourlyRate);
        if (!formData.hourlyRate || isNaN(rate) || rate <= 0) {
            errors.hourlyRate = "Hourly rate must be a positive number";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submission (create or update)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const payload = {
                roleName: formData.roleName.trim(),
                hourlyRate: parseFloat(formData.hourlyRate),
            };

            const response = editingId
                ? await fetch(`/api/rate-card/${editingId}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                  })
                : await fetch("/api/rate-card", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                  });

            const result = await response.json();

            if (result.success) {
                setSuccess(
                    editingId
                        ? "Role updated successfully"
                        : "Role created successfully"
                );
                resetForm();
                fetchRoles();

                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(result.error || "Failed to save role");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred while saving the role");
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete
    const handleDelete = async (id: string, roleName: string) => {
        if (!confirm(`Are you sure you want to delete "${roleName}"?`)) {
            return;
        }

        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(`/api/rate-card/${id}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (result.success) {
                setSuccess("Role deleted successfully");
                fetchRoles();

                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(result.error || "Failed to delete role");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred while deleting the role");
        }
    };

    // Edit role
    const handleEdit = (role: RateCardRole) => {
        setEditingId(role.id);
        setFormData({
            roleName: role.roleName,
            hourlyRate: role.hourlyRate.toString(),
        });
        setFormErrors({});
        setShowForm(true);
        setError(null);
        setSuccess(null);
    };

    // Reset form
    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ roleName: "", hourlyRate: "" });
        setFormErrors({});
    };

    // Add new role
    const handleAddNew = () => {
        resetForm();
        setShowForm(true);
        setError(null);
        setSuccess(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">
                        Rate Card Management
                    </h1>
                    <p className="text-slate-600 text-lg">
                        Manage your global rate card - the single source of truth for all roles and rates
                    </p>
                </div>

                {/* Alert Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-red-800 font-medium">Error</p>
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-green-800 font-medium">Success</p>
                            <p className="text-green-700 text-sm">{success}</p>
                        </div>
                        <button
                            onClick={() => setSuccess(null)}
                            className="text-green-400 hover:text-green-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Add/Edit Form */}
                {showForm && (
                    <div className="mb-6 bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">
                                {editingId ? "Edit Role" : "Add New Role"}
                            </h2>
                            <button
                                onClick={resetForm}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="roleName" className="block text-sm font-medium text-slate-700 mb-2">
                                    Role Name
                                </label>
                                <input
                                    id="roleName"
                                    type="text"
                                    value={formData.roleName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, roleName: e.target.value })
                                    }
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                        formErrors.roleName
                                            ? "border-red-300 bg-red-50"
                                            : "border-slate-300"
                                    }`}
                                    placeholder="e.g., Tech - Producer - Campaign Build"
                                />
                                {formErrors.roleName && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.roleName}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="hourlyRate" className="block text-sm font-medium text-slate-700 mb-2">
                                    Hourly Rate (AUD)
                                </label>
                                <input
                                    id="hourlyRate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.hourlyRate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, hourlyRate: e.target.value })
                                    }
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                        formErrors.hourlyRate
                                            ? "border-red-300 bg-red-50"
                                            : "border-slate-300"
                                    }`}
                                    placeholder="e.g., 120.00"
                                />
                                {formErrors.hourlyRate && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.hourlyRate}</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    <Save className="w-4 h-4" />
                                    {submitting ? "Saving..." : editingId ? "Update Role" : "Create Role"}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Main Content */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Rate Card Roles
                            </h2>
                            <p className="text-slate-600 text-sm mt-1">
                                {roles.length} active role{roles.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <button
                            onClick={handleAddNew}
                            disabled={showForm}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Add Role
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-slate-600">Loading rate card...</p>
                        </div>
                    ) : roles.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-slate-600 text-lg">No roles found</p>
                            <p className="text-slate-500 text-sm mt-2">
                                Click "Add Role" to create your first rate card entry
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Role Name
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Hourly Rate (AUD)
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {roles.map((role) => (
                                        <tr
                                            key={role.id}
                                            className="hover:bg-slate-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 text-sm text-slate-900">
                                                {role.roleName}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-900 text-right font-mono">
                                                {Number(role.hourlyRate).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(role)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit role"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(role.id, role.roleName)
                                                        }
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete role"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Info Panel */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">
                        🎯 Single Source of Truth
                    </h3>
                    <div className="space-y-2 text-sm text-blue-800">
                        <p>
                            • This rate card is the <strong>authoritative source</strong> for all roles and rates
                        </p>
                        <p>
                            • Changes here will automatically update the <strong>dropdown options</strong> in pricing tables
                        </p>
                        <p>
                            • The AI model uses this data to <strong>generate accurate scopes</strong>
                        </p>
                        <p>
                            • All rates are in <strong>AUD per hour, exclusive of GST</strong>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
