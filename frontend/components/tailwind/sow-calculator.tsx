"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Plus, Trash2, FileDown, Calculator } from "lucide-react";
import { SOCIAL_GARDEN_KNOWLEDGE_BASE } from "@/lib/knowledge-base";

interface SOWLineItem {
  id: string;
  deliverable: string;
  role: string;
  hours: number;
  rate: number;
}

interface SOWCalculatorProps {
  onInsertToEditor?: (content: string) => void;
}

export default function SOWCalculator({ onInsertToEditor }: SOWCalculatorProps) {
  const [lineItems, setLineItems] = useState<SOWLineItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [showDiscount, setShowDiscount] = useState<boolean>(false);
  const [clientName, setClientName] = useState<string>("");
  const [projectTitle, setProjectTitle] = useState<string>("");

  const availableRoles = Object.entries(SOCIAL_GARDEN_KNOWLEDGE_BASE.rateCard).map(([key, value]) => ({
    key,
    name: value.role,
    rate: value.rate
  })).sort((a, b) => a.name.localeCompare(b.name));

  const addLineItem = () => {
    const newItem: SOWLineItem = {
      id: Date.now().toString(),
      deliverable: "New Deliverable",
      role: availableRoles[0].key,
      hours: 10,
      rate: availableRoles[0].rate
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (id: string, field: keyof SOWLineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'role') {
          const roleData = availableRoles.find(r => r.key === value);
          if (roleData) {
            updated.rate = roleData.rate;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const calculateItemCost = (hours: number, rate: number) => hours * rate;
  const subtotal = lineItems.reduce((sum, item) => sum + calculateItemCost(item.hours, item.rate), 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  const roleSummary = lineItems.reduce((acc, item) => {
    const roleName = availableRoles.find(r => r.key === item.role)?.name || item.role;
    if (!acc[roleName]) {
      acc[roleName] = { hours: 0, cost: 0, rate: item.rate };
    }
    acc[roleName].hours += item.hours;
    acc[roleName].cost += calculateItemCost(item.hours, item.rate);
    return acc;
  }, {} as Record<string, { hours: number; cost: number; rate: number }>);

  const generateSOWContent = () => {
    if (!clientName || !projectTitle || lineItems.length === 0) return "";
    const content = `# Statement of Work: ${projectTitle}

**Client:** ${clientName}
**Date:** ${new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })}
**Total Investment:** AUD ${total.toLocaleString('en-AU', { minimumFractionDigits: 2 })} +GST

## Pricing Summary by Role

| Role | Hours | Hourly Rate | Total Cost |
|------|-------|-------------|------------|
${Object.entries(roleSummary).map(([role, data]) => 
  `| ${role} | ${data.hours} | AUD ${data.rate.toLocaleString('en-AU', { minimumFractionDigits: 2 })} | AUD ${data.cost.toLocaleString('en-AU', { minimumFractionDigits: 2 })} +GST |`
).join('\n')}

## Investment Summary

| Item | Amount |
|------|--------|
| Subtotal | AUD ${subtotal.toLocaleString('en-AU', { minimumFractionDigits: 2 })} |
${discount > 0 ? `| Discount (${discount}%) | -AUD ${discountAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })} |\n` : ''}| **Total Investment** | **AUD ${total.toLocaleString('en-AU', { minimumFractionDigits: 2 })} +GST** |
`;
    return content;
  };

  const insertToEditor = () => {
    const content = generateSOWContent();
    if (content && onInsertToEditor) {
      onInsertToEditor(content);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">SOW Calculator</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clientName">Client Name *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g., OakTree Digital"
            />
          </div>
          <div>
            <Label htmlFor="projectTitle">Project Title *</Label>
            <Input
              id="projectTitle"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g., Email Template Build"
            />
          </div>
        </div>

        <Button onClick={addLineItem} className="w-full mt-4 bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Scope Item
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {lineItems.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No roles added yet.</p>
              <Button onClick={addLineItem} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add First Role
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Roles</CardTitle>
                  <Button
                    onClick={addLineItem}
                    size="sm"
                    variant="outline"
                    className="h-8"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 pb-2 border-b text-xs font-semibold text-muted-foreground">
                  <div className="col-span-4">Select role</div>
                  <div className="col-span-3">Role description</div>
                  <div className="col-span-2 text-center">Hours</div>
                  <div className="col-span-2 text-right">Cost</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Table Rows */}
                {lineItems.map((item) => {
                  const cost = calculateItemCost(item.hours, item.rate);
                  return (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center py-2 border-b last:border-b-0">
                      <div className="col-span-4">
                        <Select
                          value={item.role}
                          onValueChange={(value) => updateLineItem(item.id, 'role', value)}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {availableRoles.map(role => (
                              <SelectItem key={role.key} value={role.key} className="text-sm">
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Input
                          value={item.deliverable}
                          onChange={(e) => updateLineItem(item.id, 'deliverable', e.target.value)}
                          placeholder="Role description"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.hours}
                          onChange={(e) => updateLineItem(item.id, 'hours', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.5"
                          className="h-9 text-sm text-center"
                        />
                      </div>
                      <div className="col-span-2 text-right font-semibold text-sm">
                        ${cost.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(item.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {lineItems.length > 0 && (
        <div className="border-t bg-muted/10 p-6 space-y-4">
          {/* Total Project Value Card */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Total Project Value</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-lg">${subtotal.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>

              {/* Discount Toggle */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show-discount"
                    checked={showDiscount}
                    onChange={(e) => {
                      setShowDiscount(e.target.checked);
                      if (!e.target.checked) setDiscount(0);
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="show-discount" className="text-sm cursor-pointer">
                    Apply Discount
                  </Label>
                </div>
                {showDiscount && (
                  <div className="flex items-center gap-2">
                    <Input
                      id="discount"
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.5"
                      className="w-16 h-8 text-center text-sm"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                )}
              </div>

              {showDiscount && discount > 0 && (
                <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400">
                  <span>Discount ({discount}%)</span>
                  <span className="font-medium">-${discountAmount.toLocaleString('en-AU', { minimumFractionDigits: 0 })}</span>
                </div>
              )}

              <Separator className="my-2" />

              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-bold">Total</span>
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ${total.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={insertToEditor}
            className="w-full h-11 bg-green-600 hover:bg-green-700 text-base font-semibold"
            disabled={!clientName || !projectTitle}
          >
            <FileDown className="h-5 w-5 mr-2" />
            Generate & Insert SOW
          </Button>
        </div>
      )}
    </div>
  );
}
