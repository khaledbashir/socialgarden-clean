'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues with @react-pdf/renderer
const SOWPdfExportExample = dynamic(
  () => import('@/components/sow/SOWPdfExportExample'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading PDF Export Demo...</p>
        </div>
      </div>
    )
  }
);

/**
 * Demo page for testing the new SOW PDF Export functionality
 * Navigate to /sow-pdf-demo to see it in action
 */
export default function SOWPdfDemoPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              📄 SOW PDF Export Demo
            </h1>
            <p className="text-gray-600 text-lg">
              Test the new Statement of Work PDF generation system
            </p>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Branch:</strong> feature/sow-pdf-export | 
                  <strong className="ml-2">Status:</strong> Ready to test | 
                  <strong className="ml-2">Package:</strong> @react-pdf/renderer v4.3.1
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* The actual demo component */}
        <SOWPdfExportExample />

        {/* Quick reference card */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">🚀 Quick Start</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">1. Import the component</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`import { SOWPdfExportWrapper } from '@/components/sow';
import type { SOWData } from '@/components/sow';`}
              </pre>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">2. Use in your page</h3>
              <pre className="bg-gray-900 text-blue-400 p-4 rounded overflow-x-auto text-sm">
{`const mySOWData: SOWData = { /* your data */ };

<SOWPdfExportWrapper 
  sowData={mySOWData} 
  fileName="My-SOW.pdf" 
/>`}
              </pre>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">3. Documentation</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  📖 <strong>Quick Start:</strong> <code className="bg-gray-100 px-2 py-1 rounded">frontend/components/sow/QUICKSTART.md</code>
                </p>
                <p className="text-sm">
                  📚 <strong>Full Docs:</strong> <code className="bg-gray-100 px-2 py-1 rounded">frontend/components/sow/README-SOW-PDF.md</code>
                </p>
                <p className="text-sm">
                  💻 <strong>Example Code:</strong> <code className="bg-gray-100 px-2 py-1 rounded">frontend/components/sow/SOWPdfExportExample.tsx</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="font-bold text-lg mb-2">Professional Layout</h3>
            <p className="text-gray-600 text-sm">
              Matches BBUBU format with colored headers, structured tables, and clear sections
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-bold text-lg mb-2">Auto Calculations</h3>
            <p className="text-gray-600 text-sm">
              Automatic totals, hours, and summary tables - just provide the data
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-3">🔧</div>
            <h3 className="font-bold text-lg mb-2">Fully Typed</h3>
            <p className="text-gray-600 text-sm">
              Complete TypeScript support with interfaces and type safety
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-3">📦</div>
            <h3 className="font-bold text-lg mb-2">Modular Design</h3>
            <p className="text-gray-600 text-sm">
              Separated components, types, and utilities for easy maintenance
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="font-bold text-lg mb-2">Customizable</h3>
            <p className="text-gray-600 text-sm">
              Easy to modify colors, fonts, and layout to match your brand
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-bold text-lg mb-2">Zero Impact</h3>
            <p className="text-gray-600 text-sm">
              Completely separate from existing PDF exports - no conflicts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
