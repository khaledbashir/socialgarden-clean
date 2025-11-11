# EasyPanel Environment Variables Setup

## Required Environment Variables for EasyPanel Deployment

Since your backend and frontend are deployed on EasyPanel, you need to set these environment variables in your EasyPanel deployment interface.

## Database Configuration
```bash
DB_HOST=168.231.115.219
DB_USER=sg_sow_user
DB_PASSWORD=SG_sow_2025_SecurePass!
DB_NAME=socialgarden_sow
DB_PORT=3306
```

## AnythingLLM Integration
```bash
ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA
```

## OpenAI / OpenRouter API (for AI features)
```bash
# Get OpenRouter key at: https://openrouter.ai/keys
OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
# Or use OpenAI directly: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_actual_openai_api_key_here
```

## Application URLs (EasyPanel specific)
```bash
# These should point to your EasyPanel deployment URLs
NEXT_PUBLIC_BASE_URL=https://your-frontend-url.easypanel.host
NEXT_PUBLIC_API_URL=https://your-backend-url.easypanel.host
FRONTEND_PORT=3000  # or whatever port EasyPanel assigns
```

## EasyPanel Setup Steps

### 1. Frontend Environment Variables
In EasyPanel dashboard:
1. Go to your frontend application
2. Find "Environment Variables" or "Environment" section
3. Add the above variables

### 2. Backend Environment Variables  
In EasyPanel dashboard:
1. Go to your backend application
2. Find "Environment Variables" or "Environment" section
3. Add the above variables

### 3. Update URLs
Make sure to update:
- `NEXT_PUBLIC_BASE_URL` to your actual frontend EasyPanel URL
- `NEXT_PUBLIC_API_URL` to your actual backend EasyPanel URL

### 4. Restart Services
After setting environment variables:
1. Restart both frontend and backend services
2. Check logs to ensure they pick up the new variables

## Testing the Fix

Once environment variables are set, test the AI generation:

1. Open your frontend application in browser
2. Try to generate a new SOW
3. Check browser console for any errors
4. Check backend logs for authentication issues

## Common Issues

### "AnythingLLM is not configured" Error
This means the backend can't read the environment variables. Check:
- Variables are spelled correctly
- Variables are set in the correct service (backend)
- Service has been restarted after adding variables

### Workspace/Thread Routing Issues
If you see workspace routing errors:
- Verify workspace slug exists in AnythingLLM
- Check thread slug format (UUID)
- Ensure proper permissions in AnythingLLM

### Empty AI Responses
If AI returns empty content:
- Check AnythingLLM workspace has proper system prompt
- Verify LLM provider is configured in AnythingLLM
- Check rate limits or API quotas

## Production vs Development URLs

Development:
```bash
NEXT_PUBLIC_BASE_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

EasyPanel Production:
```bash
NEXT_PUBLIC_BASE_URL=https://your-app.easypanel.host
NEXT_PUBLIC_API_URL=https://your-backend.easypanel.host
```

## Quick Verification Command

You can test environment variables by accessing:
```
https://your-backend-url.easypanel.host/api/health
```

This should return OK if backend is configured correctly.
