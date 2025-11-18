/**
 * Social Garden Business Intelligence Widgets
 * Vertical & Service Line Pipeline Breakdown
 * October 23, 2025
 */

"use client";

import { useEffect, useState } from 'react';
import { Building2, Wrench, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

interface VerticalData {
  vertical: string;
  sow_count: number;
  total_value: number;
  avg_deal_size: number;
  win_rate: number;
}

interface ServiceData {
  service_line: string;
  sow_count: number;
  total_value: number;
  avg_deal_size: number;
  win_rate: number;
}

// Human-friendly display names
const VERTICAL_LABELS: Record<string, { name: string; emoji: string }> = {
  'property': { name: 'Property', emoji: '🏢' },
  'education': { name: 'Higher Education', emoji: '🎓' },
  'finance': { name: 'Finance', emoji: '💰' },
  'healthcare': { name: 'Healthcare', emoji: '🏥' },
  'retail': { name: 'Retail', emoji: '🛍️' },
  'hospitality': { name: 'Hospitality', emoji: '🏨' },
  'professional-services': { name: 'Professional Services', emoji: '💼' },
  'technology': { name: 'Technology', emoji: '💻' },
  'other': { name: 'Other', emoji: '📊' },
};

const SERVICE_LABELS: Record<string, { name: string; emoji: string }> = {
  'crm-implementation': { name: 'CRM Implementation', emoji: '🔧' },
  'marketing-automation': { name: 'Marketing Automation', emoji: '⚙️' },
  'revops-strategy': { name: 'RevOps Strategy', emoji: '📊' },
  'managed-services': { name: 'Managed Services', emoji: '🛠️' },
  'consulting': { name: 'Consulting', emoji: '💡' },
  'training': { name: 'Training', emoji: '📚' },
  'other': { name: 'Other', emoji: '🔹' },
};

export function SocialGardenBIWidgets() {
  const [verticals, setVerticals] = useState<VerticalData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [verticalRes, serviceRes] = await Promise.all([
        fetch('/api/analytics/by-vertical'),
        fetch('/api/analytics/by-service'),
      ]);

      const verticalData = await verticalRes.json();
      const serviceData = await serviceRes.json();

      if (verticalData.success) setVerticals(verticalData.verticals);
      if (serviceData.success) setServices(serviceData.services);
    } catch (error) {
      console.error('Failed to fetch BI analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderBar = (value: number, total: number, color: string) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1CBF79]" />
      </div>
    );
  }

  const totalVerticalValue = verticals.reduce((sum, v) => sum + Number(v.total_value), 0);
  const totalServiceValue = services.reduce((sum, s) => sum + Number(s.total_value), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pipeline by Vertical */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Building2 className="h-5 w-5 text-[#1CBF79]" />
            Pipeline by Vertical
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {verticals.length === 0 ? (
            <p className="text-gray-400 text-sm">No vertical data yet. Tag your SOWs to see insights.</p>
          ) : (
            verticals.map((v) => {
              const label = VERTICAL_LABELS[v.vertical] || VERTICAL_LABELS['other'];
              const percentage = totalVerticalValue > 0 ? (Number(v.total_value) / totalVerticalValue) * 100 : 0;
              
              return (
                  <div 
                  key={v.vertical} 
                  className={`space-y-1`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">
                      {label.emoji} {label.name}
                    </span>
                    <span className="text-[#1CBF79] font-semibold">
                      ${Number(v.total_value).toLocaleString('en-AU', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  {renderBar(Number(v.total_value), totalVerticalValue, 'bg-[#1CBF79]')}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{percentage.toFixed(0)}% of pipeline</span>
                    <span>{v.sow_count} SOWs • {v.win_rate}% win rate</span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Pipeline by Service Line */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Wrench className="h-5 w-5 text-[#1CBF79]" />
            Pipeline by Service Line
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {services.length === 0 ? (
            <p className="text-gray-400 text-sm">No service line data yet. Tag your SOWs to see insights.</p>
          ) : (
            services.map((s) => {
              const label = SERVICE_LABELS[s.service_line] || SERVICE_LABELS['other'];
              const percentage = totalServiceValue > 0 ? (Number(s.total_value) / totalServiceValue) * 100 : 0;
              const avgDeal = Number(s.avg_deal_size);
              
              return (
                <div 
                  key={s.service_line} 
                  className={`space-y-1`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">
                      {label.emoji} {label.name}
                    </span>
                    <span className="text-[#1CBF79] font-semibold">
                      ${Number(s.total_value).toLocaleString('en-AU', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  {renderBar(Number(s.total_value), totalServiceValue, 'bg-blue-500')}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{percentage.toFixed(0)}% of pipeline</span>
                    <span>Avg: ${avgDeal.toLocaleString('en-AU', { minimumFractionDigits: 0 })}</span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
