'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Page Error caught:', error);

        if (error.message && (error.message.includes('Loading chunk') || error.name === 'ChunkLoadError')) {
            window.location.reload();
        }
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
            <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
            <p className="mb-4 text-gray-500 text-sm">
                {error.message || "An unexpected error occurred"}
            </p>
            <button
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                onClick={() => reset()}
            >
                Try again
            </button>
        </div>
    );
}
