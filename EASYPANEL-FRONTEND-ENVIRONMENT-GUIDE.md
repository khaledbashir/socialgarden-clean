# Frontend Environment Variables for EasyPanel

Since you need to add environment variables one by one in EasyPanel, here's exactly what to put in your frontend service:

## Frontend Environment Variables

Add these to your **frontend** service in EasyPanel:

```bash
# Database Connection
DB_HOST=ahmad-mysql-database
DB_USER=sg_sow_user
DB_PASSWORD=SG_sow_2025_SecurePass!
DB_NAME=socialgarden_sow
DB_PORT=3306

# AnythingLLM Integration
NEXT_PUBLIC_ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host

# Application URLs
NEXT_PUBLIC_BASE_URL=https://sow.qandu.me
NEXT_PUBLIC_API_URL=https://sow.qandu.me

# PDF Service
NEXT_PUBLIC_PDF_SERVICE_URL=https://ahmad-socialgarden-backend.840tjq.easypanel.host

# AI Provider Configuration (choose one)
OPENROUTER_API_KEY=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
OPENROUTER_MODEL_PREF=moonshotai/kimi-k2-instruct

# OR Alternative AI Provider
ZAI_API_KEY=eb0d4d6e54ab4258aac5f5d17a7a01a4.FEf31FrtkMWWRN4Z
ZAI_MODEL_PREF=glm-4.6
```

## EasyPanel Steps

### 1. Access Your Frontend Service
1. Log in to your EasyPanel dashboard
2. Go to your frontend application/service
3. Find "Environment Variables" or "Environment" section
4. Add each variable one by one

### 2. Variable Addition Process
For each variable:
1. Click "Add Variable" or "+ Add" button
2. Enter the **exact** name and value from above
3. Save/Apply the variable
4. Repeat for all variables

### 3. Critical Variables to Add First
These are the most important for basic functionality:
1. `DB_HOST` - Database connection
2. `DB_USER` - Database user
3. `DB_PASSWORD` - Database password
4. `DB_NAME` - Database name
5. `NEXT_PUBLIC_BASE_URL` - Frontend URL
6. `NEXT_PUBLIC_ANYTHINGLLM_URL` - AnythingLLM connection

### 4. AI Provider Variables
Add only **one** of these:
- `OPENROUTER_API_KEY` (if using OpenRouter)
- `ZAI_API_KEY` (if using Z.ai)

### 5. Optional Variables
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_PDF_SERVICE_URL` - PDF service URL
- `OPENROUTER_MODEL_PREF` - AI model preference
- `ZAI_MODEL_PREF` - AI model preference

### 6. Apply and Restart
1. After adding all variables, click "Apply" or "Deploy"
2. Wait for the service to restart
3. The application should pick up the new environment variables

## Verification

After setting variables, test by:
1. Opening https://sow.qandu.me in browser
2. Try to generate a new SOW
3. Check if "Generation Failed" error is resolved

## Troubleshooting

### If Still Getting Errors
1. Check variable names are spelled **exactly** as shown above
2. Ensure no extra spaces or quotes in variable values
3. Verify the service has fully restarted
4. Check EasyPanel logs for any startup errors

### Common Issues
- `NEXT_PUBLIC_BASE_URL` missing = Frontend can't connect to backend
- `NEXT_PUBLIC_ANYTHINGLLM_URL` missing = "AnythingLLM not configured" error
- `DB_HOST` incorrect = Database connection errors

## Support

If you need help with EasyPanel:
1. Check EasyPanel documentation
2. Look for environment variable section in your service settings
3. Contact EasyPanel support if the section is not visible

Once all variables are added and the service is restarted, your SOW generator should work correctly!
