"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Settings,
    Package,
    Users,
    BarChart3,
    Lightbulb,
    DollarSign,
} from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
    const router = useRouter();
    const [adminKey, setAdminKey] = useState("");
    const [resetStatus, setResetStatus] = useState<string | null>(null);

    const handleResetDashboard = async (filter?: "test") => {
        if (!adminKey) {
            setResetStatus("Enter admin key first.");
            return;
        }
        try {
            const action =
                filter === "test"
                    ? "Deleting test SOWs..."
                    : "Resetting all data...";
            setResetStatus(action);

            const url = filter
                ? `/api/admin/reset-dashboard?filter=${filter}`
                : "/api/admin/reset-dashboard";
            const res = await fetch(url, {
                method: "POST",
                headers: { "x-admin-key": adminKey },
            });
            const data = await res.json();
            if (!res.ok) {
                setResetStatus(`Failed: ${data?.error || res.statusText}`);
                return;
            }

            const msg =
                filter === "test"
                    ? `✅ Deleted ${data.test_sows_deleted || 0} test SOWs. Refresh dashboard.`
                    : "✅ Dashboard data cleared. Refresh dashboard.";
            setResetStatus(msg);
        } catch (e: any) {
            setResetStatus(`Error: ${e?.message || "Unknown error"}`);
        }
    };

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <div className="bg-black border-b border-[#1FE18E]/20 shadow-lg">
                <div className="max-w-7xl mx-auto px-8 py-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#1FE18E]/20 rounded-lg">
                            <Settings className="h-8 w-8 text-[#1FE18E]" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white">
                                Admin Dashboard
                            </h1>
                            <p className="text-gray-500 mt-2">
                                Manage your application settings, services, and
                                users
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-12">
                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {/* Services Card */}
                    <Link href="/admin/services">
                        <div className="bg-zinc-900 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 p-8 cursor-pointer border border-[#1FE18E]/20 hover:border-[#1FE18E]/50 group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-[#1FE18E]/20 rounded-lg group-hover:bg-[#1FE18E]/30 transition-colors">
                                    <Package className="h-6 w-6 text-[#1FE18E]" />
                                </div>
                                <span className="text-xs font-semibold text-[#1FE18E] bg-[#1FE18E]/10 px-3 py-1 rounded-full">
                                    Active
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Services
                            </h2>
                            <p className="text-gray-500 mb-6">
                                Manage service catalog, pricing, and categories
                            </p>
                            <div className="flex items-center gap-2 text-[#1FE18E] font-medium group-hover:gap-3 transition-all">
                                <span>View Services</span>
                                <span className="group-hover:translate-x-1 transition-transform">
                                    →
                                </span>
                            </div>
                        </div>
                    </Link>

                    {/* Settings Card */}
                    <Link href="/admin/settings">
                        <div className="bg-zinc-900 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 p-8 cursor-pointer border border-[#1FE18E]/20 hover:border-[#1FE18E]/50 group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-[#1FE18E]/20 rounded-lg group-hover:bg-[#1FE18E]/30 transition-colors">
                                    <Settings className="h-6 w-6 text-[#1FE18E]" />
                                </div>
                                <span className="text-xs font-semibold text-[#1FE18E] bg-[#1FE18E]/10 px-3 py-1 rounded-full">
                                    Active
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                AI Settings
                            </h2>
                            <p className="text-gray-500 mb-6">
                                Configure AI models for sidebar chat and inline
                                editor
                            </p>
                            <div className="flex items-center gap-2 text-[#1FE18E] font-medium group-hover:gap-3 transition-all">
                                <span>Manage Settings</span>
                                <span className="group-hover:translate-x-1 transition-transform">
                                    →
                                </span>
                            </div>
                        </div>
                    </Link>

                    {/* Rate Card Management */}
                    <Link href="/admin/rate-card">
                        <div className="bg-zinc-900 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 p-8 cursor-pointer border border-[#1FE18E]/20 hover:border-[#1FE18E]/50 group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-[#1FE18E]/20 rounded-lg group-hover:bg-[#1FE18E]/30 transition-colors">
                                    <DollarSign className="h-6 w-6 text-[#1FE18E]" />
                                </div>
                                <span className="text-xs font-semibold text-[#1FE18E] bg-[#1FE18E]/10 px-3 py-1 rounded-full">
                                    New
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Rate Card
                            </h2>
                            <p className="text-gray-500 mb-6">
                                Manage global rate card - single source of truth
                                for roles and rates
                            </p>
                            <div className="flex items-center gap-2 text-[#1FE18E] font-medium group-hover:gap-3 transition-all">
                                <span>Manage Rates</span>
                                <span className="group-hover:translate-x-1 transition-transform">
                                    →
                                </span>
                            </div>
                        </div>
                    </Link>

                    {/* Users Card (Coming Soon) */}
                    <div className="bg-zinc-950 rounded-lg shadow-lg p-8 border border-gray-800/50 opacity-60 cursor-not-allowed">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-gray-900 rounded-lg">
                                <Users className="h-6 w-6 text-gray-600" />
                            </div>
                            <span className="text-xs font-semibold text-gray-600 bg-gray-900 px-3 py-1 rounded-full">
                                Coming
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-500 mb-2">
                            Users
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Manage user accounts and permissions
                        </p>
                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                            <span>Coming Soon</span>
                            <span>→</span>
                        </div>
                    </div>

                    {/* Analytics Card (Coming Soon) */}
                    <div className="bg-zinc-950 rounded-lg shadow-lg p-8 border border-gray-800/50 opacity-60 cursor-not-allowed">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-gray-900 rounded-lg">
                                <BarChart3 className="h-6 w-6 text-gray-600" />
                            </div>
                            <span className="text-xs font-semibold text-gray-600 bg-gray-900 px-3 py-1 rounded-full">
                                Coming
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-500 mb-2">
                            Analytics
                        </h2>
                        <p className="text-gray-600 mb-6">
                            View system analytics and performance reports
                        </p>
                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                            <span>Coming Soon</span>
                            <span>→</span>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="grid grid-cols-1 gap-6 mb-12">
                    <div className="bg-zinc-900 rounded-lg border border-red-500/30 p-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold text-white">
                                Danger Zone
                            </h3>
                            <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-3 py-1 rounded-full">
                                Destructive
                            </span>
                        </div>
                        <p className="text-gray-400 mb-4">
                            Reset the SOW Dashboard analytics by deleting all
                            SOWs and related activity in the database. This does
                            not touch AnythingLLM workspaces.
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <input
                                type="password"
                                placeholder="Enter ADMIN_API_KEY"
                                value={adminKey}
                                onChange={(e) => setAdminKey(e.target.value)}
                                className="w-full sm:w-80 px-4 py-2 border border-[#1FE18E]/20 bg-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1FE18E] text-white placeholder-gray-600"
                            />
                            <button
                                onClick={() => handleResetDashboard("test")}
                                className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white whitespace-nowrap"
                            >
                                Delete Test SOWs
                            </button>
                            <button
                                onClick={() => handleResetDashboard()}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white whitespace-nowrap"
                            >
                                Reset All Data
                            </button>
                        </div>
                        {resetStatus && (
                            <p className="mt-3 text-sm text-gray-400">
                                {resetStatus}
                            </p>
                        )}
                    </div>
                </div>

                {/* Suggested Features Section */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-zinc-900 rounded-lg border border-[#1FE18E]/20 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Lightbulb className="h-6 w-6 text-[#1FE18E]" />
                            <h3 className="text-2xl font-bold text-white">
                                Roadmap
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-lg font-semibold text-[#1FE18E] mb-4">
                                    Essential Features
                                </h4>
                                <ul className="space-y-3 text-gray-400">
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#1FE18E] mt-1">
                                            •
                                        </span>
                                        <span>
                                            <strong>User Management:</strong>{" "}
                                            Create, edit, delete users.
                                            Role-based access control (Admin,
                                            Editor, Viewer)
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#1FE18E] mt-1">
                                            •
                                        </span>
                                        <span>
                                            <strong>
                                                Analytics Dashboard:
                                            </strong>{" "}
                                            Track SOW generation stats, user
                                            activity, API usage metrics
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#1FE18E] mt-1">
                                            •
                                        </span>
                                        <span>
                                            <strong>System Logs:</strong> View
                                            action history, API calls, errors,
                                            and audit trail
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#1FE18E] mt-1">
                                            •
                                        </span>
                                        <span>
                                            <strong>API Key Management:</strong>{" "}
                                            Create, rotate, and revoke API keys
                                            for integrations
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#1FE18E] mt-1">
                                            •
                                        </span>
                                        <span>
                                            <strong>Email Templates:</strong>{" "}
                                            Customize SOW email templates and
                                            notifications
                                        </span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-[#1FE18E] mb-4">
                                    Cool-to-Have Features
                                </h4>
                                <ul className="space-y-3 text-gray-400">
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#1FE18E] mt-1">
                                            •
                                        </span>
                                        <span>
                                            <strong>Custom Branding:</strong>{" "}
                                            Upload logos, set colors, customize
                                            templates
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#1FE18E] mt-1">
                                            •
                                        </span>
                                        <span>
                                            <strong>Integration Hub:</strong>{" "}
                                            Connect with Slack, Zapier, HubSpot,
                                            Salesforce
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#1FE18E] mt-1">
                                            •
                                        </span>
                                        <span>
                                            <strong>Export/Import:</strong> Bulk
                                            upload services, templates, or
                                            configurations
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#1FE18E] mt-1">
                                            •
                                        </span>
                                        <span>
                                            <strong>
                                                Advanced Permissions:
                                            </strong>{" "}
                                            Workspace roles, department access,
                                            client limits
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#1FE18E] mt-1">
                                            •
                                        </span>
                                        <span>
                                            <strong>AI Model Switching:</strong>{" "}
                                            Allow per-user model preferences,
                                            usage limits
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
