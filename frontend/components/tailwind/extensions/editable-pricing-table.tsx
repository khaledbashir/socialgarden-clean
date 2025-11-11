"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState, useEffect, useRef } from 'react';
import { ROLES as RATE_ROLES, RATE_CARD_MAP, getRateForRole } from '@/lib/rateCard';

// Use single source of truth for roles/rates
const ROLES = RATE_ROLES;

interface PricingRow {
  id: string;
  role: string;
  description: string;
  hours: number;
  rate: number;
}

const EditablePricingTableComponent = ({ node, updateAttributes }: any) => {
  const [rows, setRows] = useState<PricingRow[]>(
    (node.attrs.rows || [{ role: '', description: '', hours: 0, rate: 0 }]).map((row: any, idx: number) => ({
      ...row,
      id: row.id || `row-${idx}-${Date.now()}`
    }))
  );
  const [discount, setDiscount] = useState(node.attrs.discount || 0);
  const scopeName: string = node.attrs.scopeName || '';
  const scopeDescription: string = node.attrs.scopeDescription || '';
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  useEffect(() => {
    updateAttributes({ rows, discount });
  }, [rows, discount]);

  const updateRow = (id: string, field: keyof PricingRow, value: string | number) => {
    setRows((prev) => prev.map((row) => {
      if (row.id !== id) return row;
      if (field === 'role') {
        const rate = getRateForRole(value as string) || row.rate;
        return { ...row, role: value as string, rate };
      }
      return { ...row, [field]: value };
    }));
  };

  const addRow = () => {
    const newId = `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setRows([...rows, { id: newId, role: '', description: '', hours: 0, rate: 0 }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  // Native HTML5 Drag-and-Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, rowId: string) => {
    setDraggedRowId(rowId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', rowId);
    (e.currentTarget as HTMLElement).style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDraggedRowId(null);
    setDropTargetId(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const targetRow = e.currentTarget;
    const targetId = targetRow.getAttribute('data-row-id');
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
    const targetId = targetRow.getAttribute('data-row-id');
    
    if (!draggedRowId || !targetId || draggedRowId === targetId) {
      setDropTargetId(null);
      return;
    }

    setRows((currentRows) => {
      const draggedIndex = currentRows.findIndex(r => r.id === draggedRowId);
      const targetIndex = currentRows.findIndex(r => r.id === targetId);
      
      if (draggedIndex === -1 || targetIndex === -1) return currentRows;

      const newRows = [...currentRows];
      const [draggedRow] = newRows.splice(draggedIndex, 1);
      newRows.splice(targetIndex, 0, draggedRow);
      
      return newRows;
    });

    setDropTargetId(null);
    setDraggedRowId(null);
  };

  const calculateSubtotal = () => {
    return rows.reduce((sum, row) => sum + (row.hours * row.rate), 0);
  };

  const calculateDiscount = () => {
    return calculateSubtotal() * (discount / 100);
  };

  const calculateSubtotalAfterDiscount = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const calculateGST = () => {
    return calculateSubtotalAfterDiscount() * 0.1;
  };

  const calculateTotal = () => {
    return calculateSubtotalAfterDiscount() + calculateGST();
  };

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
          /* Hide pricing totals when parent has data-show-totals="false" */
          [data-show-totals="false"] .editable-pricing-table .pricing-total-summary {
            display: none;
          }
        `}
      </style>
      <div className="border border-border rounded-lg p-4 bg-background dark:bg-gray-900/50">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground dark:text-gray-100">{scopeName || 'Project Pricing'}</h3>
            {scopeDescription ? (
              <p className="text-xs text-gray-400 mt-0.5">{scopeDescription}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-0.5">💡 Tip: Drag rows to reorder</p>
            )}
          </div>
          <button
            onClick={addRow}
            className="px-3 py-1 bg-[#0E0F0F] text-white rounded text-sm hover:bg-[#0E0F0F]/80 transition-colors"
          >
            + Add Role
          </button>
        </div>
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#0E0F0F] text-white">
                <th className="border border-border px-3 py-2 text-left text-sm">Role</th>
                <th className="border border-border px-3 py-2 text-left text-sm">Description</th>
                <th className="border border-border px-3 py-2 text-left text-sm w-24">Hours</th>
                <th className="border border-border px-3 py-2 text-left text-sm w-24">Rate</th>
                <th className="border border-border px-3 py-2 text-right text-sm w-32">Cost</th>
                <th className="border border-border px-3 py-2 text-center text-sm w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  data-row-id={row.id}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, row.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`pricing-row hover:bg-muted dark:bg-gray-800 ${dropTargetId === row.id ? 'drag-over' : ''} ${draggedRowId === row.id ? 'dragging' : ''}`}
                >
                  <td className="border border-border p-2" style={{ width: '20%' }}>
                    <div className="flex items-center gap-2">
                      <span className="drag-handle text-gray-400 select-none text-lg" title="Drag to reorder">⋮⋮</span>
                      <select
                        value={row.role}
                        onChange={(e) => updateRow(row.id, 'role', e.target.value)}
                        className="w-full text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CBF79] focus:border-[#1CBF79] hover:border-gray-400 dark:hover:border-gray-600"
                      >
                        <option className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200" value="">Select role...</option>
                        {ROLES.map((role) => (
                          <option key={role.name} value={role.name} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                            {role.name} - ${role.rate}/hr
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="border border-border p-2" style={{ width: '30%' }}>
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                      placeholder="Description..."
                      className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-[#1CBF79] text-sm"
                    />
                  </td>
                  <td className="border border-border p-2" style={{ width: '15%' }}>
                    <input
                      type="number"
                      value={row.hours || ''}
                      onChange={(e) => updateRow(row.id, 'hours', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      step="0.5"
                      className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-[#1CBF79] text-sm text-right"
                    />
                  </td>
                  <td className="border border-border p-2" style={{ width: '15%' }}>
                    <input
                      type="number"
                      value={row.rate || ''}
                      onChange={(e) => updateRow(row.id, 'rate', parseFloat(e.target.value) || 0)}
                      placeholder="$0"
                      min="0"
                      className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-[#1CBF79] text-sm text-right"
                    />
                  </td>
                  <td className="border border-border px-3 py-2 text-right text-sm font-semibold" style={{ width: '15%' }}>
                    ${(row.hours * row.rate).toFixed(2)}
                  </td>
                  <td className="border border-border p-2 text-center" style={{ width: '5%' }}>
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
            <div className="bg-muted dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center text-sm text-foreground dark:text-gray-100">
                <span>Discount (%):</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  className="w-20 px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-right"
                />
              </div>
              <div className="flex justify-between text-sm text-foreground dark:text-gray-100">
                <span>Subtotal:</span>
                <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <>
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount ({discount}%):</span>
                    <span>-${calculateDiscount().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-foreground dark:text-gray-100">
                    <span>After Discount:</span>
                    <span className="font-semibold">${calculateSubtotalAfterDiscount().toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm text-foreground dark:text-gray-100">
                <span>GST (10%):</span>
                <span>${calculateGST().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-foreground dark:text-gray-100 border-t border-border pt-2 mt-2">
                <span>Total Project Value:</span>
                <span className="text-[#0e2e33] dark:text-[#1CBF79]">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const EditablePricingTable = Node.create({
  name: 'editablePricingTable',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      rows: {
        default: [{ id: 'row-0', role: '', description: '', hours: 0, rate: 0 }],
      },
      discount: {
        default: 0,
      },
      scopeName: {
        default: ''
      },
      scopeDescription: {
        default: ''
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
    
    const subtotal = rows.reduce((sum, row) => sum + (row.hours * row.rate), 0);
    const discountAmount = (subtotal * discount) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const gst = subtotalAfterDiscount * 0.10;
    const total = subtotalAfterDiscount + gst;
    
    const tableContent: any[] = [
      'table',
      { style: 'width:100%; border-collapse:collapse; margin:1.5rem 0; border:2px solid #0e2e33;' },
      [
        'thead',
        {},
        [
          'tr',
          {},
          ['th', { style: 'background:#0e2e33; color:white; padding:0.875rem 1rem; text-align:left; border:1px solid #0e2e33;' }, 'Role'],
          ['th', { style: 'background:#0e2e33; color:white; padding:0.875rem 1rem; text-align:left; border:1px solid #0e2e33;' }, 'Description'],
          ['th', { style: 'background:#0e2e33; color:white; padding:0.875rem 1rem; text-align:right; border:1px solid #0e2e33;' }, 'Hours'],
          ['th', { style: 'background:#0e2e33; color:white; padding:0.875rem 1rem; text-align:right; border:1px solid #0e2e33;' }, 'Rate'],
          ['th', { style: 'background:#0e2e33; color:white; padding:0.875rem 1rem; text-align:right; border:1px solid #0e2e33;' }, 'Total'],
        ]
      ],
      [
        'tbody',
        {},
        ...rows.map((row, index) => {
          const rowTotal = row.hours * row.rate;
          const bgColor = index % 2 === 0 ? '#f9fafb' : 'white';
          return [
            'tr',
            { style: `background:${bgColor};` },
            ['td', { style: 'padding:0.875rem 1rem; border:1px solid #d1d5db;' }, row.role],
            ['td', { style: 'padding:0.875rem 1rem; border:1px solid #d1d5db;' }, row.description || ''],
            ['td', { style: 'padding:0.875rem 1rem; border:1px solid #d1d5db; text-align:right;' }, row.hours.toString()],
            ['td', { style: 'padding:0.875rem 1rem; border:1px solid #d1d5db; text-align:right;' }, `$${row.rate.toFixed(2)}`],
            ['td', { style: 'padding:0.875rem 1rem; border:1px solid #d1d5db; text-align:right; font-weight:600;' }, `$${rowTotal.toFixed(2)}`],
          ];
        })
      ]
    ];
    
    // Optional scope header for PDF/HTML export
    const scopeHeader: any[] = [];
    if (node.attrs.scopeName) {
      scopeHeader.push(['div', { style: 'margin-bottom:0.5rem;'}, ['h4', { style: 'margin:0; font-size:1rem; color:#0e2e33; font-weight:700;' }, node.attrs.scopeName]]);
      if (node.attrs.scopeDescription) {
        scopeHeader.push(['div', { style: 'margin-bottom:0.75rem; color:#374151;' }, node.attrs.scopeDescription]);
      }
    }

    const totalsSection: any[] = [
      'div',
      { style: 'margin-top:1.5rem; padding-top:1rem; border-top:2px solid #0e2e33;' },
      [
        'div',
        { style: 'max-width:400px; margin-left:auto;' },
        ['div', { style: 'display:flex; justify-content:space-between; padding:0.5rem 0;' },
          ['span', { style: 'font-weight:600; color:#0e2e33;' }, 'Subtotal:'],
          ['span', { style: 'font-weight:600; color:#0e2e33;' }, `$${subtotal.toFixed(2)}`]
        ],
        ...(discount > 0 ? [
          ['div', { style: 'display:flex; justify-content:space-between; padding:0.5rem 0; color:#ef4444;' },
            ['span', {}, `Discount (${discount}%):`],
            ['span', {}, `-$${discountAmount.toFixed(2)}`]
          ],
          ['div', { style: 'display:flex; justify-content:space-between; padding:0.5rem 0;' },
            ['span', { style: 'font-weight:600;' }, 'Subtotal After Discount:'],
            ['span', { style: 'font-weight:600;' }, `$${subtotalAfterDiscount.toFixed(2)}`]
          ]
        ] : []),
        ['div', { style: 'display:flex; justify-content:space-between; padding:0.5rem 0;' },
          ['span', {}, 'GST (10%):'],
          ['span', {}, `$${gst.toFixed(2)}`]
        ],
        ['div', { style: 'display:flex; justify-content:space-between; padding:0.75rem 0; border-top:2px solid #0e2e33; margin-top:0.5rem;' },
          ['span', { style: 'font-size:1.25rem; font-weight:700; color:#0e2e33;' }, 'Total Investment:'],
          ['span', { style: 'font-size:1.25rem; font-weight:700; color:#0e2e33;' }, `$${total.toFixed(2)}`]
        ]
      ]
    ];
    
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'editable-pricing-table' }),
      ...scopeHeader,
      tableContent,
      totalsSection
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EditablePricingTableComponent);
  },
});
