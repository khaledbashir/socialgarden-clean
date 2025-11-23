import React from 'react';

interface SOWTypeBadgeProps {
  type?: 'project' | 'audit' | 'retainer' | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const CONFIG = {
  project: {
    icon: '🔨',
    label: 'Standard Project',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    description: 'Build/Delivery with defined timeline'
  },
  audit: {
    icon: '📊',
    label: 'Audit/Strategy',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    description: 'Analysis & Recommendations'
  },
  retainer: {
    icon: '📅',
    label: 'Retainer',
    color: 'bg-green-500/20 text-green-300 border-green-500/30',
    description: 'Ongoing Monthly Support'
  }
};

export function SOWTypeBadge({ 
  type = null, 
  size = 'md',
  showLabel = true 
}: SOWTypeBadgeProps) {
  if (!type) return null;

  const config = CONFIG[type];
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2'
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border ${config.color} ${sizeClasses[size]} font-medium transition-all hover:opacity-80`}
      title={config.description}
    >
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}

// Export config for use elsewhere
export const SOW_TYPE_CONFIG = CONFIG;
