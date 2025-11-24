'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global Error caught:', error);

        // Automatically reload on ChunkLoadError
        // This happens when a new version is deployed and the user's browser 
        // tries to fetch old chunks that no longer exist
        if (error.message && (error.message.includes('Loading chunk') || error.name === 'ChunkLoadError')) {
            console.log('ChunkLoadError detected, reloading page...');
            window.location.reload();
        }
    }, [error]);

    return (
        <html>
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center font-sans">
                    <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
                    <p className="mb-6 text-gray-600 max-w-md">
                        {error.message?.includes('Loading chunk')
                            ? 'We updated the application. The page is reloading...'
                            : 'An unexpected error occurred. Please try again.'}
                    </p>
                    <button
                        className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                        onClick={() => reset()}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
