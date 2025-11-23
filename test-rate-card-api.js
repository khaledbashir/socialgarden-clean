// Test script to verify rate card API endpoint
const fetch = require('node-fetch');

async function testRateCardAPI() {
    console.log('Testing Rate Card API endpoint...');
    
    try {
        // Test the rate card markdown endpoint
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                       process.env.NEXT_PUBLIC_APP_URL || 
                       'http://localhost:3000';
        
        console.log(`Fetching from: ${baseUrl}/api/rate-card/markdown`);
        
        const response = await fetch(`${baseUrl}/api/rate-card/markdown`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            return;
        }
        
        const data = await response.json();
        
        console.log('\n=== API RESPONSE ===');
        console.log('Success:', data.success);
        console.log('Version:', data.version);
        console.log('Role count:', data.roleCount);
        console.log('Markdown length:', data.markdown ? data.markdown.length : 0);
        
        if (data.markdown) {
            console.log('\n=== FIRST 500 CHARS OF MARKDOWN ===');
            console.log(data.markdown.substring(0, 500));
            console.log('...\n');
            
            // Check if it contains the expected header
            if (data.markdown.includes('[OFFICIAL_RATE_CARD_SOURCE_OF_TRUTH]') || 
                data.markdown.includes('Social Garden - Official Rate Card')) {
                console.log('✅ Rate card markdown appears to be valid');
            } else {
                console.log('❌ Rate card markdown does not contain expected content');
            }
        } else {
            console.log('❌ No markdown in response');
        }
        
    } catch (error) {
        console.error('❌ Error testing rate card API:', error);
    }
}

testRateCardAPI();