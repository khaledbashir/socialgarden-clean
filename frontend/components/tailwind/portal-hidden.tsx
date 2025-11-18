"use client";

export default function PortalHidden() {
    return (
        <div className="flex items-center justify-center h-full py-24">
            <div className="text-center">
                <p className="text-gray-400">This Client Portal is currently hidden.</p>
                <p className="text-gray-300 mt-2">Toggle it on in the feature flags to view the portal.</p>
            </div>
        </div>
    );
}
