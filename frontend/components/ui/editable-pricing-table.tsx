"use client";

import React, { useState, useMemo, useCallback } from "react";
import { RATE_CARD_MAP } from "@/lib/rateCard";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/tailwind/ui/button";
import { Input } from "@/components/tailwind/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/tailwind/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/tailwind/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/tailwind/ui/popover";

type PricingTableRow = {
  id: string;
  role: string;
  hours: number;
  rate: number;
};

const initialRoles = [
  {
    id: `role-${Date.now()}-1`,
    role: "Tech - Head Of- Senior Project Management",
    hours: 0,
    rate: RATE_CARD_MAP["Tech - Head Of- Senior Project Management"] ?? 0,
  },
  {
    id: `role-${Date.now()}-2`,
    role: "Tech - Delivery - Project Coordination",
    hours: 0,
    rate: RATE_CARD_MAP["Tech - Delivery - Project Coordination"] ?? 0,
  },
  {
    id: `role-${Date.now()}-3`,
    role: "Account Management - (Account Manager)",
    hours: 0,
    rate: RATE_CARD_MAP["Account Management - (Account Manager)"] ?? 0,
  },
];

const roleOptions = Object.keys(RATE_CARD_MAP);

const formatCurrency = (value: number) => `AUD ${value.toFixed(2)}`;

const SortableRow = ({ row, onUpdate, onRemove, children }: { row: PricingTableRow, onUpdate: (id: string, data: Partial<PricingTableRow>) => void, onRemove: (id: string) => void, children: React.ReactNode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes}>
      <TableCell className="cursor-grab">
        <div {...listeners} className="flex items-center">
          <GripVertical size={18} />
        </div>
      </TableCell>
      {children}
    </TableRow>
  );
};


export const EditablePricingTable = () => {
  const [rows, setRows] = useState<PricingTableRow[]>(initialRoles);
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddRole = () => {
    const newId = `role-${Date.now()}-${rows.length + 1}`;
    setRows([
      ...rows,
      { id: newId, role: "", hours: 0, rate: 0 },
    ]);
  };

  const handleRemoveRole = (id: string) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const handleUpdateRow = (id: string, data: Partial<PricingTableRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...data } : row)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRows((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        let newItems = arrayMove(items, oldIndex, newIndex);

        // Auto-sort mandatory Account Management role to the bottom
        const accountManagementRow = newItems.find(item => item.role === "Account Management - (Account Manager)");
        if (accountManagementRow) {
          newItems = newItems.filter(item => item.role !== "Account Management - (Account Manager)");
          newItems.push(accountManagementRow);
        }

        return newItems;
      });
    }
  };

  const { subtotal, gst, total, roundedTotal } = useMemo(() => {
    const subtotal = rows.reduce((acc, row) => acc + row.hours * row.rate, 0);
    const gst = subtotal * 0.1;
    const total = subtotal + gst;
    const roundedTotal = Math.round(total / 100) * 100;
    return { subtotal, gst, total, roundedTotal };
  }, [rows]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: "40px" }}></TableHead>
            <TableHead>Role</TableHead>
            <TableHead style={{ width: "100px" }}>Hours</TableHead>
            <TableHead style={{ width: "150px" }}>Rate</TableHead>
            <TableHead style={{ width: "150px" }} className="text-right">Sub-Total</TableHead>
            <TableHead style={{ width: "50px" }}></TableHead>
          </TableRow>
        </TableHeader>
        <SortableContext items={rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
          <TableBody>
            {rows.map((row) => (
              <SortableRow key={row.id} row={row} onUpdate={handleUpdateRow} onRemove={handleRemoveRole}>
                <TableCell>
                  <Popover open={openPopover === row.id} onOpenChange={(isOpen) => setOpenPopover(isOpen ? row.id : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        {row.role || "Select a role"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="p-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
                      style={{ width: "400px", zIndex: 50 }}
                    >
                      <Command className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                        <CommandInput placeholder="Search roles..." className="placeholder:text-gray-500" />
                        <CommandList className="bg-white dark:bg-gray-900">
                          <CommandEmpty className="text-gray-600 dark:text-gray-300">No roles found.</CommandEmpty>
                          <CommandGroup>
                            {roleOptions.map((role) => (
                              <CommandItem
                                key={role}
                                className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-100 [&[data-selected=true]]:bg-gray-100 dark:[&[data-selected=true]]:bg-gray-800"
                                onSelect={() => {
                                  handleUpdateRow(row.id, {
                                    role,
                                    rate: RATE_CARD_MAP[role] ?? 0,
                                  });
                                  setOpenPopover(null);
                                }}
                              >
                                {role}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={row.hours}
                    onChange={(e) => handleUpdateRow(row.id, { hours: parseInt(e.target.value, 10) || 0 })}
                    className="w-full"
                  />
                </TableCell>
                <TableCell>{formatCurrency(row.rate)}</TableCell>
                <TableCell className="text-right">{`${formatCurrency(row.hours * row.rate)} +GST`}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveRole(row.id)}>
                    <Trash2 size={18} />
                  </Button>
                </TableCell>
              </SortableRow>
            ))}
          </TableBody>
        </SortableContext>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4} className="text-right font-bold">Subtotal</TableCell>
            <TableCell className="text-right font-bold">{formatCurrency(subtotal)}</TableCell>
            <TableCell />
          </TableRow>
          <TableRow>
            <TableCell colSpan={4} className="text-right font-bold">GST (10%)</TableCell>
            <TableCell className="text-right font-bold">{formatCurrency(gst)}</TableCell>
            <TableCell />
          </TableRow>
          <TableRow>
            <TableCell colSpan={4} className="text-right font-bold text-lg">Total Investment</TableCell>
            <TableCell className="text-right font-bold text-lg">{`${formatCurrency(roundedTotal)} +GST`}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
      <div className="mt-4">
        <Button onClick={handleAddRole}>Add Role</Button>
      </div>
    </DndContext>
  );
};