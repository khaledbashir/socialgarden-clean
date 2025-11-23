import React from 'react';
import SOWPdfExportWrapper from './SOWPdfExportWrapper';
import { SOWData } from './types';

/**
 * Example component demonstrating how to use the SOW PDF Export
 * This shows the complete data structure needed for the PDF generation
 */
const SOWPdfExportExample: React.FC = () => {
  // Sample SOW data matching the "BBUBU" format
  const sampleSOWData: SOWData = {
    company: {
      name: 'Social Garden',
      logoUrl: '/logo.png', // Update with your actual logo path or URL
    },
    clientName: 'BBUBU',
    projectTitle: 'HubSpot Integration and Custom Landing Page Development',
    projectSubtitle: 'ADVISORY & CONSULTATION | SERVICES',
    projectOverview:
      'This project will deliver seamless HubSpot integration and the development of three custom landing pages. The integration will enable the client to leverage HubSpot\'s powerful CRM and marketing automation capabilities, while the landing pages will be designed to drive conversions and capture leads effectively. The project includes setup, configuration, design, development, and testing to ensure a smooth deployment.',
    budgetNotes:
      'Total investment: $6,930 over 4-6 weeks. Payment terms: 50% upfront, 50% upon completion. Any additional scope changes will be quoted separately. All prices are in USD and GST applicable.',
    scopes: [
      {
        id: 1,
        title: 'HubSpot Integration Setup',
        description:
          'This scope covers the initial configuration and integration of HubSpot with your existing systems. It includes account setup, CRM configuration, form integration, tracking code implementation, and basic workflow automation.',
        items: [
          {
            description:
              'Handle HubSpot setup, workflow configuration, and integration testing.',
            role: 'Tech - Specialist - Integration Configuration',
            hours: 21,
            cost: 3780,
          },
          {
            description:
              'Coordinate setup, client communications, and milestone reviews.',
            role: 'Project Management - (Account Manager)',
            hours: 11,
            cost: 1980,
          },
        ],
        deliverables: [
          'HubSpot account setup and basic CRM configuration',
          'Integration of HubSpot forms and tracking code on existing website',
          'Setup of 1-2 automated workflows for lead nurturing',
          'Documentation of HubSpot configuration and user guide',
          'Training session for client team on HubSpot basics',
        ],
        assumptions: [
          'Client will provide access to HubSpot account and existing website',
          'Scope assumes no advanced custom API development',
          'Client will provide content for automated email workflows',
          'Standard HubSpot features will be sufficient (no custom integrations)',
        ],
      },
      {
        id: 2,
        title: 'Development of 3 Custom Landing Pages',
        description:
          'This scope involves designing and building three responsive landing pages optimized for conversion. Each page will be integrated with HubSpot forms and tracking, ensuring seamless lead capture and analytics.',
        items: [
          {
            description:
              'Design, develop, and integrate the three landing pages with HubSpot elements.',
            role: 'Tech - Landing Page - (Onshore)',
            hours: 15,
            cost: 3150,
          },
        ],
        deliverables: [
          'Wireframes and high-fidelity design mockups for 3 landing pages',
          'Full development of responsive landing pages (desktop, tablet, mobile)',
          'Integration with HubSpot forms and tracking pixels',
          'A/B testing setup for key page elements',
          'Performance optimization and cross-browser testing',
        ],
        assumptions: [
          'Client will supply content, branding assets, and imagery',
          'Pages assume standard HTML/CSS/JS build (no complex frameworks)',
          'Design will follow client brand guidelines (to be provided)',
          'Each landing page will have similar structure/complexity',
        ],
      },
    ],
    currency: 'USD',
    gstApplicable: true,
    generatedDate: '9/29/2025',
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">SOW PDF Export Example</h1>
        <p className="text-gray-600">
          This demonstrates the new SOW PDF export functionality matching the BBUBU format.
        </p>
      </div>

      <SOWPdfExportWrapper
        sowData={sampleSOWData}
        fileName="BBUBU-HubSpot-SOW.pdf"
      />

      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4">How to Use:</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">1. Import the component:</h3>
            <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
              <code>{`import SOWPdfExportWrapper from '@/components/sow/SOWPdfExportWrapper';
import { SOWData } from '@/components/sow/SOWPdfExport';`}</code>
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Prepare your SOW data:</h3>
            <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
              <code>{`const mySOWData: SOWData = {
  company: { name: 'Your Company', logoUrl: '/logo.png' },
  clientName: 'Client Name',
  projectTitle: 'Project Title',
  projectSubtitle: 'ADVISORY & CONSULTATION',
  projectOverview: 'Project description...',
  budgetNotes: 'Budget notes...',
  scopes: [/* your scopes */],
  currency: 'USD',
  gstApplicable: true,
  generatedDate: new Date().toLocaleDateString(),
};`}</code>
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Render the component:</h3>
            <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
              <code>{`<SOWPdfExportWrapper 
  sowData={mySOWData} 
  fileName="My-SOW.pdf" 
/>`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOWPdfExportExample;
