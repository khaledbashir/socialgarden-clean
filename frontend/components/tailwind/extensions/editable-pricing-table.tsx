"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import { Save, Undo2 } from "lucide-react";
import {
    enforceMandatoryRoles,
    validateMandatoryRoles,
    type RoleRate,
    type PricingRow,
} from "@/lib/mandatory-roles-enforcer";
import {
    calculateFinancialBreakdown,
    formatCurrency,
    formatFinancialBreakdown,
} from "@/lib/formatters";

const EditablePricingTableComponent = ({ node, updateAttributes }: any) => {
    // 🎯 Fetch roles dynamically from API (Single Source of Truth)
    const [roles, setRoles] = useState<RoleRate[]>([]);
    const [rolesLoading, setRolesLoading] = useState(true);

    // Store raw data from node attrs
    const initialRowsRef = useRef(
        (
            node.attrs.rows || [
                { role: "", description: "", hours: 0, rate: 0 },
            ]
        ).map((row: any, idx: number) => ({
            ...row,
            id: row.id || `row-${idx}-${Date.now()}`,
        })),
    );

    // 🔒 CRITICAL FIX: Use useMemo to enforce roles BEFORE first render
    // This ensures rows are compliant from the very first render - no flicker
    const enforcedRows = useMemo(() => {
        if (roles.length === 0) {
            // Rate card not loaded yet - return empty to show loading
            return [];
        }

        try {
            console.log(
                "🔒 [Pricing Table] Applying mandatory role enforcement via useMemo...",
            );
            const compliantRows = enforceMandatoryRoles(
                initialRowsRef.current,
                roles,
            );

            // Validate
            const validation = validateMandatoryRoles(compliantRows);
            if (!validation.isValid) {
                console.error(
                    "❌ [Pricing Table] Validation failed after enforcement:",
                    validation.details,
                );
            } else {
                console.log(
                    "✅ [Pricing Table] Validation passed:",
                    validation.details,
                );
            }

            return compliantRows;
        } catch (error) {
            console.error("❌ [Pricing Table] Enforcement failed:", error);
            return initialRowsRef.current;
        }
    }, [roles]); // Recalculate only when roles change

    // State for rows (initialized from enforcedRows)
    const [rows, setRows] = useState<PricingRow[]>(enforcedRows);
    const [discount, setDiscount] = useState(node.attrs.discount || 0);
    const [showTotal, setShowTotal] = useState(node.attrs.showTotal !== false); // Default to true
    
    // 🎯 Save/Revert metadata tracking
    const [mode, setMode] = useState<'view' | 'edit'>(node.attrs.mode || 'view');
    const aiGeneratedDataRef = useRef<{ rows: PricingRow[]; discount: number } | null>(
        node.attrs.aiGeneratedData ? JSON.parse(node.attrs.aiGeneratedData) : null
    );
    
    // 🎯 Store AI-generated data on initial load if not already stored
    useEffect(() => {
        // Store AI data if:
        // 1. Not already stored
        // 2. We have rows (table is populated)
        // 3. Mode is 'view' (not yet edited) OR mode is not set (initial state)
        // 4. Rate card is loaded (so we have valid data)
        if (!aiGeneratedDataRef.current && rows.length > 0 && (mode === 'view' || !node.attrs.mode) && roles.length > 0) {
            console.log("💾 [Pricing Table] Storing initial AI-generated data");
            aiGeneratedDataRef.current = {
                rows: JSON.parse(JSON.stringify(rows)),
                discount,
            };
            // Persist to node attributes
            updateAttributes({
                aiGeneratedData: JSON.stringify(aiGeneratedDataRef.current),
                mode: 'view',
            });
        }
    }, [rows.length, mode, roles.length]); // Re-check when rows are populated or roles load

    // Update rows when enforcedRows changes (after rate card loads)
    // BUT: Don't overwrite if user has manually added rows
    const [isUserModified, setIsUserModified] = useState(false);
    
    useEffect(() => {
        // Only auto-update rows if user hasn't manually modified them
        if (enforcedRows.length > 0 && !isUserModified) {
            setRows(enforcedRows);
        }
    }, [enforcedRows, isUserModified]);

    // 🎯 CRITICAL FIX: Sync discount state with node.attrs.discount when it changes
    // Use ref to track if we're updating from internal state change to prevent loop
    const isInternalUpdateRef = useRef(false);
    
    useEffect(() => {
        // Skip if this is an internal update (we're the ones changing it)
        if (isInternalUpdateRef.current) {
            isInternalUpdateRef.current = false;
            return;
        }
        
        // Only sync if node.attrs actually changed from external source
        if (
            node.attrs.discount !== undefined &&
            node.attrs.discount !== discount
        ) {
            console.log(
                `🔍 [DISCOUNT DEBUG] Syncing discount from node.attrs: ${node.attrs.discount}%`,
            );
            setDiscount(node.attrs.discount);
        }
    }, [node.attrs.discount]); // Removed discount from deps to prevent loop

    // 🎯 Sync showTotal state with node.attrs.showTotal when it changes
    useEffect(() => {
        // Skip if this is an internal update
        if (isInternalUpdateRef.current) {
            return;
        }
        
        if (
            node.attrs.showTotal !== undefined &&
            node.attrs.showTotal !== showTotal
        ) {
            console.log(
                `🔍 [SHOW TOTAL DEBUG] Syncing showTotal from node.attrs: ${node.attrs.showTotal}`,
            );
            setShowTotal(node.attrs.showTotal);
        }
    }, [node.attrs.showTotal]); // Removed showTotal from deps to prevent loop

    // Drag and drop state
    const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);

    // Extract scope-related attributes from node
    const scopeName = node.attrs.scopeName || "";
    const scopeDescription = node.attrs.scopeDescription || "";
    const scopeIndex = node.attrs.scopeIndex || 0;
    const totalScopes = node.attrs.totalScopes || 1;
    const isMultiScope = totalScopes > 1;

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await fetch("/api/rate-card");
                const result = await response.json();
                if (result.success) {
                    setRoles(result.data);
                } else {
                    console.error(
                        "Failed to fetch rate card roles:",
                        result.error,
                    );
                }
            } catch (error) {
                console.error("Error fetching rate card roles:", error);
            } finally {
                setRolesLoading(false);
            }
        };
        fetchRoles();
    }, []);

    // 🔒 CRITICAL FIX: Prevent infinite loop by checking if values actually changed
    // and using useRef to track previous values
    const prevValuesRef = useRef({ rows, discount, showTotal });
    
    useEffect(() => {
        // Only update if values actually changed
        const prev = prevValuesRef.current;
        const rowsChanged = JSON.stringify(prev.rows) !== JSON.stringify(rows);
        const discountChanged = prev.discount !== discount;
        const showTotalChanged = prev.showTotal !== showTotal;
        
        if (rowsChanged || discountChanged || showTotalChanged) {
            // Mark as internal update to prevent sync loop
            isInternalUpdateRef.current = true;
            
            // Update ref before calling updateAttributes
            prevValuesRef.current = { rows, discount, showTotal };
            
            // Defer updateAttributes to a microtask to avoid flushSync errors
            // This prevents calling updateAttributes from within a React lifecycle
            Promise.resolve().then(() => {
                updateAttributes({ rows, discount, showTotal });
            });
        }
    }, [rows, discount, showTotal]); // Removed updateAttributes from deps to prevent loop

    const updateRow = (
        id: string,
        field: keyof PricingRow,
        value: string | number,
    ) => {
        setIsUserModified(true); // Mark as user-modified
        setMode('edit'); // Switch to edit mode when user makes changes
        setRows((prev) =>
            prev.map((row) => {
                if (row.id !== id) return row;
                if (field === "role") {
                    // 🔒 RATE CARD VALIDATION - No Fallback to AI Rate
                    const roleData = roles.find(
                        (r) => r.roleName === String(value),
                    );

                    if (!roleData) {
                        console.error(
                            `❌ [Pricing Table] Role "${value}" not found in Rate Card`,
                        );
                        alert(
                            `Role "${value}" is not in the official Rate Card. ` +
                                `Please select a role from the dropdown.`,
                        );
                        return row; // Don't update - keep previous valid role
                    }

                    // ALWAYS use canonical name and official rate from Rate Card
                    // NEVER trust or fallback to AI-provided rate
                    return {
                        ...row,
                        role: roleData.roleName,
                        rate: roleData.hourlyRate,
                    };
                }
                return { ...row, [field]: value };
            }),
        );
    };

    const addRow = () => {
        const newId = `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newRow: PricingRow = {
            id: newId,
            role: "",
            description: "",
            hours: 0,
            rate: 0,
        };
        
        console.log("➕ [Pricing Table] Adding new row:", newRow);
        console.log("➕ [Pricing Table] Current rows count:", rows.length);
        
        setIsUserModified(true); // Mark as user-modified to prevent enforcedRows from overwriting
        
        setRows((prevRows) => {
            const updatedRows = [...prevRows, newRow];
            console.log("➕ [Pricing Table] Updated rows count:", updatedRows.length);
            return updatedRows;
        });
    };

    const removeRow = (id: string) => {
        if (rows.length > 1) {
            setIsUserModified(true); // Mark as user-modified
            setRows(rows.filter((row) => row.id !== id));
        }
    };

    // Native HTML5 Drag-and-Drop Handlers
    const handleDragStart = (
        e: React.DragEvent<HTMLTableRowElement>,
        rowId: string,
    ) => {
        setDraggedRowId(rowId);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/html", rowId);
        (e.currentTarget as HTMLElement).style.opacity = "0.4";
    };

    const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
        (e.currentTarget as HTMLElement).style.opacity = "1";
        setDraggedRowId(null);
        setDropTargetId(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const targetRow = e.currentTarget;
        const targetId = targetRow.getAttribute("data-row-id");
        if (targetId && targetId !== draggedRowId) {
            setDropTargetId(targetId);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
        setDropTargetId(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLTableRowElement>) => {
        e.preventDefault();
        const targetRow = e.currentTarget;
        const targetId = targetRow.getAttribute("data-row-id");

        if (!draggedRowId || !targetId || draggedRowId === targetId) {
            setDropTargetId(null);
            return;
        }

        setRows((currentRows) => {
            const draggedIndex = currentRows.findIndex(
                (r) => r.id === draggedRowId,
            );
            const targetIndex = currentRows.findIndex((r) => r.id === targetId);

            if (draggedIndex === -1 || targetIndex === -1) return currentRows;

            const newRows = [...currentRows];
            const [draggedRow] = newRows.splice(draggedIndex, 1);
            newRows.splice(targetIndex, 0, draggedRow);

            return newRows;
        });

        setDropTargetId(null);
        setDraggedRowId(null);
    };

    // 💰 USE CENTRALIZED FINANCIAL CALCULATIONS
    // This ensures consistency across all displays and exports
    const financialBreakdown = calculateFinancialBreakdown(rows, discount);
    const formattedBreakdown = formatFinancialBreakdown(financialBreakdown);

    // Legacy function wrappers for backward compatibility
    const calculateSubtotal = () => financialBreakdown.subtotal;
    const calculateDiscount = () => financialBreakdown.discount;
    const calculateSubtotalAfterDiscount = () =>
        financialBreakdown.subtotalAfterDiscount;
    const calculateGST = () => financialBreakdown.gst;
    const calculateTotal = () => financialBreakdown.grandTotal;

    // Don't render table until rate card loads and enforcement completes
    // This ensures users NEVER see raw, non-compliant AI data
    if (rolesLoading || rows.length === 0) {
        return (
            <NodeViewWrapper className="editable-pricing-table my-6">
                <div className="border border-border rounded-lg p-8 bg-background dark:bg-gray-900/50 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                        <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2" />
                        <p>Loading pricing table...</p>
                    </div>
                </div>
            </NodeViewWrapper>
        );
    }

    return (
        <NodeViewWrapper className="editable-pricing-table my-6">
            <style>
                {`
          .pricing-row {
            transition: background-color 0.15s ease;
          }
          .pricing-row.drag-over {
            border-top: 3px solid #1CBF79;
          }
          .pricing-row.dragging {
            opacity: 0.4;
          }
          .drag-handle {
            opacity: 0.3;
            transition: opacity 0.2s;
            cursor: grab;
            user-select: none;
          }
          .drag-handle:active {
            cursor: grabbing;
          }
          .pricing-row:hover .drag-handle {
            opacity: 1;
          }
          /* Ensure role names display fully without truncation */
          .role-select {
            white-space: normal;
            overflow: visible;
            text-overflow: clip;
          }
          .role-select option {
            white-space: normal;
            word-wrap: break-word;
          }
          /* Hide pricing totals when parent has data-show-totals="false" */
          [data-show-totals="false"] .editable-pricing-table .pricing-total-summary {
            display: none;
          }
        `}
            </style>
            <div className="border border-border rounded-lg p-4 bg-background dark:bg-gray-900/50">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-foreground dark:text-gray-100">
                            {isMultiScope
                                ? scopeName
                                : scopeName || "Project Pricing"}
                        </h3>
                        {scopeDescription ? (
                            <p className="text-xs text-gray-400 mt-0.5">
                                {scopeDescription}
                            </p>
                        ) : (
                            <p className="text-xs text-gray-500 mt-0.5">
                                💡 Tip: Drag rows to reorder
                            </p>
                        )}
                        {isMultiScope && (
                            <p className="text-xs text-blue-600 mt-0.5">
                                📊 Scope {node.attrs.scopeIndex + 1} of{" "}
                                {totalScopes}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log("🔘 [Pricing Table] Add Role button clicked");
                                addRow();
                            }}
                            className="px-3 py-1 bg-[#0E0F0F] text-white rounded text-sm hover:bg-[#0E0F0F]/80 transition-colors cursor-pointer"
                            type="button"
                        >
                            + Add Role
                        </button>
                        
                        {/* 🎯 Save/Revert buttons for metadata tracking */}
                        {mode === 'view' && aiGeneratedDataRef.current && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log("🔄 [Pricing Table] Reverting to AI-generated data");
                                    const aiData = JSON.parse(JSON.stringify(aiGeneratedDataRef.current!));
                                    setRows(aiData.rows);
                                    setDiscount(aiData.discount);
                                    setMode('view');
                                    // Update node attributes
                                    updateAttributes({
                                        rows: aiData.rows,
                                        discount: aiData.discount,
                                        mode: 'view',
                                    });
                                    toast.success("✅ Reverted to AI-generated values");
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1.5"
                                type="button"
                                title="Revert to original AI-generated values"
                            >
                                <Undo2 className="w-3.5 h-3.5" />
                                Revert to AI
                            </button>
                        )}
                        
                        {mode === 'edit' && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log("💾 [Pricing Table] Saving edits and storing AI data");
                                    // Ensure AI-generated data is stored (should already be set on initial load)
                                    if (!aiGeneratedDataRef.current) {
                                        // Fallback: if somehow AI data wasn't stored, use current state
                                        // This shouldn't happen, but provides safety
                                        console.warn("⚠️ [Pricing Table] AI data not found, using current state as fallback");
                                        aiGeneratedDataRef.current = {
                                            rows: JSON.parse(JSON.stringify(rows)),
                                            discount,
                                        };
                                    }
                                    // Update node attributes with current edited state and metadata
                                    updateAttributes({
                                        rows,
                                        discount,
                                        mode: 'edit',
                                        aiGeneratedData: JSON.stringify(aiGeneratedDataRef.current),
                                    });
                                    toast.success("✅ Edits saved with metadata tracking");
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors cursor-pointer flex items-center gap-1.5"
                                type="button"
                                title="Save edits and track original AI values"
                            >
                                <Save className="w-3.5 h-3.5" />
                                Save Edits
                            </button>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto mb-4">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#0E0F0F] text-white">
                                <th className="border border-border px-3 py-2 text-left text-sm">
                                    Role
                                </th>
                                <th className="border border-border px-3 py-2 text-left text-sm">
                                    Description
                                </th>
                                <th className="border border-border px-3 py-2 text-left text-sm w-24">
                                    Hours
                                </th>
                                <th className="border border-border px-3 py-2 text-left text-sm w-24">
                                    Rate
                                </th>
                                <th className="border border-border px-3 py-2 text-right text-sm w-32">
                                    Cost
                                </th>
                                <th className="border border-border px-3 py-2 text-center text-sm w-16">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.id}
                                    data-row-id={row.id}
                                    draggable="true"
                                    onDragStart={(e) =>
                                        handleDragStart(e, row.id)
                                    }
                                    onDragEnd={handleDragEnd}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`pricing-row hover:bg-muted dark:bg-gray-800 ${dropTargetId === row.id ? "drag-over" : ""} ${draggedRowId === row.id ? "dragging" : ""}`}
                                >
                                    <td
                                        className="border border-border p-2"
                                        style={{ width: "30%" }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="drag-handle text-gray-400 select-none text-lg"
                                                title="Drag to reorder"
                                            >
                                                ⋮⋮
                                            </span>
                                            <select
                                                value={row.role}
                                                onChange={(e) =>
                                                    updateRow(
                                                        row.id,
                                                        "role",
                                                        e.target.value,
                                                    )
                                                }
                                                title={row.role}
                                                className="role-select w-full text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CBF79] focus:border-[#1CBF79] hover:border-gray-400 dark:hover:border-gray-600"
                                            >
                                                <option
                                                    className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200"
                                                    value=""
                                                >
                                                    {rolesLoading
                                                        ? "Loading roles..."
                                                        : "Select role..."}
                                                </option>
                                                {roles.map((role) => (
                                                    <option
                                                        key={role.roleName}
                                                        value={role.roleName}
                                                        className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                    >
                                                        {role.roleName} - $
                                                        {role.hourlyRate}/hr
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>
                                    <td
                                        className="border border-border p-2"
                                        style={{ width: "25%" }}
                                    >
                                        <input
                                            type="text"
                                            value={row.description}
                                            onChange={(e) =>
                                                updateRow(
                                                    row.id,
                                                    "description",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Description..."
                                            className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-[#1CBF79] text-sm"
                                        />
                                    </td>
                                    <td
                                        className="border border-border p-2"
                                        style={{ width: "15%" }}
                                    >
                                        <input
                                            type="number"
                                            value={row.hours || ""}
                                            onChange={(e) =>
                                                updateRow(
                                                    row.id,
                                                    "hours",
                                                    parseFloat(
                                                        e.target.value,
                                                    ) || 0,
                                                )
                                            }
                                            placeholder="0"
                                            min="0"
                                            step="0.5"
                                            className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-[#1CBF79] text-sm text-right"
                                        />
                                    </td>
                                    <td
                                        className="border border-border p-2"
                                        style={{ width: "15%" }}
                                    >
                                        <input
                                            type="number"
                                            value={row.rate || ""}
                                            onChange={(e) =>
                                                updateRow(
                                                    row.id,
                                                    "rate",
                                                    parseFloat(
                                                        e.target.value,
                                                    ) || 0,
                                                )
                                            }
                                            placeholder="$0"
                                            min="0"
                                            className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-[#1CBF79] text-sm text-right"
                                        />
                                    </td>
                                    <td
                                        className="border border-border px-3 py-2 text-right text-sm font-semibold"
                                        style={{ width: "15%" }}
                                    >
                                        ${((Number(row.hours) || 0) * (Number(row.rate) || 0)).toFixed(2)}{" "}
                                        +GST
                                    </td>
                                    <td
                                        className="border border-border p-2 text-center"
                                        style={{ width: "5%" }}
                                    >
                                        <button
                                            onClick={() => removeRow(row.id)}
                                            disabled={rows.length === 1}
                                            className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed text-lg"
                                        >
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end pricing-total-summary">
                    <div className="w-full max-w-md">
                        {/* Toggle Total Visibility Button */}
                        <div className="flex justify-end mb-2">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const newShowTotal = !showTotal;
                                    setShowTotal(newShowTotal);
                                    console.log("👁️ [Pricing Table] Toggling total visibility:", newShowTotal);
                                }}
                                className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors text-gray-700 dark:text-gray-200"
                                type="button"
                            >
                                {showTotal ? "👁️ Hide Total" : "👁️‍🗨️ Show Total"}
                            </button>
                        </div>
                        {showTotal && (
                        <div className="bg-muted dark:bg-gray-800 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between items-center text-sm text-foreground dark:text-gray-100">
                                <span>Discount (%):</span>
                                <input
                                    type="number"
                                    value={discount}
                                    onChange={(e) =>
                                        setDiscount(
                                            parseFloat(e.target.value) || 0,
                                        )
                                    }
                                    min="0"
                                    max="100"
                                    className="w-20 px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-right"
                                />
                            </div>
                            <div className="flex justify-between text-sm text-foreground dark:text-gray-100">
                                <span>Subtotal (ex GST):</span>
                                <span className="font-semibold">
                                    ${calculateSubtotal().toFixed(2)}
                                </span>
                            </div>
                            {discount > 0 && (
                                <>
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span>Discount ({discount}%):</span>
                                        <span>
                                            -${calculateDiscount().toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-foreground dark:text-gray-100">
                                        <span>After Discount (ex GST):</span>
                                        <span className="font-semibold">
                                            ${calculateSubtotalAfterDiscount().toFixed(2)}
                                        </span>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between text-sm text-foreground dark:text-gray-100">
                                <span>GST (10%):</span>
                                <span>${calculateGST().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-foreground dark:text-gray-100 border-t border-border pt-2 mt-2">
                                <span>Total Project Value:</span>
                                <span className="text-[#0e2e33] dark:text-[#1CBF79]">
                                    ${calculateTotal().toFixed(2)} incl GST
                                </span>
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </div>
        </NodeViewWrapper>
    );
};

export const EditablePricingTable = Node.create({
    name: "editablePricingTable",

    group: "block",

    atom: true,

    addAttributes() {
        return {
            rows: {
                default: [
                    {
                        id: "row-0",
                        role: "",
                        description: "",
                        hours: 0,
                        rate: 0,
                    },
                ],
            },
            discount: {
                default: 0,
            },
            scopeName: {
                default: "",
            },
            scopeDescription: {
                default: "",
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="editable-pricing-table"]',
            },
        ];
    },

    renderHTML({ node, HTMLAttributes }) {
        const rows: PricingRow[] = node.attrs.rows || [];
        const discount = node.attrs.discount || 0;

        const subtotal = rows.reduce(
            (sum, row) => sum + (Number(row.hours) || 0) * (Number(row.rate) || 0),
            0,
        );
        const discountAmount = (subtotal * discount) / 100;
        const subtotalAfterDiscount = subtotal - discountAmount;
        const gst = subtotalAfterDiscount * 0.1;
        const total = subtotalAfterDiscount + gst;

        const tableContent: any[] = [
            "table",
            {
                style: "width:100%; border-collapse:collapse; margin:1.5rem 0; border:2px solid #0e2e33;",
            },
            [
                "thead",
                {},
                [
                    "tr",
                    {},
                    [
                        "th",
                        {
                            style: "background:#0e2e33; color:white; padding:0.875rem 1rem; text-align:left; border:1px solid #0e2e33;",
                        },
                        "Role",
                    ],
                    [
                        "th",
                        {
                            style: "background:#0e2e33; color:white; padding:0.875rem 1rem; text-align:left; border:1px solid #0e2e33;",
                        },
                        "Description",
                    ],
                    [
                        "th",
                        {
                            style: "background:#0e2e33; color:white; padding:0.875rem 1rem; text-align:right; border:1px solid #0e2e33;",
                        },
                        "Hours",
                    ],
                    [
                        "th",
                        {
                            style: "background:#0e2e33; color:white; padding:0.875rem 1rem; text-align:right; border:1px solid #0e2e33;",
                        },
                        "Rate",
                    ],
                    [
                        "th",
                        {
                            style: "background:#0e2e33; color:white; padding:0.875rem 1rem; text-align:right; border:1px solid #0e2e33;",
                        },
                        "Total",
                    ],
                ],
            ],
            [
                "tbody",
                {},
                ...rows.map((row, index) => {
                    // Ensure numeric types for calculations
                    const hours = Number(row.hours) || 0;
                    const rate = Number(row.rate) || 0;
                    const rowTotal = hours * rate;
                    const bgColor = index % 2 === 0 ? "#f9fafb" : "white";
                    return [
                        "tr",
                        { style: `background:${bgColor};` },
                        [
                            "td",
                            {
                                style: "padding:0.875rem 1rem; border:1px solid #d1d5db;",
                            },
                            row.role,
                        ],
                        [
                            "td",
                            {
                                style: "padding:0.875rem 1rem; border:1px solid #d1d5db;",
                            },
                            row.description || "",
                        ],
                        [
                            "td",
                            {
                                style: "padding:0.875rem 1rem; border:1px solid #d1d5db; text-align:right;",
                            },
                            hours.toString(),
                        ],
                        [
                            "td",
                            {
                                style: "padding:0.875rem 1rem; border:1px solid #d1d5db; text-align:right;",
                            },
                            `$${rate.toFixed(2)}`,
                        ],
                        [
                            "td",
                            {
                                style: "padding:0.875rem 1rem; border:1px solid #d1d5db; text-align:right; font-weight:600;",
                            },
                            `$${rowTotal.toFixed(2)}`,
                        ],
                    ];
                }),
            ],
        ];

        // Optional scope header for PDF/HTML export
        const scopeHeader: any[] = [];
        if (node.attrs.scopeName) {
            scopeHeader.push([
                "div",
                { style: "margin-bottom:0.5rem;" },
                [
                    "h4",
                    {
                        style: "margin:0; font-size:1rem; color:#0e2e33; font-weight:700;",
                    },
                    node.attrs.scopeName,
                ],
            ]);
            if (node.attrs.scopeDescription) {
                scopeHeader.push([
                    "div",
                    { style: "margin-bottom:0.75rem; color:#374151;" },
                    node.attrs.scopeDescription,
                ]);
            }
        }

        const totalsSection: any[] = [
            "div",
            {
                style: "margin-top:1.5rem; padding-top:1rem; border-top:2px solid #0e2e33;",
            },
            [
                "div",
                { style: "max-width:400px; margin-left:auto;" },
                [
                    "div",
                    {
                        style: "display:flex; justify-content:space-between; padding:0.5rem 0;",
                    },
                    [
                        "span",
                        { style: "font-weight:600; color:#0e2e33;" },
                        "Subtotal:",
                    ],
                    [
                        "span",
                        { style: "font-weight:600; color:#0e2e33;" },
                        `$${subtotal.toFixed(2)}`,
                    ],
                ],
                ...(discount > 0
                    ? [
                          [
                              "div",
                              {
                                  style: "display:flex; justify-content:space-between; padding:0.5rem 0; color:#ef4444;",
                              },
                              ["span", {}, `Discount (${discount}%):`],
                              ["span", {}, `-$${discountAmount.toFixed(2)}`],
                          ],
                          [
                              "div",
                              {
                                  style: "display:flex; justify-content:space-between; padding:0.5rem 0;",
                              },
                              [
                                  "span",
                                  { style: "font-weight:600;" },
                                  "Subtotal After Discount:",
                              ],
                              [
                                  "span",
                                  { style: "font-weight:600;" },
                                  `$${subtotalAfterDiscount.toFixed(2)}`,
                              ],
                          ],
                      ]
                    : []),
                [
                    "div",
                    {
                        style: "display:flex; justify-content:space-between; padding:0.5rem 0;",
                    },
                    ["span", {}, "GST (10%):"],
                    ["span", {}, `$${gst.toFixed(2)}`],
                ],
                [
                    "div",
                    {
                        style: "display:flex; justify-content:space-between; padding:0.75rem 0; border-top:2px solid #0e2e33; margin-top:0.5rem;",
                    },
                    [
                        "span",
                        {
                            style: "font-size:1.25rem; font-weight:700; color:#0e2e33;",
                        },
                        "Total Investment:",
                    ],
                    [
                        "span",
                        {
                            style: "font-size:1.25rem; font-weight:700; color:#0e2e33;",
                        },
                        `$${total.toFixed(2)}`,
                    ],
                ],
            ],
        ];

        return [
            "div",
            mergeAttributes(HTMLAttributes, {
                "data-type": "editable-pricing-table",
            }),
            ...scopeHeader,
            tableContent,
            totalsSection,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(EditablePricingTableComponent);
    },
});
