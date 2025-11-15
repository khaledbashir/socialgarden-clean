"use client";

import { useState } from "react";
import { Plus, Trash2, Calculator, GripVertical } from "lucide-react";
import { Button } from "./ui/button";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

// Social Garden 82 roles with AUD rates
const ROLES = [
  { name: "Project Manager", rate: 160 },
  { name: "Project Coordination", rate: 140 },
  { name: "Account Management", rate: 150 },
  { name: "Strategy Director", rate: 180 },
  { name: "Senior Strategist", rate: 160 },
  { name: "Strategist", rate: 140 },
  { name: "Creative Director", rate: 180 },
  { name: "Senior Art Director", rate: 160 },
  { name: "Art Director", rate: 140 },
  { name: "Senior Copywriter", rate: 160 },
  { name: "Copywriter", rate: 140 },
  { name: "Senior Designer", rate: 150 },
  { name: "Designer", rate: 130 },
  { name: "Junior Designer", rate: 110 },
  { name: "Senior UX Designer", rate: 160 },
  { name: "UX Designer", rate: 140 },
  { name: "Senior UI Designer", rate: 160 },
  { name: "UI Designer", rate: 140 },
  { name: "Motion Designer", rate: 150 },
  { name: "Senior Motion Designer", rate: 170 },
  { name: "3D Designer", rate: 160 },
  { name: "Illustrator", rate: 150 },
  { name: "Photographer", rate: 180 },
  { name: "Videographer", rate: 180 },
  { name: "Video Editor", rate: 150 },
  { name: "Sound Designer", rate: 140 },
  { name: "Technical Director", rate: 180 },
  { name: "Senior Developer", rate: 160 },
  { name: "Developer", rate: 140 },
  { name: "Junior Developer", rate: 120 },
  { name: "Front-End Developer", rate: 150 },
  { name: "Senior Front-End Developer", rate: 170 },
  { name: "Back-End Developer", rate: 160 },
  { name: "Senior Back-End Developer", rate: 180 },
  { name: "Full-Stack Developer", rate: 160 },
  { name: "Senior Full-Stack Developer", rate: 180 },
  { name: "DevOps Engineer", rate: 170 },
  { name: "Senior DevOps Engineer", rate: 190 },
  { name: "QA Engineer", rate: 140 },
  { name: "Senior QA Engineer", rate: 160 },
  { name: "Data Analyst", rate: 150 },
  { name: "Senior Data Analyst", rate: 170 },
  { name: "SEO Specialist", rate: 140 },
  { name: "Senior SEO Specialist", rate: 160 },
  { name: "Content Strategist", rate: 140 },
  { name: "Senior Content Strategist", rate: 160 },
  { name: "Social Media Manager", rate: 130 },
  { name: "Senior Social Media Manager", rate: 150 },
  { name: "Community Manager", rate: 120 },
  { name: "Email Marketing Specialist", rate: 130 },
  { name: "Senior Email Marketing Specialist", rate: 150 },
  { name: "Marketing Automation Specialist", rate: 150 },
  { name: "CRM Specialist", rate: 140 },
  { name: "Senior CRM Specialist", rate: 160 },
  { name: "Web Analytics Specialist", rate: 150 },
  { name: "Conversion Rate Optimization Specialist", rate: 160 },
  { name: "UX Researcher", rate: 150 },
  { name: "Senior UX Researcher", rate: 170 },
  { name: "Product Manager", rate: 170 },
  { name: "Senior Product Manager", rate: 190 },
  { name: "Business Analyst", rate: 150 },
  { name: "Senior Business Analyst", rate: 170 },
  { name: "Scrum Master", rate: 160 },
  { name: "Agile Coach", rate: 180 },
  { name: "Solutions Architect", rate: 190 },
  { name: "Enterprise Architect", rate: 200 },
  { name: "Security Specialist", rate: 170 },
  { name: "Senior Security Specialist", rate: 190 },
  { name: "Cloud Architect", rate: 190 },
  { name: "Database Administrator", rate: 160 },
  { name: "Senior Database Administrator", rate: 180 },
  { name: "Systems Administrator", rate: 150 },
  { name: "Network Engineer", rate: 160 },
  { name: "Support Engineer", rate: 130 },
  { name: "Senior Support Engineer", rate: 150 },
  { name: "Training Specialist", rate: 140 },
  { name: "Documentation Specialist", rate: 130 },
  { name: "Accessibility Specialist", rate: 150 },
  { name: "Localization Specialist", rate: 140 },
  { name: "Brand Manager", rate: 160 },
  { name: "Production Manager", rate: 150 },
  { name: "Traffic Manager", rate: 130 },
];

interface PricingRow {
  id: string;
  role: string;
  description: string;
  hours: number;
  rate: number;
  isHeader?: boolean; // Add optional isHeader property
}

interface PricingTableBuilderProps {
  onInsertTable: (markdown: string) => void;
}

