'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Package,
  TrendingUp,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  description: string;
  base_price: number;
  pricing_unit: string;
  category: string;
  icon_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  base_price: string;
  pricing_unit: string;
  category: string;
  icon_url: string;
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'social-media', label: 'Social Media' },
  { value: 'content', label: 'Content' },
  { value: 'advertising', label: 'Advertising' },
  { value: 'seo', label: 'SEO' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'branding', label: 'Branding' },
  { value: 'web', label: 'Web Development' },
  { value: 'technology', label: 'Technology' },
  { value: 'general', label: 'General' },
];

export default function ServiceCatalogPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    base_price: '',
    pricing_unit: 'month',
    category: 'general',
    icon_url: '',
  });

  // Load services on mount
  useEffect(() => {
    loadServices();
  }, []);

  // Filter services when search or category changes
  useEffect(() => {
    let filtered = services;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query)
      );
    }

    setFilteredServices(filtered);
  }, [services, searchQuery, selectedCategory]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/services');
      const data = await res.json();
      if (data.success) {
        setServices(data.services);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingService
        ? `/api/admin/services/${editingService.id}`
        : '/api/admin/services';

      const method = editingService ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingService ? 'Service updated successfully!' : 'Service created successfully!');
        setShowModal(false);
        resetForm();
        loadServices();
      } else {
        toast.error(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to save service:', error);
      toast.error('Failed to save service. Please try again.');
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Service deleted successfully!');
        loadServices();
      } else {
        toast.error(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to delete service:', error);
      toast.error('Failed to delete service. Please try again.');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      base_price: service.base_price.toString(),
      pricing_unit: service.pricing_unit,
      category: service.category,
      icon_url: service.icon_url || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      base_price: '',
      pricing_unit: 'month',
      category: 'general',
      icon_url: '',
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Stats
  const totalServices = services.length;
  const activeServices = services.filter((s) => s.is_active).length;
  const totalValue = services.reduce((sum, s) => sum + s.base_price, 0);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black border-b border-[#1FE18E]/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Service Catalog</h1>
              <p className="text-gray-500">
                Manage your services and pricing for AI-powered recommendations
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-[#1FE18E] hover:bg-[#1FE18E]/90 text-black rounded-lg font-semibold transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Service
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-900 border border-[#1FE18E]/20 rounded-lg p-6 hover:border-[#1FE18E]/40 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Services</p>
                <p className="text-3xl font-bold text-white">{totalServices}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-[#1FE18E]/20 rounded-lg p-6 hover:border-[#1FE18E]/40 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#1FE18E]/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#1FE18E]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Active Services</p>
                <p className="text-3xl font-bold text-white">{activeServices}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-[#1FE18E]/20 rounded-lg p-6 hover:border-[#1FE18E]/40 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Catalog Value</p>
                <p className="text-2xl font-bold text-[#1FE18E]">
                  ${totalValue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600 mt-1">{services.length} services</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-[#1FE18E]/20 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#1FE18E]"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 bg-zinc-900 border border-[#1FE18E]/20 rounded-lg text-white focus:outline-none focus:border-[#1FE18E] appearance-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-black">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Services List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <Sparkles className="w-8 h-8 mx-auto mb-3 animate-pulse" />
            Loading services...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg mb-2">No services found</p>
            <p className="text-sm">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first service to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-zinc-900 border border-[#1FE18E]/20 rounded-lg p-6 hover:border-[#1FE18E]/50 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-xl font-semibold text-white">{service.name}</h3>
                      <span className="px-2 py-1 bg-blue-500/30 text-blue-300 text-xs rounded-full font-medium">
                        {service.category}
                      </span>
                      {service.is_active ? (
                        <span className="px-2 py-1 bg-[#1FE18E]/30 text-[#1FE18E] text-xs rounded-full font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-700/30 text-gray-400 text-xs rounded-full font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-6">
                      <span className="text-[#1FE18E] font-bold text-lg">
                        ${service.base_price.toFixed(2)} / {service.pricing_unit}
                      </span>
                      <span className="text-xs text-gray-600">
                        Updated: {new Date(service.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(service)}
                      className="p-2 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Edit service"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="p-2 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete service"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#0a1f24]/60 backdrop-blur border border-[#1FE18E]/20 rounded-lg p-6 hover:border-[#1FE18E]/40 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Total Services</p>
                <p className="text-3xl font-bold text-white">{totalServices}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0a1f24]/60 backdrop-blur border border-[#1FE18E]/20 rounded-lg p-6 hover:border-[#1FE18E]/40 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#1FE18E]/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#1FE18E]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Active Services</p>
                <p className="text-3xl font-bold text-white">{activeServices}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0a1f24]/60 backdrop-blur border border-[#1FE18E]/20 rounded-lg p-6 hover:border-[#1FE18E]/40 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Total Catalog Value</p>
                <p className="text-2xl font-bold text-[#1FE18E]">
                  ${totalValue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{services.length} services</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0a1f24]/60 border border-[#1FE18E]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#1FE18E]"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 bg-[#0a1f24]/60 border border-[#1FE18E]/20 rounded-lg text-white focus:outline-none focus:border-[#1FE18E] appearance-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Services List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <Sparkles className="w-8 h-8 mx-auto mb-3 animate-pulse" />
            Loading services...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg mb-2">No services found</p>
            <p className="text-sm">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first service to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-[#0a1f24]/60 backdrop-blur border border-[#1FE18E]/20 rounded-lg p-6 hover:border-[#1FE18E]/50 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-xl font-semibold text-white">{service.name}</h3>
                      <span className="px-2 py-1 bg-blue-500/30 text-blue-300 text-xs rounded-full font-medium">
                        {service.category}
                      </span>
                      {service.is_active ? (
                        <span className="px-2 py-1 bg-[#1FE18E]/30 text-[#1FE18E] text-xs rounded-full font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-600/30 text-gray-300 text-xs rounded-full font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-6">
                      <span className="text-[#1FE18E] font-bold text-lg">
                        ${service.base_price.toFixed(2)} / {service.pricing_unit}
                      </span>
                      <span className="text-xs text-gray-500">
                        Updated: {new Date(service.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(service)}
                      className="p-2 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Edit service"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="p-2 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete service"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 backdrop-blur border border-[#1FE18E]/30 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-zinc-900 border-b border-[#1FE18E]/20 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-[#1FE18E]/20 rounded-lg transition-colors text-gray-400 hover:text-[#1FE18E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Social Media Management"
                  className="w-full px-4 py-2 bg-black border border-[#1FE18E]/20 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#1FE18E] focus:ring-2 focus:ring-[#1FE18E]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe what this service includes..."
                  rows={4}
                  className="w-full px-4 py-2 bg-black border border-[#1FE18E]/20 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#1FE18E] focus:ring-2 focus:ring-[#1FE18E]/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Base Price (AUD) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) =>
                      setFormData({ ...formData, base_price: e.target.value })
                    }
                    placeholder="e.g., 5000"
                    className="w-full px-4 py-2 bg-black border border-[#1FE18E]/20 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#1FE18E] focus:ring-2 focus:ring-[#1FE18E]/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pricing Unit *
                  </label>
                  <select
                    value={formData.pricing_unit}
                    onChange={(e) =>
                      setFormData({ ...formData, pricing_unit: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-black border border-[#1FE18E]/20 rounded-lg text-white focus:outline-none focus:border-[#1FE18E] focus:ring-2 focus:ring-[#1FE18E]/20"
                  >
                    <option value="month" className="bg-black">Per Month</option>
                    <option value="year" className="bg-black">Per Year</option>
                    <option value="project" className="bg-black">Per Project</option>
                    <option value="hour" className="bg-black">Per Hour</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-black border border-[#1FE18E]/20 rounded-lg text-white focus:outline-none focus:border-[#1FE18E] focus:ring-2 focus:ring-[#1FE18E]/20"
                >
                  {CATEGORIES.filter(c => c.value !== 'all').map((cat) => (
                    <option key={cat.value} value={cat.value} className="bg-black">
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Icon URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.icon_url}
                  onChange={(e) =>
                    setFormData({ ...formData, icon_url: e.target.value })
                  }
                  placeholder="https://example.com/icon.png"
                  className="w-full px-4 py-2 bg-black border border-[#1FE18E]/20 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#1FE18E] focus:ring-2 focus:ring-[#1FE18E]/20"
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-[#1FE18E]/10">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-[#1FE18E] text-black rounded-lg hover:bg-[#1FE18E]/90 transition-colors font-semibold"
                >
                  {editingService ? 'Update Service' : 'Add Service'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-2 border border-[#1FE18E]/30 text-[#1FE18E] rounded-lg hover:bg-[#1FE18E]/10 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
