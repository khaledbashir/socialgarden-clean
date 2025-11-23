"use client";

import { useState, useMemo } from 'react';
import { 
  Check, ChevronDown, ChevronUp, Sparkles, Zap, DollarSign, 
  FileText, Users, Target, Clock, Database, Bot, Palette,
  Code, Server, Shield, Globe, MessageSquare, BarChart,
  Settings, Cloud, Link, CheckCircle, AlertCircle, ExternalLink,
  Brain, Workflow, UserPlus, TrendingUp, Layout, FolderTree,
  Boxes, GitBranch, PieChart, LineChart
} from 'lucide-react';
import { Button } from '@/components/tailwind/ui/button';
import { toast } from 'sonner';

interface ServiceOption {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: any;
  isDefault?: boolean;
  canUncheck?: boolean;
  category: string;
  priceLabel?: string; // For "Custom" or "FREE" or "Included"
}

export default function LandingPage() {
  // Core service (always selected, cannot be unchecked)
  const [selectedServices, setSelectedServices] = useState<string[]>(['sow-generator']);
  const [showFullFeatures, setShowFullFeatures] = useState(false);
  const [showExtensions, setShowExtensions] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  // All available services
  const services: ServiceOption[] = [
    // CORE - CANNOT BE UNCHECKED (Includes multiple features)
    {
      id: 'sow-generator',
      name: 'SOW Generator - Complete Platform',
      description: 'AI-powered editor with AI Writing Assistant, PDF export, streaming AI with visible reasoning, advanced sidebar navigation, and rich editor extensions (tables, pricing, equations, embeds)',
      price: 1200,
      icon: FileText,
      isDefault: true,
      canUncheck: false,
      category: 'Core Platform'
    },
    
    // CLIENT EXPERIENCE
    {
      id: 'client-portal',
      name: 'Interactive Client Portal',
      description: 'Branded client-facing portal with real-time SOW viewing, interactive pricing calculator, accept/reject workflow, and commenting system',
      price: 400,
      icon: Globe,
      category: 'Client Experience'
    },
    {
      id: 'ai-chat-embed',
      name: 'AI Chat on Client Portal',
      description: 'Embedded AI assistant on client portal for instant answers, guidance, and support',
      price: 200,
      icon: MessageSquare,
      category: 'Client Experience'
    },
    
    // AI INTELLIGENCE
    {
      id: 'ai-recommendations',
      name: 'AI Service Recommendations',
      description: 'Intelligent service suggestions based on client needs, project scope, and industry analysis',
      price: 300,
      icon: Sparkles,
      category: 'AI Intelligence'
    },
    
    // WORKSPACE & ORGANIZATION
    {
      id: 'workspace-system',
      name: 'Multi-Workspace Architecture',
      description: 'Separate workspaces for each client with independent AI contexts, intelligent document management, and drag-and-drop organization',
      price: 700,
      icon: Database,
      category: 'Workspace & Organization'
    },
    {
      id: 'folder-system',
      name: 'Nested Folder System',
      description: 'Unlimited folder nesting with drag-and-drop, rename, delete, and beautiful tree view navigation',
      price: 400,
      icon: Boxes,
      category: 'Workspace & Organization'
    },
    
    // ANALYTICS & INSIGHTS
    {
      id: 'visual-dashboard',
      name: 'Visual Analytics Dashboard',
      description: 'Real-time overview of all SOWs, clients, revenue tracking, activity monitoring, and performance metrics with beautiful charts',
      price: 200,
      icon: BarChart,
      category: 'Analytics & Insights'
    },
    {
      id: 'dashboard-ai-chat',
      name: 'AI Chat with Dashboard Context',
      description: 'Ask questions about your data, get instant insights, and analyze trends with AI that understands your entire dashboard',
      price: 200,
      icon: Brain,
      category: 'Analytics & Insights'
    },
    {
      id: 'sow-tracking',
      name: 'SOW Tracking & Insights',
      description: 'Track proposal views, acceptance status, client engagement, revision history, and email delivery',
      price: 100,
      icon: TrendingUp,
      category: 'Analytics & Insights'
    },
    
    // ADMIN & CUSTOMIZATION
    {
      id: 'admin-services-panel',
      name: 'Admin Services Panel',
      description: 'Manage your complete service catalog with pricing, descriptions, categories, and active/inactive toggling from one central interface',
      price: 200,
      icon: Settings,
      category: 'Admin & Customization'
    },
    {
      id: 'white-label',
      name: 'Full White Labeling',
      description: 'Custom branding, logo, colors, domain, email templates, and complete client-facing UI customization',
      price: 0,
      icon: Palette,
      category: 'Admin & Customization',
      priceLabel: 'Custom'
    },
    
    // INTEGRATIONS & EXTENSIONS
    {
      id: 'openrouter-api',
      name: 'OpenRouter Multi-Model Support',
      description: 'Access to 100+ AI models with automatic fallback and intelligent cost optimization',
      price: 0,
      icon: Server,
      category: 'Integrations',
      priceLabel: 'FREE'
    },
    {
      id: 'crm-lead-scoring',
      name: 'CRM Lead Scoring',
      description: 'Automatically score and prioritize leads based on SOW engagement, interaction patterns, and conversion potential',
      price: 300,
      icon: Target,
      category: 'Integrations'
    },
    {
      id: 'crm-lead-enrichment',
      name: 'CRM Lead Enrichment',
      description: 'Enhance lead profiles with company information, industry insights, engagement history, and behavioral data',
      price: 300,
      icon: UserPlus,
      category: 'Integrations'
    },
    {
      id: 'crm-workflow-automation',
      name: 'CRM Workflow Automation',
      description: 'Trigger automated workflows when SOWs are created, viewed, accepted, or rejected with custom actions and notifications',
      price: 400,
      icon: Workflow,
      category: 'Integrations'
    },
    {
      id: 'custom-integration',
      name: 'Custom Integration',
      description: 'Connect to your existing tools: Zapier, webhooks, API endpoints, custom CRM systems, project management platforms, and more',
      price: 0,
      icon: GitBranch,
      category: 'Integrations',
      priceLabel: 'To Be Discussed'
    },
  ];

  // Calculate total price (excluding custom/free items)
  const totalPrice = useMemo(() => {
    return services
      .filter(s => selectedServices.includes(s.id))
      .reduce((sum, s) => sum + s.price, 0);
  }, [selectedServices]);

  const toggleService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service || service.canUncheck === false) return;

    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, ServiceOption[]>);

  return (
    <div className="min-h-screen bg-[#0E0F0F]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0e2e33] to-[#0E0F0F] border-b border-[#1CBF79]/20">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <h1 className="text-3xl font-bold text-white">Social Garden</h1>
          </div>

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1CBF79]/10 border border-[#1CBF79]/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-[#1CBF79]" />
              <span className="text-sm font-semibold text-[#1CBF79]">Production Ready • White Label • Resellable</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              AI-Powered SOW Generator<br />
              <span className="text-[#1CBF79]">Built for Marketing Agencies</span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Complete scope of work platform with AI writing assistant, client portals, 
              interactive pricing, and specialized AI agents. <strong className="text-white">Resell to your clients</strong> with full white labeling and custom branding.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-[#1CBF79] hover:bg-[#15a366] text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Get Started →
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-6 text-lg font-semibold rounded-lg border border-white/20 backdrop-blur-sm transition-all"
              >
                Try Demo
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#1CBF79]" />
                <span>17 Features</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#1CBF79]" />
                <span>8 AI Agents</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#1CBF79]" />
                <span>100+ AI Models</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg bg-gradient-to-br from-[#1CBF79]/5 to-transparent border border-[#1CBF79]/10">
            <Zap className="w-10 h-10 text-[#1CBF79] mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Generate SOWs in Minutes</h3>
            <p className="text-gray-400">AI-powered editor with streaming responses shows its thinking process. Professional PDFs included.</p>
          </div>
          
          <div className="p-6 rounded-lg bg-gradient-to-br from-[#1CBF79]/5 to-transparent border border-[#1CBF79]/10">
            <Users className="w-10 h-10 text-[#1CBF79] mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Impress Your Clients</h3>
            <p className="text-gray-400">Beautiful interactive portals with real-time pricing, AI chat support, and seamless acceptance workflow.</p>
          </div>
          
          <div className="p-6 rounded-lg bg-gradient-to-br from-[#1CBF79]/5 to-transparent border border-[#1CBF79]/10">
            <Palette className="w-10 h-10 text-[#1CBF79] mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">White Label & Resell</h3>
            <p className="text-gray-400">Complete customization: your brand, your domain, your pricing. Resell as your own product.</p>
          </div>
        </div>
      </section>

      {/* Platform Features - What Makes This Special */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">What Makes This Platform Special</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Built with cutting-edge AI technology and enterprise features. No other SOW tool comes close.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Intelligent Document Management */}
          <div className="p-6 rounded-lg bg-[#0A0A0A] border border-gray-800 hover:border-[#1CBF79]/30 transition-colors">
            <Database className="w-8 h-8 text-[#1CBF79] mb-3" />
            <h4 className="text-lg font-semibold text-white mb-2">Intelligent Document Management</h4>
            <p className="text-sm text-gray-400">
              Every client gets their own workspace with AI context. Documents are automatically organized, embedded for AI search, and synced in real-time.
            </p>
          </div>

          {/* Retrieval Augmented Generation */}
          <div className="p-6 rounded-lg bg-[#0A0A0A] border border-gray-800 hover:border-[#1CBF79]/30 transition-colors">
            <Brain className="w-8 h-8 text-[#1CBF79] mb-3" />
            <h4 className="text-lg font-semibold text-white mb-2">Advanced AI with Memory</h4>
            <p className="text-sm text-gray-400">
              AI remembers everything about each client. Upload brand guidelines, past projects, and pricing - the AI uses it all to generate perfect SOWs.
            </p>
          </div>

          {/* Multi-Model AI Access */}
          <div className="p-6 rounded-lg bg-[#0A0A0A] border border-gray-800 hover:border-[#1CBF79]/30 transition-colors">
            <Server className="w-8 h-8 text-[#1CBF79] mb-3" />
            <h4 className="text-lg font-semibold text-white mb-2">Access 100+ AI Models</h4>
            <p className="text-sm text-gray-400">
              Switch between GPT-4, Claude, Gemini, Llama, and 100+ more models. Automatic fallback ensures you're never blocked.
            </p>
          </div>

          {/* Streaming with Thinking */}
          <div className="p-6 rounded-lg bg-[#0A0A0A] border border-gray-800 hover:border-[#1CBF79]/30 transition-colors">
            <Zap className="w-8 h-8 text-[#1CBF79] mb-3" />
            <h4 className="text-lg font-semibold text-white mb-2">See AI Think in Real-Time</h4>
            <p className="text-sm text-gray-400">
              Watch the AI's reasoning process as it generates content. Full transparency with streaming responses and visible thought process.
            </p>
          </div>

          {/* Specialized AI Agents */}
          <div className="p-6 rounded-lg bg-[#0A0A0A] border border-gray-800 hover:border-[#1CBF79]/30 transition-colors">
            <Bot className="w-8 h-8 text-[#1CBF79] mb-3" />
            <h4 className="text-lg font-semibold text-white mb-2">8 Specialized AI Agents</h4>
            <p className="text-sm text-gray-400">
              Property Marketing Pro, Ad Copy Machine, SEO Strategist, Case Study Crafter, Landing Page Expert, Proposal Specialist, and more.
            </p>
          </div>

          {/* Smart Workspace Organization */}
          <div className="p-6 rounded-lg bg-[#0A0A0A] border border-gray-800 hover:border-[#1CBF79]/30 transition-colors">
            <FolderTree className="w-8 h-8 text-[#1CBF79] mb-3" />
            <h4 className="text-lg font-semibold text-white mb-2">Smart Workspace Organization</h4>
            <p className="text-sm text-gray-400">
              Unlimited nested folders, drag-and-drop organization, workspace switcher, and beautiful tree navigation. Everything stays organized.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Pricing Calculator */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Choose Your Features</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Start with the core platform ($1,200) and add features as needed. All prices are one-time setup fees.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Services Selection */}
          <div className="lg:col-span-2">
            {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
              <div key={category} className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-[#1CBF79] rounded"></div>
                  {category}
                </h3>
                
                <div className="space-y-3">
                  {categoryServices.map((service) => {
                    const isSelected = selectedServices.includes(service.id);
                    const isCore = service.canUncheck === false;
                    
                    return (
                      <div
                        key={service.id}
                        onClick={() => !isCore && toggleService(service.id)}
                        className={`
                          p-4 rounded-lg border transition-all
                          ${isCore 
                            ? 'bg-[#1CBF79]/10 border-[#1CBF79] cursor-not-allowed' 
                            : isSelected
                              ? 'bg-[#1CBF79]/5 border-[#1CBF79]/50 cursor-pointer hover:border-[#1CBF79]'
                              : 'bg-[#0A0A0A] border-gray-800 cursor-pointer hover:border-gray-700'
                          }
                        `}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`
                            flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                            ${isSelected ? 'bg-[#1CBF79]/20' : 'bg-gray-800/50'}
                          `}>
                            <service.icon className={`w-5 h-5 ${isSelected ? 'text-[#1CBF79]' : 'text-gray-400'}`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-semibold text-white">{service.name}</h4>
                              <div className="flex items-center gap-2">
                                {service.priceLabel ? (
                                  <span className="text-sm font-semibold text-[#1CBF79]">
                                    {service.priceLabel}
                                  </span>
                                ) : (
                                  <span className="text-lg font-bold text-white">
                                    ${service.price.toLocaleString()}
                                  </span>
                                )}
                                {isCore && (
                                  <span className="px-2 py-1 text-xs font-semibold bg-[#1CBF79]/20 text-[#1CBF79] rounded-full">
                                    CORE
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-400">{service.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Price Summary Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 p-6 rounded-lg bg-gradient-to-br from-[#1CBF79]/10 to-[#0A0A0A] border border-[#1CBF79]/30">
              <h3 className="text-lg font-semibold text-white mb-4">Selected Features</h3>
              
              <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                {services
                  .filter(s => selectedServices.includes(s.id))
                  .map(service => (
                    <div key={service.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300 flex items-center gap-2">
                        <Check className="w-3 h-3 text-[#1CBF79]" />
                        {service.name}
                      </span>
                      {service.price > 0 && (
                        <span className="text-white font-semibold">${service.price}</span>
                      )}
                    </div>
                  ))}
              </div>
              
              <div className="border-t border-gray-700 pt-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Total Setup Fee</span>
                  <span className="text-2xl font-bold text-white">${totalPrice.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500">One-time setup • Custom pricing negotiable</p>
              </div>
              
              <Button
                onClick={() => {
                  toast.success('Setup request received! We\'ll contact you shortly.');
                }}
                className="w-full bg-[#1CBF79] hover:bg-[#17a368] text-white font-semibold py-3"
              >
                Request Setup
              </Button>
              
              <div className="mt-4 text-xs text-gray-500 text-center">
                Want different features? Pricing is flexible.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Extensions & Integrations */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <button
          onClick={() => setShowExtensions(!showExtensions)}
          className="w-full flex items-center justify-between p-6 rounded-lg bg-[#0A0A0A] border border-gray-800 hover:border-[#1CBF79]/30 transition-colors mb-4"
        >
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Want Custom Extensions?</h3>
            <p className="text-gray-400">We can build integrations for your specific needs</p>
          </div>
          {showExtensions ? <ChevronUp className="w-6 h-6 text-[#1CBF79]" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
        </button>

        {showExtensions && (
          <div className="p-6 rounded-lg bg-[#0A0A0A] border border-gray-800">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1CBF79]/10 flex items-center justify-center flex-shrink-0">
                  <Database className="w-4 h-4 text-[#1CBF79]" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">CRM Integrations</h4>
                  <p className="text-sm text-gray-400">HubSpot, Salesforce, Pipedrive, or custom CRM</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1CBF79]/10 flex items-center justify-center flex-shrink-0">
                  <Workflow className="w-4 h-4 text-[#1CBF79]" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Automation Tools</h4>
                  <p className="text-sm text-gray-400">Zapier, Make, n8n, or custom webhooks</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1CBF79]/10 flex items-center justify-center flex-shrink-0">
                  <Server className="w-4 h-4 text-[#1CBF79]" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">API Endpoints</h4>
                  <p className="text-sm text-gray-400">RESTful API for custom integrations</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1CBF79]/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-[#1CBF79]" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">SSO & Authentication</h4>
                  <p className="text-sm text-gray-400">OAuth, SAML, or custom auth systems</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1CBF79]/10 flex items-center justify-center flex-shrink-0">
                  <BarChart className="w-4 h-4 text-[#1CBF79]" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Analytics Platforms</h4>
                  <p className="text-sm text-gray-400">Google Analytics, Mixpanel, custom tracking</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1CBF79]/10 flex items-center justify-center flex-shrink-0">
                  <Code className="w-4 h-4 text-[#1CBF79]" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Custom Features</h4>
                  <p className="text-sm text-gray-400">Anything you need - just ask</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <p className="text-sm text-gray-400 text-center">
                💡 <strong className="text-white">Have a specific integration in mind?</strong> Let's discuss pricing and timeline.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Requirements Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <button
          onClick={() => setShowRequirements(!showRequirements)}
          className="w-full flex items-center justify-between p-6 rounded-lg bg-[#0A0A0A] border border-gray-800 hover:border-[#1CBF79]/30 transition-colors mb-4"
        >
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">What You Need to Get Started</h3>
            <p className="text-gray-400">A few simple requirements to set everything up</p>
          </div>
          {showRequirements ? <ChevronUp className="w-6 h-6 text-[#1CBF79]" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
        </button>

        {showRequirements && (
          <div className="p-6 rounded-lg bg-[#0A0A0A] border border-gray-800">
            <div className="space-y-6">
              {/* Critical Requirements */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Critical (Required for AI to work)
                </h4>
                <div className="space-y-3 ml-7">
                  <div>
                    <p className="text-white font-medium mb-1">OpenRouter API Key</p>
                    <p className="text-sm text-gray-400 mb-2">
                      This is how the AI models work. Without this, no AI features will function.
                    </p>
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-[#1CBF79] hover:underline"
                    >
                      Get your free OpenRouter API key
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div>
                    <p className="text-white font-medium mb-1">Domain or Subdomain</p>
                    <p className="text-sm text-gray-400">
                      Where would you like this installed? (e.g., sow.youragency.com or youragency.com/sow)
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommended */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-yellow-500" />
                  Recommended (For best experience)
                </h4>
                <div className="space-y-3 ml-7">
                  <div>
                    <p className="text-white font-medium mb-1">Your Brand Assets</p>
                    <p className="text-sm text-gray-400">Logo, colors, fonts for white labeling</p>
                  </div>

                  <div>
                    <p className="text-white font-medium mb-1">Service Catalog</p>
                    <p className="text-sm text-gray-400">List of your services with pricing (we'll import it)</p>
                  </div>

                  <div>
                    <p className="text-white font-medium mb-1">Email Sending Service</p>
                    <p className="text-sm text-gray-400">SendGrid, AWS SES, or SMTP for client notifications</p>
                  </div>
                </div>
              </div>

              {/* Important Note */}
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-200 font-semibold mb-1">
                      Important: We Need Your Input
                    </p>
                    <p className="text-sm text-yellow-100/80">
                      This is completely normal - <strong>we're not mind readers!</strong> 😊 We'll need to discuss your specific requirements, 
                      branding preferences, and feature priorities. Setup takes 2-5 business days depending on customization level.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Core Features (What's Included in Base) */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <button
          onClick={() => setShowFullFeatures(!showFullFeatures)}
          className="w-full flex items-center justify-between p-6 rounded-lg bg-[#0A0A0A] border border-gray-800 hover:border-[#1CBF79]/30 transition-colors mb-4"
        >
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">What's Included in the Core Platform ($1,200)</h3>
            <p className="text-gray-400">Click to see all 12 included features</p>
          </div>
          {showFullFeatures ? <ChevronUp className="w-6 h-6 text-[#1CBF79]" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
        </button>

        {showFullFeatures && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 rounded-lg bg-[#0A0A0A] border border-gray-800">
            {[
              { icon: FileText, label: 'AI-Powered SOW Editor' },
              { icon: Zap, label: 'Streaming AI with Thinking Display' },
              { icon: FileText, label: 'Professional PDF Export' },
              { icon: Layout, label: 'Advanced Sidebar Navigation' },
              { icon: Code, label: 'Rich Editor Extensions' },
              { icon: Database, label: 'Tables & Pricing Tables' },
              { icon: Code, label: 'Math Equations & Code Blocks' },
              { icon: Globe, label: 'Image Embeds & Custom Nodes' },
              { icon: Shield, label: 'User Authentication' },
              { icon: Database, label: 'MySQL Database' },
              { icon: Settings, label: 'RESTful API' },
              { icon: Cloud, label: 'Cloud Deployment Ready' },
            ].map((feature, idx) => (
              <div key={`feature-${idx}-${feature.label}`} className="flex items-center gap-3 p-3 rounded-lg bg-[#1CBF79]/5 border border-[#1CBF79]/10">
                <feature.icon className="w-5 h-5 text-[#1CBF79] flex-shrink-0" />
                <span className="text-sm text-white">{feature.label}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center p-12 rounded-2xl bg-gradient-to-br from-[#1CBF79]/10 to-[#0A0A0A] border border-[#1CBF79]/30">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your SOW Process?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join forward-thinking agencies using AI to create better proposals faster.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => {
                toast.success('Demo request received! We\'ll contact you within 24 hours.');
              }}
              className="px-8 py-4 bg-[#1CBF79] hover:bg-[#17a368] text-white font-semibold text-lg rounded-lg transition-colors"
            >
              <Clock className="w-5 h-5 mr-2" />
              Schedule a Demo
            </Button>
            
            <Button
              onClick={() => {
                window.location.href = 'mailto:contact@socialgarden.com.au?subject=SOW%20Platform%20Inquiry';
              }}
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold text-lg rounded-lg transition-colors"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Email Us
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Have questions? Email us at <a href="mailto:contact@socialgarden.com.au" className="text-[#1CBF79] hover:underline">contact@socialgarden.com.au</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm font-semibold">Social Garden</span>
              <span className="text-gray-400 text-sm">© 2025 Social Garden. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-[#1CBF79] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#1CBF79] transition-colors">Terms of Service</a>
              <a href="mailto:contact@socialgarden.com.au" className="hover:text-[#1CBF79] transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
