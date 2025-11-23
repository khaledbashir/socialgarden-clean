"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

type Vertical = 'property' | 'education' | 'finance' | 'healthcare' | 'retail' | 'hospitality' | 'professional-services' | 'technology' | 'other';
type ServiceLine = 'crm-implementation' | 'marketing-automation' | 'revops-strategy' | 'managed-services' | 'consulting' | 'training' | 'other';

interface SOWTagSelectorProps {
  sowId: string;
  sowTitle: string;
  currentVertical: Vertical | null;
  currentServiceLine: ServiceLine | null;
  onTagsUpdated?: (vertical: Vertical, serviceLine: ServiceLine) => void;
}

// Vertical options with display labels and colors
const VERTICALS: { value: Vertical; label: string; color: string }[] = [
  { value: 'property', label: '🏠 Property', color: 'bg-blue-100 text-blue-800' },
  { value: 'education', label: '🎓 Education', color: 'bg-purple-100 text-purple-800' },
  { value: 'finance', label: '💰 Finance', color: 'bg-green-100 text-green-800' },
  { value: 'healthcare', label: '🏥 Healthcare', color: 'bg-red-100 text-red-800' },
  { value: 'retail', label: '🛍️ Retail', color: 'bg-orange-100 text-orange-800' },
  { value: 'hospitality', label: '🏨 Hospitality', color: 'bg-amber-100 text-amber-800' },
  { value: 'professional-services', label: '💼 Professional Services', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'technology', label: '💻 Technology', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'other', label: '❓ Other', color: 'bg-gray-100 text-gray-800' },
];

// Service line options with display labels
const SERVICE_LINES: { value: ServiceLine; label: string }[] = [
  { value: 'crm-implementation', label: 'CRM Implementation' },
  { value: 'marketing-automation', label: 'Marketing Automation' },
  { value: 'revops-strategy', label: 'RevOps Strategy' },
  { value: 'managed-services', label: 'Managed Services' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
];

export function SOWTagSelector(props: SOWTagSelectorProps) {
  const [showVerticalDropdown, setShowVerticalDropdown] = useState(false);
  const [showServiceLineDropdown, setShowServiceLineDropdown] = useState(false);
  const [vertical, setVertical] = useState<Vertical | null>(props.currentVertical);
  const [serviceLine, setServiceLine] = useState<ServiceLine | null>(props.currentServiceLine);
  const [isSaving, setIsSaving] = useState(false);
  const verticalRef = useRef<HTMLDivElement>(null);
  const serviceLineRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (verticalRef.current && !verticalRef.current.contains(event.target as Node)) {
        setShowVerticalDropdown(false);
      }
      if (serviceLineRef.current && !serviceLineRef.current.contains(event.target as Node)) {
        setShowServiceLineDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVerticalSelect = async (selectedVertical: Vertical) => {
    setVertical(selectedVertical);
    setShowVerticalDropdown(false);
    await saveTagsToDatabase(selectedVertical, serviceLine);
  };

  const handleServiceLineSelect = async (selectedServiceLine: ServiceLine) => {
    setServiceLine(selectedServiceLine);
    setShowServiceLineDropdown(false);
    await saveTagsToDatabase(vertical, selectedServiceLine);
  };

  const saveTagsToDatabase = async (v: Vertical | null, sl: ServiceLine | null) => {
    if (!v || !sl) return; // Don't save if either is missing

    setIsSaving(true);
    try {
      const response = await fetch(`/api/sow/${props.sowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vertical: v,
          serviceLine: sl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save tags');
      }

      toast.success('Tags updated');
      props.onTagsUpdated?.(v, sl);
    } catch (error) {
      console.error('Error saving tags:', error);
      toast.error('Failed to save tags');
      // Revert to previous values
      setVertical(props.currentVertical);
      setServiceLine(props.currentServiceLine);
    } finally {
      setIsSaving(false);
    }
  };

  // Get display label for current vertical
  // Use empty placeholder instead of 'Select Vertical' to avoid showing 'Select' text
  const verticalLabel = vertical
    ? VERTICALS.find(v => v.value === vertical)?.label || ''
    : '';

  // Get display label for current service line
  // Use empty placeholder instead of 'Select Service Line' to avoid showing 'Select' text
  const serviceLineLabel = serviceLine
    ? SERVICE_LINES.find(sl => sl.value === serviceLine)?.label || ''
    : '';

  // If both are set, show as badge instead of dropdowns
  if (vertical && serviceLine && !showVerticalDropdown && !showServiceLineDropdown) {
    const verticalInfo = VERTICALS.find(v => v.value === vertical);
    return (
      <div className="flex gap-1 items-center flex-wrap">
        <button
          onClick={() => setShowVerticalDropdown(true)}
          className={`px-2 py-0.5 rounded text-xs font-medium transition-all hover:opacity-80 ${verticalInfo?.color}`}
          title="Click to change vertical"
        >
          {verticalInfo?.label}
        </button>
        <button
          onClick={() => setShowServiceLineDropdown(true)}
          className="px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800 transition-all hover:opacity-80"
          title="Click to change service line"
        >
          {serviceLineLabel}
        </button>
      </div>
    );
  }

  // If untagged, show as dropdowns
  return (
    <div className="flex gap-1 items-center flex-wrap">
      {/* Vertical Dropdown */}
      <div ref={verticalRef} className="relative">
        <button
          onClick={() => {
            setShowVerticalDropdown(!showVerticalDropdown);
            setShowServiceLineDropdown(false);
          }}
          className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-200 hover:bg-gray-600 flex items-center gap-1 transition-all"
          disabled={isSaving}
        >
          {verticalLabel || ''}
          <ChevronDown className="w-3 h-3" />
        </button>

        {showVerticalDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-[200px]">
            {VERTICALS.map((v) => (
              <button
                key={v.value}
                onClick={() => handleVerticalSelect(v.value)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-700 transition-colors ${
                  vertical === v.value ? 'bg-gray-700 font-semibold' : ''
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Service Line Dropdown */}
      <div ref={serviceLineRef} className="relative">
        <button
          onClick={() => {
            setShowServiceLineDropdown(!showServiceLineDropdown);
            setShowVerticalDropdown(false);
          }}
          className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-200 hover:bg-gray-600 flex items-center gap-1 transition-all"
          disabled={isSaving}
        >
          {serviceLineLabel || ''}
          <ChevronDown className="w-3 h-3" />
        </button>

        {showServiceLineDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-[200px]">
            {SERVICE_LINES.map((sl) => (
              <button
                key={sl.value}
                onClick={() => handleServiceLineSelect(sl.value)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-700 transition-colors ${
                  serviceLine === sl.value ? 'bg-gray-700 font-semibold' : ''
                }`}
              >
                {sl.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