// Header Row Component (non-sortable, but editable)
function HeaderRow({ row, updateRow }: { row: PricingRow; updateRow: (id: string, field: keyof PricingRow, value: string | number) => void }) {
  return (
    <div className="col-span-13 bg-gradient-to-r from-[#2C823D]/10 to-[#2C823D]/5 border-l-4 border-[#2C823D] p-4 rounded-lg mb-2">
      <div className="flex items-center gap-2">
        <Input
          value={row.role}
          onChange={(e) => updateRow(row.id, "role", e.target.value)}
          className="text-lg font-semibold text-[#2C823D] bg-transparent border-none shadow-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="Enter scope name..."
        />
      </div>
    </div>
  );
}

// Sortable Row Component
function SortableRow({
  row,
  index,
  updateRow,
  removeRow,
  isOnlyRow,
  totalRows
}: {
  row: PricingRow;
  index: number;
  updateRow: (id: string, field: keyof PricingRow, value: string | number) => void;
  removeRow: (id: string) => void;
  isOnlyRow: boolean;
  totalRows: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-13 gap-3 p-3 bg-muted/30 rounded-lg items-end"
    >
      {/* Drag Handle with Row Number */}
      <div className="col-span-12 md:col-span-1 flex items-center justify-center gap-1">
        {index === 0 && <Label className="text-xs mb-1 block w-full text-center">Order</Label>}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-muted-foreground min-w-[20px] text-center">
            {index + 1}
          </span>
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing h-9 w-9 flex items-center justify-center hover:bg-muted rounded p-2"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Role Selector */}
      <div className="col-span-12 md:col-span-2">
        {index === 0 && <Label className="text-xs mb-1 block">Role</Label>}
        <Select
          value={row.role}
          onValueChange={(value) => updateRow(row.id, "role", value)}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {ROLES.map((role) => (
              <SelectItem key={role.name} value={role.name}>
                {role.name} - ${role.rate}/hr
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="col-span-12 md:col-span-3">
        {index === 0 && <Label className="text-xs mb-1 block">Description</Label>}
        <Input
          placeholder="Role description"
          value={row.description}
          onChange={(e) => updateRow(row.id, "description", e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      {/* Hours */}
      <div className="col-span-6 md:col-span-2">
        {index === 0 && <Label className="text-xs mb-1 block">Hours</Label>}
        <Input
          type="number"
          placeholder="0"
          value={row.hours || ""}
          onChange={(e) => updateRow(row.id, "hours", parseFloat(e.target.value) || 0)}
          className="h-9 text-sm"
          min="0"
          step="0.5"
        />
      </div>

      {/* Rate */}
      <div className="col-span-6 md:col-span-2">
        {index === 0 && <Label className="text-xs mb-1 block">Rate ($)</Label>}
        <Input
          type="number"
          placeholder="$0"
          value={row.rate || ""}
          onChange={(e) => updateRow(row.id, "rate", parseFloat(e.target.value) || 0)}
          className="h-9 text-sm"
          min="0"
        />
      </div>

      {/* Cost */}
      <div className="col-span-6 md:col-span-2">
        {index === 0 && <Label className="text-xs mb-1 block">Cost ($)</Label>}
        <div className="h-9 flex items-center px-3 bg-muted rounded-md text-sm font-semibold">
          ${(row.hours * row.rate).toFixed(2)}
        </div>
      </div>

      {/* Delete Button */}
      <div className="col-span-12 md:col-span-1 flex items-center justify-center">
        {index === 0 && <Label className="text-xs mb-1 block w-full">Actions</Label>}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeRow(row.id)}
          disabled={isOnlyRow}
          className="h-9 w-9 p-0"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export default function PricingTableBuilder({ onInsertTable }: PricingTableBuilderProps) {
  const [rows, setRows] = useState<PricingRow[]>([
    { id: "1", role: "", description: "", hours: 0, rate: 0, isHeader: false },
  ]);
  const [discount, setDiscount] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setRows((items) => {
        // Only allow reordering of non-header rows
        const nonHeaderRows = items.filter(item => !item.isHeader);
        const oldIndex = nonHeaderRows.findIndex((item) => item.id === active.id);
        const newIndex = nonHeaderRows.findIndex((item) => item.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedNonHeaders = arrayMove(nonHeaderRows, oldIndex, newIndex);
          
          // Rebuild the full array with headers in their original positions
          const result: PricingRow[] = [];
          let nonHeaderIndex = 0;
          
          items.forEach(item => {
            if (item.isHeader) {
              result.push(item);
            } else {
              result.push(reorderedNonHeaders[nonHeaderIndex]);
              nonHeaderIndex++;
            }
          });
          
          return result;
        }
        
        return items;
      });
    }
  };

  const addRow = () => {
    setRows([
      ...rows,
      { id: Date.now().toString(), role: "", description: "", hours: 0, rate: 0, isHeader: false },
    ]);
  };

  const addScopeHeader = () => {
    const scopeNumber = rows.filter(row => row.isHeader).length + 1;
    setRows([
      ...rows,
      {
        id: Date.now().toString(),
        role: `📍 Scope ${scopeNumber}: [Scope Name]`,
        description: "",
        hours: 0,
        rate: 0,
        isHeader: true
      },
    ]);
  };

  const removeRow = (id: string) => {
    const rowToRemove = rows.find((row) => row.id === id);
    // Don't allow removing header rows or if it's the only row
    if (rowToRemove && !rowToRemove.isHeader && rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof PricingRow, value: string | number) => {
    setRows(
      rows.map((row) => {
        if (row.id === id) {
          // Allow editing role field for header rows, but all fields for regular rows
          if (row.isHeader) {
            // For header rows, only allow editing the role field
            if (field === "role") {
              return { ...row, [field]: value };
            }
            return row; // Don't update other fields for header rows
          } else {
            // For regular rows, handle role selection logic
            if (field === "role") {
              const selectedRole = ROLES.find((r) => r.name === value);
              return {
                ...row,
                role: value as string,
                rate: selectedRole?.rate || row.rate,
              };
            }
            return { ...row, [field]: value };
          }
        }
        return row;
      })
    );
  };

  const calculateSubtotal = () => {
    return rows.reduce((sum, row) => {
      // Only calculate subtotal for non-header rows
      if (!row.isHeader) {
        return sum + row.hours * row.rate;
      }
      return sum;
    }, 0);
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

  const generateMarkdown = () => {
    let markdown = "## Project Pricing\n\n";
    markdown += "| Role | Description | Hours | Rate (AUD) | Cost (AUD) |\n";
    markdown += "|------|-------------|-------|------------|------------|\n";

    rows.forEach((row) => {
      if (row.isHeader) {
        // Add scope headers as section breaks in markdown
        markdown += `| **${row.role}** | | | | |\n`;
      } else if (row.role && row.hours > 0) {
        const cost = row.hours * row.rate;
        markdown += `| ${row.role} | ${row.description} | ${row.hours} | $${row.rate} | $${cost.toFixed(2)} |\n`;
      }
    });

    markdown += "\n### Summary\n\n";
    markdown += "| Description | Amount (AUD) |\n";
    markdown += "|-------------|-------------|\n";
    markdown += `| Subtotal | $${calculateSubtotal().toFixed(2)} |\n`;

    if (discount > 0) {
      markdown += `| Discount (${discount}%) | -$${calculateDiscount().toFixed(2)} |\n`;
      markdown += `| Subtotal after discount | $${calculateSubtotalAfterDiscount().toFixed(2)} |\n`;
    }

    markdown += `| GST (10%) | $${calculateGST().toFixed(2)} |\n`;
    markdown += `| **Total Project Value** | **$${calculateTotal().toFixed(2)}** |\n`;

    return markdown;
  };

  const handleInsert = () => {
    const markdown = generateMarkdown();
    onInsertTable(markdown);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-background border border-border rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Build Pricing Table</h2>
        <div className="flex gap-2">
          <Button onClick={addScopeHeader} size="sm" variant="outline" className="border-[#2C823D] text-[#2C823D] hover:bg-[#2C823D]/10">
            <Plus className="h-4 w-4 mr-1" />
            Add Scope Header
          </Button>
          <Button onClick={addRow} size="sm" className="bg-[#2C823D] hover:bg-[#25703A]">
            <Plus className="h-4 w-4 mr-1" />
            Add Role
          </Button>
          <Button onClick={handleInsert} size="sm" variant="default">
            <Calculator className="h-4 w-4 mr-1" />
            Insert into SOW
          </Button>
        </div>
      </div>

      {/* Roles Table */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          <SortableContext
            items={rows.filter(row => !row.isHeader).map((row) => row.id)}
            strategy={verticalListSortingStrategy}
          >
            {rows.map((row, index) => {
              // Calculate the actual index for non-header rows (for drag and drop)
              const nonHeaderRows = rows.filter(r => !r.isHeader);
              const actualIndex = nonHeaderRows.findIndex(r => r.id === row.id);
              
              return row.isHeader ? (
                <HeaderRow key={row.id} row={row} updateRow={updateRow} />
              ) : (
                <SortableRow
                  key={row.id}
                  row={row}
                  index={actualIndex}
                  updateRow={updateRow}
                  removeRow={removeRow}
                  isOnlyRow={nonHeaderRows.length === 1}
                  totalRows={nonHeaderRows.length}
                />
              );
            })}
          </SortableContext>
        </div>
      </DndContext>

      {/* Discount & Summary */}
      <div className="border-t border-border pt-4 mt-4">
        <div className="grid grid-cols-2 gap-6">
          {/* Discount Control */}
          <div className="space-y-2">
            <Label>Discount (%)</Label>
            <Input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0"
              max="100"
              step="1"
              className="w-full"
            />
          </div>

          {/* Summary */}
          <div className="bg-[#2C823D]/10 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount ({discount}%):</span>
                  <span>-${calculateDiscount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>After Discount:</span>
                  <span className="font-semibold">
                    ${calculateSubtotalAfterDiscount().toFixed(2)}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm">
              <span>GST (10%):</span>
              <span>${calculateGST().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-[#2C823D] pt-2 mt-2">
              <span>Total:</span>
              <span className="text-[#2C823D]">${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
