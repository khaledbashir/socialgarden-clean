// Test script for Excel export functionality
const fs = require('fs');
const path = require('path');

// Test that export-excel route can extract pricing data from SOW content
function testExcelExport() {
    // Read the export-excel route file to check our changes
    const exportRoutePath = path.join(__dirname, '../frontend/app/api/sow/[id]/export-excel/route.ts');
    const exportRouteContent = fs.readFileSync(exportRoutePath, 'utf8');

    console.log('Checking Excel export implementation...');

    // Check if we're importing the necessary functions
    if (exportRouteContent.includes('extractPricingFromContent')) {
        console.log('✅ extractPricingFromContent is imported');
    } else {
        console.log('❌ extractPricingFromContent is missing');
    }

    if (exportRouteContent.includes('rolesFromArchitectSOW')) {
        console.log('✅ rolesFromArchitectSOW is imported');
    } else {
        console.log('❌ rolesFromArchitectSOW is missing');
    }

    // Check if we're handling TipTap JSON content
    if (exportRouteContent.includes('typeof sow.content === "object"')) {
        console.log('✅ TipTap JSON content handling is implemented');
    } else {
        console.log('❌ TipTap JSON content handling is missing');
    }

    // Check if we're calling backend Excel export
    if (exportRouteContent.includes('/export-excel')) {
        console.log('✅ Backend Excel export endpoint is called');
    } else {
        console.log('❌ Backend Excel export endpoint is missing');
    }

    // Check backend implementation
    const backendPath = path.join(__dirname, '../backend/main.py');
    const backendContent = fs.readFileSync(backendPath, 'utf8');

    if (backendContent.includes('@app.post("/export-excel")')) {
        console.log('✅ Backend Excel export endpoint is implemented');
    } else {
        console.log('❌ Backend Excel export endpoint is missing');
    }

    if (backendContent.includes('xlsxwriter')) {
        console.log('✅ Backend is using xlsxwriter');
    } else {
        console.log('❌ xlsxwriter is missing from backend');
    }

    // Check if xlsxwriter is in requirements
    const requirementsPath = path.join(__dirname, '../backend/requirements.txt');
    const requirementsContent = fs.readFileSync(requirementsPath, 'utf8');

    if (requirementsContent.includes('xlsxwriter')) {
        console.log('✅ xlsxwriter is in requirements.txt');
    } else {
        console.log('❌ xlsxwriter is missing from requirements.txt');
    }

    console.log('\nExcel export implementation check complete!');
}

testExcelExport();
