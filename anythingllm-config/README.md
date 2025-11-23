# AnythingLLM Z.ai Provider Configuration

## The Problem

When using **Z.ai (or any custom OpenAI-compatible provider)** in AnythingLLM, the settings configured through the web UI are lost after container restarts or redeployments.

### Why This Happens

1. **Native Providers** (Groq, OpenRouter, Anthropic, etc.) read configuration from **environment variables** and are automatically applied on startup.

2. **OpenAI-Compatible Providers** (Z.ai, custom endpoints) must be configured through the **web UI**, and settings are stored in AnythingLLM's **SQLite database**.

3. When you configure Z.ai through "Settings → LLM Preference → OpenAI Compatible", these settings are written to the `system_settings` table in the database.

4. **The issue**: If the database volume isn't properly persisted, or if there are database initialization issues, you lose these settings on restart.

## Current Status

Your AnythingLLM container **DOES** have the volume persisted:
```bash
Volume: ahmad_anything-llm_storage
Path: /var/lib/docker/volumes/ahmad_anything-llm_storage/_data
```

And your environment variables are set:
```env
ZAI_API_BASE_URL=https://api.z.ai/api/coding/paas/v4
ZAI_API_KEY=eb0d4d6e54ab4258aac5f5d17a7a01a4.FEf31FrtkMWWRN4Z
ZAI_MODEL_PREF=glm-4.6
```

However, **AnythingLLM doesn't read these Z.ai-specific variables** because it's not a recognized native provider.

## Solutions

### Option 1: Use the Database Configuration Script (Recommended)

This script directly writes the Z.ai configuration to AnythingLLM's database:

```bash
# Make the script executable
chmod +x anythingllm-config/setup-zai-provider.sh

# Run the script (requires root/sudo to access Docker volumes)
sudo ./anythingllm-config/setup-zai-provider.sh

# Restart AnythingLLM container
docker restart ahmad_anything-llm.1.uhiet96dgklnuno4s1jaewraf
```

**What it does:**
- Creates a backup of the database
- Inserts/updates the `system_settings` table with Z.ai configuration
- Persists settings so they survive restarts

### Option 2: Use the API Configuration Script

This script uses AnythingLLM's API to configure the provider (safer method):

```bash
# Set your AnythingLLM API key
export ANYTHINGLLM_API_KEY="your-api-key-here"
export ANYTHINGLLM_URL="http://localhost:3001"

# Make the script executable
chmod +x anythingllm-config/setup-zai-via-api.sh

# Run the script
./anythingllm-config/setup-zai-via-api.sh
```

**What it does:**
- Uses AnythingLLM's official API endpoints
- Configures Z.ai as OpenAI-compatible provider
- Respects AnythingLLM's internal validation and logic

### Option 3: Manual Configuration (Current Method)

Continue configuring through the UI, but **verify database persistence**:

1. Configure Z.ai through the web UI
2. Verify settings are saved:
   ```bash
   docker exec ahmad_anything-llm.1.uhiet96dgklnuno4s1jaewraf \
     sqlite3 /app/server/storage/anythingllm.db \
     "SELECT label, value FROM system_settings WHERE label LIKE '%Generic%' OR label = 'llm_provider';"
   ```
3. Check that the volume is mounted correctly:
   ```bash
   docker inspect ahmad_anything-llm.1.uhiet96dgklnuno4s1jaewraf | grep -A 5 Mounts
   ```

## Verifying Configuration

After applying any solution, verify the settings:

### Check Database Directly
```bash
docker exec ahmad_anything-llm.1.uhiet96dgklnuno4s1jaewraf \
  sqlite3 /app/server/storage/anythingllm.db \
  "SELECT label, value FROM system_settings WHERE label IN ('llm_provider', 'GenericOpenAiBasePath', 'GenericOpenAiKey', 'GenericOpenAiModelPref');"
```

Expected output:
```
llm_provider|generic-openai
GenericOpenAiBasePath|https://api.z.ai/api/coding/paas/v4
GenericOpenAiKey|eb0d4d6e54ab4258aac5f5d17a7a01a4.FEf31FrtkMWWRN4Z
GenericOpenAiModelPref|glm-4.6
```

### Check via Web UI
1. Navigate to: http://localhost:3001/settings/llm-preference
2. Verify "OpenAI Compatible" is selected
3. Verify Base URL, API Key, and Model are populated

### Test with a Workspace
1. Open any workspace
2. Send a test message
3. Check the response comes from Z.ai (glm-4.6 model)

## Troubleshooting

### Settings Still Lost After Restart

1. **Check volume persistence:**
   ```bash
   ls -lah /var/lib/docker/volumes/ahmad_anything-llm_storage/_data/
   ```
   Should contain: `anythingllm.db`, `lancedb/`, `documents/`

2. **Check database file permissions:**
   ```bash
   docker exec ahmad_anything-llm.1.uhiet96dgklnuno4s1jaewraf \
     ls -lah /app/server/storage/anythingllm.db
   ```
   Should be owned by the `anythingllm` user (UID 1000)

3. **Check for database errors in logs:**
   ```bash
   docker logs ahmad_anything-llm.1.uhiet96dgklnuno4s1jaewraf | grep -i "database\|error"
   ```

### API Script Fails

- Verify AnythingLLM is running: `curl http://localhost:3001/api/ping`
- Check API key is correct: Get it from Settings → API Keys
- Ensure you have admin permissions

### Database Script Fails

- Run with sudo: `sudo ./setup-zai-provider.sh`
- Check SQLite is installed: `sqlite3 --version`
- Verify database path is correct

## Best Practices

1. **Always use one of the automated scripts** instead of manual UI configuration
2. **Run the script after each AnythingLLM upgrade** to ensure settings persist
3. **Keep backups** of the database (scripts create automatic backups)
4. **Document your provider configuration** in your `.env` file even if AnythingLLM doesn't read it

## Alternative: Switch to Native Provider

If Z.ai supports standard OpenAI API format, consider:

1. Using Groq or OpenRouter as proxy
2. Contributing to AnythingLLM to add Z.ai as native provider
3. Using a local LLM with Ollama (already configured in your env)

## Environment Variables Reference

Your current `.env` file has:
```env
# Z.ai Configuration (for reference - not read by AnythingLLM)
ZAI_API_BASE_URL="https://api.z.ai/api/coding/paas/v4"
ZAI_API_KEY="eb0d4d6e54ab4258aac5f5d17a7a01a4.FEf31FrtkMWWRN4Z"
ZAI_MODEL_PREF="glm-4.6"

# Active LLM Provider (AnythingLLM reads this)
LLM_PROVIDER="groq"  # Change this after running script
```

After running the configuration script, you might want to update:
```env
LLM_PROVIDER="generic-openai"
```

But note: **This won't work for Z.ai** - you must use one of the solutions above.

## Support

If issues persist:
1. Check AnythingLLM logs: `docker logs -f ahmad_anything-llm.1.uhiet96dgklnuno4s1jaewraf`
2. Verify Z.ai API is accessible: `curl -H "Authorization: Bearer YOUR_KEY" https://api.z.ai/api/coding/paas/v4/models`
3. Contact AnythingLLM support or open an issue about adding Z.ai as native provider